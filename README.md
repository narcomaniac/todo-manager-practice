# Todo Manager

A small educational Todo Manager web application built for a college web-development practice assignment.

The app is intentionally simple: a student can view, create, edit, complete, and delete tasks through a browser UI that talks to a REST API backed by SQLite.

## Selected educational catalogue project

This project follows the **Build a Todo List App in JavaScript** item from the Project Based Learning catalogue:

- Catalogue: [https://github.com/practical-tutorials/project-based-learning](https://github.com/practical-tutorials/project-based-learning)
- Selected item: Build a Todo List App in JavaScript

The catalogue item is used as a starting point. This assignment extends it with a Node.js/Express REST API and an SQLite database so the full path is easy to describe in a report:

**frontend -> backend REST API -> SQLite database**

## Implemented features

- View all tasks
- Create a task
- Edit a task
- Delete a task with confirmation
- Mark a task active or completed
- Set priority: low, medium, or high
- Set an optional due date
- Filter tasks by all / active / completed
- Search tasks by title
- Show counters for total, active, and completed tasks
- Empty state, basic validation, and JSON error messages
- Responsive desktop and mobile layout

Each task stores:

- `id`
- `title`
- `description`
- `status`
- `priority`
- `due_date`
- `created_at`
- `updated_at`

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | HTML, CSS, vanilla JavaScript |
| Backend | Node.js, Express |
| Database | SQLite (`better-sqlite3`) |
| Tests | Node.js built-in test runner and Supertest |

Not used: React, TypeScript, authentication, Docker, or an external database service.

## Architecture summary

```text
Browser (public/index.html, styles.css, app.js)
    |
    |  JSON over HTTP
    v
Express REST API (server.js)
    |
    |  SQL queries
    v
SQLite tasks table (data/todo.db)
```

1. The browser loads static files from the `public/` folder.
2. JavaScript calls `/api/tasks` to create, read, update, and delete tasks.
3. Express validates the request body and returns JSON.
4. `taskRepository.js` reads and writes rows in the SQLite `tasks` table.
5. `db.js` creates the database file and table automatically on startup.

## Project structure

```text
package.json
README.md
.gitignore
server.js
src/
  db.js
  taskRepository.js
public/
  index.html
  styles.css
  app.js
tests/
  api.test.js
```

- `server.js` creates the Express app, serves the frontend, and defines the API routes.
- `src/db.js` opens SQLite and initializes the `tasks` table.
- `src/taskRepository.js` contains the SQL used for CRUD operations.
- `public/` contains the student-facing interface.
- `tests/api.test.js` covers the main API flows against an in-memory database.

## Installation

Requirements:

- Node.js 18 or newer
- npm

From the project root:

```bash
npm install
```

The database file is created automatically in `data/todo.db` the first time the server starts. You do not need to create a database by hand.

## Run locally

Start the application:

```bash
npm start
```

Then open:

```text
http://localhost:3000
```

Optional development start with file watching:

```bash
npm run dev
```

The server listens on port `3000` by default. To use another port:

```bash
PORT=4000 npm start
```

## API endpoints

All endpoints use JSON.

| Method | Path | Description | Success status |
| --- | --- | --- | --- |
| GET | `/api/tasks` | List all tasks | 200 |
| GET | `/api/tasks/:id` | Get one task | 200 |
| POST | `/api/tasks` | Create a task | 201 |
| PUT | `/api/tasks/:id` | Update a task | 200 |
| DELETE | `/api/tasks/:id` | Delete a task | 200 |

### Create / update body

```json
{
  "title": "Finish lab report",
  "description": "Include screenshots",
  "status": "active",
  "priority": "high",
  "due_date": "2026-10-01"
}
```

- `title` is required.
- `status` must be `active` or `completed`. It defaults to `active` on create.
- `priority` must be `low`, `medium`, or `high`. It defaults to `medium` on create.
- `description` is optional.
- `due_date` is optional and must use `YYYY-MM-DD` when provided.

### Example error response

```json
{
  "error": "Title is required."
}
```

Common error status codes:

- `400` validation error
- `404` task not found
- `500` unexpected server error

## Testing

```bash
npm test
```

The automated tests cover:

- creating a task
- listing tasks
- updating a task
- changing task status
- deleting a task
- rejecting an invalid create request

Tests use an in-memory SQLite database and do not change `data/todo.db`.

## Database

The app uses one SQLite table named `tasks`.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | INTEGER | Primary key, auto-increment |
| `title` | TEXT | Required |
| `description` | TEXT | Optional, stored as an empty string when omitted |
| `status` | TEXT | `active` or `completed` |
| `priority` | TEXT | `low`, `medium`, or `high` |
| `due_date` | TEXT | Optional `YYYY-MM-DD` value |
| `created_at` | TEXT | ISO timestamp |
| `updated_at` | TEXT | ISO timestamp |

The table is created with `CREATE TABLE IF NOT EXISTS` when the server starts, so an evaluator only needs to run `npm install` and `npm start`.

The runtime database file is ignored by git.

## Deployment

This project is ready to deploy to any host that can run a Node.js process and keep a local SQLite file.

Final URL: `[DEPLOYMENT_URL_PLACEHOLDER]`

Deployment has not been configured yet for this assignment.
