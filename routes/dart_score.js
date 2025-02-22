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

// update score records or insert a new record
router.put('/scores/:playerid', (req, res) => {
  const { playerid } = req.params;
  const { total_points, shots, games_finished, hs, h_finish, high_scores_171_180 } = req.body;

  // Retrieve the existing record for the player
  const selectSql = `SELECT * FROM dart_scores WHERE playerid = ?`;

  db.query(selectSql, [playerid], (err, result) => {
    if (err) {
      console.error('Error retrieving player data:', err);
      return res.status(500).json({ error: 'Database error while retrieving player data' });
    }

    // If no record exists for the player, insert a new one
    if (result.length === 0) {
      const insertSql = `
        INSERT INTO dart_scores (playerid, total_points, shots, games_finished, hs, h_finish, high_scores_171_180)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      const values = [
        playerid, 
        total_points || 0, 
        shots || 0, 
        games_finished || 0, 
        hs || 0, 
        h_finish || 0, 
        high_scores_171_180 || 0
      ];

      db.query(insertSql, values, (err, result) => {
        if (err) {
          console.error('Error inserting new record:', err);
          return res.status(500).json({ error: 'Database error while inserting new record' });
        }
        res.json({ message: 'New dart score inserted', affectedRows: result.affectedRows });
      });
    } else {
      // Accumulate the values
      const existingRecord = result[0];
      
      const newTotalPoints = (existingRecord.total_points || 0) + (total_points || 0);
      const newShots = (existingRecord.shots || 0) + (shots || 0);
      const newGamesFinished = (existingRecord.games_finished || 0) + (games_finished || 0);
      const newHighScores171180 = (existingRecord.high_scores_171_180 || 0) + (high_scores_171_180 || 0);
      const newHs = hs && hs > existingRecord.hs ? hs : existingRecord.hs;
      const newHFinish = h_finish && h_finish > existingRecord.h_finish ? h_finish : existingRecord.h_finish;

      // Update the record with accumulated values
      const updateSql = `
        UPDATE dart_scores SET 
          total_points = ?, 
          shots = ?, 
          games_finished = ?, 
          high_scores_171_180 = ?, 
          hs = ?, 
          h_finish = ? 
        WHERE playerid = ?
      `;

      const updateValues = [
        newTotalPoints,
        newShots,
        newGamesFinished,
        newHighScores171180,
        newHs,
        newHFinish,
        playerid
      ];

      db.query(updateSql, updateValues, (err, result) => {
        if (err) {
          console.error('Error updating dart score:', err);
          return res.status(500).json({ error: 'Database error while updating score' });
        }
        res.json({ message: 'Dart score updated', affectedRows: result.affectedRows });
      });
    }
  });
});



module.exports = router;
