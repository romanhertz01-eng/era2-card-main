import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'ERA2 Card — AI-карточки для маркетплейсов';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'flex-end',
          padding: '64px 72px',
          background: '#0D0D0D',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Lime glow */}
        <div
          style={{
            position: 'absolute',
            top: -120,
            right: -120,
            width: 480,
            height: 480,
            borderRadius: '50%',
            background: 'rgba(190,255,0,0.15)',
            filter: 'blur(80px)',
          }}
        />

        {/* Dot grid overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(190,255,0,0.12)',
            border: '1px solid rgba(190,255,0,0.3)',
            borderRadius: 999,
            padding: '6px 16px',
            marginBottom: 24,
          }}
        >
          <span style={{ fontSize: 13, color: '#BEFF00', letterSpacing: 2, fontWeight: 600 }}>
            AI · МАРКЕТПЛЕЙСЫ
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: '#FFFFFF',
            lineHeight: 1.1,
            letterSpacing: -2,
            marginBottom: 20,
          }}
        >
          ERA2 Card
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 26,
            color: 'rgba(255,255,255,0.55)',
            fontWeight: 400,
            lineHeight: 1.4,
            maxWidth: 700,
          }}
        >
          Продающие карточки для WB, Ozon и Яндекс Маркета за 60 секунд
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            background: 'linear-gradient(90deg, transparent, #BEFF00, transparent)',
          }}
        />
      </div>
    ),
    { ...size },
  );
}
