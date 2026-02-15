# FanCast AI v2 - n8n AI Workflows for Dual Pathway Architecture

## 🎯 **Dual Pathway Support Overview**

FanCast AI supports **TWO script creation pathways**:
1. **AI Import Pathway** - Uses n8n workflows (detailed below)
2. **Manual Creation Pathway** - Direct frontend creation (no n8n needed)
3. **Hybrid Editing** - Both pathways use same editing interface

## 🤖 **n8n AI-Powered Workflow Architecture**

The following n8n workflows specifically support the **AI Import Pathway**. Manual creation happens entirely in the frontend without n8n involvement.

### **Workflow 1: AI Script Generation from URL**
**Webhook:** `VITE_N8N_AI_SCRIPT_GENERATION_WEBHOOK`

```
Trigger: User submits fanfiction URL
↓
Extract: Story content from AO3/Wattpad/etc.
↓
AI Analysis: 
  - Character detection and profiling
  - Dialogue extraction and parsing
  - Scene identification and pacing
  - Emotion analysis and tagging
↓
Script Generation:
  - Convert narrative to script format
  - Assign characters to dialogue lines
  - Suggest emotions for each line
  - Create episode break points
↓
Database Storage:
  - Create script record in Supabase
  - Insert script_lines with AI metadata
  - Set ai_generated=true, needs_review=true
  - Store AI confidence scores
↓
Notify Frontend: Script ready for review
```

### **Workflow 2: Line Preview Generation**
**Webhook:** `VITE_N8N_LINE_PREVIEW_WEBHOOK`

```
Trigger: User clicks "Preview Line" in script editor
↓
Extract: character_voice + emotion + text + AI metadata
↓
Generate: 5-10 second audio with Cartesia
↓
Store: Preview in temp S3 location
↓
Return: Audio URL to frontend
```

### **Workflow 3: Final Audio Generation**
**Webhook:** `VITE_N8N_AUDIO_GENERATION_WEBHOOK`

```
Trigger: User completes script review and hits "Generate"
↓
Validate: All lines reviewed and approved
↓
Calculate: Credit cost based on total audio minutes
↓
Check: User credit balance
↓
If sufficient credits:
  - Process each line with character voice + emotion
  - Apply human edits and AI suggestions
  - Generate professional audio with Cartesia
  - Stitch episodes maintaining character consistency
  - Apply audio mastering and effects
  - Upload final episodes to S3
  - Update database with episode metadata
↓
If insufficient: Redirect to credit purchase
```

## 🎯 **AI Script Generation Workflow Details**

### **Input Parameters**
```json
{
  "source_url": "https://archiveofourown.org/works/12345",
  "story_id": "uuid-story-id",
  "user_id": "uuid-user-id",
  "preferences": {
    "episode_count": 6,
    "episode_duration": 20,
    "story_tone": "Suspenseful",
    "narrative_perspective": "Third-Person Limited",
    "include_cliffhangers": true,
    "include_twist": false,
    "resolve_plotlines": true
  }
}
```

### **AI Processing Steps**

#### **Step 1: Content Extraction**
- Scrape fanfiction from source URL
- Clean and normalize text
- Identify chapters/sections
- Extract metadata (title, author, tags)

#### **Step 2: Character Analysis**
```javascript
// AI identifies and profiles characters
const characters = await aiAnalysis.detectCharacters(storyText, {
  includePersonality: true,
  suggestVoices: true,
  analyzeRelationships: true
});

// Store in database
for (const character of characters) {
  await db.createCharacter({
    story_id: storyId,
    name: character.name,
    description: character.personality,
    voice_id: character.suggestedVoice,
    default_emotion: character.defaultEmotion
  });
}
```

#### **Step 3: Script Conversion**
```javascript
// AI converts narrative to script format
const scriptLines = await aiAnalysis.convertToScript(storyText, {
  characters: characters,
  targetEpisodes: preferences.episode_count,
  episodeDuration: preferences.episode_duration,
  tone: preferences.story_tone
});

// Store script lines with AI metadata
for (const [index, line] of scriptLines.entries()) {
  await db.createScriptLine({
    script_id: scriptId,
    line_number: index + 1,
    character_id: line.characterId,
    speaker_name: line.speaker,
    line_type: line.type, // 'dialogue' or 'narration'
    text_content: line.text,
    emotion_type: line.suggestedEmotion,
    emotion_intensity: line.emotionIntensity,
    ai_generated: true,
    ai_confidence: line.confidence,
    needs_review: line.confidence < 0.8,
    ai_metadata: {
      original_text: line.originalNarrative,
      suggestions: line.alternativeEmotions,
      reasoning: line.emotionReasoning,
      character_confidence: line.characterConfidence
    }
  });
}
```

### **AI Confidence Scoring**
- **High (0.9+)**: Clear dialogue, obvious character, strong emotion indicators
- **Medium (0.7-0.9)**: Good context, minor ambiguity, reasonable assumptions
- **Low (<0.7)**: Unclear speaker, ambiguous emotion, needs human review

### **Database Integration**
```sql
-- AI generation job tracking
INSERT INTO ai_generation_jobs (
  user_id, story_id, script_id, source_url, 
  status, generation_params
) VALUES (
  $1, $2, $3, $4, 'processing', $5
);

-- Script lines with AI metadata
INSERT INTO script_lines (
  script_id, line_number, character_id, text_content,
  emotion_type, ai_generated, ai_confidence, ai_metadata
) VALUES (
  $1, $2, $3, $4, $5, true, $6, $7
);
```

