import React, { useState, useEffect } from 'react'
import { ArrowLeft, Eye, HelpCircle, X as XIcon, ChevronDown, ChevronUp, MessageSquare, Check } from 'lucide-react'
import { db } from '../../lib/supabase'

const REACTION_ICONS = {
  noticed: { icon: Eye, label: 'Noticed', color: 'text-success' },
  not_sure: { icon: HelpCircle, label: 'Not sure', color: 'text-pastel-lavender' },
  didnt_see: { icon: XIcon, label: "Didn't see", color: 'text-sleep-400' },
}

export default function MorningReactionHistory({ childId, childName, onBack }) {
  const [reactions, setReactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)
  const [editingNoteId, setEditingNoteId] = useState(null)
  const [editingNoteText, setEditingNoteText] = useState('')
  const [savingNoteId, setSavingNoteId] = useState(null)

  const handleEditNote = (reaction) => {
    setEditingNoteId(reaction.id)
    setEditingNoteText(reaction.parent_note || '')
  }

  const handleSaveNote = async (reactionId) => {
    setSavingNoteId(reactionId)
    try {
      await db.updateMorningReaction(reactionId, {
        parent_note: editingNoteText.trim() || null,
      })
      setReactions(prev => prev.map(r =>
        r.id === reactionId ? { ...r, parent_note: editingNoteText.trim() || null } : r
      ))
      setEditingNoteId(null)
      setEditingNoteText('')
    } catch (err) {
      console.error('Failed to save parent note:', err)
    } finally {
      setSavingNoteId(null)
    }
  }

  useEffect(() => {
    const load = async () => {
      try {
        const data = await db.getRecentMorningReactions(childId, 30)
        setReactions(data || [])
      } catch (err) {
        console.error('Error loading morning reactions:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [childId])

  if (loading) {
    return (
      <div className="min-h-full px-5 py-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="p-2 text-sleep-500 hover:text-sleep-800 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-display font-bold text-sleep-900">Morning Reflections</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin text-2xl">⏳</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full px-5 py-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={onBack} className="p-2 text-sleep-500 hover:text-sleep-800 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-display font-bold text-sleep-900">Morning Reflections</h1>
          <p className="text-xs text-sleep-500 font-body">{childName}'s observation history</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto mt-4 space-y-3">
        {reactions.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm border-2 border-cream-300/50 rounded-3xl p-6 text-center shadow-card">
            <p className="text-sm text-sleep-500 font-body">No morning reflections yet. These appear the morning after a story night.</p>
          </div>
        ) : (
          reactions.map(reaction => {
            const isExpanded = expandedId === reaction.id
            return (
              <div key={reaction.id} className="bg-white/80 backdrop-blur-sm border-2 border-cream-300/50 rounded-2xl shadow-card overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : reaction.id)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-display font-semibold text-sleep-700">
                      {new Date(reaction.generated_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    {!isExpanded && (
                      <p className="text-xs text-sleep-400 font-body mt-0.5">
                        {(reaction.observations || []).length} observations
                        {reaction.skipped ? ' · Skipped' : ''}
                      </p>
                    )}
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-sleep-400 shrink-0 ml-2" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-sleep-400 shrink-0 ml-2" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4">
                    <div className="space-y-2.5">
                      {(reaction.observations || []).map((obs, i) => {
                        const reactionData = reaction.reactions?.[i]
                        const reactionValue = typeof reactionData === 'string' ? reactionData : reactionData?.reaction
                        const meta = REACTION_ICONS[reactionValue]

                        return (
                          <div key={i} className="flex gap-2.5">
                            <div className="shrink-0 mt-0.5">
                              {meta ? (
                                <meta.icon className={`w-3.5 h-3.5 ${meta.color}`} />
                              ) : (
                                <div className="w-3.5 h-3.5 rounded-full bg-cream-300" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="inline-block px-1.5 py-0.5 bg-cream-200/80 rounded text-[9px] font-display font-semibold text-sleep-500 capitalize mb-1">
                                {obs.type || 'observation'}
                              </span>
                              <p className="text-xs text-sleep-700 font-body leading-relaxed">{obs.text}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Parent note — editable */}
                    <div className="mt-3 pt-2 border-t border-cream-300/40">
                      {editingNoteId === reaction.id ? (
                        <div>
                          <textarea
                            value={editingNoteText}
                            onChange={(e) => setEditingNoteText(e.target.value.slice(0, 300))}
                            placeholder="Add your own thoughts about this night…"
                            rows={2}
                            className="w-full px-3 py-2 bg-cream-100/80 border-2 border-cream-300/60 rounded-xl text-xs text-sleep-900 placeholder-sleep-400 font-body resize-none focus:border-dream-glow/50 focus:outline-none transition-all"
                          />
                          <div className="flex items-center justify-between mt-1.5">
                            <span className="text-[10px] text-sleep-400 font-body">{editingNoteText.length}/300</span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => { setEditingNoteId(null); setEditingNoteText(''); }}
                                className="px-2.5 py-1 text-[10px] text-sleep-400 hover:text-sleep-600 font-display font-semibold transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveNote(reaction.id)}
                                disabled={savingNoteId === reaction.id}
                                className="flex items-center gap-1 px-2.5 py-1 bg-dream-glow hover:bg-dream-aurora text-white rounded-lg text-[10px] font-display font-semibold transition-all disabled:opacity-50"
                              >
                                <Check className="w-3 h-3" />
                                {savingNoteId === reaction.id ? 'Saving…' : 'Save'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : reaction.parent_note ? (
                        <button
                          onClick={() => handleEditNote(reaction)}
                          className="w-full text-left group"
                        >
                          <p className="text-[10px] text-sleep-400 font-body italic">"{reaction.parent_note}"</p>
                          <p className="text-[9px] text-sleep-300 font-body mt-0.5 group-hover:text-dream-glow transition-colors">Tap to edit</p>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEditNote(reaction)}
                          className="flex items-center gap-1.5 text-[10px] text-sleep-400 hover:text-dream-glow font-body transition-colors mt-1"
                        >
                          <MessageSquare className="w-3 h-3" />
                          Add a note about this night
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
