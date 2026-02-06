const { ethers } = require('ethers');

// ERC-8004 Identity Registry ABI
const IDENTITY_REGISTRY_ABI = [
  {
    "inputs": [{"name": "_addr", "type": "address"}],
    "name": "agentIdOf",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "tokenId", "type": "uint256"}],
    "name": "ownerOf",
    "outputs": [{"name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
];

// ERC-8004 Reputation Registry ABI
const REPUTATION_REGISTRY_ABI = [
  {
    "inputs": [{"name": "agentId", "type": "uint256"}],
    "name": "getReputation",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "agentId", "type": "uint256"}],
    "name": "getFeedbackCount",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "agentId", "type": "uint256"}, {"name": "score", "type": "uint256"}, {"name": "comment", "type": "string"}],
    "name": "submitFeedback",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

class ERC8004Registry {
  constructor(identityAddress, reputationAddress, rpcUrl) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.identityAddress = identityAddress;
    this.reputationAddress = reputationAddress;
    this.identityContract = new ethers.Contract(identityAddress, IDENTITY_REGISTRY_ABI, this.provider);
    this.reputationContract = new ethers.Contract(reputationAddress, REPUTATION_REGISTRY_ABI, this.provider);
  }

  /**
   * Get agent ID from wallet address
   * Returns 0 if not registered
   */
  async getAgentId(agentAddress) {
    try {
      const agentId = await this.identityContract.agentIdOf(agentAddress);
      return Number(agentId);
    } catch (error) {
      // Agent not registered - return 0
      return 0;
    }
  }

  /**
   * Get agent's reputation score (0-100)
   * Returns 50 (bootstrap) if agent isn't registered with ERC-8004
   */
  async getReputation(agentAddress) {
    try {
      const agentId = await this.getAgentId(agentAddress);
      if (agentId === null || agentId === 0) {
        // Agent not registered yet - return bootstrap reputation
        return 50;
      }

      const reputation = await this.reputationContract.getReputation(agentId);
      return Number(reputation);
    } catch (error) {
      // Likely agent not registered - return bootstrap
      console.warn(`Agent ${agentAddress} not registered with ERC-8004, using bootstrap reputation (50)`);
      return 50;
    }
  }

  /**
   * Get agent's feedback count
   */
  async getFeedbackCount(agentAddress) {
    try {
      const agentId = await this.getAgentId(agentAddress);
      if (agentId === null) return 0;

      const count = await this.reputationContract.getFeedbackCount(agentId);
      return Number(count);
    } catch (error) {
      console.error(`Error getting feedback count for ${agentAddress}:`, error.message);
      return 0;
    }
  }

  /**
   * Submit feedback for an agent (write operation - requires signer)
   * In production, this would be called by a signer with write permissions
   */
  async submitFeedback(agentAddress, score, comment) {
    try {
      console.log(`[ERC-8004] Submitting feedback for ${agentAddress}: score=${score}, comment="${comment}"`);
      
      // In production:
      // const signer = new ethers.Wallet(PRIVATE_KEY, this.provider);
      // const contract = new ethers.Contract(this.reputationAddress, REPUTATION_REGISTRY_ABI, signer);
      // const tx = await contract.submitFeedback(agentId, score, comment);
      // await tx.wait();
      
      return {
        success: true,
        agent: agentAddress,
        score: score,
        message: 'Feedback submitted (write operation requires signer in production)'
      };
    } catch (error) {
      console.error(`Error submitting feedback:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get contract info
   */
  async getContractInfo() {
    return {
      identityRegistry: this.identityAddress,
      reputationRegistry: this.reputationAddress,
      standard: 'ERC-8004',
      description: 'Decentralized agent identity and reputation',
      minReputation: 0,
      maxReputation: 100
    };
  }
}

module.exports = ERC8004Registry;
