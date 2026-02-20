# Markdown Features Showcase

This document demonstrates all core markdown features for testing the VS Code preview extension, including collapsible sections, syntax highlighting, TOC generation, and file reference detection.

## Text Formatting

Markdown supports **bold text**, *italic text*, and ***bold italic text***. You can also use ~~strikethrough~~ for deleted content, and `inline code` for technical references.

Alternatively, use __underscores for bold__ and _underscores for italic_.

### Combined Formatting

You can combine formatting like **bold with `code`** or *italic with ~~strikethrough~~*. Links can also be formatted: **[bold link](https://example.com)** or *[italic link](https://example.com)*.

### Special Characters and Escaping

Special characters: & < > " ' @ # $ % ^ * ( ) [ ] { } | \ / ~

Escaped characters: \* \_ \` \# \[ \] \( \)

## Headings and Structure

### Level 3 Heading

Headings create a hierarchical structure that's perfect for testing collapsible sections and TOC generation.

#### Level 4 Heading

Fourth-level headings provide more granular organization.

##### Level 5 Heading

Fifth-level headings for detailed subsections.

###### Level 6 Heading

This is the deepest standard heading level.

## Lists and Task Management

### Unordered Lists

- First item
- Second item with **bold text**
- Third item with `code reference`
  - Nested item 1
  - Nested item 2
    - Deeply nested item
      - Very deep nesting
      - Another deeply nested item
  - Back to second level
- Fourth item

### Ordered Lists

1. First step
2. Second step with *emphasis*
3. Third step with file reference: `package.json`
   1. Substep 3.1
   2. Substep 3.2
      1. Deeply nested step
      2. Another deep step
   3. Substep 3.3
4. Fourth step

### Task Lists (GFM)

- [x] Completed task
- [x] Another completed task with **bold**
- [ ] Pending task
- [ ] Another pending task with `src/main.ts` reference
  - [x] Nested completed subtask
  - [ ] Nested pending subtask
- [x] Third completed task
- [ ] Task with a [link](https://example.com)

### Mixed Lists

1. Ordered item
   - Unordered nested item
   - Another unordered item
     1. Back to ordered
     2. Still ordered
   - Unordered again
2. Second ordered item
   - [x] Task nested in ordered list
   - [ ] Another task

## Code Blocks and Syntax Highlighting

### Python

```python
def calculate_fibonacci(n):
    """Generate Fibonacci sequence up to n terms."""
    if n <= 0:
        return []
    elif n == 1:
        return [0]

    sequence = [0, 1]
    for i in range(2, n):
        sequence.append(sequence[i-1] + sequence[i-2])

    return sequence

# Example usage
result = calculate_fibonacci(10)
print(f"Fibonacci sequence: {result}")
```

### JavaScript/TypeScript

```javascript
// Async function with error handling
async function fetchUserData(userId) {
    try {
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Failed to fetch user:', error);
        throw error;
    }
}

// Arrow function
const multiply = (a, b) => a * b;

// Class definition
class UserManager {
    constructor() {
        this.users = new Map();
    }

    addUser(user) {
        this.users.set(user.id, user);
    }
}
```

### TypeScript

```typescript
interface User {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'user' | 'guest';
}

type AsyncCallback<T> = (data: T) => Promise<void>;

class ApiClient<T> {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    async get(endpoint: string): Promise<T> {
        const response = await fetch(`${this.baseUrl}${endpoint}`);
        return response.json();
    }
}
```

### Rust

```rust
use std::collections::HashMap;

#[derive(Debug, Clone)]
struct Product {
    id: u32,
    name: String,
    price: f64,
}

impl Product {
    fn new(id: u32, name: &str, price: f64) -> Self {
        Product {
            id,
            name: name.to_string(),
            price,
        }
    }

    fn apply_discount(&self, percent: f64) -> f64 {
        self.price * (1.0 - percent / 100.0)
    }
}

fn main() {
    let product = Product::new(1, "Laptop", 999.99);
    println!("{:?}", product);
}
```

### Go

```go
package main

import (
    "fmt"
    "sync"
    "time"
)

type Cache struct {
    mu    sync.RWMutex
    items map[string]interface{}
}

func NewCache() *Cache {
    return &Cache{
        items: make(map[string]interface{}),
    }
}

func (c *Cache) Set(key string, value interface{}) {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.items[key] = value
}

func (c *Cache) Get(key string) (interface{}, bool) {
    c.mu.RLock()
    defer c.mu.RUnlock()
    val, found := c.items[key]
    return val, found
}
```

### Bash/Shell

```bash
#!/bin/bash
# Deployment script with error handling

set -euo pipefail

PROJECT_DIR="/var/www/app"
BACKUP_DIR="/backups/$(date +%Y%m%d_%H%M%S)"
LOG_FILE="/var/log/deploy.log"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Create backup
log "Creating backup..."
mkdir -p "$BACKUP_DIR"
tar -czf "$BACKUP_DIR/app.tar.gz" "$PROJECT_DIR"

# Deploy new version
log "Deploying application..."
cd "$PROJECT_DIR"
git pull origin main
npm install --production
npm run build

log "Deployment completed successfully"
```

### SQL

```sql
-- User management schema
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- Complex query with JOIN and aggregation
SELECT
    u.username,
    u.email,
    COUNT(p.id) as post_count,
    MAX(p.created_at) as last_post
FROM users u
LEFT JOIN posts p ON u.id = p.user_id
WHERE u.is_active = TRUE
GROUP BY u.id, u.username, u.email
HAVING COUNT(p.id) > 5
ORDER BY post_count DESC
LIMIT 20;
```

### JSON

```json
{
  "name": "demo-app",
  "version": "1.0.0",
  "description": "Demo application for testing",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "test": "jest --coverage",
    "build": "webpack --mode production"
  },
  "dependencies": {
    "express": "^4.18.0",
    "dotenv": "^16.0.0"
  },
  "devDependencies": {
    "jest": "^29.0.0",
    "nodemon": "^2.0.20"
  }
}
```

### YAML

```yaml
# Docker Compose configuration
version: '3.8'

