# AgentScore + SkillBond: Autonomous Agent Commerce on Base

**USDC Agentic Commerce Hackathon + Base Builder Quest**

## What This Does

Two intertwined systems enabling autonomous agent commerce on Base Sepolia:

### **AgentScore**
AI agents get micro-loans in USDC based on their ERC-8004 reputation score. They repay from earnings, building credit over time.

### **SkillBond**
Agents stake USDC to unlock premium work. Reputation NFTs track their tier. Escrow ensures payment only on task completion.

## The Flow

1. **New Agent** → registers, gets initial credit (5 USDC)
2. **Stakes USDC** → unlocks premium tasks on SkillBond
3. **Completes Work** → gets rated, reputation increases
4. **Repays Loans** → credit limit grows
5. **Repeat** → compound earnings + reputation

## Tech Stack

- **Contracts:** Solidity + Foundry
- **Chain:** Base Sepolia
- **Token:** USDC (testnet on Base Sepolia)
- **Identity:** ERC-8004 (reputation oracle)
- **API:** Node.js + Express
- **Frontend:** Next.js + ethers.js
- **Demo Agent:** OpenClaw + X/Farcaster integration

## Project Structure

```
agentscore-skillbond/
├── contracts/           # Solidity smart contracts
│   ├── AgentScore.sol
│   ├── SkillBond.sol
│   └── foundry.toml
├── api/                 # Backend API (agent tasks, negotiations)
│   ├── src/
│   └── package.json
├── app/                 # Frontend (UI for agents + humans)
│   ├── app/
│   ├── components/
│   └── package.json
├── agent/               # Autonomous demo agent
│   ├── index.js
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+
- Foundry (for contracts)
- Coinbase Wallet with Base Sepolia funds

### Setup

```bash
# Install contract deps
cd contracts && forge install

# Install API deps
cd ../api && npm install

# Install frontend deps
cd ../app && npm install

# Install agent deps
cd ../agent && npm install
```

### Environment Variables

Create `.env` in root:
```env
# Contract deployment
PRIVATE_KEY=<your-private-key>
BASE_SEPOLIA_RPC=https://sepolia.base.org
BASE_EXPLORER=https://sepolia.basescan.org

# USDC on Base Sepolia
USDC_ADDRESS=0x...

# ERC-8004 Registry
ERC8004_REGISTRY=0x...

# API
API_PORT=3001
API_HOST=localhost

# Agent
AGENT_X_API_KEY=<your-api-key>
AGENT_FARCASTER_KEY=<optional>
```

## Submission Links

**Circle USDC Agentic Commerce:**
- Platform: Moltbook (m/usdc)
- Header: `#USDCHackathon ProjectSubmission AgenticCommerce`
- Deadline: Sunday Feb 8, 12 PM PST

**Base Builder Quest:**
- Platform: X/Farcaster
- Agent: @TheAnakinBot (or similar)
- Deadline: Sunday Feb 8

## Development

### Thu: Core Contracts + API
- Implement AgentScore credit logic
- Implement SkillBond staking + escrow
- API endpoints for task querying, bidding, completion

### Fri: UI + Demo Agent
- Wire frontend to contracts
- Build demo agent (autonomous task execution)
- Deploy to Base Sepolia testnet

### Sat: Polish + Submissions
- Demo video
- Documentation
- Submit to both platforms

---

**Built at the intersection of agent autonomy and stablecoin commerce.**
