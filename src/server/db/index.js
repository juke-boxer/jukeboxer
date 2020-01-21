const { Pool } = require("pg");
const fs = require("fs");

const db_creds = JSON.parse(fs.readFileSync(".db_creds", "utf8");

const pool = new Pool(db_creds);

module.exports = {
        query: (text, params) => pool.query(text, params);
};
