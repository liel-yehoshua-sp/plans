#!/usr/bin/env bash
# check-resolved-threads.sh — Mark comments that belong to resolved review threads (REST ids).
# Usage: echo "$COMMENTS_JSON" | ./check-resolved-threads.sh PR_NUMBER
# Input: JSON array of comments on stdin (e.g. raw REST export without GraphQL merge)
# Output: Same JSON array with is_resolved updated
# Note: Default fetch-review-comments.sh already returns unresolved-only inline threads; use this
# only for legacy / manual JSON pipelines.

set -euo pipefail

PR_NUMBER="${1:?Usage: echo \$JSON | $0 PR_NUMBER}"

# GraphQL variables do not expand {owner}/{repo} like REST — resolve from current repo (one gh call)
NAME_WITH_OWNER=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null) || {
  echo "ERROR: Could not resolve repository (run \`gh\` from a git repo with a GitHub remote)." >&2
  exit 1
}
OWNER="${NAME_WITH_OWNER%%/*}"
REPO_NAME="${NAME_WITH_OWNER#*/}"

RESOLVED_THREADS='[]'
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
          isResolved
          comments(first: 1) { nodes { databaseId } }
        }
      }
    }
  }
}' \
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
          isResolved
          comments(first: 1) { nodes { databaseId } }
        }
      }
    }
  }
}' \
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

  PAGE=$(
    printf '%s' "$RAW" | jq -c '
      [.data.repository.pullRequest.reviewThreads.nodes[] |
       select(.isResolved) |
       .comments.nodes[0].databaseId]
    '
  )
  RESOLVED_THREADS=$(jq -n --argjson acc "$RESOLVED_THREADS" --argjson page "$PAGE" '$acc + $page')

  HAS_NEXT=$(printf '%s' "$RAW" | jq -r '.data.repository.pullRequest.reviewThreads.pageInfo.hasNextPage // false')
  if [[ "$HAS_NEXT" != "true" ]]; then
    break
  fi
  CURSOR=$(printf '%s' "$RAW" | jq -r '.data.repository.pullRequest.reviewThreads.pageInfo.endCursor // empty')
  if [[ -z "$CURSOR" ]]; then
    break
  fi
done

# Read input and mark resolved (REST comment id matches GraphQL databaseId for review comments)
jq --argjson resolved "$RESOLVED_THREADS" '
  [.[] | . + {is_resolved: (.id as $i | $resolved | index($i) != null)}]
' < /dev/stdin
