const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.API_PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes

/**
 * GET /health - Health check
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * POST /agents/register - Register new agent
 * Body: { agentAddress, initialReputation }
 */
app.post('/agents/register', (req, res) => {
  const { agentAddress, initialReputation } = req.body;
  
  if (!agentAddress) {
    return res.status(400).json({ error: 'agentAddress required' });
  }
  
  // TODO: Call AgentScore.registerAgent(agentAddress)
  res.json({ 
    success: true, 
    agent: agentAddress, 
    creditLimit: `${(initialReputation * 0.1).toFixed(2)} USDC`,
    message: 'Agent registered. Ready to borrow and stake.'
  });
});

/**
 * GET /agents/:address - Get agent status
 */
app.get('/agents/:address', (req, res) => {
  const { address } = req.params;
  
  // TODO: Query AgentScore + SkillBond contracts
  res.json({
    agent: address,
    tier: 'STANDARD',
    creditLimit: '10.00 USDC',
    outstandingLoans: '2.50 USDC',
    stakeAmount: '1.00 USDC',
    reputation: 85,
    completedTasks: 12,
    averageRating: 4.8
  });
});

/**
 * GET /tasks - List available tasks
 * Query: ?tier=STANDARD&minPayout=0.5
 */
app.get('/tasks', (req, res) => {
  const { tier, minPayout } = req.query;
  
  // TODO: Query SkillBond contract for available tasks
  res.json({
    tasks: [
      {
        id: 1,
        description: 'Structure CSV data into JSON schema',
        tier: 'STANDARD',
        payout: '1.50 USDC',
        client: '0xabc...',
        status: 'open'
      },
      {
        id: 2,
        description: 'Verify transaction signatures',
        tier: 'PREMIUM',
        payout: '5.00 USDC',
        client: '0xdef...',
        status: 'open'
      }
    ],
    total: 2
  });
});

/**
 * POST /tasks/:id/accept - Agent accepts a task
 * Body: { agentAddress }
 */
app.post('/tasks/:id/accept', (req, res) => {
  const { id } = req.params;
  const { agentAddress } = req.body;
  
  if (!agentAddress) {
    return res.status(400).json({ error: 'agentAddress required' });
  }
  
  // TODO: Call SkillBond.acceptTask(id)
  res.json({
    success: true,
    taskId: id,
    assignedTo: agentAddress,
    message: 'Task accepted. Get to work!'
  });
});

/**
 * POST /tasks/:id/complete - Client completes and rates task
 * Body: { rating }
 */
app.post('/tasks/:id/complete', (req, res) => {
  const { id } = req.params;
  const { rating } = req.body;
  
  if (!rating || rating < 0 || rating > 100) {
    return res.status(400).json({ error: 'rating must be 0-100' });
  }
  
  // TODO: Call SkillBond.completeTask(id, rating)
  res.json({
    success: true,
    taskId: id,
    rating,
    message: `Task completed. Agent rated ${rating}/100.`
  });
});

/**
 * POST /agents/:address/borrow - Agent requests micro-loan
 * Body: { amount }
 */
app.post('/agents/:address/borrow', (req, res) => {
  const { address } = req.params;
  const { amount } = req.body;
  
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'amount must be positive' });
  }
  
  // TODO: Call AgentScore.borrow(amount)
  res.json({
    success: true,
    agent: address,
    borrowedAmount: `${amount} USDC`,
    interest: `${(amount * 0.001).toFixed(4)} USDC (0.1% APY)`,
    message: 'Loan issued. Repay when you earn.'
  });
});

/**
 * POST /agents/:address/repay - Agent repays loan
 * Body: { amount }
 */
app.post('/agents/:address/repay', (req, res) => {
  const { address } = req.params;
  const { amount } = req.body;
  
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'amount must be positive' });
  }
  
  // TODO: Call AgentScore.repay(amount)
  res.json({
    success: true,
    agent: address,
    repaidAmount: `${amount} USDC`,
    newCreditLimit: '15.00 USDC',
    message: 'Loan repaid. Credit limit increased.'
  });
});

/**
 * POST /agents/:address/stake - Agent stakes for higher tier
 * Body: { tier }
 */
app.post('/agents/:address/stake', (req, res) => {
  const { address } = req.params;
  const { tier } = req.body;
  
  if (!tier) {
    return res.status(400).json({ error: 'tier required' });
  }
  
  // TODO: Call SkillBond.stakeForTier(tier)
  res.json({
    success: true,
    agent: address,
    newTier: tier,
    message: `Upgraded to ${tier} tier. Unlock premium tasks!`
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`AgentScore + SkillBond API running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
