class Drone {
  constructor(data) {
    this.id = data.id || this.generateId();
    this.model = data.model;
    this.serialNumber = data.serialNumber;
    this.capabilities = data.capabilities || [];
    this.currentAssignment = data.currentAssignment || null;
    this.status = data.status || 'Available'; // Available, In Maintenance, Deployed, Unavailable
    this.location = data.location || '';
    this.lastMaintenance = data.lastMaintenance || null;
    this.nextMaintenance = data.nextMaintenance || null;
    this.lastUpdated = new Date().toISOString();
  }

  generateId() {
    return 'drone_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  isAvailable() {
    return this.status === 'Available';
  }

  isInMaintenance() {
    return this.status === 'In Maintenance';
  }

  isDeployed() {
    return this.status === 'Deployed';
  }

  hasCapability(capability) {
    return this.capabilities.includes(capability);
  }

  assignToProject(projectId, startDate, endDate) {
    this.currentAssignment = {
      projectId,
      startDate,
      endDate
    };
    this.status = 'Deployed';
    this.lastUpdated = new Date().toISOString();
  }

  completeAssignment() {
    this.currentAssignment = null;
    this.status = 'Available';
    this.lastUpdated = new Date().toISOString();
  }

  startMaintenance() {
    this.status = 'In Maintenance';
    this.lastMaintenance = new Date().toISOString();
    this.lastUpdated = new Date().toISOString();
  }

  completeMaintenance() {
    this.status = 'Available';
    this.nextMaintenance = this.calculateNextMaintenance();
    this.lastUpdated = new Date().toISOString();
  }

  calculateNextMaintenance() {
    const nextDate = new Date();
    nextDate.setMonth(nextDate.getMonth() + 3); // 3 months from now
    return nextDate.toISOString();
  }

  toJSON() {
    return {
      id: this.id,
      model: this.model,
      serialNumber: this.serialNumber,
      capabilities: this.capabilities,
      currentAssignment: this.currentAssignment,
      status: this.status,
      location: this.location,
      lastMaintenance: this.lastMaintenance,
      nextMaintenance: this.nextMaintenance,
      lastUpdated: this.lastUpdated
    };
  }

  static fromJSON(data) {
    return new Drone(data);
  }
}

module.exports = Drone;