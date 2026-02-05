/**
 * Autonomous Agent: Task polling + execution loop
 * Runs continuously, polling for work and completing tasks
 */

const axios = require('axios')
require('dotenv').config()
const TaskWorker = require('./src/worker')

const API_URL = process.env.API_URL || 'http://localhost:3001'
const AGENT_ADDRESS = process.env.AGENT_ADDRESS || '0xf94b361a541301f572c1f832e5afbda4731e864f'
const POLL_INTERVAL = 30000 // 30 seconds

class AutonomousAgent {
  constructor() {
    this.address = AGENT_ADDRESS
    this.worker = new TaskWorker()
    this.lastCheck = null
    this.isRunning = false
  }

  async initialize() {
    console.log(`\n🤖 Agent initialized at ${this.address}`)
    console.log(`📡 API: ${API_URL}`)
    console.log(`⏰ Poll interval: ${POLL_INTERVAL / 1000}s`)
    console.log(`🚀 Starting autonomous loop...\n`)
  }

  async pollForWork() {
    try {
      // Get available tasks for this agent
      const res = await axios.get(`${API_URL}/tasks?agent=${this.address}`)
      const tasks = res.data.tasks || []

      if (tasks.length === 0) {
        console.log(`[${new Date().toLocaleTimeString()}] 📭 No tasks available`)
        return
      }

      console.log(`[${new Date().toLocaleTimeString()}] 📋 Found ${tasks.length} task(s)`)

      // Take first task
      const task = tasks[0]
      console.log(`   → ${task.description} (${task.payoutAmount} USDC)`)

      // Accept task
      try {
        await axios.post(`${API_URL}/tasks/${task.id}/accept`, {
          agentAddress: this.address
        })
        console.log(`   ✅ Accepted`)
      } catch (err) {
        console.log(`   ⚠️  Accept failed: ${err.message}`)
        return
      }

      // Execute task
      console.log(`   ⚙️  Executing...`)
      const result = await this.worker.completeTask(task)

      // Mark complete
      try {
        await axios.post(`${API_URL}/tasks/${task.id}/complete`, {
          rating: result.rating
        })
        console.log(`   ✅ Completed (${result.rating}/100)`)
      } catch (err) {
        console.log(`   ⚠️  Completion failed: ${err.message}`)
        return
      }

      // Post to X (simulated)
      await this.postToX(`Task complete! Earned ${result.earnings} USDC 💰 Total: ${result.totalEarnings} USDC`)

      // Log stats
      const stats = this.worker.getStats()
      console.log(`   📊 Stats: ${stats.completedTasks} tasks, ${stats.totalEarnings} USDC earned\n`)

    } catch (error) {
      console.error(`❌ Poll error: ${error.message}`)
    }
  }

  async postToX(message) {
    // In production, would use Twitter API
    // For now, just log
    const timestamp = new Date().toLocaleTimeString()
    console.log(`   📢 [Would post to X] "${message}"`)
  }

  async start() {
    await this.initialize()
    this.isRunning = true

    // Initial poll
    await this.pollForWork()

    // Set up recurring polls
    this.pollInterval = setInterval(() => {
      this.pollForWork()
    }, POLL_INTERVAL)

    // Keep process alive
    process.on('SIGINT', () => {
      console.log('\n\n📊 Final Stats:')
      const stats = this.worker.getStats()
      console.log(`   Tasks Completed: ${stats.completedTasks}`)
      console.log(`   Total Earnings: ${stats.totalEarnings} USDC`)
      console.log(`   Average Rating: ${stats.averageRating}/100`)
      process.exit(0)
    })
  }
}

// Main
const agent = new AutonomousAgent()
agent.start()
