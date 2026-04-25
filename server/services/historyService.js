const fs = require("fs");

const FILE_PATH = "./data.json";

function saveFeeding(data) {
  let existingData = [];

  if (fs.existsSync(FILE_PATH)) {
    const fileContent = fs.readFileSync(FILE_PATH);
    existingData = JSON.parse(fileContent);
  }

  existingData.push({
    ...data,
    savedAt: new Date().toISOString(),
  });

  fs.writeFileSync(FILE_PATH, JSON.stringify(existingData, null, 2));

  return { message: "Zapisano karmienie" };
}

function getHistory() {
  if (!fs.existsSync(FILE_PATH)) {
    return [];
  }

  const fileContent = fs.readFileSync(FILE_PATH);
  return JSON.parse(fileContent);
}

module.exports = {
  saveFeeding,
  getHistory,
};