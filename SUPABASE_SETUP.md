# FanCast AI v2 - Supabase Database Setup Guide

## 🚀 Quick Setup Steps

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign in/up
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `fancastai` (your existing project)
   - **Database Password**: Use your existing password
   - **Region**: Your current region
5. Click "Create new project"

### 2. Deploy Database Schema
1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy and paste the entire contents of `supabase-schema.sql`
4. Click "Run" to execute the schema
5. Verify tables were created in **Table Editor**

### 3. Configure Environment Variables
1. In Supabase dashboard, go to **Settings** → **API**
2. Copy your project URL and anon key
3. Update your `.env` file:

```env
VITE_SUPABASE_URL=https://fancastai.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Test Database Connection
Run your React app to test the connection:
```bash
npm run dev
```

## 📊 Database Schema Overview

Your enhanced schema includes:

### Core Tables
- **`users`** - User profiles and credit balances
- **`stories`** - Story metadata and settings
- **`characters`** - Character voice assignments
- **`scripts`** - Script episodes
- **`script_lines`** - Line-by-line script content (CORE TABLE)
- **`episodes`** - Generated audio episodes
- **`credit_transactions`** - Credit purchases and usage
- **`audio_previews`** - Temporary line previews

### Key Features
- ✅ **Row Level Security (RLS)** - Users can only access their own data
- ✅ **Real-time subscriptions** - Live updates for script editing
- ✅ **Automatic timestamps** - Created/updated tracking
- ✅ **Line counting** - Automatic script and character line counts
- ✅ **Credit tracking** - Full transaction history

## 🔧 Integration with Your Script Editor

### Current App.jsx Integration
Your existing script editor in `App.jsx` can now be connected to Supabase using:

```javascript
import { useScriptEditor } from './hooks/useScriptEditor'

// In your component
const {
  lines,
  characters,
  updateLine,
  addLine,
  deleteLine,
  getLinePreview,
  loading,
  saving
} = useScriptEditor(scriptId)
```

### Key Benefits
1. **Real-time collaboration** - Multiple users can edit simultaneously
2. **Auto-save** - Changes are automatically saved with debouncing
3. **Line previews** - Individual line audio generation
4. **Character management** - Voice assignments persist
5. **Credit calculation** - Real-time cost estimation

## 🎯 Next Steps

### Phase 1: Connect Existing UI
1. Replace your current `scriptLines` state with `useScriptEditor` hook
2. Update your script editor UI to use database-backed data
3. Test line editing, character assignment, and emotion selection

### Phase 2: Add Authentication
1. Implement Supabase Auth in your app
2. Add user registration/login flow
3. Connect user profiles to script ownership

### Phase 3: n8n Integration
1. Set up n8n workflows for line preview generation
2. Connect audio generation pipeline
3. Implement credit deduction system

## 🔒 Security Notes

- **RLS Policies**: Users can only access their own stories and scripts
- **API Keys**: Only public keys are in frontend, sensitive keys stay in n8n
- **Data Validation**: Database constraints prevent invalid data
- **Audit Trail**: All changes are timestamped and tracked

## 🐛 Troubleshooting

### Common Issues
1. **Connection Error**: Check your environment variables
2. **RLS Errors**: Ensure user is authenticated before database calls
3. **Schema Errors**: Run the SQL schema again if tables are missing
4. **Real-time Issues**: Check if real-time is enabled in Supabase settings

### Testing Database
Use the Supabase dashboard's **Table Editor** to:
- View your data
- Test queries
- Monitor real-time changes
- Debug RLS policies

## 📱 Mobile Optimization

The schema is optimized for your mobile-first script editor:
- Efficient queries for line-by-line editing
- Minimal data transfer with selective loading
- Real-time updates for responsive editing
- Offline-ready with proper caching strategies

---

**Ready to connect your revolutionary script editor to a professional database! 🎬✨**
