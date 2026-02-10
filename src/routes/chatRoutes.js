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

    // Check for specific commands that we can handle without AI
    const lowerMessage = message.toLowerCase();
    
    // Handle urgent reassignment command
    if (lowerMessage.includes('urgent reassignment') || lowerMessage.includes('emergency reassignment')) {
      const response = await handleUrgentReassignmentCommand(message);
      return res.json({
        response: response.message,
        type: response.type,
        action: response.action,
        actionResult: response.actionResult,
        rawQuery: message
      });
    }
    
    // Handle new assignment command
    if (lowerMessage.includes('new assignment') || lowerMessage.includes('create assignment')) {
      const response = await handleCreateAssignmentCommand(message);
      return res.json({
        response: response.message,
        type: response.type,
        action: response.action,
        actionResult: response.actionResult,
        rawQuery: message
      });
    }
    
    // Build context with current system state
    const systemContext = await buildSystemContext();
    
    let response;
    try {
      response = await openaiService.processUserQuery(message, {
        ...systemContext,
        ...context
      });
    } catch (aiError) {
      // If AI service fails, provide a fallback response
      console.error('AI Service Error:', aiError.message);
      response = {
        type: 'fallback',
        message: getFallbackResponse(message),
        action: 'information_request',
        rawQuery: message
      };
    }

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

// New functions to handle specific commands
async function handleUrgentReassignmentCommand(message) {
  // Extract project ID and reason from the message more flexibly
  let projectId = null;
  let reason = null;
  
  // Look for various patterns that indicate project ID
  const projectIdPatterns = [
    /project\s+([A-Za-z0-9_-]+)/i,
    /project[:\s]+([A-Za-z0-9_-]+)/i,
    /for\s+([A-Za-z0-9_-]+)/i,
    /id[:\s]+([A-Za-z0-9_-]+)/i
  ];
  
  for (const pattern of projectIdPatterns) {
    const match = message.match(pattern);
    if (match) {
      projectId = match[1];
      break;
    }
  }
  
  // Look for various patterns that indicate reason
  const reasonPatterns = [
    /reason[:\s]+(.+)/i,
    /because[:\s]+(.+)/i,
    /due\s+to\s+(.+)/i,
    /cause[:\s]+(.+)/i,
    /reason\s+is\s+(.+)/i
  ];
  
  for (const pattern of reasonPatterns) {
    const match = message.match(pattern);
    if (match) {
      reason = match[1].trim();
      break;
    }
  }
  
  // If we couldn't extract both, try to infer from the message structure
  if (!projectId || !reason) {
    const words = message.split(/\s+/);
    for (let i = 0; i < words.length; i++) {
      if (words[i].toLowerCase().includes('project') && i + 1 < words.length) {
        projectId = words[i + 1];
        break;
      }
    }
    
    // Extract reason as everything after key phrases
    const reasonStart = message.toLowerCase().match(/(because|due to|reason)/i);
    if (reasonStart) {
      reason = message.substring(reasonStart.index + reasonStart[0].length).trim();
    }
  }
  
  if (projectId && reason) {
    try {
      const result = await assignmentService.handleUrgentReassignment(projectId, reason);
      return {
        type: 'urgent_response',
        message: `Urgent reassignment processed for Project ${projectId}. Reason: ${reason}. Found ${result.suggestedReplacements.length} potential replacements.`,
        action: 'handle_urgent',
        actionResult: result
      };
    } catch (error) {
      return {
        type: 'error',
        message: `Error processing urgent reassignment: ${error.message}`,
        action: 'handle_urgent',
        actionResult: { error: error.message }
      };
    }
  } else {
    return {
      type: 'request_info',
      message: 'Please provide the project ID and reason for urgent reassignment. Example: "Urgent reassignment for project ABC123 because of equipment failure"',
      action: 'awaiting_details',
      actionResult: null
    };
  }
}

