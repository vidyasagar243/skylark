class DroneCoordinatorApp {
    constructor() {
        this.apiUrl = '/api';
        this.initializeElements();
        this.attachEventListeners();
        this.loadDashboardData();
        this.loadDefaultAssignments(); // Load default assignments initially
    }

    initializeElements() {
        this.messageInput = document.getElementById('message-input');
        this.sendButton = document.getElementById('send-message');
        this.chatMessages = document.getElementById('chat-messages');
        this.clearHistoryButton = document.getElementById('clear-history');
        this.assignmentsList = document.getElementById('assignments-list');
        this.alertsList = document.getElementById('alerts-list');
    }

    attachEventListeners() {
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
        this.clearHistoryButton.addEventListener('click', () => this.clearHistory());
        
        // Fixed event listeners for quick action buttons
        document.querySelectorAll('.btn-action').forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.target.getAttribute('data-action');
                if (action) {
                    this.handleQuickAction(action);
                }
            });
        });
    }

    // Load default assignments when no data is available
    loadDefaultAssignments() {
        const defaultAssignments = [
            {
                projectId: 'SKY-2026-001',
                status: 'Confirmed',
                startDate: '2026-02-15',
                endDate: '2026-02-18',
                pilotId: 'John Smith',
                droneId: 'DJI Mavic 3'
            },
            {
                projectId: 'SKY-2026-002',
                status: 'Pending',
                startDate: '2026-02-20',
                endDate: '2026-02-25',
                pilotId: 'Sarah Johnson',
                droneId: 'Autel EVO II'
            },
            {
                projectId: 'SKY-2026-003',
                status: 'Confirmed',
                startDate: '2026-02-10',
                endDate: '2026-02-14',
                pilotId: 'Mike Chen',
                droneId: 'DJI Matrice 300'
            },
            {
                projectId: 'SKY-2026-004',
                status: 'Completed',
                startDate: '2026-02-01',
                endDate: '2026-02-05',
                pilotId: 'Emma Davis',
                droneId: 'Parrot Anafi'
            },
            {
                projectId: 'SKY-2026-005',
                status: 'Confirmed',
                startDate: '2026-02-22',
                endDate: '2026-02-28',
                pilotId: 'Alex Rodriguez',
                droneId: 'DJI Mini 3'
            }
        ];
        
        this.updateAssignmentsList(defaultAssignments);
    }

    async loadDashboardData() {
        try {
            const [pilots, drones, assignments, alerts] = await Promise.all([
                this.fetchData('/pilots'),
                this.fetchData('/drones'),
                this.fetchData('/assignments'),
                this.fetchData('/drones/alerts/maintenance')
            ]);

            this.updateStats(pilots, drones, assignments);
            
            // Only update assignments list if there are actual assignments from the API
            if (assignments && assignments.length > 0) {
                this.updateAssignmentsList(assignments);
            }
            
            this.updateAlertsList(alerts);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            // Still show default assignments if API fails
            this.loadDefaultAssignments();
        }
    }

    async fetchData(endpoint) {
        try {
            const response = await fetch(`${this.apiUrl}${endpoint}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Error fetching ${endpoint}:`, error);
            return []; // Return empty array on error
        }
    }

    updateStats(pilots, drones, assignments) {
        // Update pilot stats
        document.getElementById('pilot-total').textContent = pilots.length;
        document.getElementById('pilot-available').textContent = pilots.filter(p => p.status === 'Available').length;
        document.getElementById('pilot-assigned').textContent = pilots.filter(p => p.status === 'Assigned').length;

        // Update drone stats
        document.getElementById('drone-total').textContent = drones.length;
        document.getElementById('drone-available').textContent = drones.filter(d => d.status === 'Available').length;
        document.getElementById('drone-deployed').textContent = drones.filter(d => d.status === 'Deployed').length;

        // Update assignment stats
        document.getElementById('assignment-total').textContent = assignments.length;
        document.getElementById('assignment-pending').textContent = assignments.filter(a => a.status === 'Pending').length;
        document.getElementById('assignment-confirmed').textContent = assignments.filter(a => a.status === 'Confirmed').length;
    }

    updateAssignmentsList(assignments) {
        if (!this.assignmentsList) return;
        
        if (assignments.length === 0) {
            this.assignmentsList.innerHTML = '<p>No assignments yet</p>';
            return;
        }

        const recentAssignments = assignments.slice(-5).reverse();
        this.assignmentsList.innerHTML = recentAssignments.map(assignment => `
            <div class="assignment-item ${assignment.status.toLowerCase()}">
                <h4>Project: ${assignment.projectId}</h4>
                <p>Status: ${assignment.status}</p>
                <p>Dates: ${new Date(assignment.startDate).toLocaleDateString()} - ${new Date(assignment.endDate).toLocaleDateString()}</p>
                ${assignment.pilotId ? `<p>Pilot: ${assignment.pilotId}</p>` : ''}
                ${assignment.droneId ? `<p>Drone: ${assignment.droneId}</p>` : ''}
            </div>
        `).join('');
    }

    updateAlertsList(alerts) {
        if (alerts.length === 0) {
            this.alertsList.innerHTML = '<p>No maintenance alerts</p>';
            return;
        }

        this.alertsList.innerHTML = alerts.map(alert => `
            <div class="alert-item">
                <h4>${alert.model} (${alert.serialNumber})</h4>
                <p>${alert.message}</p>
            </div>
        `).join('');
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;

        this.addMessageToChat(message, 'user');
        this.messageInput.value = '';
        this.setLoadingState(true);

        try {
            const response = await fetch(`${this.apiUrl}/chat/message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.addMessageToChat(data.response, 'assistant');
            
            // Handle action results if any
            if (data.actionResult) {
                this.handleActionResult(data.actionResult, data.type);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            this.addMessageToChat('Sorry, I encountered an error processing your request. Please try again or use the quick action buttons.', 'assistant');
        } finally {
            this.setLoadingState(false);
        }
    }

    addMessageToChat(content, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = content;
        
        messageDiv.appendChild(contentDiv);
        this.chatMessages.appendChild(messageDiv);
        
        // Scroll to bottom
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    setLoadingState(loading) {
        this.sendButton.disabled = loading;
        this.messageInput.disabled = loading;
        
        if (loading) {
            this.sendButton.innerHTML = '<div class="loading"></div>';
        } else {
            this.sendButton.textContent = 'Send';
        }
    }

    async clearHistory() {
        try {
            await fetch(`${this.apiUrl}/chat/history`, {
                method: 'DELETE'
            });
            this.chatMessages.innerHTML = `
                <div class="message assistant">
                    <div class="message-content">
                        Hello! I'm your Drone Operations Coordinator AI. How can I help you today?
                        You can ask me about pilot availability, drone assignments, or urgent reassignments.
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error clearing history:', error);
        }
    }

    async handleQuickAction(action) {
        switch (action) {
            case 'available-pilots':
                this.addMessageToChat('Showing available pilots...', 'user');
                try {
                    const pilots = await this.fetchData('/pilots/status/available');
                    const pilotList = pilots.map(p => `${p.name} (${p.skillLevel}) - ${p.currentLocation}`).join('\n');
                    this.addMessageToChat(`Available Pilots:\n${pilotList || 'No pilots available'}`, 'assistant');
                } catch (error) {
                    this.addMessageToChat('Error fetching pilot data. Please try again.', 'assistant');
                }
                break;
                
            case 'available-drones':
                this.addMessageToChat('Showing available drones...', 'user');
                try {
                    const drones = await this.fetchData('/drones/status/available');
                    const droneList = drones.map(d => `${d.model} - ${d.location}`).join('\n');
                    this.addMessageToChat(`Available Drones:\n${droneList || 'No drones available'}`, 'assistant');
                } catch (error) {
                    this.addMessageToChat('Error fetching drone data. Please try again.', 'assistant');
                }
                break;
                
            case 'urgent-reassignment':
                this.showUrgentReassignmentModal();
                break;
                
            case 'create-assignment':
                this.showCreateAssignmentModal();
                break;
        }
    }

    showUrgentReassignmentModal() {
        const projectId = prompt('Please enter the Project ID for urgent reassignment:');
        if (projectId) {
            const reason = prompt('Please enter the reason for urgent reassignment:');
            if (reason) {
                this.addMessageToChat(`Requesting urgent reassignment for Project ${projectId} because: ${reason}`, 'user');
                
                // Send the urgent reassignment request
                this.sendUrgentReassignmentRequest(projectId, reason);
            }
        }
    }

    async sendUrgentReassignmentRequest(projectId, reason) {
        this.setLoadingState(true);
        
        try {
            const response = await fetch(`${this.apiUrl}/assignments/urgent/${projectId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reason })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.addMessageToChat(`Urgent reassignment processed for Project ${projectId}. Found ${data.suggestedReplacements.length} potential replacements.`, 'assistant');
            
            if (data.suggestedReplacements.length > 0) {
                const replacements = data.suggestedReplacements.map(rep => 
                    `${rep.pilotName} with ${rep.droneModel} (Urgency Score: ${rep.urgencyScore})`
                ).join('\n');
                this.addMessageToChat(`Suggested replacements:\n${replacements}`, 'assistant');
            }
        } catch (error) {
            console.error('Error with urgent reassignment:', error);
            this.addMessageToChat('Error processing urgent reassignment. Please try again.', 'assistant');
        } finally {
            this.setLoadingState(false);
        }
    }

    showCreateAssignmentModal() {
        const projectId = prompt('Please enter the Project ID:');
        if (projectId) {
            const location = prompt('Enter location requirement (optional):');
            const skillLevel = prompt('Enter minimum skill level (Beginner/Intermediate/Advanced/Expert):');
            const startDate = prompt('Enter start date (YYYY-MM-DD):');
            const endDate = prompt('Enter end date (YYYY-MM-DD):');
            
            if (startDate && endDate) {
                this.addMessageToChat(`Creating assignment for Project ${projectId}`, 'user');
                
                const requirements = {};
                if (location) requirements.location = location;
                if (skillLevel) requirements.minSkillLevel = skillLevel;
                
                // Send the assignment creation request
                this.sendCreateAssignmentRequest(projectId, requirements, startDate, endDate);
            }
        }
    }

    async sendCreateAssignmentRequest(projectId, requirements, startDate, endDate) {
        this.setLoadingState(true);
        
        try {
            const response = await fetch(`${this.apiUrl}/assignments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    projectId,
                    requirements,
                    startDate,
                    endDate
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.addMessageToChat(`Assignment created successfully!\nID: ${data.id}\nStatus: ${data.status}\nConflicts: ${data.conflicts.length > 0 ? data.conflicts.join(', ') : 'None'}`, 'assistant');
            
            // Refresh dashboard data
            this.loadDashboardData();
        } catch (error) {
            console.error('Error creating assignment:', error);
            this.addMessageToChat('Error creating assignment. Please try again.', 'assistant');
        } finally {
            this.setLoadingState(false);
        }
    }

    handleActionResult(result, type) {
        if (type === 'pilot_query' && Array.isArray(result)) {
            const pilotList = result.map(p => `${p.name} (${p.skillLevel}) - Match Score: ${p.matchScore}%`).join('\n');
            this.addMessageToChat(`Recommended Pilots:\n${pilotList}`, 'assistant');
        } else if (type === 'drone_query' && Array.isArray(result)) {
            const droneList = result.map(d => `${d.model} - Match Score: ${d.matchScore}%`).join('\n');
            this.addMessageToChat(`Recommended Drones:\n${droneList}`, 'assistant');
        } else if (type === 'assignment_request' && result && result.id) {
            this.addMessageToChat(`Assignment created successfully!\nID: ${result.id}\nStatus: ${result.status}`, 'assistant');
            this.loadDashboardData(); // Refresh dashboard
        }
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new DroneCoordinatorApp();
});