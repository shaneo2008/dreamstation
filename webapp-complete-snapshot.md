# FanCast AI - Complete WebApp Snapshot

**Version:** 2.0  
**Date:** January 2025  
**Purpose:** Complete documentation for React Native recreation

---

## 🎯 Project Overview

### Application Name & Purpose
**FanCast AI** - Transform fanfiction into immersive, multi-character audio drama using advanced AI voice synthesis.

### Main Features & Functionality
- **Creator Studio**: Professional script generation and editing tools
- **Script Editor Interface**: Line-by-line editing with TTS annotations
- **Multi-Character Voice Synthesis**: Individual voice assignment per character
- **Audio Player**: Seamless playback with script synchronization
- **Dual User Tiers**: Listener ($9.99/month) vs Creator (pay-per-creation)
- **Real-Time Generation**: AI-powered script creation with loading states
- **Voice Assignment Panel**: Character-to-voice mapping with Cartesia TTS
- **Audio Preview**: Individual line preview and full script generation

### Technology Stack
- **Frontend**: React 19.1.0 + Vite 6.3.5
- **Styling**: Tailwind CSS 4.1.7 with custom gradient system
- **Database**: Supabase (PostgreSQL with real-time subscriptions)
- **Authentication**: Supabase Auth with email/password
- **Voice Synthesis**: Cartesia TTS API integration
- **Backend**: n8n workflows for AI processing and TTS generation
- **State Management**: React useState with prop drilling
- **Icons**: Lucide React
- **Build Tool**: Vite with React plugin

---

## 📁 File Structure

```
fancastaiv2/
├── public/                          # Static assets
├── src/
│   ├── App.jsx                      # Main application component
│   ├── App.css                      # Global styles (unused)
│   ├── index.css                    # Tailwind imports + custom gradients
│   ├── main.jsx                     # Application entry point
│   ├── components/
│   │   ├── AIGenerationForm.jsx     # Legacy component (unused)
│   │   ├── Auth.jsx                 # Authentication component
│   │   ├── AuthenticatedApp.jsx     # Main authenticated app wrapper
│   │   ├── OptimizedCreateScreen.jsx # Story creation with templates
│   │   ├── ScriptEditorScreen.jsx   # Professional script editor
│   │   ├── StreamlinedCreateScreen.jsx # Alternative creation screen
│   │   ├── VoiceAssignmentPanel.jsx # Character voice management
│   │   ├── AudioPlayer/
│   │   │   ├── AudioPlayer.jsx      # Full-featured audio player
│   │   │   ├── AudioPlayerWithSync.jsx # Script-synced player
│   │   │   ├── ScriptSync.jsx       # Script synchronization logic
│   │   │   ├── SimpleAudioPlayer.jsx # Basic audio playback
│   │   │   └── index.js             # Audio player exports
│   │   └── ui/                      # Shadcn/ui components (42 components)
│   ├── contexts/
│   │   └── AuthContext.jsx          # Supabase authentication context
│   ├── hooks/
│   │   ├── use-mobile.js            # Mobile detection hook
│   │   ├── useAudioPlayer.js        # Audio player state management
│   │   └── useScriptEditor.js       # Script editor functionality
│   ├── lib/
│   │   ├── aiScriptGeneration.js    # AI script generation API
│   │   ├── supabase.js              # Database client and helpers
│   │   └── utils.js                 # Utility functions
│   ├── services/
│   │   ├── cartesiaVoiceService.js  # Voice library and assignments
│   │   ├── demoAudioService.js      # Demo audio generation
│   │   ├── fullScriptTTSService.js  # Full script TTS integration
│   │   ├── linePreviewService.js    # Individual line preview
│   │   └── scriptSaveService.js     # Script database operations
│   └── config/
│       ├── aiGenerationConfig.js    # AI generation configuration
│       └── tokenOptimizedConfig.js  # Token optimization settings
├── lambda-audio-concatenation/      # AWS Lambda for audio processing
├── docs/                           # Documentation
├── package.json                    # Dependencies and scripts
├── vite.config.js                  # Vite configuration
└── README.md                       # Project documentation
```

