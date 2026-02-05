const { ethers } = require('ethers');

// SkillBond ABI (simplified for core functions)
const SKILL_BOND_ABI = [
  {
    "inputs": [{"name": "_usdcAddress", "type": "address"}, {"name": "_erc8004Address", "type": "address"}],
    "name": "constructor",
    "type": "constructor"
  },
  {
    "inputs": [
      {"name": "newTier", "type": "uint8"}
    ],
    "name": "stakeForTier",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "description", "type": "string"},
      {"name": "payoutAmount", "type": "uint256"},
      {"name": "requiredTier", "type": "uint8"}
    ],
    "name": "createTask",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "taskId", "type": "uint256"}],
    "name": "acceptTask",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "taskId", "type": "uint256"},
      {"name": "rating", "type": "uint256"}
    ],
    "name": "completeTask",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "agent", "type": "address"}],
    "name": "getAvailableTasks",
    "outputs": [{"name": "", "type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "", "type": "address"}],
    "name": "agentStake",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "", "type": "address"}],
    "name": "agentTier",
    "outputs": [{"name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "", "type": "uint256"}],
    "name": "tasks",
    "outputs": [
      {"name": "id", "type": "uint256"},
      {"name": "description", "type": "string"},
      {"name": "payoutAmount", "type": "uint256"},
      {"name": "requiredTier", "type": "uint8"},
      {"name": "client", "type": "address"},
      {"name": "assignedAgent", "type": "address"},
      {"name": "escrowAmount", "type": "uint256"},
      {"name": "completed", "type": "bool"},
      {"name": "clientRating", "type": "uint256"},
      {"name": "escrowReturned", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

const TIER_NAMES = ['BASIC', 'STANDARD', 'PREMIUM', 'ELITE'];
const TIER_REQUIREMENTS = {
  BASIC: { stakeRequired: '0', payoutMin: '0.1', payoutMax: '0.5' },
  STANDARD: { stakeRequired: '1.0', payoutMin: '0.5', payoutMax: '2.0' },
  PREMIUM: { stakeRequired: '5.0', payoutMin: '2.0', payoutMax: '10.0' },
  ELITE: { stakeRequired: '10.0', payoutMin: '10.0', payoutMax: '100.0' }
};

class SkillBondContract {
  constructor(contractAddress, rpcUrl) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.contractAddress = contractAddress;
    this.contract = new ethers.Contract(contractAddress, SKILL_BOND_ABI, this.provider);
  }

  /**
   * Get agent's tier and stake status
   */
  async getAgentStatus(agentAddress) {
    try {
      const tierNum = await this.contract.agentTier(agentAddress);
      const stakeAmount = await this.contract.agentStake(agentAddress);
      const tierName = TIER_NAMES[tierNum] || 'NONE';
      const tierInfo = TIER_REQUIREMENTS[tierName];

      return {
        tier: tierName,
        stakeAmount: ethers.formatUnits(stakeAmount, 6),
        canUpgrade: tierNum < 3,
        nextTierStakeRequired: tierNum < 3 ? TIER_REQUIREMENTS[TIER_NAMES[tierNum + 1]].stakeRequired : null
      };
    } catch (error) {
      console.error('Error getting agent status:', error.message);
      throw error;
    }
  }

  /**
   * Get available tasks for an agent
   */
  async getAvailableTasks(agentAddress) {
    try {
      const taskIds = await this.contract.getAvailableTasks(agentAddress);
      return taskIds.map(id => id.toString());
    } catch (error) {
      console.error('Error getting available tasks:', error.message);
      return [];
    }
  }

  /**
   * Get task details
   */
  async getTask(taskId) {
    try {
      const task = await this.contract.tasks(taskId);
      return {
        id: task.id.toString(),
        description: task.description,
        payoutAmount: ethers.formatUnits(task.payoutAmount, 6),
        requiredTier: TIER_NAMES[task.requiredTier],
        client: task.client,
        assignedAgent: task.assignedAgent,
        completed: task.completed,
        clientRating: task.clientRating.toString(),
        escrowReturned: task.escrowReturned
      };
    } catch (error) {
      console.error('Error getting task:', error.message);
      throw error;
    }
  }

  /**
   * Get all tier information
   */
  getTierInfo() {
    return Object.entries(TIER_REQUIREMENTS).map(([name, info]) => ({
      name,
      stakeRequired: info.stakeRequired,
      payoutRange: `${info.payoutMin} - ${info.payoutMax} USDC`
    }));
  }

  /**
   * Estimate gas for staking
   */
  async estimateStakeGas(tier) {
    try {
      const tierNum = TIER_NAMES.indexOf(tier);
      const gasEstimate = await this.provider.estimateGas({
        to: this.contractAddress,
        data: this.contract.interface.encodeFunctionData('stakeForTier', [tierNum])
      });
      return ethers.formatUnits(gasEstimate, 'wei');
    } catch (error) {
      console.error('Error estimating gas:', error.message);
      return '0';
    }
  }

  /**
   * Get contract info (for UI display)
   */
  async getContractInfo() {
    return {
      address: this.contractAddress,
      tiers: this.getTierInfo(),
      description: 'Reputation-staking marketplace for agent services'
    };
  }
}

module.exports = SkillBondContract;
