const Pilot = require('../models/Pilot');
const googleSheetsService = require('./googleSheetsService');

class PilotService {
  constructor() {
    this.pilots = [];
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      const pilotData = await googleSheetsService.readPilotData();
      this.pilots = pilotData.map(data => new Pilot(data));
      this.initialized = true;
      console.log(`✅ Loaded ${this.pilots.length} pilots`);
    } catch (error) {
      console.error('Error initializing pilot service:', error);
      // Initialize with mock data
      this.pilots = [
        new Pilot({
          id: 'pilot_001',
          name: 'John Smith',
          skillLevel: 'Advanced',
          certifications: ['Commercial', 'Night Operations', 'BVLOS'],
          droneExperience: ['DJI Mavic 3', 'DJI Phantom 4', 'Autel EVO'],
          currentLocation: 'New York',
          status: 'Available'
        }),
        new Pilot({
          id: 'pilot_002',
          name: 'Sarah Johnson',
          skillLevel: 'Intermediate',
          certifications: ['Commercial', 'Thermal Imaging'],
          droneExperience: ['DJI Mavic 2', 'Parrot Anafi'],
          currentLocation: 'Los Angeles',
          status: 'Available'
        }),
        new Pilot({
          id: 'pilot_003',
          name: 'Mike Chen',
          skillLevel: 'Expert',
          certifications: ['Commercial', 'Night Operations', 'BVLOS', 'Multirotor'],
          droneExperience: ['DJI Mavic 3', 'Autel EVO II', 'DJI Matrice 300'],
          currentLocation: 'Chicago',
          status: 'Assigned'
        })
      ];
      this.initialized = true;
    }
  }

  async getAllPilots() {
    await this.initialize();
    return this.pilots;
  }

  async getPilotById(id) {
    await this.initialize();
    return this.pilots.find(pilot => pilot.id === id);
  }

  async getAvailablePilots() {
    await this.initialize();
    return this.pilots.filter(pilot => pilot.isAvailable());
  }

  async getPilotsByLocation(location) {
    await this.initialize();
    return this.pilots.filter(pilot => 
      pilot.currentLocation.toLowerCase().includes(location.toLowerCase())
    );
  }

  async getPilotsBySkillLevel(skillLevel) {
    await this.initialize();
    return this.pilots.filter(pilot => 
      pilot.skillLevel.toLowerCase() === skillLevel.toLowerCase()
    );
  }

  async getPilotsByCertification(certification) {
    await this.initialize();
    return this.pilots.filter(pilot => pilot.hasCertification(certification));
  }

  async updatePilotStatus(pilotId, status) {
    await this.initialize();
    const pilot = await this.getPilotById(pilotId);
    
    if (!pilot) {
      throw new Error('Pilot not found');
    }

    // Update in memory
    pilot.status = status;
    pilot.lastUpdated = new Date().toISOString();

    // Update in Google Sheets
    try {
      await googleSheetsService.updatePilotStatus(pilotId, status);
    } catch (error) {
      console.error('Failed to update Google Sheets:', error.message);
    }

    return pilot;
  }

  async assignPilot(pilotId, projectId, startDate, endDate) {
    await this.initialize();
    const pilot = await this.getPilotById(pilotId);
    
    if (!pilot) {
      throw new Error('Pilot not found');
    }

    if (!pilot.isAvailable()) {
      throw new Error('Pilot is not available for assignment');
    }

    // Check for conflicts
    const conflicts = await this.checkAssignmentConflicts(pilotId, startDate, endDate);
    if (conflicts.length > 0) {
      throw new Error(`Assignment conflicts detected: ${conflicts.join(', ')}`);
    }

    pilot.assignToProject(projectId, startDate, endDate);
    return pilot;
  }

  async completePilotAssignment(pilotId) {
    await this.initialize();
    const pilot = await this.getPilotById(pilotId);
    
    if (!pilot) {
      throw new Error('Pilot not found');
    }

    pilot.completeAssignment();
    return pilot;
  }

  async checkAssignmentConflicts(pilotId, startDate, endDate) {
    await this.initialize();
    const pilot = await this.getPilotById(pilotId);
    const conflicts = [];

    if (!pilot) return conflicts;

    // Check if pilot already has an assignment during this period
    if (pilot.currentAssignment) {
      const existingStart = new Date(pilot.currentAssignment.startDate);
      const existingEnd = new Date(pilot.currentAssignment.endDate);
      const newStart = new Date(startDate);
      const newEnd = new Date(endDate);

      if ((newStart >= existingStart && newStart <= existingEnd) ||
          (newEnd >= existingStart && newEnd <= existingEnd) ||
          (newStart <= existingStart && newEnd >= existingEnd)) {
        conflicts.push('Overlapping assignment dates');
      }
    }

    // Check if pilot has required certifications (this would be checked against project requirements)
    // This is a simplified check - in reality, you'd check against specific project requirements
    if (pilot.certifications.length === 0) {
      conflicts.push('No certifications found');
    }

    return conflicts;
  }

  async searchPilots(query) {
    await this.initialize();
    const searchTerm = query.toLowerCase();
    
    return this.pilots.filter(pilot => 
      pilot.name.toLowerCase().includes(searchTerm) ||
      pilot.currentLocation.toLowerCase().includes(searchTerm) ||
      pilot.skillLevel.toLowerCase().includes(searchTerm) ||
      pilot.certifications.some(cert => cert.toLowerCase().includes(searchTerm)) ||
      pilot.droneExperience.some(drone => drone.toLowerCase().includes(searchTerm))
    );
  }
}

module.exports = new PilotService();