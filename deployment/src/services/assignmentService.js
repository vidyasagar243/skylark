const pilotService = require('./pilotService');
const droneService = require('./droneService');

class AssignmentService {
  constructor() {
    this.assignments = [];
  }

  async initialize() {
    // Initialize dependent services
    await pilotService.initialize();
    await droneService.initialize();
  }

  async createAssignment(projectId, requirements, startDate, endDate) {
    await this.initialize();
    
    const assignment = {
      id: this.generateAssignmentId(),
      projectId,
      requirements,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      pilotId: null,
      droneId: null,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      conflicts: []
    };

    // Find suitable pilot
    const suitablePilots = await this.findSuitablePilots(requirements, startDate, endDate);
    if (suitablePilots.length > 0) {
      assignment.pilotId = suitablePilots[0].id;
    }

    // Find suitable drone
    const suitableDrones = await this.findSuitableDrones(requirements, startDate, endDate);
    if (suitableDrones.length > 0) {
      assignment.droneId = suitableDrones[0].id;
    }

    // Check for conflicts
    const conflicts = await this.checkAssignmentConflicts(assignment);
    assignment.conflicts = conflicts;

    if (conflicts.length === 0 && assignment.pilotId && assignment.droneId) {
      assignment.status = 'Confirmed';
      // Actually assign the pilot and drone
      await pilotService.assignPilot(assignment.pilotId, projectId, startDate, endDate);
      await droneService.assignDrone(assignment.droneId, projectId, startDate, endDate);
    }

    this.assignments.push(assignment);
    return assignment;
  }

  async findSuitablePilots(requirements, startDate, endDate) {
    const availablePilots = await pilotService.getAvailablePilots();
    const suitablePilots = [];

    for (const pilot of availablePilots) {
      let isSuitable = true;
      const conflicts = [];

      // Check skill level requirement
      if (requirements.minSkillLevel) {
        const skillLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
        const pilotLevelIndex = skillLevels.indexOf(pilot.skillLevel);
        const requiredLevelIndex = skillLevels.indexOf(requirements.minSkillLevel);
        
        if (pilotLevelIndex < requiredLevelIndex) {
          isSuitable = false;
          conflicts.push(`Insufficient skill level (required: ${requirements.minSkillLevel}, pilot: ${pilot.skillLevel})`);
        }
      }

      // Check required certifications
      if (requirements.requiredCertifications) {
        const missingCerts = requirements.requiredCertifications.filter(
          cert => !pilot.hasCertification(cert)
        );
        if (missingCerts.length > 0) {
          isSuitable = false;
          conflicts.push(`Missing certifications: ${missingCerts.join(', ')}`);
        }
      }

      // Check drone experience
      if (requirements.requiredDroneExperience) {
        const missingExperience = requirements.requiredDroneExperience.filter(
          drone => !pilot.hasDroneExperience(drone)
        );
        if (missingExperience.length > 0) {
          isSuitable = false;
          conflicts.push(`Lacks experience with: ${missingExperience.join(', ')}`);
        }
      }

      // Check location match
      if (requirements.location && pilot.currentLocation !== requirements.location) {
        isSuitable = false;
        conflicts.push(`Location mismatch (required: ${requirements.location}, pilot: ${pilot.currentLocation})`);
      }

      // Check date conflicts
      const dateConflicts = await pilotService.checkAssignmentConflicts(pilot.id, startDate, endDate);
      if (dateConflicts.length > 0) {
        isSuitable = false;
        conflicts.push(...dateConflicts);
      }

      if (isSuitable) {
        suitablePilots.push({
          ...pilot.toJSON(),
          matchScore: this.calculateMatchScore(pilot, requirements)
        });
      }
    }

    // Sort by match score (best matches first)
    return suitablePilots.sort((a, b) => b.matchScore - a.matchScore);
  }

