import * as Phaser from 'phaser';
import {
  TILE_SIZE, MAP_WIDTH, MAP_HEIGHT,
  GAME_WIDTH, GAME_HEIGHT, T,
} from '../constants';
import { MAP_DATA, isSolid } from '../mapData';
import { getCharacter } from '../characters';
import { CustomerManager } from '../systems/CustomerManager';
import { EV, type TransactionState } from '../types/customer';

// ──────────────────────────────────────────────────────────────────────────────
//  CounterScene — Phaser scene for the counter-service game mode.
//
//  Responsibilities:
//    • Render the store tilemap zoomed on the checkout counter area.
//    • Animate the player sprite (idle behind counter) and customer sprites
//      (walk in → wait → react → walk out).
//    • Drive the CustomerManager and emit game events for React (CounterUI) to
//      consume.  All HUD/dialogue UI lives in React, not here.
//    • Run the Rowan interruption timer.
// ──────────────────────────────────────────────────────────────────────────────

const TILE_KEYS: Record<number, string> = {
  [T.FLOOR]: 'tile_floor', [T.CARPET]: 'tile_carpet', [T.WALL]: 'tile_wall',
  [T.DESK]: 'tile_desk', [T.DOOR]: 'tile_door', [T.WINDOW]: 'tile_window',
  [T.PLANT]: 'tile_plant', [T.MTABLE]: 'tile_mtable', [T.COUNTER]: 'tile_counter',
  [T.COUCH]: 'tile_couch', [T.OFLOOR]: 'tile_ofloor', [T.MFLOOR]: 'tile_mfloor',
  [T.BFLOOR]: 'tile_bfloor', [T.CHAIR]: 'tile_chair', [T.CABINET]: 'tile_cabinet',
  [T.MONITOR]: 'tile_monitor',
};

// World pixel positions (col * 32 + 16, row * 32 + 16)
// Counter bar is at row 14, cols 2-12 (center col 7).
// Staff area is rows 10-13 (behind the bar); customer approaches from row 15+.
const COUNTER_COL = 7;
const COUNTER_ROW = 13;   // camera focus row — between player and customer
const PLAYER_COL  = 7;
const PLAYER_ROW  = 12;   // staff side — behind the counter bar (row 14)
const CUSTOMER_COUNTER_ROW = 15; // customer stops one row in front of the bar
const CUSTOMER_SPAWN_ROW   = 26; // lobby — where customer walks in from

// Rowan interruption: fires during active transactions with this probability
// every ROWAN_CHECK_MS milliseconds.
const ROWAN_CHECK_MS = 12_000;
const ROWAN_PROB     = 0.30;   // 30 % chance each tick

export class CounterScene extends Phaser.Scene {
  private manager!: CustomerManager;
  private playerSprite!: Phaser.GameObjects.Sprite;
  private customerSprite?: Phaser.GameObjects.Sprite;
  private playerCharId!: string;
  private rowanTimer?: Phaser.Time.TimerEvent;
  private transactionActive = false;

  constructor() { super({ key: 'Counter' }); }

  // ── Lifecycle ────────────────────────────────────────────────────────────────

  create() {
    this.playerCharId = this.registry.get('selectedChar') ?? 'alan';
    this.manager = new CustomerManager();

    // Apply this character's random modifier range and id to every transaction
    const charCfg = getCharacter(this.playerCharId);
    this.manager.setCharModifiers(
      charCfg.counterBonus ?? 0,
      charCfg.counterCurse ?? 0,
      charCfg.name,
    );
    this.manager.setPlayerId(this.playerCharId);

    this.buildMap();
    this.createPlayerSprite();
    this.setupCamera();
    this.setupEventListeners();
    this.setupRowanTimer();

    // Start first customer after a short delay
    this.time.delayedCall(1200, () => this.spawnNextCustomer());
  }

  // ── Map ──────────────────────────────────────────────────────────────────────