async function handleCreateAssignmentCommand(message) {
  // Extract assignment details more flexibly
  const assignmentDetails = extractAssignmentDetails(message);
  
  if (assignmentDetails.projectId) {
    return {
      type: 'request_details',
      message: `I can help create an assignment for Project ${assignmentDetails.projectId}. Requirements extracted: ${JSON.stringify(assignmentDetails)}. For full details, please use structured format: "Create assignment for [PROJECT_ID] with requirements [SKILL_LEVEL, LOCATION, CERTIFICATIONS] from [START_DATE] to [END_DATE]"`,
      action: 'awaiting_assignment_details',
      actionResult: assignmentDetails
    };
  } else {
    return {
      type: 'request_info',
      message: 'Please provide the project ID and requirements for the new assignment. Example: "Create assignment for project ABC123 requiring Advanced skill level, located in New York, from 2026-02-15 to 2026-02-20"',
      action: 'awaiting_details',
      actionResult: null
    };
  }
}

function extractAssignmentDetails(message) {
  const details = {};
  
  // Extract project ID
  const projectIdPatterns = [
    /project\s+([A-Za-z0-9_-]+)/i,
    /project[:\s]+([A-Za-z0-9_-]+)/i,
    /for\s+([A-Za-z0-9_-]+)/i
  ];
  
  for (const pattern of projectIdPatterns) {
    const match = message.match(pattern);
    if (match) {
      details.projectId = match[1];
      break;
    }
  }
  
  // Extract skill level
  const skillLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
  for (const level of skillLevels) {
    if (message.toLowerCase().includes(level)) {
      details.skillLevel = level.charAt(0).toUpperCase() + level.slice(1);
      break;
    }
  }
  
  // Extract location
  const locationPatterns = [
    /location[:\s]+([A-Za-z\s]+)/i,
    /located\s+in\s+([A-Za-z\s]+)/i,
    /in\s+([A-Za-z\s]+)/i
  ];
  
  for (const pattern of locationPatterns) {
    const match = message.match(pattern);
    if (match) {
      details.location = match[1].trim();
      break;
    }
  }
  
  // Extract dates
  const datePattern = /(\d{4}-\d{2}-\d{2})/;
  const dates = message.match(new RegExp(datePattern, 'g'));
  if (dates && dates.length >= 2) {
    details.startDate = dates[0];
    details.endDate = dates[1];
  } else if (dates && dates.length === 1) {
    details.startDate = dates[0];
  }
  
  return details;
}

function getFallbackResponse(message) {
  const lowerMsg = message.toLowerCase();
  
  if (lowerMsg.includes('pilot') && (lowerMsg.includes('available') || lowerMsg.includes('show'))) {
    return "I'm having trouble connecting to the AI service, but I can tell you that there are pilots available in the system. You can check the dashboard for current availability.";
  } else if (lowerMsg.includes('drone') && (lowerMsg.includes('available') || lowerMsg.includes('show'))) {
    return "I'm having trouble connecting to the AI service, but I can tell you that there are drones available in the system. You can check the dashboard for current availability.";
  } else if (lowerMsg.includes('urgent') || lowerMsg.includes('emergency')) {
    return "I'm having trouble connecting to the AI service. For urgent reassignment, please use the 'Urgent Reassignment' button in the quick actions section, or provide the project ID and reason in the format: 'Urgent reassignment for [PROJECT_ID] because [REASON]'";
  } else if (lowerMsg.includes('assign') || lowerMsg.includes('assignment')) {
    return "I'm having trouble connecting to the AI service. To create an assignment, please use the 'New Assignment' button in the quick actions section, or provide project details in the format: 'Create assignment for [PROJECT_ID] with requirements [REQUIREMENTS] from [START_DATE] to [END_DATE]'";
  } else {
    return "I'm having trouble connecting to the AI service at the moment. Please try using the quick action buttons or check the dashboard for information. You can also try rephrasing your request.";
  }
}

module.exports = router;