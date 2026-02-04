# Development Guide - AgentScore + SkillBond

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Autonomous Agent (X/Farcaster)           │
│                     - Polls for tasks                       │
│                     - Stakes & borrows                      │
│                     - Posts updates                         │
└────────────────────┬────────────────────────────────────────┘
                     │ (HTTP REST)
┌────────────────────▼────────────────────────────────────────┐
│                    Backend API (Node.js)                    │
│                 - Task management                           │
│                 - Agent queries                             │
│                 - Contract interaction                      │
└────────────────────┬────────────────────────────────────────┘
                     │ (ethers.js)
┌────────────────────▼────────────────────────────────────────┐
│              Smart Contracts (Solidity on Base Sepolia)      │
│                                                             │
│   ┌──────────────────┐         ┌──────────────────┐        │
│   │   AgentScore     │         │    SkillBond     │        │
│   │                  │         │                  │        │
│   │ - Credit limits  │         │ - Task escrow    │        │
│   │ - Loans & repay  │         │ - Staking tiers  │        │
│   │ - Rep oracle     │         │ - Agent ratings  │        │
│   └──────────────────┘         └──────────────────┘        │
└─────────────────────────────────────────────────────────────┘
                     │ (USDC, ERC-8004 oracle)
┌────────────────────▼────────────────────────────────────────┐
│          External: USDC on Base Sepolia                     │
│          External: ERC-8004 Reputation Oracle               │
└─────────────────────────────────────────────────────────────┘
```

## Development Timeline

### Wednesday Evening (Today)
- ✅ Set up repo structure
- ✅ Create contract skeletons
- ✅ Create API boilerplate
- ✅ Create frontend boilerplate
- ✅ Create agent boilerplate
- [ ] Deploy contracts to Base Sepolia (if you have USDC)

### Thursday (Full Day)
**Morning:**
1. Implement AgentScore contract logic
   - `registerAgent()` - read ERC-8004, set credit limit
   - `borrow()` - issue USDC loan, track debt
   - `repay()` - accept repayment, update credit

2. Implement SkillBond contract logic
   - `stakeForTier()` - lock USDC, mint NFT
   - `createTask()` - client posts task in escrow
   - `acceptTask()` - agent bids
   - `completeTask()` - client rates, agent paid

**Afternoon:**
3. Wire API to contracts
   - Replace mock responses with real contract calls
   - Handle signing / transaction submission

4. Wire frontend to API
   - Connect wallet
   - Display agent status
   - Show available tasks
   - Handle task acceptance/completion

**Evening:**
5. Basic autonomous agent loop
   - Poll API for tasks
   - Auto-accept compatible tasks
   - Auto-complete with mock work

### Friday (Full Day)
1. **Demo & Polish**
   - Make UI look good
   - Ensure all flows work end-to-end
   - Test autonomy

2. **Demo Agent on X/Farcaster**
   - Set up X API integration
   - Have agent post status updates
   - Live transacting on Base Sepolia

3. **Documentation**
   - Write submission narrative
   - Record demo video
   - Clean up code comments

### Saturday (Fallback)
- Bug fixes
- Last-minute improvements
- Submission deadline prep

---

## Folder Breakdown

### `/contracts`
Solidity contracts using Foundry.

**Files to complete:**
- `AgentScore.sol` - Core credit logic (skeleton done, needs testing)
- `SkillBond.sol` - Staking marketplace (skeleton done, needs testing)
- Add tests: `test/AgentScore.t.sol`, `test/SkillBond.t.sol`

**Deployment:**
```bash
cd contracts
forge install # Install dependencies (OpenZeppelin, etc)
forge build
forge deploy --rpc-url $BASE_SEPOLIA_RPC --private-key $PRIVATE_KEY
```

### `/api`
Node.js Express API that agents interact with.

**Files to complete:**
- `src/index.js` - Main API routes (skeleton done, needs contract integration)
- Create `src/contracts/AgentScore.js` - Contract ABI + utilities
- Create `src/contracts/SkillBond.js` - Contract ABI + utilities
- Create `src/utils/db.js` - In-memory task/agent tracking (if needed)

**Running:**
```bash
cd api
npm install
npm run dev  # Runs on localhost:3001
```

### `/app`
Next.js frontend UI for humans and agents.

**Files to complete:**
- `pages/index.jsx` - Dashboard (started, needs wiring)
- Create `pages/agents/[address].jsx` - Individual agent profile
- Create `pages/tasks/[id].jsx` - Task detail page
- Create `components/WalletConnect.jsx` - Wallet integration
- Create `components/TaskCard.jsx` - Reusable task card
- Create `hooks/useAgent.js` - Agent data hook

**Running:**
```bash
cd app
npm install
npm run dev  # Runs on localhost:3000
```

### `/agent`
Autonomous agent script (OpenClaw AI agent + X integration).

**Files to complete:**
- `index.js` - Main loop (skeleton done, needs real contract integration)
- Create `src/twitter.js` - X API wrapper
- Create `src/worker.js` - Task completion logic
- Connect to real OpenClaw instance (not just Node.js)

**Running:**
```bash
cd agent
npm install
npm start  # Runs agent loop
```

---

## Key Decisions to Make

### 1. **ERC-8004 Mock vs. Real**
Currently, AgentScore assumes an ERC-8004 registry exists at a known address.

**Options:**
- **Mock:** Deploy a simple mock registry that returns hardcoded reputation scores
- **Real:** Find an existing ERC-8004 deployment on Base Sepolia and use it
- **Hybrid:** Deploy a mock for demo purposes, mention real integration in future work

**Recommendation:** Mock for now (faster), mention real ERC-8004 in hackathon narrative.

### 2. **USDC Address**
Need to know the USDC token address on Base Sepolia.

**Options:**
- Use Coinbase-provided USDC token
- Check Base docs for standard address
- Deploy mock ERC-20 for testing

**Recommendation:** Confirm with Annika, then update `.env`.

### 3. **Agent Reputation Oracle**
How do agents get initial reputation scores?

**Options:**
- Manual (admin sets per agent)
- Automatic (all new agents start at 50/100)
- From ERC-8004 (if deployed)

**Recommendation:** Automatic with initial bootstrap: all new agents start at 50/100, can improve by completing tasks.

### 4. **Task Storage**
Currently tasks live in contract memory. For a production demo, might need persistence.

**Options:**
- Keep in smart contract (simpler, but more gas)
- Store in API database (faster, more scalable)
- Use IPFS (if need decentralization)

**Recommendation:** Hybrid: contract holds escrow, API tracks task state.

---

## Environment Variables Template

Create `.env` in root (and copy to `/contracts`, `/api`, `/app`, `/agent`):

```env
# RPC & Blockchain
BASE_SEPOLIA_RPC=https://sepolia.base.org
BASE_EXPLORER=https://sepolia.basescan.org
PRIVATE_KEY=0x... # Your deployment wallet

