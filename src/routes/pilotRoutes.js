const express = require('express');
const router = express.Router();
const pilotService = require('../services/pilotService');

// Get all pilots
router.get('/', async (req, res) => {
  try {
    const pilots = await pilotService.getAllPilots();
    res.json(pilots.map(pilot => pilot.toJSON()));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get pilot by ID
router.get('/:id', async (req, res) => {
  try {
    const pilot = await pilotService.getPilotById(req.params.id);
    if (!pilot) {
      return res.status(404).json({ error: 'Pilot not found' });
    }
    res.json(pilot.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get available pilots
router.get('/status/available', async (req, res) => {
  try {
    const pilots = await pilotService.getAvailablePilots();
    res.json(pilots.map(pilot => pilot.toJSON()));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get pilots by location
router.get('/location/:location', async (req, res) => {
  try {
    const pilots = await pilotService.getPilotsByLocation(req.params.location);
    res.json(pilots.map(pilot => pilot.toJSON()));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get pilots by skill level
router.get('/skill/:level', async (req, res) => {
  try {
    const pilots = await pilotService.getPilotsBySkillLevel(req.params.level);
    res.json(pilots.map(pilot => pilot.toJSON()));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get pilots by certification
router.get('/certification/:cert', async (req, res) => {
  try {
    const pilots = await pilotService.getPilotsByCertification(req.params.cert);
    res.json(pilots.map(pilot => pilot.toJSON()));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update pilot status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    const pilot = await pilotService.updatePilotStatus(req.params.id, status);
    res.json(pilot.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Assign pilot to project
router.post('/:id/assign', async (req, res) => {
  try {
    const { projectId, startDate, endDate } = req.body;
    
    if (!projectId || !startDate || !endDate) {
      return res.status(400).json({ error: 'projectId, startDate, and endDate are required' });
    }
    
    const pilot = await pilotService.assignPilot(req.params.id, projectId, startDate, endDate);
    res.json(pilot.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Complete pilot assignment
router.post('/:id/complete', async (req, res) => {
  try {
    const pilot = await pilotService.completePilotAssignment(req.params.id);
    res.json(pilot.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search pilots
router.get('/search/:query', async (req, res) => {
  try {
    const pilots = await pilotService.searchPilots(req.params.query);
    res.json(pilots.map(pilot => pilot.toJSON()));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;