## 🎨 **Frontend Integration**

### **AI Script Review Interface**
Your script editor becomes an AI review and editing tool:

```javascript
// Enhanced script editor for AI-generated content
const ScriptReviewEditor = ({ scriptId }) => {
  const { 
    lines, 
    updateLine, 
    aiSuggestions,
    reviewProgress 
  } = useScriptEditor(scriptId);

  return (
    <div className="ai-script-review">
      <ReviewProgress progress={reviewProgress} />
      
      {lines.map(line => (
        <ScriptLine 
          key={line.id}
          line={line}
          aiGenerated={line.ai_generated}
          confidence={line.ai_confidence}
          needsReview={line.needs_review}
          suggestions={line.ai_metadata?.suggestions}
          onUpdate={(updates) => updateLine(line.id, updates)}
          onApprove={() => approveLine(line.id)}
        />
      ))}
    </div>
  );
};
```

### **AI Confidence Indicators**
```css
/* Visual indicators for AI confidence */
.script-line {
  border-left: 4px solid;
}

.script-line.ai-high-confidence {
  border-left-color: #10b981; /* Green */
}

.script-line.ai-medium-confidence {
  border-left-color: #f59e0b; /* Yellow */
}

.script-line.ai-low-confidence {
  border-left-color: #ef4444; /* Red */
}

.script-line.needs-review {
  background-color: #fef3c7; /* Light yellow background */
}
```

## 🔄 **Review and Approval Workflow**

### **Human Review Process**
1. **AI generates script** with confidence scores
2. **User reviews lines** starting with lowest confidence
3. **Edit and approve** each line individually
4. **Batch operations** for similar changes
5. **Final approval** triggers audio generation

### **Review Analytics**
```javascript
// Track review progress and quality
const reviewAnalytics = {
  totalLines: lines.length,
  reviewedLines: lines.filter(l => l.human_reviewed).length,
  highConfidenceAccepted: lines.filter(l => 
    l.ai_confidence > 0.9 && !l.human_modified
  ).length,
  lowConfidenceModified: lines.filter(l => 
    l.ai_confidence < 0.7 && l.human_modified
  ).length
};
```

## 🚀 **Implementation Priority**

### **Phase 1: Core AI Generation**
1. Set up basic AI script generation workflow
2. Implement character detection and dialogue parsing
3. Create script storage with AI metadata
4. Build review interface in frontend

### **Phase 2: Enhanced AI Features**
1. Emotion analysis and suggestion system
2. Voice assignment recommendations
3. Episode break optimization
4. Quality scoring and confidence metrics

### **Phase 3: Advanced Features**
1. Multi-language support
2. Style adaptation (comedy vs drama)
3. Character voice consistency checking
4. Automated quality assurance

## 🛠️ **Manual Creation Pathway (No n8n Required)**

The **Manual Creation Pathway** operates entirely within the frontend using the `useScriptEditor` hook:

### **Manual Workflow Process**
```
User Action: "Create from Scratch"
↓
Frontend: createNewScript() → Empty script in database
↓
User Interface: Line-by-line creation with character assignment
↓
Real-time Save: Auto-save to Supabase (no n8n)
↓
Audio Generation: Same Workflow 3 (Final Audio Generation)
```

### **Key Differences from AI Pathway**
- **No URL parsing** - User creates all content
- **No AI confidence scores** - All content marked as `ai_generated: false`
- **No review workflow** - Content is immediately ready for editing
- **Same editing interface** - Uses identical script editor components
- **Same audio generation** - Final output uses same n8n audio workflow

## 🔄 **Hybrid Editing Considerations**

### **AI → Manual Enhancement**
- AI-generated scripts can have manual lines added
- Manual lines are marked with `ai_generated: false`
- Mixed content maintains separate confidence tracking

### **Manual → AI Assistance**
- Manual scripts can request AI suggestions for specific lines
- Uses **Workflow 2** (Line Preview) for individual line enhancement
- User maintains full control over accepting/rejecting AI suggestions

### **Database Tracking**
```sql
-- Script generation method tracking
UPDATE scripts SET 
  generation_method = CASE 
    WHEN EXISTS(SELECT 1 FROM script_lines WHERE script_id = scripts.id AND ai_generated = true) 
         AND EXISTS(SELECT 1 FROM script_lines WHERE script_id = scripts.id AND ai_generated = false)
    THEN 'hybrid'
    WHEN EXISTS(SELECT 1 FROM script_lines WHERE script_id = scripts.id AND ai_generated = true)
    THEN 'ai_generated' 
    ELSE 'manual'
  END;
```

## 🎯 **Workflow Decision Matrix**

| User Goal | Pathway | n8n Workflows Used | Frontend Functions |
|-----------|---------|-------------------|-------------------|
| Import fanfiction | AI Import | Workflows 1, 2, 3 | Review & edit interface |
| Create original script | Manual | Workflow 3 only | Full creation interface |
| Enhance manual script | Hybrid | Workflows 2, 3 | Creation + AI suggestions |
| Edit AI script | Hybrid | Workflows 2, 3 | Review + manual additions |

---

**This dual pathway architecture with n8n workflows enables both AI-assisted efficiency and complete creative control while maintaining professional quality! 🎭✨**
