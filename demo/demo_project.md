# TaskFlow - Modern Project Management System

> A lightweight, fast, and extensible project management platform built with modern web technologies.

**Version:** 2.1.0
**License:** MIT
**Status:** Production Ready

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Changelog](#changelog)

---

## Overview

TaskFlow is a next-generation project management system designed for modern development teams. It combines powerful task tracking with real-time collaboration, intuitive UI, and extensive API for integrations.

### Why TaskFlow?

- **Fast**: Built with performance in mind, handles 10,000+ tasks effortlessly
- **Flexible**: Customizable workflows and board layouts
- **Collaborative**: Real-time updates and team synchronization
- **Extensible**: Plugin architecture and comprehensive REST API
- **Modern**: Built with TypeScript, React, and Go

### Architecture Overview

```
┌─────────────────────────────────────────┐
│          Frontend (React)               │
│  src/components/ | src/hooks/           │
└──────────────┬──────────────────────────┘
               │ REST API / WebSocket
┌──────────────▼──────────────────────────┐
│       API Gateway (Go)                  │
│       src/api/gateway.go                │
└──────────────┬──────────────────────────┘
               │
    ┌──────────┼──────────┐
    ▼          ▼          ▼
┌─────────┐ ┌─────────┐ ┌─────────┐
│ Auth    │ │ Tasks   │ │ Users   │
│ Service │ │ Service │ │ Service │
└─────────┘ └─────────┘ └─────────┘
```

## Features

### Core Functionality

- [x] **Task Management** - Create, edit, delete, and organize tasks
- [x] **Kanban Boards** - Visual workflow with drag-and-drop
- [x] **Sprint Planning** - Agile sprint management and tracking
- [x] **Time Tracking** - Built-in time logging and reporting
- [x] **Team Collaboration** - Real-time updates and comments
- [x] **File Attachments** - Upload and manage task attachments
- [ ] **Advanced Reporting** - Custom dashboards and analytics (v2.2)
- [ ] **Mobile Apps** - Native iOS and Android apps (v3.0)

### Technical Features

| Feature | Technology | Status | File Reference |
|---------|-----------|--------|----------------|
| Frontend | React 18 + TypeScript | ✅ Production | `src/frontend/` |
| Backend | Go 1.21 | ✅ Production | `src/backend/` |
| Database | PostgreSQL 15 | ✅ Production | `migrations/` |
| Cache | Redis 7 | ✅ Production | `config/redis.conf` |
| Search | Elasticsearch 8 | ✅ Production | `config/elasticsearch.yml` |
| Queue | RabbitMQ | ✅ Production | `src/queue/` |

## Installation

### Prerequisites

- Node.js 18+ and npm 9+
- Go 1.21+
- PostgreSQL 15+
- Redis 7+
- Docker and Docker Compose (optional)

### Quick Install

```bash
# Clone the repository
git clone https://github.com/company/taskflow.git
cd taskflow

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
go mod download

# Setup database
createdb taskflow
npm run migrate:up

# Start development servers
npm run dev
```

### Docker Installation

```bash
# Using Docker Compose
docker-compose up -d

# Access the application
open http://localhost:3000
```

See `docker-compose.yml` and `Dockerfile` for configuration details.

## Quick Start

### 1. Create Your First Project

```typescript
import { TaskflowClient } from 'taskflow-sdk';

const client = new TaskflowClient({
  apiKey: process.env.TASKFLOW_API_KEY,
  baseURL: 'https://api.taskflow.io'
});

// Create a new project
const project = await client.projects.create({
  name: 'Q1 2024 Launch',
  description: 'Product launch planning',
  team: ['user-1', 'user-2', 'user-3']
});

console.log(`Project created: ${project.id}`);
```

### 2. Add Tasks

```typescript
// Create a task
const task = await client.tasks.create({
  projectId: project.id,
  title: 'Design landing page',
  description: 'Create responsive landing page mockups',
  assignee: 'user-1',
  priority: 'high',
  dueDate: '2024-03-15'
});

// Update task status
await client.tasks.update(task.id, {
  status: 'in-progress'
});
```

### 3. Set Up Webhooks

```typescript
// Subscribe to task events
await client.webhooks.create({
  url: 'https://your-app.com/webhooks/taskflow',
  events: ['task.created', 'task.updated', 'task.deleted'],
  secret: 'your-webhook-secret'
});
```

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```bash
# Application
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/taskflow
DATABASE_POOL_SIZE=20

# Redis
REDIS_URL=redis://localhost:6379
REDIS_TTL=3600

# Authentication
JWT_SECRET=your-secret-key-here
JWT_EXPIRY=86400
SESSION_SECRET=another-secret-key

# External Services
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key

# Storage
S3_BUCKET=taskflow-uploads
S3_REGION=us-west-2
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

### Application Configuration

Edit `config/app.yaml`:

```yaml
app:
  name: TaskFlow
  version: 2.1.0
  environment: production

server:
  host: 0.0.0.0
  port: 3000
  timeout: 30s
  max_body_size: 10MB

database:
  pool_size: 20
  max_idle_time: 5m
  max_lifetime: 1h

features:
  enable_websockets: true
  enable_file_uploads: true
  enable_email_notifications: true
  max_file_size: 50MB
  allowed_file_types:
    - pdf
    - png
    - jpg
    - jpeg
    - gif
    - doc
    - docx

rate_limiting:
  enabled: true
  requests_per_minute: 100
  burst: 20
```

See `config/app.example.yaml` for all available options.

## API Reference

### Authentication

All API requests require authentication using a JWT token or API key.

```bash
# Using JWT token
curl -H "Authorization: Bearer <token>" \
  https://api.taskflow.io/v1/projects

# Using API key
curl -H "X-API-Key: <api-key>" \
  https://api.taskflow.io/v1/projects
```

### Projects API

#### List Projects

```http
GET /v1/projects
```

**Response:**

```json
{
  "data": [
    {
      "id": "proj_123",
      "name": "Q1 2024 Launch",
      "description": "Product launch planning",
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-02-10T15:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 1
  }
}
```

#### Create Project

```http
POST /v1/projects
Content-Type: application/json

{
  "name": "New Project",
  "description": "Project description",
  "team": ["user-1", "user-2"]
}
```

### Tasks API

#### Create Task

```http
POST /v1/tasks
Content-Type: application/json

{
  "project_id": "proj_123",
  "title": "Implement feature X",
  "description": "Detailed description",
  "assignee": "user-1",
  "priority": "high",
  "due_date": "2024-03-15"
}
```

#### Update Task

```http
PATCH /v1/tasks/:id
Content-Type: application/json

{
  "status": "in-progress",
  "priority": "urgent"
}
```

#### Search Tasks

```http
GET /v1/tasks/search?q=design&status=open&assignee=user-1
```

### WebSocket Events

Connect to `wss://api.taskflow.io/v1/ws` for real-time updates.

**Event Types:**

| Event | Payload | Description |
|-------|---------|-------------|
| `task.created` | `{ task: Task }` | New task created |
| `task.updated` | `{ task: Task, changes: object }` | Task updated |
| `task.deleted` | `{ taskId: string }` | Task deleted |
| `comment.added` | `{ taskId: string, comment: Comment }` | New comment |

**Example:**

```javascript
const ws = new WebSocket('wss://api.taskflow.io/v1/ws');

ws.on('open', () => {
  ws.send(JSON.stringify({
    type: 'subscribe',
    channels: ['project:proj_123']
  }));
});

ws.on('message', (data) => {
  const event = JSON.parse(data);
  console.log('Event:', event.type, event.payload);
});
```

Full API documentation: [docs/api.md](docs/api.md)

## Development

### Project Structure

```
taskflow/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom hooks
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   └── utils/           # Utility functions
│   ├── public/              # Static assets
│   └── package.json
├── backend/                 # Go backend
│   ├── cmd/                 # Entry points
│   ├── internal/            # Internal packages
│   │   ├── api/            # API handlers
│   │   ├── auth/           # Authentication
│   │   ├── db/             # Database layer
│   │   └── models/         # Data models
│   ├── pkg/                # Public packages
│   └── go.mod
├── migrations/              # Database migrations
├── config/                  # Configuration files
├── docs/                    # Documentation
├── tests/                   # Integration tests
├── scripts/                 # Build and deployment scripts
├── docker-compose.yml
├── Dockerfile
└── README.md
```

### Development Workflow

1. **Create a feature branch**

```bash
git checkout -b feature/awesome-feature
```

2. **Make changes and test**

```bash
# Run frontend dev server
cd frontend && npm run dev

# Run backend server
cd backend && go run cmd/server/main.go

# Run tests
npm test
go test ./...
```

3. **Format and lint**

```bash
# Frontend
npm run lint
npm run format

# Backend
gofmt -w .
golangci-lint run
```

4. **Commit changes**

```bash
git add .
git commit -m "feat: add awesome feature"
```

See `CONTRIBUTING.md` for detailed guidelines.

### Building for Production

```bash
# Build frontend
cd frontend
npm run build

# Build backend binary
cd backend
go build -o bin/taskflow cmd/server/main.go

# Create Docker image
docker build -t taskflow:latest .
```

## Testing

### Unit Tests

```bash
# Frontend unit tests
cd frontend
npm test

# Backend unit tests
cd backend
go test ./internal/... -v -cover
```

### Integration Tests

```bash
# Run integration test suite
npm run test:integration

# Run specific test file
go test ./tests/integration/api_test.go -v
```

### E2E Tests

```bash
# Run Playwright tests
cd frontend
npm run test:e2e

# Run specific test
npm run test:e2e -- tasks.spec.ts
```

Test configuration: `tests/config.yaml`
Test fixtures: `tests/fixtures/`
Test utilities: `tests/helpers.ts`

## Deployment

### Production Deployment

**Using Docker Compose:**

```bash
# Production deployment
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker-compose logs -f

# Scale services
docker-compose up -d --scale api=3
```

**Using Kubernetes:**

```bash
# Apply configurations
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -n taskflow

# View logs
kubectl logs -f deployment/taskflow-api -n taskflow
```

See `k8s/README.md` for Kubernetes deployment guide.

### Environment-Specific Configuration

- **Development**: `config/dev.yaml`
- **Staging**: `config/staging.yaml`
- **Production**: `config/production.yaml`

### Health Checks

```bash
# Application health
curl http://localhost:3000/health

# Database connection
curl http://localhost:3000/health/db

# Redis connection
curl http://localhost:3000/health/redis
```

## Contributing

We welcome contributions! Please see `CONTRIBUTING.md` for guidelines.

### Reporting Issues

Found a bug? Please [open an issue](https://github.com/company/taskflow/issues) with:

- Clear description
- Steps to reproduce
- Expected vs actual behavior
- System information
- Relevant logs from `logs/app.log`

### Pull Request Process

1. Fork the repository
2. Create your feature branch
3. Add tests for new features
4. Ensure all tests pass
5. Update documentation
6. Submit pull request

## Changelog

See `CHANGELOG.md` for version history and release notes.

### Recent Updates

**v2.1.0** (2024-02-10)
- Added WebSocket support for real-time updates
- Improved search performance with Elasticsearch
- New file attachment system
- See full release notes: `docs/releases/v2.1.0.md`

**v2.0.0** (2024-01-15)
- Complete UI redesign
- Migrated to TypeScript
- Added API rate limiting
- Breaking changes: see `docs/migration/v2.md`

---

## Support

- **Documentation**: [docs.taskflow.io](https://docs.taskflow.io)
- **Email**: support@taskflow.io
- **Discord**: [discord.gg/taskflow](https://discord.gg/taskflow)
- **Stack Overflow**: Tag questions with `taskflow`

## License

MIT License - see `LICENSE` file for details.

Copyright (c) 2024 TaskFlow Team