services:
  web:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - app
    networks:
      - frontend

  app:
    build: .
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://db:5432/myapp
    ports:
      - "3000:3000"
    networks:
      - frontend
      - backend

networks:
  frontend:
  backend:
```

## Tables

### Basic Table

| Name | Role | Email | Status |
|------|------|-------|--------|
| Alice Johnson | Developer | alice@example.com | Active |
| Bob Smith | Designer | bob@example.com | Active |
| Carol Davis | Manager | carol@example.com | Active |

### Aligned Columns

| Left Aligned | Center Aligned | Right Aligned |
|:-------------|:--------------:|--------------:|
| Text | Text | Text |
| 100 | 200 | 300 |
| A | B | C |

### Complex Table with Formatting

| Feature | Status | File Reference | Notes |
|---------|:------:|----------------|-------|
| Syntax Highlighting | ✅ | `src/highlighter.ts` | **Working** |
| File Detection | ✅ | `src/detector.ts` | *In progress* |
| TOC Generation | ⚠️ | `src/toc.ts` | Needs testing |
| Token Counter | ✅ | `lib/counter.js` | ~~Deprecated~~ |

## Blockquotes

> This is a simple blockquote.
> It can span multiple lines.

> ### Blockquote with Heading
>
> Blockquotes can contain other markdown elements:
> - List item 1
> - List item 2
>
> And even **formatted text** or `code`.

> This is the first level
>> This is a nested blockquote
>>> This is deeply nested
>>>> Very deep nesting
>>> Back to level 3
>> Back to level 2
> Back to level 1

## Links and References

### Basic Links

[Inline link](https://example.com)
[Link with title](https://example.com "Example Domain")
[Relative link](../README.md)
[Link to anchor](#text-formatting)

### Reference Links

[Reference-style link][ref1]
[Another reference][ref2]
[Case-insensitive reference][REF1]

[ref1]: https://example.com
[ref2]: https://github.com "GitHub"

### Automatic Links

<https://example.com>
<user@example.com>

## File References

Testing file reference detection:

- Configuration: `package.json`, `tsconfig.json`, `.env`
- Source files: `src/extension.ts`, `src/preview.ts`, `lib/parser.js`
- Documentation: `README.md`, `CHANGELOG.org`, `docs/api.md`
- Config files: `config.yaml`, `.eslintrc.json`, `webpack.config.js`
- Nested paths: `src/utils/helpers.ts`, `tests/unit/parser.test.ts`
- Absolute paths: `/etc/nginx/nginx.conf`, `/var/log/app.log`

## Images

![Alt text](https://via.placeholder.com/150)
![Placeholder with title](https://via.placeholder.com/300x200 "Sample Image")

Reference-style image:
![Demo image][demo-img]

[demo-img]: https://via.placeholder.com/400x300 "Reference Image"

## Horizontal Rules

Text before horizontal rule

---

Text between rules

***

More text

___

Text after horizontal rule

## Code Inline with File References

The main entry point is in `src/extension.ts` which imports from `src/preview.ts`. Configuration is read from `package.json` and type definitions are in `src/types.d.ts`.

For testing, see `tests/suite/extension.test.ts` and the fixtures in `tests/fixtures/sample.org`.

## Nested Structure for TOC Testing

### Architecture

#### Frontend

##### Components

###### Header Component

Implementation in `src/components/Header.tsx`

###### Footer Component

Implementation in `src/components/Footer.tsx`

##### Utilities

Helper functions in `src/utils/index.ts`

#### Backend

##### Controllers

REST endpoints in `src/controllers/userController.ts`

##### Models

Database models in `src/models/User.ts`

### Testing

#### Unit Tests

Located in `tests/unit/` directory

#### Integration Tests

Located in `tests/integration/` directory

## Miscellaneous Features

### Escape Sequences

You can escape special characters: \*not bold\*, \`not code\`, \[not a link\]

### HTML in Markdown

Some markdown parsers support <strong>HTML tags</strong> and <em>inline styles</em>.

<div style="background: #f0f0f0; padding: 10px; border-radius: 5px;">
This is a custom HTML block with styling.
</div>

### Definition Lists (if supported)

Term 1
: Definition for term 1

Term 2
: Definition for term 2
: Another definition for term 2

---

## Summary

This document exercises:
- ✅ All heading levels (h1-h6) for collapsible sections and TOC
- ✅ Multiple code block languages for syntax highlighting
- ✅ Tables with various alignments and formatting
- ✅ Task lists for checkbox rendering
- ✅ Nested blockquotes
- ✅ All inline formatting (bold, italic, code, strikethrough)
- ✅ Links, images, and horizontal rules
- ✅ Nested lists (ordered and unordered)
- ✅ File references throughout for detection testing
- ✅ Deep nesting for stress testing TOC and collapsible sections
