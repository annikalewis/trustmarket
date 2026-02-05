// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title MockERC8004Registry
 * @dev Mock ERC-8004 reputation registry for testing
 * 
 * In production, this would integrate with the real ERC-8004 standard.
 * For hackathon purposes, this mock allows agents to have reputation scores.
 */

contract MockERC8004Registry {
    mapping(address => uint256) public reputationScores; // 0-100
    mapping(address => uint256) public completedTasks;
    mapping(address => uint256) public uptimePercentage;

    event ReputationUpdated(address indexed agent, uint256 newScore);
    event TaskCompleted(address indexed agent);

    constructor() {}

    /**
     * @dev Initialize an agent with starting reputation
     */
    function initializeAgent(address agent) external {
        require(agent != address(0), "Invalid agent");
        if (reputationScores[agent] == 0) {
            reputationScores[agent] = 50; // Start at 50/100
            uptimePercentage[agent] = 95; // 95% uptime baseline
        }
    }

    /**
     * @dev Rate an agent (called by SkillBond after task completion)
     */
    function rateAgent(address agent, uint256 score) external {
        require(agent != address(0), "Invalid agent");
        require(score <= 100, "Score out of range");

        // Update reputation based on rating
        uint256 currentRep = reputationScores[agent];
        
        if (score >= 90) {
            // Excellent work - increase reputation
            reputationScores[agent] = uint256(currentRep < 95 ? currentRep + 2 : 100);
        } else if (score >= 70) {
            // Good work - maintain or slightly increase
            reputationScores[agent] = uint256(currentRep < 98 ? currentRep + 1 : 100);
        } else if (score < 50) {
            // Poor work - decrease reputation
            reputationScores[agent] = uint256(currentRep > 5 ? currentRep - 3 : 0);
        }

        completedTasks[agent]++;
        emit ReputationUpdated(agent, reputationScores[agent]);
        emit TaskCompleted(agent);
    }

    /**
     * @dev Get agent's reputation score
     */
    function getAgentReputation(address agent) external view returns (uint256) {
        return reputationScores[agent];
    }

    /**
     * @dev Get full agent record
     */
    function getAgent(address agent) external view returns (uint256 reputation, uint256 tasks, uint256 uptime) {
        return (reputationScores[agent], completedTasks[agent], uptimePercentage[agent]);
    }

    /**
     * @dev Manually set reputation (admin only, for testing)
     */
    function setReputation(address agent, uint256 score) external {
        require(score <= 100, "Score out of range");
        reputationScores[agent] = score;
        emit ReputationUpdated(agent, score);
    }
}
