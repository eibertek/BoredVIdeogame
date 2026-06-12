'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CHARACTERS, type CharConfig } from '@/game/characters';

// Characters that can be played (Mariano is NPC-only — he appears as a customer).
const PLAYABLE = new Set(['rowan', 'alan', 'adam', 'ellie', 'brit', 'hamish', 'ben']);
// In counter mode only staff can be played.
const COUNTER_PLAYABLE = new Set(['rowan', 'alan', 'adam', 'ellie', 'brit']);

type GameMode = 'explore' | 'counter';

function CharacterAvatar({ char }: { char: CharConfig }) {
  const shirt = '#' + char.shirtColor.toString(16).padStart(6, '0');
  const hair  = '#' + char.hairColor.toString(16).padStart(6, '0');
  const skin  = '#' + char.skinColor.toString(16).padStart(6, '0');
  const pants = '#' + char.pantsColor.toString(16).padStart(6, '0');

  return (
    <div className="flex flex-col items-center justify-end" style={{ height: 80 }}>
      <div className="rounded-full relative" style={{ width: 30, height: 30, backgroundColor: skin, marginBottom: -2 }}>
        <div className="absolute top-0 left-0 right-0 rounded-t-full" style={{ height: '50%', backgroundColor: hair }} />
        <div className="absolute flex gap-1" style={{ bottom: 10, left: '50%', transform: 'translateX(-50%)' }}>
          <div className="rounded-full" style={{ width: 4, height: 4, backgroundColor: '#2c2c2c' }} />
          <div className="rounded-full" style={{ width: 4, height: 4, backgroundColor: '#2c2c2c' }} />
        </div>
        {char.hasGlasses && (
          <div className="absolute" style={{ bottom: 9, left: 2, right: 2, height: 10, border: '1.5px solid #374151', borderRadius: 1 }} />
        )}
      </div>
      <div style={{ width: 28, height: 22, backgroundColor: shirt, borderRadius: '4px 4px 0 0' }} />
      {char.hasTie && (
        <div className="absolute" style={{
          width: 6, height: 12, marginTop: -14,
          backgroundColor: '#' + (char.tieColor ?? 0xef4444).toString(16).padStart(6, '0'),
          clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)',
        }} />
      )}
      <div className="flex" style={{ gap: 4 }}>
        <div style={{ width: 11, height: 14, backgroundColor: pants, borderRadius: '0 0 3px 3px' }} />
        <div style={{ width: 11, height: 14, backgroundColor: pants, borderRadius: '0 0 3px 3px' }} />
      </div>
    </div>
  );
}

export default function HomePage() {
  const router   = useRouter();
  const [mode, setMode]       = useState<GameMode>('explore');
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered]   = useState<string | null>(null);

  const available = CHARACTERS.filter(c =>
    mode === 'counter' ? COUNTER_PLAYABLE.has(c.id) : PLAYABLE.has(c.id),
  );

  const handlePlay = () => {
    if (selected) router.push(`/game?character=${selected}&mode=${mode}`);
  };

  const selectedChar = CHARACTERS.find(c => c.id === selected);

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex flex-col items-center py-10 px-4">
      {/* Header */}
      <div className="text-center mb-6">
        <h1
          className="text-3xl font-bold text-white mb-2 tracking-widest"
          style={{ fontFamily: '"Press Start 2P", monospace', textShadow: '0 0 20px #4a90d9' }}
        >
          BORED
        </h1>
        <p className="text-[#4a90d9] text-sm font-mono mb-1">THE VIDEO GAME</p>
        <p className="text-gray-500 text-xs font-mono">Based on Viva La Dirt League's Bored</p>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2 mb-8 bg-[#0d0d1f] border border-gray-700 rounded-lg p-1">
        <button
          onClick={() => { setMode('explore'); setSelected(null); }}
          className={`px-5 py-2 rounded font-mono text-sm transition-all ${
            mode === 'explore'
              ? 'bg-[#4a90d9] text-white shadow'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          🗺️ Explore Store
        </button>
        <button
          onClick={() => { setMode('counter'); setSelected(null); }}
          className={`px-5 py-2 rounded font-mono text-sm transition-all ${
            mode === 'counter'
              ? 'bg-[#4a90d9] text-white shadow'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          🏪 Work the Counter
        </button>
      </div>

      {/* Mode description */}
      <div className="mb-6 text-center max-w-xl">
        {mode === 'explore' ? (
          <p className="text-gray-400 text-xs font-mono">
            Pick any character and explore the store. Talk to NPCs with <kbd className="bg-gray-800 px-1 rounded">E</kbd>.
          </p>
        ) : (
          <p className="text-gray-400 text-xs font-mono">
            Pick a staff member and serve customers at the counter. Each response adds or removes points. Reach{' '}
            <span className="text-[#4fc3f7]">120 pts</span> to close the sale.{' '}
            <span className="text-purple-400">Watch out for Rowan!</span>
          </p>
        )}
      </div>

      {/* Character grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-w-4xl w-full mb-8">
        {available.map((char) => (
          <button
            key={char.id}
            onClick={() => setSelected(char.id)}
            onMouseEnter={() => setHovered(char.id)}
            onMouseLeave={() => setHovered(null)}
            className={`
              relative flex flex-col items-center p-4 rounded-lg border-2 transition-all duration-200
              bg-gradient-to-b ${char.cardColor}
              ${selected === char.id
                ? 'border-[#4fc3f7] shadow-lg shadow-blue-500/30 scale-105'
                : 'border-gray-700 hover:border-gray-500'}
            `}
          >
            {selected === char.id && (
              <div className="absolute -top-2 -right-2 bg-[#4fc3f7] text-black text-xs font-bold px-2 py-0.5 rounded-full font-mono">✓</div>
            )}
            <div className="mb-3"><CharacterAvatar char={char} /></div>
            <h3 className="text-white font-bold text-sm font-mono mb-0.5">{char.name}</h3>
            <p className="text-gray-400 text-xs font-mono mb-2">{char.role}</p>
            {(hovered === char.id || selected === char.id) && (
              <p className="text-gray-300 text-xs font-mono text-center italic leading-tight">
                {char.description}
              </p>
            )}
          </button>
        ))}
      </div>

      {/* Play button */}
      <button
        onClick={handlePlay}
        disabled={!selected}
        className={`
          px-10 py-4 font-mono rounded-lg border-2 transition-all duration-200
          ${selected
            ? 'bg-[#4a90d9] border-[#4fc3f7] text-white hover:bg-[#5ba4e8] hover:scale-105 shadow-lg cursor-pointer'
            : 'bg-gray-800 border-gray-700 text-gray-600 cursor-not-allowed'}
        `}
        style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 13 }}
      >
        {selected
          ? `▶  ${mode === 'counter' ? 'WORK AS' : 'PLAY AS'} ${selectedChar?.name?.toUpperCase()}`
          : 'PICK A CHARACTER'}
      </button>

      <p className="mt-6 text-gray-600 text-xs font-mono text-center">
        Fan game · Not affiliated with Viva La Dirt League
      </p>
    </div>
  );
}
