import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Database table helpers
export const tables = {
  users: 'users',
  stories: 'stories', 
  characters: 'characters',
  scripts: 'scripts',
  script_lines: 'script_lines',
  episodes: 'episodes',
  credit_transactions: 'credit_transactions',
  audio_previews: 'audio_previews',
  // Full Programme tables
  child_profiles: 'child_profiles',
  child_dynamic_context: 'child_dynamic_context',
  story_sessions: 'story_sessions',
  clinical_baselines: 'clinical_baselines',
  morning_reactions: 'morning_reactions',
  weekly_briefs: 'weekly_briefs',
  notification_preferences: 'notification_preferences'
}

// Helper functions for common database operations
export const db = {
  // User operations
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  },

  async getUserProfile(userId) {
    const { data, error } = await supabase
      .from(tables.users)
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) throw error
    return data
  },

  // Story operations
  async getUserStories(userId) {
    const { data, error } = await supabase
      .from(tables.stories)
      .select(`
        *,
        scripts (
          id,
          title,
          episode_number,
          status,
          total_lines
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async createStory(storyData) {
    const { data, error } = await supabase
      .from(tables.stories)
      .insert([storyData])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Script operations
  async getScript(scriptId) {
    const { data, error } = await supabase
      .from(tables.scripts)
      .select(`
        *,
        story:stories(*),
        script_lines(
          *,
          character:characters(*)
        )
      `)
      .eq('id', scriptId)
      .single()
    
    if (error) throw error
    return data
  },

  async createScript(scriptData) {
    const { data, error } = await supabase
      .from(tables.scripts)
      .insert([scriptData])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Character operations
  async getStoryCharacters(storyId) {
    const { data, error } = await supabase
      .from(tables.characters)
      .select('*')
      .eq('story_id', storyId)
      .order('name')
    
    if (error) throw error
    return data
  },

  async createCharacter(characterData) {
    const { data, error } = await supabase
      .from(tables.characters)
      .insert([characterData])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Script line operations
  async getScriptLines(scriptId) {
    const { data, error } = await supabase
      .from(tables.script_lines)
      .select(`
        *,
        character:characters(*)
      `)
      .eq('script_id', scriptId)
      .order('line_number')
    
    if (error) throw error
    return data
  },

  async createScriptLine(lineData) {
    const { data, error } = await supabase
      .from(tables.script_lines)
      .insert([lineData])
      .select(`
        *,
        character:characters(*)
      `)
      .single()
    
    if (error) throw error
    return data
  },

  async updateScriptLine(lineId, updates) {
    const { data, error } = await supabase
      .from(tables.script_lines)
      .update(updates)
      .eq('id', lineId)
      .select(`
        *,
        character:characters(*)
      `)
      .single()
    
    if (error) throw error
    return data
  },

  async deleteScriptLine(lineId) {
    const { error } = await supabase
      .from(tables.script_lines)
      .delete()
      .eq('id', lineId)
    
    if (error) throw error
  },

  // Credit operations
  async getUserCredits(userId) {
    const { data, error } = await supabase
      .from(tables.users)
      .select('credits')
      .eq('id', userId)
      .single()
    
    if (error) throw error
    return data.credits
  },

  async createCreditTransaction(transactionData) {
    const { data, error } = await supabase
      .from(tables.credit_transactions)
      .insert([transactionData])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Audio preview operations
  async createAudioPreview(previewData) {
    const { data, error } = await supabase
      .from(tables.audio_previews)
      .insert([previewData])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getLinePreview(scriptLineId) {
    const { data, error } = await supabase
      .from(tables.audio_previews)
      .select('*')
      .eq('script_line_id', scriptLineId)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    
    if (error) throw error
    return data
  },

  // ── Full Programme: Child Profile operations ──

  async getChildProfiles(userId) {
    const { data, error } = await supabase
      .from(tables.child_profiles)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async getChildProfile(childId) {
    const { data, error } = await supabase
      .from(tables.child_profiles)
      .select('*')
      .eq('id', childId)
      .single()
    
    if (error) throw error
    return data
  },

  async createChildProfile(profileData) {
    const { data, error } = await supabase
      .from(tables.child_profiles)
      .insert([profileData])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateChildProfile(childId, updates) {
    const { data, error } = await supabase
      .from(tables.child_profiles)
      .update(updates)
      .eq('id', childId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // ── Full Programme: Dynamic Context operations ──

  async getChildDynamicContext(childId) {
    const { data, error } = await supabase
      .from(tables.child_dynamic_context)
      .select('*')
      .eq('child_id', childId)
      .single()
    
    if (error) throw error
    return data
  },

  async updateChildDynamicContext(childId, updates) {
    const { data, error } = await supabase
      .from(tables.child_dynamic_context)
      .update(updates)
      .eq('child_id', childId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // ── Full Programme: Child profile + context combined fetch ──

  async getFullChildProfile(childId) {
    const { data, error } = await supabase
      .from(tables.child_profiles)
      .select(`
        *,
        child_dynamic_context (*)
      `)
      .eq('id', childId)
      .single()
    
    if (error) throw error
    return data
  },

  // ── Full Programme: Story Session operations ──

  async createStorySession(sessionData) {
    const { data, error } = await supabase
      .from(tables.story_sessions)
      .insert([sessionData])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateStorySession(sessionId, updates) {
    const { data, error } = await supabase
      .from(tables.story_sessions)
      .update(updates)
      .eq('id', sessionId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getRecentSessions(childId, limit = 6) {
    const { data, error } = await supabase
      .from(tables.story_sessions)
      .select('*')
      .eq('child_id', childId)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data
  },

  // ── Full Programme: Clinical Baseline operations ──

  async createClinicalBaseline(baselineData) {
    const { data, error } = await supabase
      .from(tables.clinical_baselines)
      .insert([baselineData])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getClinicalBaselines(childId) {
    const { data, error } = await supabase
      .from(tables.clinical_baselines)
      .select('*')
      .eq('child_id', childId)
      .order('captured_at', { ascending: true })
    
    if (error) throw error
    return data
  },

  // ── Full Programme: Morning Reactions operations ──

  async getMorningReaction(sessionId) {
    const { data, error } = await supabase
      .from(tables.morning_reactions)
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle()
    
    if (error) throw error
    return data
  },

  async getRecentMorningReactions(childId, limit = 7) {
    const { data, error } = await supabase
      .from(tables.morning_reactions)
      .select('*')
      .eq('child_id', childId)
      .order('generated_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data
  },

  async updateMorningReaction(reactionId, updates) {
    const { data, error } = await supabase
      .from(tables.morning_reactions)
      .update(updates)
      .eq('id', reactionId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // ── Full Programme: Weekly Brief operations ──

  async getWeeklyBriefs(childId) {
    const { data, error } = await supabase
      .from(tables.weekly_briefs)
      .select('*')
      .eq('child_id', childId)
      .order('week_start_date', { ascending: false })
    
    if (error) throw error
    return data
  },

  async markBriefRead(briefId) {
    const { data, error } = await supabase
      .from(tables.weekly_briefs)
      .update({ read_at: new Date().toISOString() })
      .eq('id', briefId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // ── Full Programme: Notification Preferences operations ──

  async getNotificationPreferences(userId, childId) {
    const { data, error } = await supabase
      .from(tables.notification_preferences)
      .select('*')
      .eq('user_id', userId)
      .eq('child_id', childId)
      .single()
    
    if (error) throw error
    return data
  },

  async updateNotificationPreferences(userId, childId, updates) {
    const { data, error } = await supabase
      .from(tables.notification_preferences)
      .update(updates)
      .eq('user_id', userId)
      .eq('child_id', childId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

// Real-time subscriptions helper
export const subscriptions = {
  subscribeToScriptLines(scriptId, callback) {
    return supabase
      .channel(`script_lines:${scriptId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'script_lines',
          filter: `script_id=eq.${scriptId}`
        }, 
        callback
      )
      .subscribe()
  },

  subscribeToUserCredits(userId, callback) {
    return supabase
      .channel(`user_credits:${userId}`)
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${userId}`
        },
        callback
      )
      .subscribe()
  }
}
