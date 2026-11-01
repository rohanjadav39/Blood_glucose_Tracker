const app = require('./app');
const db = require('./config/db');
const initializeDatabase = require('./db/init');
const seedDatabase = require('./db/seed');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Test database connection
    await db.query('SELECT 1');
    console.log('✅ PostgreSQL database connection established.');

    // Auto-check database tables and demo seed
    try {
      const tableCheck = await db.query(
        `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'readings')`
      );
      if (!tableCheck.rows[0].exists) {
        console.log('⚡ Schema not found. Running auto-init & seed...');
        await initializeDatabase();
        await seedDatabase();
      } else {
        const demoCheck = await db.query(
          `SELECT COUNT(*) FROM users WHERE email = 'demo@sweety.app'`
        );
        if (parseInt(demoCheck.rows[0].count, 10) === 0) {
          console.log('🌱 Demo patient not found. Auto-seeding sample readings...');
          await seedDatabase();
        }
      }
    } catch (checkErr) {
      console.warn('⚠️ Auto-init check note:', checkErr.message);
    }

    app.listen(PORT, () => {
      console.log(`🚀 Sweety API server running on http://localhost:${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error('❌ Failed to connect to PostgreSQL database on startup:');
    console.error(err.message);
    console.log('\n⚠️ Starting server in fallback mode (run "npm run db:init && npm run seed" when PostgreSQL is ready)');
    app.listen(PORT, () => {
      console.log(`🚀 Sweety API server running on http://localhost:${PORT}`);
    });
  }
}

startServer();
