const express = require('express');
const router = express.Router();
const openaiService = require('../services/openaiService');
const pilotService = require('../services/pilotService');
const droneService = require('../services/droneService');
const assignmentService = require('../services/assignmentService');

// Chat endpoint for conversational interface
router.post('/message', async (req, res) => {
  try {
    const { message, context } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Build context with current system state
    const systemContext = await buildSystemContext();
    
    const response = await openaiService.processUserQuery(message, {
      ...systemContext,
      ...context
    });

    // Handle different response types
    const actionResult = await executeAction(response, req.body);
    
    res.json({
      response: response.message,
      type: response.type,
      action: response.action,
      actionResult: actionResult,
      rawQuery: response.rawQuery
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get conversation history
router.get('/history', (req, res) => {
  try {
    const history = openaiService.getConversationHistory();
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear conversation history
router.delete('/history', (req, res) => {
  try {
    openaiService.clearConversationHistory();
    res.json({ message: 'Conversation history cleared' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function buildSystemContext() {
  await Promise.all([
    pilotService.initialize(),
    droneService.initialize(),
    assignmentService.initialize()
  ]);

  const [pilots, drones, assignments] = await Promise.all([
    pilotService.getAllPilots(),
    droneService.getAllDrones(),
    assignmentService.getAllAssignments()
  ]);

  return {
    pilotStats: {
      total: pilots.length,
      available: pilots.filter(p => p.isAvailable()).length,
      assigned: pilots.filter(p => p.currentAssignment).length
    },
    droneStats: {
      total: drones.length,
      available: drones.filter(d => d.isAvailable()).length,
      deployed: drones.filter(d => d.isDeployed()).length,
      maintenance: drones.filter(d => d.isInMaintenance()).length
    },
    assignmentStats: {
      total: assignments.length,
      pending: assignments.filter(a => a.status === 'Pending').length,
      confirmed: assignments.filter(a => a.status === 'Confirmed').length,
      completed: assignments.filter(a => a.status === 'Completed').length
    },
    pilots: pilots.slice(0, 5).map(p => ({
      id: p.id,
      name: p.name,
      location: p.currentLocation,
      status: p.status,
      skillLevel: p.skillLevel
    })),
    drones: drones.slice(0, 5).map(d => ({
      id: d.id,
      model: d.model,
      location: d.location,
      status: d.status
    }))
  };
}

async function executeAction(response, requestBody) {
  try {
    switch (response.action) {
      case 'suggest_pilots':
        return await handlePilotSuggestion(requestBody);
      case 'suggest_drones':
        return await handleDroneSuggestion(requestBody);
      case 'create_assignment':
        return await handleAssignmentCreation(requestBody);
      case 'handle_urgent':
        return await handleUrgentReassignment(requestBody);
      case 'resolve_conflict':
        return await handleConflictResolution(requestBody);
      default:
        return null;
    }
  } catch (error) {
    console.error('Action execution error:', error);
    return { error: error.message };
  }
}

async function handlePilotSuggestion(requestBody) {
  const { requirements, startDate, endDate } = requestBody;
  if (requirements && startDate && endDate) {
    return await assignmentService.findSuitablePilots(requirements, startDate, endDate);
  }
  return await pilotService.getAvailablePilots();
}

async function handleDroneSuggestion(requestBody) {
  const { requirements, startDate, endDate } = requestBody;
  if (requirements && startDate && endDate) {
    return await assignmentService.findSuitableDrones(requirements, startDate, endDate);
  }
  return await droneService.getAvailableDrones();
}

async function handleAssignmentCreation(requestBody) {
  const { projectId, requirements, startDate, endDate } = requestBody;
  if (projectId && requirements && startDate && endDate) {
    return await assignmentService.createAssignment(projectId, requirements, startDate, endDate);
  }
  return null;
}

async function handleUrgentReassignment(requestBody) {
  const { projectId, reason } = requestBody;
  if (projectId && reason) {
    return await assignmentService.handleUrgentReassignment(projectId, reason);
  }
  return null;
}

async function handleConflictResolution(requestBody) {
  // This would implement specific conflict resolution logic
  return { message: 'Conflict resolution assistance provided' };
}

module.exports = router;