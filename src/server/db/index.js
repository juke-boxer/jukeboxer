const { Pool } = require('pg');

const dbConnString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: dbConnString,
  ssl: true
});

module.exports = {
  query: (text, params) => pool.query(text, params)
};
