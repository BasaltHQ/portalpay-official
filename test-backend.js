// Simple test script to verify backend setup
const mongoose = require('mongoose');

// Test database connection
async function testConnection() {
  try {
    console.log('🔌 Testing MongoDB connection...');
    
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/varuni-backoffice';
    
    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ MongoDB connected successfully!');
    
    // Test creating a simple schema
    const testSchema = new mongoose.Schema({
      name: String,
      createdAt: { type: Date, default: Date.now }
    });
    
    const TestModel = mongoose.model('Test', testSchema);
    
    // Test creating a document
    const testDoc = new TestModel({ name: 'Backend Test' });
    await testDoc.save();
    console.log('✅ Document created successfully!');
    
    // Test finding the document
    const foundDoc = await TestModel.findOne({ name: 'Backend Test' });
    console.log('✅ Document found:', foundDoc.name);
    
    // Clean up
    await TestModel.deleteOne({ name: 'Backend Test' });
    console.log('✅ Test document cleaned up!');
    
    await mongoose.connection.close();
    console.log('🔌 Connection closed successfully!');
    
    console.log('\n🎉 Backend test completed successfully!');
    console.log('Your MongoDB connection and basic operations are working.');
    
  } catch (error) {
    console.error('❌ Backend test failed:', error.message);
    process.exit(1);
  }
}

testConnection(); 