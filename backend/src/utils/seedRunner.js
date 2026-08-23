require('dotenv').config();
const connectDB = require('../config/db');
const { seedInitialData } = require('./seedData');

const runSeed = async () => {
  await connectDB();
  await seedInitialData();
  process.exit(0);
};

runSeed();
