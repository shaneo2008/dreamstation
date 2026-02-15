# DreamStation - Audio Fix Phase (LOCKED IN)

**Status:** v1.0 shipped ✅ | 6/7 validation complete ✅ | Audio polish phase in progress

**Deadline:** These 3 fixes complete before ANY other work

---

## 🚨 COMMITMENT: Audio Fixes Only

**AWS Lambda Node 18 Deprecation Alert:**
- Received AWS email: Node.js 18 end of support coming
- Current Lambda uses Node 18 (deprecated)
- Touching it now = high risk
- Solution: Create NEW Lambda (Node 22), migrate properly

**The Plan:**
- Create test Lambda with modern Node 22
- Fix ALL audio issues there (word spelling, volume, spacing)
- Test thoroughly in dev environment
- Switch production when ready
- Production stays safe the entire time

**I will NOT touch:**
- ❌ Old Lambda (Node 18) - production safety net
- ❌ UI improvements - after migration
- ❌ New features - after migration
- ❌ Story duration changes - after migration
- ❌ Buddy system expansion - after migration
- ❌ "Just quickly adding..." - after migration

**I will ONLY work on:**
- ✅ Create new Lambda (Node 22)
- ✅ Migrate audio processing to new Lambda
- ✅ Fix word spelling (n8n + Lambda)
- ✅ Fix volume normalization (Lambda)
- ✅ Fix line spacing (Lambda)
- ✅ Test thoroughly before production switch

**Timeline:** 2 weeks (1 week dev, 1 week validation)

**Until Lambda migration is complete and production is stable.**

---

## STEP 0: Git Branch Setup (DO THIS FIRST)

### Create Development Branch (10 minutes)

```bash
# 1. Initialize git (if not already)
git init
git add .
git commit -m "Initial commit: DreamStation v1.0"

# 2. Create dev branch from current main
git checkout -b dev

# 3. Work on dev branch from now on
# All audio fix work happens here

# 4. When feature is complete and tested:
git checkout main
git merge dev
git push origin main
# Production updates automatically
```

### Branch Strategy

**Production (main):**
- https://dreamstation.vercel.app
- Family uses daily
- NEVER push directly to main
- Only merge from dev when tested

**Development (dev):**
- https://dreamstation-git-dev-[yourname].vercel.app  
- All changes happen here first
- Test with family on preview URL
- Merge to main only when confirmed working

---

## THE NEW APPROACH: Lambda Migration (Node 18 → Node 22)

**Why this changed:**
- Original plan: Fix audio bugs in existing Lambda (Node 18)
- Problem discovered: Node 18 is deprecated, touching it is risky
- New strategy: Create NEW Lambda (Node 22), fix everything there, switch when ready
- Benefit: Production stays safe, you can work on all audio fixes in one focused block

---

## WEEK 1 (Feb 15-22): Setup & Development

### Phase 1: Create Test Lambda (Node 22)

**Status:** [ ] Not Started | [ ] In Progress | [ ] Complete

**Tasks:**
- [ ] Document current Lambda configuration
- [ ] Export current Lambda code (backup)
- [ ] Create new Lambda function (Node 22)
- [ ] Upload code to new Lambda
- [ ] Configure settings (memory, timeout, env vars)
- [ ] Add ffmpeg layer (Node 22 compatible)
- [ ] Create Function URL for n8n access
- [ ] Test basic functionality (simple audio concat)

**Time:** 3-4 hours

**Success:** New Lambda generates audio successfully (even if quality not perfect yet)

---

### Phase 2: Point n8n DEV Workflow to Test Lambda

**Status:** [ ] Not Started | [ ] In Progress | [ ] Complete

**Tasks:**
- [ ] Create/verify n8n DEV workflow exists
- [ ] Update Lambda invocation to new function
- [ ] Test end-to-end in dev environment
- [ ] Verify audio generates and uploads to S3

**Time:** 1-2 hours

**Success:** Dev environment generates stories using new Lambda

---

### Phase 3: Implement ALL Audio Fixes

**Status:** [ ] Not Started | [ ] In Progress | [ ] Complete

#### Fix 1: Word Spelling (n8n + Cartesia)

**The Problem:**
- Cartesia spells out unusual words letter-by-letter
- Example: "Labudu" → "L-A-B-U-D-U"
- Breaks immersion completely

**The Fix:**
- Add validation node in n8n DEV workflow
- Phonetically spell unusual words BEFORE Cartesia
- Convert numbers to words
- Clean special characters

**Location:** n8n only (safe, no Lambda changes)

---

#### Fix 2: Volume Normalization (Lambda)

**The Problem:**
- Each audio line has different volume
- Narrator loud, characters quiet (or vice versa)
- Jarring listening experience

**The Fix:**
- Add ffmpeg loudnorm to new Lambda
- Normalize EACH file before concatenation
- Standard broadcast levels (I=-16:TP=-1.5:LRA=11)

**Location:** New Lambda function code

---

#### Fix 3: Line Spacing (Lambda)

**The Problem:**
- Lines too close together
- Characters talk over each other
- Rushed, unnatural flow

**The Fix:**
- Generate silence between audio segments
- Use pause_after values from script
- Natural pacing based on dialogue type

**Location:** New Lambda concatenation logic

---

## WEEK 2 (Feb 23-28): Validation & Switch

### Phase 4: Extended Testing (Dev Environment)
- Use dev environment for bedtime (3-4 nights)
- Collect family feedback on audio quality
- Monitor CloudWatch for Lambda errors

### Phase 5: Switch Production
- Update production n8n workflow to new Lambda
- Rollback procedure: 30 seconds (change n8n config back)

### Phase 6: Cleanup
- Disable old Lambda (after 1 week stability)
- Delete old Lambda (after 2 weeks stability)

---

## CURRENT STATUS

**Last Updated:** 2026-02-15

**Current Phase:** Planning & Review

**Week 1 (Feb 15-22):**
- [ ] Phase 1: Create test Lambda (Node 22)
- [ ] Phase 2: Point n8n DEV to test Lambda
- [ ] Phase 3: Implement all 3 audio fixes
- [ ] Combined testing (all fixes together)

**Week 2 (Feb 23-28):**
- [ ] Phase 4: Extended testing (3-4 nights on dev)
- [ ] Phase 5: Switch production to new Lambda
- [ ] Phase 6: Monitor stability + Cleanup
