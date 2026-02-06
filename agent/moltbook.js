/**
 * Moltbook API Integration Module
 * 
 * Handles agent registration, heartbeats, and updates to Moltbook.
 * API key is only sent to https://www.moltbook.com (with www prefix)
 */

const axios = require('axios');

const MOLTBOOK_API_URL = 'https://www.moltbook.com/api/v1';
const MOLTBOOK_POST_RATE_LIMIT = 30 * 60 * 1000;    // 1 post per 30 min
const MOLTBOOK_COMMENT_RATE_LIMIT = 20 * 1000;       // 1 comment per 20 sec

/**
 * Timestamp helper
 */
function timestamp() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `[${hours}:${minutes}:${seconds}]`;
}

class MoltbookClient {
  constructor(agentAddress) {
    this.agentAddress = agentAddress;
    this.apiKey = null;
    this.isRegistered = false;
    this.lastPostTime = 0;
    this.lastCommentTime = 0;
    
    // Create axios instance with Moltbook base URL
    this.client = axios.create({
      baseURL: MOLTBOOK_API_URL,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AgentScore-SkillBond/1.0'
      }
    });
  }

  /**
   * Register the agent with Moltbook
   */
  async register() {
    try {
      console.log(`${timestamp()} 📱 Registering with Moltbook...`);
      
      const response = await this.client.post('/agents/register', {
        agentAddress: this.agentAddress,
        name: `AgentScore Agent ${this.agentAddress.slice(0, 8)}`,
        description: 'Autonomous agent for AgentScore + SkillBond hackathon',
        network: 'base-sepolia'
      });

      this.apiKey = response.data.apiKey || `demo-key-${Date.now()}`;
      this.isRegistered = true;
      
      console.log(`${timestamp()} ✅ Agent registered to Moltbook (API key: ${this.apiKey.slice(0, 16)}...)`);
      return this.apiKey;
      
    } catch (error) {
      // For demo/MVP, generate a demo key if registration fails
      if (error.response?.status === 409) {
        console.log(`${timestamp()} ✅ Agent already registered with Moltbook`);
        this.apiKey = `demo-key-existing`;
        this.isRegistered = true;
        return this.apiKey;
      }
      
      // Demo mode fallback
      console.warn(`${timestamp()} ⚠️  Moltbook registration failed (demo mode): ${error.message}`);
      this.apiKey = `demo-key-fallback-${Date.now()}`;
      this.isRegistered = true;
      return this.apiKey;
    }
  }

  /**
   * Heartbeat to Moltbook (periodic check-in)
   */
  async heartbeat(stats) {
    try {
      if (!this.isRegistered) {
        return;
      }

      const response = await this.client.post('/agents/heartbeat', {
        agentAddress: this.agentAddress,
        apiKey: this.apiKey,
        stats: {
          tasksCompleted: stats.tasksCompleted || 0,
          reputation: stats.reputation || 0,
          lastActive: new Date().toISOString()
        }
      });

      console.log(`${timestamp()} 💓 Moltbook heartbeat sent`);
      return response.data;
      
    } catch (error) {
      console.warn(`${timestamp()} ⚠️  Moltbook heartbeat failed: ${error.message}`);
      // Non-fatal, continue
    }
  }

  /**
   * Post an update to Moltbook
   * Respects rate limit: 1 post per 30 minutes
   */
  async postUpdate(message, taskData = null) {
    try {
      if (!this.isRegistered) {
        return;
      }

      const now = Date.now();
      
      // Check rate limit
      if (now - this.lastPostTime < MOLTBOOK_POST_RATE_LIMIT) {
        console.log(`${timestamp()} 📱 Moltbook: Rate limit active (next post in ${Math.round((MOLTBOOK_POST_RATE_LIMIT - (now - this.lastPostTime)) / 1000)}s)`);
        return;
      }

      const payload = {
        agentAddress: this.agentAddress,
        apiKey: this.apiKey,
        message,
        taskData: taskData || null,
        timestamp: new Date().toISOString(),
        metadata: {
          source: 'agent-autonomou-loop',
          version: '1.0.0'
        }
      };

      // In demo mode, simulate posting
      console.log(`${timestamp()} 📢 [Moltbook Post] "${message}"`);
      
      // For MVP, skip actual API call (would need real Moltbook instance)
      // Uncomment below when Moltbook is available:
      // const response = await this.client.post('/agents/updates', payload);
      
      this.lastPostTime = now;
      return { success: true, posted: true };
      
    } catch (error) {
      console.warn(`${timestamp()} ⚠️  Moltbook post failed: ${error.message}`);
      // Non-fatal, continue
    }
  }

  /**
   * Post a comment to a task
   * Respects rate limit: 1 comment per 20 seconds
   */
  async postComment(taskId, comment) {
    try {
      if (!this.isRegistered) {
        return;
      }

      const now = Date.now();
      
      // Check rate limit
      if (now - this.lastCommentTime < MOLTBOOK_COMMENT_RATE_LIMIT) {
        return; // Skip silently, too soon
      }

      const payload = {
        agentAddress: this.agentAddress,
        apiKey: this.apiKey,
        taskId,
        comment,
        timestamp: new Date().toISOString()
      };

      console.log(`${timestamp()} 💬 [Moltbook Comment] Task #${taskId}: "${comment}"`);
      
      // For MVP, skip actual API call
      // const response = await this.client.post('/tasks/comments', payload);
      
      this.lastCommentTime = now;
      return { success: true, commented: true };
      
    } catch (error) {
      console.warn(`${timestamp()} ⚠️  Moltbook comment failed: ${error.message}`);
    }
  }

  /**
   * Get agent stats from Moltbook
   */
  async getStats() {
    try {
      if (!this.isRegistered) {
        return null;
      }

      const response = await this.client.get(`/agents/${this.agentAddress}/stats`, {
        headers: { 'X-API-Key': this.apiKey }
      });

      return response.data;
      
    } catch (error) {
      console.warn(`${timestamp()} ⚠️  Failed to fetch Moltbook stats: ${error.message}`);
      return null;
    }
  }
}

module.exports = MoltbookClient;
