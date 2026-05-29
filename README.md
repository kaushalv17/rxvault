# RxVault — Digital Prescription Management Platform

> Assessment submission for Jaypee Brothers Medical Publishers · Built with Next.js 14, Express, Prisma & SQLite

A production-grade, full-stack digital prescription platform. Doctors create QR-verified prescriptions; patients view, download, and track their complete health history — all through a clinical-luxury UI inspired by myrx.in.

---

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| 👨‍⚕️ Doctor | `dr.sharma@rxvault.com` | `password123` |
| 👨‍⚕️ Doctor | `dr.mehta@rxvault.com` | `password123` |
| 🧑 Patient | `rahul.kumar@gmail.com` | `password123` |
| 🧑 Patient | `anita.singh@gmail.com` | `password123` |

---

## ✨ Features

### Core (Assessment Requirements)
- **JWT Auth** — Role-based access (Doctor / Patient) with secure token management
- **Prescription CRUD** — Create, view, update status, cancel prescriptions
- **Multi-medication support** — Dosage, frequency, duration, instructions per drug
- **Patient history** — Complete prescription and record timeline per patient
- **PDF Download** — Server-side PDFKit generation, professional Rx pad layout
- **Search & Filter** — By status, diagnosis, patient name, Rx number

### Advanced Enhancements
- **QR Code Verification** — HMAC-SHA256 signed hashes; public `/verify` portal for pharmacists
- **Allergy Warnings** — Surfaced prominently on prescription creation and detail views
- **Medical Records Module** — Lab reports, imaging — categorized, searchable, downloadable
- **Audit Log** — Every create, update, download tracked with user + timestamp
- **Role Dashboards** — Doctors: pie chart breakdown + patient count; Patients: Rx summary
- **Patient Profiles** — Blood group, weight, height, DOB, allergies
- **Rate Limiting** — 300 req / 15 min, Helmet headers, strict CORS

### UI/Design
- **Clinical Luxury Design** — Dark navy sidebar + teal-cyan gradient accents (myrx.in inspired)
- **Plus Jakarta Sans + Fraunces** — Premium medical typography pairing
- **4-Step Prescription Wizard** — Patient select → Medications → Diagnosis → Live Rx pad preview
- **Animated Rx Pad** — Real letterhead-style view with lifecycle progress bar (Active → Filled → Expired)
- **Staggered Animations** — Every page fades in with CSS keyframe stagger
- **Shimmer Skeletons** — Loading states on every data-dependent component
- **Responsive** — Mobile-first with collapsible drawer sidebar

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| State | TanStack Query v5 (server), React Context (auth) |
| Backend | Express.js, TypeScript, Prisma ORM |
| Database | SQLite (dev) → PostgreSQL (prod) |
| PDF | PDFKit (server-side) |
| QR | `qrcode` + HMAC-SHA256 |
| Auth | JWT + bcryptjs |
| Charts | Recharts |
| Toasts | Sonner |
| Monorepo | npm workspaces |

---

## 📁 Project Structure

```
rxvault/
├── apps/
│   ├── api/                        # Express backend
│   │   ├── prisma/schema.prisma    # DB schema
│   │   └── src/
│   │       ├── routes/             # auth, prescriptions, patients, records, dashboard, verify
│   │       ├── middleware/         # JWT auth, error handler
│   │       ├── services/           # pdfService, qrService
│   │       └── seed.ts             # Demo data
│   └── web/                        # Next.js frontend
│       └── src/
│           ├── app/
│           │   ├── auth/           # login, register
│           │   ├── dashboard/
│           │   ├── prescriptions/  # list, new, [id]
│           │   ├── patients/       # list, [id]
│           │   ├── records/
│           │   ├── settings/
│           │   └── verify/[hash]/  # Public QR verification
│           ├── components/
│           │   ├── layout/         # AppShell, Sidebar, AuthGuard, Providers
│           │   ├── prescriptions/  # PrescriptionCard
│           │   └── ui/             # StatusBadge
│           ├── lib/                # axios instance
│           └── store/              # AuthContext
└── packages/
    └── shared/                     # Shared TypeScript types
```

---

## 🚀 Local Setup

