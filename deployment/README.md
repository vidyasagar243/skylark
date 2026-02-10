# Skylark Drone Operations Coordinator AI Agent

An intelligent AI-powered system for managing drone fleet operations, pilot assignments, and equipment coordination.

## 🚁 Features

### Core Functionality
- **Pilot Management**: Track pilot availability, skills, certifications, and current assignments
- **Drone Inventory**: Monitor drone status, capabilities, maintenance schedules, and deployment
- **Assignment Coordination**: Match pilots to projects based on requirements, skills, and availability
- **Conflict Detection**: Identify scheduling conflicts, skill mismatches, and equipment issues
- **Urgent Reassignment**: Handle emergency reassignments with priority processing

### AI-Powered Interface
- **Natural Language Processing**: Conversational interface for easy interaction
- **Smart Recommendations**: AI suggests best pilot-drone combinations
- **Context Awareness**: Remembers conversation history and system state

### Integration
- **Google Sheets Sync**: 2-way synchronization with Google Sheets for data persistence
- **Real-time Dashboard**: Live statistics and status monitoring
- **RESTful API**: Comprehensive API endpoints for all operations

## 🏗️ Architecture

```
src/
├── controllers/     # Request handling logic
├── models/          # Data models (Pilot, Drone)
├── routes/          # API endpoints
├── services/        # Business logic
│   ├── googleSheetsService.js  # Google Sheets integration
│   ├── pilotService.js         # Pilot management
│   ├── droneService.js         # Drone management
│   ├── assignmentService.js    # Assignment coordination
│   └── openaiService.js        # AI conversational interface
└── utils/           # Helper functions
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn
- Google Cloud account (for Sheets API)
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd skylark-drone-coordinator
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the development server:
```bash
npm run dev
```

5. Visit `http://localhost:3000` in your browser

## ⚙️ Configuration

### Environment Variables

```env
# Google Sheets API Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback
GOOGLE_SHEET_ID=your_google_sheet_id

# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key

# Server Configuration
PORT=3000
NODE_ENV=development
```

### Google Sheets Setup

1. Create a Google Sheet with two tabs:
   - **Pilots**: Columns A-H (ID, Name, Skill Level, Certifications, Drone Experience, Location, Assignment, Status)
   - **Drones**: Columns A-G (ID, Model, Serial Number, Capabilities, Assignment, Status, Location)

2. Share the sheet with your service account email
3. Copy the Sheet ID from the URL

## 🛠️ API Endpoints

### Pilots
- `GET /api/pilots` - Get all pilots
- `GET /api/pilots/:id` - Get pilot by ID
- `GET /api/pilots/status/available` - Get available pilots
- `GET /api/pilots/location/:location` - Get pilots by location
- `PUT /api/pilots/:id/status` - Update pilot status
- `POST /api/pilots/:id/assign` - Assign pilot to project

### Drones
- `GET /api/drones` - Get all drones
- `GET /api/drones/:id` - Get drone by ID
- `GET /api/drones/status/available` - Get available drones
- `GET /api/drones/alerts/maintenance` - Get maintenance alerts
- `PUT /api/drones/:id/status` - Update drone status
- `POST /api/drones/:id/maintenance/start` - Start maintenance

### Assignments
- `POST /api/assignments` - Create new assignment
- `GET /api/assignments` - Get all assignments
- `GET /api/assignments/project/:projectId` - Get assignments by project
- `POST /api/assignments/:id/complete` - Complete assignment
- `POST /api/assignments/urgent/:projectId` - Handle urgent reassignment

### Chat
- `POST /api/chat/message` - Send message to AI assistant
- `GET /api/chat/history` - Get conversation history
- `DELETE /api/chat/history` - Clear conversation history

## 🧪 Testing

Run the test suite:
```bash
npm test
```

## 📊 Data Models

### Pilot
```javascript
{
  id: string,
  name: string,
  skillLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert',
  certifications: string[],
  droneExperience: string[],
  currentLocation: string,
  currentAssignment: object | null,
  status: 'Available' | 'Assigned' | 'On Leave' | 'Unavailable',
  availability: string
}
```

### Drone
```javascript
{
  id: string,
  model: string,
  serialNumber: string,
  capabilities: string[],
  currentAssignment: object | null,
  status: 'Available' | 'Deployed' | 'In Maintenance' | 'Unavailable',
  location: string,
  lastMaintenance: date,
  nextMaintenance: date
}
```

### Assignment
```javascript
{
  id: string,
  projectId: string,
  requirements: object,
  startDate: date,
  endDate: date,
  pilotId: string,
  droneId: string,
  status: 'Pending' | 'Confirmed' | 'Completed',
  conflicts: string[]
}
```

## 🔧 Development

### Project Structure
- **Frontend**: HTML/CSS/JavaScript (vanilla)
- **Backend**: Node.js with Express
- **Database**: In-memory with Google Sheets sync
- **AI**: OpenAI GPT integration

### Key Technologies
- Express.js for RESTful API
- Google Sheets API for data persistence
- OpenAI API for conversational interface
- Modern ES6+ JavaScript

## 🎯 Key Features Explained

### Match Making Algorithm
The system uses a scoring algorithm to match pilots and drones to assignments:
- **Pilot Score**: Based on skill level, certifications, experience, and location
- **Drone Score**: Based on capabilities and location
- **Conflict Detection**: Checks for overlapping assignments and maintenance issues

### Urgent Reassignment
When an urgent reassignment is needed:
1. System identifies current assignment conflicts
2. Finds alternative pilot-drone combinations
3. Prioritizes based on urgency score
4. Provides ranked suggestions

### Conversation Context
The AI assistant maintains context through:
- Conversation history tracking
- System state awareness
- Action result feedback
- Multi-turn dialogue support

## 🚀 Deployment

### Hosting Options
- **Vercel**: For frontend hosting
- **Railway**: For backend deployment
- **Render**: Alternative hosting platform
- **Heroku**: Traditional deployment option

### Production Considerations
- Set `NODE_ENV=production`
- Use proper authentication for Google Sheets
- Implement rate limiting
- Add monitoring and logging
- Set up proper error handling

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## 📞 Support

For issues and questions, please open an issue on the GitHub repository.