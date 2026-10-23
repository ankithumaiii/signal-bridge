import React, { useState, useRef, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

export const SOSButton = ({ onTrigger, disabled = false, size = 'large' }) => {
  const [progress, setProgress] = useState(0); // 0 to 100
  const [isPressing, setIsPressing] = useState(false);
  const timerRef = useRef(null);
  const intervalRef = useRef(null);

  const HOLD_DURATION_MS = 2000;
  const TICK_INTERVAL_MS = 50;

  const startPress = (e) => {
    if (disabled) return;
    if (e.cancelable) e.preventDefault();

    setIsPressing(true);
    setProgress(0);

    const startTime = Date.now();

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / HOLD_DURATION_MS) * 100));
      setProgress(pct);

      if (elapsed >= HOLD_DURATION_MS) {
        clearInterval(intervalRef.current);
        clearTimeout(timerRef.current);
        setIsPressing(false);
        setProgress(100);
        // Haptic feedback if supported by browser/phone
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([200, 100, 300]);
        }
        onTrigger();
      }
    }, TICK_INTERVAL_MS);
  };

  const cancelPress = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsPressing(false);
    setProgress(0);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const buttonDimension = size === 'large' ? '180px' : '120px';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.85rem' }}>
      <div
        style={{
          position: 'relative',
          width: buttonDimension,
          height: buttonDimension,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          userSelect: 'none',
          WebkitUserSelect: 'none'
        }}
      >
        {/* Circular Progress Ring */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            transform: 'rotate(-90deg)',
            pointerEvents: 'none'
          }}
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke="rgba(230, 57, 70, 0.2)"
            strokeWidth="6"
          />
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="6"
            strokeDasharray="289"
            strokeDashoffset={289 - (289 * progress) / 100}
            strokeLinecap="round"
            style={{ transition: isPressing ? 'none' : 'stroke-dashoffset 0.15s ease' }}
          />
        </svg>

        {/* SOS Central Button */}
        <button
          type="button"
          onMouseDown={startPress}
          onMouseUp={cancelPress}
          onMouseLeave={cancelPress}
          onTouchStart={startPress}
          onTouchEnd={cancelPress}
          onTouchCancel={cancelPress}
          disabled={disabled}
          aria-label="Press and hold for 2 seconds to activate emergency SOS"
          style={{
            width: 'calc(100% - 20px)',
            height: 'calc(100% - 20px)',
            borderRadius: 'var(--radius-full)',
            background: isPressing
              ? 'linear-gradient(135deg, #C93700 0%, #B91C1C 100%)'
              : 'linear-gradient(135deg, #FF4800 0%, #E02424 100%)',
            boxShadow: isPressing
              ? '0 0 35px rgba(255, 72, 0, 0.75)'
              : '0 8px 28px rgba(255, 72, 0, 0.45)',
            transform: isPressing ? 'scale(0.96)' : 'scale(1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'transform 0.1s ease, box-shadow 0.2s ease',
            zIndex: 2,
            border: 'none',
            outline: 'none',
            touchAction: 'none'
          }}
        >
          <AlertCircle size={size === 'large' ? 44 : 28} strokeWidth={2.5} />
          <span style={{ fontSize: size === 'large' ? '1.35rem' : '1rem', fontWeight: 900, letterSpacing: '0.05em', marginTop: '2px' }}>
            SOS
          </span>
        </button>
      </div>

      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '0.85rem', fontWeight: 600, color: isPressing ? '#FF6B6B' : 'var(--text-secondary)' }}>
          {isPressing ? `Holding... ${progress}% (Release to cancel)` : 'Press & hold for 2 seconds to activate'}
        </p>
      </div>
    </div>
  );
};
