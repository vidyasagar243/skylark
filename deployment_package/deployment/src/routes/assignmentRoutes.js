const express = require('express');
const router = express.Router();
const assignmentService = require('../services/assignmentService');

// Create new assignment
router.post('/', async (req, res) => {
  try {
    const { projectId, requirements, startDate, endDate } = req.body;
    
    if (!projectId || !requirements || !startDate || !endDate) {
      return res.status(400).json({ 
        error: 'projectId, requirements, startDate, and endDate are required' 
      });
    }
    
    const assignment = await assignmentService.createAssignment(
      projectId, 
      requirements, 
      startDate, 
      endDate
    );
    
    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all assignments
router.get('/', async (req, res) => {
  try {
    const assignments = await assignmentService.getAllAssignments();
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get assignment by ID
router.get('/:id', async (req, res) => {
  try {
    const assignment = await assignmentService.getAssignmentById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    res.json(assignment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get assignments by project
router.get('/project/:projectId', async (req, res) => {
  try {
    const assignments = await assignmentService.getAssignmentsByProject(req.params.projectId);
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get pending assignments
router.get('/status/pending', async (req, res) => {
  try {
    const assignments = await assignmentService.getPendingAssignments();
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Complete assignment
router.post('/:id/complete', async (req, res) => {
  try {
    const assignment = await assignmentService.completeAssignment(req.params.id);
    res.json(assignment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reassign pilot
router.put('/:id/reassign/pilot', async (req, res) => {
  try {
    const { pilotId } = req.body;
    if (!pilotId) {
      return res.status(400).json({ error: 'pilotId is required' });
    }
    
    const assignment = await assignmentService.reassignPilot(req.params.id, pilotId);
    res.json(assignment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reassign drone
router.put('/:id/reassign/drone', async (req, res) => {
  try {
    const { droneId } = req.body;
    if (!droneId) {
      return res.status(400).json({ error: 'droneId is required' });
    }
    
    const assignment = await assignmentService.reassignDrone(req.params.id, droneId);
    res.json(assignment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Find suitable pilots for requirements
router.post('/pilots/suitable', async (req, res) => {
  try {
    const { requirements, startDate, endDate } = req.body;
    
    if (!requirements || !startDate || !endDate) {
      return res.status(400).json({ 
        error: 'requirements, startDate, and endDate are required' 
      });
    }
    
    const pilots = await assignmentService.findSuitablePilots(
      requirements, 
      startDate, 
      endDate
    );
    
    res.json(pilots);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Find suitable drones for requirements
router.post('/drones/suitable', async (req, res) => {
  try {
    const { requirements, startDate, endDate } = req.body;
    
    if (!requirements || !startDate || !endDate) {
      return res.status(400).json({ 
        error: 'requirements, startDate, and endDate are required' 
      });
    }
    
    const drones = await assignmentService.findSuitableDrones(
      requirements, 
      startDate, 
      endDate
    );
    
    res.json(drones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Handle urgent reassignment
router.post('/urgent/:projectId', async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({ error: 'Reason is required for urgent reassignment' });
    }
    
    const urgentReassignment = await assignmentService.handleUrgentReassignment(
      req.params.projectId, 
      reason
    );
    
    res.status(201).json(urgentReassignment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;