# Tokens & Contracts
USDC_ADDRESS=0x... # USDC on Base Sepolia
AGENT_SCORE_ADDRESS=0x... # Deployed AgentScore
SKILL_BOND_ADDRESS=0x... # Deployed SkillBond
ERC8004_REGISTRY=0x... # Mock or real ERC-8004

# API
API_PORT=3001
API_URL=http://localhost:3001

# Agent
AGENT_PRIVATE_KEY=0x... # Agent's wallet key
X_API_KEY=... # Twitter API v2 Bearer token
FARCASTER_KEY=... # Optional Farcaster integration

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_RPC_URL=https://sepolia.base.org
```

---

## Testing Strategy

**Thu morning:** Deploy contracts, manual testing via etherscan
**Thu afternoon:** Test API routes with curl/Postman
**Thu evening:** Test full flow: wallet → register → borrow → stake → accept task → complete
**Fri morning:** Autonomous agent loop working
**Fri afternoon:** Polish & demo video

---

## Submission Checklist

- [ ] Contracts deployed to Base Sepolia
- [ ] API running & responding
- [ ] Frontend responsive & wired
- [ ] Demo agent autonomously transacting
- [ ] Demo video recorded
- [ ] GitHub repo clean & documented
- [ ] Moltbook submission posted
- [ ] Base Quest agent live on X/Farcaster
- [ ] Both submissions by Sunday 12 PM PST

---

## Quick Reference

**Build contracts:**
```bash
cd contracts && forge build
```

**Deploy (Base Sepolia):**
```bash
forge deploy --rpc-url $BASE_SEPOLIA_RPC --private-key $PRIVATE_KEY
```

**Start API (Dev):**
```bash
cd api && npm run dev
```

**Start UI (Dev):**
```bash
cd app && npm run dev
```

**Start agent (Dev):**
```bash
cd agent && npm run dev
```

---

Good luck. You've got this. 🚀
