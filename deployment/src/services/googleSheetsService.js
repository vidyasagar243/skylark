const { google } = require('googleapis');
const fs = require('fs').promises;

class GoogleSheetsService {
  constructor() {
    this.auth = null;
    this.sheets = null;
    this.spreadsheetId = process.env.GOOGLE_SHEET_ID;
  }

  async initialize() {
    try {
      // For demo purposes, we'll use service account credentials
      // In production, you'd use proper OAuth2 authentication
      const auth = new google.auth.GoogleAuth({
        keyFile: 'credentials.json',
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });
      
      this.auth = await auth.getClient();
      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
      
      console.log('✅ Google Sheets service initialized');
    } catch (error) {
      console.error('❌ Google Sheets initialization failed:', error.message);
      // Fallback to mock data if Google Sheets fails
      console.log('⚠️  Using mock data mode');
    }
  }

  async readPilotData() {
    try {
      if (!this.sheets) {
        return this.getMockPilotData();
      }

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Pilots!A1:H1000'
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        return [];
      }

      const headers = rows[0];
      const pilots = [];

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length >= 8) {
          pilots.push({
            id: row[0],
            name: row[1],
            skillLevel: row[2],
            certifications: row[3] ? row[3].split(',').map(c => c.trim()) : [],
            droneExperience: row[4] ? row[4].split(',').map(d => d.trim()) : [],
            currentLocation: row[5],
            currentAssignment: row[6] || null,
            status: row[7] || 'Available'
          });
        }
      }

      return pilots;
    } catch (error) {
      console.error('Error reading pilot data:', error.message);
      return this.getMockPilotData();
    }
  }

  async readDroneData() {
    try {
      if (!this.sheets) {
        return this.getMockDroneData();
      }

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Drones!A1:G1000'
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        return [];
      }

      const headers = rows[0];
      const drones = [];

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length >= 7) {
          drones.push({
            id: row[0],
            model: row[1],
            serialNumber: row[2],
            capabilities: row[3] ? row[3].split(',').map(c => c.trim()) : [],
            currentAssignment: row[4] || null,
            status: row[5] || 'Available',
            location: row[6]
          });
        }
      }

      return drones;
    } catch (error) {
      console.error('Error reading drone data:', error.message);
      return this.getMockDroneData();
    }
  }

  async updatePilotStatus(pilotId, status) {
    try {
      if (!this.sheets) {
        console.log(`Mock update: Pilot ${pilotId} status set to ${status}`);
        return true;
      }

      // Find the row with this pilot ID and update the status
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Pilots!A:H'
      });

      const rows = response.data.values;
      let rowIndex = -1;

      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] === pilotId) {
          rowIndex = i + 1; // 1-indexed for Google Sheets
          break;
        }
      }

      if (rowIndex > 0) {
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: `Pilots!H${rowIndex}`,
          valueInputOption: 'RAW',
          resource: {
            values: [[status]]
          }
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error updating pilot status:', error.message);
      return false;
    }
  }

  getMockPilotData() {
    return [
      {
        id: 'pilot_001',
        name: 'John Smith',
        skillLevel: 'Advanced',
        certifications: ['Commercial', 'Night Operations', 'BVLOS'],
        droneExperience: ['DJI Mavic 3', 'DJI Phantom 4', 'Autel EVO'],
        currentLocation: 'New York',
        currentAssignment: null,
        status: 'Available'
      },
      {
        id: 'pilot_002',
        name: 'Sarah Johnson',
        skillLevel: 'Intermediate',
        certifications: ['Commercial', 'Thermal Imaging'],
        droneExperience: ['DJI Mavic 2', 'Parrot Anafi'],
        currentLocation: 'Los Angeles',
        currentAssignment: null,
        status: 'Available'
      },
      {
        id: 'pilot_003',
        name: 'Mike Chen',
        skillLevel: 'Expert',
        certifications: ['Commercial', 'Night Operations', 'BVLOS', 'Multirotor'],
        droneExperience: ['DJI Mavic 3', 'Autel EVO II', 'DJI Matrice 300'],
        currentLocation: 'Chicago',
        currentAssignment: 'project_001',
        status: 'Assigned'
      }
    ];
  }

  getMockDroneData() {
    return [
      {
        id: 'drone_001',
        model: 'DJI Mavic 3',
        serialNumber: 'DJIM3-001',
        capabilities: ['4K Camera', 'Obstacle Avoidance', 'GPS'],
        currentAssignment: null,
        status: 'Available',
        location: 'New York'
      },
      {
        id: 'drone_002',
        model: 'Autel EVO II',
        serialNumber: 'AUTEVO2-001',
        capabilities: ['8K Camera', 'Thermal Imaging', 'GPS'],
        currentAssignment: null,
        status: 'Available',
        location: 'Los Angeles'
      },
      {
        id: 'drone_003',
        model: 'DJI Matrice 300',
        serialNumber: 'DJIM300-001',
        capabilities: ['Industrial Grade', 'Multiple Payloads', 'RTK GPS', 'Obstacle Avoidance'],
        currentAssignment: 'project_001',
        status: 'Deployed',
        location: 'Chicago'
      }
    ];
  }
}

module.exports = new GoogleSheetsService();