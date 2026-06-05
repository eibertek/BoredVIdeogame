// ──────────────────────────────────────────────────────────────────────────────
//  Types for the Counter Service mechanic
// ──────────────────────────────────────────────────────────────────────────────

export type Difficulty = 'easy' | 'medium' | 'absurd';
export type TransactionStatus = 'idle' | 'arriving' | 'active' | 'success' | 'failure';
export type ResponseEffect = 'none' | 'discount' | 'surcharge';

/** A single response option the player can choose */
export interface ResponseOption {
  text: string;
  delta: number;            // points added to / removed from transaction score
  globalBonus?: number;     // extra points added to the global total on selection
  effect?: ResponseEffect;
  effectValue?: number;     // percentage for discount/surcharge (e.g. 10 → 10 %)
  flavourText?: string;     // brief reaction line shown after selection
}

/** One back-and-forth exchange within a customer interaction */
export interface DialogueExchange {
  customerText: string;
  responses: ResponseOption[];
  isClosing?: boolean;      // final exchange (e.g. "shall I wrap it up?")
}

/** Static definition of a customer type */
export interface CustomerDef {
  id: string;
  name: string;
  difficulty: Difficulty;
  sprite: string;            // Phaser texture key
  scoreRange: [number, number]; // [min, max] random starting score per visit
  successThreshold: number;    // score needed to count as a sale (default 120)
  closingThreshold: number;    // minimum score at last exchange to still make the sale
  exchanges: DialogueExchange[];
  /** Optional per-player dialogue overrides keyed by player character id */
  playerVariants?: Record<string, DialogueExchange[]>;
}

/** Live state of the current customer transaction */
export interface TransactionState {
  customer: CustomerDef;
  score: number;             // current transaction score
  globalScore: number;       // total accumulated score across all customers
  exchangeIndex: number;     // which exchange is active
  status: TransactionStatus;
  lastDelta?: number;        // last point change (for animated feedback)
  lastFlavour?: string;      // flavour text of last response
  customersServed: number;
  customersLost: number;
}

/** Payload emitted when a Rowan interruption fires */
export interface RowanPayload {
  line: string;
  penalty: number;
}

// Phaser custom event names ─────────────────────────────────────────────────
export const EV = {
  CUSTOMER_ARRIVING: 'counter:arriving',
  CUSTOMER_READY:    'counter:ready',
  EXCHANGE_SHOW:     'counter:exchange',
  SCORE_UPDATE:      'counter:scoreUpdate',
  ROWAN_INTERRUPT:   'counter:rowanInterrupt',
  TRANSACTION_END:   'counter:transactionEnd',
  PLAYER_RESPONSE:   'counter:playerResponse',
} as const;
