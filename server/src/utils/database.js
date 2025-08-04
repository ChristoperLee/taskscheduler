const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'taskscheduler',
  user: process.env.DB_USER || 'chrislee',
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test the connection
async function connectDB() {
  try {
    const client = await pool.connect();
    console.log('Database connection established');
    client.release();
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
}

// Execute a query
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
}

// Get a client from the pool
async function getClient() {
  return await pool.connect();
}

module.exports = {
  connectDB,
  query,
  getClient,
  pool
}; 