// Test script to debug n8n webhook
const testPayload = {
  "source_url": "",
  "story_id": "story_test_123",
  "user_id": "04fd596d-f8ec-4a6a-bc1a-fd36dfbb236c",
  "concept": {
    "initialConcept": "A simple pirate adventure story",
    "genre": "adventure",
    "targetAudience": "general",
    "toneStyle": "balanced",
    "contentGuidelines": "family-friendly",
    "targetEpisodes": 1,
    "episodeLengthMinutes": 10
  },
  "optimized_prompt": "Write an adventure audio script.\n\nStory: A simple pirate adventure story\nGenre: adventure\nLength: 10 minutes\nFocus: balanced\n\nFormat as professional audio script:\n- Character names in CAPS\n- Clear scene descriptions\n- Include stage directions for audio\n- Complete story arc\n\nReturn JSON format:\n{\n  \"characters\": [{\"name\": \"Character Name\", \"description\": \"brief description\"}],\n  \"script_lines\": [\n    {\"type\": \"dialogue\", \"speaker\": \"Character Name\", \"text\": \"dialogue text\", \"emotion\": \"Happy\", \"confidence\": 0.8},\n    {\"type\": \"narration\", \"speaker\": \"Narrator\", \"text\": \"scene description\", \"emotion\": \"Neutral\", \"confidence\": 0.9}\n  ]\n}",
  "preferences": {
    "preset": "ADVENTURE",
    "episode_duration": "medium",
    "focus_type": "balanced",
    "intensity_level": "medium",
    "genre": "adventure",
    "episode_count": 1,
    "production_ready": true,
    "include_stage_directions": true
  },
  "generation_metadata": {
    "config_version": "2.0-optimized",
    "token_optimized": true,
    "max_tokens": 4159,
    "generated_at": new Date().toISOString()
  }
};

async function testN8nWebhook() {
  const webhookUrl = 'http://localhost:5678/webhook/ai-script-generation';
  
  console.log('Testing n8n webhook with payload:');
  console.log(JSON.stringify(testPayload, null, 2));
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });
    
    console.log('\nResponse status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('\nResponse body:', responseText);
    
    if (response.ok) {
      try {
        const responseJson = JSON.parse(responseText);
        console.log('\nParsed response:', JSON.stringify(responseJson, null, 2));
      } catch {
        console.log('Response is not valid JSON');
      }
    } else {
      console.log('Request failed with status:', response.status);
    }
    
  } catch (error) {
    console.error('Error testing webhook:', error.message);
  }
}

// Run the test
testN8nWebhook();
