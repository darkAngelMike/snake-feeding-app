const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./database.db");

// tworzenie tabeli jeśli nie istnieje
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS feedings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      feedingDate TEXT,
      weight INTEGER,
      stage TEXT,
      mealWeight INTEGER,
      nextFeedingDate TEXT,
      isOverdue BOOLEAN,
      daysLeft INTEGER,
      savedAt TEXT
    )
  `);
});

module.exports = db;