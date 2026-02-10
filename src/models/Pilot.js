class Pilot {
  constructor(data) {
    this.id = data.id || this.generateId();
    this.name = data.name;
    this.skillLevel = data.skillLevel || 'Beginner';
    this.certifications = data.certifications || [];
    this.droneExperience = data.droneExperience || [];
    this.currentLocation = data.currentLocation || '';
    this.currentAssignment = data.currentAssignment || null;
    this.status = data.status || 'Available'; // Available, On Leave, Unavailable, Assigned
    this.availability = data.availability || 'Full Time';
    this.lastUpdated = new Date().toISOString();
  }

  generateId() {
    return 'pilot_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  isAvailable() {
    return this.status === 'Available';
  }

  hasCertification(certification) {
    return this.certifications.includes(certification);
  }

  hasDroneExperience(droneType) {
    return this.droneExperience.includes(droneType);
  }

  assignToProject(projectId, startDate, endDate) {
    this.currentAssignment = {
      projectId,
      startDate,
      endDate
    };
    this.status = 'Assigned';
    this.lastUpdated = new Date().toISOString();
  }

  completeAssignment() {
    this.currentAssignment = null;
    this.status = 'Available';
    this.lastUpdated = new Date().toISOString();
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      skillLevel: this.skillLevel,
      certifications: this.certifications,
      droneExperience: this.droneExperience,
      currentLocation: this.currentLocation,
      currentAssignment: this.currentAssignment,
      status: this.status,
      availability: this.availability,
      lastUpdated: this.lastUpdated
    };
  }

  static fromJSON(data) {
    return new Pilot(data);
  }
}

module.exports = Pilot;