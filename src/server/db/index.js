const { Pool } = require('pg');

// credentials are stored in src/creds.js, but that is not included in source control
const { dbConnString } = require('../../creds');

const pool = new Pool({
  connectionString: dbConnString,
  ssl: true
});

module.exports = {
  query: (text, params) => pool.query(text, params)
};