---

## 🧩 Detailed Component Breakdown

### Core Application Components

#### `App.jsx` - Main Application (800 lines)
**Purpose**: Primary application component with tab navigation and state management
**Key Functions**:
- `switchTier(tier)` - Toggle between listener/creator tiers
- `updateScriptLine(lineId, field, value)` - Update script line content
- `handleStreamlinedGenerate(payload)` - Process story generation requests
- `calculateCredits()` - Calculate generation costs

**Props/State**:
- `activeTab`: 'discover' | 'create' | 'library' | 'account'
- `userTier`: 'listener' | 'creator'
- `scriptLines`: Array of script line objects
- `isGenerating`: Boolean for loading states

#### `OptimizedCreateScreen.jsx` - Story Creation (361 lines)
**Purpose**: Professional story creation interface with quickstart templates
**Key Functions**:
- `generateUUID()` - RFC 4122 compliant UUID generation (CRITICAL FIX)
- `handleTemplateSelect(templateKey)` - Apply quickstart templates
- `handleGenerate()` - Trigger AI script generation

**Props**:
- `onBack`: Function to return to previous screen
- `onGenerate`: Function to handle generation payload
- `isGenerating`: Boolean for loading state

**Templates**: 6 quickstart templates (Adventure, Friendship, Magic School, etc.)

#### `ScriptEditorScreen.jsx` - Professional Script Editor (579 lines)
**Purpose**: Line-by-line script editing with voice assignments and audio generation
**Key Functions**:
- `updateScriptLine(lineId, field, value)` - Edit script content
- `handleLinePreview(line)` - Generate individual line audio preview
- `generateFullAudio()` - Create complete audio production
- `saveScript()` - Persist script to database

**Props**:
- `script`: Script object with lines and metadata
- `user`: Authenticated user object
- `onBack`: Navigation function
- `onSave`: Save callback
- `onScriptUpdate`: Refresh callback

#### `VoiceAssignmentPanel.jsx` - Voice Management
**Purpose**: Character-to-voice mapping interface with Cartesia TTS integration
**Key Functions**:
- Voice assignment per character
- Auto-assignment based on character analysis
- Voice preview functionality
- Database persistence

### Authentication & Context

#### `AuthContext.jsx` - Authentication Provider (71 lines)
**Purpose**: Supabase authentication wrapper
**Functions**:
- `signUp(email, password)` - User registration
- `signIn(email, password)` - User login
- `signOut()` - User logout
- Auto session management

### Audio System

#### `SimpleAudioPlayer.jsx` - Audio Playback
**Purpose**: Basic audio player with script synchronization
**Features**:
- Play/pause controls
- Progress tracking
- Script line highlighting
- Timing metadata support

### Service Layer

#### `aiScriptGeneration.js` - AI Integration (357 lines)
**Purpose**: n8n workflow integration for AI script generation
**Key Functions**:
- `generateScriptFromUrl()` - Generate from fanfiction URLs
- `checkGenerationStatus()` - Monitor generation progress
- Enhanced payload with dynamic prompts and preferences

#### `cartesiaVoiceService.js` - Voice Management (582 lines)
**Purpose**: Cartesia TTS integration and voice library
**Voice Library**: 16 professional voices with metadata
**Functions**:
- `getVoiceAssignments()` - Retrieve saved voice mappings
- `saveVoiceAssignments()` - Persist voice assignments
- `autoAssignVoices()` - AI-powered voice assignment
- Character analysis and voice recommendations

#### `fullScriptTTSService.js` - Audio Generation (214 lines)
**Purpose**: Full script audio production via n8n workflows
**Functions**:
- `generateFullScriptTTS()` - Complete audio generation
- Voice assignment integration
- Error handling with fallback to demo

---

## 🔄 State Management & Data Flow

