# n8n Workflow Changes — Child Profile Injection

## Overview

Three changes to your dev workflow copy:
1. **"Validate Input"** — extract childProfile from payload (backwards-compatible)
2. **NEW "Build Prompt" Code node** — builds the full Gemini prompt as a string (add between "Immediate Response" and "Message a model")
3. **"Message a model"** — change message content to a simple expression referencing the Build Prompt output

n8n's expression parser cannot handle complex nested ternaries inside the Gemini node — that's what caused the "invalid syntax" error. Moving the logic to a Code node fixes this completely.

---

## Step 1: Update "Validate Input" node

Replace the entire JS code with this. The only additions are the `childProfile` extraction:

```javascript
// Access the webhook payload from the correct location
const webhookData = $input.first().json;
const payload = webhookData.body || webhookData;

// Extract required fields
const userId = payload.user_id || payload.userId;
const storyId = payload.story_id || payload.storyId;
const concept = payload.concept || {};
const initialConcept = concept.initialConcept || payload.initialConcept;

// Validation
if (!userId) throw new Error('Missing user_id field');
if (!storyId) throw new Error('Missing story_id field');
if (!initialConcept) throw new Error('Missing concept.initialConcept field');

// Extract child profile (optional — backwards compatible)
const childProfile = payload.childProfile || null;

if (childProfile) {
  console.log('🧒 Child profile received:', childProfile.name, 'age', childProfile.age);
} else {
  console.log('ℹ️ No child profile in payload — generating generic story');
}

// Return validated data wrapped in json property
return [{
  json: {
    jobId: `ai_create_gemini_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    storyId,
    concept: concept,
    optimizedPrompt: payload.optimized_prompt || '',
    characters: payload.characters || [],
    preferences: payload.preferences || {},
    generation_metadata: payload.generation_metadata || {},
    childProfile: childProfile
  }
}];
```

---

## Step 2: Add NEW "Build Prompt" Code node

Add a **Code node** named **"Build Prompt"** and place it between **"Immediate Response"** and **"Message a model"**.

Reconnect the wires:
- "Immediate Response" → "Build Prompt" → "Message a model"

Paste this entire code into the Build Prompt node:

```javascript
const data = $('Validate Input').first().json;
const cp = data.childProfile;
const concept = data.concept;
const characters = data.characters || [];

// Build the child profile block (empty string if no profile)
let profileBlock = '';

if (cp) {
  const sections = [];

  sections.push(`CHILD PROFILE — USE THIS TO PERSONALISE THE STORY:

This story is for ${cp.name}, age ${cp.age}.`);

  if (cp.genderPronoun && cp.genderPronoun !== 'Skip') {
    sections.push(`Pronouns: ${cp.genderPronoun}`);
  }

  sections.push(`
PERSONALITY (from parent):
"${cp.personalityDescription || 'No description provided'}"`);

  // Neuro flags
  if (cp.neuroFlags && cp.neuroFlags.length > 0 && !cp.neuroFlags.includes('None of these really fit')) {
    sections.push(`
NERVOUS SYSTEM NOTES (adapt tone and pacing accordingly):
${cp.neuroFlags.map(f => '- ' + f).join('\n')}`);
  }

  // Allies
  const validAllies = (cp.allies || []).filter(a => a.name);
  if (validAllies.length > 0) {
    sections.push(`
IMPORTANT PEOPLE IN THEIR LIFE (weave naturally into the story world — as inspirations for characters, not literal copies):
${validAllies.map(a => '- ' + a.name + (a.relationship ? ' (' + a.relationship + ')' : '')).join('\n')}`);
  }

  // Pets
  const validPets = (cp.pets || []).filter(p => p.name);
  if (validPets.length > 0) {
    sections.push(`
PETS (can appear as story companions):
${validPets.map(p => '- ' + p.name + (p.type ? ' the ' + p.type : '')).join('\n')}`);
  }

  // Fear flags
  if (cp.fearFlags && cp.fearFlags.length > 0 && !cp.fearFlags.includes('None of these')) {
    sections.push(`
EMOTIONAL THEMES TO ADDRESS GENTLY (do NOT name these directly — instead create story situations where the protagonist faces and overcomes similar feelings):
${cp.fearFlags.map(f => '- ' + f).join('\n')}`);
  }

  // Current stressors
  if (cp.currentStressors) {
    sections.push(`
CURRENT CONTEXT (something happening in their life right now — the story should offer comfort around this theme without being on-the-nose):
"${cp.currentStressors}"`);
  }

  sections.push(`
PERSONALISATION RULES:
- The protagonist should share qualities with ${cp.name} but is NOT ${cp.name} — this is a story character who happens to face similar feelings
- Never lecture or moralise. The story should model healthy responses through what happens, not through what characters say about feelings
- If fear themes are listed above, create a story arc where the protagonist encounters a version of that fear and discovers their own way through it
- If allies/pets are listed, they can inspire supporting characters (a loyal companion, a wise friend) but don't use real names literally unless it enhances the magic
- Adapt language complexity for age ${cp.age}: ages 3-5 get simpler vocabulary and shorter sentences, ages 9-12 can handle more sophisticated language`);

  profileBlock = sections.join('\n');
}

