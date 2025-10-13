# Social Media AI - Web UI

Vue 3 + TypeScript + Vite frontend for the Social Media AI subscription management system.

## Features

- 🔐 **Authentication**: Login and signup with Supabase
- 💳 **Subscription Management**: Stripe-powered subscription tiers (Free, Pro, Enterprise)
- 📊 **Usage Tracking**: Real-time usage stats and quota management
- 🎨 **Image Generation**: AI-powered image generation with Gemini
- 🛡️ **Route Guards**: Protected routes for authenticated users
- 💾 **State Management**: Pinia stores for global state

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env` file:

```env
VITE_API_URL=http://localhost:3000
```

### 3. Start Development Server

```bash
npm run dev
```

Frontend available at `http://localhost:5173`

## Project Structure

```
src/
├── services/api.ts      # Backend API client
├── stores/auth.ts       # Authentication state
├── views/               # Page components
│   ├── LoginView.vue
│   ├── DashboardView.vue
│   └── PlansView.vue
├── router/index.ts      # Routes and guards
└── App.vue
```

## Available Routes

- `/login` - Login and signup (guest only)
- `/dashboard` - User dashboard (requires auth)
- `/plans` - Subscription plans
- `/` - Redirects to dashboard

## Scripts

```bash
npm run dev        # Start dev server
npm run build      # Build for production
npm run preview    # Preview production build
npm run type-check # TypeScript validation
npm run lint       # Lint and fix code
npm run format     # Format code
```

## Testing

Use these test Stripe cards:
- **Success**: 4242 4242 4242 4242
- Any future expiry, any CVC, any ZIP

## Backend Integration

Ensure the backend API is running on `http://localhost:3000` (or configure `VITE_API_URL`).

Required backend endpoints:
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/subscriptions/plans`
- `POST /api/subscriptions/checkout`
- `POST /api/subscriptions/portal`
- `POST /api/gemini/generate-image`

## Subscription Flow

1. Sign up / Login
2. View plans on `/plans`
3. Click "Subscribe Now"
4. Complete Stripe checkout
5. Webhook syncs subscription
6. Dashboard shows updated tier and quota

## Troubleshooting

**CORS Errors**: Ensure backend has CORS enabled for `http://localhost:5173`

**Auth Issues**: Clear localStorage and login again

**Subscription Issues**: Check Stripe webhook listener is running
