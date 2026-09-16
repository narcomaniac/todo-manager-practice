const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { createDb } = require('../src/db');
const { createApp } = require('../server');

describe('Task API', () => {
  let app;

  before(() => {
    const db = createDb(':memory:');
    app = createApp(db);
  });

  it('creates a task', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .send({
        title: 'Read chapter 4',
        description: 'Finish the assigned reading',
        priority: 'high',
        due_date: '2026-10-01'
      });

    assert.equal(response.status, 201);
    assert.equal(response.body.title, 'Read chapter 4');
    assert.equal(response.body.description, 'Finish the assigned reading');
    assert.equal(response.body.status, 'active');
    assert.equal(response.body.priority, 'high');
    assert.equal(response.body.due_date, '2026-10-01');
    assert.equal(typeof response.body.id, 'number');
    assert.ok(response.body.created_at);
    assert.ok(response.body.updated_at);
  });

  it('lists tasks', async () => {
    await request(app).post('/api/tasks').send({ title: 'Second task' });

    const response = await request(app).get('/api/tasks');

    assert.equal(response.status, 200);
    assert.ok(Array.isArray(response.body));
    assert.ok(response.body.length >= 2);
    assert.ok(response.body.every((task) => task.title && task.status && task.priority));
  });

  it('updates a task', async () => {
    const created = await request(app)
      .post('/api/tasks')
      .send({ title: 'Draft outline', priority: 'low' });

    const response = await request(app)
      .put(`/api/tasks/${created.body.id}`)
      .send({
        title: 'Finish outline',
        description: 'Include sources',
        priority: 'medium',
        due_date: '2026-09-20'
      });

    assert.equal(response.status, 200);
    assert.equal(response.body.title, 'Finish outline');
    assert.equal(response.body.description, 'Include sources');
    assert.equal(response.body.priority, 'medium');
    assert.equal(response.body.due_date, '2026-09-20');
    assert.equal(response.body.status, 'active');
  });

  it('changes task status', async () => {
    const created = await request(app)
      .post('/api/tasks')
      .send({ title: 'Submit report' });

    const response = await request(app)
      .put(`/api/tasks/${created.body.id}`)
      .send({ status: 'completed' });

    assert.equal(response.status, 200);
    assert.equal(response.body.status, 'completed');
    assert.equal(response.body.title, 'Submit report');
  });

  it('deletes a task', async () => {
    const created = await request(app)
      .post('/api/tasks')
      .send({ title: 'Temporary task' });

    const deleted = await request(app).delete(`/api/tasks/${created.body.id}`);
    const missing = await request(app).get(`/api/tasks/${created.body.id}`);

    assert.equal(deleted.status, 200);
    assert.equal(deleted.body.message, 'Task deleted.');
    assert.equal(missing.status, 404);
  });

  it('rejects an invalid create request', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .send({
        title: '',
        status: 'done',
        priority: 'urgent'
      });

    assert.equal(response.status, 400);
    assert.equal(typeof response.body.error, 'string');
    assert.match(response.body.error, /title/i);
    assert.match(response.body.error, /status/i);
    assert.match(response.body.error, /priority/i);
  });
});
