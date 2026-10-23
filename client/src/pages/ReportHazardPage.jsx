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
  ShieldAlert
} from 'lucide-react';
import { HazardMap } from '../components/HazardMap.jsx';
import { useLocation } from '../context/LocationContext.jsx';
import { api } from '../services/api.js';

export const ReportHazardPage = () => {
  const { coords, requestLocation } = useLocation();
  const navigate = useNavigate();

  const [category, setCategory] = useState('Accident');
  const [severity, setSeverity] = useState('Medium');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [pinnedLocation, setPinnedLocation] = useState(null); // { lat, lng }
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

  // Check for potential duplicate reports whenever category or location changes
  useEffect(() => {
    const loc = pinnedLocation || coords;
    if (loc?.lat && loc?.lng && category) {
      checkPossibleDuplicates(category, loc.lat, loc.lng);
    }
  }, [category, pinnedLocation]);

  const checkPossibleDuplicates = async (cat, lat, lng) => {
    setCheckingDups(true);
    try {
      const data = await api.checkDuplicates(`category=${encodeURIComponent(cat)}&lat=${lat}&lng=${lng}`);
      if (data.success && data.potentialDuplicates) {
        setDuplicates(data.potentialDuplicates);
      }
    } catch (e) {
      console.warn('Duplicate check error:', e.message);
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

    setSubmitting(true);
    try {
      await api.createHazard({
        category,
        severity,
        description,
        location: {
          lat: loc.lat,
          lng: loc.lng,
          address: address || 'Community pinned point'
        },
        photoUrl: photoPreview || ''
      });

      alert('Hazard report submitted! Broadcasted to local Safety Radar with automatic corroboration engine.');
      navigate('/app/map');
    } catch (err) {
      setError(err.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ maxWidth: '820px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <PlusCircle size={24} color="var(--brand-blue)" /> Report Hazard to Safety Radar
        </h1>
        <p style={{ fontSize: '0.875rem' }}>
          Alert local citizens and emergency responders about imminent dangers, road blocks, or severe weather.
        </p>
      </div>

      {error && (
        <div style={{
          background: 'var(--color-danger-bg)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '0.75rem 1rem',
          marginBottom: '1.25rem',
          color: '#FCA5A5',
          fontSize: '0.85rem'
        }}>
          {error}
        </div>
      )}

      {/* Duplicate Warning Alert if nearby match exists */}
      {duplicates.length > 0 && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.15)',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem',
          marginBottom: '1.5rem',
          color: '#FDE68A'
        }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
            <AlertTriangle size={18} color="#F59E0B" /> Potential Duplicate Hazard Detected Nearby
          </div>
          <p style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
            There is already an active report for <strong>{duplicates[0].category}</strong> approximately {duplicates[0].distanceMeters}m away: "{duplicates[0].description}"
          </p>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
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
                  padding: '0.65rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  background: category === cat ? 'rgba(58, 134, 255, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${category === cat ? 'var(--brand-blue)' : 'var(--border-subtle)'}`,
                  color: category === cat ? '#93C5FD' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  textAlign: 'left'
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
            {['Low', 'Medium', 'High', 'Critical'].map((sev) => {
              const isSelected = severity === sev;
              const sevColors = {
                Critical: 'var(--sos-red)',
                High: '#F97316',
                Medium: '#EAB308',
                Low: '#3B82F6'
              };
              return (
                <button
                  key={sev}
                  type="button"
                  onClick={() => setSeverity(sev)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: 'var(--radius-full)',
                    background: isSelected ? `${sevColors[sev]}25` : 'rgba(255, 255, 255, 0.04)',
                    border: `1px solid ${isSelected ? sevColors[sev] : 'var(--border-subtle)'}`,
                    color: isSelected ? sevColors[sev] : 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '0.85rem'
                  }}
                >
                  {sev}
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
          ></textarea>
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
              style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
            >
              <Navigation size={13} /> Use Current GPS
            </button>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            Tap or click on the map to place an exact pin at the incident location.
          </p>

          <div style={{ border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', height: '280px', position: 'relative' }}>
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

          <div style={{ marginTop: '0.5rem' }}>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Landmark, road name, or area..."
              style={{ fontSize: '0.85rem' }}
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
                style={{ maxWidth: '100%', maxHeight: '180px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-medium)' }}
              />
            </div>
          )}
          <span className="form-help">Max 2MB. Stored locally or forwarded as secure base64 preview.</span>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn btn-primary btn-lg"
          style={{ width: '100%', marginTop: '1rem' }}
        >
          {submitting ? 'Submitting to Safety Radar...' : 'Submit Community Hazard Report'} <ArrowRight size={16} />
        </button>
      </form>
    </div>
  );
};
