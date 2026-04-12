'use client'
// app/(app)/community/page.tsx
import { useState, useEffect, useRef } from 'react'
import { createBrowserSupabase } from '@/lib/supabase'

const CHANNELS = ['general', 'ai-help', 'projects', 'off-topic']

interface Post {
  id: string
  content: string
  likes_count: number
  created_at: string
  channel: string
  profiles: {
    id: string
    username: string
    full_name: string
    xp_level: number
    plan: string
  }
}

export default function CommunityPage() {
  const supabase         = createBrowserSupabase()
  const [posts, setPosts]     = useState<Post[]>([])
  const [channel, setChannel] = useState('general')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [myId, setMyId]       = useState<string | null>(null)
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMyId(data.user?.id || null))
  }, [])

  useEffect(() => {
    setLoading(true)
    fetchPosts()

    // Realtime subscription
    const sub = supabase
      .channel(`community:${channel}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'community_posts',
        filter: `channel=eq.${channel}`,
      }, async payload => {
        // Fetch full post with profile
        const { data } = await supabase
          .from('community_posts')
          .select('*, profiles:user_id(id, username, full_name, xp_level, plan)')
          .eq('id', payload.new.id)
          .single()
        if (data) setPosts(prev => [...prev, data as any])
      })
      .subscribe()

    return () => { supabase.removeChannel(sub) }
  }, [channel])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [posts])

  const fetchPosts = async () => {
    const { data } = await supabase
      .from('community_posts')
      .select('*, profiles:user_id(id, username, full_name, xp_level, plan)')
      .eq('channel', channel)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })
      .limit(50)

    setPosts((data as any) || [])
    setLoading(false)
  }

  const handleSend = async () => {
    if (!content.trim() || sending) return
    setSending(true)
    await fetch('/api/community', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, channel }),
    })
    setContent('')
    setSending(false)
  }

  const handleLike = async (postId: string) => {
    const wasLiked = likedIds.has(postId)
    setLikedIds(prev => {
      const next = new Set(prev)
      wasLiked ? next.delete(postId) : next.add(postId)
      return next
    })
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, likes_count: p.likes_count + (wasLiked ? -1 : 1) } : p
    ))
    await fetch('/api/community', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId }),
    })
  }

  const timeAgo = (ts: string) => {
    const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
    if (s < 60) return 'just now'
    if (s < 3600) return `${Math.floor(s/60)}m ago`
    if (s < 86400) return `${Math.floor(s/3600)}h ago`
    return `${Math.floor(s/86400)}d ago`
  }

  return (
    <div className="flex flex-col h-full">
      {/* Channel tabs */}
      <div className="flex items-center gap-2 px-6 py-3 border-b border-codex-border bg-codex-surface flex-shrink-0">
        <span className="text-xs text-codex-muted font-bold uppercase tracking-wider mr-2">Channel</span>
        {CHANNELS.map(c => (
          <button key={c} onClick={() => setChannel(c)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all font-medium
              ${channel === c
                ? 'bg-codex-gold/10 border-codex-gold/40 text-codex-gold'
                : 'bg-transparent border-codex-border text-codex-muted hover:text-codex-text'}`}>
            #{c}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-codex-success animate-pulse" />
          <span className="text-xs text-codex-muted">Live</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="text-codex-muted text-sm animate-pulse">Loading messages...</div>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <div className="text-4xl">💬</div>
            <p className="text-codex-muted text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : posts.map(post => {
          const isMe = post.profiles?.id === myId
          const liked = likedIds.has(post.id)

          return (
            <div key={post.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
              {/* Avatar */}
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                ${isMe ? 'bg-codex-gold text-black' : 'bg-codex-accent text-white'}`}>
                {(post.profiles?.full_name || post.profiles?.username || '?').charAt(0).toUpperCase()}
              </div>

              <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                {/* Meta */}
                <div className={`flex items-baseline gap-2 mb-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                  <span className={`text-xs font-bold ${isMe ? 'text-codex-gold' : 'text-codex-text'}`}>
                    {post.profiles?.full_name || post.profiles?.username}
                  </span>
                  <span className="text-[10px] text-codex-muted font-display">Lv.{post.profiles?.xp_level}</span>
                  <span className="text-[10px] text-codex-muted">{timeAgo(post.created_at)}</span>
                </div>

                {/* Bubble */}
                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                  ${isMe
                    ? 'bg-codex-gold/15 border border-codex-gold/30 rounded-tr-sm text-codex-text'
                    : 'bg-codex-surfaceUp border border-codex-border rounded-tl-sm text-codex-text'}`}>
                  {post.content}
                </div>

                {/* Actions */}
                <button onClick={() => handleLike(post.id)}
                  className={`flex items-center gap-1 text-[11px] mt-1.5 transition-colors
                    ${liked ? 'text-codex-gold' : 'text-codex-muted hover:text-codex-text'}`}>
                  {liked ? '♥' : '♡'} {post.likes_count + (liked ? 0 : 0)}
                </button>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-6 py-4 border-t border-codex-border bg-codex-surface flex gap-3">
        <input
          value={content}
          onChange={e => setContent(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          placeholder={`Message #${channel}...`}
          className="cx-input flex-1"
          maxLength={2000}
        />
        <button onClick={handleSend} disabled={!content.trim() || sending}
          className="cx-btn-primary w-auto px-5 flex-shrink-0 disabled:opacity-40">
          {sending ? '...' : '→'}
        </button>
      </div>
    </div>
  )
}
