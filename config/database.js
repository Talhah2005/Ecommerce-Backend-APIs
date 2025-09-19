import mongoose from 'mongoose';

// Database connection options
const options = {
  // Connection management
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  family: 4, 
  
  // Buffering
  bufferCommands: false, // Disable mongoose buffering
  
  // Heartbeat
  heartbeatFrequencyMS: 10000, // Send a ping every 10 seconds
};

/**
 * Connect to MongoDB
 * returns {Promise<mongoose.Connection>}
 */
export const connectDB = async () => {
  try {
    mongoose.set('strictQuery', false);
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, options);
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database Name: ${conn.connection.name}`);
    
    // Connection event listeners
    mongoose.connection.on('connected', () => {
      console.log('Mongoose connected to MongoDB');
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('Mongoose connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('Mongoose disconnected from MongoDB');
    });
    
    return conn.connection;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    
    // Exit process with failure
    process.exit(1);
  }
};

/**
 * Disconnect from MongoDB
 * returns {Promise<void>}
 */
export const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error closing MongoDB connection:', error.message);
  }
};

/**
 * Check database connection status
 * returns {string} Connection status
 */
export const getConnectionStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  
  return states[mongoose.connection.readyState] || 'unknown';
};

/**
 * Get database statistics
 * returns {Promise<Object>} Database stats
 */
export const getDatabaseStats = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return { error: 'Database not connected' };
    }
    
    const admin = mongoose.connection.db.admin();
    const stats = await admin.serverStatus();
    
    return {
      status: 'connected',
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
      collections: Object.keys(mongoose.connection.collections).length,
      version: stats.version,
      uptime: stats.uptime,
      connections: stats.connections,
    };
  } catch (error) {
    return { error: error.message };
  }
};

// Graceful shutdown handlers
const gracefulShutdown = (msg, callback) => {
  mongoose.connection.close(() => {
    console.log(`Mongoose disconnected through ${msg}`);
    callback();
  });
};

// For nodemon restarts
process.once('SIGUSR2', () => {
  gracefulShutdown('nodemon restart', () => {
    process.kill(process.pid, 'SIGUSR2');
  });
});

// For app termination
process.on('SIGINT', () => {
  gracefulShutdown('app termination', () => {
    process.exit(0);
  });
});

// For Heroku app termination
process.on('SIGTERM', () => {
  gracefulShutdown('Heroku app shutdown', () => {
    process.exit(0);
  });
});