import { useState, useEffect } from 'react'
import { Send, Archive, ArchiveRestore, Mail, MessageSquare, Phone, Clock, Search } from 'lucide-react'
import api from '../../services/api'

interface Contact {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  tags?: string[]
}

interface Message {
  id: string
  channel: 'EMAIL' | 'SMS' | 'INTERNAL'
  direction: 'INBOUND' | 'OUTBOUND'
  subject?: string
  body: string
  isAutomated: boolean
  isRead: boolean
  sentAt: string
  sentBy?: {
    id: string
    firstName: string
    lastName: string
  }
}

interface Conversation {
  id: string
  status: 'active' | 'archived'
  lastMessageAt: string
  contact: Contact
  messages: Message[]
  _count?: {
    messages: number
  }
}

interface InboxStats {
  totalConversations: number
  activeConversations: number
  archivedConversations: number
  unreadMessages: number
}

export default function Inbox() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [stats, setStats] = useState<InboxStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'active' | 'archived' | 'all'>('active')
  const [messageBody, setMessageBody] = useState('')
  const [messageChannel, setMessageChannel] = useState<'EMAIL' | 'SMS' | 'INTERNAL'>('INTERNAL')
  const [messageSubject, setMessageSubject] = useState('')

  useEffect(() => {
    fetchConversations()
    fetchStats()
  }, [statusFilter])

  const fetchConversations = async () => {
    try {
      setLoading(true)
      const params = statusFilter !== 'all' ? { status: statusFilter } : {}
      const response = await api.get('/inbox/conversations', { params })
      setConversations(response.data.data || [])
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await api.get('/inbox/stats')
      setStats(response.data.data || null)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const fetchConversation = async (id: string) => {
    try {
      const response = await api.get(`/inbox/conversations/${id}`)
      setSelectedConversation(response.data.data)
      // Mark as read
      await api.post(`/inbox/conversations/${id}/read`)
      fetchConversations()
      fetchStats()
    } catch (error) {
      console.error('Failed to fetch conversation:', error)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedConversation || !messageBody.trim()) return

    try {
      setSending(true)
      await api.post('/inbox/messages', {
        conversationId: selectedConversation.id,
        body: messageBody,
        channel: messageChannel,
        subject: messageChannel === 'EMAIL' ? messageSubject : undefined
      })

      // Clear form
      setMessageBody('')
      setMessageSubject('')

      // Refresh conversation
      fetchConversation(selectedConversation.id)
      fetchConversations()
    } catch (error) {
      console.error('Failed to send message:', error)
      alert('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const archiveConversation = async (id: string) => {
    try {
      await api.post(`/inbox/conversations/${id}/archive`)
      fetchConversations()
      fetchStats()
      if (selectedConversation?.id === id) {
        setSelectedConversation(null)
      }
    } catch (error) {
      console.error('Failed to archive conversation:', error)
      alert('Failed to archive conversation')
    }
  }

  const unarchiveConversation = async (id: string) => {
    try {
      await api.post(`/inbox/conversations/${id}/unarchive`)
      fetchConversations()
      fetchStats()
    } catch (error) {
      console.error('Failed to unarchive conversation:', error)
      alert('Failed to unarchive conversation')
    }
  }

  const filteredConversations = conversations.filter(conv => {
    const fullName = `${conv.contact.firstName} ${conv.contact.lastName}`.toLowerCase()
    const email = conv.contact.email?.toLowerCase() || ''
    const query = searchQuery.toLowerCase()
    return fullName.includes(query) || email.includes(query)
  })

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'EMAIL': return <Mail className="w-4 h-4" />
      case 'SMS': return <Phone className="w-4 h-4" />
      case 'INTERNAL': return <MessageSquare className="w-4 h-4" />
      default: return <MessageSquare className="w-4 h-4" />
    }
  }

  const hasUnreadMessages = (conv: Conversation) => {
    return conv.messages.some(m => !m.isRead && m.direction === 'INBOUND')
  }

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">Inbox</h1>
        
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="card p-4">
              <div className="text-sm text-gray-600 mb-1">Total</div>
              <div className="text-2xl font-bold">{stats.totalConversations}</div>
            </div>
            <div className="card p-4">
              <div className="text-sm text-gray-600 mb-1">Active</div>
              <div className="text-2xl font-bold text-green-600">{stats.activeConversations}</div>
            </div>
            <div className="card p-4">
              <div className="text-sm text-gray-600 mb-1">Archived</div>
              <div className="text-2xl font-bold text-gray-400">{stats.archivedConversations}</div>
            </div>
            <div className="card p-4">
              <div className="text-sm text-gray-600 mb-1">Unread</div>
              <div className="text-2xl font-bold text-blue-600">{stats.unreadMessages}</div>
            </div>
          </div>
        )}
      </div>

      {/* Main Inbox Layout */}
      <div className="flex-1 grid grid-cols-3 gap-4 overflow-hidden">
        {/* Conversation List */}
        <div className="card flex flex-col overflow-hidden">
          <div className="p-4 border-b">
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1 rounded text-sm ${
                  statusFilter === 'active'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setStatusFilter('archived')}
                className={`px-3 py-1 rounded text-sm ${
                  statusFilter === 'archived'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                Archived
              </button>
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded text-sm ${
                  statusFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                All
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No conversations found
              </div>
            ) : (
              <div>
                {filteredConversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => fetchConversation(conv.id)}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition ${
                      selectedConversation?.id === conv.id ? 'bg-blue-50' : ''
                    } ${hasUnreadMessages(conv) ? 'bg-blue-50/30' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="font-medium">
                        {conv.contact.firstName} {conv.contact.lastName}
                        {hasUnreadMessages(conv) && (
                          <span className="ml-2 inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(conv.lastMessageAt)}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">{conv.contact.email}</div>
                    {conv.messages[0] && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        {getChannelIcon(conv.messages[0].channel)}
                        <div className="truncate flex-1">
                          {conv.messages[0].body.substring(0, 50)}...
                        </div>
                      </div>
                    )}
                    <div className="mt-2 text-xs text-gray-400">
                      {conv._count?.messages || 0} messages
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Message Thread */}
        <div className="col-span-2 card flex flex-col overflow-hidden">
          {selectedConversation ? (
            <>
              {/* Conversation Header */}
              <div className="p-4 border-b flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-lg">
                    {selectedConversation.contact.firstName} {selectedConversation.contact.lastName}
                  </h2>
                  <div className="text-sm text-gray-600">
                    {selectedConversation.contact.email}
                    {selectedConversation.contact.phone && (
                      <span className="ml-2">• {selectedConversation.contact.phone}</span>
                    )}
                  </div>
                  {selectedConversation.contact.tags && selectedConversation.contact.tags.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {selectedConversation.contact.tags.map((tag, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {selectedConversation.status === 'active' ? (
                    <button
                      onClick={() => archiveConversation(selectedConversation.id)}
                      className="btn btn-secondary flex items-center gap-2"
                    >
                      <Archive className="w-4 h-4" />
                      Archive
                    </button>
                  ) : (
                    <button
                      onClick={() => unarchiveConversation(selectedConversation.id)}
                      className="btn btn-secondary flex items-center gap-2"
                    >
                      <ArchiveRestore className="w-4 h-4" />
                      Unarchive
                    </button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedConversation.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        message.direction === 'OUTBOUND'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {getChannelIcon(message.channel)}
                        <span className="text-xs opacity-75">
                          {message.channel}
                        </span>
                        {message.isAutomated && (
                          <span className="text-xs opacity-75">(Automated)</span>
                        )}
                      </div>
                      {message.subject && (
                        <div className="font-medium mb-1">{message.subject}</div>
                      )}
                      <div className="whitespace-pre-wrap">{message.body}</div>
                      <div className="text-xs opacity-75 mt-2">
                        {new Date(message.sentAt).toLocaleString()}
                        {message.sentBy && (
                          <span className="ml-2">
                            • {message.sentBy.firstName} {message.sentBy.lastName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <form onSubmit={sendMessage} className="p-4 border-t">
                <div className="flex gap-2 mb-3">
                  <select
                    value={messageChannel}
                    onChange={(e) => setMessageChannel(e.target.value as any)}
                    className="px-3 py-1 border rounded text-sm"
                  >
                    <option value="INTERNAL">Internal Note</option>
                    <option value="EMAIL">Email</option>
                    <option value="SMS">SMS</option>
                  </select>
                </div>

                {messageChannel === 'EMAIL' && (
                  <input
                    type="text"
                    placeholder="Subject"
                    value={messageSubject}
                    onChange={(e) => setMessageSubject(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg mb-2"
                  />
                )}

                <div className="flex gap-2">
                  <textarea
                    value={messageBody}
                    onChange={(e) => setMessageBody(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-3 py-2 border rounded-lg resize-none"
                    rows={3}
                    required
                  />
                  <button
                    type="submit"
                    disabled={sending || !messageBody.trim()}
                    className="btn btn-primary h-fit self-end"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Select a conversation to view messages</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
