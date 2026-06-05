'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { GAME_WIDTH, GAME_HEIGHT } from '@/game/constants';

export type GameMode = 'explore' | 'counter';

interface Props {
  characterId: string;
  mode: GameMode;
  onBack: () => void;
  onGameReady?: (game: import('phaser').Game) => void;
  children?: ReactNode;   // overlay rendered on top of the scaled canvas
}

// The Phaser game runs at native GAME_WIDTH × GAME_HEIGHT (800 × 600).
// CSS scales it up for display — keeping Phaser's internal coordinates at 1:1
// so that setScrollFactor(0) UI elements position correctly.
const CSS_SCALE  = 1.5;
const DISPLAY_W  = Math.round(GAME_WIDTH  * CSS_SCALE);
const DISPLAY_H  = Math.round(GAME_HEIGHT * CSS_SCALE);

export default function GameCanvas({ characterId, mode, onBack, onGameReady, children }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef      = useRef<import('phaser').Game | null>(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    let cancelled = false;

    const init = async () => {
      const Phaser      = (await import('phaser')).default;
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
      game.registry.set('gameMode',     mode);          // 'explore' | 'counter'
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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#1a1a2e]">
      <div className="mb-3 flex items-center gap-4">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-[#16213e] border border-[#4a90d9] text-[#4a90d9] text-sm font-mono hover:bg-[#4a90d9] hover:text-white transition-colors rounded"
        >
          ← Volver
        </button>
        <span className="text-gray-500 text-xs font-mono">
          {mode === 'counter'
            ? 'E: next response  ·  Wait for the customer to arrive'
            : 'WASD / Arrows: move  ·  E: talk'}
        </span>
      </div>

      {/* Wrapper reserves the scaled display size; children overlay absolutely */}
      <div
        style={{ width: DISPLAY_W, height: DISPLAY_H }}
        className="relative border-2 border-[#4a90d9] shadow-2xl shadow-blue-900/50 overflow-hidden"
      >
        {/* Native-resolution Phaser canvas, CSS-scaled up */}
        <div
          ref={containerRef}
          id="game-container"
          style={{
            width:           GAME_WIDTH,
            height:          GAME_HEIGHT,
            transform:       `scale(${CSS_SCALE})`,
            transformOrigin: 'top left',
            imageRendering:  'pixelated',
          }}
        />

        {/* React overlay (e.g. CounterUI) sits in the display-sized space */}
        {children}
      </div>
    </div>
  );
}
