'use client';

import { useEffect, useState } from 'react';
import { touchInput } from '@/game/touchInput';

interface Props {
  /** Hide the D-pad (but keep the action button) during counter exchanges */
  counterActive?: boolean;
}

const BTN = 54; // px — touch target size

function DirButton({
  dir,
  label,
  style,
}: {
  dir: 'left' | 'right' | 'up' | 'down';
  label: string;
  style: React.CSSProperties;
}) {
  return (
    <button
      style={{ ...style, width: BTN, height: BTN, position: 'absolute' }}
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); touchInput[dir] = true; }}
      onPointerUp={() => { touchInput[dir] = false; }}
      onPointerCancel={() => { touchInput[dir] = false; }}
      className="flex items-center justify-center bg-white/15 border border-white/30 rounded-xl active:bg-white/35 select-none text-white text-lg font-bold touch-none"
      aria-label={dir}
    >
      {label}
    </button>
  );
}

export default function MobileControls({ counterActive }: Props) {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  if (!isTouch) return null;

  const dpadSize = BTN * 3;

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 30 }}>
      {/* D-pad — bottom left */}
      {!counterActive && (
        <div
          className="absolute pointer-events-auto"
          style={{ bottom: 10, left: 10, width: dpadSize, height: dpadSize, position: 'absolute' }}
        >
          <DirButton dir="up"    label="▲" style={{ top: 0,        left: BTN      }} />
          <DirButton dir="left"  label="◀" style={{ top: BTN,      left: 0        }} />
          <DirButton dir="right" label="▶" style={{ top: BTN,      left: BTN * 2  }} />
          <DirButton dir="down"  label="▼" style={{ top: BTN * 2,  left: BTN      }} />
        </div>
      )}

      {/* Action button — bottom right */}
      {!counterActive && (
        <button
          className="absolute pointer-events-auto flex items-center justify-center bg-yellow-500/20 border-2 border-yellow-400/70 rounded-full active:bg-yellow-400/50 select-none text-yellow-300 font-bold text-xs touch-none"
          style={{ bottom: BTN * 0.75, right: 14, width: BTN * 1.2, height: BTN * 1.2, zIndex: 31 }}
          onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); touchInput.interactTap = true; }}
          aria-label="Interact"
        >
          A
        </button>
      )}
    </div>
  );
}
