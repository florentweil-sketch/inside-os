#!/bin/bash
set -e

find . -name ".DS_Store" -delete
find . -name "__MACOSX" -type d -prune -exec rm -rf {} +
rm -rf node_modules

echo "Repo cleaned."
