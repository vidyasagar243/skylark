const Drone = require('../models/Drone');
const googleSheetsService = require('./googleSheetsService');

class DroneService {
  constructor() {
    this.drones = [];
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      const droneData = await googleSheetsService.readDroneData();
      this.drones = droneData.map(data => new Drone(data));
      this.initialized = true;
      console.log(`✅ Loaded ${this.drones.length} drones`);
    } catch (error) {
      console.error('Error initializing drone service:', error);
      // Initialize with mock data
      this.drones = [
        new Drone({
          id: 'drone_001',
          model: 'DJI Mavic 3',
          serialNumber: 'DJIM3-001',
          capabilities: ['4K Camera', 'Obstacle Avoidance', 'GPS'],
          status: 'Available',
          location: 'New York'
        }),
        new Drone({
          id: 'drone_002',
          model: 'Autel EVO II',
          serialNumber: 'AUTEVO2-001',
          capabilities: ['8K Camera', 'Thermal Imaging', 'GPS'],
          status: 'Available',
          location: 'Los Angeles'
        }),
        new Drone({
          id: 'drone_003',
          model: 'DJI Matrice 300',
          serialNumber: 'DJIM300-001',
          capabilities: ['Industrial Grade', 'Multiple Payloads', 'RTK GPS', 'Obstacle Avoidance'],
          status: 'Deployed',
          location: 'Chicago'
        })
      ];
      this.initialized = true;
    }
  }

  async getAllDrones() {
    await this.initialize();
    return this.drones;
  }

  async getDroneById(id) {
    await this.initialize();
    return this.drones.find(drone => drone.id === id);
  }

  async getAvailableDrones() {
    await this.initialize();
    return this.drones.filter(drone => drone.isAvailable());
  }

  async getDronesByLocation(location) {
    await this.initialize();
    return this.drones.filter(drone => 
      drone.location.toLowerCase().includes(location.toLowerCase())
    );
  }

  async getDronesByCapability(capability) {
    await this.initialize();
    return this.drones.filter(drone => drone.hasCapability(capability));
  }

  async getDronesByModel(model) {
    await this.initialize();
    return this.drones.filter(drone => 
      drone.model.toLowerCase().includes(model.toLowerCase())
    );
  }

  async updateDroneStatus(droneId, status) {
    await this.initialize();
    const drone = await this.getDroneById(droneId);
    
    if (!drone) {
      throw new Error('Drone not found');
    }

    // Update in memory
    drone.status = status;
    drone.lastUpdated = new Date().toISOString();

    // In a real implementation, you'd also update Google Sheets here
    console.log(`Drone ${droneId} status updated to ${status}`);

    return drone;
  }

  async startDroneMaintenance(droneId) {
    await this.initialize();
    const drone = await this.getDroneById(droneId);
    
    if (!drone) {
      throw new Error('Drone not found');
    }

    if (drone.isDeployed()) {
      throw new Error('Cannot start maintenance on deployed drone');
    }

    drone.startMaintenance();
    return drone;
  }

  async completeDroneMaintenance(droneId) {
    await this.initialize();
    const drone = await this.getDroneById(droneId);
    
    if (!drone) {
      throw new Error('Drone not found');
    }

    if (!drone.isInMaintenance()) {
      throw new Error('Drone is not in maintenance');
    }

    drone.completeMaintenance();
    return drone;
  }

  async assignDrone(droneId, projectId, startDate, endDate) {
    await this.initialize();
    const drone = await this.getDroneById(droneId);
    
    if (!drone) {
      throw new Error('Drone not found');
    }

    if (!drone.isAvailable()) {
      throw new Error(`Drone is not available for assignment (Status: ${drone.status})`);
    }

    // Check for conflicts
    const conflicts = await this.checkAssignmentConflicts(droneId, startDate, endDate);
    if (conflicts.length > 0) {
      throw new Error(`Assignment conflicts detected: ${conflicts.join(', ')}`);
    }

    drone.assignToProject(projectId, startDate, endDate);
    return drone;
  }

  async completeDroneAssignment(droneId) {
    await this.initialize();
    const drone = await this.getDroneById(droneId);
    
    if (!drone) {
      throw new Error('Drone not found');
    }

    drone.completeAssignment();
    return drone;
  }

  async checkAssignmentConflicts(droneId, startDate, endDate) {
    await this.initialize();
    const drone = await this.getDroneById(droneId);
    const conflicts = [];

    if (!drone) return conflicts;

    // Check if drone already has an assignment during this period
    if (drone.currentAssignment) {
      const existingStart = new Date(drone.currentAssignment.startDate);
      const existingEnd = new Date(drone.currentAssignment.endDate);
      const newStart = new Date(startDate);
      const newEnd = new Date(endDate);

      if ((newStart >= existingStart && newStart <= existingEnd) ||
          (newEnd >= existingStart && newEnd <= existingEnd) ||
          (newStart <= existingStart && newEnd >= existingEnd)) {
        conflicts.push('Overlapping assignment dates');
      }
    }

    // Check if drone is in maintenance
    if (drone.isInMaintenance()) {
      conflicts.push('Drone is currently in maintenance');
    }

    return conflicts;
  }

  async searchDrones(query) {
    await this.initialize();
    const searchTerm = query.toLowerCase();
    
    return this.drones.filter(drone => 
      drone.model.toLowerCase().includes(searchTerm) ||
      drone.serialNumber.toLowerCase().includes(searchTerm) ||
      drone.location.toLowerCase().includes(searchTerm) ||
      drone.capabilities.some(cap => cap.toLowerCase().includes(searchTerm))
    );
  }

  async getMaintenanceAlerts() {
    await this.initialize();
    const alerts = [];
    const now = new Date();
    
    this.drones.forEach(drone => {
      if (drone.nextMaintenance) {
        const nextMaintenanceDate = new Date(drone.nextMaintenance);
        const daysUntilMaintenance = Math.ceil((nextMaintenanceDate - now) / (1000 * 60 * 60 * 24));
        
        if (daysUntilMaintenance <= 7 && daysUntilMaintenance > 0) {
          alerts.push({
            droneId: drone.id,
            model: drone.model,
            serialNumber: drone.serialNumber,
            daysUntilMaintenance,
            message: `Maintenance due in ${daysUntilMaintenance} days`
          });
        }
      }
    });

    return alerts;
  }
}

module.exports = new DroneService();