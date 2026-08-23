const mongoose = require('mongoose');

const connectDB = async () => {
  const primaryUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pooja_coconuts';
  const isCloudUri = primaryUri.includes('mongodb+srv://') || process.env.NODE_ENV === 'production';
  
  try {
    console.log(`Connecting to MongoDB at: ${primaryUri.split('@')[1] ? 'mongodb+srv://***@' + primaryUri.split('@')[1] : primaryUri}...`);
    await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 15000
    });
    console.log('✅ Connected successfully to Persistent MongoDB Database!');
  } catch (err) {
    console.error(`❌ MongoDB Connection Error: ${err.message}`);
    
    if (isCloudUri) {
      console.error('👉 TIP: Ensure your MongoDB Atlas IP Whitelist allows access from anywhere (0.0.0.0/0) in Atlas > Network Access.');
      return;
    }

    console.warn(`⚠️ Trying fallback on localhost...`);
    try {
      const fallbackUri = 'mongodb://localhost:27017/pooja_coconuts';
      await mongoose.connect(fallbackUri, {
        serverSelectionTimeoutMS: 10000
      });
      console.log('✅ Connected successfully to Persistent MongoDB Database on localhost: pooja_coconuts');
    } catch (fallbackErr) {
      console.error('❌ Failed to connect to Persistent Local MongoDB instance.');
      console.warn('⚠️ Falling back to temporary in-memory MongoDB for local development...');
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();
        await mongoose.connect(uri);
        console.log(`Embedded MongoDB Memory Server running at: ${uri}`);
      } catch (memErr) {
        console.error('Failed to start MongoDB Memory Server:', memErr.message);
      }
    }
  }
};

module.exports = connectDB;