  async findSuitableDrones(requirements, startDate, endDate) {
    const availableDrones = await droneService.getAvailableDrones();
    const suitableDrones = [];

    for (const drone of availableDrones) {
      let isSuitable = true;
      const conflicts = [];

      // Check required capabilities
      if (requirements.requiredCapabilities) {
        const missingCapabilities = requirements.requiredCapabilities.filter(
          cap => !drone.hasCapability(cap)
        );
        if (missingCapabilities.length > 0) {
          isSuitable = false;
          conflicts.push(`Missing capabilities: ${missingCapabilities.join(', ')}`);
        }
      }

      // Check location match
      if (requirements.location && drone.location !== requirements.location) {
        isSuitable = false;
        conflicts.push(`Location mismatch (required: ${requirements.location}, drone: ${drone.location})`);
      }

      // Check date conflicts
      const dateConflicts = await droneService.checkAssignmentConflicts(drone.id, startDate, endDate);
      if (dateConflicts.length > 0) {
        isSuitable = false;
        conflicts.push(...dateConflicts);
      }

      if (isSuitable) {
        suitableDrones.push({
          ...drone.toJSON(),
          matchScore: this.calculateDroneMatchScore(drone, requirements)
        });
      }
    }

    // Sort by match score (best matches first)
    return suitableDrones.sort((a, b) => b.matchScore - a.matchScore);
  }

  async checkAssignmentConflicts(assignment) {
    const conflicts = [];

    if (assignment.pilotId) {
      const pilotConflicts = await pilotService.checkAssignmentConflicts(
        assignment.pilotId, 
        assignment.startDate, 
        assignment.endDate
      );
      conflicts.push(...pilotConflicts.map(conflict => `Pilot: ${conflict}`));
    }

    if (assignment.droneId) {
      const droneConflicts = await droneService.checkAssignmentConflicts(
        assignment.droneId, 
        assignment.startDate, 
        assignment.endDate
      );
      conflicts.push(...droneConflicts.map(conflict => `Drone: ${conflict}`));
    }

    // Check if pilot and drone are in the same location
    if (assignment.pilotId && assignment.droneId) {
      const pilot = await pilotService.getPilotById(assignment.pilotId);
      const drone = await droneService.getDroneById(assignment.droneId);
      
      if (pilot && drone && pilot.currentLocation !== drone.location) {
        conflicts.push(`Location mismatch: Pilot in ${pilot.currentLocation}, Drone in ${drone.location}`);
      }
    }

    return conflicts;
  }

  calculateMatchScore(pilot, requirements) {
    let score = 0;
    
    // Skill level matching (max 30 points)
    const skillLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
    const pilotLevelIndex = skillLevels.indexOf(pilot.skillLevel);
    const requiredLevelIndex = requirements.minSkillLevel ? 
      skillLevels.indexOf(requirements.minSkillLevel) : 0;
    score += Math.max(0, 30 - (pilotLevelIndex - requiredLevelIndex) * 10);

    // Certification matching (max 40 points)
    if (requirements.requiredCertifications) {
      const matchingCerts = requirements.requiredCertifications.filter(
        cert => pilot.hasCertification(cert)
      );
      score += (matchingCerts.length / requirements.requiredCertifications.length) * 40;
    } else {
      score += 40; // No specific certifications required
    }

    // Drone experience matching (max 20 points)
    if (requirements.requiredDroneExperience) {
      const matchingExperience = requirements.requiredDroneExperience.filter(
        drone => pilot.hasDroneExperience(drone)
      );
      score += (matchingExperience.length / requirements.requiredDroneExperience.length) * 20;
    } else {
      score += 20; // No specific experience required
    }

    // Location matching (max 10 points)
    if (!requirements.location || pilot.currentLocation === requirements.location) {
      score += 10;
    }

    return Math.round(score);
  }

  calculateDroneMatchScore(drone, requirements) {
    let score = 0;
    
    // Capability matching (max 70 points)
    if (requirements.requiredCapabilities) {
      const matchingCaps = requirements.requiredCapabilities.filter(
        cap => drone.hasCapability(cap)
      );
      score += (matchingCaps.length / requirements.requiredCapabilities.length) * 70;
    } else {
      score += 70; // No specific capabilities required
    }

    // Location matching (max 30 points)
    if (!requirements.location || drone.location === requirements.location) {
      score += 30;
    }

    return Math.round(score);
  }

  async getAssignmentById(id) {
    return this.assignments.find(assignment => assignment.id === id);
  }

  async getAllAssignments() {
    return this.assignments;
  }

  async getAssignmentsByProject(projectId) {
    return this.assignments.filter(assignment => assignment.projectId === projectId);
  }

  async getPendingAssignments() {
    return this.assignments.filter(assignment => assignment.status === 'Pending');
  }

