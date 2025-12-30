# XSeed Backend

NestJS backend API for the HR Platform with PostgreSQL, JWT authentication, and AWS ECS Fargate deployment.

## Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Option 1: Docker (Recommended)](#option-1-docker-recommended)
  - [Option 2: Local Development](#option-2-local-development)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Authentication](#authentication)
- [Environment Variables](#environment-variables)
- [Shared Types Package](#shared-types-package)
- [Development Workflow](#development-workflow)
- [Deployment](#deployment)
- [Related Repositories](#related-repositories)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           HR PLATFORM ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐         ┌─────────────────────────────────────────┐  │
│  │   Frontend   │         │              AWS Cloud                   │  │
│  │   (Vercel)   │         │                                         │  │
│  │              │  HTTPS  │  ┌─────────┐    ┌──────────────────┐    │  │
│  │  Next.js     │◄───────►│  │   ALB   │───►│  ECS Fargate     │    │  │
│  │  App Router  │         │  │         │    │  (This Backend)  │    │  │
│  └──────────────┘         │  └─────────┘    └────────┬─────────┘    │  │
│                           │                          │               │  │
│                           │                          ▼               │  │
│                           │                 ┌──────────────────┐    │  │
│                           │                 │  RDS PostgreSQL  │    │  │
│                           │                 └──────────────────┘    │  │
│                           │                                         │  │
│                           │  ┌─────────┐                            │  │
│                           │  │   S3    │  (File uploads)            │  │
│                           │  └─────────┘                            │  │
│                           └─────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Runtime** | Node.js 20 |
| **Framework** | NestJS 11 |
| **Language** | TypeScript 5 |
| **Database** | PostgreSQL 16 |
| **ORM** | Prisma |
| **Authentication** | JWT (Passport.js) |
| **Validation** | class-validator |
| **API Documentation** | (TODO) Swagger/OpenAPI |
| **Containerization** | Docker |
| **Cloud** | AWS (ECS Fargate, RDS, S3, ALB) |
| **IaC** | Terraform |

---

## Getting Started

### Prerequisites

- **Docker** and **Docker Compose** (recommended)
- OR **Node.js 20+** and **pnpm** for local development
- **PostgreSQL 16** (if running locally without Docker)

### Option 1: Docker (Recommended)

The easiest way to run everything in containers.

#### A) Database Only + Local API (Best for Development)

```bash
# Start PostgreSQL in Docker
docker-compose up db -d

# Install dependencies locally
pnpm install

# Generate Prisma client
pnpm prisma generate

# Run database migrations
pnpm prisma migrate dev

# Start API with hot reload
pnpm run start:dev
```

#### B) Full Containerized Development (with Hot Reload)

```bash
# Runs PostgreSQL + API with volume mounts for hot reload
docker-compose --profile dev up
```

#### C) Full Production-like Build

```bash
# Builds and runs exactly what will deploy to AWS
docker-compose --profile full up --build
```

#### Docker Commands Summary

| Command | Description |
|---------|-------------|
| `docker-compose up db -d` | Start only PostgreSQL |
| `docker-compose --profile dev up` | Start DB + API with hot reload |
| `docker-compose --profile full up --build` | Start DB + API (production build) |
| `docker-compose down` | Stop all containers |
| `docker-compose down -v` | Stop and remove all data |
| `docker-compose logs -f` | View logs |
| `docker-compose logs -f api-dev` | View API logs only |

### Option 2: Local Development

If you prefer running everything locally without Docker:

```bash
# 1. Install dependencies
pnpm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your PostgreSQL connection string

# 3. Generate Prisma client
pnpm prisma generate

# 4. Run migrations
pnpm prisma migrate dev

# 5. (Optional) Seed database
pnpm prisma db seed

# 6. Start development server
pnpm run start:dev
```

The API will be available at: `http://localhost:3001/api`

---

## Project Structure

```
xseed-backend/
├── src/
│   ├── main.ts                      # Application entry point
│   ├── app.module.ts                # Root module
│   │
│   ├── common/                      # Shared utilities
│   │   ├── decorators/              # @Roles, @CurrentUser, @Public
│   │   ├── filters/                 # Exception filters
│   │   ├── guards/                  # JwtAuthGuard, RolesGuard
│   │   ├── interceptors/            # (TODO) Logging, transform
│   │   └── pipes/                   # Validation pipe
│   │
│   ├── config/                      # Configuration
│   │   ├── app.config.ts            # App settings (port, prefix)
│   │   ├── jwt.config.ts            # JWT secrets, expiry
│   │   └── aws.config.ts            # AWS/S3 settings
│   │
│   ├── modules/
│   │   ├── auth/                    # Authentication
│   │   │   ├── auth.controller.ts   # /auth endpoints
│   │   │   ├── auth.service.ts      # Login, register, refresh
│   │   │   ├── strategies/          # JWT Passport strategy
│   │   │   └── dto/                 # LoginDto, RegisterDto
│   │   │
│   │   ├── users/                   # User management (admin only)
│   │   ├── clients/                 # Client companies
│   │   ├── candidates/              # Candidate pool
│   │   ├── evaluations/             # Technical & cultural evaluations
│   │   ├── assessments/             # (TODO) Technical questions
│   │   ├── technical-profiles/      # (TODO) Role profiles
│   │   ├── technical-skills/        # (TODO) Skill definitions
│   │   └── files/                   # (TODO) S3 file uploads
│   │
│   └── prisma/                      # Database
│       ├── prisma.module.ts
│       └── prisma.service.ts
│
├── prisma/
│   ├── schema.prisma                # Database schema
│   └── migrations/                  # Migration files
│
├── packages/
│   └── types/                       # Shared TypeScript types
│       ├── src/
│       │   ├── index.ts
│       │   ├── user.ts
│       │   ├── candidate.ts
│       │   └── ...
│       └── package.json             # @xseed/types
│
├── test/                            # E2E tests
├── Dockerfile                       # Production container
├── docker-compose.yml               # Local development
├── .env.example                     # Environment template
└── package.json
```

---

## API Endpoints

Base URL: `http://localhost:3001/api`

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/register` | No | Register new user |
| `POST` | `/auth/login` | No | Login, get tokens |
| `POST` | `/auth/refresh` | No | Refresh access token |
| `POST` | `/auth/logout` | Yes | Invalidate refresh token |
| `GET` | `/auth/me` | Yes | Get current user |

### Users (Admin only)

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| `GET` | `/users` | Yes | Admin | List all users |
| `GET` | `/users/:id` | Yes | Admin | Get user by ID |
| `PATCH` | `/users/:id` | Yes | Admin | Update user |
| `DELETE` | `/users/:id` | Yes | Admin | Delete user |

### Clients

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| `GET` | `/clients` | Yes | Admin, Recruiter | List clients |
| `POST` | `/clients` | Yes | Admin | Create client |
| `GET` | `/clients/:id` | Yes | All | Get client |
| `PATCH` | `/clients/:id` | Yes | Admin | Update client |
| `DELETE` | `/clients/:id` | Yes | Admin | Delete client |

### Candidates

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| `GET` | `/candidates` | Yes | All* | List candidates |
| `POST` | `/candidates` | Yes | Admin, Recruiter | Create candidate |
| `GET` | `/candidates/:id` | Yes | All* | Get candidate |
| `PATCH` | `/candidates/:id` | Yes | Admin, Recruiter | Update candidate |
| `DELETE` | `/candidates/:id` | Yes | Admin | Delete candidate |

*Clients only see their own candidates

### Evaluations

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| `GET` | `/evaluations` | Yes | Admin, Recruiter | List evaluations |
| `POST` | `/evaluations` | Yes | Admin, Recruiter | Start evaluation |
| `GET` | `/evaluations/:id` | Yes | Admin, Recruiter | Get evaluation |
| `PATCH` | `/evaluations/:id` | Yes | Admin, Recruiter | Update status |
| `POST` | `/evaluations/:id/trigger` | Yes | Admin, Recruiter | Trigger processing |

### Query Parameters

List endpoints support:
- `page` - Page number (default: 1)
- `pageSize` - Items per page (default: 10)
- `search` - Search by name/email (candidates)
- `clientId` - Filter by client
- `seniorityLevel` - Filter by seniority

Example: `GET /api/candidates?page=1&pageSize=20&search=john`

---

## Database Schema

### Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    User     │       │   Client    │       │  Candidate  │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id          │       │ id          │◄──────│ clientId    │
│ email       │       │ name        │       │ name        │
│ passwordHash│       │ companySize │       │ email       │
│ firstName   │       │ teamSize    │       │ role        │
│ lastName    │       └─────────────┘       │ seniority   │
│ role        │              ▲              │ mustHave[]  │
│ clientId    │──────────────┘              │ niceToHave[]│
└─────────────┘                             └──────┬──────┘
       │                                           │
       ▼                                           ▼
┌─────────────┐                             ┌─────────────┐
│RefreshToken │                             │ Evaluation  │
├─────────────┤                             ├─────────────┤
│ id          │                             │ id          │
│ token       │                             │ candidateId │
│ userId      │                             │ techStatus  │
│ expiresAt   │                             │ cultStatus  │
└─────────────┘                             │ techAudio   │
                                            │ cultAudio   │
                                            │ techResult  │
                                            │ cultResult  │
                                            └─────────────┘
```

### Enums

```typescript
Role: ADMIN | RECRUITER | CLIENT

SeniorityLevel: JUNIOR | MID_LEVEL | SENIOR | LEAD | ARCHITECT

EvaluationStatus: PENDING | IN_QUEUE | EVALUATING | DONE | ERROR

JobStatus: OPEN | CLOSED | ON_HOLD

EmploymentType: FULL_TIME | PART_TIME | CONTRACT
```

---

## Authentication

### JWT Flow

```
1. LOGIN
   POST /auth/login { email, password }
   └── Returns: { accessToken, refreshToken, user }

2. AUTHENTICATED REQUEST
   Header: Authorization: Bearer <accessToken>
   └── JwtAuthGuard validates token
   └── RolesGuard checks permissions

3. TOKEN REFRESH (when accessToken expires)
   POST /auth/refresh { refreshToken }
   └── Returns: { accessToken }

4. LOGOUT
   POST /auth/logout
   └── Invalidates refreshToken in database
```

### Token Expiry

| Token | Default Expiry | Purpose |
|-------|----------------|---------|
| Access Token | 15 minutes | API authentication |
| Refresh Token | 7 days | Get new access tokens |

### Role-Based Access Control

| Permission | Admin | Recruiter | Client |
|------------|-------|-----------|--------|
| View Dashboard | ✓ | ✓ | ✗ |
| View All Candidates | ✓ | ✓ | Own only |
| Create Candidates | ✓ | ✓ | ✗ |
| View Evaluations | ✓ | ✓ | ✗ |
| Manage Users | ✓ | ✗ | ✗ |
| Manage Clients | ✓ | ✗ | ✗ |

---

## Environment Variables

```bash
# Application
NODE_ENV=development          # development | production
PORT=3001                     # API port
API_PREFIX=api                # URL prefix (/api)
FRONTEND_URL=http://localhost:3000  # CORS origin

# Database
DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public"

# JWT (min 32 characters each)
JWT_SECRET=your-super-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production
JWT_ACCESS_EXPIRES_IN=15m     # Access token expiry
JWT_REFRESH_EXPIRES_IN=7d     # Refresh token expiry

# AWS (for file uploads - optional)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=hr-platform-files
S3_SIGNED_URL_EXPIRY=3600     # Pre-signed URL expiry (seconds)
```

---

## Shared Types Package

The `packages/types` directory contains TypeScript types shared between frontend and backend.

### Installation (in frontend)

```bash
# Option 1: npm link (local development)
cd xseed-backend/packages/types
pnpm build
pnpm link

cd your-frontend
pnpm link @xseed/types

# Option 2: Publish to npm (production)
cd xseed-backend/packages/types
pnpm publish
```

### Usage

```typescript
import { User, Candidate, LoginRequest, PaginatedResponse } from '@xseed/types';

const response: PaginatedResponse<Candidate> = await api.get('/candidates');
```

### Available Types

- `User`, `LoginRequest`, `AuthResponse`
- `Candidate`, `CreateCandidateRequest`
- `JobOpening`, `CreateJobOpeningRequest`
- `Evaluation`, `EvaluationListItem`
- `Client`, `CreateClientRequest`
- `TechnicalQuestion`, `TechnicalProfile`, `TechnicalSkill`
- `PaginatedResponse<T>`, `ApiError`
- `Role`, `Permission`, `can()`

---

## Development Workflow

### Database Migrations

```bash
# Create a new migration after schema changes
pnpm prisma migrate dev --name add_new_field

# Apply migrations (production)
pnpm prisma migrate deploy

# Reset database (WARNING: deletes all data)
pnpm prisma migrate reset

# Open Prisma Studio (GUI)
pnpm prisma studio
```

### Code Generation

```bash
# Regenerate Prisma client after schema changes
pnpm prisma generate
```

### Testing

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Test coverage
pnpm test:cov
```

### Linting & Formatting

```bash
pnpm lint        # ESLint
pnpm format      # Prettier
```

---

## Deployment

### AWS ECS Fargate

The infrastructure is defined in Terraform (see [hr-platform-infrastructure](https://github.com/diegocastro0210/hr-platform-infrastructure)).

```bash
# Build Docker image
docker build -t xseed-api .

# Tag for ECR
docker tag xseed-api:latest <account>.dkr.ecr.<region>.amazonaws.com/xseed-api:latest

# Push to ECR
docker push <account>.dkr.ecr.<region>.amazonaws.com/xseed-api:latest
```

### CI/CD (GitHub Actions)

```yaml
# .github/workflows/deploy.yml (TODO)
on:
  push:
    branches: [main]

jobs:
  deploy:
    - Build Docker image
    - Push to ECR
    - Update ECS service
```

---

## Related Repositories

| Repository | Description |
|------------|-------------|
| [v0-next-js-app-router-frontend](https://github.com/diegocastro0210/v0-next-js-app-router-frontend) | Next.js frontend |
| [hr-platform-infrastructure](https://github.com/diegocastro0210/hr-platform-infrastructure) | Terraform AWS infrastructure |

---

## Future TODOs

- [ ] Complete remaining modules (assessments, technical-profiles, technical-skills, files)
- [ ] Add Swagger/OpenAPI documentation
- [ ] Implement S3 file uploads with pre-signed URLs
- [ ] Add WebSocket support for real-time evaluation updates
- [ ] Audio/file evaluation processing with SQS workers
- [ ] Add comprehensive test coverage
- [ ] Set up GitHub Actions CI/CD
- [ ] Add health check endpoint

---

## License

MIT
