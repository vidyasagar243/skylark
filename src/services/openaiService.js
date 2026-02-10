const OpenAI = require('openai');

class OpenAIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.conversationHistory = [];
  }

  async processUserQuery(query, context = {}) {
    try {
      // Build context-aware prompt
      const systemPrompt = this.buildSystemPrompt(context);
      
      // Add user query to conversation history
      this.conversationHistory.push({
        role: 'user',
        content: query
      });

      // Keep conversation history manageable
      if (this.conversationHistory.length > 10) {
        this.conversationHistory = this.conversationHistory.slice(-8);
      }

      const messages = [
        { role: 'system', content: systemPrompt },
        ...this.conversationHistory
      ];

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: messages,
        temperature: 0.7,
        max_tokens: 500
      });

      const assistantResponse = response.choices[0].message.content;
      
      // Add assistant response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: assistantResponse
      });

      return this.parseAssistantResponse(assistantResponse, query);
    } catch (error) {
      console.error('OpenAI API error:', error);
      return {
        type: 'error',
        message: 'Sorry, I\'m having trouble processing your request right now. Please try again.',
        rawQuery: query
      };
    }
  }

  buildSystemPrompt(context) {
    return `You are a Drone Operations Coordinator AI assistant for Skylark Drones. 
Your role is to help coordinate drone operations, pilot assignments, and equipment management.

Key Information Available:
- Pilot roster with skills, certifications, locations, and availability
- Drone inventory with capabilities, status, and locations
- Assignment tracking and conflict detection
- Urgent reassignment capabilities

Available Actions You Can Perform:
1. Check pilot availability by location, skills, or certifications
2. Check drone availability by location or capabilities
3. Create new assignments matching pilots to projects
4. View current assignments and their status
5. Handle conflicts and reassignments
6. Process urgent reassignment requests
7. Search for pilots or drones based on criteria

Instructions:
- Be professional and helpful
- Provide clear, actionable responses
- When appropriate, suggest specific pilots or drones for assignments
- If there are conflicts, explain them clearly and suggest alternatives
- For urgent requests, prioritize quick responses and viable alternatives
- Format your responses in a clear, structured way

Context Data:
${JSON.stringify(context, null, 2)}`;
  }

  parseAssistantResponse(response, originalQuery) {
    // Parse the AI response to determine intent and extract key information
    const lowerResponse = response.toLowerCase();
    
    // Determine response type based on content
    if (lowerResponse.includes('pilot') && (lowerResponse.includes('available') || lowerResponse.includes('assign'))) {
      return {
        type: 'pilot_query',
        message: response,
        action: 'suggest_pilots',
        rawQuery: originalQuery
      };
    } else if (lowerResponse.includes('drone') && (lowerResponse.includes('available') || lowerResponse.includes('assign'))) {
      return {
        type: 'drone_query',
        message: response,
        action: 'suggest_drones',
        rawQuery: originalQuery
      };
    } else if (lowerResponse.includes('assign') || lowerResponse.includes('assignment')) {
      return {
        type: 'assignment_request',
        message: response,
        action: 'create_assignment',
        rawQuery: originalQuery
      };
    } else if (lowerResponse.includes('urgent') || lowerResponse.includes('emergency')) {
      return {
        type: 'urgent_request',
        message: response,
        action: 'handle_urgent',
        rawQuery: originalQuery
      };
    } else if (lowerResponse.includes('conflict') || lowerResponse.includes('problem')) {
      return {
        type: 'conflict_query',
        message: response,
        action: 'resolve_conflict',
        rawQuery: originalQuery
      };
    } else {
      return {
        type: 'general',
        message: response,
        action: 'information_request',
        rawQuery: originalQuery
      };
    }
  }

  async suggestAssignment(requirements) {
    return await this.processUserQuery(
      `Based on these requirements, please suggest the best pilot and drone for assignment: ${JSON.stringify(requirements)}`
    );
  }

  async handleUrgentReassignment(projectId, reason) {
    return await this.processUserQuery(
      `This is urgent: Project ${projectId} needs immediate reassignment because: ${reason}. 
      Please provide the best available alternatives quickly.`
    );
  }

  async resolveConflict(conflictDescription) {
    return await this.processUserQuery(
      `Help resolve this conflict: ${conflictDescription}. 
      Please suggest solutions and alternatives.`
    );
  }

  clearConversationHistory() {
    this.conversationHistory = [];
  }

  getConversationHistory() {
    return this.conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }
}

module.exports = new OpenAIService();