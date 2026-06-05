'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { GAME_WIDTH, GAME_HEIGHT } from '@/game/constants';

export type GameMode = 'explore' | 'counter';

interface Props {
  characterId: string;
  mode: GameMode;
  onBack: () => void;
  onGameReady?: (game: import('phaser').Game) => void;
  children?: ReactNode;
}

const MAX_SCALE = 1.5;
const TOP_BAR_H = 52; // px reserved for the back-button row

function computeScale() {
  if (typeof window === 'undefined') return MAX_SCALE;
  return Math.min(
    window.innerWidth  / GAME_WIDTH,
    (window.innerHeight - TOP_BAR_H) / GAME_HEIGHT,
    MAX_SCALE,
  );
}

export default function GameCanvas({ characterId, mode, onBack, onGameReady, children }: Props) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const gameRef       = useRef<import('phaser').Game | null>(null);
  const [scale, setScale] = useState<number>(MAX_SCALE);
  const [isTouch, setIsTouch] = useState(false);

  // Dynamic scale — recalculate on mount and viewport resize.
  useEffect(() => {
    const update = () => setScale(computeScale());
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Detect touch device (client-side only).
  useEffect(() => {
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    let cancelled = false;

    const init = async () => {
      const Phaser           = (await import('phaser')).default;
      const { BootScene }    = await import('@/game/scenes/BootScene');
      const { OfficeScene }  = await import('@/game/scenes/OfficeScene');
      const { CounterScene } = await import('@/game/scenes/CounterScene');

      if (cancelled || !containerRef.current || gameRef.current) return;

      const game = new Phaser.Game({
        type:            Phaser.AUTO,
        width:           GAME_WIDTH,
        height:          GAME_HEIGHT,
        parent:          containerRef.current,
        backgroundColor: '#1a1a2e',
        physics: {
          default: 'arcade',
          arcade:  { gravity: { x: 0, y: 0 }, debug: false },
        },
        scene:       [BootScene, OfficeScene, CounterScene],
        pixelArt:    true,
        roundPixels: true,
      });

      if (cancelled) { game.destroy(true); return; }

      game.registry.set('selectedChar', characterId);
      game.registry.set('gameMode',     mode);
      gameRef.current = game;
      onGameReady?.(game);
    };

    init();

    return () => {
      cancelled = true;
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, [characterId, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const displayW = Math.round(GAME_WIDTH  * scale);
  const displayH = Math.round(GAME_HEIGHT * scale);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#1a1a2e]">
      <div className="mb-2 flex items-center gap-4" style={{ height: TOP_BAR_H, flexShrink: 0 }}>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-[#16213e] border border-[#4a90d9] text-[#4a90d9] text-sm font-mono hover:bg-[#4a90d9] hover:text-white transition-colors rounded"
        >
          ← Volver
        </button>
        {!isTouch && (
          <span className="text-gray-500 text-xs font-mono">
            {mode === 'counter'
              ? 'E: next response  ·  Wait for the customer to arrive'
              : 'WASD / Arrows: move  ·  E: talk'}
          </span>
        )}
      </div>

      {/* Display container — sized to the CSS-scaled game */}
      <div
        style={{ width: displayW, height: displayH }}
        className="relative border-2 border-[#4a90d9] shadow-2xl shadow-blue-900/50 overflow-hidden"
      >
        {/* Native-resolution Phaser canvas, CSS-scaled */}
        <div
          ref={containerRef}
          id="game-container"
          style={{
            width:           GAME_WIDTH,
            height:          GAME_HEIGHT,
            transform:       `scale(${scale})`,
            transformOrigin: 'top left',
            imageRendering:  'pixelated',
          }}
        />

        {/* React overlays (CounterUI, MobileControls, etc.) */}
        {children}
      </div>
    </div>
  );
}
