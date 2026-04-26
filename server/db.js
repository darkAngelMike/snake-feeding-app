const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./database.db");

// tworzenie tabeli jeśli nie istnieje
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS feedings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      feeding_date TEXT,
      snake_weight_g INTEGER,
      life_stage TEXT,
      meal_weight_g INTEGER,
      created_at TEXT
    )
  `);
});

module.exports = db;
