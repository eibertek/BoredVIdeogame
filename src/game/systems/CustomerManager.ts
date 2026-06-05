import type {
  CustomerDef,
  TransactionState,
  ResponseOption,
} from '../types/customer';
import { CUSTOMERS, ROWAN_LINES, type RowanLine } from '../data/dialogues';

// ──────────────────────────────────────────────────────────────────────────────
//  CustomerManager — pure business logic, zero Phaser dependency.
//  Drives the counter-service game loop: customer queue, transaction scoring,
//  response evaluation and Rowan interruption events.
// ──────────────────────────────────────────────────────────────────────────────

export class CustomerManager {
  private queue: CustomerDef[] = [];
  private state: TransactionState | null = null;
  private globalScore = 0;
  private customersServed = 0;
  private customersLost = 0;

  // Character modifier: random value in [-charCurse, +charBonus] applied per response
  private charBonus = 0;
  private charCurse = 0;
  private charLabel = '';
  private playerId = '';

  constructor() {
    this.refillQueue();
  }

  /** Set the active player's random modifier range for this session. */
  setCharModifiers(bonus: number, curse: number, label = '') {
    this.charBonus = bonus;
    this.charCurse = curse;
    this.charLabel = label;
  }

  /** Set the active player character id so player-specific dialogue variants are applied. */
  setPlayerId(id: string) {
    this.playerId = id;
  }

  private randomCharMod(): number {
    const range = this.charBonus + this.charCurse;
    if (range === 0) return 0;
    return Math.floor(Math.random() * (range + 1)) - this.charCurse;
  }

  // ── Queue management ────────────────────────────────────────────────────────

  private refillQueue() {
    // Shuffle customers and repeat so the queue never empties
    const shuffled = [...CUSTOMERS].sort(() => Math.random() - 0.5);
    this.queue.push(...shuffled);
  }

  private nextCustomer(): CustomerDef {
    if (this.queue.length === 0) this.refillQueue();
    return this.queue.shift()!;
  }

  // ── Transaction lifecycle ───────────────────────────────────────────────────

  /** Start the next customer. Returns the initial transaction state. */
  beginTransaction(): TransactionState {
    const raw = this.nextCustomer();
    // Apply player-specific dialogue variant if one exists for this player
    const variantExchanges = raw.playerVariants?.[this.playerId];
    const customer: CustomerDef = variantExchanges
      ? { ...raw, exchanges: variantExchanges }
      : raw;
    const [min, max] = customer.scoreRange;
    const score = Math.floor(Math.random() * (max - min + 1)) + min;

    this.state = {
      customer,
      score,
      globalScore: this.globalScore,
      exchangeIndex: 0,
      status: 'arriving',
      customersServed: this.customersServed,
      customersLost: this.customersLost,
    };

    return this.snapshot();
  }

  /** Mark the customer as active (standing at the counter). */
  activateTransaction(): TransactionState {
    if (!this.state) throw new Error('No pending transaction');
    this.state.status = 'active';
    return this.snapshot();
  }

  /** Return the current exchange or null if none available. */
  currentExchange() {
    if (!this.state) return null;
    const { customer, exchangeIndex } = this.state;
    return customer.exchanges[exchangeIndex] ?? null;
  }

  /** Apply the player's chosen response, advance the exchange index, and
   *  evaluate win/loss conditions. Returns the updated state. */
  applyResponse(option: ResponseOption): TransactionState {
    if (!this.state) throw new Error('No active transaction');

    // Character modifier: random value in [-charCurse, +charBonus]
    const charMod = this.randomCharMod();
    const totalDelta = option.delta + charMod;

    // Build flavour: response text + optional char modifier line
    const flavourParts: string[] = [];
    if (option.flavourText) flavourParts.push(option.flavourText);
    if (charMod !== 0 && this.charLabel) {
      const sign = charMod > 0 ? '+' : '';
      flavourParts.push(`${charMod > 0 ? '✨' : '💀'} ${this.charLabel}: ${sign}${charMod}`);
    }

    this.state.lastDelta = totalDelta;
    this.state.lastFlavour = flavourParts.join(' · ') || undefined;
    this.state.score += totalDelta;

    // Effect bonuses / penalties
    if (option.effect === 'discount') {
      this.state.score += 15; // customer appreciates the gesture
    } else if (option.effect === 'surcharge') {
      this.state.score -= 20;
    }

    if (option.globalBonus) {
      this.globalScore += option.globalBonus;
    }

    this.state.exchangeIndex++;
    this.state.globalScore = this.globalScore;

    return this.evaluateStatus();
  }

  /** Apply a Rowan interruption penalty. */
  applyRowanPenalty(line: RowanLine): TransactionState {
    if (!this.state) throw new Error('No active transaction');

    this.state.lastDelta = -line.penalty;
    this.state.score = Math.max(0, this.state.score - line.penalty);
    this.state.globalScore = this.globalScore;

    return this.evaluateStatus();
  }

  /** Pick a random Rowan interruption line. */
  pickRowanLine(): RowanLine {
    return ROWAN_LINES[Math.floor(Math.random() * ROWAN_LINES.length)];
  }

  /** Current state snapshot (read-only). */
  getState(): TransactionState | null {
    return this.state ? this.snapshot() : null;
  }

  getGlobalScore() { return this.globalScore; }
  getStats() { return { served: this.customersServed, lost: this.customersLost }; }

  // ── Private helpers ─────────────────────────────────────────────────────────

  private evaluateStatus(): TransactionState {
    if (!this.state) throw new Error();
    const { score, customer, exchangeIndex } = this.state;

    // Immediate failure
    if (score <= 0) {
      this.state.score = 0;
      this.state.status = 'failure';
      this.customersLost++;
      this.state.customersLost = this.customersLost;
      return this.snapshot();
    }

    // Immediate success (score reached threshold mid-conversation)
    if (score >= customer.successThreshold) {
      this.state.status = 'success';
      const bonus = Math.floor(score / 10);
      this.globalScore += bonus;
      this.state.globalScore = this.globalScore;
      this.customersServed++;
      this.state.customersServed = this.customersServed;
      return this.snapshot();
    }

    // All exchanges exhausted → decide by closing threshold
    if (exchangeIndex >= customer.exchanges.length) {
      if (score >= customer.closingThreshold) {
        this.state.status = 'success';
        const bonus = Math.floor(score / 10);
        this.globalScore += bonus;
        this.state.globalScore = this.globalScore;
        this.customersServed++;
        this.state.customersServed = this.customersServed;
      } else {
        this.state.status = 'failure';
        this.customersLost++;
        this.state.customersLost = this.customersLost;
      }
    }

    return this.snapshot();
  }

  private snapshot(): TransactionState {
    return { ...this.state! };
  }
}
