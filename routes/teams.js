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

// Post a new team 
router.post('/create', (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Team name is required' });
  }

  const sql = 'INSERT INTO teams (name) VALUES (?)';
  db.query(sql, [name], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Database error', details: err });
    }
    res.status(201).json({ success: true, message: 'Team created', teamId: result.insertId });
  });
});

// GET all teams
router.get('/', (req, res) => {
  const sql = 'SELECT * FROM teams'; 
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error', details: err });
    }
    res.status(200).json({ teams: results });
  });
});

// POST create a new teammate
router.post('/:teamId/teammates', (req, res) => {
  const { teamId } = req.params; // Extract teamId from the URL
  const { name } = req.body;     // Get teammate's name 

  // check if id and names are existing
  if (!teamId || !name) {
    return res.status(400).json({ error: 'Team ID and teammate name are required' });
  }

  // SQL to insert
  const sql = 'INSERT INTO teammates (name, team_id) VALUES (?, ?)';
  
  db.query(sql, [name, teamId], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Database error', details: err });
    }
    res.status(201).json({ message: 'Teammate added successfully', teammateId: result.insertId });
  });
});

// GET all teammates
router.get('/teammates', (req, res) => {
  const sql = 'SELECT * FROM teammates';

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error', details: err });
    }

    res.status(200).json(results);
  });
});



// PUT to assign teammate to an existing team
router.put('/teammates/:teammateId', (req, res) => {
  const { teammateId } = req.params;  // Extract teammateId from the URL
  const { teamId } = req.body;        // Get the existing teamId from the request body

  // Check if the teamId is provided
  if (!teamId) {
    return res.status(400).json({ error: 'Team ID is required' });
  }

  // Check if the teammate exists
  db.query('SELECT * FROM teammates WHERE id = ?', [teammateId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error', details: err });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Teammate not found' });
    }

    // Check if the team exists
    db.query('SELECT * FROM teams WHERE id = ?', [teamId], (err, teamResults) => {
      if (err) {
        return res.status(500).json({ error: 'Database error', details: err });
      }
      if (teamResults.length === 0) {
        return res.status(404).json({ error: 'Team not found' });
      }

      // Update teammate's team_id to the new team
      const sql = 'UPDATE teammates SET team_id = ? WHERE id = ?';
      db.query(sql, [teamId, teammateId], (err, result) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to update teammate', details: err });
        }
        res.status(200).json({ message: 'Teammate assigned to the new team successfully' });
      });
    });
  });
})

// GET all teams with their teammates
router.get('/teams-with-teammates', (req, res) => {
  const sql = `
    SELECT 
      t.id AS team_id, 
      t.name AS team_name, 
      IFNULL(JSON_ARRAYAGG(
        CASE 
          WHEN te.id IS NOT NULL THEN JSON_OBJECT('id', te.id, 'name', te.name) 
          ELSE NULL 
        END
      ), '[]') AS teammates
    FROM teams t
    LEFT JOIN teammates te ON t.id = te.team_id
    GROUP BY t.id
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error', details: err });
    }

    // Ensure teammates are parsed correctly
    const teamsWithTeammates = results.map(team => ({
      team_id: team.team_id,
      team_name: team.team_name,
      teammates: team.teammates ? JSON.parse(team.teammates) : []
    }));

    res.status(200).json(teamsWithTeammates);
  });
});



module.exports = router;
