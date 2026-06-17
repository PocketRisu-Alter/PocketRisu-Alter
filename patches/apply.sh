#!/usr/bin/env bash
#
# apply.sh — apply the PocketRisu-Alter modular patch set on top of an upstream tree.
#
# The patches were generated as a disjoint partition of every file changed
# between the upstream base and the
# ported HEAD. Applying ALL of them on a clean upstream checkout reproduces the tree
# byte-for-byte. Each module touches a non-overlapping set of files, so you can
# also apply only the modules you want.
#
# Usage:
#   ./patches/apply.sh                 # apply every module, in order
#   ./patches/apply.sh 01 03 06        # apply only the listed modules (by number prefix)
#   THREEWAY=0 ./patches/apply.sh      # use plain `git apply` instead of 3-way merge
#
# On a moved upstream, 3-way merge (the default) gives the best chance of a
# clean apply and leaves standard conflict markers where it cannot.

set -uo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
THREEWAY="${THREEWAY:-1}"

# Resolve which patches to apply
shopt -s nullglob
if [ "$#" -gt 0 ]; then
  selected=()
  for n in "$@"; do
    match=("$DIR"/"$n"-*.patch)
    if [ "${#match[@]}" -eq 0 ]; then
      echo "!! no patch matching prefix '$n'"; exit 2
    fi
    selected+=("${match[@]}")
  done
else
  selected=("$DIR"/[0-9][0-9]-*.patch)
fi

if [ "$THREEWAY" = "1" ]; then
  APPLY=(git apply --3way --whitespace=nowarn)
else
  APPLY=(git apply --whitespace=nowarn)
fi

fail=0
for p in "${selected[@]}"; do
  name="$(basename "$p")"
  if "${APPLY[@]}" "$p"; then
    echo "  ✓ applied  $name"
  else
    echo "  ✗ FAILED   $name (resolve conflicts, then re-run remaining modules)"
    fail=1
    break
  fi
done

exit "$fail"
