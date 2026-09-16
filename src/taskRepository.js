const VALID_STATUSES = ['active', 'completed'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];

function nowIso() {
  return new Date().toISOString();
}

function createTaskRepository(db) {
  const insertStmt = db.prepare(`
    INSERT INTO tasks (title, description, status, priority, due_date, created_at, updated_at)
    VALUES (@title, @description, @status, @priority, @due_date, @created_at, @updated_at)
  `);

  const listStmt = db.prepare(`
    SELECT id, title, description, status, priority, due_date, created_at, updated_at
    FROM tasks
    ORDER BY datetime(created_at) DESC, id DESC
  `);

  const getStmt = db.prepare(`
    SELECT id, title, description, status, priority, due_date, created_at, updated_at
    FROM tasks
    WHERE id = ?
  `);

  const updateStmt = db.prepare(`
    UPDATE tasks
    SET title = @title,
        description = @description,
        status = @status,
        priority = @priority,
        due_date = @due_date,
        updated_at = @updated_at
    WHERE id = @id
  `);

  const deleteStmt = db.prepare('DELETE FROM tasks WHERE id = ?');

  function list() {
    return listStmt.all();
  }

  function getById(id) {
    return getStmt.get(id) || null;
  }

  function create(task) {
    const timestamp = nowIso();
    const result = insertStmt.run({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      due_date: task.due_date,
      created_at: timestamp,
      updated_at: timestamp
    });

    return getById(result.lastInsertRowid);
  }

  function update(id, task) {
    const existing = getById(id);
    if (!existing) {
      return null;
    }

    updateStmt.run({
      id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      due_date: task.due_date,
      updated_at: nowIso()
    });

    return getById(id);
  }

  function remove(id) {
    const existing = getById(id);
    if (!existing) {
      return false;
    }

    deleteStmt.run(id);
    return true;
  }

  return {
    list,
    getById,
    create,
    update,
    remove
  };
}

module.exports = {
  VALID_STATUSES,
  VALID_PRIORITIES,
  createTaskRepository
};
