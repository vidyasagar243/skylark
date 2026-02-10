require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Routes
const pilotRoutes = require('./src/routes/pilotRoutes');
const droneRoutes = require('./src/routes/droneRoutes');
const assignmentRoutes = require('./src/routes/assignmentRoutes');
const chatRoutes = require('./src/routes/chatRoutes');

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
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Handle 404 for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Drone Coordinator API running on port ${PORT}`);
  console.log(`📱 Access the application at http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Export app for testing or deployment
module.exports = app;