// Build the characters block
let charactersBlock = '';
if (characters.length > 0) {
  charactersBlock = 'REQUIRED CHARACTERS (use these EXACT names):\n' +
    characters.map(c => '- ' + c.name + (c.description ? ': ' + c.description : '')).join('\n');
}

// Build the full prompt (your existing prompt + profile injection)
const fullPrompt = `You are a professional children's audio drama scriptwriter creating immersive bedtime stories for 5-10 year olds.

BEDTIME STORY REQUIREMENTS:

This story will be played as a child settles into bed and prepares to fall asleep. The timing is critical to the bedtime routine:

⚠️ TARGET DURATION: Exactly 10 minutes (9.5-10.5 minutes)

Why this matters:
- Too short (5-6 minutes): Child is still alert and restless, not ready for sleep
- Just right (10 minutes): Perfect amount of time for a child to relax, get comfortable, and begin drifting off
- Too long (15+ minutes): Child falls asleep before the ending and misses the warm, satisfying conclusion

To achieve 10 minutes of audio, you MUST generate EXACTLY 130-140 script entries:
- 75-85 dialogue entries (5-12 words each = 2.5-4.5 seconds)
- 55-60 narration entries (12-20 words each = 5-8 seconds)

Stories with fewer than 130 entries are incomplete and unusable for bedtime. Track your progress as you write.

NARRATIVE VOICE & TONE:
Write with a warm, conspiratorial tone—like a mischievous storyteller who delights in surprising children. The narrator should:
- Occasionally address the listening child directly ("Now, you might think...", "I bet you're wondering...")
- Use deliciously specific details (don't say "very big," say "enormous as three elephants stacked in a tower")
- Invent wonderful adjectives when ordinary words won't do ("splendiferous," "fantasmagorical", "squishous")
- Treat small moments as tremendously important and dramatic ones with playful understatement

CHARACTER PHILOSOPHY:
- If a character is kind, make them unexpectedly, memorably kind (in specific, odd ways)
- If a character is mean, make them absurdly, almost comically mean (not scary, but ridiculous)
- Give characters specific quirks, not generic traits (someone who "loves adventure" is boring; someone who "collects interesting pebbles and names them" is memorable)
- Magic should be messy, unpredictable, and have funny consequences

AVOID GENERIC CHARACTERS:
❌ "A brave knight" 
✅ "A knight who was brave about dragons but terrified of spiders"

❌ "An evil witch"
✅ "A witch whose spells always worked backwards and made her furious"

❌ "A wise old wizard"
✅ "A wizard who was extremely wise but couldn't remember where he left his hat (or his breakfast, or sometimes his shoes)"

LANGUAGE GUIDELINES:
- Choose precise, vivid verbs over adverbs ("scuttled" not "walked quickly")
- Use surprising comparisons ("as nervous as a rabbit at a wolf convention")
- Invent compound words when they sound delicious ("snozzwangling", "whizzpopping")
- Avoid tired phrases: no "once upon a time", no "happily ever after", no "beautiful princess" without making it interesting
- ⚠️ TTS COMPATIBILITY: Any invented words must be phonetically pronounceable (e.g. "splendiferous", "squishous" work well). Avoid strings of consonants or letter combinations that have no clear pronunciation (e.g. "xkzzplt", "fnrgl"). If a made-up word might confuse a text-to-speech engine, use a real word instead.

EMOTIONAL RANGE:
Balance mischief with warmth—stories should feel playful and slightly cheeky, but ultimately kind-hearted. Even villains should be more ridiculous than frightening. The child should go to sleep feeling delighted, not anxious.

${profileBlock}

STORY CONCEPT:
${concept.initialConcept}

${charactersBlock}

STORY STRUCTURE:

⚠️ This MUST be a COMPLETE 10-minute bedtime story (130-140 script entries total)

ACT 1 - SETTLING IN (35-40 entries) [Approximately entries 1-40]:
The child is still wiggling and getting comfortable. Keep them engaged but calm.

- Opening 10 entries: Hook opening with immediate intrigue (narrator introduces something peculiar)
- Next 15 entries: Character introductions (make them memorable with specific quirks)
- Final 15 entries: Present main challenge/quest (make it sound important and slightly absurd)

✓ CHECKPOINT: By this point, you should have approximately 40 script entries. Child should be relaxed and interested.

ACT 2A - RELAXING (35-40 entries) [Approximately entries 41-80]:
The child is settling down. Maintain gentle momentum with playful adventure.

- First 20 entries: First obstacle and character reactions (things go wrong in unexpected ways)
- Next 20 entries: Action sequence and discovery (messy magic, surprising solutions)

✓ CHECKPOINT: By this point, you should have approximately 80 script entries. Child should be drowsy but following along.

ACT 2B - DRIFTING (35-40 entries) [Approximately entries 81-120]:
The child is very relaxed, eyes getting heavy. Keep the story flowing with warmth.

- First 20 entries: New complication and emotional moment (characters help each other in odd but touching ways)
- Next 20 entries: Team effort building to climax (everyone's quirks become useful)

✓ CHECKPOINT: By this point, you should have approximately 120 script entries. Child should be nearly asleep.

ACT 3 - GOODNIGHT (25-30 entries) [Approximately entries 121-140]:
The child is almost asleep. Gentle, satisfying resolution that feels like a warm hug.

- First 10 entries: Climactic solution (clever and slightly ridiculous)
- Final 10-20 entries: Victory, lesson learned, warm closing (narrator winks at the listener)

✓ FINAL CHECKPOINT: Complete the story at 130-140 script entries. Child drifts off to sleep feeling safe and delighted.

DIALOGUE RULES:
- Keep under 15 words per entry
- Natural, age-appropriate language with character-specific speech patterns
- Include interruptions and emotions
- Make villains sound pompous and ridiculous, not frightening
- Give heroes distinct voices (brave doesn't mean perfect)

NARRATION REQUIREMENTS:
- Rich sensory details (sounds, textures, atmosphere)
- Scene transitions with personality: "Meanwhile, in the absolutely disastrous kitchen...", "Three minutes later (which felt like three hours)..."
- Paint vivid pictures with surprising comparisons
- Break the fourth wall occasionally to build rapport with the listening child
- Use the narrator to build anticipation and add humor
- NEVER write sound effects, action descriptions, or stage directions in the "text" field — these cannot be spoken by a text-to-speech engine. No parenthetical descriptions like "(A whistle that sounds like...)" or "(splashing sounds)" in text fields
- Non-speaking characters (animals, creatures) should be described by the Narrator, not given their own dialogue lines
- If a character communicates non-verbally, the Narrator describes it: "The dolphin leapt three times, which everyone agreed meant yes"

PACING CONTROLS:
pace: "slow", "measured", "normal", "quick", "excited", "hushed"
pause_after:
- Quick dialogue: 0.3-0.5 seconds
- Normal dialogue: 0.5-0.8 seconds  
- End of thought: 1.0-1.5 seconds
- Scene transition: 2.0-3.0 seconds
- Dramatic narrator aside: 1.5-2.0 seconds

EMOTIONAL PROGRESSION:
Act 1: Curious → Excited → Concerned (but not scared)
Act 2A: Determined → Challenged → Creative
Act 2B: Doubtful → Supportive → Brave (in their own way)
Act 3: Triumphant → Grateful → Content (with a satisfied chuckle)

CHARACTER VOICE ASSIGNMENT:
For each speaking character in your story, identify their gender for voice assignment:
- "male" for male characters (boys, men, kings, princes, fathers, wizards, etc.)
- "female" for female characters (girls, women, queens, princesses, mothers, witches, etc.)
- "neutral" for ambiguous/non-binary characters or magical creatures where gender is not specified

RETURN FORMAT:
{
  "script": {
    "title": "[5 words max, make it intriguing]",
    "target_age": "5-10",
    "duration_minutes": 9.5,
    "total_lines": [130-140],
    "characters": [
      {
        "name": "Narrator",
        "gender": "male",
        "role": "narrator"
      },
      {
        "name": "[Character Name]",
        "gender": "male|female|neutral",
        "role": "protagonist|antagonist|supporting"
      }
    ],
    "lines": [
      {
        "type": "narration",
        "speaker": "Narrator", 
        "text": "[12-20 words with specific, vivid details and playful tone]",
        "emotion": "[Specific emotion]",
        "pace": "measured",
        "pause_after": 2.0
      },
      {
        "type": "dialogue",
        "speaker": "[Character Name]",
        "text": "[5-12 words that reveal personality through speech patterns]", 
        "emotion": "[Specific emotion]",
        "pace": "normal",
        "pause_after": 0.5
      }
    ]
  }
}

⚠️ CRITICAL FORMATTING RULE:
The "text" field should contain ONLY the actual dialogue or narration. 
DO NOT include prefixes like "Line 1:", "Line 2:", "1.", "2.", etc.

CORRECT EXAMPLE:
{ "text": "Once upon a time, in a village where cats wore absolutely ridiculous hats..." }

INCORRECT EXAMPLE:
{ "text": "Line 1: Once upon a time, in a village where cats wore absolutely ridiculous hats..." }
{ "text": "1. Once upon a time, in a village where cats wore absolutely ridiculous hats..." }

The line numbering is handled automatically by the array structure. Your text should be pure storytelling.

CRITICAL REMINDERS: 
- ⚠️ GENERATE EXACTLY 130-140 SCRIPT ENTRIES - Track your progress as you write
- Stories under 130 entries are too short for a 10-minute audio drama and will not work for the bedtime routine
- DO NOT include line numbers in the text field (no "Line 1:", "Line 2:", etc.)
- Include ALL speaking characters in the "characters" array with their gender
- Character names in "characters" array must EXACTLY match speaker names in "lines" array
- Make every character memorable with specific quirks
- Keep villains absurdly mean, not frightening
- Narrator should feel like a friend telling a delicious secret
- Invent wonderful words when they make the story more delightful
- The child should go to sleep feeling delighted, not anxious
- Return ONLY valid JSON
- Invented words must be phonetically pronounceable by a text-to-speech engine — no unpronounceable consonant clusters
- text fields must contain ONLY speakable words — no sound effects, no action descriptions, no parenthetical stage directions
- Animals and non-speaking characters must not have their own script lines — Narrator describes their actions instead
- Complete the full story arc to 130-140 entries
- If approaching token limits, prioritize completing all required entries`;

