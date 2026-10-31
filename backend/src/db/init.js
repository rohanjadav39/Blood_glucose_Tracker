const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = parseInt(process.env.DB_PORT || '5432', 10);
const dbUser = process.env.DB_USER || 'postgres';
const dbPassword = process.env.DB_PASSWORD || 'postgres';
const dbName = process.env.DB_NAME || 'sweety_db';

async function initializeDatabase() {
  console.log('🔄 Checking PostgreSQL connection and database...');

  // Step 1: Connect to default postgres database to check/create target database
  const rootClient = new Client({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: 'postgres',
  });

  try {
    await rootClient.connect();
    console.log('✅ Connected to PostgreSQL server.');

    const res = await rootClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (res.rowCount === 0) {
      console.log(`ℹ️ Database "${dbName}" does not exist. Creating...`);
      // Escape identifier safely
      await rootClient.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✅ Database "${dbName}" created successfully.`);
    } else {
      console.log(`ℹ️ Database "${dbName}" already exists.`);
    }
  } catch (err) {
    console.error('❌ Failed to connect to PostgreSQL server:', err.message);
    console.error('👉 Please check DB_HOST, DB_PORT, DB_USER, and DB_PASSWORD in backend/.env');
    process.exit(1);
  } finally {
    await rootClient.end();
  }

  // Step 2: Connect to the target database and execute schema.sql
  const dbClient = new Client({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbName,
  });

  try {
    await dbClient.connect();
    console.log(`✅ Connected to "${dbName}". Applying schema...`);

    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    await dbClient.query(schemaSql);
    console.log('✅ Schema applied successfully! Tables and indexes are ready.');
  } catch (err) {
    console.error('❌ Failed to apply database schema:', err.message);
    process.exit(1);
  } finally {
    await dbClient.end();
  }
}

if (require.main === module) {
  initializeDatabase();
}

module.exports = initializeDatabase;
