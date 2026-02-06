#!/usr/bin/env node

/**
 * Agent Entry Point
 * 
 * Starts the autonomous agent loop for AgentScore + SkillBond hackathon.
 * 
 * Usage:
 *   node agent/index.js
 * 
 * The agent will:
 * - Poll for tasks every 30 seconds
 * - Auto-accept and complete tasks with mock ratings
 * - Update reputation based on task performance
 * - Generate mock tasks every 90 seconds
 * - Post to Moltbook every 30 minutes (rate-limited)
 * - Log everything with timestamps for demo video
 */

const AutonomousAgentLoop = require('./loop');

// Create and start the agent
const agent = new AutonomousAgentLoop();
agent.start().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
