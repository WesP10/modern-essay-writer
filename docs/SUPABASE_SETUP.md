# Supabase Setup Guide for EssayForge

## 📋 Prerequisites
- A Supabase account (free tier works fine)
- Your project should have the frontend already set up

---

## 🚀 Step-by-Step Setup

### 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click **"New Project"**
4. Fill in:
   - **Project Name**: `essayforge` (or your preferred name)
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is sufficient
5. Click **"Create new project"**
6. Wait 2-3 minutes for provisioning

---

### 2. Set Up Database Tables

1. In your Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New query"**
3. Copy the entire contents of `docs/supabase-setup.sql`
4. Paste into the SQL editor
5. Click **"Run"** (or press `Ctrl+Enter`)
6. Verify success - you should see:
   - ✅ `essays` table created
   - ✅ `essay_versions` table created
   - ✅ Policies and triggers set up

---

### 3. Configure Authentication

#### Enable Email Authentication
1. Go to **Authentication** → **Providers** (left sidebar)
2. Ensure **Email** is enabled (it should be by default)
3. Configure email templates (optional):
   - Go to **Authentication** → **Email Templates**
   - Customize confirmation and password reset emails

#### Enable OAuth Providers (Optional but Recommended)

**Google OAuth:**
1. Go to **Authentication** → **Providers**
2. Click **Google**
3. Toggle **"Enable Google Provider"**
4. You'll need to:
   - Create a Google Cloud Project
   - Enable Google+ API
   - Create OAuth credentials
   - Add authorized redirect URIs
   - Copy Client ID and Secret to Supabase
5. For detailed steps: [Supabase Google Auth Docs](https://supabase.com/docs/guides/auth/social-login/auth-google)

**GitHub OAuth:**
1. Go to **Authentication** → **Providers**
2. Click **GitHub**
3. Toggle **"Enable GitHub Provider"**
4. You'll need to:
   - Go to GitHub Settings → Developer settings → OAuth Apps
   - Create a new OAuth app
   - Set Authorization callback URL to your Supabase callback
   - Copy Client ID and Secret to Supabase
5. For detailed steps: [Supabase GitHub Auth Docs](https://supabase.com/docs/guides/auth/social-login/auth-github)

---

### 4. Get Your API Keys

1. Go to **Settings** → **API** (left sidebar)
2. You'll see:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **Project API keys**:
     - `anon` / `public` key (this is safe to use in frontend)
     - `service_role` key (⚠️ NEVER expose this in frontend!)

---

### 5. Configure Frontend Environment Variables

1. In your `frontend` folder, create a `.env` file:
   ```bash
   cd frontend
   cp .env.example .env
   ```

2. Edit `.env` and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. **Important**: `.env` is gitignored - never commit this file!

---

### 6. Test the Setup

1. Restart your dev server:
   ```powershell
   # Stop the server (Ctrl+C)
   npm run dev
   ```

2. Open http://localhost:5173/
3. You should now see authentication options
4. Try creating an account:
   - Click "Sign Up"
   - Enter email and password
   - Check your email for confirmation
   - Confirm your email
   - Sign in

---

## 🧪 Verify Everything Works

### Test Authentication
- [ ] Can sign up with email
- [ ] Receive confirmation email
- [ ] Can sign in after confirmation
- [ ] Can sign out
- [ ] (Optional) Can sign in with Google/GitHub

### Test Essay Sync
- [ ] Create a new essay while signed in
- [ ] Check Supabase dashboard → **Table Editor** → `essays`
- [ ] Your essay should appear in the database
- [ ] Sign out and sign in again
- [ ] Your essay should still be there

### Test Version History
- [ ] Edit an essay multiple times
- [ ] Check **Table Editor** → `essay_versions`
- [ ] Should see versions saved

---

## 🔒 Security Features

The setup includes:
- **Row Level Security (RLS)**: Users can only access their own essays
- **Authentication**: Required for cloud features
- **Automatic triggers**: Version history management
- **Secure policies**: No unauthorized data access

---

## 🐛 Troubleshooting

### "Invalid API credentials" error
- Double-check your `.env` file
- Ensure you copied the **anon** key (not service_role)
- Restart the dev server after changing `.env`

### Email confirmation not received
- Check spam folder
- Verify email settings in Supabase dashboard
- Try with a different email provider

### OAuth not working
- Verify redirect URLs match exactly
- Check OAuth credentials are correct
- Ensure OAuth provider is enabled in Supabase

### RLS policy errors
- Re-run the SQL setup script
- Check that policies are created in **Authentication** → **Policies**

---

## 📊 Database Schema Overview

### `essays` table
- `id` (UUID) - Primary key
- `user_id` (UUID) - References auth.users
- `title` (TEXT) - Essay title
- `content` (TEXT) - Essay content (HTML)
- `word_count` (INTEGER) - Word count
- `char_count` (INTEGER) - Character count
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP) - Auto-updated

### `essay_versions` table
- `id` (UUID) - Primary key
- `essay_id` (UUID) - References essays
- `content` (TEXT) - Version content
- `word_count` (INTEGER) - Word count at version
- `created_at` (TIMESTAMP)

---

## 🎯 Next Steps

After setup is complete:
1. Test the full workflow (sign up, create, edit, sync)
2. Invite beta testers
3. Monitor usage in Supabase dashboard
4. Configure email templates for your brand
5. Set up custom domain (optional)

---

## 💡 Tips

- **Free tier limits**: 500MB database, 50,000 monthly active users
- **Backup**: Supabase provides automatic daily backups
- **Monitoring**: Check **Database** → **Metrics** for usage stats
- **Logs**: Check **Logs** in sidebar for debugging

---

## 📚 Useful Links

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Dashboard](https://app.supabase.com)

---

**Setup Complete!** 🎉

Your EssayForge app now has:
- ✅ User authentication
- ✅ Cloud storage
- ✅ Version history
- ✅ Real-time sync
- ✅ Secure data access
