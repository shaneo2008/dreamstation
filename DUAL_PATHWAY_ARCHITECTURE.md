# FanCast AI v2 - Dual Pathway Script Creation Architecture

## 🎯 **Complete Script Creation Workflow**

FanCast AI supports **TWO primary pathways** for script creation, both leading to the same professional editing experience:

### **Pathway 1: AI Import & Review**
```
User Input: Fanfiction URL (AO3, Wattpad, etc.)
    ↓
n8n AI Workflow: Extract & analyze content
    ↓
AI Processing: Character detection, dialogue parsing, emotion analysis
    ↓
Database Storage: Script lines with AI metadata & confidence scores
    ↓
Frontend Review: User reviews and edits AI-generated content
    ↓
Professional Polish: Human refinement of AI suggestions
    ↓
Audio Generation: Final TTS with approved script
```

### **Pathway 2: Manual Creation**
```
User Input: Create new script from scratch
    ↓
Manual Setup: Story creation, character definition
    ↓
Line-by-Line Creation: User writes dialogue and narration
    ↓
Character Assignment: Voice and emotion selection
    ↓
Professional Editing: Full CRUD operations on script
    ↓
Audio Generation: TTS with manually created script
```

### **Pathway 3: Hybrid Editing**
```
Either Pathway Above
    ↓
Unified Editor Interface: Same tools for all content
    ↓
Mix AI & Manual: Add manual lines to AI scripts
    ↓
Full Editing Power: Complete control over final script
```

## 🏗️ **Technical Architecture**

### **Database Schema Support**
Both pathways use the same database structure with differentiation through metadata:

```sql
-- Scripts table supports both creation methods
CREATE TABLE scripts (
  id uuid PRIMARY KEY,
  generation_method text DEFAULT 'manual' CHECK (generation_method IN ('manual', 'ai_generated', 'hybrid')),
  ai_generation_job_id text, -- NULL for manual scripts
  -- ... other fields
);

-- Script lines support both manual and AI content
CREATE TABLE script_lines (
  id uuid PRIMARY KEY,
  ai_generated boolean DEFAULT false, -- FALSE for manual lines
  human_reviewed boolean DEFAULT false, -- TRUE when user approves AI content
  ai_confidence decimal(3,2), -- NULL for manual lines
  ai_metadata jsonb DEFAULT '{}', -- Empty for manual lines
  -- ... other fields
);
```

### **Frontend Hook Integration**
The `useScriptEditor` hook handles both pathways seamlessly:

```javascript
// Works for both AI-generated and manual scripts
const {
  lines,
  characters,
  script,
  isNewScript,
  
  // CRUD operations (both pathways)
  updateLine,
  addLine,
  deleteLine,
  
  // Manual creation functions
  createNewScript,
  createCharacter,
  
  // AI integration functions
  getLinePreview,
  
  // Universal functions
  calculateCredits
} = useScriptEditor(scriptId); // NULL for new manual scripts
```

## 🎨 **User Interface Design**

### **Script Creation Entry Points**

#### **Option 1: AI Import**
```jsx
<div className="creation-option ai-import">
  <h3>Import from Fanfiction</h3>
  <p>AI will analyze and convert your story into a professional script</p>
  <input 
    type="url" 
    placeholder="Paste AO3, Wattpad, or other fanfiction URL"
    onChange={handleUrlInput}
  />
  <button onClick={startAIGeneration}>
    Generate Script with AI
  </button>
</div>
```

#### **Option 2: Manual Creation**
```jsx
<div className="creation-option manual-creation">
  <h3>Create from Scratch</h3>
  <p>Build your script line by line with full creative control</p>
  <input 
    type="text" 
    placeholder="Script title"
    onChange={handleTitleInput}
  />
  <button onClick={startManualCreation}>
    Start Writing
  </button>
</div>
```

### **Unified Script Editor Interface**
Both pathways lead to the same professional editing experience:

```jsx
const ScriptEditor = ({ scriptId }) => {
  const {
    lines,
    characters,
    isNewScript,
    updateLine,
    addLine,
    deleteLine,
    createCharacter
  } = useScriptEditor(scriptId);

  return (
    <div className="script-editor">
      {/* Universal toolbar */}
      <ScriptToolbar 
        onAddLine={addLine}
        onCreateCharacter={createCharacter}
        characters={characters}
      />
      
      {/* Script lines with AI/manual indicators */}
      {lines.map(line => (
        <ScriptLine
          key={line.id}
          line={line}
          characters={characters}
          aiGenerated={line.ai_generated}
          confidence={line.ai_confidence}
          onUpdate={(updates) => updateLine(line.id, updates)}
          onDelete={() => deleteLine(line.id)}
        />
      ))}
      
      {/* Add new line button (always available) */}
      <AddLineButton onClick={() => addLine()} />
    </div>
  );
};
```

