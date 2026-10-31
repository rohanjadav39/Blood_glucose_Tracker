const app = require('./app');
const db = require('./config/db');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Test database connection
    await db.query('SELECT 1');
    console.log('✅ PostgreSQL database connection established.');

    app.listen(PORT, () => {
      console.log(`🚀 Sweety API server running on http://localhost:${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error('❌ Failed to connect to PostgreSQL database on startup:');
    console.error(err.message);
    console.log('\n⚠️ Starting server in degraded mode (DB connection retry enabled)...');
    app.listen(PORT, () => {
      console.log(`🚀 Sweety API server running on http://localhost:${PORT}`);
      console.log('👉 Please ensure PostgreSQL is running and run: npm run db:init');
    });
  }
}

startServer();
