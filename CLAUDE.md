# XSeed Backend - Claude Code Session Guide

This document provides context for Claude Code sessions working on this project.

## Golden Rules

**MANDATORY** - These rules must be followed in all sessions:

1. **Never relax lint/test rules to make CI pass.** Fix the actual code issues instead of:
   - Commenting out problematic code
   - Disabling ESLint rules broadly
   - Adding `@ts-ignore` or `eslint-disable` comments
   - Making validation rules more permissive

2. **Properly type all code.** Use TypeScript types and interfaces instead of `any`. Only exceptions:
   - `@typescript-eslint/no-unsafe-assignment` in test files (Jest matchers return `any`)
   - Underscore-prefixed variables for intentionally unused test setup

3. **All lint errors must be fixed properly.** If CI fails, investigate and fix the root cause.

## Project Overview

NestJS backend API for the HR Platform (XSeed). Provides REST API endpoints for user authentication, client management, candidate tracking, and evaluations.

## Quick Start

```bash
# Start everything in Docker
docker-compose --profile dev up -d

# View logs
docker logs -f xseed-api-dev

# Stop
docker-compose --profile dev down
```

API available at: `http://localhost:3001/api`

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| NestJS | 11.x | Framework |
| Prisma | 7.2.0 | ORM (with pg adapter) |
| PostgreSQL | 16 | Database |
| TypeScript | 5.x | Language |
| Docker | - | Containerization |

## Project Structure

```
xseed-backend/
├── src/
│   ├── main.ts                 # Bootstrap, CORS, Helmet, prefix
│   ├── app.module.ts           # Root module with global guards
│   ├── common/
│   │   ├── decorators/         # @Public, @Roles, @CurrentUser
│   │   ├── filters/            # AllExceptionsFilter
│   │   ├── guards/             # JwtAuthGuard, RolesGuard
│   │   └── pipes/              # CustomValidationPipe
│   ├── config/                 # app, jwt, aws configs
│   ├── modules/
│   │   ├── auth/               # JWT auth (register, login, refresh, logout)
│   │   ├── users/              # User CRUD (admin only)
│   │   ├── clients/            # Client companies
│   │   ├── candidates/         # Candidate pool with pagination
│   │   └── evaluations/        # Tech & cultural evaluations
│   └── prisma/                 # PrismaService with pg adapter
├── prisma/
│   ├── schema.prisma           # Database schema (no url in datasource)
│   └── migrations/             # Applied migrations
├── prisma.config.ts            # Prisma 7 config with datasource url
├── packages/types/             # Shared TypeScript types (@xseed/types)
├── docker-compose.yml          # PostgreSQL + API containers
└── Dockerfile                  # Production build
```

## Key Implementation Details

### Prisma 7 Configuration

Prisma 7 requires a different setup than previous versions:

1. **schema.prisma** - No `url` in datasource:
```prisma
datasource db {
  provider = "postgresql"
}
```

2. **prisma.config.ts** - Datasource URL here:
```typescript
export default defineConfig({
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
```

3. **PrismaService** - Uses pg adapter:
```typescript
constructor() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  super({ adapter });
  this.pool = pool;
}
```

### Authentication Flow

1. All routes protected by default (`JwtAuthGuard` global)
2. Use `@Public()` decorator for public routes
3. Use `@Roles('ADMIN')` for role-based access
4. Access current user with `@CurrentUser()` decorator

```typescript
@Public()
@Post('login')
async login(@Body() dto: LoginDto) { ... }

@Roles('ADMIN')
@Get('users')
async getUsers() { ... }

@Get('me')
async getMe(@CurrentUser() user: User) { ... }
```

### JWT Configuration

NestJS JWT v11 requires numeric `expiresIn` (seconds), not string:

```typescript
// Correct
expiresIn: 900  // 15 minutes

// Wrong (causes TypeScript errors)
expiresIn: '15m'
```

### Database Schema

Key models:
- **User** - email, passwordHash, role (ADMIN/RECRUITER/CLIENT), optional clientId
- **Client** - company info
- **Candidate** - linked to client, has mustHaveStack/niceToHaveStack arrays
- **Evaluation** - linked to candidate, technicalStatus/culturalStatus
- **RefreshToken** - for JWT refresh flow

Enums: `Role`, `SeniorityLevel`, `EvaluationStatus`, `JobStatus`, `EmploymentType`

