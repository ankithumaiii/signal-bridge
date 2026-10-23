import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

export const HazardMap = ({
  hazards = [],
  userLocation = null,
  center = [12.9716, 77.5946],
  zoom = 13,
  onMapClick = null,
  onCorroborate = null,
  onSelectHazard = null,
  height = '480px'
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const userMarkerRef = useRef(null);
  const accuracyCircleRef = useRef(null);

  // Initialize map once
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const initialCenter = userLocation?.lat && userLocation?.lng
      ? [userLocation.lat, userLocation.lng]
      : center;

    const initialZoom = userLocation?.lat && userLocation?.lng ? 15 : zoom;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: true
    });

    // Clean OpenStreetMap tiles (free, reliable, no watermark)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    // Handle map click if provided
    if (onMapClick) {
      map.on('click', (e) => {
        onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
      });
    }

    // Invalidate size once DOM layout is settled
    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 250);

    let resizeObserver = null;
    if (window.ResizeObserver && mapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      clearTimeout(timer);
      if (resizeObserver) resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update User Location Marker & automatically fly to device's live coordinates
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }
    if (accuracyCircleRef.current) {
      accuracyCircleRef.current.remove();
      accuracyCircleRef.current = null;
    }

    if (userLocation && userLocation.lat !== null && userLocation.lng !== null) {
      const latLng = [userLocation.lat, userLocation.lng];

      // Draw device GPS accuracy radius if available
      if (userLocation.accuracy && userLocation.accuracy > 0 && userLocation.accuracy < 5000) {
        accuracyCircleRef.current = L.circle(latLng, {
          radius: userLocation.accuracy,
          color: '#FF4800',
          fillColor: '#FF4800',
          fillOpacity: 0.1,
          weight: 1.5,
          dashArray: '4, 4'
        }).addTo(map);
      }

      const userIcon = L.divIcon({
        className: 'user-location-pin',
        html: `
          <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: rgba(255, 72, 0, 0.3); animation: pulse-ring 2s infinite ease-out;"></div>
            <div style="width: 18px; height: 18px; background: #FF4800; border: 3px solid #FFFFFF; border-radius: 50%; box-shadow: 0 0 14px rgba(255, 72, 0, 0.9); z-index: 2;"></div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      userMarkerRef.current = L.marker(latLng, { icon: userIcon, zIndexOffset: 1000 })
        .addTo(map)
        .bindPopup(`
          <div style="padding: 4px; font-family: 'Plus Jakarta Sans', sans-serif;">
            <div style="font-weight: 800; color: #FF4800; font-size: 0.85rem; margin-bottom: 2px;">
              📍 Active Device Live Location
            </div>
            <div style="font-size: 0.75rem; color: #4B5563;">
              ${userLocation.lat.toFixed(5)}, ${userLocation.lng.toFixed(5)}
              ${userLocation.accuracy ? ` (±${userLocation.accuracy}m)` : ''}
            </div>
            <div style="font-size: 0.7rem; color: #059669; font-weight: 700; margin-top: 4px;">
              ● Real-time GPS Telemetry Active
            </div>
          </div>
        `);

      // Automatically center and fly map directly to active device coordinates
      map.flyTo(latLng, Math.max(map.getZoom(), 15), {
        animate: true,
        duration: 1.0
      });
    }
  }, [userLocation]);

  // Update Hazard Markers
  useEffect(() => {
    if (!markersLayerRef.current || !mapInstanceRef.current) return;
    const markersLayer = markersLayerRef.current;
    markersLayer.clearLayers();

    hazards.forEach((hazard) => {
      if (!hazard.location?.lat || !hazard.location?.lng) return;

      const severityColors = {
        Critical: '#EF4444',
        High: '#F97316',
        Medium: '#F59E0B',
        Low: '#38BDF8'
      };

      const color = severityColors[hazard.severity] || '#EF4444';

      const hazardIcon = L.divIcon({
        className: 'hazard-pin',
        html: `
          <div style="
            background: ${color};
            width: 28px;
            height: 28px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid #080D1A;
            box-shadow: 0 4px 12px rgba(0,0,0,0.8), 0 0 12px ${color}66;
          ">
            <div style="
              width: 8px;
              height: 8px;
              background: #FFFFFF;
              border-radius: 50%;
              transform: rotate(45deg);
            "></div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -28]
      });

      const popupContent = document.createElement('div');
      popupContent.style.minWidth = '240px';
      popupContent.style.padding = '0.35rem';
      popupContent.innerHTML = `
        <div style="font-weight: 800; font-size: 1rem; margin-bottom: 0.35rem; color: #111928; letter-spacing: -0.01em;">
          ${hazard.category}
        </div>
        <div style="display: flex; gap: 0.4rem; margin-bottom: 0.5rem;">
          <span style="background: ${color}15; color: ${color}; font-size: 0.72rem; font-weight: 700; padding: 0.15rem 0.5rem; border-radius: 99px; border: 1px solid ${color}44;">
            ${hazard.severity}
          </span>
          <span style="background: #F3F4F6; color: #4B5563; font-size: 0.72rem; font-weight: 600; padding: 0.15rem 0.5rem; border-radius: 99px;">
            ${hazard.status}
          </span>
        </div>
        <p style="font-size: 0.85rem; color: #4B5563; margin-bottom: 0.65rem; line-height: 1.4;">
          ${hazard.description}
        </p>
        <div style="font-size: 0.78rem; color: #6B7280; margin-bottom: 0.65rem; display: flex; align-items: center; gap: 0.3rem;">
          📍 ${hazard.location.address || 'Reported Geolocation'}
        </div>
        <div style="font-size: 0.75rem; color: #9A2C00; margin-bottom: 0.65rem; background: #FFF5F0; border: 1px solid rgba(255, 72, 0, 0.25); padding: 0.45rem; border-radius: 6px;">
          ℹ ${hazard.verificationReason || 'Community verified report.'}
        </div>
      `;

      if (onCorroborate && hazard.status !== 'Resolved') {
        const btn = document.createElement('button');
        btn.innerText = `Corroborate (${hazard.corroborationCount || 1})`;
        btn.style.cssText = `
          width: 100%;
          background: #FF4800;
          color: #FFFFFF;
          border: none;
          padding: 0.5rem;
          border-radius: 6px;
          font-weight: 700;
          font-size: 0.82rem;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(255, 72, 0, 0.3);
          transition: background 0.15s ease;
        `;
        btn.onmouseover = () => { btn.style.background = '#E03E00'; };
        btn.onmouseout = () => { btn.style.background = '#FF4800'; };
        btn.onclick = () => onCorroborate(hazard._id);
        popupContent.appendChild(btn);
      }

      const marker = L.marker([hazard.location.lat, hazard.location.lng], { icon: hazardIcon })
        .addTo(markersLayer)
        .bindPopup(popupContent);

      if (onSelectHazard) {
        marker.on('click', () => onSelectHazard(hazard));
      }
    });
  }, [hazards, onCorroborate, onSelectHazard]);

  const handleRecenter = () => {
    if (userLocation?.lat && userLocation?.lng && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([userLocation.lat, userLocation.lng], 16, {
        animate: true,
        duration: 0.8
      });
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%', borderRadius: 'var(--radius-lg)' }} />

      {/* Floating Re-center to Live Device Button */}
      {userLocation?.lat && userLocation?.lng && (
        <button
          type="button"
          onClick={handleRecenter}
          title="Center map on your active device location"
          style={{
            position: 'absolute',
            bottom: '16px',
            right: '16px',
            zIndex: 1000,
            background: '#FFFFFF',
            border: '1.5px solid #FF4800',
            color: '#FF4800',
            padding: '0.45rem 0.85rem',
            borderRadius: '9999px',
            fontSize: '0.78rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.16)',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#FFF5F0'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; }}
        >
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FF4800', display: 'inline-block' }} />
          <span>Active Device Location</span>
        </button>
      )}

      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(0.6); opacity: 0.9; }
          70% { transform: scale(1.6); opacity: 0; }
          100% { transform: scale(1.6); opacity: 0; }
        }
      `}</style>
    </div>
  );
};
