# Discord Sama

A serverless Discord bot running on AWS Lambda, deployed with Terraform and GitHub Actions.

Interactions flow through an HTTP API Gateway endpoint into a Lambda function. There is no always-on process — you only pay when commands are actually invoked (effectively free at low volume).

---

## Structure

```
discord-sama/
├── lambda/
│   ├── index.mjs                  # Lambda handler — signature verification + command routing
│   └── package.json               # Runtime dependencies
├── scripts/
│   └── register-commands.mjs      # One-shot script to register slash commands with Discord
├── terraform/
│   ├── bootstrap/
│   │   └── main.tf                # Creates S3 bucket, DynamoDB table, and GitHub Actions IAM role
│   ├── main.tf                    # Core infra: Lambda, IAM role, HTTP API Gateway
│   ├── providers.tf               # AWS + archive providers, S3 remote backend declaration
│   ├── variables.tf               # Input variables (region, project name, secrets)
│   └── outputs.tf                 # Prints the Interactions Endpoint URL after deploy
└── .github/workflows/
    └── deploy.yml                 # CI: install deps → terraform apply → register commands
```

### Available commands

| Command | Options | Description |
|---|---|---|
| `/hello` | — | Greets the user |
| `/remind` | `action: list` | Displays all reminders of the caller |

### Request flow

```
User types a slash command in Discord
        │
        ▼
Discord POSTs to API Gateway  (POST /discord)
        │
        ▼
Lambda verifies Ed25519 signature
        │
        ▼
Lambda routes the command and returns a JSON response
        │
        ▼
Discord displays the bot reply in the channel
```

---

## Bootstrap (first-time setup)

### 1. Prerequisites

- [Terraform](https://developer.hashicorp.com/terraform/install) ≥ 1.5
- [Node.js](https://nodejs.org) ≥ 20
- AWS CLI configured with credentials that can create IAM, Lambda, API Gateway, S3, and DynamoDB resources
- A Discord application created at [discord.com/developers](https://discord.com/developers/applications)
- A HelloAsso application with OAuth2 credentials

### 2. Create the Terraform state backend

The bootstrap config creates the S3 bucket, DynamoDB lock table, and GitHub Actions IAM role. It uses a local backend so it has no chicken-and-egg dependency.

```bash
cd terraform/bootstrap
terraform init
terraform apply -var="github_repo=your-org/discord-sama"
```

Note the three output values — you will need them in step 3:

```
tf_state_bucket         = "discord-sama-tf-state"
tf_state_lock_table     = "discord-sama-tf-lock"
github_actions_role_arn = "arn:aws:iam::123456789:role/discord-sama-github-actions"
```

### 3. Configure GitHub repository settings

In your GitHub repository go to **Settings → Secrets and variables → Actions**, add the following.

**Secrets:**

| Name | Where to find it |
|---|---|
| `AWS_ROLE_ARN` | `github_actions_role_arn` output from the bootstrap step |
| `DISCORD_PUBLIC_KEY` | Discord Developer Portal → your app → General Information |
| `DISCORD_APP_ID` | Discord Developer Portal → your app → General Information |
| `DISCORD_BOT_TOKEN` | Discord Developer Portal → your app → Bot → Reset Token |

**Variables:**

| Name | Example value |
|---|---|
| `AWS_REGION` | `eu-west-3` |
| `TF_STATE_BUCKET` | `discord-sama-tf-state` (from step 2) |
| `TF_STATE_LOCK_TABLE` | `discord-sama-tf-lock` (from step 2) |

> **IAM role for GitHub Actions**
> The CI workflow uses OIDC — no long-lived access keys are stored in GitHub. The role and its OIDC trust policy are created automatically by the bootstrap step above.

### 4. Run the first deployment

Push to `main` (or trigger the workflow manually via **Actions → Deploy → Run workflow**). The workflow will:

1. Install Lambda runtime dependencies
2. Run `terraform apply` to create all AWS resources
3. Register slash commands with Discord
4. Print the **Interactions Endpoint URL**

### 5. Register the endpoint with Discord

Copy the URL printed at the end of the workflow run and paste it into:

**Discord Developer Portal → your app → General Information → Interactions Endpoint URL**

Click **Save Changes**. Discord will send a `PING` to verify the endpoint before accepting it.

---

## Deploying an update

### Updating bot logic

Edit a file, commit, and push to `main`. The CI workflow runs automatically and redeploys the Lambda function with the new code.

### Adding a new slash command

1. Add the command handler inside the `APPLICATION_COMMAND` block in [lambda/index.mjs](lambda/index.mjs).
2. Add the command definition to the `commands` array in [scripts/register-commands.mjs](scripts/register-commands.mjs).
3. Commit and push to `main`.

The CI workflow will deploy the new handler and re-register all commands with Discord in one step. Global command propagation can take up to one hour.

### Updating infrastructure

Edit any file under [terraform/](terraform/), commit, and push to `main`. The workflow runs `terraform plan` followed by `terraform apply` on every push so infrastructure and code are always deployed together.
