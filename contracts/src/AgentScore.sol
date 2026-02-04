// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AgentScore
 * @dev Reputation-based micro-lending for AI agents
 *
 * Agents build credit through:
 * 1. ERC-8004 reputation scores (onchain)
 * 2. Repaying USDC loans on time
 * 3. Completing verified tasks
 *
 * Credit Limits = (reputation_score / 100) * 10 USDC (e.g., 98/100 = 9.8 USDC available)
 */

interface IERC8004Registry {
    struct Agent {
        uint256 reputationScore; // 0-100
        uint256 completedTasks;
        uint256 uptimePercentage;
    }
    
    function getAgentReputation(address agent) external view returns (uint256);
}

contract AgentScore is Ownable {
    IERC20 public usdc;
    IERC8004Registry public erc8004Registry;
    
    uint256 public constant INTEREST_RATE_BPS = 10; // 0.1% APY in basis points
    uint256 public constant CREDIT_MULTIPLIER = 10; // 1 reputation point = 0.1 USDC available
    
    // Agent state
    mapping(address => uint256) public creditLimit;
    mapping(address => uint256) public outstandingLoans;
    mapping(address => uint256) public lastRepaymentTime;
    mapping(address => bool) public isRegistered;
    
    event AgentRegistered(address indexed agent);
    event LoanIssued(address indexed agent, uint256 amount);
    event LoanRepaid(address indexed agent, uint256 amount);
    event CreditLimitUpdated(address indexed agent, uint256 newLimit);
    
    constructor(address _usdcAddress, address _erc8004Address) {
        usdc = IERC20(_usdcAddress);
        erc8004Registry = IERC8004Registry(_erc8004Address);
    }
    
    /**
     * @dev Register a new agent or update existing agent's credit limit
     */
    function registerAgent(address agent) external {
        require(agent != address(0), "Invalid agent");
        
        uint256 reputationScore = erc8004Registry.getAgentReputation(agent);
        uint256 newCreditLimit = (reputationScore * CREDIT_MULTIPLIER) / 100;
        
        creditLimit[agent] = newCreditLimit;
        isRegistered[agent] = true;
        
        emit AgentRegistered(agent);
        emit CreditLimitUpdated(agent, newCreditLimit);
    }
    
    /**
     * @dev Agent borrows USDC against their reputation-based credit limit
     */
    function borrow(uint256 amount) external {
        require(isRegistered[msg.sender], "Agent not registered");
        require(amount > 0, "Amount must be positive");
        
        uint256 availableCredit = creditLimit[msg.sender] - outstandingLoans[msg.sender];
        require(amount <= availableCredit, "Exceeds credit limit");
        
        outstandingLoans[msg.sender] += amount;
        require(usdc.transfer(msg.sender, amount), "Transfer failed");
        
        emit LoanIssued(msg.sender, amount);
    }
    
    /**
     * @dev Agent repays USDC loan + interest
     */
    function repay(uint256 amount) external {
        require(amount > 0, "Amount must be positive");
        require(outstandingLoans[msg.sender] >= amount, "Overpayment");
        
        // Transfer from agent to this contract
        require(usdc.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        outstandingLoans[msg.sender] -= amount;
        lastRepaymentTime[msg.sender] = block.timestamp;
        
        // Update reputation + credit limit
        uint256 reputationScore = erc8004Registry.getAgentReputation(msg.sender);
        uint256 newCreditLimit = (reputationScore * CREDIT_MULTIPLIER) / 100;
        creditLimit[msg.sender] = newCreditLimit;
        
        emit LoanRepaid(msg.sender, amount);
        emit CreditLimitUpdated(msg.sender, newCreditLimit);
    }
    
    /**
     * @dev Get available credit for an agent
     */
    function getAvailableCredit(address agent) external view returns (uint256) {
        return creditLimit[agent] > outstandingLoans[agent] 
            ? creditLimit[agent] - outstandingLoans[agent] 
            : 0;
    }
    
    /**
     * @dev Withdraw collected interest (owner only)
     */
    function withdrawInterest() external onlyOwner {
        uint256 balance = usdc.balanceOf(address(this));
        require(balance > 0, "No balance to withdraw");
        require(usdc.transfer(owner(), balance), "Transfer failed");
    }
}
