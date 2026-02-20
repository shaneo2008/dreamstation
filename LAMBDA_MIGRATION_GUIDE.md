# DreamStation Lambda Migration Guide - Node 18 → Node 22

**Goal:** Create new Lambda function (Node 22) to fix all 3 audio issues while keeping production (Node 18) running safely.

**Strategy:** Build new, don't fix old. Test thoroughly. Switch when ready. Easy rollback.

---

## Overview: Why This Approach

### The Problem:
- Current Lambda uses deprecated Node.js 18
- Audio has 3 fixable issues (word spelling, volume, spacing)
- Touching prod Lambda = high risk of breaking bedtime
- Family depends on it every night

### The Solution:
- Create NEW Lambda with Node 22 (modern, supported)
- Fix all 3 audio issues in new Lambda
- Point n8n DEV workflow to test Lambda
- Keep prod Lambda running (zero risk)
- Switch when new Lambda proven stable
- Rollback = 30 seconds (just change n8n config)

### Timeline:
- **Week 1 (Feb 15-22):** Setup, development, testing
- **Week 2 (Feb 23-28):** Validation, switch, monitoring

---

## PHASE 1: Create Test Lambda (Node 22)

### Step 1.1: Locate Current Lambda

**In AWS Console:**
1. Navigate to Lambda service
2. Find your current function (probably named like):
   - `dreamstation-audio-concat`
   - `audio-processing`
   - Something similar

3. **Document current configuration:**
   ```
   Function name: _________________
   Runtime: Node.js 18.x
   Memory: _______ MB
   Timeout: _______ seconds
   Execution role: _________________
   Environment variables: _________________
   Layers: _________________
   ```

4. **Export the code:**
   - Code tab → Actions → Export function
   - Download as .zip
   - **Save as backup:** `lambda-node18-backup-YYYYMMDD.zip`

**DO NOT MODIFY THIS LAMBDA**

---

### Step 1.2: Create New Lambda Function

**In AWS Console:**

1. **Click "Create function"**

2. **Basic information:**
   - Function name: `dreamstation-audio-concat-v2-node22`
   - Runtime: **Node.js 22.x** (select from dropdown)
   - Architecture: x86_64 (or match current Lambda)

3. **Permissions:**
   - Execution role: "Use an existing role"
   - Select: Same role as old Lambda
   - (This gives it same S3/CloudWatch permissions)

4. **Click "Create function"**

---

### Step 1.3: Configure Function Settings

**Configuration tab → General configuration → Edit:**
- Memory: Match old Lambda (probably 1024-2048 MB)
- Timeout: Match old Lambda (probably 30-60 seconds)
- Click "Save"

**Configuration tab → Environment variables:**
- Copy ALL environment variables from old Lambda
- Add them to new Lambda

**Configuration tab → VPC:**
- If old Lambda uses VPC, configure same VPC settings
- Most likely: No VPC (leave default)

---

### Step 1.4: Add ffmpeg Layer

**The existing ffmpeg layer can be reused** — ffmpeg is a compiled Linux binary
that runs independently of Node.js version.

1. Configuration tab → Layers → Add layer
2. Use same layer ARN as old Lambda
3. Verify layer added successfully

---

### Step 1.5: Create Function URL (For n8n Access)

1. Configuration tab → Function URL → Create function URL
2. Auth type: Match old Lambda (NONE or IAM)
3. CORS: Configure if needed
4. **Copy the Function URL** for n8n

---

### Step 1.6: Test Basic Functionality

**Create test event in AWS Console:**
- Use same event format as old Lambda
- Verify basic concatenation works
- Check CloudWatch logs for errors

---

## PHASE 2: Point n8n DEV Workflow to Test Lambda

### Step 2.1: Duplicate Production n8n Workflows

Duplicate ALL production workflows with "-DEV" suffix:
- "FancastAI Gemini Version" → "FancastAI Gemini Version - DEV"
- "Full TTS Production v6" → "Full TTS Production v6 - DEV"  
- "Enhanced Cartesia Line Preview" → "Enhanced Cartesia Line Preview - DEV"

### Step 2.2: Update DEV TTS Workflow

In "Full TTS Production v6 - DEV":
- Change Lambda function name to: `dreamstation-audio-concat-v2-node22`
- Change webhook paths to add `-dev` suffix
- Save and activate

### Step 2.3: Test End-to-End in DEV

- Generate test story using dev webhooks
- Verify audio generates and uploads to S3
- Listen to output

---

## PHASE 3: Implement Audio Fixes

### Fix 1: Word Spelling (n8n Validation Node)

Add validation node in n8n DEV workflow before Cartesia TTS:
- Phonetic replacements for unusual words
- Number-to-word conversion
- Special character cleanup

### Fix 2: Volume Normalization (Lambda)

Add ffmpeg loudnorm filter in new Lambda:
- Standard broadcast levels: I=-16:TP=-1.5:LRA=11
- Normalize EACH file before concatenation
- Consistent volume throughout story

### Fix 3: Line Spacing (Lambda)

Add silence generation between audio segments:
- Use pause_after values from script data
- Generate silence files with ffmpeg
- Insert between audio segments during concatenation

---

## PHASE 4-6: Testing, Switch, Cleanup

See AUDIO_FIX_PLAN.md for detailed phase descriptions.

**Rollback procedure:** Change Lambda function name in n8n workflow back to old one (30 seconds).

---

## Troubleshooting

### ffmpeg not found
- Check layer is attached and correct ARN
- Verify path: `/opt/bin/ffmpeg`

### Lambda timeout
- Increase timeout to 60-120 seconds
- Increase memory to 1024-2048 MB

### Volume normalization too slow
- Increase memory (more CPU)
- Consider parallel processing

### Concatenation produces corrupted audio
- Ensure all files same format/sample rate
- Use re-encoding if formats differ

### S3 upload fails
- Check execution role has S3 permissions
- Verify bucket name and region