### **Visual Indicators for Content Source**
```css
/* AI-generated content indicators */
.script-line.ai-generated {
  border-left: 4px solid #3b82f6; /* Blue for AI */
}

.script-line.ai-generated.needs-review {
  background-color: #fef3c7; /* Yellow highlight */
}

.script-line.ai-generated.high-confidence {
  border-left-color: #10b981; /* Green for high confidence */
}

.script-line.ai-generated.low-confidence {
  border-left-color: #ef4444; /* Red for low confidence */
}

/* Manual content indicators */
.script-line.manual {
  border-left: 4px solid #8b5cf6; /* Purple for manual */
}

/* Hybrid content (edited AI) */
.script-line.ai-generated.human-modified {
  border-left: 4px solid #f59e0b; /* Orange for hybrid */
}
```

## 🔄 **Workflow Implementation**

### **AI Import Workflow**
```javascript
const handleAIImport = async (sourceUrl) => {
  try {
    // 1. Trigger AI generation
    const result = await aiScriptGeneration.generateScriptFromUrl({
      sourceUrl,
      storyId: currentStory.id,
      userId: currentUser.id,
      preferences: userPreferences
    });
    
    // 2. Navigate to review interface
    navigate(`/script-editor/${result.script_id}`);
    
    // 3. useScriptEditor automatically loads AI-generated content
    // 4. User reviews and edits with full editing capabilities
  } catch (error) {
    console.error('AI import failed:', error);
  }
};
```

### **Manual Creation Workflow**
```javascript
const handleManualCreation = async (scriptTitle) => {
  try {
    // 1. Create new story and script
    const story = await db.createStory({
      user_id: currentUser.id,
      title: scriptTitle,
      source_type: 'original'
    });
    
    const script = await db.createScript({
      story_id: story.id,
      title: scriptTitle,
      generation_method: 'manual'
    });
    
    // 2. Navigate to empty editor
    navigate(`/script-editor/${script.id}`);
    
    // 3. useScriptEditor initializes empty state
    // 4. User creates content with full editing capabilities
  } catch (error) {
    console.error('Manual creation failed:', error);
  }
};
```

### **Character Management (Both Pathways)**
```javascript
// AI pathway: Characters auto-detected, user can edit/add more
const aiCharacters = [
  { name: 'Sarah Chen', voice_id: 'female_1', ai_detected: true },
  { name: 'Dr. Martinez', voice_id: 'male_1', ai_detected: true }
];

// Manual pathway: User creates all characters
const manualCharacters = [
  { name: 'Hero', voice_id: 'female_2', user_created: true },
  { name: 'Villain', voice_id: 'male_2', user_created: true }
];

// Both use same interface for editing
const CharacterEditor = ({ character, onChange }) => (
  <div className="character-editor">
    <input 
      value={character.name}
      onChange={(e) => onChange({ ...character, name: e.target.value })}
    />
    <VoiceSelector 
      value={character.voice_id}
      onChange={(voice) => onChange({ ...character, voice_id: voice })}
    />
    <EmotionSelector 
      value={character.default_emotion}
      onChange={(emotion) => onChange({ ...character, default_emotion: emotion })}
    />
  </div>
);
```

## 📊 **Analytics & Tracking**

### **Creation Method Analytics**
```javascript
const trackScriptCreation = (method, metadata) => {
  analytics.track('script_created', {
    creation_method: method, // 'ai_import', 'manual', 'hybrid'
    source_type: metadata.source_type,
    character_count: metadata.character_count,
    line_count: metadata.line_count,
    ai_confidence_avg: metadata.ai_confidence_avg, // NULL for manual
    review_time_seconds: metadata.review_time_seconds
  });
};
```

### **Quality Metrics**
```javascript
const qualityMetrics = {
  ai_import: {
    lines_accepted_unchanged: 0.75, // 75% of AI lines kept as-is
    lines_modified: 0.20, // 20% edited
    lines_deleted: 0.05, // 5% removed
    avg_confidence_accepted: 0.85
  },
  manual: {
    avg_lines_per_session: 25,
    avg_creation_time_per_line: 45, // seconds
    character_assignments_changed: 0.10
  }
};
```

## 🎯 **User Experience Flow**

### **New User Onboarding**
1. **Choice Presentation**: Clear options for AI import vs manual creation
2. **Guided Tutorial**: Different tutorials for each pathway
3. **Template Gallery**: Sample scripts showing both creation methods
4. **Progressive Disclosure**: Advanced features revealed as users gain experience

### **Power User Features**
1. **Batch Operations**: Select multiple lines for bulk editing
2. **AI Suggestions**: Manual scripts can request AI suggestions for specific lines
3. **Template Creation**: Save manual scripts as templates
4. **Import/Export**: Move between AI and manual workflows

### **Quality Assurance**
1. **Confidence Scoring**: Visual indicators for AI content quality
2. **Review Checklist**: Ensure all lines have proper character/emotion assignments
3. **Preview System**: Test individual lines before full generation
4. **Version History**: Track changes between AI original and human edits

---

**This dual pathway architecture ensures FanCast AI serves both users who want AI assistance and those who prefer complete creative control, all within the same professional editing environment! 🎭✨**
