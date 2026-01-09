# Keystatic GitHub App Setup Guide

## Local Development Setup

1. Fill in the `.env` file with your GitHub App credentials:
   - Get App ID, Client ID, and Client Secret from: https://github.com/settings/apps/[your-app-name]
   - Generate and download the Private Key (.pem file) from the same page
   - Copy the entire contents of the .pem file (including the BEGIN/END lines) into the `KEYSTATIC_GITHUB_PRIVATE_KEY` variable

## Cloudflare Deployment Setup

### Step 1: Create KV Namespace for Sessions

Keystatic requires Cloudflare KV to store authentication sessions:

1. Go to Cloudflare Dashboard → Workers & Pages → KV
2. Click "Create a namespace"
3. Name it: `SESSION` (exactly as shown)
4. Copy the namespace ID that's generated

### Step 2: Bind KV Namespace to Your Pages Project

1. Go to Cloudflare Pages → Your project (HisenZhang.github.io)
2. Go to Settings → Functions
3. Scroll down to "KV namespace bindings"
4. Click "Add binding"
   - Variable name: `SESSION`
   - KV namespace: Select the `SESSION` namespace you just created
5. Save

### Step 3: Add Environment Variables to Cloudflare

You need to add these environment variables to your Cloudflare Pages deployment:

1. Go to your Cloudflare Pages dashboard
2. Select your project (HisenZhang.github.io)
3. Go to Settings → Environment variables
4. Add the following variables for **Production**:

```
KEYSTATIC_GITHUB_CLIENT_ID=your_client_id_here
KEYSTATIC_GITHUB_CLIENT_SECRET=your_client_secret_here
KEYSTATIC_SECRET=your_random_secret_key_here
PUBLIC_KEYSTATIC_GITHUB_APP_SLUG=your-github-app-slug
```

**Important Notes:**
- `KEYSTATIC_SECRET`: A random string for session encryption (use the one from your `.env` file)
- `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG`: The slug of your GitHub App (found in the app URL, usually lowercase version of the app name)
- Do NOT add `KEYSTATIC_GITHUB_APP_ID` or `KEYSTATIC_GITHUB_PRIVATE_KEY` to Cloudflare - they're only needed for local development
- Make sure to redeploy after adding environment variables

### Step 4: Verify Setup

1. After completing steps 1-3 and redeploying, visit: https://hisenz.com/keystatic
2. Click "Sign in with GitHub"
3. Authorize the app
4. You should see your blog posts collection

## Troubleshooting

- **500 Error on `/api/keystatic/github/login`**:
  - Check that the KV namespace is properly bound with variable name `SESSION` (Step 2)
  - Verify all 4 environment variables are set (Step 3)
  - Make sure you redeployed after adding the KV binding
- **"Unable to load collection"**: Check that environment variables are set correctly in Cloudflare
- **OAuth redirect error**: Verify the callback URL in GitHub App settings matches: `https://hisenz.com/api/keystatic/github/oauth/callback`
- **Permission denied**: Make sure the GitHub App is installed on the repository and has "Contents: Read and write" permission
- **"Invalid binding `SESSION`"**: The KV namespace binding name must be exactly `SESSION` (all caps)
