# 🧪 Manual Test Guide for AI-Assisted Creation Workflow

## 🎯 **Quick Test Options**

### **Option 1: Test via Postman/Insomnia**
1. **Method**: POST
2. **URL**: `https://learncastai.app.n8n.cloud/webhook/ai-assisted-creation`
3. **Headers**: 
   ```
   Content-Type: application/json
   ```
4. **Body** (JSON):
   ```json
   {
     "userId": "test-user-123",
     "storyId": "test-story-456",
     "concept": {
       "initialConcept": "A detective with quantum vision can see multiple realities simultaneously. When a murder occurs that seems impossible in the current timeline, she must navigate between dimensions to catch a killer who exists in multiple realities at once.",
       "genre": "sci-fi mystery",
       "targetAudience": "adult",
       "toneStyle": "dark and suspenseful",
       "targetEpisodes": 1,
       "episodeLengthMinutes": 10
     },
     "characters": [
       {
         "name": "Sarah Chen",
         "role": "protagonist",
         "description": "Quantum detective with enhanced vision that allows her to see multiple realities"
       },
       {
         "name": "Dr. Martinez",
         "role": "supporting",
         "description": "Quantum physicist who helps Sarah understand her abilities"
       }
     ],
     "preferences": {
       "dialogueStyle": "natural with sci-fi elements",
       "narrationLevel": "detailed",
       "pacingPreference": "suspenseful"
     }
   }
   ```

### **Option 2: Test via n8n Interface**
1. **Go to your n8n workflow**
2. **Click "Execute Workflow"**
3. **Paste the test JSON** from above
4. **Click "Execute"**
5. **Watch the execution flow**

### **Option 3: Test via Browser Console**
1. **Open your browser's developer console**
2. **Paste and run this JavaScript**:
   ```javascript
   fetch('https://learncastai.app.n8n.cloud/webhook/ai-assisted-creation', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({
       userId: 'test-user-123',
       storyId: 'test-story-456',
       concept: {
         initialConcept: 'A detective with quantum vision can see multiple realities. When a murder occurs that seems impossible, she must navigate between dimensions to catch an interdimensional killer.',
         genre: 'sci-fi mystery',
         targetEpisodes: 1,
         episodeLengthMinutes: 10
       },
       characters: [
         {
           name: 'Sarah Chen',
           role: 'protagonist',
           description: 'Quantum detective with enhanced vision'
         },
         {
           name: 'Dr. Martinez',
           role: 'supporting',
           description: 'Quantum physicist mentor'
         }
       ],
       preferences: {
         dialogueStyle: 'natural'
       }
     })
   })
   .then(response => response.json())
   .then(data => {
     console.log('Success!', data);
     console.log('Script ID:', data.data.scriptId);
     console.log('Total Lines:', data.data.totalLines);
     console.log('Edit URL:', data.data.editUrl);
   })
   .catch(error => {
     console.error('Error:', error);
   });

## 🔍 **What to Expect**

### **Successful Response:**
```json
{
  "success": true,
  "message": "AI-assisted script creation completed",
  "data": {
    "jobId": "ai_create_1234567890_abcdef123",
    "scriptId": "uuid-of-generated-script",
    "totalLines": 25,
    "title": "Generated Script Title",
    "editUrl": "https://fancast.ai/script-editor/uuid-of-generated-script"
  }
}
```

### **Processing Time:**
- **Expected**: 30-60 seconds (AI processing takes time)
- **Timeout**: If longer than 2 minutes, check n8n logs

## 📊 **Verification Steps**

### **1. Check Supabase Database**
After successful test, verify these tables have new records:
- `story_concepts` - Your story concept
- `ai_generation_jobs` - Job tracking record
- `scripts` - Generated script record
- `script_lines` - Individual dialogue/narration lines

### **2. Check n8n Execution Logs**
1. Go to your n8n workflow
2. Click "Executions" tab
3. Look for recent execution
4. Check each node for success/failure

### **3. Verify Script Content**
The generated script should contain:
- **Dialogue lines** with character names
- **Narration lines** with scene descriptions
- **Emotion tags** (Happy, Sad, Neutral, etc.)
- **AI confidence scores** (0.7-0.9 range)

## 🚨 **Troubleshooting**

### **Common Issues:**

#### **"Missing required fields" Error**
- Check that all required fields are present in payload
- Verify JSON syntax is correct

#### **Database Connection Error**
- Check Supabase credentials in n8n
- Verify database tables exist
- Confirm RLS policies allow inserts

#### **OpenAI API Error**
- Check OpenAI API key in n8n
- Verify API key has GPT-4 access
- Check OpenAI billing/credits

#### **Timeout/No Response**
- Check n8n workflow is active
- Verify webhook URL is correct
- Check n8n execution logs for errors

## 🎯 **Success Criteria**

✅ **Workflow completes without errors**  
✅ **Database records are created**  
✅ **Script contains realistic dialogue**  
✅ **Characters are properly assigned**  
✅ **Response includes valid script ID**  
✅ **Processing time under 2 minutes**

---

**Choose your preferred testing method and let's validate your AI-assisted creation workflow! 🚀**
