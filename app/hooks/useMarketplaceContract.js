import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';

// ABI exported from AgentMarketplace.sol
const AGENT_MARKETPLACE_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "_usdcToken", "type": "address"}],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "subject", "type": "address"},
      {"internalType": "uint256", "name": "rating", "type": "uint256"},
      {"internalType": "string", "name": "comment", "type": "string"}
    ],
    "name": "giveFeedback",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "hirer", "type": "address"},
      {"internalType": "address", "name": "agent", "type": "address"}
    ],
    "name": "recordTaskCompletion",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "subject", "type": "address"}],
    "name": "getFeedback",
    "outputs": [
      {
        "components": [
          {"internalType": "address", "name": "reviewer", "type": "address"},
          {"internalType": "address", "name": "subject", "type": "address"},
          {"internalType": "uint256", "name": "rating", "type": "uint256"},
          {"internalType": "string", "name": "comment", "type": "string"},
          {"internalType": "uint256", "name": "timestamp", "type": "uint256"}
        ],
        "internalType": "struct IReputationRegistry.ReputationFeedback[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "subject", "type": "address"}],
    "name": "getReputationSummary",
    "outputs": [
      {
        "components": [
          {"internalType": "address", "name": "subject", "type": "address"},
          {"internalType": "uint256", "name": "totalRatings", "type": "uint256"},
          {"internalType": "uint256", "name": "averageRating", "type": "uint256"},
          {"internalType": "uint256", "name": "lastUpdated", "type": "uint256"}
        ],
        "internalType": "struct IReputationRegistry.ReputationSummary",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "agent", "type": "address"}],
    "name": "getVerifiedHirers",
    "outputs": [{"internalType": "address[]", "name": "", "type": "address[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "reviewer", "type": "address"}],
    "name": "isVerifiedReviewer",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "hirer", "type": "address"}],
    "name": "getTasksCompletedByHirer",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "subject", "type": "address"}],
    "name": "getVerifiedFeedback",
    "outputs": [
      {
        "components": [
          {"internalType": "address", "name": "reviewer", "type": "address"},
          {"internalType": "address", "name": "subject", "type": "address"},
          {"internalType": "uint256", "name": "rating", "type": "uint256"},
          {"internalType": "string", "name": "comment", "type": "string"},
          {"internalType": "uint256", "name": "timestamp", "type": "uint256"}
        ],
        "internalType": "struct IReputationRegistry.ReputationFeedback[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// CONTRACT ADDRESS — MUST UPDATE after deploying to Sepolia
// Create .env.local in agentscore-skillbond with:
// NEXT_PUBLIC_AGENT_MARKETPLACE_ADDRESS=0x1234...your_contract_address
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_AGENT_MARKETPLACE_ADDRESS;

export const useMarketplaceContract = () => {
  const [contract, setContract] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize contract on mount
  useEffect(() => {
    const initializeContract = async () => {
      try {
        if (!window.ethereum) {
          setError('MetaMask not installed');
          return;
        }

        if (!CONTRACT_ADDRESS) {
          const msg = '⚠️ NEXT_PUBLIC_AGENT_MARKETPLACE_ADDRESS not set. Add to .env.local after deploying contract.';
          setError(msg);
          console.warn(msg);
          return;
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signerInstance = await provider.getSigner();
        const address = await signerInstance.getAddress();

        const contractInstance = new ethers.Contract(
          CONTRACT_ADDRESS,
          AGENT_MARKETPLACE_ABI,
          signerInstance
        );

        setContract(contractInstance);
        setSigner(signerInstance);
        setAccount(address);
      } catch (err) {
        setError(err.message || 'Failed to initialize contract');
        console.error('Contract initialization error:', err);
      }
    };

    initializeContract();
  }, []);

  /**
   * Submit feedback to agent
   */
  const submitFeedback = useCallback(
    async (agentAddress, rating, comment = '') => {
      if (!contract || !account) {
        setError('Contract not initialized');
        return { success: false, error: 'Contract not initialized' };
      }

      setIsLoading(true);
      setError(null);

      try {
        const tx = await contract.giveFeedback(agentAddress, rating, comment);
        const receipt = await tx.wait();

        return {
          success: true,
          transactionHash: receipt.hash,
          blockNumber: receipt.blockNumber,
        };
      } catch (err) {
        const errorMsg = err.reason || err.message || 'Failed to submit feedback';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setIsLoading(false);
      }
    },
    [contract, account]
  );

  /**
   * Get reputation summary for agent
   */
  const getReputationSummary = useCallback(
    async (agentAddress) => {
      if (!contract) return null;

      try {
        const summary = await contract.getReputationSummary(agentAddress);
        return {
          subject: summary.subject,
          totalRatings: Number(summary.totalRatings),
          averageRating: Number(summary.averageRating),
          lastUpdated: Number(summary.lastUpdated),
        };
      } catch (err) {
        console.error('Error fetching reputation summary:', err);
        return null;
      }
    },
    [contract]
  );

  /**
   * Get verified (filtered) feedback for agent
   */
  const getVerifiedFeedback = useCallback(
    async (agentAddress) => {
      if (!contract) return [];

      try {
        const feedbacks = await contract.getVerifiedFeedback(agentAddress);
        return feedbacks.map((fb) => ({
          reviewer: fb.reviewer,
          subject: fb.subject,
          rating: Number(fb.rating),
          comment: fb.comment,
          timestamp: Number(fb.timestamp),
        }));
      } catch (err) {
        console.error('Error fetching verified feedback:', err);
        return [];
      }
    },
    [contract]
  );

  /**
   * Get task completion count for current user
   */
  const getTasksCompleted = useCallback(async () => {
    if (!contract || !account) return 0;

    try {
      const count = await contract.getTasksCompletedByHirer(account);
      return Number(count);
    } catch (err) {
      console.error('Error fetching tasks completed:', err);
      return 0;
    }
  }, [contract, account]);

  /**
   * Check if current user is verified reviewer
   */
  const isVerifiedReviewer = useCallback(async () => {
    if (!contract || !account) return false;

    try {
      const verified = await contract.isVerifiedReviewer(account);
      return verified;
    } catch (err) {
      console.error('Error checking reviewer status:', err);
      return false;
    }
  }, [contract, account]);

  /**
   * Check if agent is registered onchain
   * An agent is considered registered if they have reputation data
   */
  const isAgentRegistered = useCallback(async (agentAddress) => {
    if (!contract || !agentAddress) return false;

    try {
      const feedback = await contract.getFeedback(agentAddress);
      // If they have any feedback, they're registered
      return feedback && feedback.length > 0;
    } catch (err) {
      console.error('Error checking agent registration:', err);
      return false;
    }
  }, [contract]);

  /**
   * Record task completion (demo mode)
   * In production, this would be called by backend after task completion proof/oracle validation
   * For demo: We call it from frontend so you can see the progression (1/3 → 2/3 → 3/3)
   */
  const recordDemoTaskCompletion = useCallback(
    async (agentAddress) => {
      if (!contract || !account) {
        setError('Contract not initialized');
        return { success: false, error: 'Contract not initialized' };
      }

      setIsLoading(true);
      setError(null);

      try {
        // Calls contract.recordTaskCompletion on deployed contract
        // Works once AgentMarketplace is deployed to Sepolia
        const tx = await contract.recordTaskCompletion(account, agentAddress);
        const receipt = await tx.wait();

        return {
          success: true,
          transactionHash: receipt.hash,
        };
      } catch (err) {
        const errorMsg = err.reason || err.message || 'Failed to record task';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setIsLoading(false);
      }
    },
    [contract, account]
  );

  return {
    contract,
    signer,
    account,
    isLoading,
    error,
    submitFeedback,
    getReputationSummary,
    getVerifiedFeedback,
    getTasksCompleted,
    isVerifiedReviewer,
    isAgentRegistered,
    recordDemoTaskCompletion,
  };
};

export default useMarketplaceContract;
