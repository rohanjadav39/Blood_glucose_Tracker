-- Sweety Blood Glucose Tracker Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Readings table
CREATE TABLE IF NOT EXISTS readings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    slot VARCHAR(50) NOT NULL,
    value INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_glucose_value CHECK (value >= 40 AND value <= 600),
    CONSTRAINT chk_slot_name CHECK (slot IN (
        'Morning (fasting)',
        'After breakfast',
        'After lunch',
        'After dinner'
    )),
    CONSTRAINT unique_user_date_slot UNIQUE (user_id, date, slot)
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_readings_user_date ON readings(user_id, date);
CREATE INDEX IF NOT EXISTS idx_readings_user_date_slot ON readings(user_id, date, slot);
