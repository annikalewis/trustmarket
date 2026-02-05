const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const AgentScoreContract = require('./contracts/agentScore');
const SkillBondContract = require('./contracts/skillBond');

const app = express();
const PORT = process.env.API_PORT || 3001;

// Contract initialization
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia.base.org';
const AGENT_SCORE_ADDRESS = process.env.AGENT_SCORE_ADDRESS || '0xD3441abcC71a1585B26D5d3A55ccA3704B007568';
const SKILL_BOND_ADDRESS = process.env.SKILL_BOND_ADDRESS || '0xbfE51B3eAbB03bF4937020d169ab25FafF9dCcbe';

const agentScore = new AgentScoreContract(AGENT_SCORE_ADDRESS, RPC_URL);
const skillBond = new SkillBondContract(SKILL_BOND_ADDRESS, RPC_URL);

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes

/**
 * GET /health - Health check
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    contracts: {
      agentScore: AGENT_SCORE_ADDRESS,
      skillBond: SKILL_BOND_ADDRESS,
      rpc: RPC_URL
    }
  });
});

/**
 * GET /contracts/info - Get contract information
 */
app.get('/contracts/info', async (req, res) => {
  try {
    const asInfo = await agentScore.getContractInfo();
    const sbInfo = await skillBond.getContractInfo();
    
    res.json({
      agentScore: asInfo,
      skillBond: sbInfo
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /agents/:address - Get agent status (both AgentScore + SkillBond)
 */
app.get('/agents/:address', async (req, res) => {
  const { address } = req.params;
  
  try {
    const agentScoreStatus = await agentScore.getAgentStatus(address);
    const skillBondStatus = await skillBond.getAgentStatus(address);
    
    res.json({
      agent: address,
      agentScore: agentScoreStatus,
      skillBond: skillBondStatus,
      earnings: '0.00 USDC', // Mock for now, would be calculated from task history
      averageRating: 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /tiers - Get tier information
 */
app.get('/tiers', (req, res) => {
  try {
    const tiers = skillBond.getTierInfo();
    res.json({ tiers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /tasks - List available tasks
 * Query: ?agent=0xabc...&tier=STANDARD
 */
app.get('/tasks', async (req, res) => {
  const { agent, tier } = req.query;
  
  try {
    let tasks = [];
    
    if (agent) {
      const taskIds = await skillBond.getAvailableTasks(agent);
      for (const id of taskIds) {
        const task = await skillBond.getTask(id);
        if (!tier || task.requiredTier === tier) {
          tasks.push(task);
        }
      }
    }
    
    res.json({
      tasks,
      total: tasks.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /tasks/:id - Get task details
 */
app.get('/tasks/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const task = await skillBond.getTask(id);
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /agents/:address/register - Register new agent on AgentScore
 */
app.post('/agents/:address/register', async (req, res) => {
  const { address } = req.params;
  
  try {
    // In production, this would call contract.registerAgent(address)
    // For now, return mock response
    const status = await agentScore.getAgentStatus(address);
    
    res.json({
      success: true,
      agent: address,
      creditLimit: '5.00 USDC',
      message: 'Agent registered. Ready to borrow and stake.'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /agents/:address/credit - Get available credit
 */
app.get('/agents/:address/credit', async (req, res) => {
  const { address } = req.params;
  
  try {
    const status = await agentScore.getAgentStatus(address);
    res.json({
      agent: address,
      availableCredit: status.availableCredit,
      creditLimit: status.creditLimit,
      outstandingLoans: status.outstandingLoans
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /agents/:address/borrow - Request micro-loan
 * Body: { amount }
 */
app.post('/agents/:address/borrow', (req, res) => {
  const { address } = req.params;
  const { amount } = req.body;
  
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'amount must be positive' });
  }
  
  // In production, would call contract.borrow(amount)
  res.json({
    success: true,
    agent: address,
    borrowedAmount: `${amount} USDC`,
    interest: `${(amount * 0.001).toFixed(4)} USDC`,
    message: 'Loan issued. Repay when you earn.'
  });
});

/**
 * POST /agents/:address/repay - Repay loan
 * Body: { amount }
 */
app.post('/agents/:address/repay', (req, res) => {
  const { address } = req.params;
  const { amount } = req.body;
  
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'amount must be positive' });
  }
  
  // In production, would call contract.repay(amount)
  res.json({
    success: true,
    agent: address,
    repaidAmount: `${amount} USDC`,
    newCreditLimit: '15.00 USDC',
    message: 'Loan repaid. Credit limit increased.'
  });
});

/**
 * POST /agents/:address/stake - Stake for higher tier
 * Body: { tier }
 */
app.post('/agents/:address/stake', async (req, res) => {
  const { address } = req.params;
  const { tier } = req.body;
  
  if (!tier) {
    return res.status(400).json({ error: 'tier required' });
  }
  
  try {
    // In production, would call contract.stakeForTier(tier)
    res.json({
      success: true,
      agent: address,
      newTier: tier,
      message: `Upgraded to ${tier} tier. Unlock premium tasks!`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /tasks/:id/accept - Agent accepts task
 */
app.post('/tasks/:id/accept', async (req, res) => {
  const { id } = req.params;
  const { agentAddress } = req.body;
  
  if (!agentAddress) {
    return res.status(400).json({ error: 'agentAddress required' });
  }
  
  try {
    // In production, would call contract.acceptTask(id)
    const task = await skillBond.getTask(id);
    res.json({
      success: true,
      taskId: id,
      assignedTo: agentAddress,
      payout: task.payoutAmount,
      message: 'Task accepted. Get to work!'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /tasks/:id/complete - Client completes and rates task
 * Body: { rating }
 */
app.post('/tasks/:id/complete', async (req, res) => {
  const { id } = req.params;
  const { rating } = req.body;
  
  if (!rating || rating < 0 || rating > 100) {
    return res.status(400).json({ error: 'rating must be 0-100' });
  }
  
  try {
    // In production, would call contract.completeTask(id, rating)
    const task = await skillBond.getTask(id);
    res.json({
      success: true,
      taskId: id,
      rating,
      payout: task.payoutAmount,
      message: `Task completed. Agent rated ${rating}/100.`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 AgentScore + SkillBond API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Contracts:`);
  console.log(`   - AgentScore: ${AGENT_SCORE_ADDRESS}`);
  console.log(`   - SkillBond: ${SKILL_BOND_ADDRESS}`);
  console.log(`\n📡 RPC: ${RPC_URL}\n`);
});
