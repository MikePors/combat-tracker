# TTRPG Combat Tracker

A Progressive Web App for tracking initiative and combat in tabletop RPGs (D&D 5e, Pathfinder, etc.).

## Features

- **Initiative tracking** – add combatants with initiative rolls (manual or auto-rolled d20 + modifier), auto-sorted
- **HP management** – track current/max HP with a damage/heal panel and visual HP bar
- **Conditions** – toggle all 15 standard D&D 5e conditions per combatant
- **Turn management** – Next/Prev turn buttons, round counter, active combatant highlight
- **Combatant types** – Player (PC), Enemy (NPC), Ally – colour-coded
- **Persistent state** – survives page refresh via `localStorage`
- **PWA** – installable on mobile/desktop, works offline
- **Mobile-first** – designed for phones at the table

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Build

```bash
npm run build   # outputs to dist/
npm run preview # preview the production build locally
```

## AWS deployment

The app deploys as a static site on **S3 + CloudFront** via CloudFormation.

### Prerequisites

- AWS CLI v2 configured (`aws configure`)
- IAM permissions: `cloudformation:*`, `s3:*`, `cloudfront:*`

### Deploy

```bash
# defaults: stack name "ttrpg-combat-tracker", region us-east-1, profile "default"
./deploy/deploy.sh

# custom options
./deploy/deploy.sh --stack-name my-tracker --region eu-west-1 --profile myprofile
```

The script:
1. Runs `npm run build`
2. Creates/updates the CloudFormation stack (S3 bucket + CloudFront distribution)
3. Syncs `dist/` to S3 with correct cache-control headers
4. Invalidates the CloudFront cache

### Custom domain (optional)

1. Create an ACM certificate in **us-east-1** for your domain
2. Deploy with extra parameters in the CloudFormation console or via `aws cloudformation deploy --parameter-overrides`:

```bash
aws cloudformation deploy \
  --stack-name ttrpg-combat-tracker \
  --template-file deploy/cloudformation.yaml \
  --parameter-overrides \
      AppName=ttrpg-combat-tracker \
      CertificateArn=arn:aws:acm:us-east-1:123456789:certificate/abc-123 \
      AliasHostname=combat.example.com
```

### Teardown

```bash
./deploy/teardown.sh
```

## Stack outputs

| Output | Description |
|--------|-------------|
| `BucketName` | S3 bucket name |
| `CloudFrontDomain` | App URL (`https://xxxx.cloudfront.net`) |
| `DistributionId` | CloudFront distribution ID |
