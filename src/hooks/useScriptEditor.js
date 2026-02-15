import { useState, useEffect, useCallback } from 'react'
import { db, subscriptions } from '../lib/supabase'
import { v4 as uuidv4 } from 'uuid'

export const useScriptEditor = (scriptId) => {
  const [lines, setLines] = useState([])
  const [characters, setCharacters] = useState([])
  const [script, setScript] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [isNewScript, setIsNewScript] = useState(!scriptId)

  // Load script data on mount or initialize new script
  useEffect(() => {
    const initializeScript = async () => {
      try {
        setLoading(true)
        setError(null)

        if (scriptId) {
          // Load existing script (AI-generated or previously created)
          const [scriptData, scriptLines, storyCharacters] = await Promise.all([
            db.getScript(scriptId),
            db.getScriptLines(scriptId),
            db.getStoryCharacters(scriptData?.story?.id)
          ])

          setScript(scriptData)
          setLines(scriptLines)
          setCharacters(storyCharacters)
          setIsNewScript(false)
        } else {
          // Initialize new manual script
          setScript(null)
          setLines([])
          setCharacters([])
          setIsNewScript(true)
        }
      } catch (err) {
        console.error('Error initializing script:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    initializeScript()
  }, [scriptId])

  // Set up real-time subscription for script lines
  useEffect(() => {
    if (!scriptId) return

    const subscription = subscriptions.subscribeToScriptLines(scriptId, (payload) => {
      const { eventType, new: newRecord, old: oldRecord } = payload

      setLines(currentLines => {
        switch (eventType) {
          case 'INSERT':
            return [...currentLines, newRecord].sort((a, b) => a.line_number - b.line_number)
          
          case 'UPDATE':
            return currentLines.map(line => 
              line.id === newRecord.id ? newRecord : line
            )
          
          case 'DELETE':
            return currentLines.filter(line => line.id !== oldRecord.id)
          
          default:
            return currentLines
        }
      })
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [scriptId])

  // Debounced save function
  const debouncedSave = useCallback(
    (() => {
      let timeout
      return (lineId, updates) => {
        clearTimeout(timeout)
        timeout = setTimeout(async () => {
          try {
            setSaving(true)
            await db.updateScriptLine(lineId, updates)
          } catch (err) {
            console.error('Error saving line:', err)
            setError(err.message)
          } finally {
            setSaving(false)
          }
        }, 1000)
      }
    })(),
    []
  )

  // Update a script line
  const updateLine = useCallback(async (lineId, updates) => {
    // Optimistic update
    setLines(prevLines => 
      prevLines.map(line => 
        line.id === lineId 
          ? { ...line, ...updates, updated_at: new Date().toISOString() }
          : line
      )
    )

    // Debounced save to database
    debouncedSave(lineId, updates)
  }, [debouncedSave])

  // Add a new script line
  const addLine = useCallback(async (afterLineNumber = null) => {
    try {
      const newLineNumber = afterLineNumber !== null 
        ? afterLineNumber + 1 
        : lines.length + 1

      // Shift existing line numbers if inserting in middle
      if (afterLineNumber !== null) {
        const linesToUpdate = lines.filter(line => line.line_number >= newLineNumber)
        for (const line of linesToUpdate) {
          await db.updateScriptLine(line.id, { line_number: line.line_number + 1 })
        }
      }

      const newLine = {
        id: uuidv4(),
        script_id: scriptId,
        line_number: newLineNumber,
        line_type: 'dialogue',
        text_content: '',
        emotion_type: 'neutral',
        emotion_intensity: 'medium',
        speaker_name: 'Character',
        character_id: null,
        voice_settings: {},
        tts_annotations: {}
      }

      const createdLine = await db.createScriptLine(newLine)
      return createdLine
    } catch (err) {
      console.error('Error adding line:', err)
      setError(err.message)
      throw err
    }
  }, [scriptId, lines])

  // Delete a script line
  const deleteLine = useCallback(async (lineId) => {
    try {
      const lineToDelete = lines.find(line => line.id === lineId)
      if (!lineToDelete) return

      await db.deleteScriptLine(lineId)

      // Shift remaining line numbers down
      const linesToUpdate = lines.filter(line => line.line_number > lineToDelete.line_number)
      for (const line of linesToUpdate) {
        await db.updateScriptLine(line.id, { line_number: line.line_number - 1 })
      }
    } catch (err) {
      console.error('Error deleting line:', err)
      setError(err.message)
      throw err
    }
  }, [lines])

  // Calculate estimated credits required
  const calculateCredits = useCallback(() => {
    const totalCharacters = lines.reduce((sum, line) => 
      sum + (line.text_content?.length || 0), 0
    )
    const estimatedMinutes = Math.ceil(totalCharacters / 1000) // ~1000 chars per minute
    const episodeCount = Math.ceil(estimatedMinutes / 30) // 30 min episodes
    
    return {
      estimated_minutes: estimatedMinutes,
      episode_count: episodeCount,
      credits_required: episodeCount,
      cost_dollars: episodeCount * 5
    }
  }, [lines])

  // Get line preview (check cache first)
  const getLinePreview = useCallback(async (lineId) => {
    try {
      const line = lines.find(l => l.id === lineId)
      if (!line) throw new Error('Line not found')

      // Check if we already have a cached preview
      const existingPreview = await db.getLinePreview(lineId)
      if (existingPreview) {
        return existingPreview.audio_url
      }

      // Generate new preview via n8n webhook
      const webhookUrl = import.meta.env.VITE_N8N_LINE_PREVIEW_WEBHOOK
      if (!webhookUrl) {
        throw new Error('Line preview webhook not configured')
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script_line_id: lineId,
          character_voice: line.character?.voice_id || 'default',
          emotion: line.emotion_type,
          intensity: line.emotion_intensity,
          text: line.text_content,
          voice_settings: line.voice_settings
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate preview')
      }

      const result = await response.json()
      return result.audio_url
    } catch (err) {
      console.error('Error getting line preview:', err)
      setError(err.message)
      throw err
    }
  }, [lines])

  // Create new script (for manual creation)
  const createNewScript = useCallback(async (storyId, scriptData) => {
    try {
      const newScript = await db.createScript({
        story_id: storyId,
        title: scriptData.title || 'Untitled Script',
        episode_number: scriptData.episode_number || 1,
        status: 'draft',
        generation_method: 'manual'
      })
      
      setScript(newScript)
      setIsNewScript(false)
      return newScript
    } catch (err) {
      console.error('Error creating new script:', err)
      setError(err.message)
      throw err
    }
  }, [])

  // Create new character (for manual creation)
  const createCharacter = useCallback(async (characterData) => {
    try {
      if (!script?.story?.id) {
        throw new Error('Story ID required to create character')
      }

      const newCharacter = await db.createCharacter({
        story_id: script.story.id,
        name: characterData.name,
        description: characterData.description || '',
        voice_id: characterData.voice_id || 'default',
        default_emotion: characterData.default_emotion || 'neutral'
      })
      
      setCharacters(prev => [...prev, newCharacter])
      return newCharacter
    } catch (err) {
      console.error('Error creating character:', err)
      setError(err.message)
      throw err
    }
  }, [script?.story?.id])

  return {
    // State
    lines,
    characters,
    script,
    loading,
    saving,
    error,
    isNewScript,

    // Actions
    updateLine,
    addLine,
    deleteLine,
    getLinePreview,
    calculateCredits,
    createNewScript,
    createCharacter,

    // Computed values
    totalLines: lines.length,
    isComplete: lines.every(line => line.text_content?.trim() && line.character_id),
    ...calculateCredits()
  }
}

// Debounce functionality is now handled inline in the useCallback
