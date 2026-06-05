'use client';

import { useEffect, useState, useRef } from 'react';
import { EV, type TransactionState, type DialogueExchange, type TransactionStatus } from '@/game/types/customer';

// ──────────────────────────────────────────────────────────────────────────────
//  CounterUI — React overlay rendered on top of the Phaser CounterScene.
//
//  Layout (absolute, covers the DISPLAY_W × DISPLAY_H area):
//    ┌────────────────────────────────────┐
//    │  Top bar: score + stats            │ 56px
//    │                                    │
//    │   ← transparent (game visible) →  │
//    │                                    │
//    ├────────────────────────────────────┤
//    │  Dialogue panel (customer text)    │
//    │  Response buttons                  │ ~220px
//    └────────────────────────────────────┘
// ──────────────────────────────────────────────────────────────────────────────

interface ArrivingPayload {
  name: string;
  charBonus?: number;
  charCurse?: number;
  charName?: string;
}

interface ExchangePayload {
  exchange: DialogueExchange;
  score: number;
  globalScore: number;
  customerName: string;
  customerDifficulty: string;
  exchangeIndex: number;
  totalExchanges: number;
}

interface ScoreUpdatePayload {
  score: number;
  globalScore: number;
  delta?: number;
  flavour?: string;
}

interface TransactionEndPayload {
  status: TransactionStatus;
  score: number;
  globalScore: number;
  customerName: string;
  customersServed: number;
  customersLost: number;
}

interface RowanPayload {
  line: string;
  penalty: number;
}

interface Props {
  game: import('phaser').Game | null;
}

const SUCCESS_THRESHOLD = 120;