  async completeAssignment(assignmentId) {
    const assignment = await this.getAssignmentById(assignmentId);
    
    if (!assignment) {
      throw new Error('Assignment not found');
    }

    if (assignment.pilotId) {
      await pilotService.completePilotAssignment(assignment.pilotId);
    }

    if (assignment.droneId) {
      await droneService.completeDroneAssignment(assignment.droneId);
    }

    assignment.status = 'Completed';
    assignment.completedAt = new Date().toISOString();

    return assignment;
  }

  async reassignPilot(assignmentId, newPilotId) {
    const assignment = await this.getAssignmentById(assignmentId);
    
    if (!assignment) {
      throw new Error('Assignment not found');
    }

    // Complete current pilot assignment
    if (assignment.pilotId) {
      await pilotService.completePilotAssignment(assignment.pilotId);
    }

    // Assign new pilot
    await pilotService.assignPilot(newPilotId, assignment.projectId, assignment.startDate, assignment.endDate);
    assignment.pilotId = newPilotId;
    
    // Recheck conflicts
    const conflicts = await this.checkAssignmentConflicts(assignment);
    assignment.conflicts = conflicts;
    assignment.status = conflicts.length === 0 ? 'Confirmed' : 'Pending';

    return assignment;
  }

  async reassignDrone(assignmentId, newDroneId) {
    const assignment = await this.getAssignmentById(assignmentId);
    
    if (!assignment) {
      throw new Error('Assignment not found');
    }

    // Complete current drone assignment
    if (assignment.droneId) {
      await droneService.completeDroneAssignment(assignment.droneId);
    }

    // Assign new drone
    await droneService.assignDrone(newDroneId, assignment.projectId, assignment.startDate, assignment.endDate);
    assignment.droneId = newDroneId;
    
    // Recheck conflicts
    const conflicts = await this.checkAssignmentConflicts(assignment);
    assignment.conflicts = conflicts;
    assignment.status = conflicts.length === 0 ? 'Confirmed' : 'Pending';

    return assignment;
  }

  generateAssignmentId() {
    return 'assignment_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  async handleUrgentReassignment(projectId, reason) {
    // Find the assignment for this project
    const projectAssignment = this.assignments.find(a => a.projectId === projectId);
    
    if (!projectAssignment) {
      throw new Error('No assignment found for this project');
    }

    const urgentReassignment = {
      id: this.generateAssignmentId(),
      originalAssignmentId: projectAssignment.id,
      projectId,
      reason,
      status: 'Urgent',
      createdAt: new Date().toISOString(),
      suggestedReplacements: []
    };

    // Find alternative pilots and drones
    const suitablePilots = await this.findSuitablePilots(
      projectAssignment.requirements, 
      projectAssignment.startDate, 
      projectAssignment.endDate
    );

    const suitableDrones = await this.findSuitableDrones(
      projectAssignment.requirements, 
      projectAssignment.startDate, 
      projectAssignment.endDate
    );

    // Create suggestions for reassignment
    suitablePilots.slice(0, 3).forEach(pilot => {
      suitableDrones.slice(0, 3).forEach(drone => {
        urgentReassignment.suggestedReplacements.push({
          pilotId: pilot.id,
          pilotName: pilot.name,
          droneId: drone.id,
          droneModel: drone.model,
          urgencyScore: this.calculateUrgencyScore(pilot, drone, projectAssignment.requirements)
        });
      });
    });

    // Sort by urgency score
    urgentReassignment.suggestedReplacements.sort((a, b) => b.urgencyScore - a.urgencyScore);

    return urgentReassignment;
  }

  calculateUrgencyScore(pilot, drone, requirements) {
    // Higher score means more urgent/better replacement
    let score = 100; // Base score
    
    // Reduce score for location mismatches
    if (requirements.location) {
      if (pilot.currentLocation !== requirements.location) score -= 20;
      if (drone.location !== requirements.location) score -= 20;
    }
    
    // Reduce score for skill/certification gaps
    if (requirements.minSkillLevel) {
      const skillLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
      const gap = skillLevels.indexOf(requirements.minSkillLevel) - skillLevels.indexOf(pilot.skillLevel);
      if (gap > 0) score -= gap * 15;
    }
    
    return Math.max(0, score);
  }
}

module.exports = new AssignmentService();