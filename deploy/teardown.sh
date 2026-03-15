#!/usr/bin/env bash
# Removes all AWS resources created by deploy.sh
set -euo pipefail

STACK_NAME="${STACK_NAME:-ttrpg-combat-tracker}"
REGION="${AWS_REGION:-us-east-1}"
PROFILE="${AWS_PROFILE:-default}"

while [[ $# -gt 0 ]]; do
  case $1 in
    --stack-name) STACK_NAME="$2"; shift 2 ;;
    --region)     REGION="$2";     shift 2 ;;
    --profile)    PROFILE="$2";    shift 2 ;;
    *) echo "Unknown argument: $1"; exit 1 ;;
  esac
done

AWS="aws --region $REGION --profile $PROFILE"

echo "⚠  This will DELETE the stack '$STACK_NAME' and all its resources."
read -rp "Type the stack name to confirm: " CONFIRM
[ "$CONFIRM" != "$STACK_NAME" ] && echo "Aborted." && exit 1

# Empty bucket first (CloudFormation can't delete non-empty buckets)
BUCKET=$($AWS cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='BucketName'].OutputValue" \
  --output text 2>/dev/null || true)

if [ -n "$BUCKET" ]; then
  echo "▶ Emptying S3 bucket $BUCKET..."
  $AWS s3 rm "s3://$BUCKET" --recursive
fi

echo "▶ Deleting CloudFormation stack..."
$AWS cloudformation delete-stack --stack-name "$STACK_NAME"
$AWS cloudformation wait stack-delete-complete --stack-name "$STACK_NAME"

echo "✓ Stack '$STACK_NAME' deleted."
