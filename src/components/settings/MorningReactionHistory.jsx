import React, { useState, useEffect } from 'react'
import { ArrowLeft, Eye, HelpCircle, X as XIcon } from 'lucide-react'
import { db } from '../../lib/supabase'

const REACTION_ICONS = {
  noticed: { icon: Eye, label: 'Noticed', color: 'text-success' },
  not_sure: { icon: HelpCircle, label: 'Not sure', color: 'text-pastel-lavender' },
  didnt_see: { icon: XIcon, label: "Didn't see", color: 'text-sleep-400' },
}

export default function MorningReactionHistory({ childId, childName, onBack }) {
  const [reactions, setReactions] = useState([])
  const [loading, setLoading] = useState(true)

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
          reactions.map(reaction => (
            <div key={reaction.id} className="bg-white/80 backdrop-blur-sm border-2 border-cream-300/50 rounded-2xl p-4 shadow-card">
              {/* Date header */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-display font-semibold text-sleep-700">
                  {new Date(reaction.generated_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
                {reaction.skipped && (
                  <span className="text-[10px] text-sleep-400 font-body">Skipped</span>
                )}
              </div>

              {/* Observations + reactions */}
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

              {/* Parent note */}
              {reaction.parent_note && (
                <div className="mt-3 pt-2 border-t border-cream-300/40">
                  <p className="text-[10px] text-sleep-400 font-body italic">"{reaction.parent_note}"</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
