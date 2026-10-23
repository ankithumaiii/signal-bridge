import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Trash2,
  Edit2,
  CheckCircle,
  AlertTriangle,
  Clock,
  MapPin,
  Share2,
  Shield,
  Phone,
  Mail,
  Send,
  Navigation,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useLocation } from '../context/LocationContext.jsx';
import { api } from '../services/api.js';

export const FamilyPage = () => {
  const { user, refreshMe } = useAuth();
  const { coords, requestLocation } = useLocation();

  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    relationship: 'Family',
    phone: '',
    email: '',
    notifyInEmergency: true
  });
  const [checkInMsg, setCheckInMsg] = useState(null);
  const [locationSharingHours, setLocationSharingHours] = useState(8);

  const relationships = ['Parent', 'Spouse', 'Sibling', 'Child', 'Partner', 'Friend', 'Colleague', 'Neighbor', 'Other'];

  const fetchContacts = async () => {
    try {
      const data = await api.getContacts();
      if (data.success) {
        setContacts(data.contacts);
      }
    } catch (err) {
      console.warn('Error fetching contacts:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleSaveContact = async (e) => {
    e.preventDefault();
    try {
      if (editingContact) {
        await api.updateContact(editingContact._id, formData);
      } else {
        await api.addContact(formData);
      }
      setShowAddModal(false);
      setEditingContact(null);
      setFormData({ name: '', relationship: 'Family', phone: '', email: '', notifyInEmergency: true });
      fetchContacts();
    } catch (err) {
      alert(`Contact operation failed: ${err.message}`);
    }
  };

  const handleDeleteContact = async (id) => {
    const confirm = window.confirm('Are you sure you want to remove this trusted contact?');
    if (!confirm) return;

    try {
      await api.deleteContact(id);
      fetchContacts();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleToggleEmergencyNotify = async (contact) => {
    try {
      await api.updateContact(contact._id, {
        notifyInEmergency: !contact.notifyInEmergency
      });
      fetchContacts();
    } catch (err) {
      console.warn('Update failed:', err.message);
    }
  };

  // Toggle voluntary location sharing
  const handleToggleLocationShare = async (enable) => {
    try {
      if (enable && !coords) {
        await requestLocation();
      }
      await api.updateLocation({
        lat: coords?.lat,
        lng: coords?.lng,
        accuracy: coords?.accuracy,
        locationSharingEnabled: enable,
        durationHours: locationSharingHours
      });
      await refreshMe();
      alert(enable ? `Temporary location sharing activated for ${locationSharingHours} hours.` : 'Location sharing revoked.');
    } catch (err) {
      alert(`Failed to update location sharing: ${err.message}`);
    }
  };

  const handleSendCheckIn = async (type) => {
    setCheckInMsg(null);
    try {
      const res = await api.sendCheckIn({
        status: type,
        message: type === 'safe'
          ? `${user?.name} checked in: Safe & Sound.`
          : `${user?.name} checked in: Needs help right now.`,
        location: coords
      });
      setCheckInMsg(res.message);
      fetchContacts();
      setTimeout(() => setCheckInMsg(null), 4000);
    } catch (err) {
      setCheckInMsg(`Check-in failed: ${err.message}`);
      setTimeout(() => setCheckInMsg(null), 4000);
    }
  };

  const openEditModal = (c) => {
    setEditingContact(c);
    setFormData({
      name: c.name,
      relationship: c.relationship,
      phone: c.phone,
      email: c.email || '',
      notifyInEmergency: c.notifyInEmergency
    });
    setShowAddModal(true);
  };

  const isLocationSharingActive = user?.locationSharing?.enabled &&
    (!user?.locationSharing?.expiresAt || new Date(user.locationSharing.expiresAt) > new Date());

  return (
    <div className="page-wrapper">
      {/* Page Title & Add Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            <Users size={24} color="#FF4800" /> Trusted Beneficiaries & Safety Circle
          </h1>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Manage the verified contacts who receive your emergency telemetry and instant safety pings
          </p>
        </div>

        <button
          onClick={() => {
            setEditingContact(null);
            setFormData({ name: '', relationship: 'Family', phone: '', email: '', notifyInEmergency: true });
            setShowAddModal(true);
          }}
          className="btn btn-primary btn-sm"
        >
          <UserPlus size={15} /> Add New Contact
        </button>
      </div>

      {checkInMsg && (
        <div style={{
          background: 'var(--status-safe-bg)',
          border: '1px solid rgba(14, 159, 110, 0.35)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.75rem 1rem',
          marginBottom: '1.25rem',
          color: 'var(--status-safe-text)',
          fontSize: '0.85rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <CheckCircle size={16} />
          <span>{checkInMsg}</span>
        </div>
      )}

      {/* Voluntary Location Sharing Management Card */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
              <Share2 size={18} color="#FF4800" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Voluntary Location Sharing Privacy Guard
              </h3>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
              100% opt-in. Enables trusted contacts to view your real-time GPS pin during travels or storms.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {!isLocationSharingActive ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <select
                  value={locationSharingHours}
                  onChange={(e) => setLocationSharingHours(Number(e.target.value))}
                  style={{ width: '110px', padding: '0.4rem 0.6rem', fontSize: '0.84rem' }}
                >
                  <option value={1}>1 Hour</option>
                  <option value={4}>4 Hours</option>
                  <option value={8}>8 Hours</option>
                  <option value={24}>24 Hours</option>
                </select>
                <button
                  onClick={() => handleToggleLocationShare(true)}
                  className="btn btn-primary btn-sm"
                >
                  Start Sharing
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className="badge badge-corroborated" style={{ padding: '0.35rem 0.75rem' }}>
                  <Navigation size={13} /> Active (Expires in {Math.max(0, Math.round((new Date(user.locationSharing.expiresAt) - Date.now()) / (1000 * 60)))} mins)
                </span>
                <button
                  onClick={() => handleToggleLocationShare(false)}
                  className="btn btn-outline-danger btn-sm"
                >
                  Revoke Now
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Check-in Broadcast Card */}
      <div className="card" style={{ padding: '1.15rem 1.35rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: '0.96rem', color: 'var(--text-primary)' }}>
            Broadcast Family Safety Check-In
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            One-tap status ping sent directly to all configured contacts
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => handleSendCheckIn('safe')}
            className="btn btn-secondary btn-sm"
            style={{ background: '#DEF7EC', color: '#03543F', borderColor: '#31C48D', fontWeight: 700 }}
          >
            <CheckCircle size={15} color="#0E9F6E" /> "I'm Safe"
          </button>
          <button
            onClick={() => handleSendCheckIn('need_help')}
            className="btn btn-outline-danger btn-sm"
            style={{ fontWeight: 700 }}
          >
            <AlertTriangle size={15} /> "I Need Help"
          </button>
        </div>
      </div>

      {/* Contact Cards Grid (Signal Bridge Beneficiary Style) */}
      <div className="grid-2">
        {contacts.map((contact) => {
          const isLinked = contact.status === 'connected';
          const lastCheckIn = contact.lastCheckInReceived;

          return (
            <div key={contact._id} className="card" style={{ padding: '1.35rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  {/* Beneficiary Avatar */}
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: isLinked ? 'linear-gradient(135deg, #FF4800 0%, #FF7A00 100%)' : '#F3F4F6',
                      color: isLinked ? '#FFFFFF' : '#4B5563',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1rem',
                      flexShrink: 0
                    }}
                  >
                    {contact.name ? contact.name.charAt(0) : 'C'}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                        {contact.name}
                      </h3>
                      <span className="badge badge-multiple" style={{ fontSize: '0.68rem' }}>
                        {contact.relationship}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <Phone size={13} /> {contact.phone}
                      {contact.email && (
                        <>
                          <span style={{ margin: '0 0.2rem' }}>•</span>
                          <Mail size={13} /> {contact.email}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button onClick={() => openEditModal(contact)} className="btn btn-secondary btn-sm" style={{ padding: '0.3rem 0.55rem' }} title="Edit Contact">
                    <Edit2 size={13} />
                  </button>
                  <button onClick={() => handleDeleteContact(contact._id)} className="btn btn-secondary btn-sm" style={{ padding: '0.3rem 0.55rem', color: '#E02424' }} title="Delete Contact">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Status and Last CheckIn */}
              <div style={{
                background: 'var(--bg-card-inset)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Network Link:</span>
                  <span style={{ fontWeight: 700, color: isLinked ? '#0E9F6E' : '#D97706' }}>
                    {isLinked ? '● Connected Member' : '○ Pending Member'}
                  </span>
                </div>

                {lastCheckIn?.type && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Latest Status:</span>
                    <span style={{ fontWeight: 700, color: lastCheckIn.type === 'safe' ? '#0E9F6E' : '#E02424' }}>
                      {lastCheckIn.message || (lastCheckIn.type === 'safe' ? 'Safe' : 'Needs Help')}
                    </span>
                  </div>
                )}
              </div>

              {/* Emergency Notify Switch */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.45rem', borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                  Dispatch SOS to this contact:
                </span>
                <button
                  onClick={() => handleToggleEmergencyNotify(contact)}
                  style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: 'var(--radius-full)',
                    background: contact.notifyInEmergency ? '#DEF7EC' : '#F3F4F6',
                    color: contact.notifyInEmergency ? '#03543F' : '#6B7280',
                    border: `1px solid ${contact.notifyInEmergency ? '#31C48D' : '#D1D5DB'}`,
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {contact.notifyInEmergency ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {contacts.length === 0 && !loading && (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
          <Users size={44} style={{ margin: '0 auto 1rem auto', opacity: 0.4 }} />
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No Trusted Contacts Added Yet</h3>
          <p style={{ maxWidth: '420px', margin: '0 auto 1.5rem auto', fontSize: '0.88rem' }}>
            Add family members or neighbors so they receive your GPS coordinates and status whenever you trigger an SOS.
          </p>
          <button
            onClick={() => {
              setEditingContact(null);
              setFormData({ name: '', relationship: 'Family', phone: '', email: '', notifyInEmergency: true });
              setShowAddModal(true);
            }}
            className="btn btn-primary"
          >
            <UserPlus size={16} /> Add First Beneficiary
          </button>
        </div>
      )}

      {/* Add / Edit Contact Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="card-header">
              <h3 className="card-title">
                <UserPlus size={20} color="#FF4800" />
                {editingContact ? 'Edit Contact Details' : 'Add Trusted Beneficiary'}
              </h3>
            </div>

            <form onSubmit={handleSaveContact}>
              <div className="form-group">
                <label className="form-label" htmlFor="cName">Full Name *</label>
                <input
                  id="cName"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Priya Sharma"
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="cRel">Relationship</label>
                  <select
                    id="cRel"
                    value={formData.relationship}
                    onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                  >
                    {relationships.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="cPhone">Phone Number *</label>
                  <input
                    id="cPhone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="cEmail">Email Address (Optional)</label>
                <input
                  id="cEmail"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="family@member.net"
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.notifyInEmergency}
                    onChange={(e) => setFormData({ ...formData, notifyInEmergency: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: '#FF4800' }}
                  />
                  <span style={{ fontSize: '0.86rem', fontWeight: 600 }}>
                    Automatically notify this contact during emergency SOS
                  </span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingContact ? 'Save Changes' : 'Register Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
