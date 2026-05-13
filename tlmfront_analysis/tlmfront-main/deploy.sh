#!/bin/bash

# build the project
echo "Building project..."
yarn build

# Note: `next export` is no longer needed. 
# `npm run build` automatically exports to the `out/` folder because `output: "export"` is set in next.config.ts.

# S3 bucket name
BUCKET=thetimelessmoney.com

# CloudFront distribution ID
DISTRIBUTION_ID=E2F4QTW2IDRWIG

echo "Uploading files to S3..."

# 1. Heavily cache Next.js hashed static assets (JS, CSS, Fonts, Images in _next)
aws s3 sync out/_next/ s3://$BUCKET/_next/ \
  --delete \
  --cache-control "public, max-age=31536000, immutable"

# 2. Sync everything else (HTML, TXT payloads, public folder root assets) with NO cache
aws s3 sync out/ s3://$BUCKET/ \
  --delete \
  --cache-control "no-cache, no-store, must-revalidate" \
  --exclude "_next/*"

echo "Invalidating CloudFront cache..."

# Invalidate
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"

echo "Deployment complete."