console.log('📝 Prompt built. Profile injected:', !!cp);
console.log('📝 Prompt length:', fullPrompt.length, 'characters');

return [{
  json: {
    fullPrompt: fullPrompt
  }
}];
```

---

## Step 3: Update "Message a model" (Gemini) node

Replace the entire message content with this single simple expression:

```
={{ $('Build Prompt').first().json.fullPrompt }}
```

That's it. The Gemini node now just reads a pre-built string — no complex expressions needed.

---

## Wiring Summary

Before:
```
Immediate Response → Message a model → Process Gemini Response
```

After:
```
Immediate Response → Build Prompt → Message a model → Process Gemini Response
```

---

## Testing Checklist

1. Duplicate your prod workflow → rename to "FancastAI Gemini Version (Dev)"
2. Unpublish prod, activate dev
3. Update "Validate Input" (Step 1)
4. Add "Build Prompt" Code node between "Immediate Response" and "Message a model" (Step 2)
5. Update "Message a model" content to the simple expression (Step 3)
6. Test with a child profile → check story references age/personality
7. Test WITHOUT a profile → should work identically to before

---

## What the frontend now sends (new `childProfile` field)

```json
{
  "userId": "...",
  "storyId": "...",
  "concept": { "initialConcept": "...", "genre": "...", ... },
  "characters": [...],
  "preferences": {...},
  "childProfile": {
    "childId": "uuid",
    "name": "Luna",
    "age": 7,
    "genderPronoun": "Girl",
    "personalityDescription": "She's incredibly imaginative but finds the world a bit overwhelming sometimes",
    "neuroFlags": ["Gets overwhelmed by noise, crowds, or busy environments", "Worries more than other kids their age"],
    "neuroProfile": null,
    "interests": [],
    "mode": "full_programme",
    "allies": [{"name": "Dad", "relationship": "Parent"}, {"name": "Rosie", "relationship": "Sibling"}],
    "pets": [{"name": "Biscuit", "type": "dog"}],
    "currentStressors": "Starting at a new school next week",
    "fearFlags": ["Starting something new (school, activity, place)", "Making or keeping friends"],
    "socialDifficulty": "There's a girl in her class who's been leaving her out",
    "bedtimeDescription": "She finds a reason to get up every five minutes"
  }
}
```
