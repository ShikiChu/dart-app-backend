const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root', 
  password: 'sandyB83120$', 
  database: 'darts_league', 
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
