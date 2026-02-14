#!/bin/bash
# ============================================================
# ChurnSenseAI - Hostinger Deploy Script
# Creates a deploy.zip with only the website files (~800 KB)
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

ZIP_FILE="deploy.zip"

# Remove old zip if it exists
rm -f "$ZIP_FILE"

# Zip only the website files (exclude ML project, git, config with API key)
zip -r "$ZIP_FILE" \
    .htaccess \
    index.html \
    css/ \
    js/ \
    api/gemini-chat.php \
    assets/images/ \
    -x "*.DS_Store"

echo ""
echo "========================================="
echo "  deploy.zip created successfully!"
echo "========================================="
echo ""
echo "Contents:"
unzip -l "$ZIP_FILE"
echo ""
echo "Size: $(du -h "$ZIP_FILE" | cut -f1)"
echo ""
echo "Next steps:"
echo "  1. Upload deploy.zip to Hostinger File Manager -> public_html/"
echo "  2. Extract it there"
echo "  3. Create api/config.php on the server with your Gemini API key:"
echo '     <?php define("GEMINI_API_KEY", "your-key-here");'
echo ""
