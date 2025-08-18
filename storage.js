const fs = require('fs');
const path = require('path');
const dataFile = path.join(__dirname, 'todoData.json');

function saveData(data) {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2), 'utf-8');
}

function loadData() {
  if (!fs.existsSync(dataFile)) return { todo: [], done: [] };
  const raw = fs.readFileSync(dataFile, 'utf-8');
  return JSON.parse(raw);
}

module.exports = { saveData, loadData };
