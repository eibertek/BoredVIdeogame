'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import GameCanvas, { type GameMode } from '@/components/GameCanvas';
import CounterUI from '@/components/CounterUI';
import MobileControls from '@/components/MobileControls';
import { EV } from '@/game/types/customer';

// Staff characters who can serve customers at the counter in explore mode
const COUNTER_STAFF = new Set(['rowan', 'alan', 'adam', 'ellie', 'brit']);

function GameLoader() {
  const params      = useSearchParams();
  const router      = useRouter();
  const characterId = params.get('character') ?? 'alan';
  const mode        = (params.get('mode') ?? 'explore') as GameMode;

  const [phaserGame, setPhaserGame] = useState<import('phaser').Game | null>(null);
  // Hide movement controls while a counter exchange is active (CounterUI handles those taps)
  const [counterActive, setCounterActive] = useState(false);

  useEffect(() => {
    if (!phaserGame) return;
    const onArriving = () => setCounterActive(true);
    const onEnd      = () => setCounterActive(false);
    phaserGame.events.on(EV.CUSTOMER_ARRIVING, onArriving);
    phaserGame.events.on(EV.TRANSACTION_END,   onEnd);
    return () => {
      phaserGame.events.off(EV.CUSTOMER_ARRIVING, onArriving);
      phaserGame.events.off(EV.TRANSACTION_END,   onEnd);
    };
  }, [phaserGame]);

  return (
    <GameCanvas
      characterId={characterId}
      mode={mode}
      onBack={() => router.push('/')}
      onGameReady={setPhaserGame}
    >
      {(mode === 'counter' || (mode === 'explore' && COUNTER_STAFF.has(characterId))) && (
        <CounterUI game={phaserGame} />
      )}
      {mode === 'explore' && (
        <MobileControls counterActive={counterActive} />
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
