# Ship Fast TypeScript Supabase 🚀

A modern, responsive quiz application built with Next.js 15, TypeScript, Supabase, and Tailwind CSS. Features a fully responsive design system and adaptive UI components.

## ✨ Features

- **Responsive Design**: Adaptive layouts for all device types (desktop-xl, desktop, tablet, mobile)
- **Modern Tech Stack**: Next.js 15, TypeScript, Supabase, Tailwind CSS
- **Quiz System**: Interactive quiz functionality with multiple question types
- **Authentication**: Supabase Auth integration
- **Payments**: Stripe integration for premium features
- **Email**: Mailgun integration for transactional emails
- **Testing**: Jest and React Testing Library setup
- **Performance**: Optimized for Core Web Vitals

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS, Headless UI
- **Payments**: Stripe
- **Email**: Mailgun
- **Testing**: Jest, React Testing Library
- **Deployment**: Vercel (recommended)

## 🚀 Quick Start

### Automated Setup (Recommended)

Run the automated setup script:

```bash
# Clone the repository
git clone <repository-url>
cd ship-fast-ts-supabase

# Run the setup script
./setup.sh
```

The setup script will:
- Check Node.js and npm versions
- Install all dependencies
- Create environment configuration
- Set up necessary directories
- Verify the installation

### Manual Setup

If you prefer manual setup:

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env

# Start development server
npm run dev
```

## 📋 Prerequisites

- **Node.js**: Version 18 or higher
- **npm**: Latest version
- **Supabase Account**: For database and authentication
- **Stripe Account**: For payment processing (optional)
- **Mailgun Account**: For email services (optional)

## 🔧 Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# NextAuth Configuration
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Stripe Configuration (Optional)
STRIPE_PUBLIC_KEY=your_stripe_public_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Email Configuration (Optional)
EMAIL_FROM=your_email
MAILGUN_API_KEY=your_mailgun_api_key
MAILGUN_DOMAIN=your_mailgun_domain

# Redis Configuration (Optional)
REDIS_URL=your_redis_url
```

## 🗄️ Database Setup

1. **Create Supabase Project**:
   - Go to [Supabase](https://supabase.com)
   - Create a new project
   - Copy your project URL and API keys

2. **Import Database Schema**:
   ```bash
   # If you have the SQL file
   psql -h your_host -U your_user -d your_database -f supabase_database.sql
   ```

3. **Run Migrations** (if applicable):
   ```bash
   npm run migrate
   ```

## 🏃‍♂️ Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint

# Run tests
npm test

# Analyze bundle
npm run analyze
```

## 📱 Responsive Design

The application features a comprehensive responsive design system:

- **Desktop XL**: 1536px and above
- **Desktop Large**: 1280px to 1535px
- **Desktop**: 1024px to 1279px
- **Tablet**: 768px to 1023px
- **Mobile Large**: 425px to 767px
- **Mobile**: Below 425px

### Key Responsive Features:
- Adaptive navigation (sidebar on desktop, drawer on mobile)
- Touch-optimized controls (44px minimum touch targets)
- Breakpoint-based layout configurations
- Mobile-first design approach

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📁 Project Structure

```
ship-fast-ts-supabase/
├── app/                    # Next.js 13+ app directory
│   ├── components/         # Shared components
│   ├── features/          # Feature-based modules
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility libraries
│   └── types/             # TypeScript type definitions
├── components/            # Legacy components
├── docs/                  # Documentation
├── libs/                  # External libraries
├── public/               # Static assets
├── scripts/              # Build and utility scripts
├── tasks/                # Task management
└── tests/                # Test files
```

## 🔄 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests |
| `npm run analyze` | Analyze bundle size |

## 🌐 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push

### Other Platforms

The application can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📚 Documentation

- [Responsive Design Guide](./docs/RESPONSIVE_DESIGN_GUIDE.md)
- [Quiz Implementation](./docs/RESPONSIVE_QUIZ_IMPLEMENTATION.md)
- [Architecture Overview](./app/features/quiz/ARCHITECTURE.md)

## 🐛 Troubleshooting

### Common Issues

1. **Build Errors**: Make sure all environment variables are set
2. **Database Connection**: Verify Supabase credentials
3. **Styling Issues**: Check Tailwind CSS configuration
4. **TypeScript Errors**: Run `npm run lint` to identify issues

### Getting Help

- Check the [documentation](./docs/)
- Review [GitHub Issues](link-to-issues)
- Join our [Discord Community](link-to-discord)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Ship Fast](https://shipfa.st/) boilerplate
- Powered by [Supabase](https://supabase.com)
- Styled with [Tailwind CSS](https://tailwindcss.com)
- Deployed on [Vercel](https://vercel.com)

---

**Ready to ship fast? 🚀**

Run `./setup.sh` and start building your next big thing!
