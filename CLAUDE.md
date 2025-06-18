# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Centroid is an agent plaform for deploying software autonomous agents. It's built with FastAPI backend and Next.js frontend, featuring LLM integration and MCP (Model Context Protocol) server management.

## Development Commands

### Frontend (Next.js)

- `cd frontend && pnpm dev`: Start development server on localhost:3000
- `cd frontend && pnpm build`: Build production bundle
- `cd frontend && pnpm lint`: Run linting and Biome formatting
- `cd frontend && pnpm test`: Run Playwright e2e tests
- `cd frontend && pnpm db:migrate`: Run database migrations
- `cd frontend && pnpm db:studio`: Open Drizzle Studio

### Backend (FastAPI)

- `cd backend && uv run uvicorn app.main:app --reload`: Start development server on localhost:8000
- `cd backend && ./scripts/test.sh`: Run tests with coverage reporting
- `cd backend && ./scripts/lint.sh`: Run mypy type checking and ruff linting
- `cd backend && ./scripts/format.sh`: Format code with ruff
- `cd backend && uv run alembic upgrade head`: Run database migrations

### Full Stack Development

- `./start.sh`: Start both backend and frontend servers
- `docker-compose up`: Run full stack with Docker

## Architecture Overview

### Backend Structure

- **FastAPI REST API** with SQLAlchemy/SQLModel for database operations
- **MCP (Model Context Protocol) Integration**: Core feature for API server management via `app/mcp/`
  - `MCPManager`: Singleton for managing MCP server lifecycle
  - `MCPProxy`: Handles communication with external MCP servers
  - `queue_manager`: Redis-based queue system for MCP operations
- **Authentication**: JWT-based with NextAuth integration
- **Database**: Supports both SQLite (default) and PostgreSQL
- **LLM Integration**: OpenAI-compatible API support via configurable endpoints
- **Analytics**: Optional telemetry via Amplitude

### Frontend Structure

- **Next.js 15** with App Router and React Server Components
- **Authentication**: NextAuth.js integration with backend JWT tokens
- **AI Chat Interface**: Built on Vercel AI SDK with streaming responses
- **Document Management**: File upload/management with artifact system
- **MCP Server Management**: UI for configuring and monitoring MCP servers
- **State Management**: SWR for server state, NextAuth for authentication

### Key Data Models

- `Chat`/`Message`: Core chat functionality with LLM integration
- `Document`: File/artifact management with versioning
- `MCPServer`/`MCPTemplate`: MCP server configuration and templates
- `User`/`Team`: Multi-tenant user management
- `Project`: Workspace organization
- `Secret`: Encrypted environment variable storage

### MCP Integration Architecture

The MCP (Model Context Protocol) system is central to Centroid's API management:

- **Templates**: Pre-configured MCP server configurations (GitHub, AWS, etc.)
- **Servers**: Running instances of MCP servers with state management
- **Proxy Layer**: Handles communication between frontend and MCP servers
- **Queue System**: Redis-based async processing for MCP operations

## Code Conventions

### TypeScript/Frontend

- Use functional components with TypeScript interfaces (no enums, prefer maps)
- Follow mobile-first responsive design with Tailwind CSS
- Use SWR for all data fetching operations
- Implement proper error boundaries and loading states
- Use Zod for form validation and type safety

### Python/Backend

- Use Pydantic v2 for data validation and serialization
- Follow FastAPI patterns with dependency injection
- Use SQLModel for database models with proper relationships
- Implement proper async/await patterns for I/O operations
- Use pytest for testing with coverage reporting

### Database

- SQLModel for ORM with Alembic migrations
- Support for both SQLite (development) and PostgreSQL (production)
- Use proper foreign key relationships and cascading deletes
- Implement soft deletes where appropriate

## Environment Configuration

### Required Environment Variables

```bash
# LLM Configuration
LLM_BASE_URL=https://api.openai.com/v1
LLM_API_KEY=your_api_key
LLM_DEFAULT_MODEL=gpt-4o-mini

# Database (optional, defaults to SQLite)
DB_TYPE=sqlite  # or postgresql
POSTGRES_SERVER=localhost
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=centroid

# Authentication
FIRST_SUPERUSER=admin@example.com
FIRST_SUPERUSER_PASSWORD=secure_password
SECRET_KEY=your-secret-key

# Redis (for MCP queue system)
REDIS_HOST=localhost
REDIS_PORT=6379

# Optional
TELEMETRY_ENABLED=false
```

## Testing

### Backend Testing

- Use pytest with async support
- Test coverage reporting via coverage.py
- Fixtures in `tests/conftest.py` for database and auth setup
- Separate test modules for API routes, MCP functionality, and models

### Frontend Testing

- Playwright for end-to-end testing
- Tests cover chat functionality, authentication, and MCP management
- Test fixtures for API mocking and user sessions

## Key Development Notes

- The MCP system requires Redis for queue management in production
- File uploads are stored in `~/.centroid/uploads` by default
- Database files stored in `~/.centroid/app.db` for SQLite
- Frontend uses camelCase for API communication; backend uses snake_case
- All API routes are prefixed with `/api/v1`
- Authentication tokens expire after 8 days by default
- The system supports multi-tenant architecture via teams/projects
