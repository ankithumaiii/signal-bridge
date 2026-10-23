import React from 'react';

export const Logo = ({ size = 'medium', showText = true, light = false }) => {
  const dimensions = {
    small: { outer: 24, inner: 8, font: '0.95rem', sub: '0.62rem' },
    medium: { outer: 32, inner: 10, font: '1.15rem', sub: '0.68rem' },
    large: { outer: 42, inner: 14, font: '1.4rem', sub: '0.78rem' }
  }[size] || { outer: 32, inner: 10, font: '1.15rem', sub: '0.68rem' };

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.65rem', userSelect: 'none' }}>
      {/* Signal Bridge Beacon Mark */}
      <div
        style={{
          width: `${dimensions.outer}px`,
          height: `${dimensions.outer}px`,
          borderRadius: '50%',
          background: 'var(--color-emergency, #C0392B)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          position: 'relative',
          boxShadow: '0 2px 8px rgba(192, 57, 43, 0.28)'
        }}
        title="Signal Bridge Emergency Safety System"
      >
        <div
          style={{
            width: `${dimensions.inner}px`,
            height: `${dimensions.inner}px`,
            borderRadius: '50%',
            background: '#FFFFFF'
          }}
        />
      </div>

      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
          <div
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 700,
              fontSize: dimensions.font,
              letterSpacing: '-0.03em',
              color: light ? '#FFFFFF' : 'var(--color-ink, #161616)'
            }}
          >
            Signal Bridge
          </div>
          <div
            style={{
              fontSize: dimensions.sub,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: light ? 'rgba(255, 255, 255, 0.65)' : 'var(--color-ink-muted, #737373)'
            }}
          >
            Safety Platform
          </div>
        </div>
      )}
    </div>
  );
};

export default Logo;
