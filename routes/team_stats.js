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


// Define the GET API endpoint
router.get('/all_team_stats', (req, res) => {
  const query = `
    SELECT t.name, t.nickname, ts.game_plays, ts.wins
    FROM team_stats ts
    JOIN teams t ON ts.team_id = t.id;
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }
    res.json(results);
  });
});

module.exports = router;
