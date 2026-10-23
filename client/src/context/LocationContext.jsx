import React, { createContext, useContext, useState, useCallback } from 'react';

const LocationContext = createContext(null);

export const LocationProvider = ({ children }) => {
  const [coords, setCoords] = useState(null); // { lat, lng, accuracy, timestamp }
  const [status, setStatus] = useState('idle'); // 'idle' | 'locating' | 'granted' | 'denied' | 'unavailable'
  const [errorMessage, setErrorMessage] = useState(null);

  const requestLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        setStatus('unavailable');
        setErrorMessage('Geolocation is not supported by your browser.');
        return resolve(null);
      }

      setStatus('locating');
      setErrorMessage(null);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCoords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: Math.round(position.coords.accuracy),
            timestamp: new Date(position.timestamp).toISOString()
          };
          setCoords(newCoords);
          setStatus('granted');
          resolve(newCoords);
        },
        (error) => {
          let errText = 'Failed to acquire location.';
          if (error.code === error.PERMISSION_DENIED) {
            setStatus('denied');
            errText = 'Location permission was denied. You can still pinpoint location manually on the map.';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            setStatus('unavailable');
            errText = 'GPS signal is currently unavailable.';
          } else if (error.code === error.TIMEOUT) {
            setStatus('timeout');
            errText = 'Location request timed out.';
          }
          setErrorMessage(errText);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000
        }
      );
    });
  }, []);

  return (
    <LocationContext.Provider
      value={{
        coords,
        status,
        errorMessage,
        requestLocation,
        setManualCoords: (manual) => {
          setCoords(manual);
          setStatus('granted');
        }
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => useContext(LocationContext);
