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
  Navigation
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={24} color="var(--brand-blue)" /> Trusted Family & Safety Circle
          </h1>
          <p style={{ fontSize: '0.875rem' }}>
            Manage who receives emergency alerts and exchange voluntary check-ins
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
          <UserPlus size={16} /> Add Trusted Contact
        </button>
      </div>

      {checkInMsg && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          borderRadius: 'var(--radius-md)',
          padding: '0.65rem 1rem',
          marginBottom: '1rem',
          fontSize: '0.85rem',
          color: '#6EE7B7'
        }}>
          {checkInMsg}
        </div>
      )}

      {/* Voluntary Consent-Based Location Sharing Card */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem', background: 'rgba(28, 37, 65, 0.9)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#FFFFFF' }}>
              <Share2 size={18} color="var(--brand-blue)" /> Consent-Based Temporary Location Sharing
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Opt-in only. Your location is shared with family members exclusively for the duration you specify, and can be revoked at any time.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {!isLocationSharingActive ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <select
                  value={locationSharingHours}
                  onChange={(e) => setLocationSharingHours(Number(e.target.value))}
                  style={{ width: '110px', padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
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
                <span className="badge badge-corroborated" style={{ padding: '0.4rem 0.75rem' }}>
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
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#FFFFFF' }}>
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
            style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34D399', borderColor: 'rgba(16, 185, 129, 0.4)' }}
          >
            <CheckCircle size={15} /> "I'm Safe"
          </button>
          <button
            onClick={() => handleSendCheckIn('need_help')}
            className="btn btn-outline-danger btn-sm"
          >
            <AlertTriangle size={15} /> "I Need Help"
          </button>
        </div>
      </div>

      {/* Contact Cards Grid */}
      <div className="grid-2">
        {contacts.map((contact) => {
          const isLinked = contact.status === 'connected';
          const lastCheckIn = contact.lastCheckInReceived;

          return (
            <div key={contact._id} className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.05rem', color: '#FFFFFF' }}>{contact.name}</h3>
                    <span className="badge badge-multiple" style={{ fontSize: '0.7rem' }}>
                      {contact.relationship}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <Phone size={13} /> {contact.phone}
                    {contact.email && (
                      <>
                        <span style={{ margin: '0 0.2rem' }}>•</span>
                        <Mail size={13} /> {contact.email}
                      </>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button onClick={() => openEditModal(contact)} className="btn btn-secondary btn-sm" style={{ padding: '0.3rem 0.5rem' }}>
                    <Edit2 size={13} />
                  </button>
                  <button onClick={() => handleDeleteContact(contact._id)} className="btn btn-secondary btn-sm" style={{ padding: '0.3rem 0.5rem', color: 'var(--sos-red)' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Status and Last CheckIn */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '0.65rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Connection:</span>
                  <span style={{ fontWeight: 600, color: isLinked ? 'var(--color-success)' : 'var(--color-warning)' }}>
                    {isLinked ? '● Connected Member' : '○ Invited (SMS/App link)'}
                  </span>
                </div>

                {lastCheckIn?.type && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Latest Check-In:</span>
                    <span style={{ fontWeight: 600, color: lastCheckIn.type === 'safe' ? '#34D399' : '#F87171' }}>
                      {lastCheckIn.message || (lastCheckIn.type === 'safe' ? 'Safe' : 'Needs Help')}
                    </span>
                  </div>
                )}
              </div>

              {/* Emergency Notify Switch */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.35rem', borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Dispatch SOS to this contact:
                </span>
                <button
                  onClick={() => handleToggleEmergencyNotify(contact)}
                  style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: 'var(--radius-full)',
                    background: contact.notifyInEmergency ? 'rgba(230, 57, 70, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                    color: contact.notifyInEmergency ? '#FF6B6B' : 'var(--text-muted)',
                    border: `1px solid ${contact.notifyInEmergency ? 'rgba(230, 57, 70, 0.4)' : 'var(--border-subtle)'}`,
                    fontSize: '0.75rem',
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
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
          <Users size={40} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
          <h3>No Trusted Contacts Added Yet</h3>
          <p style={{ maxWidth: '400px', margin: '0.5rem auto 1.5rem auto' }}>
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
            <UserPlus size={16} /> Add First Contact
          </button>
        </div>
      )}

      {/* Add / Edit Contact Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="card-header">
              <h3 className="card-title">
                <UserPlus size={20} color="var(--brand-blue)" />
                {editingContact ? 'Edit Contact' : 'Add Trusted Contact'}
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
                    style={{ width: '18px', height: '18px' }}
                  />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
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
                  {editingContact ? 'Save Changes' : 'Add Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
