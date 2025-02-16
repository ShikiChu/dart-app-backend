const express = require('express');
const router = express.Router();
const mysql = require('mysql2');

// MySQL connection 
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'dbPassword',
  database: 'dartApp',
});

// API to get dart scores with player names
router.get('/scores', (req, res) => {
  const sql = `
    SELECT t.name, ds.*  
    FROM dart_scores ds  
    JOIN teammates t ON ds.playerid = t.id;
  `;
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching dart scores:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

module.exports = router;