## API Endpoints

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| POST | /api/auth/register | No | - | Register user |
| POST | /api/auth/login | No | - | Login |
| POST | /api/auth/refresh | No | - | Refresh token |
| POST | /api/auth/logout | Yes | All | Logout |
| GET | /api/auth/me | Yes | All | Current user |
| GET | /api/users | Yes | Admin | List users |
| GET | /api/users/:id | Yes | Admin | Get user |
| PATCH | /api/users/:id | Yes | Admin | Update user |
| DELETE | /api/users/:id | Yes | Admin | Delete user |
| POST | /api/clients | Yes | Admin | Create client |
| GET | /api/clients | Yes | Admin,Recruiter | List clients |
| GET | /api/clients/:id | Yes | All | Get client |
| PATCH | /api/clients/:id | Yes | Admin | Update client |
| DELETE | /api/clients/:id | Yes | Admin | Delete client |
| POST | /api/candidates | Yes | Admin,Recruiter | Create candidate |
| GET | /api/candidates | Yes | All | List (paginated) |
| GET | /api/candidates/:id | Yes | All | Get candidate |
| PATCH | /api/candidates/:id | Yes | Admin,Recruiter | Update |
| DELETE | /api/candidates/:id | Yes | Admin | Delete |
| POST | /api/evaluations | Yes | Admin,Recruiter | Start evaluation |
| GET | /api/evaluations | Yes | Admin,Recruiter | List evaluations |
| GET | /api/evaluations/:id | Yes | Admin,Recruiter | Get evaluation |
| PATCH | /api/evaluations/:id | Yes | Admin,Recruiter | Update status |
| POST | /api/evaluations/:id/trigger | Yes | Admin,Recruiter | Trigger processing |

## Environment Variables

```bash
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://postgres:postgres@db:5432/hr_platform?schema=public
JWT_SECRET=your-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
FRONTEND_URL=http://localhost:3000
```

## Docker Commands

```bash
# Database only (for local dev)
docker-compose up db -d

# Full dev environment with hot reload
docker-compose --profile dev up -d

# Production-like build
docker-compose --profile full up --build

# Run migrations in container
docker exec xseed-api-dev pnpm prisma migrate dev --name migration_name

# Open Prisma Studio
docker exec -it xseed-api-dev pnpm prisma studio
```

## Current State (as of 2025-12-30)

### Completed
- [x] NestJS project setup with TypeScript
- [x] Prisma 7 with PostgreSQL adapter
- [x] JWT authentication (register, login, refresh, logout)
- [x] Role-based access control (ADMIN, RECRUITER, CLIENT)
- [x] Users module (CRUD, admin only)
- [x] Clients module (CRUD)
- [x] Candidates module (CRUD with pagination)
- [x] Evaluations module (CRUD with trigger endpoint)
- [x] Docker Compose setup (db, dev, full profiles)
- [x] Shared types package (@xseed/types)
- [x] Initial migration applied
- [x] All endpoints tested and working

### TODO - Not Yet Implemented
- [ ] Job Openings module
- [ ] Technical Questions module
- [ ] Technical Profiles module
- [ ] Technical Skills module
- [ ] Files module (S3 uploads)
- [ ] Swagger/OpenAPI documentation
- [ ] Unit tests
- [ ] E2E tests
- [ ] GitHub Actions CI/CD
- [ ] AWS ECS deployment
- [ ] Frontend integration

## Related Repositories

| Repo | Purpose |
|------|---------|
| v0-next-js-app-router-frontend | Next.js frontend (has mocked data to replace) |
| hr-platform-infrastructure | Terraform AWS modules (partial) |

## Testing the API

```bash
# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@xseed.com","password":"Admin1234","firstName":"Admin","lastName":"User","role":"ADMIN"}'

# Login (copy accessToken from response)
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@xseed.com","password":"Admin1234"}'

# Authenticated request
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Create client
curl -X POST http://localhost:3001/api/clients \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Acme Corp","companySize":"100-500"}'

# Create candidate
curl -X POST http://localhost:3001/api/candidates \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","role":"Engineer","seniorityLevel":"SENIOR","clientId":"CLIENT_ID","mustHaveStack":["TypeScript"],"niceToHaveStack":["AWS"]}'
```

## Common Issues & Solutions

### 1. Prisma ESM Error
If you see `ERR_REQUIRE_ESM` with Prisma 7, ensure:
- `prisma.config.ts` exists with `datasource.url`
- Schema has no `url` in datasource block
- Using `@prisma/adapter-pg` and `pg` packages

### 2. JWT TypeScript Errors
NestJS JWT v11 changed types. Use numeric seconds:
```typescript
expiresIn: 900  // Not '15m'
```

### 3. Docker Network Issues
```bash
docker-compose down --volumes --remove-orphans
docker network prune -f
docker-compose --profile dev up -d
```

### 4. pnpm Build Scripts Ignored
Create `.npmrc` and `.pnpm-buildables.yaml` or run `pnpm approve-builds`

## Architecture Decisions

1. **Separate repos** - Backend, frontend, and infrastructure in different repos
2. **Shared types** - `@xseed/types` package for type safety across repos
3. **Prisma 7** - Latest version with driver adapters for better flexibility
4. **JWT refresh tokens** - Stored in database for revocation capability
5. **Global guards** - All routes protected by default, opt-out with @Public()
6. **Docker profiles** - Flexible development setups (db-only, dev, full)

## Next Steps for New Session

1. **If continuing backend**: Implement remaining modules (job-openings, files, etc.)
2. **If integrating frontend**: Update v0-next-js-app-router-frontend to use real API
3. **If deploying**: Complete hr-platform-infrastructure Terraform modules
