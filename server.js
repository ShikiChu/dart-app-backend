const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(bodyParser.json());


// MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root', 
  password: 'dbPassword', 
  database: 'dartApp',
});

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL database');
});

// Import and use the team routes
const teamRoutes = require('./routes/teams');
app.use('/api/teams', teamRoutes);

// Import and use the team routes
const dartScoreRoutes = require('./routes/dart_score');
app.use('/api/dart_score', dartScoreRoutes);


// JWT secret key
const JWT_SECRET = 'secret-key';

// Middleware to verify JWT token
const authenticate = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).send({ error: 'Unauthorized' });
  }
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).send({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Register a new user
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  db.query(
    'INSERT INTO users (username, password) VALUES (?, ?)',
    [username, hashedPassword],
    (err, result) => {
      if (err) {
        return res.status(400).send({ error: 'Username already exists' });
      }
      res.send({ success: true });
    }
  );
});

// Login and generate JWT token
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  db.query(
    'SELECT * FROM users WHERE username = ?',
    [username],
    async (err, results) => {
      if (err || results.length === 0) {
        return res.status(400).send({ error: 'Invalid username or password' });
      }
      const user = results[0];
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(400).send({ error: 'Invalid username or password' });
      }
      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
      res.send({ token });
    }
  );
});


// WebSocket connection
io.on('connection', (socket) => {
  console.log('A client connected:', socket.id);
});



server.listen(5000, () => console.log('Server running on port 5000'));