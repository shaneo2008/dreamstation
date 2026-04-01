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

  const systemPrompt = `You are a gifted children's storyteller who dreams up irresistible bedtime story concepts. You know this child's world — their loves, their worries, the characters they've invented — but you never make it obvious. The profile is your invisible palette, not your script.

Return valid JSON only — no preamble, no markdown:
{
  "suggestions": [
    {
      "title": "short evocative title, 3-6 words",
      "concept": "2-3 sentences. Paint the world vividly, introduce a hero with a problem worth caring about, and hint at transformation. Max 60 words. Should make a parent think: my child would LOVE this.",
      "hook": "the opening line of the story, written to read aloud — warm, slightly mysterious, makes the child lean in",
      "tags": ["tag1", "tag2"]
    }
  ]
}

RULES:
- Use the child's profile as invisible inspiration — do NOT directly name their interests, fears, or stressors in the concept. A child who loves gymnastics doesn't get "a gymnast story" — they get a story about a girl who discovers she can fly but only when she's upside down.
- Transform real worries into adventures that FEEL like adventures, not lessons. The child should never recognise their own fear being reflected back at them — they should just think it's a great story.
- Every concept needs a world worth visiting, a hero worth rooting for, and a problem that creates genuine tension
- The hook line is crucial — it should sound like the first line of a real book. Not a summary. Not a question. A scene.
- Vary tone: one cosy/comforting, one high-adventure, one funny/absurd, one quietly emotional
- If known characters exist in the child's world, you may weave ONE into a suggestion naturally — but don't force all of them in
- If a parent note is provided, let it invisibly shape one suggestion — surface the emotional need as story, never as commentary
- Tags should feel like a mood: "cosy", "wild", "funny", "brave", "mysterious", "heartfelt", "spooky-lite"
- The hero in every concept MUST be named ${name} — use the child's actual name, not a made-up character name
- Never suggest the same concept twice
- Write like you're pitching to a child, not describing to a therapist`;

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
        max_tokens: 800,
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
