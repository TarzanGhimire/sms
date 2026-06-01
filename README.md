# School ERP + Billing Management System

Nepal-focused School ERP built with Next.js 15 + NestJS + PostgreSQL.

## Quick Start

### 1. Start the database
```bash
docker-compose up -d
```

### 2. Install dependencies
```bash
pnpm install
```

### 3. Setup backend
```bash
cd apps/backend
cp .env.example .env
pnpm prisma:push       # push schema to database
pnpm prisma:seed       # create super admin + default data
```

### 4. Setup frontend
```bash
cd apps/frontend
cp .env.local.example .env.local
```

### 5. Run development servers
```bash
# From root
pnpm dev:backend      # starts NestJS on :3001
pnpm dev:frontend     # starts Next.js on :3000
```

## Default Login
- **Email**: admin@school.edu.np
- **Password**: Admin@123

## Project Structure
```
school-erp/
├── apps/
│   ├── backend/     NestJS API
│   └── frontend/    Next.js 15
├── docker-compose.yml
└── pnpm-workspace.yaml
```

## Development Phases
- **Phase 1** ✅ Project setup, Auth, RBAC, Dashboard
- **Phase 2** Student & Teacher & Academic management
- **Phase 3** Billing, Invoices, Payments
- **Phase 4** Examinations, Results, PDFs
- **Phase 5** Expenses, Payroll, Reports
- **Phase 6** Backup, Dark mode, Optimization
