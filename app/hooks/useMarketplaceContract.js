import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';

// IdentityRegistry ABI (ERC-8004)
const IDENTITY_REGISTRY_ABI = [
  {
    'inputs': [{'internalType': 'address', 'name': 'owner', 'type': 'address'}],
    'name': 'balanceOf',
    'outputs': [{'internalType': 'uint256', 'name': '', 'type': 'uint256'}],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [{'internalType': 'uint256', 'name': 'agentId', 'type': 'uint256'}],
    'name': 'getAgentWallet',
    'outputs': [{'internalType': 'address', 'name': '', 'type': 'address'}],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [{'internalType': 'address', 'name': 'owner', 'type': 'address'}, {'internalType': 'uint256', 'name': 'index', 'type': 'uint256'}],
    'name': 'tokenOfOwnerByIndex',
    'outputs': [{'internalType': 'uint256', 'name': '', 'type': 'uint256'}],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [{'internalType': 'uint256', 'name': 'tokenId', 'type': 'uint256'}],
    'name': 'tokenURI',
    'outputs': [{'internalType': 'string', 'name': '', 'type': 'string'}],
    'stateMutability': 'view',
    'type': 'function'
  }
];

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

// CONTRACT ADDRESSES
// IdentityRegistry (ERC-8004) on Base Mainnet - stores agents/NFTs
const IDENTITY_REGISTRY = '0x8004a169fb4a3325136eb29fa0ceb6d2e539a432';

// ReputationRegistry (ERC-8004) on Base Mainnet - stores reputation/feedback
const REPUTATION_REGISTRY = '0x8004ba17C55a88189AE136b182e5fdA19dE9b63';

// Our custom marketplace (for demo task recording)
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
   * Queries the official ERC-8004 ReputationRegistry on Base Mainnet
   */
  const getReputationSummary = useCallback(
    async (agentAddress) => {
      if (!agentAddress) return null;

      try {
        // Use official ERC-8004 ReputationRegistry on Base Mainnet
        const provider = new ethers.JsonRpcProvider('https://base.meowrpc.com');
        const registryContract = new ethers.Contract(
          ERC8004_REPUTATION_REGISTRY,
          [
            {
              'inputs': [{'internalType': 'address', 'name': 'subject', 'type': 'address'}],
              'name': 'getReputationSummary',
              'outputs': [{'internalType': 'tuple', 'type': 'tuple'}],
              'stateMutability': 'view',
              'type': 'function'
            }
          ],
          provider
        );

        console.log('📡 Querying reputation summary for:', agentAddress);
        const summary = await registryContract.getReputationSummary(agentAddress);
        console.log('💾 Summary raw:', summary);
        
        const result = {
          subject: summary[0],
          totalRatings: Number(summary[1] || 0),
          value: Number(summary[2] || 0), // reputation value
          lastUpdated: Number(summary[3] || 0)
        };
        console.log('📊 Parsed summary:', result);
        return result;
      } catch (err) {
        console.error('❌ Error fetching reputation summary from official ERC-8004 registry:', err);
        return null;
      }
    },
    []
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
   * Queries the OFFICIAL ERC-8004 ReputationRegistry on Base Mainnet
   * An agent is considered registered if they have reputation data
   */
  /**
   * Get all agents owned by a wallet
   */
  const getAllAgents = useCallback(async (walletAddress) => {
    if (!walletAddress) return [];

    try {
      const provider = new ethers.JsonRpcProvider('https://base.meowrpc.com');
      const identityRegistry = new ethers.Contract(
        IDENTITY_REGISTRY,
        IDENTITY_REGISTRY_ABI,
        provider
      );

      console.log('🔍 Fetching agents for wallet:', walletAddress);
      
      // Get number of agents
      const balance = await identityRegistry.balanceOf(walletAddress);
      console.log('📊 Agent balance:', balance.toString());

      const agents = [];
      for (let i = 0; i < balance; i++) {
        try {
          const tokenId = await identityRegistry.tokenOfOwnerByIndex(walletAddress, i);
          const agentAddress = await identityRegistry.getAgentWallet(tokenId);
          
          console.log(`✅ Agent ${i}: TokenID=${tokenId.toString()}, Address=${agentAddress}`);
          
          agents.push({
            tokenId: tokenId.toString(),
            agentAddress: agentAddress,
            index: i
          });
        } catch (err) {
          console.error(`❌ Error fetching agent ${i}:`, err);
        }
      }

      return agents;
    } catch (err) {
      console.error('❌ Error fetching all agents:', err);
      return [];
    }
  }, []);

  const isAgentRegistered = useCallback(async (agentAddress) => {
    if (!agentAddress) return false;

    try {
      // Use official ERC-8004 IdentityRegistry on Base Mainnet
      const provider = new ethers.JsonRpcProvider('https://base.meowrpc.com');
      const identityRegistry = new ethers.Contract(
        IDENTITY_REGISTRY,
        IDENTITY_REGISTRY_ABI,
        provider
      );
      
      console.log('📡 Checking if wallet has agents:', agentAddress);
      const balance = await identityRegistry.balanceOf(agentAddress);
      console.log('👤 Balance:', balance.toString());
      
      // If they have any agents, they're registered
      return balance > 0;
    } catch (err) {
      console.error('❌ Error checking agent registration:', err);
      return false;
    }
  }, []);

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
    getAllAgents,
    recordDemoTaskCompletion,
  };
};

export default useMarketplaceContract;
