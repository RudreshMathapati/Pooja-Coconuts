require('dotenv').config();
const connectDB = require('../config/db');
const { clearAllBusinessData } = require('./seedData');

const run = async () => {
  await connectDB();
  await clearAllBusinessData();
  console.log('Reset complete!');
  process.exit(0);
};

run();