### Authentication Flow
1. `AuthContext` manages Supabase session
2. `AuthenticatedApp` wraps main application
3. User object passed to all components requiring auth

### Script Generation Flow
1. User creates story in `OptimizedCreateScreen`
2. Payload sent to n8n AI generation workflow
3. Generated script loaded in `ScriptEditorScreen`
4. User edits lines and assigns voices
5. Full audio generation via `fullScriptTTSService`

### Data Models
```typescript
// User Object
{
  id: string (UUID),
  email: string,
  credits?: number
}

// Script Object
{
  id: string (UUID),
  title: string,
  lines: ScriptLine[],
  metadata: {
    charactersCount: number,
    dialogueCount: number,
    narrationCount: number,
    totalLines: number,
    generatedAt: string
  },
  audioUrl?: string,
  autoPlayAudio?: boolean
}

// Script Line Object
{
  id: string (UUID),
  speaker: string,
  text: string,
  type: 'dialogue' | 'narration',
  emotion: string,
  voice?: string,
  annotations?: string[]
}

// Voice Assignment Object
{
  script_id: string,
  character_name: string,
  cartesia_voice_id: string,
  voice_name: string,
  voice_settings: object,
  emotion_mappings: object
}
```

---

## 🔌 API Integrations & Business Logic

### n8n Workflow Endpoints
- **AI Script Generation**: `VITE_N8N_AI_SCRIPT_GENERATION_WEBHOOK`
- **Full Script TTS**: `VITE_N8N_FULL_SCRIPT_TTS_WEBHOOK`
- **Line Preview**: `VITE_N8N_LINE_PREVIEW_WEBHOOK`
- **Voice Assignments**: `VITE_N8N_SAVE_VOICE_ASSIGNMENTS_WEBHOOK`
- **Auto Voice Assignment**: `VITE_N8N_AUTO_ASSIGN_VOICES_WEBHOOK`

### Supabase Database Schema
**Tables**:
- `users` - User profiles and credits
- `stories` - Story metadata
- `scripts` - Generated scripts
- `script_lines` - Individual script lines
- `characters` - Character definitions
- `voice_assignments` - Character-to-voice mappings
- `audio_previews` - Generated audio files
- `credit_transactions` - Payment tracking

### Critical Business Rules
1. **UUID Generation**: Must use RFC 4122 format for Supabase compatibility
2. **Script Length**: 130-140 lines for 10-minute episodes (75-85 dialogue, 55-60 narration)
3. **Field Mapping**: Use `speaker`/`type` not `speaker_name`/`line_type` for consistency
4. **Voice Assignments**: Default to William (e00d0e4c-a5c8-443f-a8a3-473eb9a62355) for unassigned characters
5. **Credit System**: 1 credit per generation, $5 per 30 minutes for creators

---

## 🎨 Styling & UI Patterns

