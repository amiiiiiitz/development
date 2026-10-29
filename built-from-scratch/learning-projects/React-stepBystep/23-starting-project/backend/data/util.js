const fs = require('node:fs/promises');

async function readData() {
  console.log("Reading data from events.json...");
  const data = await fs.readFile('events.json', 'utf8');
  console.log("Data read successfully.");
  return JSON.parse(data);
}

async function writeData(data) {
  await fs.writeFile('events.json', JSON.stringify(data));
}

exports.readData = readData;
exports.writeData = writeData;