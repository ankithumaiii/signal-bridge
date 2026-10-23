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

  // Initialize map once
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const initialCenter = userLocation?.lat && userLocation?.lng
      ? [userLocation.lat, userLocation.lng]
      : center;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom,
      zoomControl: true
    });

    // Dark-styled OSM CartoDB Dark Matter or Standard OSM tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
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

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update User Location Marker
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (userLocation && userLocation.lat !== null && userLocation.lng !== null) {
      const userIcon = L.divIcon({
        className: 'user-location-pin',
        html: `
          <div style="
            width: 20px;
            height: 20px;
            background: #3A86FF;
            border: 3px solid #FFFFFF;
            border-radius: 50%;
            box-shadow: 0 0 12px rgba(58, 134, 255, 0.8);
            animation: pulse-user 1.8s infinite;
          "></div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .addTo(map)
        .bindPopup('<strong style="color: #3A86FF">Your Current Location</strong>');
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
        Critical: '#E63946',
        High: '#F97316',
        Medium: '#EAB308',
        Low: '#3B82F6'
      };

      const color = severityColors[hazard.severity] || '#E63946';

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
            border: 2px solid #FFFFFF;
            box-shadow: 0 3px 10px rgba(0,0,0,0.5);
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
      popupContent.style.minWidth = '220px';
      popupContent.style.padding = '0.2rem';
      popupContent.innerHTML = `
        <div style="font-weight: 700; font-size: 0.95rem; margin-bottom: 0.25rem; color: #FFFFFF;">
          ${hazard.category}
        </div>
        <div style="display: flex; gap: 0.4rem; margin-bottom: 0.5rem;">
          <span style="background: ${color}25; color: ${color}; font-size: 0.7rem; font-weight: 700; padding: 0.15rem 0.45rem; border-radius: 99px;">
            ${hazard.severity}
          </span>
          <span style="background: rgba(255,255,255,0.1); color: #CBD5E1; font-size: 0.7rem; padding: 0.15rem 0.45rem; border-radius: 99px;">
            ${hazard.status}
          </span>
        </div>
        <p style="font-size: 0.85rem; color: #E2E8F0; margin-bottom: 0.5rem; line-height: 1.35;">
          ${hazard.description}
        </p>
        <div style="font-size: 0.75rem; color: #94A3B8; margin-bottom: 0.65rem;">
          📍 ${hazard.location.address || 'Reported Location'}
        </div>
        <div style="font-size: 0.72rem; color: #38BDF8; margin-bottom: 0.65rem; background: rgba(56, 189, 248, 0.08); padding: 0.4rem; border-radius: 4px;">
          ℹ ${hazard.verificationReason || 'Community verified report.'}
        </div>
      `;

      if (onCorroborate && hazard.status !== 'Resolved') {
        const btn = document.createElement('button');
        btn.innerText = `Corroborate (${hazard.corroborationCount || 1})`;
        btn.style.cssText = `
          width: 100%;
          background: #3A86FF;
          color: white;
          border: none;
          padding: 0.4rem;
          border-radius: 6px;
          font-weight: 600;
          font-size: 0.8rem;
          cursor: pointer;
        `;
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

  return (
    <div style={{ position: 'relative', width: '100%', height }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%', borderRadius: 'var(--radius-lg)' }} />

      <style>{`
        @keyframes pulse-user {
          0% { box-shadow: 0 0 0 0 rgba(58, 134, 255, 0.7); }
          70% { box-shadow: 0 0 0 14px rgba(58, 134, 255, 0); }
          100% { box-shadow: 0 0 0 0 rgba(58, 134, 255, 0); }
        }
      `}</style>
    </div>
  );
};
