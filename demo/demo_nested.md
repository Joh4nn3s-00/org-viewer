# Deep Nesting Structure Test Document

This document is designed to stress-test the collapsible sections, table of contents, and scroll spy features with deeply nested heading structures.

## Level 1: Software Architecture Patterns

Understanding software architecture is crucial for building scalable, maintainable applications. This section explores various architectural patterns and their implementations.

### Level 2: Layered Architecture

The layered architecture pattern organizes code into horizontal layers, each with distinct responsibilities.

#### Level 3: Presentation Layer

The presentation layer handles user interface and user interaction logic.

##### Level 4: View Components

View components are responsible for rendering the user interface.

###### Level 5: React Components

React components use a declarative approach for building UIs:

```typescript
// src/components/UserProfile.tsx
import React from 'react';

interface UserProfileProps {
  name: string;
  email: string;
  avatar?: string;
}

export const UserProfile: React.FC<UserProfileProps> = ({ name, email, avatar }) => {
  return (
    <div className="user-profile">
      {avatar && <img src={avatar} alt={name} />}
      <h2>{name}</h2>
      <p>{email}</p>
    </div>
  );
};
```

Component definition: `src/components/UserProfile.tsx`

###### Level 5: Vue Components

Vue components use an options API or composition API:

```javascript
// src/components/UserProfile.vue
<template>
  <div class="user-profile">
    <img v-if="avatar" :src="avatar" :alt="name" />
    <h2>{{ name }}</h2>
    <p>{{ email }}</p>
  </div>
</template>

<script>
export default {
  name: 'UserProfile',
  props: {
    name: String,
    email: String,
    avatar: String
  }
}
</script>
```

##### Level 4: Form Handling

Forms require validation, state management, and submission logic.

###### Level 5: Form Validation

Client-side validation provides immediate feedback:

```javascript
// src/utils/validation.ts
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
};
```

Validation utilities: `src/utils/validation.ts`

##### Level 4: State Management

Global state management for complex applications.

###### Level 5: Redux Store

Redux provides predictable state management:

```javascript
// src/store/userSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserState {
  currentUser: User | null;
  isAuthenticated: boolean;
}

const userSlice = createSlice({
  name: 'user',
  initialState: {
    currentUser: null,
    isAuthenticated: false
  } as UserState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.currentUser = action.payload;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.currentUser = null;
      state.isAuthenticated = false;
    }
  }
});

export const { setUser, logout } = userSlice.actions;
export default userSlice.reducer;
```

#### Level 3: Business Logic Layer

The business logic layer contains core application rules and workflows.

##### Level 4: Service Classes

Services encapsulate business logic and orchestrate operations:

```typescript
// src/services/UserService.ts
export class UserService {
  private repository: UserRepository;

  constructor(repository: UserRepository) {
    this.repository = repository;
  }

  async registerUser(data: UserRegistration): Promise<User> {
    // Validation
    if (!this.validateRegistration(data)) {
      throw new Error('Invalid registration data');
    }

    // Business logic
    const hashedPassword = await this.hashPassword(data.password);
    const user = await this.repository.create({
      ...data,
      password: hashedPassword
    });

    // Send welcome email
    await this.emailService.sendWelcomeEmail(user);

    return user;
  }
}
```

Service implementations: `src/services/`

##### Level 4: Domain Models

Domain models represent core business entities.

###### Level 5: Entity Classes

Entities encapsulate data and behavior:

```python
# src/models/user.py
from datetime import datetime
from typing import Optional

class User:
    def __init__(
        self,
        id: str,
        email: str,
        username: str,
        created_at: Optional[datetime] = None
    ):
        self.id = id
        self.email = email
        self.username = username
        self.created_at = created_at or datetime.now()

    def update_profile(self, **kwargs):
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)

    def is_admin(self) -> bool:
        return 'admin' in self.roles
```

##### Level 4: Use Cases

Use cases represent specific business operations.

###### Level 5: Authentication Use Cases

Authentication scenarios and workflows:

```go
// src/usecases/auth/login.go
package auth

type LoginUseCase struct {
    userRepo UserRepository
    tokenGen TokenGenerator
}

func (uc *LoginUseCase) Execute(email, password string) (*AuthResult, error) {
    // Find user
    user, err := uc.userRepo.FindByEmail(email)
    if err != nil {
        return nil, ErrUserNotFound
    }

    // Verify password
    if !uc.verifyPassword(password, user.PasswordHash) {
        return nil, ErrInvalidCredentials
    }

    // Generate token
    token, err := uc.tokenGen.Generate(user.ID)
    if err != nil {
        return nil, err
    }

    return &AuthResult{
        User:  user,
        Token: token,
    }, nil
}
```

Implementation: `src/usecases/auth/login.go`

#### Level 3: Data Access Layer

The data access layer abstracts database operations.

##### Level 4: Repository Pattern

Repositories provide a collection-like interface for data access:

