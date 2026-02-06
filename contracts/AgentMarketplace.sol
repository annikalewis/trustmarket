// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title AgentMarketplace
 * @dev Marketplace for autonomous agents to hire and complete tasks
 * Integrates with ERC-8004 reputation system for verified feedback
 */
contract AgentMarketplace is Ownable {
    
    // ERC-20 token for payments (USDC)
    IERC20 public paymentToken;
    
    // Tracks how many tasks each address has completed as a buyer (hirer)
    // This gates their ability to submit feedback to ERC-8004
    mapping(address hirer => uint256 tasksCompleted) public tasksCompletedByHirer;
    
    // Tracks who has hired whom (for verified reviewer filtering)
    mapping(address agent => address[] hirers) public agentHirers;
    mapping(address agent => mapping(address hirer => bool)) public hasHired;
    
    // Task tracking
    struct Task {
        uint256 id;
        address hirer;
        address agent;
        uint256 payout;
        TaskStatus status;
        uint256 createdAt;
        uint256 completedAt;
    }
    
    enum TaskStatus {
        ASSIGNED,
        COMPLETED,
        RATED
    }
    
    mapping(uint256 => Task) public tasks;
    uint256 public taskCounter;
    
    // Events
    event TaskAssigned(
        uint256 indexed taskId,
        address indexed hirer,
        address indexed agent,
        uint256 payout
    );
    
    event TaskCompleted(
        uint256 indexed taskId,
        address indexed hirer,
        address indexed agent
    );
    
    event FeedbackSubmitted(
        uint256 indexed taskId,
        address indexed hirer,
        address indexed agent,
        int128 score
    );
    
    // Modifiers
    modifier onlyVerifiedReviewer(address reviewer) {
        require(
            tasksCompletedByHirer[reviewer] >= 3,
            "Reviewer must complete 3 tasks before giving feedback"
        );
        _;
    }
    
    // Constructor
    constructor(address _paymentToken) Ownable(msg.sender) {
        paymentToken = IERC20(_paymentToken);
    }
    
    /**
     * @dev Hirer assigns a task to an agent
     * @param agent Address of the agent to hire
     * @param payout Amount in USDC for this task
     */
    function assignTask(address agent, uint256 payout) external returns (uint256) {
        require(agent != address(0), "Invalid agent address");
        require(payout > 0, "Payout must be > 0");
        
        uint256 taskId = taskCounter++;
        
        tasks[taskId] = Task({
            id: taskId,
            hirer: msg.sender,
            agent: agent,
            payout: payout,
            status: TaskStatus.ASSIGNED,
            createdAt: block.timestamp,
            completedAt: 0
        });
        
        // Track this hire for verified reviewer purposes
        if (!hasHired[agent][msg.sender]) {
            agentHirers[agent].push(msg.sender);
            hasHired[agent][msg.sender] = true;
        }
        
        emit TaskAssigned(taskId, msg.sender, agent, payout);
        return taskId;
    }
    
    /**
     * @dev Agent marks a task as completed
     * @param taskId ID of the task
     */
    function completeTask(uint256 taskId) external {
        Task storage task = tasks[taskId];
        require(task.agent == msg.sender, "Only assigned agent can complete");
        require(task.status == TaskStatus.ASSIGNED, "Task not in ASSIGNED state");
        
        task.status = TaskStatus.COMPLETED;
        task.completedAt = block.timestamp;
        
        // TODO: Transfer payout to agent (when ready)
        // paymentToken.transfer(task.agent, task.payout);
        
        emit TaskCompleted(taskId, task.hirer, task.agent);
    }
    
    /**
     * @dev Hirer submits feedback to ERC-8004 for a completed task
     * Only hires with >= 3 completed tasks can submit feedback
     * @param taskId ID of the task
     * @param score Rating score (-50 to +50, as per ERC-8004)
     */
    function submitFeedback(
        uint256 taskId,
        int128 score
    ) external onlyVerifiedReviewer(msg.sender) {
        Task storage task = tasks[taskId];
        require(task.hirer == msg.sender, "Only task hirer can submit feedback");
        require(task.status == TaskStatus.COMPLETED, "Task must be completed");
        
        task.status = TaskStatus.RATED;
        
        // TODO: Call ERC-8004 reputationRegistry.giveFeedback() when ready
        // This requires the interface import and registry address
        /*
        reputationRegistry.giveFeedback(
            task.agent,
            score,
            1, // decimals
            "starred", // feedbackType
            bytes32(taskId) // evidence
        );
        */
        
        emit FeedbackSubmitted(taskId, task.hirer, task.agent, score);
    }
    
    /**
     * @dev Get all verified hirers for an agent (for UI filtering)
     * @param agent Address of the agent
     */
    function getVerifiedHirers(address agent) external view returns (address[] memory) {
        return agentHirers[agent];
    }
    
    /**
     * @dev Check if an address is a verified reviewer
     * @param reviewer Address to check
     */
    function isVerifiedReviewer(address reviewer) external view returns (bool) {
        return tasksCompletedByHirer[reviewer] >= 3;
    }
    
    /**
     * @dev Get task count completed by a hirer
     * @param hirer Address of the hirer
     */
    function getTasksCompletedByHirer(address hirer) external view returns (uint256) {
        return tasksCompletedByHirer[hirer];
    }
    
    /**
     * @dev Get task details
     * @param taskId ID of the task
     */
    function getTask(uint256 taskId) external view returns (Task memory) {
        return tasks[taskId];
    }
}
