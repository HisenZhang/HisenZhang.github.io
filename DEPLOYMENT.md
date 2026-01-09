# Deployment Guide - Replace GitHub Pages with Cloudflare Pages

This guide will help you replace your current GitHub Pages blog (HisenZhang.github.io) with this new Astro blog on Cloudflare Pages.

## Why Cloudflare Pages?

✅ Not blocked in China
✅ Faster global CDN
✅ Free SSL
✅ Better performance
✅ Works seamlessly with Decap CMS

## Step 1: Backup Your Old Blog

Your old Hexo blog is at https://github.com/HisenZhang/HisenZhang.github.io

1. Rename the repository to keep it as backup:
   - Go to https://github.com/HisenZhang/HisenZhang.github.io/settings
   - Scroll to "Repository name"
   - Rename to `blog-hexo-backup` or similar
   - Click "Rename"

This will free up the `HisenZhang.github.io` repository name.

## Step 2: Push New Blog to GitHub

```bash
cd /Users/hisen/Projects/blog-astro

# Create a new repository on GitHub named: HisenZhang.github.io
# Then run:

git remote add origin https://github.com/HisenZhang/HisenZhang.github.io.git
git branch -M main
git push -u origin main
```

## Step 3: Deploy to Cloudflare Pages

### Option A: Automatic Deployment (Recommended - Easiest!)

1. Go to https://dash.cloudflare.com/
2. Click **Pages** in the left sidebar
3. Click **Create a project**
4. Click **Connect to Git**
5. Authorize Cloudflare to access your GitHub
6. Select **HisenZhang/HisenZhang.github.io**
7. Configure build settings:
   - **Project name**: `hisenz-blog` (or any name you like)
   - **Production branch**: `main`
   - **Framework preset**: Astro
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
8. Click **Save and Deploy**

That's it! Cloudflare will:
- Build your site automatically
- Deploy it to a cloudflare.pages.dev URL
- Rebuild automatically on every git push

### Option B: Using GitHub Actions

If you prefer using GitHub Actions (more control):

1. Get Cloudflare credentials:
   - Go to https://dash.cloudflare.com/profile/api-tokens
   - Create API token with "Cloudflare Pages" permissions
   - Copy your Account ID from the Pages dashboard URL

2. Add secrets to GitHub:
   - Go to https://github.com/HisenZhang/HisenZhang.github.io/settings/secrets/actions
   - Add `CLOUDFLARE_API_TOKEN` (from step 1)
   - Add `CLOUDFLARE_ACCOUNT_ID` (from step 1)

3. Push your code - the workflow will deploy automatically

## Step 4: Connect Your Custom Domain (hisenz.com)

1. In Cloudflare Pages dashboard, go to your project
2. Click **Custom domains**
3. Click **Set up a custom domain**
4. Enter `hisenz.com`
5. Cloudflare will provide DNS records:
   ```
   CNAME  hisenz.com  ->  hisenz-blog.pages.dev
   ```
6. If your domain is already on Cloudflare:
   - DNS records will be added automatically
   - SSL will be configured automatically

7. If your domain is NOT on Cloudflare:
   - Transfer your domain to Cloudflare (recommended)
   - OR update DNS at your current registrar with the provided records

## Step 5: Set Up CMS Authentication (Web Editing)

To enable editing at `https://hisenz.com/admin`:

### Create GitHub OAuth App

1. Go to https://github.com/settings/developers
2. Click **New OAuth App**
3. Fill in:
   - **Application name**: HisenZhang Blog CMS
   - **Homepage URL**: `https://hisenz.com`
   - **Authorization callback URL**: `https://api.netlify.com/auth/done`
4. Click **Register application**
5. Copy the **Client ID**
6. Generate a **Client Secret** and copy it

### Set Up OAuth Gateway

**Option A: Use Netlify's Free OAuth Service (Easiest)**

1. Create a free Netlify account at https://netlify.com
2. Drag and drop the `public/admin` folder to create a site
3. In Netlify site settings:
   - Go to **Site settings** → **Access control** → **OAuth**
   - Click **Install provider**
   - Choose **GitHub**
   - Enter your Client ID and Client Secret
4. Update `/Users/hisen/Projects/blog-astro/public/admin/config.yml`:
   ```yaml
   backend:
     name: github
     repo: HisenZhang/HisenZhang.github.io
     branch: main
     base_url: https://api.netlify.com
     auth_endpoint: auth
   ```
5. Commit and push this change

**Option B: Deploy OAuth Server on Cloudflare Workers (Advanced)**

Follow this guide: https://github.com/vencax/netlify-cms-github-oauth-provider

Deploy to Cloudflare Workers (free tier available), then update config.yml with your worker URL.

## Step 6: Test Everything

1. Visit `https://hisenz.com` - Your blog should load
2. Visit `https://hisenz.com/admin` - You should see the CMS login
3. Click "Login with GitHub" and authorize
4. Create a test post in the CMS
5. Check that it appears on your blog

## Step 7: Update DNS for Email/Other Services (if needed)

If you had email or other services on hisenz.com, make sure to preserve those DNS records:
- MX records for email
- TXT records for domain verification
- Other CNAME or A records

## Troubleshooting

**404 errors?**
- Check that SITE_BASE in src/consts.ts is set to empty string `''`
- Check astro.config.mjs doesn't have a `base` property

**CMS not authenticating?**
- Verify OAuth callback URL is exactly: `https://api.netlify.com/auth/done`
- Check GitHub OAuth app is configured correctly
- Clear browser cache and try again

**Build failing?**
- Check the build logs in Cloudflare Pages dashboard
- Ensure all dependencies are in package.json
- Try building locally: `npm run build`

**Domain not working?**
- DNS propagation can take 24-48 hours
- Use https://dnschecker.org to check propagation
- Make sure SSL is active in Cloudflare

## What Happens to Your Old Blog?

Your old blog is safely backed up in the renamed repository. You can:
- Keep it as-is for reference
- Delete it after verifying the new blog works
- Export posts from it if needed

## Maintenance

### Publishing New Posts

**Via Web (Recommended)**:
1. Go to `https://hisenz.com/admin`
2. Click "New Blog Posts"
3. Write and publish

**Via Git**:
1. Create/edit markdown files in `src/content/blog/`
2. Commit and push
3. Cloudflare auto-deploys

### Updating Theme/Code

1. Edit files locally
2. Test with `npm run dev`
3. Commit and push
4. Auto-deploys in ~1 minute

## Quick Reference

- **Live Site**: https://hisenz.com
- **CMS Admin**: https://hisenz.com/admin
- **GitHub Repo**: https://github.com/HisenZhang/HisenZhang.github.io
- **Cloudflare Dashboard**: https://dash.cloudflare.com/
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
