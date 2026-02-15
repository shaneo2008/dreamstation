@echo off
echo 🧪 Testing AI-Assisted Creation Workflow...
echo.

echo 📤 Sending test payload to n8n workflow...
echo Webhook URL: https://learncastai.app.n8n.cloud/webhook/ai-assisted-creation
echo.

curl -X POST ^
  "https://learncastai.app.n8n.cloud/webhook/ai-assisted-creation" ^
  -H "Content-Type: application/json" ^
  -d "{\"userId\":\"test-user-123\",\"storyId\":\"test-story-456\",\"concept\":{\"initialConcept\":\"A detective with quantum vision can see multiple realities simultaneously. When a murder occurs that seems impossible in the current timeline, she must navigate between dimensions to catch a killer who exists in multiple realities at once.\",\"genre\":\"sci-fi mystery\",\"targetAudience\":\"adult\",\"toneStyle\":\"dark and suspenseful\",\"targetEpisodes\":1,\"episodeLengthMinutes\":15},\"characters\":[{\"name\":\"Sarah Chen\",\"role\":\"protagonist\",\"description\":\"Quantum detective with enhanced vision\"},{\"name\":\"Dr. Martinez\",\"role\":\"supporting\",\"description\":\"Quantum physicist mentor\"}],\"preferences\":{\"dialogueStyle\":\"natural\",\"pacingPreference\":\"suspenseful\"}}"

echo.
echo.
echo ✅ Test completed! Check the response above for results.
echo.
echo 🔍 What to look for:
echo - Success: true (workflow completed successfully)
echo - Script ID (UUID of generated script)
echo - Total lines count
echo - Edit URL for the script editor
echo.
echo 📊 Next steps:
echo 1. Check your Supabase database for new records
echo 2. Visit the edit URL to see the generated script
echo 3. Test the script editor interface
echo.
pause
