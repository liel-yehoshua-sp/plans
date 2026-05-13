#!/usr/bin/env bash
# post-pr-comment-reply.sh — Post a reply for a PR review comment and optionally resolve the thread.
# Usage:
#   post-pr-comment-reply.sh <PR_NUMBER> <TYPE> <COMMENT_ID> <BODY_FILE> [THREAD_ID]
# TYPE: inline_review | review
#   - inline_review: POST .../pulls/{pr}/comments with in_reply_to=COMMENT_ID (REST review comment id)
#   - review: gh pr comment (timeline body; no threaded reply API for top-level review body)
# THREAD_ID: optional GraphQL PullRequestReviewThread id (from fetch JSON `thread_id`). When set with
#   inline_review, runs resolveReviewThread after a successful reply so the thread is omitted next fetch.
# BODY_FILE: path to UTF-8 file with the reply body (Markdown allowed).
set -euo pipefail

PR_NUMBER="${1:?PR number required}"
TYPE="${2:?TYPE must be inline_review or review}"
COMMENT_ID="${3:?}"
BODY_FILE="${4:?BODY file required}"
THREAD_ID="${5:-}"

if [[ ! -f "$BODY_FILE" ]]; then
  echo "ERROR: Body file not found: $BODY_FILE" >&2
  exit 1
fi

BODY=$(cat "$BODY_FILE")

if [[ "$TYPE" == "inline_review" ]]; then
  jq -n --arg body "$BODY" --argjson id "$COMMENT_ID" \
    '{body: $body, in_reply_to: $id}' |
    gh api "repos/{owner}/{repo}/pulls/${PR_NUMBER}/comments" --method POST --input -
elif [[ "$TYPE" == "review" ]]; then
  gh pr comment "$PR_NUMBER" --body "$BODY"
else
  echo "ERROR: TYPE must be inline_review or review, got: $TYPE" >&2
  exit 1
fi

if [[ "$TYPE" == "inline_review" ]] && [[ -n "$THREAD_ID" ]]; then
  gh api graphql -f query='
mutation($id: ID!) {
  resolveReviewThread(input: { threadId: $id }) {
    thread { isResolved }
  }
}
' -f id="$THREAD_ID" --jq '.data.resolveReviewThread.thread.isResolved' >/dev/null
  echo "Resolved review thread ${THREAD_ID}" >&2
fi
