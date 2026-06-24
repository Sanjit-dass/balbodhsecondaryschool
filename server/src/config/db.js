const mongoose = require('mongoose');
const dns = require('dns');
const net = require('net');

const isSrvUri = (uri) => typeof uri === 'string' && uri.startsWith('mongodb+srv://');

const getSrvHostFromUri = (uri) => {
  const match = uri.match(/^mongodb\+srv:\/\/([^\/]+)/i);
  if (!match) return null;
  const authority = match[1];
  // authority may include credentials like user:pass@host
  const atIndex = authority.lastIndexOf('@');
  return atIndex >= 0 ? authority.slice(atIndex + 1) : authority;
};

const resolveSrv = async (srvHost) => {
  try {
    const records = await dns.promises.resolveSrv(`_mongodb._tcp.${srvHost}`);
    console.log(`✅ SRV records for ${srvHost}:`, records);
    return records;
  } catch (err) {
    console.error(`❌ SRV resolution failed for ${srvHost}:`, err.message);
    throw err;
  }
};

const lookupHost = async (host) => {
  try {
    const address = await dns.promises.lookup(host);
    console.log(`✅ DNS lookup for ${host}:`, address);
    return address;
  } catch (err) {
    console.error(`❌ DNS lookup failed for ${host}:`, err.message);
    throw err;
  }
};

const testTcpConnection = (host, port = 27017, timeout = 5000) => {
  return new Promise((resolve, reject) => {
    const socket = net.connect({ host, port, timeout }, () => {
      socket.end();
      resolve();
    });

    socket.on('error', (err) => {
      reject(err);
    });

    socket.on('timeout', () => {
      socket.destroy();
      reject(new Error(`Timeout connecting to ${host}:${port}`));
    });
  });
};

const connectWithMongoose = async (uri) => {
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    family: 4,
    // Mongoose v6+ and the Node driver handle URL parsing and topology by default.
  });
};

const shouldTryFallback = (err) => {
  if (!err) return false;
  const message = String(err.message || '').toLowerCase();
  return (
    message.includes('querysrv') ||
    message.includes('srvice') ||
    message.includes('dns') ||
    message.includes('getaddrinfo') ||
    message.includes('enotfound') ||
    message.includes('econnrefused') ||
    message.includes('failed to resolve')
  );
};

const connectDB = async (mongoUri, fallbackUri) => {
  if (!mongoUri) {
    const error = new Error('MONGODB_URI (or MONGODB_URL) is required but was not provided.');
    error.code = 'MISSING_MONGODB_URI';
    throw error;
  }

  mongoose.set('strictQuery', false);

  mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB connected');
    console.log(`   host: ${mongoose.connection.host}`);
    console.log(`   port: ${mongoose.connection.port}`);
    console.log(`   database: ${mongoose.connection.name}`);
  });

  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB disconnected');
  });

  const srvHost = isSrvUri(mongoUri) ? getSrvHostFromUri(mongoUri) : null;

  if (srvHost) {
    console.log(`🔎 MongoDB SRV host detected: ${srvHost}`);
    try {
      await resolveSrv(srvHost);
      await lookupHost(srvHost);
    } catch (err) {
      console.warn('⚠️ SRV validation failed. This is likely a DNS or network issue.');
    }
  }

  try {
    await connectWithMongoose(mongoUri);
    return;
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB Atlas:');
    console.error('   message:', err.message);
    console.error('   name:', err.name);
    console.error('   code:', err.code);
    console.error('   reason:', err.reason || 'N/A');

    if (srvHost) {
      console.error('   detail: this is an SRV-style MongoDB URI. DNS/SRV lookup may be blocked.');
    }

    if (fallbackUri) {
      console.warn('⚠️ Attempting fallback connection using MONGODB_DIRECT_URI...');
      try {
        await connectWithMongoose(fallbackUri);
        console.log('✅ MongoDB connected using fallback direct-host connection string');
        return;
      } catch (fallbackErr) {
        console.error('❌ Fallback connection failed:');
        console.error('   message:', fallbackErr.message);
        console.error('   name:', fallbackErr.name);
        console.error('   code:', fallbackErr.code);
        console.error('   reason:', fallbackErr.reason || 'N/A');
      }
    }

    console.error('   hint: if SRV DNS resolution fails, set MONGODB_DIRECT_URI with a mongodb:// direct-host string from Atlas.');
    throw err;
  }
};

const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('✅ MongoDB connection closed gracefully');
  }
};

module.exports = { connectDB, disconnectDB };