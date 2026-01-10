#!/bin/bash

echo "🔄 Auto-tracking changes..."
git add -A

# Check if there are changes to commit
if git diff --cached --quiet; then
    echo "✅ No changes to commit"
else
    echo "📝 Changes detected. Auto-committing..."
    git commit -m "Auto-commit: $(date '+%Y-%m-%d %H:%M:%S') - Website updates"
    echo "🚀 Pushing to GitHub..."
    git push origin main
    echo "✅ Changes pushed successfully!"
fi
