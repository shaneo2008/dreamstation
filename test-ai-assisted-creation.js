// Test Script for AI-Assisted Creation Workflow
// Run this with: node test-ai-assisted-creation.js

// Using built-in fetch (Node.js 18+)

// Test Configuration
const WEBHOOK_URL = 'https://learncastai.app.n8n.cloud/webhook/ai-assisted-creation';

// Test Data
const testPayload = {
  userId: 'test-user-123',
  storyId: 'test-story-456',
  concept: {
    initialConcept: "A detective with quantum vision can see multiple realities simultaneously. When a murder occurs that seems impossible in the current timeline, she must navigate between dimensions to catch a killer who exists in multiple realities at once.",
    genre: "sci-fi mystery",
    targetAudience: "adult",
    toneStyle: "dark and suspenseful",
    contentGuidelines: "mature themes allowed",
    targetEpisodes: 1,
    episodeLengthMinutes: 15,
    storyArcOutline: "Detective discovers her quantum vision, encounters impossible crime, learns to navigate realities, confronts interdimensional killer",
    keyPlotPoints: [
      "Detective Sarah's vision starts flickering between realities",
      "Murder scene shows contradictory evidence",
      "Sarah realizes killer exists in multiple timelines",
      "Final confrontation across dimensions"
    ]
  },
  characters: [
    {
      name: "Sarah Chen",
      role: "protagonist",
      description: "Quantum detective with enhanced vision that allows her to see multiple realities",
      personalityTraits: ["analytical", "determined", "slightly overwhelmed by her abilities"],
      relationships: {
        "Dr. Martinez": "mentor and quantum physics expert"
      }
    },
    {
      name: "Dr. Martinez",
      role: "supporting",
      description: "Quantum physicist who helps Sarah understand her abilities",
      personalityTraits: ["wise", "patient", "scientific"],
      relationships: {
        "Sarah Chen": "student and protégé"
      }
    },
    {
      name: "The Quantum Killer",
      role: "antagonist", 
      description: "Mysterious killer who can manipulate quantum realities to commit impossible crimes",
      personalityTraits: ["cunning", "otherworldly", "unpredictable"],
      relationships: {}
    }
  ],
  preferences: {
    dialogueStyle: "natural with sci-fi elements",
    narrationLevel: "detailed",
    pacingPreference: "suspenseful",
    emotionalIntensity: "high"
  }
};

// Test Function
async function testAiAssistedCreation() {
  console.log('🧪 Testing AI-Assisted Creation Workflow...');
  console.log('📡 Webhook URL:', WEBHOOK_URL);
  console.log('');

  try {
    console.log('📤 Sending test payload...');
    console.log('Story Concept:', testPayload.concept.initialConcept);
    console.log('Characters:', testPayload.characters.map(c => c.name).join(', '));
    console.log('Target Length:', testPayload.concept.episodeLengthMinutes, 'minutes');
    console.log('');

    const startTime = Date.now();

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });

    const duration = Date.now() - startTime;

    console.log('📥 Response received in', duration, 'ms');
    console.log('Status:', response.status, response.statusText);
    console.log('');

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Request failed:');
      console.error('Status:', response.status);
      console.error('Response:', errorText);
      return;
    }

    const result = await response.json();
    
    console.log('✅ Success! AI-Assisted Creation Completed');
    console.log('');
    console.log('📊 Results:');
    console.log('- Job ID:', result.data.jobId);
    console.log('- Script ID:', result.data.scriptId);
    console.log('- Script Title:', result.data.title);
    console.log('- Total Lines:', result.data.totalLines);
    console.log('- Edit URL:', result.data.editUrl);
    console.log('');
    console.log('💬 Message:', result.message);
    console.log('');
    console.log('🎉 Test completed successfully!');
    console.log('');
    console.log('🔗 Next Steps:');
    console.log('1. Check your Supabase database for the created records');
    console.log('2. Visit the edit URL to see the generated script');
    console.log('3. Test the script editor with the AI-generated content');

  } catch (error) {
    console.error('❌ Test failed with error:');
    console.error(error.message);
    console.error('');
    console.error('🔍 Troubleshooting:');
    console.error('1. Check that the n8n workflow is active');
    console.error('2. Verify Supabase credentials in n8n');
    console.error('3. Confirm OpenAI API key is configured');
    console.error('4. Check n8n execution logs for details');
  }
}

// Alternative: Simple curl command for manual testing
console.log('🔧 Alternative: Test with curl command:');
console.log('');
console.log('curl -X POST \\');
console.log(`  "${WEBHOOK_URL}" \\`);
console.log('  -H "Content-Type: application/json" \\');
console.log('  -d \'', JSON.stringify(testPayload, null, 2), '\'');
console.log('');

// Run the test
testAiAssistedCreation();
