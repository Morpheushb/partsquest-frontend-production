# PartsQuest Frontend - Production

A modern, AI-powered SaaS application for parts search and procurement built with React, TypeScript, and Tailwind CSS.

## 🚀 Features

### Core Functionality
- **User Authentication** - Secure login and registration system
- **AI-Powered Search** - Natural language parts search capabilities
- **Voice Search** - AI voice calling for hands-free operation
- **Part Request Management** - Create and track part procurement requests
- **Subscription Management** - Stripe-integrated billing system

### Technical Features
- **Responsive Design** - Works seamlessly on desktop and mobile
- **Modern UI Components** - Built with shadcn/ui and Tailwind CSS
- **Real-time API Integration** - Connects to PartsQuest backend
- **Production Ready** - Optimized build with Vite
- **Type Safety** - Full TypeScript support

## 🛠 Tech Stack

- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Icons**: Lucide React
- **HTTP Client**: Fetch API
- **Build Tool**: Vite
- **Package Manager**: pnpm

## 📦 Project Structure

```
src/
├── components/
│   └── ui/          # shadcn/ui components
├── assets/          # Static assets
├── hooks/           # Custom React hooks
├── lib/             # Utility functions
├── App.jsx          # Main application component
├── App.css          # Global styles
├── index.css        # Base styles
└── main.jsx         # Application entry point
```

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=https://partsquest-backend-production.onrender.com
```

## 🚀 Deployment

### Vercel Deployment

1. **Create GitHub Repository**
   - Create new repository: `partsquest-frontend-production`
   - Upload all source files (excluding node_modules)

2. **Connect to Vercel**
   - Import project from GitHub
   - Set framework preset to "Vite"
   - Configure environment variables

3. **Environment Configuration**
   ```
   VITE_API_URL = https://partsquest-backend-production.onrender.com
   ```

### Local Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build

# Preview production build
pnpm run preview
```

## 🔗 API Integration

The frontend connects to the PartsQuest backend API with the following endpoints:

- `POST /api/register` - User registration
- `POST /api/login` - User authentication
- `GET /api/profile` - User profile
- `PUT /api/profile` - Update profile
- `POST /api/part-requests` - Create part request
- `GET /api/part-requests` - List part requests
- `GET /api/stripe/config` - Stripe configuration
- `POST /api/stripe/create-checkout-session` - Start subscription

## 🎨 UI Components

Built with professional shadcn/ui components:

- **Forms**: Input, Label, Button, Select, Textarea
- **Layout**: Card, Tabs, Dialog, Badge
- **Navigation**: Responsive header and navigation
- **Feedback**: Loading states, error handling

## 📱 Features Overview

### Authentication System
- Secure login/register forms
- JWT token management
- Persistent sessions
- Profile management

### Parts Search
- AI-powered natural language search
- Voice search integration
- Advanced filtering options
- Request tracking

### Subscription Management
- Stripe integration
- Multiple pricing tiers
- Usage tracking
- Billing management

### Voice Features
- Web Speech API integration
- Voice-to-text conversion
- AI processing pipeline
- Hands-free operation

## 🔒 Security

- JWT token authentication
- Secure API communication
- Input validation
- XSS protection
- CORS handling

## 📊 Performance

- Optimized bundle size (~326KB JS, ~86KB CSS)
- Code splitting
- Lazy loading
- Production builds with Vite
- Responsive images

## 🌐 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📄 License

Private - PartsQuest SaaS Platform

## 🤝 Support

For technical support or questions, contact the development team.

---

**PartsQuest** - AI-Powered Parts Search & Procurement Platform

