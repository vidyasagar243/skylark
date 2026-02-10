require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Routes
const pilotRoutes = require('./routes/pilotRoutes');
const droneRoutes = require('./routes/droneRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const chatRoutes = require('./routes/chatRoutes');

app.use('/api/pilots', pilotRoutes);
app.use('/api/drones', droneRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/chat', chatRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Drone Coordinator API is running' });
});

// Serve the main HTML page
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.listen(PORT, () => {
  console.log(`🚀 Drone Coordinator API running on port ${PORT}`);
  console.log(`📱 Access the application at http://localhost:${PORT}`);
});