### Prerequisites
- Node.js 18+
- npm 9+
- Git

### Step 1 — Clone / Extract

```bash
# If cloning from GitHub:
git clone https://github.com/YOUR_USERNAME/rxvault.git
cd rxvault

# If using the zip:
unzip rxvault_redesigned.zip
cd rxvault
```

### Step 2 — Install Dependencies

```bash
npm install
```

### Step 3 — Set Up API Environment

```bash
cd apps/api
cp .env.example .env
# .env already has correct defaults for local dev:
# DATABASE_URL="file:./dev.db"
# JWT_SECRET="rxvault-super-secret-key"
# PORT=4000
# FRONTEND_URL="http://localhost:3000"
cd ../..
```

### Step 4 — Set Up Web Environment

```bash
cd apps/web
echo 'NEXT_PUBLIC_API_URL=http://localhost:4000/api' > .env.local
cd ../..
```

### Step 5 — Database Setup & Seed

```bash
cd apps/api
npx prisma generate
npx prisma migrate dev --name init
npx ts-node src/seed.ts
cd ../..
```

### Step 6 — Run Development Servers

```bash
# Runs API (port 4000) + Web (port 3000) concurrently
npm run dev
```

Open **http://localhost:3000** → use demo credentials above.

---

## ☁️ Deployment

### Backend → Railway

1. Go to [railway.app](https://railway.app) and sign up (free)
2. Click **New Project → Deploy from GitHub repo** → select `rxvault`
3. Click **Add Service → PostgreSQL** — copy the `DATABASE_URL`
4. Go to your API service → **Variables** → add:
   ```
   DATABASE_URL=<paste postgres url>
   JWT_SECRET=<any 32+ char random string>
   NODE_ENV=production
   PORT=4000
   FRONTEND_URL=https://your-app.vercel.app
   ```
5. In `apps/api/prisma/schema.prisma` change:
   ```prisma
   provider = "postgresql"
   ```
6. In API `package.json` scripts add:
   ```json
   "start": "node dist/index.js",
   "build": "tsc"
   ```
7. Deploy — Railway auto-detects and runs `npm install && npm run build && npm start`
8. Run migrations: Railway shell → `npx prisma migrate deploy && npx ts-node src/seed.ts`
9. Copy your Railway domain, e.g. `https://rxvault-api.railway.app`

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) and sign up (free)
2. Click **Add New Project → Import Git Repository** → select `rxvault`
3. Set **Root Directory** to `apps/web`
4. Under **Environment Variables** add:
   ```
   NEXT_PUBLIC_API_URL=https://rxvault-api.railway.app/api
   ```
5. Click **Deploy**
6. Your site is live at `https://rxvault-xxx.vercel.app`

---

## 📡 API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Register doctor or patient |
| POST | `/api/auth/login` | — | Login, receive JWT |
| GET | `/api/auth/me` | ✓ | Current user profile |
| PUT | `/api/auth/me` | ✓ | Update profile |
| GET | `/api/prescriptions` | ✓ | List (search, filter, paginate) |
| POST | `/api/prescriptions` | Doctor | Create prescription |
| GET | `/api/prescriptions/:id` | ✓ | Single prescription |
| PUT | `/api/prescriptions/:id` | Doctor | Update status |
| GET | `/api/prescriptions/:id/download` | ✓ | Download PDF |
| GET | `/api/prescriptions/verify/:hash` | — | Public QR verification |
| GET | `/api/patients` | Doctor | List patients |
| GET | `/api/patients/:id` | Doctor | Patient + prescriptions |
| GET | `/api/medical-records` | ✓ | List records |
| POST | `/api/medical-records` | ✓ | Upload record |
| DELETE | `/api/medical-records/:id` | ✓ | Delete record |
| GET | `/api/dashboard` | ✓ | Dashboard stats |

---

## 🔒 Security

- All passwords hashed with bcrypt (12 rounds)
- JWT tokens expire in 7 days
- HMAC-SHA256 signed QR hashes — unforgeable
- Rate limited: 300 requests / 15 min
- Helmet HTTP security headers
- Strict CORS — only whitelisted origins

---

*Built by [Your Name] · Jaypee Brothers Medical Publishers Assessment 2025*
