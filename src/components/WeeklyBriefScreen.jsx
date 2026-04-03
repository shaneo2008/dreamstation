import React, { useState, useEffect } from 'react'
import { ArrowLeft, Calendar, ChevronDown, ChevronUp, BookOpen, Eye, MessageSquare, Check } from 'lucide-react'
import { db } from '../lib/supabase'

/**
 * Weekly Brief Screen
 * 
 * Located at: Settings > My Reflections > Weekly Briefs
 * Shows current week's brief at top, previous briefs below in reverse chronological order.
 * Each brief has 3 sections: summary, patterns (nullable), week_ahead.
 * Never shown on child-facing screens.
 */
export default function WeeklyBriefScreen({ childId, childName, onBack }) {
  const [briefs, setBriefs] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedBriefId, setExpandedBriefId] = useState(null)
  const [editingNoteId, setEditingNoteId] = useState(null)
  const [editingNoteText, setEditingNoteText] = useState('')
  const [savingNoteId, setSavingNoteId] = useState(null)

  const handleEditNote = (brief) => {
    setEditingNoteId(brief.id)
    setEditingNoteText(brief.parent_note || '')
  }

  const handleSaveNote = async (briefId) => {
    setSavingNoteId(briefId)
    try {
      // Direct update for parent_note
      const supabaseModule = await import('../lib/supabase')
      await supabaseModule.supabase
        .from('weekly_briefs')
        .update({ parent_note: editingNoteText.trim() || null })
        .eq('id', briefId)
      setBriefs(prev => prev.map(b =>
        b.id === briefId ? { ...b, parent_note: editingNoteText.trim() || null } : b
      ))
      setEditingNoteId(null)
      setEditingNoteText('')
    } catch (err) {
      console.error('Failed to save brief note:', err)
    } finally {
      setSavingNoteId(null)
    }
  }

  useEffect(() => {
    const loadBriefs = async () => {
      if (!childId) return
      try {
        const data = await db.getWeeklyBriefs(childId)
        setBriefs(data || [])

        // Mark the latest brief as read if unread
        if (data && data.length > 0 && !data[0].read_at) {
          await db.markBriefRead(data[0].id)
        }
      } catch (err) {
        console.error('Error loading weekly briefs:', err)
      } finally {
        setLoading(false)
      }
    }
    loadBriefs()
  }, [childId])

  const formatDateRange = (start, end) => {
    const s = new Date(start)
    const e = new Date(end)
    const opts = { month: 'short', day: 'numeric' }
    return `${s.toLocaleDateString(undefined, opts)} – ${e.toLocaleDateString(undefined, opts)}`
  }

  const currentBrief = briefs.length > 0 ? briefs[0] : null
  const previousBriefs = briefs.slice(1)

  if (loading) {
    return (
      <div className="min-h-full px-5 py-6 animate-fade-in text-cream-100">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="w-10 h-10 rounded-2xl bg-[#1b120c]/88 border border-white/10 flex items-center justify-center text-cream-200 hover:text-cream-100 hover:bg-[#24170f] transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-display font-bold text-cream-100">Weekly Briefs</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin text-2xl">⏳</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full px-5 py-6 animate-fade-in text-cream-100">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={onBack} className="w-10 h-10 rounded-2xl bg-[#1b120c]/88 border border-white/10 flex items-center justify-center text-cream-200 hover:text-cream-100 hover:bg-[#24170f] transition-colors shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-[0.16em] text-cream-400/55 font-body">Reflections</div>
          <h1 className="text-xl font-display font-bold text-cream-100">Weekly Briefs</h1>
          <p className="text-xs text-cream-300/70 font-body">{childName}'s reflections</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto mt-4 space-y-4">
        <div className="rounded-[28px] border border-white/10 bg-[#1b120c]/82 px-4 py-4 shadow-card backdrop-blur-md">
          <p className="text-sm text-cream-300/80 font-body leading-relaxed">A short weekly reflection to help you notice patterns, progress, and what may be worth watching next.</p>
        </div>

        {currentBrief ? (
          <div className="glass-card-solid overflow-hidden border-dream-glow/20 shadow-dream">
            <button
              onClick={() => setExpandedBriefId(expandedBriefId === currentBrief.id ? null : currentBrief.id)}
              className="w-full flex items-center justify-between p-5 text-left"
            >
              <div className="flex items-center gap-2 flex-1">
                <Calendar className="w-4 h-4 text-dream-glow" />
                <span className="text-[11px] font-display font-semibold text-dream-glow uppercase tracking-[0.14em]">This week</span>
                <span className="text-xs text-cream-400/60 font-body ml-auto mr-2">
                  {formatDateRange(currentBrief.week_start_date, currentBrief.week_end_date)}
                </span>
              </div>
              {expandedBriefId === currentBrief.id ? (
                <ChevronUp className="w-4 h-4 text-cream-400/55 shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-cream-400/55 shrink-0" />
              )}
            </button>
            {expandedBriefId !== currentBrief.id && (
              <div className="px-5 pb-4 -mt-2">
                <p className="text-xs text-cream-400/60 font-body">
                  Based on {currentBrief.session_count || 0} story night{currentBrief.session_count !== 1 ? 's' : ''} this week
                </p>
              </div>
            )}
            {expandedBriefId === currentBrief.id && (
              <div className="px-5 pb-5">
                <BriefContent brief={currentBrief} />
                <div className="mt-4 pt-3 border-t border-white/10">
                  <p className="text-[10px] text-cream-400/60 font-body">
                    Based on {currentBrief.session_count || 0} story night{currentBrief.session_count !== 1 ? 's' : ''} this week
                  </p>
                </div>
                <BriefNote brief={currentBrief} editingNoteId={editingNoteId} editingNoteText={editingNoteText} setEditingNoteText={setEditingNoteText} setEditingNoteId={setEditingNoteId} savingNoteId={savingNoteId} handleEditNote={handleEditNote} handleSaveNote={handleSaveNote} />
              </div>
            )}
          </div>
        ) : (
          <div className="glass-card-solid p-6 text-center shadow-card text-cream-100">
            <BookOpen className="w-8 h-8 text-cream-400/55 mx-auto mb-3" />
            <h3 className="text-lg font-display font-semibold text-cream-100 mb-2">No briefs yet</h3>
            <p className="text-sm text-cream-300/75 font-body">
              Your first weekly reflection will appear after {childName} has had at least 3 story nights in a week.
            </p>
          </div>
        )}

        {previousBriefs.length > 0 && (
          <div>
            <h2 className="text-sm font-display font-semibold text-cream-300/72 mb-3">Previous weeks</h2>
            <div className="space-y-2">
              {previousBriefs.map(brief => (
                <div
                  key={brief.id}
                  className="glass-card-solid rounded-[24px] shadow-card overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedBriefId(expandedBriefId === brief.id ? null : brief.id)}
                    className="w-full flex items-center justify-between p-4 text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-3.5 h-3.5 text-cream-400/55" />
                        <span className="text-xs font-display font-semibold text-cream-200">
                          {formatDateRange(brief.week_start_date, brief.week_end_date)}
                        </span>
                        {brief.read_at && (
                          <Eye className="w-3 h-3 text-cream-400/40" />
                        )}
                      </div>
                      {expandedBriefId !== brief.id && (
                        <p className="text-xs text-cream-300/72 font-body truncate">
                          {brief.brief_content?.summary?.substring(0, 80) || 'Brief available'}...
                        </p>
                      )}
                    </div>
                    {expandedBriefId === brief.id ? (
                      <ChevronUp className="w-4 h-4 text-cream-400/55 shrink-0 ml-2" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-cream-400/55 shrink-0 ml-2" />
                    )}
                  </button>

                  {expandedBriefId === brief.id && (
                    <div className="px-4 pb-4 pt-0">
                      <BriefContent brief={brief} />
                      <p className="text-[10px] text-cream-400/60 font-body mt-3">
                        Based on {brief.session_count || 0} story night{brief.session_count !== 1 ? 's' : ''}
                      </p>
                      <BriefNote brief={brief} editingNoteId={editingNoteId} editingNoteText={editingNoteText} setEditingNoteText={setEditingNoteText} setEditingNoteId={setEditingNoteId} savingNoteId={savingNoteId} handleEditNote={handleEditNote} handleSaveNote={handleSaveNote} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Brief Note — editable parent note on each brief
 */
function BriefNote({ brief, editingNoteId, editingNoteText, setEditingNoteText, setEditingNoteId, savingNoteId, handleEditNote, handleSaveNote }) {
  return (
    <div className="mt-3 pt-2 border-t border-white/10">
      {editingNoteId === brief.id ? (
        <div>
          <textarea
            value={editingNoteText}
            onChange={(e) => setEditingNoteText(e.target.value.slice(0, 1000))}
            placeholder="Add your own thoughts about this week…"
            rows={3}
            className="input-field resize-none text-xs"
          />
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[10px] text-cream-400/60 font-body">{editingNoteText.length}/1000</span>
            <div className="flex gap-2">
              <button
                onClick={() => { setEditingNoteId(null); setEditingNoteText(''); }}
                className="px-2.5 py-1 text-[10px] text-cream-400/70 hover:text-cream-200 font-display font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveNote(brief.id)}
                disabled={savingNoteId === brief.id}
                className="flex items-center gap-1 px-2.5 py-1 bg-dream-glow hover:bg-dream-aurora text-white rounded-lg text-[10px] font-display font-semibold transition-all disabled:opacity-50"
              >
                <Check className="w-3 h-3" />
                {savingNoteId === brief.id ? 'Saving\u2026' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      ) : brief.parent_note ? (
        <button
          onClick={() => handleEditNote(brief)}
          className="w-full text-left group"
        >
          <p className="text-[10px] text-cream-300/68 font-body italic">"{brief.parent_note}"</p>
          <p className="text-[9px] text-cream-400/50 font-body mt-0.5 group-hover:text-dream-glow transition-colors">Tap to edit</p>
        </button>
      ) : (
        <button
          onClick={() => handleEditNote(brief)}
          className="flex items-center gap-1.5 text-[10px] text-cream-400/60 hover:text-dream-glow font-body transition-colors mt-1"
        >
          <MessageSquare className="w-3 h-3" />
          Add a note about this week
        </button>
      )}
    </div>
  )
}

/**
 * Brief Content — renders the 3 sections of a weekly brief
 */
function BriefContent({ brief }) {
  const content = brief.brief_content || {}

  return (
    <div className="space-y-4">
      {content.summary && (
        <div>
          <h4 className="text-xs font-display font-bold text-cream-300/80 mb-1.5 uppercase tracking-wider">
            What we noticed this week
          </h4>
          <p className="text-sm text-cream-100 font-body leading-relaxed">{content.summary}</p>
        </div>
      )}

      {content.patterns && (
        <div>
          <h4 className="text-xs font-display font-bold text-cream-300/80 mb-1.5 uppercase tracking-wider">
            A pattern worth noting
          </h4>
          <p className="text-sm text-cream-100 font-body leading-relaxed">{content.patterns}</p>
        </div>
      )}

      {content.week_ahead && (
        <div>
          <h4 className="text-xs font-display font-bold text-cream-300/80 mb-1.5 uppercase tracking-wider">
            What to notice this week
          </h4>
          <p className="text-sm text-cream-100 font-body leading-relaxed">{content.week_ahead}</p>
        </div>
      )}
    </div>
  )
}
