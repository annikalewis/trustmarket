# Thursday Sprint Plan: AgentScore + SkillBond

**Deadline:** Friday 5pm PST submission (Moltbook + Base)
**Status:** Contracts deployed ✅ | API wired ✅ | Frontend: TODO | Agent: TODO

---

## Morning Brief (8am - 9am)

**What's done:**
- ✅ Both contracts deployed to Base Sepolia
- ✅ API routes now call real contracts (contract utils created)
- ✅ Mock ERC-8004 registry contract created (ready to deploy if needed)
- ✅ GitHub repo updated with contract addresses

**What needs to happen today:**
1. Frontend wiring to API (9am - 12pm)
2. Test end-to-end flow (12pm - 2pm)
3. Autonomous agent loop (2pm - 4pm)
4. Demo video recording (4pm - 5pm)
5. Polish + buffer (5pm+)

**Key blocking items:**
- Moltbook credentials → so I can scout existing entries + vote strategy

---

## Hour-by-Hour Breakdown

### 9:00 AM - 10:00 AM: Frontend Setup
**What:** Wire frontend to API + display real contract data

**Tasks:**
1. Update `pages/index.jsx` to call `/health` endpoint
2. Create `hooks/useAgent.js` hook for fetching agent data
3. Wire wallet connection to read agent address
4. Display real agent status from AgentScore contract
5. Display real tier status from SkillBond contract

**Files to edit:**
- `app/pages/index.jsx` — Main dashboard
- `app/hooks/useAgent.js` — NEW: Agent data fetching hook
- `app/components/WalletConnect.jsx` — NEW: Wallet integration

**Acceptance:** Dashboard loads, shows "Connect Wallet" button, wallet connects, displays agent address

---

### 10:00 AM - 11:30 AM: Task Marketplace UI
**What:** Wire task listing and acceptance

**Tasks:**
1. Create `components/TaskCard.jsx` — Task display card
2. Create `pages/tasks.jsx` — Task marketplace page
3. Hook up `/tasks` API endpoint (filter by agent tier)
4. Add "Accept Task" button with client-side validation
5. Display payout + tier requirement

**Files to edit/create:**
- `app/components/TaskCard.jsx` — NEW
- `app/pages/tasks.jsx` — NEW
- `app/hooks/useTasks.js` — NEW

**Acceptance:** Can see available tasks, see payout amounts, click accept

---

### 11:30 AM - 12:00 PM: Agent Status Dashboard
**What:** Real-time credit + stake display

**Tasks:**
1. Create agent dashboard with:
   - Available credit (from AgentScore)
   - Current tier (from SkillBond)
   - Stake amount
   - Outstanding loans
   - Completed tasks (mock for now)
2. Wire to API endpoints

**Files to edit:**
- `app/pages/agents/[address].jsx` — NEW or update index

**Acceptance:** Dashboard shows real contract data for connected agent

---

### 12:00 PM - 1:00 PM: Break + Test
**What:** Verify frontend → API → contract chain works

