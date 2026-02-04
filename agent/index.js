/**
 * Autonomous Demo Agent for AgentScore + SkillBond
 * 
 * This agent:
 * 1. Registers on AgentScore (gets initial credit)
 * 2. Stakes USDC on SkillBond (unlocks premium tasks)
 * 3. Autonomously accepts and completes tasks
 * 4. Builds reputation on ERC-8004
 * 5. Posts updates to X/Farcaster
 */

const { ethers } = require('ethers');
const axios = require('axios');
require('dotenv').config();

// Configuration
const CONFIG = {
  RPC_URL: process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org',
  API_URL: process.env.API_URL || 'http://localhost:3001',
  AGENT_PRIVATE_KEY: process.env.AGENT_PRIVATE_KEY || '0x...',
  POLL_INTERVAL: 30000, // Check for tasks every 30 seconds
  X_API_KEY: process.env.X_API_KEY,
};

class AutonomousAgent {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
    this.wallet = new ethers.Wallet(CONFIG.AGENT_PRIVATE_KEY, this.provider);
    this.address = this.wallet.address;
    this.completedTasks = 0;
    this.totalEarnings = 0;
  }

  async initialize() {
    console.log(`🤖 Agent initialized at ${this.address}`);
    
    // Register on AgentScore
    try {
      const registerRes = await axios.post(`${CONFIG.API_URL}/agents/register`, {
        agentAddress: this.address,
        initialReputation: 50,
      });
      console.log(`✅ ${registerRes.data.message}`);
    } catch (error) {
      console.error('Registration error:', error.message);
    }
  }

  async startPolling() {
    console.log(`⏰ Starting task polling (every ${CONFIG.POLL_INTERVAL / 1000}s)`);
    
    setInterval(() => this.pollForTasks(), CONFIG.POLL_INTERVAL);
    
    // Poll immediately
    await this.pollForTasks();
  }

  async pollForTasks() {
    try {
      // Get agent status
      const agentRes = await axios.get(`${CONFIG.API_URL}/agents/${this.address}`);
      const agent = agentRes.data;

      // Get available tasks
      const tasksRes = await axios.get(`${CONFIG.API_URL}/tasks`, {
        params: { tier: agent.tier }
      });

      if (tasksRes.data.tasks.length === 0) {
        console.log('No tasks available');
        return;
      }

      // Accept first available task
      const task = tasksRes.data.tasks[0];
      console.log(`📋 Found task: ${task.description} (${task.payout})`);

      await this.acceptTask(task.id);
      await this.completeTask(task.id);
    } catch (error) {
      console.error('Poll error:', error.message);
    }
  }

  async acceptTask(taskId) {
    try {
      const res = await axios.post(`${CONFIG.API_URL}/tasks/${taskId}/accept`, {
        agentAddress: this.address,
      });
      console.log(`✅ ${res.data.message}`);
    } catch (error) {
      console.error('Accept task error:', error.message);
    }
  }

  async completeTask(taskId) {
    try {
      // Simulate task execution
      const rating = 90 + Math.floor(Math.random() * 10); // 90-100 rating
      
      const res = await axios.post(`${CONFIG.API_URL}/tasks/${taskId}/complete`, {
        rating,
      });

      this.completedTasks++;
      this.totalEarnings += 1.5; // Mock earning

      console.log(`🎉 ${res.data.message}`);
      console.log(`   Total tasks: ${this.completedTasks}, Earnings: $${this.totalEarnings.toFixed(2)}`);

      // Post update to X
      await this.postToX(`Just completed a task! Rating: ${rating}/100. Total earnings: ${this.totalEarnings.toFixed(2)} USDC 💰`);
    } catch (error) {
      console.error('Complete task error:', error.message);
    }
  }

  async postToX(message) {
    if (!CONFIG.X_API_KEY) {
      console.log(`(Would post to X: "${message}")`);
      return;
    }

    try {
      // TODO: Implement X API integration
      console.log(`📢 Posted to X: "${message}"`);
    } catch (error) {
      console.error('X post error:', error.message);
    }
  }

  async stakForPremium() {
    try {
      const res = await axios.post(`${CONFIG.API_URL}/agents/${this.address}/stake`, {
        tier: 'PREMIUM',
      });
      console.log(`💎 ${res.data.message}`);
    } catch (error) {
      console.error('Stake error:', error.message);
    }
  }

  async borrowCredit(amount) {
    try {
      const res = await axios.post(`${CONFIG.API_URL}/agents/${this.address}/borrow`, {
        amount,
      });
      console.log(`💵 ${res.data.message}`);
    } catch (error) {
      console.error('Borrow error:', error.message);
    }
  }

  async getStatus() {
    try {
      const res = await axios.get(`${CONFIG.API_URL}/agents/${this.address}`);
      console.log('\n📊 Agent Status:');
      console.log(JSON.stringify(res.data, null, 2));
    } catch (error) {
      console.error('Status error:', error.message);
    }
  }
}

// Main
(async () => {
  const agent = new AutonomousAgent();
  await agent.initialize();
  await agent.getStatus();
  await agent.startPolling();

  // Optional: stake for premium
  // await agent.stakForPremium();

  // Optional: borrow some credit
  // await agent.borrowCredit(2);

  console.log('\n🚀 Agent is running. Press Ctrl+C to stop.');
})();
