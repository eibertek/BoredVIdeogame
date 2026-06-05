'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import GameCanvas, { type GameMode } from '@/components/GameCanvas';
import CounterUI from '@/components/CounterUI';

// Staff characters who can serve customers at the counter in explore mode
const COUNTER_STAFF = new Set(['rowan', 'alan', 'adam', 'ellie', 'brit']);

function GameLoader() {
  const params      = useSearchParams();
  const router      = useRouter();
  const characterId = params.get('character') ?? 'alan';
  const mode        = (params.get('mode') ?? 'explore') as GameMode;

  // Phaser game instance — set via onGameReady, then passed to CounterUI
  const [phaserGame, setPhaserGame] = useState<import('phaser').Game | null>(null);

  return (
    <GameCanvas
      characterId={characterId}
      mode={mode}
      onBack={() => router.push('/')}
      onGameReady={setPhaserGame}
    >
      {/* CounterUI shown in counter mode and in explore mode for any staff character
          who can reach the counter and trigger the service mechanic. */}
      {(mode === 'counter' || (mode === 'explore' && COUNTER_STAFF.has(characterId))) && (
        <CounterUI game={phaserGame} />
      )}
    </GameCanvas>
  );
}

export default function GamePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center">
          <p className="text-[#4a90d9] font-mono text-lg animate-pulse">Cargando juego…</p>
        </div>
      }
    >
      <GameLoader />
    </Suspense>
  );
}
