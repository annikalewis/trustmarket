// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SkillBond
 * @dev Reputation-staking marketplace for agent services
 *
 * Agents stake USDC to unlock premium work tiers:
 * - Tier 1: 0 USDC (basic tasks, 0.1-0.5 USDC)
 * - Tier 2: 1 USDC (standard tasks, 0.5-2 USDC)
 * - Tier 3: 5 USDC (premium tasks, 2-10 USDC)
 * - Tier 4: 10+ USDC (high-value tasks, 10+ USDC)
 *
 * Stake is held in escrow until task completion, then returned with profits.
 */

interface IERC8004 {
    function rateAgent(address agent, uint256 score) external; // 0-100
}

contract SkillBond is ERC721, Ownable {
    IERC20 public usdc;
    IERC8004 public erc8004;
    
    uint256 public nextTokenId = 1;
    
    // Tier definitions
    enum Tier { BASIC, STANDARD, PREMIUM, ELITE }
    
    struct TierInfo {
        uint256 stakeRequired;
        uint256 taskPayoutMin;
        uint256 taskPayoutMax;
        string name;
    }
    
    mapping(Tier => TierInfo) public tiers;
    
    // Task definitions
    struct Task {
        uint256 id;
        string description;
        uint256 payoutAmount;
        Tier requiredTier;
        address client;
        address assignedAgent;
        uint256 escrowAmount;
        bool completed;
        uint256 clientRating; // 0-100
        bool escrowReturned;
    }
    
    mapping(uint256 => Task) public tasks;
    uint256 public taskCounter = 1;
    
    // Agent state
    mapping(address => uint256) public agentStake;
    mapping(address => Tier) public agentTier;
    mapping(address => uint256) public agentReputationNFT; // tokenId
    
    event StakeLocked(address indexed agent, uint256 amount, Tier tier);
    event StakeReturned(address indexed agent, uint256 amount);
    event TaskCreated(uint256 indexed taskId, Tier requiredTier, uint256 payout);
    event TaskAssigned(uint256 indexed taskId, address indexed agent);
    event TaskCompleted(uint256 indexed taskId, address indexed agent, uint256 rating);
    event TierUpgraded(address indexed agent, Tier newTier);
    
    constructor(address _usdcAddress, address _erc8004Address) 
        ERC721("AgentReputation", "AGTRT") 
        Ownable(msg.sender) 
    {
        usdc = IERC20(_usdcAddress);
        erc8004 = IERC8004(_erc8004Address);
        
        // Initialize tier info
        tiers[Tier.BASIC] = TierInfo(0, 0.1 ether, 0.5 ether, "Basic");
        tiers[Tier.STANDARD] = TierInfo(1 ether, 0.5 ether, 2 ether, "Standard");
        tiers[Tier.PREMIUM] = TierInfo(5 ether, 2 ether, 10 ether, "Premium");
        tiers[Tier.ELITE] = TierInfo(10 ether, 10 ether, 100 ether, "Elite");
    }
    
    /**
     * @dev Agent stakes USDC to unlock a new tier
     */
    function stakeForTier(Tier newTier) external {
        require(agentTier[msg.sender] < newTier, "Already at or above tier");
        
        uint256 stakeAmount = tiers[newTier].stakeRequired;
        require(stakeAmount > 0 || newTier == Tier.BASIC, "Invalid tier");
        
        // Lock stake
        if (stakeAmount > 0) {
            require(usdc.transferFrom(msg.sender, address(this), stakeAmount), "Stake transfer failed");
            agentStake[msg.sender] = stakeAmount;
        }
        
        agentTier[msg.sender] = newTier;
        
        // Mint reputation NFT if first stake
        if (agentReputationNFT[msg.sender] == 0) {
            uint256 tokenId = nextTokenId++;
            _safeMint(msg.sender, tokenId);
            agentReputationNFT[msg.sender] = tokenId;
        }
        
        emit StakeLocked(msg.sender, stakeAmount, newTier);
        emit TierUpgraded(msg.sender, newTier);
    }
    
    /**
     * @dev Client creates a task (requires payment in escrow)
     */
    function createTask(
        string memory description,
        uint256 payoutAmount,
        Tier requiredTier
    ) external returns (uint256) {
        // Transfer payout amount to escrow
        require(usdc.transferFrom(msg.sender, address(this), payoutAmount), "Escrow transfer failed");
        
        uint256 taskId = taskCounter++;
        tasks[taskId] = Task({
            id: taskId,
            description: description,
            payoutAmount: payoutAmount,
            requiredTier: requiredTier,
            client: msg.sender,
            assignedAgent: address(0),
            escrowAmount: payoutAmount,
            completed: false,
            clientRating: 0,
            escrowReturned: false
        });
        
        emit TaskCreated(taskId, requiredTier, payoutAmount);
        return taskId;
    }
    
    /**
     * @dev Agent accepts a task
     */
    function acceptTask(uint256 taskId) external {
        Task storage task = tasks[taskId];
        require(task.assignedAgent == address(0), "Task already assigned");
        require(agentTier[msg.sender] >= task.requiredTier, "Insufficient tier");
        
        task.assignedAgent = msg.sender;
        emit TaskAssigned(taskId, msg.sender);
    }
    
    /**
     * @dev Client completes task and rates agent
     */
    function completeTask(uint256 taskId, uint256 rating) external {
        Task storage task = tasks[taskId];
        require(msg.sender == task.client, "Only client can complete");
        require(task.assignedAgent != address(0), "No agent assigned");
        require(!task.completed, "Already completed");
        require(rating <= 100, "Rating out of range");
        
        task.completed = true;
        task.clientRating = rating;
        
        // Return agent's stake + pay out task amount
        address agent = task.assignedAgent;
        uint256 agentStakeAmount = agentStake[agent];
        
        if (agentStakeAmount > 0) {
            require(usdc.transfer(agent, agentStakeAmount), "Stake return failed");
            agentStake[agent] = 0;
        }
        
        // Pay agent
        require(usdc.transfer(agent, task.payoutAmount), "Payout failed");
        
        // Update reputation on ERC-8004
        erc8004.rateAgent(agent, rating);
        
        task.escrowReturned = true;
        emit TaskCompleted(taskId, agent, rating);
    }
    
    /**
     * @dev Get tasks available for an agent at their tier
     */
    function getAvailableTasks(address agent) external view returns (uint256[] memory) {
        Tier agentCurrentTier = agentTier[agent];
        uint256[] memory available = new uint256[](taskCounter);
        uint256 count = 0;
        
        for (uint256 i = 1; i < taskCounter; i++) {
            if (tasks[i].assignedAgent == address(0) && 
                agentCurrentTier >= tasks[i].requiredTier &&
                !tasks[i].completed) {
                available[count] = i;
                count++;
            }
        }
        
        // Trim array
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = available[i];
        }
        return result;
    }
}
