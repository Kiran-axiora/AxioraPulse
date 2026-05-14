# Nexora Survey

A beautiful, multi-tenant SaaS survey platform built with React, Supabase, and Tailwind CSS.

## Features

- **Multi-Tenant Architecture** — Complete data isolation between organizations using Supabase Row Level Security
- **Role-Based Access Control** — Super Admin, Admin, Manager, Creator, Viewer with granular permissions
- **Beautiful Survey Builder** — Drag-and-drop style question builder with 11 question types
- **Auto-Save Responses** — Saves every 2-3 answers automatically; respondents can resume from where they left off
- **Real-Time Analytics** — Charts, completion rates, response trends, CSV export
- **Unique Survey Links** — Every survey gets a shareable `/s/{slug}` URL
- **Survey Expiry & Resume** — Auto-expire surveys; Admins/Managers can resume with new expiry dates
- **Team Management** — Invite members, assign roles, deactivate users
- **Within-Tenant Sharing** — Share survey analytics within your organization only (never cross-tenant)
- **Polished UX** — Custom design system with DM Serif Display + Plus Jakarta Sans, glass morphism cards, smooth animations

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS 3 |
| State | Zustand |
| Backend | FastAPI (Python) + PostgreSQL |
| Database | AWS Aurora/RDS (Production) |
| Hosting | AWS ECS Fargate + CloudFront |
| Routing | React Router v6 |

## Project Structure

```
nexora-pulse/
├── netlify/functions/         # Serverless API functions
│   ├── register-tenant.js     # New org registration
│   └── invite-user.js         # User invitation
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── DashboardLayout.jsx   # Sidebar + layout shell
│   │   └── ProtectedRoute.jsx    # Auth guard
│   ├── hooks/
│   │   └── useAuth.js            # Auth store (Zustand)
│   ├── lib/
│   │   ├── constants.js          # Roles, permissions, helpers
│   │   └── supabase.js           # Supabase client
│   ├── pages/
│   │   ├── Dashboard.jsx         # Overview with stats
│   │   ├── Landing.jsx           # Public landing page
│   │   ├── Login.jsx             # Sign in
│   │   ├── Register.jsx          # New organization signup
│   │   ├── Settings.jsx          # Profile & org settings
│   │   ├── SurveyAnalytics.jsx   # Charts & response data
│   │   ├── SurveyCreate.jsx      # Survey builder
│   │   ├── SurveyEdit.jsx        # Edit existing survey
│   │   ├── SurveyList.jsx        # All surveys with filters
│   │   ├── SurveyRespond.jsx     # Public survey form (auto-save)
│   │   └── TeamManagement.jsx    # User management
│   ├── styles/
│   │   └── index.css             # Tailwind + custom styles
│   ├── App.jsx                   # Router configuration
│   └── main.jsx                  # Entry point
├── supabase/
│   └── schema.sql                # Complete database schema with RLS
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.js
├── netlify.toml
└── .env.example
```

## Setup Guide

### 1. Backend Setup
The frontend depends on the FastAPI backend. Follow the instructions in `backend/README.md` to get it running.

### 2. Local Development

```bash
# Clone the repo
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Set VITE_API_BASE_URL to http://localhost:8000

# Start development server
npm run dev
```

### 3. Deploy to AWS
Deployment is handled automatically via GitHub Actions. 
- **Frontend:** Deployed to ECS Fargate and served via CloudFront.
- **Backend:** Deployed to ECS Fargate.
- **Database:** AWS Aurora/RDS.

See `AWS_SETUP.md` for infrastructure details.

### 4. First Admin User

1. Go to your deployed site → **Register** → Create your organization
2. The first user is automatically assigned the **Admin** role
3. Start creating surveys!

## Roles & Permissions

| Permission | Super Admin | Admin | Manager | Creator | Viewer |
|-----------|:-----------:|:-----:|:-------:|:-------:|:------:|
| Create surveys | ✅ | ✅ | ✅ | ✅ | ❌ |
| Edit any survey | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit own survey | ✅ | ✅ | ✅ | ✅ | ❌ |
| Delete surveys | ✅ | ✅ | ❌ | ❌ | ❌ |
| View analytics | ✅ | ✅ | ✅ | ✅* | ❌ |
| Resume expired | ✅ | ✅ | ✅ | ❌ | ❌ |
| Manage team | ✅ | ✅ | ❌ | ❌ | ❌ |
| Org settings | ✅ | ❌ | ❌ | ❌ | ❌ |

*Creators can view analytics for their own surveys

## Multi-Tenancy & Security

- **Row Level Security (RLS)** on every table ensures tenant isolation
- Helper functions `get_user_tenant_id()` and `get_user_role()` enforce access at the database level
- Survey responses use separate `tenant_id` set via trigger — no client manipulation possible
- Share permissions are strictly within-tenant; the database prevents cross-tenant sharing
- Service role key is **never** exposed to the client — only used in Netlify functions

## Auto-Save Feature

When respondents fill out a survey:
1. A `session_token` is stored in `sessionStorage`
2. Every 2 answered questions trigger an auto-save (configurable per survey)
3. A 5-second debounce timer saves on inactivity
4. If the browser closes, respondents can resume from where they left off
5. The survey header shows a "Saved" indicator

## Survey Lifecycle

```
Draft → Active → Paused → Active → Expired → Resumed (Active) → Closed
```

- **Draft**: Only visible in dashboard, not accessible via public link
- **Active**: Accepting responses via unique link
- **Paused**: Link shows "not accepting responses"
- **Expired**: Auto-triggered when `expires_at` passes; Admin/Manager can resume with new date
- **Closed**: Permanently closed

## License

Proprietary — Axiora Core Tech
