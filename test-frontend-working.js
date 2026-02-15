// Working Frontend Integration Test
// This uses fetch directly to test the n8n webhook

const testData = {
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
      voicePreference: 'female, calm, professional'
    }
  ]
};

console.log('🧪 Testing Frontend Integration...');
console.log('📡 Webhook URL: https://learncastai.app.n8n.cloud/webhook/ai-assisted-creation');

// Test the n8n workflow directly
fetch('https://learncastai.app.n8n.cloud/webhook/ai-assisted-creation', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testData)
})
.then(response => {
  console.log('📊 Response Status:', response.status);
  return response.json();
})
.then(data => {
  console.log('✅ Success! Result:', data);
  
  if (data.success) {
    console.log('🎉 AI-Assisted Creation Successful!');
    console.log('📋 Script ID:', data.data.scriptId);
    console.log('🔗 Edit URL:', `http://localhost:5173/script-editor/${data.data.scriptId}`);
  } else {
    console.error('❌ Error:', data);
  }
})
.catch(error => {
  console.error('❌ Network Error:', error);
});
