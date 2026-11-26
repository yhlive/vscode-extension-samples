#!/usr/bin/env bash
set -euo pipefail

kit_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
upstream='https://github.com/microsoft/vscode-extension-samples.git'
commit='d8f5e3eb2d22737e6f5167035e6b7fccdcd97ef4'
start_branch='release-checklist-s2'
destination="${1:-$HOME/Documents/GitHub/release-checklist-session-03}"

if [[ -e "$destination" || -L "$destination" ]]; then
  printf 'Target already exists: %s\nChoose a new directory.\n' "$destination" >&2
  exit 1
fi

command -v git >/dev/null || {
  printf 'Git is required. Install the macOS command line tools first.\n' >&2
  exit 1
}
mkdir -p "$destination"
git -C "$destination" init --quiet
git -C "$destination" remote add origin "$upstream"
git -C "$destination" fetch --no-tags --depth=1 origin "$commit"
git -C "$destination" switch --create "$start_branch" "$commit"
test "$(git -C "$destination" rev-parse HEAD)" = "$commit"

apply_checkpoint() {
  local source_patch="$1"
  local message="$2"
  git -C "$destination" apply --check --index "$source_patch"
  git -C "$destination" apply --index "$source_patch"
  git -C "$destination" -c user.name='Workshop Setup' \
    -c user.email='workshop-setup@example.invalid' -c commit.gpgsign=false \
    commit --quiet -m "$message"
}
apply_checkpoint "$kit_root/checkpoint/01-changelog-diagnostics.patch" 'Add changelog diagnostics'
apply_checkpoint "$kit_root/checkpoint/02-unreleased-quick-fix.patch" 'Add the Unreleased quick fix'
printf '\nRepository: %s\nBranch: %s\nVS Code folder: %s/code-actions-sample\n' \
  "$destination" "$start_branch" "$destination"