**Test flow:**
1. Start API: `cd api && npm run dev`
2. Start frontend: `cd app && npm run dev`
3. Connect wallet in UI
4. See your agent address
5. See your credit limit (from contract)
6. See available tier upgrades
7. (Don't actually transact yet—just read contract state)

**Expected errors:** None if everything is wired correctly

---

### 1:00 PM - 2:30 PM: Autonomous Agent Loop
**What:** Make the agent actually work end-to-end

**Tasks:**
1. Update `agent/index.js` to:
   - Use real API endpoint (not mocked)
   - Auto-query available tasks every 30 seconds
   - Log task discovery
   - Simulate task completion (for now)
   - Track earnings/reputation

2. Create `agent/src/worker.js`:
   - Task execution logic
   - Mock work completion
   - Earnings tracking

3. Test autonomous loop:
   ```bash
   cd agent && npm run dev
   ```
   - Agent should poll, find tasks, "complete" them, log status

**Files to edit/create:**
- `agent/index.js` — Update with real API calls
- `agent/src/worker.js` — NEW: Task execution

**Acceptance:** Agent polls API, finds tasks, logs them (no actual Tx yet)

---

### 2:30 PM - 3:30 PM: X/Farcaster Integration
**What:** Agent posts to X about its activity

**Tasks:**
1. Create `agent/src/twitter.js`:
   - Post function using twitter-api-v2
   - Formats: "Task completed! Earned X USDC 💰"
   - Posts every 10 min (or after each task)

2. Update `agent/index.js`:
   - Call `postToX()` after each completed task
   - Format: task count, earnings, reputation updates

3. Test:
   - Run agent, watch console for X post attempts
   - (May not post without real API key, but infrastructure ready)

**Files to edit/create:**
- `agent/src/twitter.js` — NEW: X integration
- `agent/index.js` — Wire in posts

**Acceptance:** Agent logs "Posting to X: ..." for each task completion

---

### 3:30 PM - 4:30 PM: Demo Video
**What:** Record a 60-90 second video showing the system working

**What to show (in order):**
1. **Contract deployment** (show addresses on Basescan)
2. **Dashboard** (show agent status, credit, tier)
3. **Task marketplace** (show available tasks)
4. **Autonomous agent** (show it polling, finding tasks)
5. **X posting** (show simulated/real posts)
6. **Narrative** (voiceover: "Agent commerce at scale")

**Recording tips:**
- Use QuickTime (Mac) or OBS (cross-platform)
- Show code briefly, don't read it
- Show the UI in action
- Keep it short and punchy

**Acceptance:** 60-90 second video saved, ready for submission

---

### 4:30 PM - 5:00 PM: Polish + Buffer
**What:** Last-minute fixes, final checks

**Tasks:**
1. Clean up console logs
2. Fix any UI glitches
3. Double-check contract addresses in `.env`
4. Verify API is working
5. Commit all changes to GitHub

**Acceptance:** Code is clean, no broken features, ready for Friday submission

---

## Friday Submission Checklist

**Morning (before 10am):**
- [ ] Confirm frontend + API + agent all working
- [ ] Record final demo video
- [ ] Write submission narrative (Moltbook)
- [ ] Review existing hackathon entries (scouring via Moltbook)
- [ ] Vote on 5+ projects (eligibility requirement)

**Afternoon (by 5pm):**
- [ ] Submit to Moltbook (AgenticCommerce track)
- [ ] Submit to Base Quest (agent X/Farcaster handle)
- [ ] Post to X: "Submitting to @Circle & @Base hackathons!"

---

## Known Limitations (Document for Submission)

1. **No wallet signing yet** — All contract calls are simulated
   - (Production: would use ethers.js signer for transactions)

2. **Mock ERC-8004** — Not integrated yet
   - (Will deploy MockERC8004Registry if needed)

3. **Task completion is simulated** — Not actually calling contracts
   - (Future: integrate with real contract write functions)

4. **No persistent task storage** — Lives in contract only
   - (Scalable in production with database)

5. **Agent X posting is simulated** — Showing readiness, not actual posts
   - (Production: real Twitter API integration)

---

## Git Commit Strategy

**After each section, commit:**
```bash
git add -A
git commit -m "Thursday: [Section] - [what works now]"
git push origin main
```

Examples:
- "Thursday: Frontend wiring - dashboard loads with real contract data"
- "Thursday: Task marketplace - can query and see available tasks"
- "Thursday: Autonomous agent - polls API and logs discovery"

---

## Questions for Annika (9am)

1. **Moltbook credentials?** (for scouring + voting)
2. **X API key?** (for autonomous posting)
3. **Any UI preferences?** (keep current design or tweak?)
4. **Should we test actual contract writes?** (Or just read-only for demo?)

---

## Why This Schedule Works

- **9am-12pm:** UI foundation (most visible, motivating)
- **12pm-1pm:** Verification (catch issues early)
- **1pm-3:30pm:** Agent + autonomy (the "wow" factor)
- **3:30pm-5pm:** Demo + cleanup (ship-ready state)

**Buffer:** 30min built into each section, plus 30min at end

**Friday submission:** Gives agents 24+ hours to vote

---

**You've got this. Let's make it shine. 🚀**