function ScoreBar({ score }: { score: number }) {
  const pct = Math.min(100, Math.round((score / SUCCESS_THRESHOLD) * 100));
  const color =
    score <= 0     ? 'bg-gray-500' :
    score < 40     ? 'bg-red-500'  :
    score < 80     ? 'bg-yellow-400' :
    score < 120    ? 'bg-green-400' :
                     'bg-emerald-400';
  return (
    <div className="flex items-center gap-2 flex-1">
      <span className="text-xs text-gray-400 font-mono w-20 shrink-0">
        Sale: {score}/{SUCCESS_THRESHOLD}
      </span>
      <div className="flex-1 h-3 bg-gray-800 rounded-full overflow-hidden border border-gray-600">
        <div
          className={`h-full rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const styles: Record<string, string> = {
    easy:   'bg-green-900 text-green-300 border-green-700',
    medium: 'bg-yellow-900 text-yellow-300 border-yellow-700',
    absurd: 'bg-red-900   text-red-300   border-red-700',
  };
  const labels: Record<string, string> = {
    easy: 'EASY', medium: 'MEDIUM', absurd: 'ABSURD',
  };
  return (
    <span className={`text-[10px] font-mono px-2 py-0.5 border rounded ${styles[difficulty] ?? styles.easy}`}>
      {labels[difficulty] ?? difficulty.toUpperCase()}
    </span>
  );
}

export default function CounterUI({ game }: Props) {
  const [exchange, setExchange] = useState<ExchangePayload | null>(null);
  const [score, setScore]       = useState(0);
  const [globalScore, setGlobal] = useState(0);
  const [delta, setDelta]       = useState<number | null>(null);
  const [flavour, setFlavour]   = useState('');
  const [rowan, setRowan]       = useState<RowanPayload | null>(null);
  const [outcome, setOutcome]   = useState<TransactionEndPayload | null>(null);
  const [arriving, setArriving] = useState<string | null>(null);
  const [chosen, setChosen]     = useState<number | null>(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [charBonus, setCharBonus] = useState(0);
  const [charCurse, setCharCurse] = useState(0);
  const [charName, setCharName]   = useState('');
  const deltaTimer = useRef<ReturnType<typeof setTimeout>>();

  // Auto-dismiss outcome card after 3 s so the UI resets for the next customer.
  useEffect(() => {
    if (!outcome) return;
    const t = setTimeout(() => setOutcome(null), 3000);
    return () => clearTimeout(t);
  }, [outcome]);

  // ── Subscribe to Phaser events ──────────────────────────────────────────────
  useEffect(() => {
    if (!game) return;

    const onArriving = ({ name, charBonus: b, charCurse: c, charName: n }: ArrivingPayload) => {
      setSessionStarted(true);
      setArriving(name);
      setOutcome(null);
      setExchange(null);
      setRowan(null);
      setChosen(null);
      if (b !== undefined) setCharBonus(b);
      if (c !== undefined) setCharCurse(c);
      if (n !== undefined) setCharName(n);
    };

    const onExchange = (data: ExchangePayload) => {
      setExchange(data);
      setScore(data.score);
      setGlobal(data.globalScore);
      setArriving(null);
      setChosen(null);
    };

    const onScoreUpdate = (data: ScoreUpdatePayload) => {
      setScore(data.score);
      setGlobal(data.globalScore);
      if (data.delta !== undefined) {
        setDelta(data.delta);
        if (data.flavour) setFlavour(data.flavour);
        clearTimeout(deltaTimer.current);
        deltaTimer.current = setTimeout(() => { setDelta(null); setFlavour(''); }, 2200);
      }
    };

    const onRowan = (data: RowanPayload) => {
      setRowan(data);
      setTimeout(() => setRowan(null), 4000);
    };

    const onEnd = (data: TransactionEndPayload) => {
      setOutcome(data);
      setExchange(null);
      setGlobal(data.globalScore);
    };

    game.events.on(EV.CUSTOMER_ARRIVING, onArriving);
    game.events.on(EV.EXCHANGE_SHOW,     onExchange);
    game.events.on(EV.SCORE_UPDATE,      onScoreUpdate);
    game.events.on(EV.ROWAN_INTERRUPT,   onRowan);
    game.events.on(EV.TRANSACTION_END,   onEnd);

    return () => {
      game.events.off(EV.CUSTOMER_ARRIVING, onArriving);
      game.events.off(EV.EXCHANGE_SHOW,     onExchange);
      game.events.off(EV.SCORE_UPDATE,      onScoreUpdate);
      game.events.off(EV.ROWAN_INTERRUPT,   onRowan);
      game.events.off(EV.TRANSACTION_END,   onEnd);
    };
  }, [game]);

  const sendResponse = (idx: number) => {
    if (chosen !== null || !game) return;
    setChosen(idx);
    game.events.emit(EV.PLAYER_RESPONSE, { optionIndex: idx });
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col" style={{ zIndex: 10 }}>

      {/* ── TOP BAR — only after first customer interaction ── */}
      {sessionStarted && <div className="pointer-events-auto flex items-center gap-3 px-4 py-2 bg-black/70 border-b border-gray-700">
        <span className="text-[11px] font-mono text-gray-400">GLOBAL SCORE</span>
        <span className="text-sm font-bold text-[#4fc3f7] font-mono">{globalScore}</span>
        <div className="flex-1 mx-2">
          <ScoreBar score={score} />
        </div>
        {/* Character modifier badge */}
        {charName && (charBonus > 0 || charCurse > 0) && (
          <span className={`text-[10px] font-mono px-2 py-0.5 border rounded shrink-0 ${
            charCurse === 0
              ? 'bg-green-900 text-green-300 border-green-700'
              : charBonus === 0
                ? 'bg-red-900 text-red-300 border-red-700'
                : 'bg-yellow-900 text-yellow-300 border-yellow-700'
          }`} title={`${charName}: random modifier per response`}>
            {charCurse > 0 && `-${charCurse}`}{charBonus > 0 && charCurse > 0 && '/'}
            {charBonus > 0 && `+${charBonus}`}
          </span>
        )}
        {exchange && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-mono">{exchange.customerName}</span>
            <DifficultyBadge difficulty={exchange.customerDifficulty} />
            <span className="text-[10px] text-gray-500 font-mono">
              {exchange.exchangeIndex + 1}/{exchange.totalExchanges}
            </span>
          </div>
        )}
      </div>}

      {/* ── MIDDLE (transparent — game visible) ── */}
      <div className="flex-1 relative">

        {/* Delta feedback bubble */}
        {delta !== null && (
          <div
            className={`absolute top-4 right-4 text-lg font-bold font-mono px-3 py-1 rounded-full border
              ${delta > 0
                ? 'text-green-300 bg-green-950 border-green-700'
                : 'text-red-300 bg-red-950 border-red-700'}`}
          >
            {delta > 0 ? `+${delta}` : delta}
          </div>
        )}

        {/* Flavour text */}
        {flavour && (
          <div className="absolute top-16 right-4 text-xs text-gray-300 italic font-mono bg-black/60 px-3 py-1 rounded max-w-[220px] text-right">
            {flavour}
          </div>
        )}

        {/* "Cliente llegando…" notice */}
        {arriving && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black/70 border border-[#4a90d9] rounded-lg px-6 py-3 font-mono text-[#4fc3f7] text-sm animate-pulse">
              {arriving} is approaching the counter…
            </div>
          </div>
        )}

        {/* Rowan interruption modal */}
        {rowan && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
            <div className="bg-purple-950 border-2 border-purple-500 rounded-xl p-5 max-w-sm shadow-2xl shadow-purple-900/50">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-purple-400 font-mono text-xs font-bold">⚠ ROWAN INTERRUPTS</span>
                <span className="text-red-400 font-mono text-xs">−{rowan.penalty} pts</span>
              </div>
              <p className="text-white text-sm font-mono leading-relaxed">"{rowan.line}"</p>
            </div>
          </div>
        )}

        {/* Transaction outcome overlay */}
        {outcome && !arriving && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
            <div
              className={`rounded-xl p-6 max-w-sm text-center shadow-2xl border-2 ${
                outcome.status === 'success'
                  ? 'bg-green-950 border-green-500 shadow-green-900/50'
                  : 'bg-red-950 border-red-500 shadow-red-900/50'
              }`}
            >
              <div className="text-3xl mb-2">
                {outcome.status === 'success' ? '✅' : '❌'}
              </div>
              <h3 className={`text-lg font-bold font-mono mb-1 ${
                outcome.status === 'success' ? 'text-green-300' : 'text-red-300'
              }`}>
                {outcome.status === 'success' ? 'Sale closed!' : 'Customer lost'}
              </h3>
              <p className="text-gray-300 font-mono text-sm mb-3">
                {outcome.customerName} {outcome.status === 'success' ? 'bought happily.' : 'left angry.'}
              </p>
              <div className="flex justify-center gap-4 text-xs font-mono text-gray-400">
                <span>✓ {outcome.customersServed} sold</span>
                <span>✗ {outcome.customersLost} lost</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── DIALOGUE PANEL (bottom) ── */}
      {exchange && (
        <div className="pointer-events-auto bg-[#0a0a1a]/95 border-t-2 border-[#4a90d9] px-5 py-4">
          {/* Customer dialogue line */}
          <div className="flex items-start gap-3 mb-4">
            <div className="shrink-0 w-10 h-10 rounded-full bg-gray-800 border border-gray-600 flex items-center justify-center text-lg">
              {exchange.customerName === 'Ben' ? '🧳' : exchange.customerName === 'Amish' ? '🔧' : '🙋'}
            </div>
            <div>
              <span className="text-[#4fc3f7] text-xs font-mono font-bold block mb-1">
                {exchange.customerName.toUpperCase()}
              </span>
              <p className="text-white text-sm font-mono leading-snug">
                {exchange.exchange.customerText}
              </p>
            </div>
          </div>

          {/* Response options */}
          <div className="flex flex-col gap-2">
            {exchange.exchange.responses.map((opt, i) => {
              const isChosen = chosen === i;
              const isDisabled = chosen !== null;
              return (
                <button
                  key={i}
                  onClick={() => sendResponse(i)}
                  disabled={isDisabled}
                  className={`
                    flex items-center px-4 py-2.5 rounded-lg border text-left
                    font-mono text-sm transition-all duration-150
                    ${isChosen
                      ? 'bg-[#4a90d9]/30 border-[#4fc3f7] text-white'
                      : isDisabled
                        ? 'opacity-30 bg-gray-900 border-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-900/60 border-gray-700 text-gray-200 hover:bg-gray-800 hover:border-[#4a90d9] cursor-pointer active:scale-[0.98]'}
                  `}
                >
                  <span className="flex-1 leading-snug">{opt.text}</span>
                </button>
              );
            })}
          </div>

          <p className="text-gray-600 text-[10px] font-mono mt-3 text-right">
            Current score: {score} · Target: {SUCCESS_THRESHOLD}
          </p>
        </div>
      )}
    </div>
  );
}
