const db = require("../db");

function saveFeeding(data) {
  const {
    feedingDate,
    weight,
    stage,
    mealWeight,
    nextFeedingDate,
    isOverdue,
    daysLeft
  } = data;

  db.run(
    `
    INSERT INTO feedings (
      feedingDate,
      weight,
      stage,
      mealWeight,
      nextFeedingDate,
      isOverdue,
      daysLeft,
      savedAt
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `,
    [
      feedingDate,
      weight,
      stage,
      mealWeight,
      nextFeedingDate,
      isOverdue,
      daysLeft,
      new Date().toISOString()
    ]
  );

  return { message: "Zapisano karmienie do DB" };
}

function getHistory() {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM feedings ORDER BY id DESC", (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

module.exports = {
  saveFeeding,
  getHistory
};