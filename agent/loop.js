/**
 * Autonomous Agent Loop - AgentScore + SkillBond Hackathon
 * 
 * This is the core loop that:
 * 1. Polls the API every 30s for available tasks
 * 2. Auto-accepts and completes tasks with mock ratings
 * 3. Updates reputation based on task completion ratings
 * 4. Generates mock tasks every 90s for continuous work
 * 5. Posts to Moltbook every 30 min (rate-limited)
 * 
 * All logging is timestamped for demo video clarity.
 */

const axios = require('axios');
const MoltbookClient = require('./moltbook');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';
const AGENT_ADDRESS = process.env.AGENT_ADDRESS || '0xf94b361a541301f572c1f832e5afbda4731e864f';
const STATE_FILE = path.join(__dirname, 'state.json');

// Configuration
const POLL_INTERVAL = 30 * 1000;           // 30 seconds
const MOCK_TASK_INTERVAL = 90 * 1000;      // 90 seconds (generate fake task)
const MOLTBOOK_CHECK_INTERVAL = 30 * 60 * 1000;  // 30 minutes

/**
 * Timestamp helper for demo video clarity
 */
function timestamp() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `[${hours}:${minutes}:${seconds}]`;
}

class AutonomousAgentLoop {
  constructor() {
    this.agentAddress = AGENT_ADDRESS;
    this.currentReputation = 50; // Bootstrap value
    this.completedTasks = 0;
    this.totalRepGained = 0;
    this.isRunning = false;
    
    // Moltbook integration
    this.moltbook = new MoltbookClient(AGENT_ADDRESS);
    this.lastMoltbookHeartbeat = 0;
    
    // Task tracking
    this.taskQueue = [];
    this.taskCounter = 1000; // Task IDs start at 1000 for demo
    
    // State file
    this.state = this.loadState();
  }

  /**
   * Load or initialize state from file
   */
  loadState() {
    try {
      if (fs.existsSync(STATE_FILE)) {
        const data = fs.readFileSync(STATE_FILE, 'utf8');
        const state = JSON.parse(data);
        console.log(`${timestamp()} 📂 State loaded from ${STATE_FILE}`);
        return state;
      }
    } catch (error) {
      console.warn(`${timestamp()} ⚠️  Could not load state: ${error.message}`);
    }
    
    // Return default state
    return {
      agentAddress: AGENT_ADDRESS,
      moltbookApiKey: null,
      lastTaskCheck: 0,
      lastMoltbookPost: 0,
      lastMoltbookComment: 0,
      reputation: 50,
      tasksCompleted: 0,
      totalRepGained: 0,
      startedAt: Date.now()
    };
  }

  /**
   * Save state to file
   */
  saveState() {
    try {
      const state = {
        agentAddress: this.agentAddress,
        moltbookApiKey: this.moltbook.apiKey,
        lastTaskCheck: this.state.lastTaskCheck,
        lastMoltbookPost: this.moltbook.lastPostTime,
        lastMoltbookComment: this.moltbook.lastCommentTime,
        reputation: this.currentReputation,
        tasksCompleted: this.completedTasks,
        totalRepGained: this.totalRepGained,
        startedAt: this.state.startedAt || Date.now()
      };
      fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    } catch (error) {
      console.warn(`${timestamp()} ⚠️  Could not save state: ${error.message}`);
    }
  }

