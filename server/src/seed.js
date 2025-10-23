import dotenv from 'dotenv';
import mongoose from 'mongoose';
import seedDatabase from './utils/seedData.js';

dotenv.config();

const runSeed = async () => {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tracker-kpr';
    
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected');

    // Run seed
    await seedDatabase();

    // Disconnect
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
};

runSeed();