  private buildMap() {
    for (let row = 0; row < MAP_HEIGHT; row++) {
      for (let col = 0; col < MAP_WIDTH; col++) {
        const tileId = MAP_DATA[row][col];
        const key = TILE_KEYS[tileId] ?? 'tile_floor';
        this.add.image(
          col * TILE_SIZE + TILE_SIZE / 2,
          row * TILE_SIZE + TILE_SIZE / 2,
          key,
        ).setDepth(0);
      }
    }
  }

  // ── Player sprite ─────────────────────────────────────────────────────────

  private createPlayerSprite() {
    const x = PLAYER_COL * TILE_SIZE + TILE_SIZE / 2;
    const y = PLAYER_ROW * TILE_SIZE + TILE_SIZE / 2;
    this.playerSprite = this.add.sprite(x, y, this.playerCharId, 0).setDepth(5);
  }

  // ── Camera ────────────────────────────────────────────────────────────────

  private setupCamera() {
    const mapW = MAP_WIDTH * TILE_SIZE;
    const mapH = MAP_HEIGHT * TILE_SIZE;

    // Zoom 1.5 is safe here — all HUD is handled by React (CounterUI), so
    // there are no Phaser text/rectangle elements that would misalign.
    this.cameras.main.setZoom(1.5);
    // No bounds — fixed view, so centerOn must be free to scroll left of x=0.

    // Centre camera between player (row 12) and customer stop (row 15),
    // horizontally on the counter's centre column (col 7 of the 2-12 bar).
    const cx = COUNTER_COL * TILE_SIZE + TILE_SIZE / 2;
    const cy = COUNTER_ROW * TILE_SIZE + TILE_SIZE / 2;
    this.cameras.main.centerOn(cx, cy);
  }

  // ── Event bus (Phaser ↔ React) ────────────────────────────────────────────

  private setupEventListeners() {
    // React → Phaser: player chose a response option
    this.game.events.on(EV.PLAYER_RESPONSE, this.handlePlayerResponse, this);
  }

  private emit(event: string, payload?: unknown) {
    this.game.events.emit(event, payload);
  }

  // ── Customer lifecycle ─────────────────────────────────────────────────────

  private spawnNextCustomer() {
    const state = this.manager.beginTransaction();
    const charCfg = getCharacter(this.playerCharId);
    this.emit(EV.CUSTOMER_ARRIVING, {
      name: state.customer.name,
      charBonus: charCfg.counterBonus ?? 0,
      charCurse: charCfg.counterCurse ?? 0,
      charName:  charCfg.name,
    });

    const startX = CUSTOMER_COUNTER_COL() * TILE_SIZE + TILE_SIZE / 2;
    const startY  = CUSTOMER_SPAWN_ROW   * TILE_SIZE + TILE_SIZE / 2;
    const targetY = CUSTOMER_COUNTER_ROW * TILE_SIZE + TILE_SIZE / 2;

    // Create or recycle the customer sprite
    if (this.customerSprite) {
      this.customerSprite.destroy();
    }
    this.customerSprite = this.add.sprite(startX, startY, state.customer.sprite, 4);
    this.customerSprite.setDepth(5);

    // Walk-up animation
    this.customerSprite.anims.play(`${state.customer.sprite}-walk-up`, true);

    this.tweens.add({
      targets: this.customerSprite,
      y: targetY,
      duration: 1800,
      ease: 'Linear',
      onComplete: () => {
        this.customerSprite?.anims.stop();
        this.customerSprite?.setFrame(4); // idle up frame

        const active = this.manager.activateTransaction();
        this.transactionActive = true;
        this.startExchange(active);
      },
    });
  }