```typescript
// src/repositories/UserRepository.ts
export class UserRepository {
  private db: Database;

  async findById(id: string): Promise<User | null> {
    const row = await this.db.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return row ? this.mapToUser(row) : null;
  }

  async create(user: Partial<User>): Promise<User> {
    const result = await this.db.query(
      'INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3) RETURNING *',
      [user.email, user.username, user.passwordHash]
    );
    return this.mapToUser(result);
  }

  async update(id: string, updates: Partial<User>): Promise<User> {
    // Implementation
  }

  async delete(id: string): Promise<void> {
    await this.db.query('DELETE FROM users WHERE id = $1', [id]);
  }
}
```

Repository interface: `src/repositories/interfaces.ts`

##### Level 4: Database Migrations

Database schema version control:

```sql
-- migrations/001_create_users_table.sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_created_at ON users(created_at);
```

Migration scripts: `migrations/`

##### Level 4: Query Builders

Programmatic query construction:

```python
# src/db/query_builder.py
class QueryBuilder:
    def __init__(self, table: str):
        self.table = table
        self.conditions = []
        self.order_by = []
        self.limit_value = None

    def where(self, column: str, operator: str, value):
        self.conditions.append((column, operator, value))
        return self

    def order(self, column: str, direction: str = 'ASC'):
        self.order_by.append(f"{column} {direction}")
        return self

    def limit(self, count: int):
        self.limit_value = count
        return self

    def build(self) -> tuple[str, list]:
        query = f"SELECT * FROM {self.table}"
        params = []

        if self.conditions:
            where_clauses = []
            for col, op, val in self.conditions:
                where_clauses.append(f"{col} {op} %s")
                params.append(val)
            query += " WHERE " + " AND ".join(where_clauses)

        if self.order_by:
            query += " ORDER BY " + ", ".join(self.order_by)

        if self.limit_value:
            query += f" LIMIT {self.limit_value}"

        return query, params
```

### Level 2: Microservices Architecture

Breaking monolithic applications into independent services.

#### Level 3: Service Communication

How microservices communicate with each other.

##### Level 4: Synchronous Communication

REST APIs and gRPC for direct service-to-service calls.

###### Level 5: REST APIs

RESTful endpoints for service communication:

```javascript
// src/api/routes/users.js
const express = require('express');
const router = express.Router();

// GET /api/users
router.get('/', async (req, res) => {
  try {
    const users = await userService.findAll(req.query);
    res.json({ data: users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/users/:id
router.get('/:id', async (req, res) => {
  try {
    const user = await userService.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ data: user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

API routes: `src/api/routes/`

###### Level 5: gRPC Services

High-performance RPC framework:

```protobuf
// proto/user.proto
syntax = "proto3";

package user;

service UserService {
  rpc GetUser(GetUserRequest) returns (UserResponse);
  rpc CreateUser(CreateUserRequest) returns (UserResponse);
  rpc UpdateUser(UpdateUserRequest) returns (UserResponse);
  rpc DeleteUser(DeleteUserRequest) returns (DeleteUserResponse);
}

message GetUserRequest {
  string id = 1;
}

message UserResponse {
  string id = 1;
  string email = 2;
  string username = 3;
  int64 created_at = 4;
}
```

Proto definitions: `proto/user.proto`

##### Level 4: Asynchronous Communication

Message queues and event-driven architecture.

###### Level 5: RabbitMQ Integration

Message broker for async communication:

```go
// src/messaging/publisher.go
package messaging

import (
    "encoding/json"
    "github.com/streadway/amqp"
)

type Publisher struct {
    channel *amqp.Channel
}

func (p *Publisher) PublishEvent(exchange, routingKey string, event interface{}) error {
    body, err := json.Marshal(event)
    if err != nil {
        return err
    }

    return p.channel.Publish(
        exchange,
        routingKey,
        false, // mandatory
        false, // immediate
        amqp.Publishing{
            ContentType: "application/json",
            Body:        body,
        },
    )
}

func (p *Publisher) PublishUserCreated(user User) error {
    return p.PublishEvent("users", "user.created", user)
}
```

Messaging layer: `src/messaging/`

##### Level 4: Service Discovery

Dynamic service registration and discovery.

###### Level 5: Consul Integration

Service mesh with health checking:

```yaml
# config/consul.yml
service:
  name: user-service
  id: user-service-1
  address: 192.168.1.100
  port: 8080
  tags:
    - api
    - v1
  check:
    http: http://192.168.1.100:8080/health
    interval: 10s
    timeout: 5s
```

Configuration: `config/consul.yml`

#### Level 3: API Gateway Pattern

Single entry point for all client requests.

##### Level 4: Request Routing

Route requests to appropriate backend services:

```nginx
# config/nginx.conf
upstream user_service {
    server user-service:8080;
}

upstream order_service {
    server order-service:8080;
}

