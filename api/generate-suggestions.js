export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { childProfile, dynamicContext, parentNote } = req.body || {};

  if (!childProfile) {
    return res.status(400).json({ error: 'childProfile is required' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY not set');
    return res.status(500).json({ suggestions: [] });
  }

  const name = childProfile.name || 'Child';
  const age = childProfile.age || '';
  const pronoun = childProfile.gender_pronoun || '';
  const personality = childProfile.personality_description || 'Not provided';
  const interests = (childProfile.interests || []).join(', ') || 'Not specified';
  const neuroProfile = childProfile.neuro_profile || 'Not specified';

  const ctx = dynamicContext || {};
  const characters = (ctx.characters || []).filter(c => c.name).map(c => `${c.name} (${c.role || 'ally'})`).join(', ') || 'None yet';
  const stressors = ctx.current_stressors || 'None noted';
  const fears = (ctx.fear_flags || []).join(', ') || 'None noted';

  const systemPrompt = `You are a creative bedtime story prompter for children. You generate short, specific story concepts personalised to a specific child's world. Your suggestions feel like they could only be for this child — not generic fairy tales.

Return valid JSON only — no preamble, no markdown:
{
  "suggestions": [
    { "title": "short title 3-5 words", "concept": "one sentence story concept, max 20 words", "tags": ["tag1", "tag2"] },
    { "title": "...", "concept": "...", "tags": ["..."] },
    { "title": "...", "concept": "...", "tags": ["..."] },
    { "title": "...", "concept": "...", "tags": ["..."] }
  ]
}

RULES:
- Each suggestion must reference something from the child's actual world — their interests, characters, fears, or stressors
- Externalise fears or stressors as story adventures, never name them directly
- Keep concepts warm, exciting, and age-appropriate
- Tags should be 1-2 words: e.g. "brave", "funny", "magical", "cosy", "friendship"
- If a parent note is provided, at least one suggestion should connect to it
- Never suggest the same concept twice`;

  const userPrompt = `CHILD: ${name}, age ${age}${pronoun ? `, ${pronoun}` : ''}
Personality: ${personality}
Interests: ${interests}
Neuro context: ${neuroProfile}

THEIR WORLD:
Known characters: ${characters}
Current stressors: ${stressors}
Fear landscape: ${fears}

${parentNote ? `TONIGHT: Parent noted — "${parentNote}"` : ''}

Generate 4 personalised story suggestions now.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 400,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      console.error('Anthropic API error:', response.status, await response.text());
      return res.status(200).json({ suggestions: [] });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
    const parsed = JSON.parse(cleaned);

    if (!parsed.suggestions || !Array.isArray(parsed.suggestions)) {
      return res.status(200).json({ suggestions: [] });
    }

    return res.status(200).json({ suggestions: parsed.suggestions.slice(0, 4) });
  } catch (err) {
    console.error('generate-suggestions error:', err.message);
    return res.status(200).json({ suggestions: [] });
  }
}
