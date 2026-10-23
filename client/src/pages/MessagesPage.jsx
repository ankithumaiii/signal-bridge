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
    if (activeConv?._id) {
      fetchMessages(activeConv._id);

      // Join socket room for this conversation
      const socket = getSocket();
      socket.emit('join_conversation', activeConv._id);

      const handleNewMessage = (data) => {
        if (data?.message && data.message.conversationId === activeConv._id) {
          setMessages((prev) => {
            // Deduplicate if message already added or matches idempotencyKey
            if (prev.some((m) => m._id === data.message._id || (m.idempotencyKey && m.idempotencyKey === data.message.idempotencyKey))) {
              return prev.map((m) => m.idempotencyKey === data.message.idempotencyKey ? data.message : m);
            }
            return [...prev, data.message];
          });
          setTimeout(scrollToBottom, 100);
        }
      };

      socket.on('new_message', handleNewMessage);

      return () => {
        socket.emit('leave_conversation', activeConv._id);
        socket.off('new_message', handleNewMessage);
      };
    }
  }, [activeConv]);

  const handleSendMessage = async (customText = null, customType = 'text') => {
    const msgText = customText || text;
    if (!msgText.trim() || !activeConv) return;

    setSending(true);
    const idempotencyKey = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const payload = {
      conversationId: activeConv._id,
      text: msgText.trim(),
      messageType: customType,
      location: coords ? { lat: coords.lat, lng: coords.lng, accuracy: coords.accuracy } : null,
      idempotencyKey
    };

    if (!isOnline) {
      // Save locally to offline queue
      enqueueOfflineAction({
        type: 'send_message',
        payload,
        idempotencyKey
      });

      // Display optimistic queued message in UI
      setMessages((prev) => [
        ...prev,
        {
          _id: `temp_${Date.now()}`,
          conversationId: activeConv._id,
          senderId: { _id: user._id, name: user.name },
          text: msgText.trim(),
          messageType: customType,
          status: 'queued',
          transportUsed: 'local_offline_queued',
          createdAt: new Date().toISOString()
        }
      ]);

      if (!customText) setText('');
      setSending(false);
      setTimeout(scrollToBottom, 100);
      return;
    }

    try {
      const res = await api.sendMessage(activeConv._id, {
        text: msgText.trim(),
        messageType: customType,
        location: payload.location,
        idempotencyKey,
        transportUsed: 'internet_http'
      });

      if (res.success && res.data) {
        setMessages((prev) => [...prev, res.data]);
        if (!customText) setText('');
        setTimeout(scrollToBottom, 100);
      }
    } catch (err) {
      console.warn('Failed to send message:', err.message);
      // Fallback to queue
      enqueueOfflineAction({
        type: 'send_message',
        payload,
        idempotencyKey
      });
      alert('Unable to reach server. Message has been stored in local offline queue and will sync automatically.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ height: 'calc(100vh - var(--header-height) - 40px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MessageSquare size={22} color="var(--brand-blue)" /> Family Circle Chat
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Authenticated transport messaging with real-time Socket.IO and offline replay
          </p>
        </div>

        {/* Honest System Transparency Notice */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          background: 'rgba(255, 255, 255, 0.04)',
          padding: '0.3rem 0.6rem',
          borderRadius: 'var(--radius-sm)'
        }}>
          <Info size={13} color="var(--brand-blue)" />
          <span>Device-to-device radio mesh requires native platform hardware</span>
        </div>
      </div>

      {/* Main Chat Layout: Conversations List + Message Window */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: 'minmax(240px, 300px) 1fr',
        gap: '1rem',
        minHeight: 0
      }}>
        {/* Conversations Sidebar */}
        <div className="card" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', overflowY: 'auto' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
            Circles & Direct
          </div>

          {conversations.map((c) => {
            const isSelected = activeConv?._id === c._id;
            return (
              <button
                key={c._id}
                type="button"
                onClick={() => setActiveConv(c)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.65rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  background: isSelected ? 'rgba(58, 134, 255, 0.15)' : 'transparent',
                  border: `1px solid ${isSelected ? 'rgba(58, 134, 255, 0.35)' : 'transparent'}`,
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-md)',
                  background: c.type === 'family_group' ? 'rgba(58, 134, 255, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: c.type === 'family_group' ? 'var(--brand-blue)' : 'var(--color-success)'
                }}>
                  <Users size={18} />
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#FFFFFF', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {c.title || 'Direct Conversation'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {c.lastMessage?.text || 'No messages yet'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Chat Conversation View */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '1rem', minHeight: 0 }}>
          {/* Conversation Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '0.75rem' }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#FFFFFF' }}>
                {activeConv?.title || 'Family Emergency Circle'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {activeConv?.members?.length || 1} participant(s) • Real-time socket channel
              </div>
            </div>

            {/* Fast Check-In Shortcuts */}
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button
                onClick={() => handleSendMessage('Checking in: I am safe.', 'checkin_safe')}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34D399', borderColor: 'rgba(16, 185, 129, 0.3)' }}
              >
                <CheckCircle size={13} /> "I'm Safe"
              </button>
              <button
                onClick={() => handleSendMessage('Need assistance immediately at my location.', 'checkin_help')}
                className="btn btn-outline-danger btn-sm"
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
              >
                <AlertTriangle size={13} /> "Need Help"
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.5rem' }}>
            {messages.map((m) => {
              const isMine = m.senderId?._id === user?._id || m.senderId === user?._id;
              const isQueued = m.status === 'queued';

              return (
                <div
                  key={m._id}
                  style={{
                    alignSelf: isMine ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isMine ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem', padding: '0 0.25rem' }}>
                    {isMine ? 'You' : m.senderId?.name || 'Member'}
                  </div>

                  <div
                    style={{
                      padding: '0.65rem 0.95rem',
                      borderRadius: isMine ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                      background: isMine
                        ? m.messageType === 'checkin_help'
                          ? 'var(--sos-red)'
                          : 'var(--brand-blue)'
                        : 'rgba(255, 255, 255, 0.08)',
                      color: '#FFFFFF',
                      fontSize: '0.9rem',
                      lineHeight: 1.4,
                      border: isQueued ? '1px dashed #F59E0B' : 'none'
                    }}
                  >
                    {m.text}
                  </div>

                  {/* Delivery Status and Timestamp */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {isMine && (
                      <>
                        <span>•</span>
                        {isQueued ? (
                          <span style={{ color: '#F59E0B' }}>Queued locally</span>
                        ) : (
                          <span style={{ color: '#6EE7B7' }}>Delivered</span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
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
              gap: '0.5rem',
              marginTop: '0.75rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid var(--border-subtle)'
            }}
          >
            <input
              type="text"
              placeholder={isOnline ? 'Type family message...' : 'Offline: Message will be queued locally...'}
              value={text}
              onChange={(e) => setText(e.target.value)}
              style={{ flex: 1, padding: '0.65rem 0.95rem' }}
            />
            <button
              type="submit"
              disabled={sending || !text.trim()}
              className="btn btn-primary"
              style={{ padding: '0.65rem 1.25rem' }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