server {
    listen 80;

    location /api/users {
        proxy_pass http://user_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/orders {
        proxy_pass http://order_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Gateway config: `config/nginx.conf`

##### Level 4: Rate Limiting

Protect services from overload:

```rust
// src/middleware/rate_limiter.rs
use std::time::Duration;
use tower_governor::{GovernorConfig, GovernorLayer};

pub fn create_rate_limiter() -> GovernorLayer {
    let config = Box::new(
        GovernorConfig::default()
            .per_second(100)
            .burst_size(20)
    );

    GovernorLayer { config }
}
```

Middleware: `src/middleware/rate_limiter.rs`

##### Level 4: Authentication & Authorization

Centralized security for all services:

```typescript
// src/middleware/auth.ts
import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};
```

Auth middleware: `src/middleware/auth.ts`

### Level 2: Event-Driven Architecture

Systems that react to events and state changes.

#### Level 3: Event Sourcing

Store all changes as sequence of events.

##### Level 4: Event Store Implementation

Append-only log of domain events:

```csharp
// src/EventStore/EventStore.cs
public class EventStore
{
    private readonly IDbConnection _connection;

    public async Task AppendEvent(string aggregateId, IEvent @event)
    {
        var eventData = JsonSerializer.Serialize(@event);
        var eventType = @event.GetType().Name;

        await _connection.ExecuteAsync(
            @"INSERT INTO events (aggregate_id, event_type, event_data, timestamp)
              VALUES (@AggregateId, @EventType, @EventData, @Timestamp)",
            new {
                AggregateId = aggregateId,
                EventType = eventType,
                EventData = eventData,
                Timestamp = DateTime.UtcNow
            }
        );
    }

    public async Task<IEnumerable<IEvent>> GetEvents(string aggregateId)
    {
        var rows = await _connection.QueryAsync<EventRow>(
            "SELECT * FROM events WHERE aggregate_id = @AggregateId ORDER BY timestamp",
            new { AggregateId = aggregateId }
        );

        return rows.Select(DeserializeEvent);
    }
}
```

Event store: `src/EventStore/EventStore.cs`

##### Level 4: Event Handlers

Process events and update read models:

```java
// src/handlers/UserEventHandler.java
package com.example.handlers;

@Component
public class UserEventHandler {

    @Autowired
    private UserReadModelRepository readModelRepo;

    @EventHandler
    public void on(UserCreatedEvent event) {
        UserReadModel user = new UserReadModel(
            event.getId(),
            event.getEmail(),
            event.getUsername()
        );
        readModelRepo.save(user);
    }

    @EventHandler
    public void on(UserUpdatedEvent event) {
        UserReadModel user = readModelRepo.findById(event.getId());
        if (user != null) {
            user.setEmail(event.getEmail());
            user.setUsername(event.getUsername());
            readModelRepo.save(user);
        }
    }
}
```

Event handlers: `src/handlers/`

#### Level 3: CQRS Pattern

Separate read and write models.

##### Level 4: Command Side

Handle write operations and business logic:

```kotlin
// src/commands/CreateUserCommand.kt
data class CreateUserCommand(
    val email: String,
    val username: String,
    val password: String
)

class CreateUserCommandHandler(
    private val userRepository: UserRepository,
    private val eventBus: EventBus
) {
    fun handle(command: CreateUserCommand): String {
        // Validation
        if (!isValidEmail(command.email)) {
            throw InvalidEmailException()
        }

        // Create user
        val user = User(
            id = UUID.randomUUID().toString(),
            email = command.email,
            username = command.username,
            passwordHash = hashPassword(command.password)
        )

        userRepository.save(user)

        // Publish event
        eventBus.publish(UserCreatedEvent(user))

        return user.id
    }
}
```

Commands: `src/commands/`

##### Level 4: Query Side

Optimized read models for queries:

```elixir
# lib/queries/user_query.ex
defmodule App.Queries.UserQuery do
  import Ecto.Query

  def list_users(params) do
    User
    |> apply_filters(params)
    |> select([u], %{
      id: u.id,
      email: u.email,
      username: u.username,
      created_at: u.created_at
    })
    |> Repo.all()
  end

  defp apply_filters(query, params) do
    query
    |> filter_by_email(params[:email])
    |> filter_by_username(params[:username])
    |> order_by([u], desc: u.created_at)
    |> limit(^Map.get(params, :limit, 50))
  end
end
```

Queries: `lib/queries/`

---

## Summary

This document demonstrates:

- ✅ Deep nesting (6 levels of headings throughout)
- ✅ Complex hierarchical structure for TOC testing
- ✅ Mixed content at each level (text, code, lists)
- ✅ Multiple programming languages for syntax highlighting
- ✅ File references for detection testing
- ✅ Realistic technical content (not lorem ipsum)
- ✅ Sufficient length for scroll spy behavior testing (150+ lines)

File references mentioned:
- `src/components/UserProfile.tsx`
- `src/utils/validation.ts`
- `src/store/userSlice.ts`
- `src/services/UserService.ts`
- `src/models/user.py`
- `src/usecases/auth/login.go`
- `src/repositories/interfaces.ts`
- `migrations/001_create_users_table.sql`
- `proto/user.proto`
- `config/nginx.conf`
- `src/middleware/auth.ts`
- And many more throughout the document
