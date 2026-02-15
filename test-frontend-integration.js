// Test Frontend Integration for AI-Assisted Creation
// Run this in browser console or as a standalone test

const testFrontendIntegration = async () => {
  console.log('🧪 Testing Frontend Integration...');
  
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
    ],
    preferences: {
      dialogueStyle: 'natural',
      emotionIntensity: 'moderate'
    }
  };

  try {
    // Test 1: Check if webhook URL is configured
    const webhookUrl = 'https://learncastai.app.n8n.cloud/webhook/ai-assisted-creation';
    console.log('📡 Webhook URL:', webhookUrl);

    // Test 2: Make direct API call
    console.log('🚀 Making API call to n8n...');
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    console.log('📊 Response Status:', response.status);
    console.log('📊 Response OK:', response.ok);

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Success! Result:', result);
      
      if (result.success) {
        console.log('🎉 AI-Assisted Creation Successful!');
        console.log('📋 Script ID:', result.data.scriptId);
        console.log('🔗 Edit URL:', result.data.editUrl);
        
        // Test the edit URL
        console.log('🧪 Testing edit URL...');
        const editUrl = `http://localhost:5173/script-editor/${result.data.scriptId}`;
        console.log('🌐 Edit URL:', editUrl);
        
        return {
          success: true,
          scriptId: result.data.scriptId,
          editUrl: editUrl,
          result: result
        };
      } else {
        console.error('❌ API returned error:', result);
        return { success: false, error: result.message || 'Unknown error' };
      }
    } else {
      const errorText = await response.text();
      console.error('❌ HTTP Error:', response.status, errorText);
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }

  } catch (error) {
    console.error('❌ Network Error:', error);
    return { success: false, error: error.message };
  }
};

// Run the test
console.log('🎯 Starting Frontend Integration Test...');
testFrontendIntegration().then(result => {
  console.log('🎯 Test Complete:', result);
}).catch(error => {
  console.error('🎯 Test Failed:', error);
});