### Design System
- **Primary Colors**: Teal (#14b8a6) to Orange (#f97316) gradient
- **Background**: Slate-900 to Slate-800 gradient
- **Typography**: System fonts with gradient text effects
- **Components**: Shadcn/ui with custom Tailwind styling

### Key CSS Classes
```css
.gradient-text {
  background: linear-gradient(135deg, #14b8a6 0%, #f97316 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.animate-fade-in {
  animation: fadeIn 0.6s ease-in-out;
}
```

### Responsive Design
- Mobile-first approach
- Bottom tab navigation for mobile
- Responsive grid layouts
- Touch-optimized controls

---

## 📦 Dependencies & Configuration

### Core Dependencies (package.json)
```json
{
  "react": "^19.1.0",
  "react-dom": "^19.1.0",
  "react-router-dom": "^7.6.1",
  "@supabase/supabase-js": "^2.52.1",
  "tailwindcss": "^4.1.7",
  "@tailwindcss/vite": "^4.1.7",
  "lucide-react": "^0.510.0",
  "framer-motion": "^12.15.0",
  "react-hook-form": "^7.56.3",
  "zod": "^3.24.4"
}
```

### Build Configuration (vite.config.js)
```javascript
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
```

### Environment Variables Required
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_N8N_AI_SCRIPT_GENERATION_WEBHOOK=webhook_url
VITE_N8N_FULL_SCRIPT_TTS_WEBHOOK=webhook_url
VITE_N8N_LINE_PREVIEW_WEBHOOK=webhook_url
VITE_N8N_SAVE_VOICE_ASSIGNMENTS_WEBHOOK=webhook_url
VITE_N8N_AUTO_ASSIGN_VOICES_WEBHOOK=webhook_url
```

---

## 🔄 Recent Changes & Critical Fixes

### UUID Generation Fix (CRITICAL)
- **Issue**: Frontend generated invalid UUIDs like "story-1756328100132"
- **Fix**: Implemented RFC 4122 compliant `generateUUID()` function
- **Location**: `OptimizedCreateScreen.jsx` lines 118-124
- **Impact**: Resolves Supabase "invalid input syntax for type uuid" errors

### Script Length Optimization
- **Issue**: Gemini AI generating 33 lines instead of 75-85 for 10-minute episodes
- **Fix**: Added `scriptLengthRequirement` to payload: "Generate exactly 130-140 script lines"
- **Location**: `OptimizedCreateScreen.jsx` line 139
- **Impact**: Ensures proper episode timing

### Field Mapping Consistency
- **Issue**: Gemini workflow uses `speaker_name`/`line_type` vs expected `speaker`/`type`
- **Fix**: Normalization in `ScriptEditorScreen.jsx` lines 30-37
- **Impact**: Maintains compatibility between AI workflows

---

## 💻 Critical Code Snippets

### UUID Generation Function
```javascript
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};
```

### Script Line Normalization
```javascript
const normalizedLines = script.lines.map(line => ({
  id: line.id,
  speaker: line.speaker || line.speaker_name || 'Narrator',
  text: line.text || line.text_content || '',
  type: line.type || line.line_type || 'dialogue',
  emotion: line.emotion || line.emotion_type || 'neutral',
  voice: line.voice || 'default'
}));
```

### Voice Assignment Integration
```javascript
const assignedVoiceId = voiceAssignments[speaker] || 'e00d0e4c-a5c8-443f-a8a3-473eb9a62355'; // Default to William
```

---

## 🚀 Deployment & Production Notes

### Build Process
```bash
npm run build    # Production build
npm run preview  # Preview production build
npm run dev      # Development server
```

### Key Production Considerations
1. **Environment Variables**: All n8n webhooks must be configured
2. **Supabase Setup**: Database schema and RLS policies required
3. **Cartesia API**: Voice synthesis service integration
4. **Audio Storage**: S3 bucket for generated audio files
5. **CORS Configuration**: n8n workflows need proper CORS headers

### Performance Optimizations
- Lazy loading for audio components
- Debounced script editing
- Optimized re-renders with React.memo
- Efficient state updates

---

## 📱 React Native Migration Notes

### Key Considerations for Mobile
1. **Navigation**: Replace bottom tabs with React Navigation
2. **Audio Player**: Use react-native-sound or expo-av
3. **File Storage**: AsyncStorage for local data
4. **Network**: Axios or fetch for API calls
5. **Authentication**: Supabase React Native SDK
6. **Styling**: React Native StyleSheet with similar color scheme
7. **Voice Recording**: react-native-audio-recorder-player for previews
8. **Real-time**: Supabase real-time subscriptions work on mobile

### Components Requiring Mobile Adaptation
- `SimpleAudioPlayer` → Native audio controls
- `ScriptEditorScreen` → Mobile-optimized text editing
- `VoiceAssignmentPanel` → Touch-friendly interface
- Bottom navigation → React Navigation tabs
- Modals → Native modal components

This documentation provides the complete blueprint for recreating FanCast AI in React Native while maintaining all core functionality and business logic.
