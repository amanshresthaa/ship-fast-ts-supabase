# Setup Guide 🚀

This guide will help you get Ship Fast TypeScript Supabase up and running quickly.

## 🎯 Quick Setup Options

### Option 1: Automated Setup (Recommended)
```bash
./setup.sh
```
**What it does:**
- ✅ Checks Node.js version compatibility
- ✅ Installs all npm dependencies
- ✅ Creates environment configuration from template
- ✅ Sets up necessary directories
- ✅ Runs TypeScript validation
- ✅ Provides next steps guidance

### Option 2: Quick Start (Minimal)
```bash
./quick-start.sh
# or
npm run quick-start
```
**What it does:**
- ✅ Basic dependency installation
- ✅ Environment file creation
- ✅ Ready to develop immediately

### Option 3: Manual Setup
```bash
npm install
cp .env.example .env
# Edit .env with your values
npm run dev
```

## 📋 Prerequisites Checklist

Before running any setup script, ensure you have:

- [ ] **Node.js 18+** installed ([Download](https://nodejs.org/))
- [ ] **npm** (comes with Node.js)
- [ ] **Git** for version control
- [ ] **Supabase account** ([Sign up](https://supabase.com))

## 🔧 Environment Configuration

### Required Variables
```env
# Supabase (Required for database/auth)
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# NextAuth (Required for authentication)
NEXTAUTH_SECRET=your_random_secret
NEXTAUTH_URL=http://localhost:3000
```

### Optional Variables
```env
# Stripe (For payments)
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Mailgun (For emails)
MAILGUN_API_KEY=your_key
MAILGUN_DOMAIN=your_domain

# Redis (For caching)
REDIS_URL=redis://localhost:6379
```

## 🗄️ Database Setup Steps

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Choose organization and set project name
   - Wait for project initialization

2. **Get API Keys**
   - Go to Settings → API
   - Copy Project URL and anon/public key
   - Copy service_role key (keep secure!)

3. **Update Environment**
   ```bash
   nano .env
   # Add your Supabase credentials
   ```

4. **Import Schema** (if available)
   ```bash
   # Using Supabase CLI
   supabase db push

   # Or manually in Supabase Dashboard
   # Go to SQL Editor and run supabase_database.sql
   ```

## 🚀 Development Workflow

### First Time Setup
```bash
# 1. Clone repository
git clone <your-repo-url>
cd ship-fast-ts-supabase

# 2. Run automated setup
./setup.sh

# 3. Configure environment
nano .env

# 4. Start development
npm run dev
```

### Daily Development
```bash
# Start development server
npm run dev

# Run in different terminal windows:
npm run lint        # Check code quality
npm test           # Run tests
npm run build      # Test production build
```

## 🔍 Troubleshooting

### Common Issues

**"setup.sh: Permission denied"**
```bash
chmod +x setup.sh
./setup.sh
```

**"Node version incompatible"**
```bash
# Install Node 18+ using nvm
nvm install 18
nvm use 18
```

**"Cannot connect to Supabase"**
- Check your NEXT_PUBLIC_SUPABASE_URL format
- Verify anon key is correct
- Ensure Supabase project is active

**"Build failures"**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Need Help?

1. Check our [Documentation](../docs/)
2. Review [GitHub Issues](link-to-issues)
3. Join [Discord Community](link-to-discord)

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] `npm run dev` starts without errors
- [ ] http://localhost:3000 loads successfully
- [ ] No TypeScript errors in console
- [ ] Environment variables are loaded
- [ ] Database connection works (if configured)

## 🎉 You're Ready!

Once setup is complete:

1. **Start coding** - Your development environment is ready
2. **Read the docs** - Check `/docs/` for guides
3. **Explore features** - Test the responsive quiz system
4. **Deploy** - Follow deployment guide when ready

---

**Happy coding! 🚀**
