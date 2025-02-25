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

// Define the POST - inserting/updating team stats
router.post('/update_team_stats', (req, res) => {
  const { team_id, game_plays, wins } = req.body;

  if (!team_id || game_plays === undefined || wins === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Check if the team_id exists in team_stats
  const checkQuery = `SELECT id, game_plays, wins FROM team_stats WHERE team_id = ?`;

  db.query(checkQuery, [team_id], (err, results) => {
    if (err) {
      console.error('Error checking existing record:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    if (results.length > 0) {
      // Record exists, update the existing record
      const existing = results[0];
      const updatedGamePlays = existing.game_plays + game_plays;
      const updatedWins = existing.wins + wins;

      const updateQuery = `UPDATE team_stats SET game_plays = ?, wins = ? WHERE team_id = ?`;

      db.query(updateQuery, [updatedGamePlays, updatedWins, team_id], (err, updateResults) => {
        if (err) {
          console.error('Error updating record:', err);
          return res.status(500).json({ error: 'Internal Server Error' });
        }
        res.json({ message: 'Team stats updated successfully' });
      });
    } else {
      // No existing record, insert new 
      const insertQuery = `INSERT INTO team_stats (team_id, game_plays, wins) VALUES (?, ?, ?)`;

      db.query(insertQuery, [team_id, game_plays, wins], (err, insertResults) => {
        if (err) {
          console.error('Error inserting new record:', err);
          return res.status(500).json({ error: 'Internal Server Error' });
        }
        res.json({ message: 'Team stats added successfully' });
      });
    }
  });
});


module.exports = router;