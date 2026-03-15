#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# TTRPG Combat Tracker – AWS deployment script
#
# Usage:
#   ./deploy/deploy.sh [--stack-name NAME] [--region REGION] [--profile PROFILE]
#
# Prerequisites:
#   - AWS CLI v2 installed and configured
#   - Node.js & npm (to run the Vite build)
#   - Appropriate IAM permissions (S3, CloudFront, CloudFormation)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── Defaults ─────────────────────────────────────────────────────────────────
STACK_NAME="${STACK_NAME:-ttrpg-combat-tracker}"
REGION="${AWS_REGION:-us-east-1}"
PROFILE="${AWS_PROFILE:-default}"
TEMPLATE="deploy/cloudformation.yaml"

# ── Parse args ───────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case $1 in
    --stack-name) STACK_NAME="$2"; shift 2 ;;
    --region)     REGION="$2";     shift 2 ;;
    --profile)    PROFILE="$2";    shift 2 ;;
    *) echo "Unknown argument: $1"; exit 1 ;;
  esac
done

AWS="aws --region $REGION --profile $PROFILE"

echo "╔══════════════════════════════════════════╗"
echo "║   TTRPG Combat Tracker – AWS Deploy      ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "  Stack:   $STACK_NAME"
echo "  Region:  $REGION"
echo "  Profile: $PROFILE"
echo ""

# ── 1. Build ──────────────────────────────────────────────────────────────────
echo "▶ Building PWA..."
npm ci --silent
npm run build
echo "  Build complete → dist/"
echo ""

# ── 2. Deploy / update CloudFormation stack ───────────────────────────────────
echo "▶ Deploying CloudFormation stack '$STACK_NAME'..."

$AWS cloudformation deploy \
  --stack-name "$STACK_NAME" \
  --template-file "$TEMPLATE" \
  --parameter-overrides AppName="$STACK_NAME" \
  --capabilities CAPABILITY_IAM \
  --no-fail-on-empty-changeset

echo "  Stack deployed."
echo ""

# ── 3. Fetch outputs ──────────────────────────────────────────────────────────
BUCKET=$($AWS cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='BucketName'].OutputValue" \
  --output text)

DIST_ID=$($AWS cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='DistributionId'].OutputValue" \
  --output text)

CF_DOMAIN=$($AWS cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDomain'].OutputValue" \
  --output text)

echo "  Bucket:         $BUCKET"
echo "  Distribution:   $DIST_ID"
echo "  URL:            $CF_DOMAIN"
echo ""

# ── 4. Sync files to S3 ───────────────────────────────────────────────────────
echo "▶ Uploading files to S3..."

# Long-lived cache for hashed assets
$AWS s3 sync dist/ "s3://$BUCKET/" \
  --delete \
  --exclude "index.html" \
  --exclude "sw.js" \
  --exclude "workbox-*.js" \
  --cache-control "public,max-age=31536000,immutable" \
  --metadata-directive REPLACE

# Short-lived cache for entry points and service worker
$AWS s3 cp dist/index.html "s3://$BUCKET/index.html" \
  --cache-control "no-cache,no-store,must-revalidate" \
  --content-type "text/html; charset=utf-8"

# Service worker files must never be cached
for SW_FILE in dist/sw.js dist/workbox-*.js; do
  [ -f "$SW_FILE" ] && $AWS s3 cp "$SW_FILE" "s3://$BUCKET/$(basename $SW_FILE)" \
    --cache-control "no-cache,no-store,must-revalidate" \
    --content-type "application/javascript"
done

echo "  Upload complete."
echo ""

# ── 5. Invalidate CloudFront cache ───────────────────────────────────────────
echo "▶ Invalidating CloudFront cache..."

INVALIDATION_ID=$($AWS cloudfront create-invalidation \
  --distribution-id "$DIST_ID" \
  --paths "/*" \
  --query "Invalidation.Id" \
  --output text)

echo "  Invalidation started: $INVALIDATION_ID"
echo "  (Changes will propagate within ~1 minute)"
echo ""

echo "✓ Deployment complete!"
echo "  App URL: $CF_DOMAIN"