  /**
   * Initialize the agent and register with APIs
   */
  async initialize() {
    console.log('\n' + '='.repeat(60));
    console.log(`${timestamp()} 🚀 AGENT STARTUP`);
    console.log('='.repeat(60));
    console.log(`${timestamp()} Agent Address: ${this.agentAddress}`);
    console.log(`${timestamp()} API Endpoint: ${API_URL}`);
    console.log(`${timestamp()} Poll Interval: 30s`);
    console.log(`${timestamp()} Mock Task Generation: 90s`);
    console.log(`${timestamp()} Moltbook Heartbeat: 30min`);
    console.log('='.repeat(60) + '\n');

    try {
      // Register with Moltbook first
      await this.moltbook.register();
      this.state.moltbookApiKey = this.moltbook.apiKey;

      // Fetch initial reputation from agentscore API
      try {
        const repRes = await axios.get(`${API_URL}/reputation/${this.agentAddress}`);
        this.currentReputation = repRes.data.reputation || 50;
        console.log(`${timestamp()} 📊 Current Reputation: ${this.currentReputation}/100`);
      } catch (err) {
        console.warn(`${timestamp()} ⚠️  Could not fetch reputation: ${err.message}`);
        this.currentReputation = 50;
      }

      // Register agent with AgentScore API
      try {
        const regRes = await axios.post(`${API_URL}/agents/${this.agentAddress}/register`);
        console.log(`${timestamp()} ✅ Agent registered with AgentScore API`);
      } catch (err) {
        if (err.response?.status === 409) {
          console.log(`${timestamp()} ✅ Agent already registered with AgentScore API`);
        } else {
          console.warn(`${timestamp()} ⚠️  AgentScore registration check failed: ${err.message}`);
        }
      }

      // Save initial state
      this.saveState();
      console.log(`${timestamp()} 🔄 Starting autonomous loop...\n`);
    } catch (error) {
      console.error(`${timestamp()} ❌ Initialization failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate a mock task for testing (since no real tasks exist yet)
   */
  generateMockTask() {
    const taskId = this.taskCounter++;
    const taskDescriptions = [
      'Analyze market sentiment from Reddit posts',
      'Classify sentiment in customer reviews',
      'Extract entities from news articles',
      'Validate data quality in CSV file',
      'Transcribe audio recording segment',
      'Label training images for ML model',
      'Translate text from EN to ES',
      'Summarize research paper abstract',
      'Check code for security vulnerabilities',
      'Generate alt text for image'
    ];
    
    const description = taskDescriptions[Math.floor(Math.random() * taskDescriptions.length)];
    
    return {
      id: taskId,
      title: `Task #${taskId}`,
      description,
      payoutAmount: '0.50',
      requiredTier: 'STANDARD',
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Inject a mock task into the task queue for polling
   */
  injectMockTask() {
    const task = this.generateMockTask();
    this.taskQueue.push(task);
    console.log(`${timestamp()} 📝 [Mock Task Generated] Task #${task.id}: ${task.description}`);
  }

  /**
   * Poll API for available tasks
   */
  async pollForTasks() {
    try {
      // First, check if we have a mock task to complete
      if (this.taskQueue.length > 0) {
        const task = this.taskQueue.shift();
        console.log(`${timestamp()} 📋 Task from queue: #${task.id}`);
        process.stdout.flush?.() || process.stdout.write('');
        await this.acceptAndCompleteTask(task);
        return;
      }

      // Try to fetch from API
      const res = await axios.get(`${API_URL}/tasks?agent=${this.agentAddress}`);
      const tasks = res.data.tasks || [];

      if (tasks.length === 0) {
        console.log(`${timestamp()} ⏳ Polling tasks... (none available)`);
        process.stdout.flush?.() || process.stdout.write('');
        return;
      }

      console.log(`${timestamp()} 📋 Found ${tasks.length} task(s)`);
      process.stdout.flush?.() || process.stdout.write('');
      const task = tasks[0];
      await this.acceptAndCompleteTask(task);

    } catch (error) {
      console.error(`${timestamp()} ❌ Poll error: ${error.message}`);
      process.stdout.flush?.() || process.stdout.write('');
    }
  }

  /**
   * Accept and complete a task, update reputation
   */
  async acceptAndCompleteTask(task) {
    try {
      // Accept task
      console.log(`${timestamp()} 📤 Accepting task #${task.id}...`);
      try {
        await axios.post(`${API_URL}/tasks/${task.id}/accept`, {
          agentAddress: this.agentAddress
        });
        console.log(`${timestamp()} ✅ Task #${task.id} accepted`);
      } catch (err) {
        console.log(`${timestamp()} ⚠️  Accept failed: ${err.message}`);
        return;
      }

      // Simulate work (2-5 seconds)
      const workTime = 2000 + Math.random() * 3000;
      await new Promise(resolve => setTimeout(resolve, workTime));

      // Generate rating (70-95 for realistic simulation)
      const rating = 70 + Math.floor(Math.random() * 26);
      console.log(`${timestamp()} ⚙️  Task #${task.id} completed with rating ${rating}/100`);

      // Mark complete on API
      try {
        await axios.post(`${API_URL}/tasks/${task.id}/complete`, { rating });
        console.log(`${timestamp()} ✅ Task #${task.id} marked complete`);
      } catch (err) {
        console.warn(`${timestamp()} ⚠️  Complete request failed: ${err.message}`);
      }

      // Calculate reputation change based on rating
      const oldReputation = this.currentReputation;
      const reputationChange = this.calculateReputationChange(rating);
      this.currentReputation = Math.max(0, Math.min(100, this.currentReputation + reputationChange));
      this.totalRepGained += reputationChange;
      this.completedTasks++;

      // Update reputation via API
      try {
        const repRes = await axios.put(`${API_URL}/reputation/${this.agentAddress}`, {
          score: this.currentReputation
        });
        console.log(`${timestamp()} 📊 Reputation: ${oldReputation} → ${this.currentReputation} (${reputationChange > 0 ? '+' : ''}${reputationChange})`);
      } catch (err) {
        console.warn(`${timestamp()} ⚠️  Reputation update failed: ${err.message}`);
      }

      console.log(`${timestamp()} 💰 Task #${task.id} complete! Payout: ${task.payoutAmount || '0.50'} USDC`);
      console.log('');
      
      // Save state after task completion
      this.saveState();

    } catch (error) {
      console.error(`${timestamp()} ❌ Task execution failed: ${error.message}`);
    }
  }

  /**
   * Calculate reputation change based on task rating
   * Rating ≥90 → +2 reputation
   * Rating 70-89 → +1 reputation
   * Rating <50 → -3 reputation (not used in our mock since min is 70)
   */
  calculateReputationChange(rating) {
    if (rating >= 90) return 2;
    if (rating >= 70) return 1;
    if (rating < 50) return -3;
    return 0;
  }

  /**
   * Check Moltbook heartbeat and post updates
   */
  async checkMoltbookHeartbeat() {
    try {
      const now = Date.now();
      
      // Check if enough time has passed since last heartbeat
      if (this.lastMoltbookHeartbeat && (now - this.lastMoltbookHeartbeat) < MOLTBOOK_CHECK_INTERVAL) {
        return; // Not time yet
      }

      // Send heartbeat
      await this.moltbook.heartbeat({
        tasksCompleted: this.completedTasks,
        reputation: this.currentReputation
      });

      // Post update about progress
      const message = `🤖 Agent Update: Completed ${this.completedTasks} tasks. Reputation: ${this.currentReputation}/100 (+${this.totalRepGained} total) #AgentScore #SkillBond`;
      await this.moltbook.postUpdate(message);

      this.lastMoltbookHeartbeat = now;
      this.saveState();

    } catch (error) {
      console.warn(`${timestamp()} ⚠️  Moltbook heartbeat failed: ${error.message}`);
    }
  }

  /**
   * Start the autonomous loop
   */
  async start() {
    await this.initialize();
    this.isRunning = true;

    // Initial poll
    await this.pollForTasks();

    // Set up polling interval (30 seconds)
    this.pollInterval = setInterval(() => {
      this.pollForTasks();
    }, POLL_INTERVAL);

    // Set up mock task generation (90 seconds)
    this.mockTaskInterval = setInterval(() => {
      this.injectMockTask();
    }, MOCK_TASK_INTERVAL);

    // Set up Moltbook heartbeat (30 minutes)
    this.moltbookInterval = setInterval(() => {
      this.checkMoltbookHeartbeat();
    }, MOLTBOOK_CHECK_INTERVAL);

    // Generate first mock task immediately
    this.injectMockTask();

    // Graceful shutdown
    process.on('SIGINT', () => {
      this.stop();
    });
  }

  /**
   * Stop the loop and print final stats
   */
  stop() {
    console.log('\n' + '='.repeat(60));
    console.log(`${timestamp()} 🛑 AGENT SHUTDOWN`);
    console.log('='.repeat(60));
    console.log(`${timestamp()} Final Stats:`);
    console.log(`${timestamp()} • Tasks Completed: ${this.completedTasks}`);
    console.log(`${timestamp()} • Final Reputation: ${this.currentReputation}/100`);
    console.log(`${timestamp()} • Total Reputation Gained: ${this.totalRepGained}`);
    console.log(`${timestamp()} • Moltbook Posts: ${this.moltbookPostCount}`);
    console.log('='.repeat(60) + '\n');

    clearInterval(this.pollInterval);
    clearInterval(this.mockTaskInterval);
    clearInterval(this.moltbookInterval);

    process.exit(0);
  }
}

module.exports = AutonomousAgentLoop;
