import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const LocationContext = createContext(null);

export const LocationProvider = ({ children }) => {
  const [coords, setCoords] = useState(null); // { lat, lng, accuracy, timestamp }
  const [status, setStatus] = useState('idle'); // 'idle' | 'locating' | 'granted' | 'denied' | 'unavailable'
  const [errorMessage, setErrorMessage] = useState(null);

  const requestLocation = useCallback(() => {
    return new Promise((resolve) => {
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
        async (error) => {
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

          // Fallback to IP geolocation if GPS is unavailable/denied so map is at least in device's region
          try {
            const res = await fetch('https://ipapi.co/json/');
            if (res.ok) {
              const data = await res.json();
              if (data.latitude && data.longitude) {
                const ipCoords = {
                  lat: data.latitude,
                  lng: data.longitude,
                  accuracy: 5000,
                  timestamp: new Date().toISOString(),
                  city: data.city,
                  region: data.region
                };
                setCoords(ipCoords);
                setStatus('granted');
                return resolve(ipCoords);
              }
            }
          } catch {
            // ignore ip fallback failure
          }
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 10000
        }
      );
    });
  }, []);

  // Automatically acquire device live location on mount and watch continuous position updates
  useEffect(() => {
    requestLocation();

    let watchId = null;
    if ('geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          setCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: Math.round(position.coords.accuracy),
            timestamp: new Date(position.timestamp).toISOString()
          });
          setStatus('granted');
        },
        () => {},
        {
          enableHighAccuracy: true,
          maximumAge: 5000
        }
      );
    }

    return () => {
      if (watchId !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [requestLocation]);

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
