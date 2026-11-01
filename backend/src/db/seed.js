const bcrypt = require('bcryptjs');
const { Client } = require('pg');
require('dotenv').config();

const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = parseInt(process.env.DB_PORT || '5432', 10);
const dbUser = process.env.DB_USER || 'postgres';
const dbPassword = process.env.DB_PASSWORD || 'postgres';
const dbName = process.env.DB_NAME || 'sweety_db';

const SLOTS = [
  'Morning (fasting)',
  'After breakfast',
  'After lunch',
  'After dinner',
];

async function seedDatabase() {
  console.log('🌱 Seeding Sweety database with demo user and sample readings...');

  const client = new Client({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbName,
  });

  try {
    await client.connect();

    // 1. Create or get demo user
    const demoEmail = 'demo@sweety.app';
    const demoPassword = 'Password123!';
    const passwordHash = await bcrypt.hash(demoPassword, 10);

    const userRes = await client.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE 
       SET password_hash = EXCLUDED.password_hash, name = EXCLUDED.name
       RETURNING id, name, email`,
      ['Demo Patient', demoEmail, passwordHash]
    );

    const demoUser = userRes.rows[0];
    console.log(`👤 Demo user created/updated: ${demoUser.email} (ID: ${demoUser.id})`);
    console.log(`🔑 Login password: ${demoPassword}`);

    // Clear previous readings for demo user for a clean seed run
    await client.query(`DELETE FROM readings WHERE user_id = $1`, [demoUser.id]);

    // 2. Generate sample readings
    // Let's seed readings for:
    // a) Current month (including today and previous days of this month)
    // b) Previous month (for full monthly report validation)
    const today = new Date();
    const readingsToInsert = [];

    // Helper to format Date to YYYY-MM-DD
    const formatDate = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Readings for current month: 10 consecutive days leading up to today with all 4 slots
    // This provides 40 total readings, cleanly demonstrating 2 pages of 20 readings (5 days x 4 readings per page)
    for (let offset = 0; offset <= 9; offset++) {
      const d = new Date(today);
      d.setDate(today.getDate() - offset);
      const dateStr = formatDate(d);

      const sampleVals = [
        { slot: SLOTS[0], value: 90 + (offset % 5) * 3 },   // Fasting ~90-102
        { slot: SLOTS[1], value: 126 + (offset % 4) * 6 },  // After breakfast ~126-144
        { slot: SLOTS[2], value: 132 + (offset % 3) * 8 },  // After lunch ~132-148
        { slot: SLOTS[3], value: 115 + (offset % 6) * 4 },  // After dinner ~115-135
      ];

      for (let i = 0; i < 4; i++) {
        readingsToInsert.push({
          date: dateStr,
          slot: sampleVals[i].slot,
          value: sampleVals[i].value,
        });
      }
    }

    // Readings for previous month: 5 days spread across previous month
    const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 15);
    for (let dayOffset = 5; dayOffset <= 25; dayOffset += 5) {
      const d = new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth(), dayOffset);
      const dateStr = formatDate(d);

      readingsToInsert.push(
        { date: dateStr, slot: SLOTS[0], value: 95 + (dayOffset % 7) },
        { date: dateStr, slot: SLOTS[1], value: 132 + (dayOffset % 6) },
        { date: dateStr, slot: SLOTS[2], value: 142 - (dayOffset % 5) },
        { date: dateStr, slot: SLOTS[3], value: 122 + (dayOffset % 8) }
      );
    }

    // Batch insert
    for (const r of readingsToInsert) {
      await client.query(
        `INSERT INTO readings (user_id, date, slot, value)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, date, slot) DO UPDATE SET value = EXCLUDED.value`,
        [demoUser.id, r.date, r.slot, r.value]
      );
    }

    console.log(`✅ Successfully seeded ${readingsToInsert.length} blood glucose readings for demo user.`);
    console.log('\n----------------------------------------');
    console.log('Demo Credentials:');
    console.log(`Email:    ${demoEmail}`);
    console.log(`Password: ${demoPassword}`);
    console.log('----------------------------------------\n');
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
