import React, { useState, useEffect } from 'react'
import { ArrowLeft, Calendar, ChevronDown, ChevronUp, BookOpen, Eye } from 'lucide-react'
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
      <div className="min-h-full px-5 py-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="p-2 text-sleep-500 hover:text-sleep-800 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-display font-bold text-sleep-900">Weekly Briefs</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin text-2xl">⏳</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full px-5 py-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <button onClick={onBack} className="p-2 text-sleep-500 hover:text-sleep-800 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-display font-bold text-sleep-900">Weekly Briefs</h1>
          <p className="text-xs text-sleep-500 font-body">{childName}'s reflections</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto mt-4 space-y-4">
        {/* Current Brief */}
        {currentBrief ? (
          <div className="bg-white/80 backdrop-blur-sm border-2 border-dream-glow/30 rounded-3xl shadow-card overflow-hidden">
            <button
              onClick={() => setExpandedBriefId(expandedBriefId === currentBrief.id ? null : currentBrief.id)}
              className="w-full flex items-center justify-between p-5 text-left"
            >
              <div className="flex items-center gap-2 flex-1">
                <Calendar className="w-4 h-4 text-dream-glow" />
                <span className="text-xs font-display font-semibold text-dream-glow">This week</span>
                <span className="text-xs text-sleep-400 font-body ml-auto mr-2">
                  {formatDateRange(currentBrief.week_start_date, currentBrief.week_end_date)}
                </span>
              </div>
              {expandedBriefId === currentBrief.id ? (
                <ChevronUp className="w-4 h-4 text-sleep-400 shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-sleep-400 shrink-0" />
              )}
            </button>
            {expandedBriefId !== currentBrief.id && (
              <div className="px-5 pb-4 -mt-2">
                <p className="text-xs text-sleep-400 font-body">
                  Based on {currentBrief.session_count || 0} story night{currentBrief.session_count !== 1 ? 's' : ''} this week
                </p>
              </div>
            )}
            {expandedBriefId === currentBrief.id && (
              <div className="px-5 pb-5">
                <BriefContent brief={currentBrief} />
                <div className="mt-4 pt-3 border-t border-cream-300/40">
                  <p className="text-[10px] text-sleep-400 font-body">
                    Based on {currentBrief.session_count || 0} story night{currentBrief.session_count !== 1 ? 's' : ''} this week
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-sm border-2 border-cream-300/50 rounded-3xl p-6 text-center shadow-card">
            <BookOpen className="w-8 h-8 text-sleep-400 mx-auto mb-3" />
            <h3 className="text-lg font-display font-semibold text-sleep-900 mb-2">No briefs yet</h3>
            <p className="text-sm text-sleep-500 font-body">
              Your first weekly reflection will appear after {childName} has had at least 3 story nights in a week.
            </p>
          </div>
        )}

        {/* Previous Briefs */}
        {previousBriefs.length > 0 && (
          <div>
            <h2 className="text-sm font-display font-semibold text-sleep-600 mb-3">Previous weeks</h2>
            <div className="space-y-2">
              {previousBriefs.map(brief => (
                <div
                  key={brief.id}
                  className="bg-white/80 backdrop-blur-sm border-2 border-cream-300/50 rounded-2xl shadow-card overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedBriefId(expandedBriefId === brief.id ? null : brief.id)}
                    className="w-full flex items-center justify-between p-4 text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-3.5 h-3.5 text-sleep-400" />
                        <span className="text-xs font-display font-semibold text-sleep-700">
                          {formatDateRange(brief.week_start_date, brief.week_end_date)}
                        </span>
                        {brief.read_at && (
                          <Eye className="w-3 h-3 text-sleep-300" />
                        )}
                      </div>
                      {expandedBriefId !== brief.id && (
                        <p className="text-xs text-sleep-500 font-body truncate">
                          {brief.brief_content?.summary?.substring(0, 80) || 'Brief available'}...
                        </p>
                      )}
                    </div>
                    {expandedBriefId === brief.id ? (
                      <ChevronUp className="w-4 h-4 text-sleep-400 shrink-0 ml-2" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-sleep-400 shrink-0 ml-2" />
                    )}
                  </button>

                  {expandedBriefId === brief.id && (
                    <div className="px-4 pb-4 pt-0">
                      <BriefContent brief={brief} />
                      <p className="text-[10px] text-sleep-400 font-body mt-3">
                        Based on {brief.session_count || 0} story night{brief.session_count !== 1 ? 's' : ''}
                      </p>
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
 * Brief Content — renders the 3 sections of a weekly brief
 */
function BriefContent({ brief }) {
  const content = brief.brief_content || {}

  return (
    <div className="space-y-4">
      {/* Section 1: What we noticed */}
      {content.summary && (
        <div>
          <h4 className="text-xs font-display font-bold text-sleep-700 mb-1.5 uppercase tracking-wider">
            What we noticed this week
          </h4>
          <p className="text-sm text-sleep-800 font-body leading-relaxed">{content.summary}</p>
        </div>
      )}

      {/* Section 2: Patterns (nullable) */}
      {content.patterns && (
        <div>
          <h4 className="text-xs font-display font-bold text-sleep-700 mb-1.5 uppercase tracking-wider">
            A pattern worth noting
          </h4>
          <p className="text-sm text-sleep-800 font-body leading-relaxed">{content.patterns}</p>
        </div>
      )}

      {/* Section 3: Week ahead */}
      {content.week_ahead && (
        <div>
          <h4 className="text-xs font-display font-bold text-sleep-700 mb-1.5 uppercase tracking-wider">
            What to notice this week
          </h4>
          <p className="text-sm text-sleep-800 font-body leading-relaxed">{content.week_ahead}</p>
        </div>
      )}
    </div>
  )
}
