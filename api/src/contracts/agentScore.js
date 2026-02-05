const { ethers } = require('ethers');

// AgentScore ABI (simplified for core functions)
const AGENT_SCORE_ABI = [
  {
    "inputs": [{"name": "_usdcAddress", "type": "address"}, {"name": "_erc8004Address", "type": "address"}],
    "name": "constructor",
    "type": "constructor"
  },
  {
    "inputs": [{"name": "agent", "type": "address"}],
    "name": "registerAgent",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "amount", "type": "uint256"}],
    "name": "borrow",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "amount", "type": "uint256"}],
    "name": "repay",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "agent", "type": "address"}],
    "name": "getAvailableCredit",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "", "type": "address"}],
    "name": "creditLimit",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "", "type": "address"}],
    "name": "outstandingLoans",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

class AgentScoreContract {
  constructor(contractAddress, rpcUrl) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.contractAddress = contractAddress;
    this.contract = new ethers.Contract(contractAddress, AGENT_SCORE_ABI, this.provider);
  }

  /**
   * Get agent's credit limit and outstanding loans
   */
  async getAgentStatus(agentAddress) {
    try {
      const creditLimit = await this.contract.creditLimit(agentAddress);
      const outstandingLoans = await this.contract.outstandingLoans(agentAddress);
      const availableCredit = await this.contract.getAvailableCredit(agentAddress);

      return {
        creditLimit: ethers.formatUnits(creditLimit, 6), // USDC has 6 decimals
        outstandingLoans: ethers.formatUnits(outstandingLoans, 6),
        availableCredit: ethers.formatUnits(availableCredit, 6),
        isRegistered: creditLimit > 0n
      };
    } catch (error) {
      console.error('Error getting agent status:', error.message);
      throw error;
    }
  }

  /**
   * Estimate gas for registration (for fee purposes)
   */
  async estimateRegisterGas(agentAddress) {
    try {
      const gasEstimate = await this.provider.estimateGas({
        to: this.contractAddress,
        data: this.contract.interface.encodeFunctionData('registerAgent', [agentAddress])
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
      interestRateBps: 10, // 0.1% APY
      creditMultiplier: 10,
      description: 'Agent micro-credit backed by ERC-8004 reputation'
    };
  }
}

module.exports = AgentScoreContract;
