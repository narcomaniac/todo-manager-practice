const path = require('path');
const express = require('express');
const { createDb, defaultDbPath } = require('./src/db');
const {
  VALID_STATUSES,
  VALID_PRIORITIES,
  createTaskRepository
} = require('./src/taskRepository');

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeDueDate(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return undefined;
  }

  const parsed = new Date(`${trimmed}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  return trimmed;
}

function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }
  return id;
}

function validateTaskPayload(body, { partial = false } = {}) {
  const errors = [];
  const data = {};

  if (!partial || body.title !== undefined) {
    if (!isNonEmptyString(body.title)) {
      errors.push('Title is required.');
    } else {
      data.title = body.title.trim();
    }
  }

  if (!partial || body.description !== undefined) {
    if (body.description == null || body.description === '') {
      data.description = '';
    } else if (typeof body.description !== 'string') {
      errors.push('Description must be a string.');
    } else {
      data.description = body.description.trim();
    }
  }

  if (!partial || body.status !== undefined) {
    const status = body.status == null || body.status === '' ? 'active' : body.status;
    if (!VALID_STATUSES.includes(status)) {
      errors.push('Status must be active or completed.');
    } else {
      data.status = status;
    }
  }

  if (!partial || body.priority !== undefined) {
    const priority = body.priority == null || body.priority === '' ? 'medium' : body.priority;
    if (!VALID_PRIORITIES.includes(priority)) {
      errors.push('Priority must be low, medium, or high.');
    } else {
      data.priority = priority;
    }
  }

  if (!partial || body.due_date !== undefined) {
    const dueDate = normalizeDueDate(body.due_date);
    if (dueDate === undefined) {
      errors.push('Due date must be a valid YYYY-MM-DD value.');
    } else {
      data.due_date = dueDate;
    }
  }

  return { errors, data };
}

function mergeTask(existing, updates) {
  return {
    title: updates.title !== undefined ? updates.title : existing.title,
    description: updates.description !== undefined ? updates.description : existing.description,
    status: updates.status !== undefined ? updates.status : existing.status,
    priority: updates.priority !== undefined ? updates.priority : existing.priority,
    due_date: updates.due_date !== undefined ? updates.due_date : existing.due_date
  };
}

function createApp(db) {
  const app = express();
  const tasks = createTaskRepository(db);

  app.use(express.json());
  app.use(express.static(path.join(__dirname, 'public')));

  app.get('/api/tasks', (req, res) => {
    res.json(tasks.list());
  });

  app.get('/api/tasks/:id', (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Task id must be a positive integer.' });
    }

    const task = tasks.getById(id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    return res.json(task);
  });

  app.post('/api/tasks', (req, res) => {
    const { errors, data } = validateTaskPayload(req.body || {});
    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join(' ') });
    }

    const task = tasks.create(data);
    return res.status(201).json(task);
  });

  app.put('/api/tasks/:id', (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Task id must be a positive integer.' });
    }

    const existing = tasks.getById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    const { errors, data } = validateTaskPayload(req.body || {}, { partial: true });
    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join(' ') });
    }

    const updated = tasks.update(id, mergeTask(existing, data));
    return res.json(updated);
  });

  app.delete('/api/tasks/:id', (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Task id must be a positive integer.' });
    }

    const deleted = tasks.remove(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    return res.status(200).json({ message: 'Task deleted.' });
  });

  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Unexpected server error.' });
  });

  return app;
}

if (require.main === module) {
  const db = createDb(defaultDbPath());
  const app = createApp(db);
  const port = Number(process.env.PORT) || 3000;

  app.listen(port, () => {
    console.log(`Todo Manager running at http://localhost:${port}`);
  });
}

module.exports = {
  createApp
};
