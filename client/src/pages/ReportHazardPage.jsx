import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  MapPin,
  Camera,
  AlertTriangle,
  CheckCircle,
  Navigation,
  ArrowRight,
  ShieldAlert,
  Info
} from 'lucide-react';
import { HazardMap } from '../components/HazardMap.jsx';
import { useLocation } from '../context/LocationContext.jsx';
import { useOffline } from '../context/OfflineContext.jsx';
import { api } from '../services/api.js';
import { enqueueOfflineAction } from '../services/offlineQueue.js';

export const ReportHazardPage = () => {
  const { coords, requestLocation } = useLocation();
  const { isOnline } = useOffline();
  const navigate = useNavigate();

  const [category, setCategory] = useState('Accident');
  const [severity, setSeverity] = useState('Medium');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [pinnedLocation, setPinnedLocation] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [duplicates, setDuplicates] = useState([]);
  const [checkingDups, setCheckingDups] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const categories = [
    'Accident',
    'Fire or Smoke',
    'Flooding or Severe Weather',
    'Blocked or Unsafe Road',
    'Violence or Public Safety',
    'Medical Emergency',
    'Other Hazard'
  ];

  // Set initial pin from GPS if available
  useEffect(() => {
    if (coords && !pinnedLocation) {
      setPinnedLocation({ lat: coords.lat, lng: coords.lng });
      setAddress(`GPS Point (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`);
    }
  }, [coords]);

  // Check for potential duplicate reports
  useEffect(() => {
    const loc = pinnedLocation || coords;
    if (loc?.lat && loc?.lng && category) {
      checkPossibleDuplicates(category, loc.lat, loc.lng);
    }
  }, [category, pinnedLocation]);

  const checkPossibleDuplicates = async (cat, lat, lng) => {
    setCheckingDups(true);
    try {
      const data = await api.checkDuplicates({
        category: cat,
        lat,
        lng
      });
      if (data.success && data.potentialDuplicates) {
        setDuplicates(data.potentialDuplicates);
      }
    } catch (e) {
      console.warn('Duplicate check notice:', e.message);
    } finally {
      setCheckingDups(false);
    }
  };

  const handleMapPin = (point) => {
    setPinnedLocation(point);
    setAddress(`Map Pin (${point.lat.toFixed(4)}, ${point.lng.toFixed(4)})`);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Photo must be less than 2MB in size.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const loc = pinnedLocation || coords;
    if (!loc || !loc.lat || !loc.lng) {
      setError('Please tap on the map or allow GPS to pinpoint the hazard location.');
      return;
    }

    const payload = {
      category,
      severity,
      description,
      location: {
        lat: loc.lat,
        lng: loc.lng,
        address: address || 'Community pinned point'
      },
      photoUrl: photoPreview || ''
    };

    if (!isOnline) {
      enqueueOfflineAction({
        type: 'hazard_report',
        payload
      });
      alert('You are currently offline. Your hazard report has been securely saved locally and will auto-dispatch to the Safety Radar the moment your connection restores.');
      navigate('/app/map');
      return;
    }

    setSubmitting(true);
    try {
      await api.createHazard(payload);

      alert('Hazard report submitted! Broadcasted to local Safety Radar with automatic corroboration engine.');
      navigate('/app/map');
    } catch (err) {
      if (err.isOffline) {
        enqueueOfflineAction({
          type: 'hazard_report',
          payload
        });
        alert('Network unreachable. Your hazard report has been queued locally and will automatically synchronize once online.');
        navigate('/app/map');
      } else {
        setError(err.message || 'Submission failed.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ maxWidth: '820px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
          <PlusCircle size={24} color="#FF4800" /> Report Hazard to Safety Radar
        </h1>
        <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
          Alert local citizens and emergency responders about imminent dangers, road blocks, or severe weather.
        </p>
      </div>

      {error && (
        <div style={{
          background: '#FDE8E8',
          border: '1px solid #F8B4B4',
          borderRadius: 'var(--radius-sm)',
          padding: '0.75rem 1rem',
          marginBottom: '1.25rem',
          color: '#9B1C1C',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Duplicate Warning Alert if nearby match exists */}
      {duplicates.length > 0 && (
        <div style={{
          background: '#FEF3C7',
          border: '1px solid rgba(217, 119, 6, 0.35)',
          borderRadius: 'var(--radius-sm)',
          padding: '1rem',
          marginBottom: '1.5rem',
          color: '#92400E'
        }}>
          <div style={{ fontWeight: 700, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
            <AlertTriangle size={16} color="#D97706" /> Potential Duplicate Hazard Detected Nearby
          </div>
          <p style={{ fontSize: '0.84rem', marginBottom: '0.4rem', lineHeight: 1.4 }}>
            There is already an active report for <strong>{duplicates[0].category}</strong> approximately {duplicates[0].distanceMeters}m away: "{duplicates[0].description}"
          </p>
          <div style={{ fontSize: '0.78rem', color: '#78350F' }}>
            Tip: Submitting will automatically corroborate the existing cluster via our transparent proximity engine.
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card" style={{ padding: '1.75rem' }}>
        {/* Category */}
        <div className="form-group">
          <label className="form-label">Hazard Category *</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '0.5rem' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  background: category === cat ? '#FFF5F0' : '#FFFFFF',
                  border: `1px solid ${category === cat ? '#FF4800' : 'var(--border-medium)'}`,
                  color: category === cat ? '#FF4800' : 'var(--text-primary)',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Severity */}
        <div className="form-group">
          <label className="form-label">Severity Level</label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Low', color: '#1C64F2', bg: '#E1EFFE' },
              { label: 'Medium', color: '#D97706', bg: '#FEF3C7' },
              { label: 'High', color: '#F97316', bg: '#FFEDD5' },
              { label: 'Critical', color: '#E02424', bg: '#FDE8E8' }
            ].map((sev) => {
              const isSelected = severity === sev.label;
              return (
                <button
                  key={sev.label}
                  type="button"
                  onClick={() => setSeverity(sev.label)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: 'var(--radius-full)',
                    background: isSelected ? sev.bg : '#FFFFFF',
                    border: `1px solid ${isSelected ? sev.color : 'var(--border-medium)'}`,
                    color: isSelected ? sev.color : 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {sev.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Description */}
        <div className="form-group">
          <label className="form-label" htmlFor="hazardDesc">
            Description of Situation *
          </label>
          <textarea
            id="hazardDesc"
            required
            rows="3"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what happened, depth of water, blocked lanes, or immediate risks..."
          />
        </div>

        {/* Location Picker Map */}
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label className="form-label" style={{ margin: 0 }}>
              Pinpoint Location on Map *
            </label>
            <button
              type="button"
              onClick={requestLocation}
              className="btn btn-secondary btn-sm"
              style={{ padding: '0.2rem 0.65rem', fontSize: '0.75rem' }}
            >
              <Navigation size={13} color="#FF4800" /> Use Current GPS
            </button>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            Tap or click on the map to place an exact pin at the incident location.
          </p>

          <div style={{ border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-md)', overflow: 'hidden', height: '280px', position: 'relative' }}>
            <HazardMap
              hazards={pinnedLocation ? [{
                _id: 'temp_pin',
                category,
                severity,
                description: 'Selected location for new report',
                location: pinnedLocation,
                status: 'Draft Pin'
              }] : []}
              userLocation={coords}
              center={pinnedLocation ? [pinnedLocation.lat, pinnedLocation.lng] : (coords ? [coords.lat, coords.lng] : [12.9716, 77.5946])}
              zoom={14}
              onMapClick={handleMapPin}
              height="280px"
            />
          </div>

          <div style={{ marginTop: '0.65rem' }}>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Landmark, road name, or area..."
              style={{ fontSize: '0.86rem' }}
            />
          </div>
        </div>

        {/* Optional Photo */}
        <div className="form-group">
          <label className="form-label">Attach Photo (Optional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            style={{ fontSize: '0.85rem', padding: '0.5rem' }}
          />
          {photoPreview && (
            <div style={{ marginTop: '0.75rem' }}>
              <img
                src={photoPreview}
                alt="Hazard preview"
                style={{ maxWidth: '100%', maxHeight: '180px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)' }}
              />
            </div>
          )}
          <span className="form-help">Max 2MB. Preview encoded and synchronized locally or sent to server.</span>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn btn-primary btn-lg"
          style={{ width: '100%', marginTop: '0.75rem', fontWeight: 800 }}
        >
          {submitting ? 'Submitting to Safety Radar...' : 'Submit Community Hazard Report'} <ArrowRight size={16} />
        </button>
      </form>
    </div>
  );
};
