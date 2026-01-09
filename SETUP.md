# Setup Guide - Astro Blog with Decap CMS

## What You Get

- **Modern Astro blog** - Fast, SEO-friendly static site
- **Web-based editor** - Edit posts at `https://yourdomain.com/admin`
- **Git-based workflow** - All changes commit to GitHub
- **Cloudflare Pages hosting** - Fast global CDN (not blocked in China)
- **57 migrated posts** - All your Hexo posts are ready

## Step 1: Create GitHub Repository

1. Create a new repository on GitHub (e.g., `blog-astro`)
2. Initialize this project:

```bash
cd /Users/hisen/Projects/blog-astro
git init
git add .
git commit -m "Initial commit - Astro blog with Decap CMS"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/blog-astro.git
git push -u origin main
```

## Step 2: Update CMS Configuration

Edit `public/admin/config.yml` and update line 3:

```yaml
backend:
  name: github
  repo: YOUR_GITHUB_USERNAME/blog-astro  # Update this!
  branch: main
```

## Step 3: Set Up Cloudflare Pages

### Option A: Automatic GitHub Integration (Recommended)

1. Go to https://dash.cloudflare.com/
2. Select **Pages** → **Create a project**
3. Connect to your GitHub account
4. Select your `blog-astro` repository
5. Use these build settings:
   - **Framework preset**: Astro
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
6. Click **Save and Deploy**

### Option B: Using GitHub Actions

If you prefer GitHub Actions (to use the workflow I created):

1. Get your Cloudflare credentials:
   - Go to https://dash.cloudflare.com/profile/api-tokens
   - Create API token with "Cloudflare Pages" permissions
   - Get your Account ID from Pages dashboard

2. Add GitHub secrets (Settings → Secrets and variables → Actions):
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`

3. Update `.github/workflows/deploy.yml` line 33 with your project name

## Step 4: Enable CMS Authentication

For web-based editing, you need OAuth authentication:

### Using GitHub OAuth (Free)

1. Create GitHub OAuth App:
   - Go to https://github.com/settings/developers
   - Click **New OAuth App**
   - **Application name**: Your Blog CMS
   - **Homepage URL**: `https://yourdomain.com`
   - **Authorization callback URL**: `https://api.netlify.com/auth/done`
   - Save the Client ID and Client Secret

2. Set up OAuth gateway (choose one):

   **Option A: Use Netlify's free OAuth service**
   - Deploy a simple Netlify site (just `public/admin` folder)
   - Add OAuth provider in Netlify dashboard
   - Update `config.yml` with:
     ```yaml
     backend:
       name: github
       repo: YOUR_USERNAME/blog-astro
       branch: main
       base_url: https://api.netlify.com
       auth_endpoint: auth
     ```

   **Option B: Deploy your own OAuth server**
   - Use https://github.com/vencax/netlify-cms-github-oauth-provider
   - Deploy to Cloudflare Workers (free tier)
   - Update `config.yml` with your worker URL

## Step 5: Test Locally

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Test the CMS locally at http://localhost:4321/admin
# Note: For local testing, enable test backend in config.yml:
# backend:
#   name: test-repo
```

## Step 6: Access Your CMS

Once deployed:

1. Visit `https://yourdomain.com/admin`
2. Click "Login with GitHub"
3. Authorize the app
4. Start editing!

## How It Works

- **Edit posts in browser** - Rich markdown editor with live preview
- **Commits to GitHub** - Every save creates a commit
- **Auto-deploys** - Cloudflare Pages rebuilds on every commit
- **Editorial workflow** - Draft/Review/Publish stages (optional)

## Managing Posts

### Via Web UI
- Go to `/admin`
- Create/edit/delete posts
- Upload images
- Manage frontmatter (tags, categories, dates)

### Via Git (Traditional)
- Edit files in `src/content/blog/`
- Commit and push
- Auto-deploys

## Commands

| Command | Action |
|---------|--------|
| `npm run dev` | Start dev server at `localhost:4321` |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `node migrate-posts.js` | Re-run migration if needed |

## Custom Domain

In Cloudflare Pages:
1. Go to your project → **Custom domains**
2. Add `hisenz.com`
3. Update DNS records as instructed
4. SSL automatically configured

## Troubleshooting

**Can't login to /admin?**
- Check OAuth configuration
- Ensure callback URL is correct
- Check browser console for errors

**Posts not showing?**
- Check frontmatter format
- Run `npm run build` to see errors
- Ensure `pubDate` field exists

**Images not uploading?**
- Check `media_folder` path in config.yml
- Ensure folder exists: `public/images/uploads/`

## Next Steps

1. Customize the design in `src/layouts/` and `src/components/`
2. Update site metadata in `src/consts.ts`
3. Add your domain in Cloudflare
4. Customize the CMS fields in `public/admin/config.yml`

## Resources

- [Astro Docs](https://docs.astro.build/)
- [Decap CMS Docs](https://decapcms.org/docs/)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
