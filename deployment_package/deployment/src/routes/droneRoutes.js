const express = require('express');
const router = express.Router();
const droneService = require('../services/droneService');

// Get all drones
router.get('/', async (req, res) => {
  try {
    const drones = await droneService.getAllDrones();
    res.json(drones.map(drone => drone.toJSON()));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get drone by ID
router.get('/:id', async (req, res) => {
  try {
    const drone = await droneService.getDroneById(req.params.id);
    if (!drone) {
      return res.status(404).json({ error: 'Drone not found' });
    }
    res.json(drone.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get available drones
router.get('/status/available', async (req, res) => {
  try {
    const drones = await droneService.getAvailableDrones();
    res.json(drones.map(drone => drone.toJSON()));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get drones by location
router.get('/location/:location', async (req, res) => {
  try {
    const drones = await droneService.getDronesByLocation(req.params.location);
    res.json(drones.map(drone => drone.toJSON()));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get drones by capability
router.get('/capability/:capability', async (req, res) => {
  try {
    const drones = await droneService.getDronesByCapability(req.params.capability);
    res.json(drones.map(drone => drone.toJSON()));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get drones by model
router.get('/model/:model', async (req, res) => {
  try {
    const drones = await droneService.getDronesByModel(req.params.model);
    res.json(drones.map(drone => drone.toJSON()));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update drone status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    const drone = await droneService.updateDroneStatus(req.params.id, status);
    res.json(drone.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start drone maintenance
router.post('/:id/maintenance/start', async (req, res) => {
  try {
    const drone = await droneService.startDroneMaintenance(req.params.id);
    res.json(drone.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Complete drone maintenance
router.post('/:id/maintenance/complete', async (req, res) => {
  try {
    const drone = await droneService.completeDroneMaintenance(req.params.id);
    res.json(drone.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Assign drone to project
router.post('/:id/assign', async (req, res) => {
  try {
    const { projectId, startDate, endDate } = req.body;
    
    if (!projectId || !startDate || !endDate) {
      return res.status(400).json({ error: 'projectId, startDate, and endDate are required' });
    }
    
    const drone = await droneService.assignDrone(req.params.id, projectId, startDate, endDate);
    res.json(drone.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Complete drone assignment
router.post('/:id/complete', async (req, res) => {
  try {
    const drone = await droneService.completeDroneAssignment(req.params.id);
    res.json(drone.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search drones
router.get('/search/:query', async (req, res) => {
  try {
    const drones = await droneService.searchDrones(req.params.query);
    res.json(drones.map(drone => drone.toJSON()));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get maintenance alerts
router.get('/alerts/maintenance', async (req, res) => {
  try {
    const alerts = await droneService.getMaintenanceAlerts();
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;