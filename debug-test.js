// Debug Test for AI-Assisted Creation Workflow
// This will help us see what's actually being returned

fetch('https://learncastai.app.n8n.cloud/webhook/ai-assisted-creation', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    userId: 'test-user-123',
    storyId: 'test-story-456',
    concept: {
      initialConcept: 'A detective with quantum vision can see multiple realities.',
      genre: 'sci-fi mystery',
      targetEpisodes: 1,
      episodeLengthMinutes: 10
    },
    characters: [
      {
        name: 'Sarah Chen',
        role: 'protagonist',
        description: 'Quantum detective'
      }
    ],
    preferences: {
      dialogueStyle: 'natural'
    }
  })
})
.then(response => {
  console.log('Response Status:', response.status);
  console.log('Response Headers:', response.headers);
  console.log('Response OK:', response.ok);
  
  // Get the raw response text first
  return response.text();
})
.then(text => {
  console.log('Raw Response Text:', text);
  
  // Try to parse as JSON
  try {
    const data = JSON.parse(text);
    console.log('Parsed JSON:', data);
  } catch (e) {
    console.error('JSON Parse Error:', e);
    console.log('Response is not valid JSON');
  }
})
.catch(error => {
  console.error('Fetch Error:', error);
});