  private startExchange(state: TransactionState) {
    const exchange = this.manager.currentExchange();
    if (!exchange) return;

    // Player faces the customer (down direction)
    this.playerSprite.setFrame(0);

    this.emit(EV.EXCHANGE_SHOW, {
      exchange,
      score: state.score,
      globalScore: state.globalScore,
      customerName: state.customer.name,
      customerDifficulty: state.customer.difficulty,
      exchangeIndex: state.exchangeIndex,
      totalExchanges: state.customer.exchanges.length,
    });
  }

  private handlePlayerResponse({ optionIndex }: { optionIndex: number }) {
    const exchange = this.manager.currentExchange();
    if (!exchange) return;

    const option = exchange.responses[optionIndex];
    const state = this.manager.applyResponse(option);

    this.emit(EV.SCORE_UPDATE, {
      score: state.score,
      globalScore: state.globalScore,
      delta: state.lastDelta,
      flavour: state.lastFlavour,
    });

    if (state.status === 'success' || state.status === 'failure') {
      this.endTransaction(state);
    } else {
      // Brief pause before next line
      this.time.delayedCall(600, () => this.startExchange(state));
    }
  }

  private endTransaction(state: TransactionState) {
    this.transactionActive = false;

    const isSuccess = state.status === 'success';
    this.emit(EV.TRANSACTION_END, {
      status: state.status,
      score: state.score,
      globalScore: state.globalScore,
      customerName: state.customer.name,
      customersServed: state.customersServed,
      customersLost: state.customersLost,
    });

    if (!this.customerSprite) return;

    // Customer reaction: small jump (success) or shake (failure)
    if (isSuccess) {
      this.tweens.add({
        targets: this.customerSprite,
        y: this.customerSprite.y - 12,
        yoyo: true,
        duration: 200,
        ease: 'Sine.easeOut',
        onComplete: () => this.walkCustomerOut(isSuccess),
      });
    } else {
      this.cameras.main.shake(400, 0.005);
      this.time.delayedCall(500, () => this.walkCustomerOut(isSuccess));
    }
  }

  private walkCustomerOut(happy: boolean) {
    if (!this.customerSprite) return;

    const charId = this.manager.getState()?.customer.sprite ?? 'amish';
    const anim = happy
      ? `${charId}-walk-down`
      : `${charId}-walk-down`;

    this.customerSprite.anims.play(anim, true);

    this.tweens.add({
      targets: this.customerSprite,
      y: (CUSTOMER_SPAWN_ROW + 4) * TILE_SIZE,
      duration: 1600,
      ease: 'Linear',
      onComplete: () => {
        this.customerSprite?.destroy();
        this.customerSprite = undefined;
        // Spawn next customer after a pause
        this.time.delayedCall(2000, () => this.spawnNextCustomer());
      },
    });
  }

  // ── Rowan interruption ────────────────────────────────────────────────────

  private setupRowanTimer() {
    this.rowanTimer = this.time.addEvent({
      delay: ROWAN_CHECK_MS,
      callback: this.checkRowanInterrupt,
      callbackScope: this,
      loop: true,
    });
  }

  private checkRowanInterrupt() {
    // Only fire during an active transaction, and only if player isn't Rowan
    if (!this.transactionActive) return;
    if (this.playerCharId === 'rowan') return;
    if (Math.random() > ROWAN_PROB) return;

    const line = this.manager.pickRowanLine();
    const state = this.manager.applyRowanPenalty(line);

    this.emit(EV.ROWAN_INTERRUPT, { line: line.text, penalty: line.penalty });
    this.emit(EV.SCORE_UPDATE, {
      score: state.score,
      globalScore: state.globalScore,
      delta: -line.penalty,
    });

    if (state.status === 'failure') {
      this.endTransaction(state);
    }
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────

  shutdown() {
    this.game.events.off(EV.PLAYER_RESPONSE, this.handlePlayerResponse, this);
    this.rowanTimer?.destroy();
  }
}

// Helpers ─────────────────────────────────────────────────────────────────────
function CUSTOMER_COUNTER_COL() { return COUNTER_COL; }
