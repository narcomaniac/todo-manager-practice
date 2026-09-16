const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

function createDb(dbPath) {
  if (dbPath !== ':memory:') {
    const directory = path.dirname(dbPath);
    fs.mkdirSync(directory, { recursive: true });
  }

  const db = new Database(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'completed')),
      priority TEXT NOT NULL DEFAULT 'medium'
        CHECK (priority IN ('low', 'medium', 'high')),
      due_date TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  return db;
}

function defaultDbPath() {
  return process.env.DATABASE_PATH || path.join(__dirname, '..', 'data', 'todo.db');
}

module.exports = {
  createDb,
  defaultDbPath
};
