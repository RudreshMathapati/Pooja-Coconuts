const mongoose = require('mongoose');

const connectDB = async () => {
  const primaryUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pooja_coconuts';
  
  try {
    console.log(`Connecting to Persistent MongoDB at: ${primaryUri}...`);
    await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 10000
    });
    console.log('✅ Connected successfully to Persistent MongoDB Database: pooja_coconuts');
  } catch (err) {
    console.warn(`⚠️ Warning: Could not connect to primary MongoDB (${err.message}). Trying fallback on localhost...`);
    try {
      const fallbackUri = 'mongodb://localhost:27017/pooja_coconuts';
      await mongoose.connect(fallbackUri, {
        serverSelectionTimeoutMS: 10000
      });
      console.log('✅ Connected successfully to Persistent MongoDB Database on localhost: pooja_coconuts');
    } catch (fallbackErr) {
      console.error('❌ Failed to connect to Persistent Local MongoDB instance.');
      console.warn('⚠️ Falling back to temporary in-memory MongoDB. (Note: Data will not persist across restarts without a running local MongoDB service)');
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();
        await mongoose.connect(uri);
        console.log(`Embedded MongoDB Memory Server running at: ${uri}`);
      } catch (memErr) {
        console.error('Failed to start MongoDB Memory Server:', memErr.message);
        process.exit(1);
      }
    }
  }
};

module.exports = connectDB;
