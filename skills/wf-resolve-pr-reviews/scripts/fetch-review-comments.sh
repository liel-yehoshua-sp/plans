#!/usr/bin/env bash
# fetch-review-comments.sh — PR review items that are still open (unresolved inline threads).
# Usage: ./fetch-review-comments.sh [PR_NUMBER] [--include-review-bodies]
# If PR_NUMBER is omitted, auto-detects from current branch.
# --include-review-bodies: also include top-level /pulls/{pr}/reviews bodies (no thread; cannot
#   auto-resolve via GraphQL — use for triage only).
# Output: JSON array to stdout. Each inline row includes thread_id (GraphQL) for resolveReviewThread
# after posting a reply. Rows are unresolved threads only (is_resolved == false).

set -euo pipefail

INCLUDE_REVIEWS=false
POSITIONAL=()
for a in "$@"; do
  case "$a" in
    --include-review-bodies) INCLUDE_REVIEWS=true ;;
    *) POSITIONAL+=("$a") ;;
  esac
done

PR_NUMBER="${POSITIONAL[0]:-}"

if [[ -z "$PR_NUMBER" ]]; then
  PR_NUMBER=$(gh pr view --json number -q '.number' 2>/dev/null) || {
    echo "ERROR: No PR number provided and could not detect from current branch." >&2
    exit 1
  }
fi

echo "Fetching PR #${PR_NUMBER} (unresolved review threads only)..." >&2

NAME_WITH_OWNER=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null) || {
  echo "ERROR: Could not resolve repository (run \`gh\` from a git repo with a GitHub remote)." >&2
  exit 1
}
OWNER="${NAME_WITH_OWNER%%/*}"
REPO_NAME="${NAME_WITH_OWNER#*/}"

TMP_INLINE=$(mktemp)
TMP_REVIEWS=$(mktemp)
TMP_THREADS=$(mktemp)
trap 'rm -f "$TMP_INLINE" "$TMP_REVIEWS" "$TMP_THREADS"' EXIT

# Paginate all review threads (GraphQL)
THREADS_JSON='[]'
CURSOR=""
while true; do
  if [[ -z "$CURSOR" ]]; then
    RAW=$(gh api graphql \
      -f query='
query($owner: String!, $repo: String!, $pr: Int!) {
  repository(owner: $owner, name: $repo) {
    pullRequest(number: $pr) {
      reviewThreads(first: 100) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id
          isResolved
          comments(first: 1) { nodes { databaseId } }
        }
      }
    }
  }
}
' \
      -f owner="$OWNER" \
      -f repo="$REPO_NAME" \
      -F pr="$PR_NUMBER")
  else
    RAW=$(gh api graphql \
      -f query='
query($owner: String!, $repo: String!, $pr: Int!, $after: String!) {
  repository(owner: $owner, name: $repo) {
    pullRequest(number: $pr) {
      reviewThreads(first: 100, after: $after) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id
          isResolved
          comments(first: 1) { nodes { databaseId } }
        }
      }
    }
  }
}
' \
      -f owner="$OWNER" \
      -f repo="$REPO_NAME" \
      -F pr="$PR_NUMBER" \
      -f after="$CURSOR")
  fi

  if ! printf '%s' "$RAW" | jq -e '.data.repository.pullRequest.reviewThreads' >/dev/null 2>&1; then
    echo "ERROR: GitHub GraphQL returned unexpected payload for PR #${PR_NUMBER} (reviewThreads missing)." >&2
    printf '%s\n' "$RAW" >&2
    exit 1
  fi

  NODES=$(printf '%s' "$RAW" | jq -c '.data.repository.pullRequest.reviewThreads.nodes // []')
  THREADS_JSON=$(jq -n --argjson acc "$THREADS_JSON" --argjson nodes "$NODES" '$acc + $nodes')

  HAS_NEXT=$(printf '%s' "$RAW" | jq -r '.data.repository.pullRequest.reviewThreads.pageInfo.hasNextPage // false')
  if [[ "$HAS_NEXT" != "true" ]]; then
    break
  fi
  CURSOR=$(printf '%s' "$RAW" | jq -r '.data.repository.pullRequest.reviewThreads.pageInfo.endCursor // empty')
  if [[ -z "$CURSOR" ]]; then
    break
  fi
done

printf '%s' "$THREADS_JSON" >"$TMP_THREADS"

# REST: all inline comments (merge with thread metadata)
(
  gh api "repos/{owner}/{repo}/pulls/${PR_NUMBER}/comments" \
    --paginate \
    --jq '
      [.[] | {
        id: .id,
        type: "inline_review",
        author: .user.login,
        body: .body,
        submitted_at: .created_at,
        path: .path,
        line: (.line // .original_line),
        diff_hunk: .diff_hunk,
        in_reply_to_id: .in_reply_to_id,
        html_url: .html_url
      }]
    ' 2>/dev/null || printf '[]'
) >"$TMP_INLINE" &

if [[ "$INCLUDE_REVIEWS" == true ]]; then
  (
    gh api "repos/{owner}/{repo}/pulls/${PR_NUMBER}/reviews" \
      --paginate \
      --jq '
        [.[] | select(.body != null and .body != "") | {
          id: .id,
          type: "review",
          author: .user.login,
          state: .state,
          body: .body,
          submitted_at: .submitted_at,
          path: null,
          line: null,
          diff_hunk: null,
          in_reply_to_id: null,
          html_url: .html_url,
          thread_id: null,
          is_resolved: false,
          resolve_after_reply: false
        }]
      ' 2>/dev/null || printf '[]'
  ) >"$TMP_REVIEWS" &
else
  printf '[]' >"$TMP_REVIEWS" &
fi

wait

THREADS_JSON=$(cat "$TMP_THREADS")
INLINE_COMMENTS=$(cat "$TMP_INLINE")
REVIEWS_JSON=$(cat "$TMP_REVIEWS")

if [[ "$INCLUDE_REVIEWS" == true ]]; then
  JQ_INCL='true'
else
  JQ_INCL='false'
fi

# Join inline roots with threads; keep only unresolved; attach thread_id
FINAL_JSON=$(jq -n --argjson threads "$THREADS_JSON" --argjson inline "$INLINE_COMMENTS" --argjson reviews "$REVIEWS_JSON" --argjson incl "$JQ_INCL" '
  ($inline | map(select((.body | length) > 0) | select(.in_reply_to_id == null))) as $roots |
  [
    $roots[] | . as $c |
    ($threads | map(
        select((.comments.nodes | length) > 0 and .comments.nodes[0].databaseId == $c.id)
      ) | .[0]) as $t |
    if $t == null then
      $c + { thread_id: null, is_resolved: false, resolve_after_reply: true }
    else
      $c + {
        thread_id: $t.id,
        is_resolved: $t.isResolved,
        resolve_after_reply: true
      }
    end
  ] |
  map(select(.is_resolved == false)) as $unresolved |
  if $incl then ($unresolved + $reviews) else $unresolved end |
  sort_by(.submitted_at)
')

COMMENT_COUNT=$(printf '%s' "$FINAL_JSON" | jq 'length')
echo "Found ${COMMENT_COUNT} unresolved review item(s)." >&2

printf '%s\n' "$FINAL_JSON"
