import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

const LocationContext = createContext(null);

const DEFAULT_COORDS = {
  lat: 12.9716,
  lng: 77.5946,
  accuracy: 100,
  timestamp: new Date().toISOString()
};

export const LocationProvider = ({ children }) => {
  const [coords, setCoords] = useState(DEFAULT_COORDS);
  const [status, setStatus] = useState('idle'); // 'idle' | 'locating' | 'granted' | 'denied' | 'unavailable'
  const [errorMessage, setErrorMessage] = useState(null);
  const coordsRef = useRef(DEFAULT_COORDS);

  const requestLocation = useCallback(() => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !('geolocation' in navigator)) {
        setStatus('unavailable');
        return resolve(coordsRef.current);
      }

      setStatus('locating');

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCoords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: Math.round(position.coords.accuracy || 20),
            timestamp: new Date(position.timestamp || Date.now()).toISOString()
          };
          coordsRef.current = newCoords;
          setCoords(newCoords);
          setStatus('granted');
          resolve(newCoords);
        },
        (error) => {
          let errText = 'Location permission was not granted. Using default region.';
          if (error.code === 1) { // PERMISSION_DENIED
            setStatus('denied');
          } else if (error.code === 2) { // POSITION_UNAVAILABLE
            setStatus('unavailable');
            errText = 'GPS signal is currently unavailable.';
          } else if (error.code === 3) { // TIMEOUT
            setStatus('timeout');
            errText = 'Location request timed out. Using default map center.';
          }
          setErrorMessage(errText);
          resolve(coordsRef.current);
        },
        {
          enableHighAccuracy: false,
          timeout: 4000,
          maximumAge: 60000
        }
      );
    });
  }, []);

  // Request location once smoothly on mount when entering authenticated app
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  return (
    <LocationContext.Provider
      value={{
        coords,
        status,
        errorMessage,
        requestLocation,
        setManualCoords: (manual) => {
          coordsRef.current = manual;
          setCoords(manual);
          setStatus('granted');
        }
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

const FALLBACK_LOCATION = {
  coords: DEFAULT_COORDS,
  status: 'idle',
  errorMessage: null,
  requestLocation: async () => DEFAULT_COORDS,
  setManualCoords: () => {}
};

export const useLocation = () => {
  const ctx = useContext(LocationContext);
  return ctx || FALLBACK_LOCATION;
};
