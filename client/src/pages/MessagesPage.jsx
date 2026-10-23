import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Users,
  CheckCircle,
  AlertTriangle,
  MapPin,
  Clock,
  WifiOff,
  Shield,
  Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useOffline } from '../context/OfflineContext.jsx';
import { useLocation } from '../context/LocationContext.jsx';
import { api } from '../services/api.js';
import { getSocket } from '../services/socket.js';
import { enqueueOfflineAction, getOfflineQueue } from '../services/offlineQueue.js';

export const MessagesPage = () => {
  const { user } = useAuth();
  const { isOnline } = useOffline();
  const { coords } = useLocation();

  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const data = await api.getConversations();
      if (data.success && data.conversations.length > 0) {
        setConversations(data.conversations);
        if (!activeConv) {
          setActiveConv(data.conversations[0]);
        }
      }
    } catch (err) {
      console.warn('Error fetching conversations:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (convId) => {
    try {
      const data = await api.getMessages(convId);
      if (data.success) {
        // Also merge any locally queued messages for this conversation
        const queue = getOfflineQueue();
        const queuedForConv = queue
          .filter((q) => q.type === 'send_message' && q.payload?.conversationId === convId)
          .map((q) => ({
            _id: q.id,
            conversationId: convId,
            senderId: { _id: user._id, name: user.name },
            text: q.payload.text,
            messageType: q.payload.messageType,
            status: 'queued',
            transportUsed: 'local_offline_queued',
            createdAt: q.queuedAt
          }));

        setMessages([...data.messages, ...queuedForConv]);
        setTimeout(scrollToBottom, 100);
      }
    } catch (err) {
      console.warn('Error fetching messages:', err.message);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    const handleQueueUpdate = () => {
      if (activeConv?._id) {
        fetchMessages(activeConv._id);
      }
    };
    window.addEventListener('offline-queue-updated', handleQueueUpdate);
    return () => window.removeEventListener('offline-queue-updated', handleQueueUpdate);
  }, [activeConv]);

  return (
    <div className="page-wrapper" style={{ height: 'calc(100vh - var(--header-height) - 40px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-accent-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-accent)'
            }}>
              <MessageSquare size={20} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Direct Emergency Comms
              </h1>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                End-to-end encrypted dispatch with real-time Socket.IO and store-and-forward offline buffer
              </p>
            </div>
          </div>
        </div>

        {/* System Transparency Notice */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.75rem',
          fontWeight: 600,
          color: 'var(--text-secondary)',
          background: 'var(--bg-card)',
          padding: '0.45rem 0.85rem',
          borderRadius: 'var(--radius-pill)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-xs)'
        }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isOnline ? 'var(--color-success)' : 'var(--color-warning)' }} />
          <span>{isOnline ? 'Socket.IO Channel Connected' : 'Offline Queue Active (Auto-flush on reconnect)'}</span>
        </div>
      </div>

      {/* Main Chat Layout: Conversations List + Message Window */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: 'minmax(260px, 320px) 1fr',
        gap: '1.25rem',
        minHeight: 0
      }}>
        {/* Conversations Sidebar */}
        <div className="card" style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', overflowY: 'auto' }}>
          <div style={{
            fontSize: '0.75rem',
            fontWeight: 800,
            color: 'var(--text-muted)',
            marginBottom: '0.5rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            paddingLeft: '0.25rem'
          }}>
            Channels & Beneficiaries
          </div>

          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Loading channels...
            </div>
          ) : conversations.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No active conversations. Add emergency contacts to start messaging.
            </div>
          ) : (
            conversations.map((c) => {
              const isSelected = activeConv?._id === c._id;
              return (
                <button
                  key={c._id}
                  type="button"
                  onClick={() => setActiveConv(c)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    background: isSelected ? 'var(--color-accent-light)' : 'transparent',
                    border: `1.5px solid ${isSelected ? 'var(--color-accent)' : 'transparent'}`,
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'var(--transition-fast)'
                  }}
                >
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: isSelected ? 'var(--color-accent)' : 'var(--bg-canvas)',
                    border: `1px solid ${isSelected ? 'var(--color-accent)' : 'var(--border-subtle)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isSelected ? '#FFFFFF' : 'var(--color-accent)',
                    flexShrink: 0
                  }}>
                    <Users size={18} />
                  </div>
                  <div style={{ overflow: 'hidden', flex: 1 }}>
                    <div style={{
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      color: isSelected ? 'var(--color-accent)' : 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden'
                    }}>
                      {c.title || 'Direct Channel'}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden'
                    }}>
                      {c.lastMessage?.text || 'No messages yet'}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Chat Conversation View */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '1.25rem', minHeight: 0 }}>
          {/* Conversation Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: '0.85rem',
            borderBottom: '1px solid var(--border-subtle)',
            marginBottom: '0.85rem'
          }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                {activeConv?.title || 'Family Emergency Circle'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {activeConv?.members?.length || 1} participant(s) • Live dispatch ledger
              </div>
            </div>

            {/* Fast Check-In Shortcuts */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => handleSendMessage('Checking in: I am safe.', 'checkin_safe')}
                className="btn btn-secondary btn-sm"
                style={{
                  fontSize: '0.75rem',
                  padding: '0.35rem 0.75rem',
                  background: 'rgba(16, 185, 129, 0.08)',
                  color: 'var(--color-success)',
                  borderColor: 'rgba(16, 185, 129, 0.25)',
                  fontWeight: 700
                }}
              >
                <CheckCircle size={14} /> I'm Safe
              </button>
              <button
                onClick={() => handleSendMessage('Need assistance immediately at my location.', 'checkin_help')}
                className="btn btn-sm"
                style={{
                  fontSize: '0.75rem',
                  padding: '0.35rem 0.75rem',
                  background: 'rgba(239, 68, 68, 0.08)',
                  color: 'var(--color-danger)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  fontWeight: 700
                }}
              >
                <AlertTriangle size={14} /> Need Help
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
            paddingRight: '0.5rem',
            background: 'var(--bg-canvas)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}>
            {messages.length === 0 ? (
              <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)' }}>
                <MessageSquare size={36} color="var(--border-subtle)" style={{ marginBottom: '0.5rem' }} />
                <p style={{ margin: 0, fontWeight: 600 }}>No messages in this channel yet.</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Send an update or tap one of the quick check-ins above.</p>
              </div>
            ) : (
              messages.map((m) => {
                const isMine = m.senderId?._id === user?._id || m.senderId === user?._id;
                const isQueued = m.status === 'queued';
                const isHelp = m.messageType === 'checkin_help';

                return (
                  <div
                    key={m._id}
                    style={{
                      alignSelf: isMine ? 'flex-end' : 'flex-start',
                      maxWidth: '78%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isMine ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem', padding: '0 0.25rem', fontWeight: 600 }}>
                      {isMine ? 'You' : m.senderId?.name || 'Member'}
                    </div>

                    <div
                      style={{
                        padding: '0.75rem 1.05rem',
                        borderRadius: isMine ? '14px 14px 3px 14px' : '14px 14px 14px 3px',
                        background: isMine
                          ? isHelp
                            ? 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)'
                            : 'linear-gradient(135deg, #FF4800 0%, #E03E00 100%)'
                          : 'var(--bg-card)',
                        color: isMine ? '#FFFFFF' : 'var(--text-primary)',
                        fontSize: '0.88rem',
                        lineHeight: 1.45,
                        fontWeight: 500,
                        border: isQueued
                          ? '1.5px dashed var(--color-warning)'
                          : !isMine
                          ? '1px solid var(--border-subtle)'
                          : 'none',
                        boxShadow: 'var(--shadow-xs)'
                      }}
                    >
                      {m.text}
                    </div>

                    {/* Delivery Status and Timestamp */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontWeight: 600 }}>
                      <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {isMine && (
                        <>
                          <span>•</span>
                          {isQueued ? (
                            <span style={{ color: 'var(--color-warning)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                              <Clock size={10} /> Queued locally
                            </span>
                          ) : (
                            <span style={{ color: 'var(--color-success)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                              <CheckCircle size={10} /> Delivered
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            style={{
              display: 'flex',
              gap: '0.65rem',
              marginTop: '0.85rem'
            }}
          >
            <input
              type="text"
              placeholder={isOnline ? 'Type emergency broadcast message...' : 'Offline mode: Message will be queued locally...'}
              value={text}
              onChange={(e) => setText(e.target.value)}
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-pill)',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                fontSize: '0.88rem'
              }}
            />
            <button
              type="submit"
              disabled={sending || !text.trim()}
              className="btn btn-primary"
              style={{ padding: '0.75rem 1.4rem' }}
            >
              <Send size={16} /> Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
