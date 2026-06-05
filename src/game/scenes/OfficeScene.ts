import * as Phaser from 'phaser';
import {
  TILE_SIZE, MAP_WIDTH, MAP_HEIGHT,
  GAME_WIDTH, GAME_HEIGHT,
  PLAYER_SPEED, NPC_SPEED, INTERACTION_DIST, T,
} from '../constants';
import { MAP_DATA, isSolid, getAreaName } from '../mapData';
import { CHARACTERS, getCharacter, type CharConfig } from '../characters';
import { type CustomerDef, EV } from '../types/customer';
import { CUSTOMERS } from '../data/dialogues';

// PNG frame layout: row * 4 + col
// Rows: 0=walk_down, 1=walk_up, 2=walk_left, 3=walk_right
//       12=talk_down, 13=talk_up, 14=talk_left, 15=talk_right
const IDLE_FRAME: Record<string, number> = {
  down: 0, up: 4, left: 8, right: 12,
};

// IDs that have counter-service dialogue trees (in dialogues.ts CUSTOMERS)
const COUNTER_CUSTOMER_IDS = new Set(CUSTOMERS.map(c => c.id));
// Counter staff zone — player must be here to trigger the counter mechanic
const STAFF_COL_MIN = 2, STAFF_COL_MAX = 12;
const STAFF_ROW_MIN = 10, STAFF_ROW_MAX = 13;
// Store exit — customers walk here then disappear
const EXIT_COL = 19, EXIT_ROW = 27;
// Pixel position of the counter waypoint — used to give a longer wait there
const COUNTER_WAIT_X = 7 * TILE_SIZE + TILE_SIZE / 2;
const COUNTER_WAIT_Y = 15 * TILE_SIZE + TILE_SIZE / 2;
// Exit path: col-8 down to row 26, then right past the WINDOW zone before stepping to door.
// Row 28 cols 1-12 are WINDOW (solid). The NPC body extends ~4px below row 27 so moving
// horizontally past col 12 in row 27 triggers a collision. Row 26 is safe.
const LEAVE_WAYPOINTS = [
  { x: 8,  y: 16 }, // step onto col-8 corridor
  { x: 8,  y: 26 }, // down to row 26 (row-28 WINDOW at col 8 — stay in row 26)
  { x: EXIT_COL, y: 26 }, // move right past WINDOW zone while in row 26
  { x: EXIT_COL, y: EXIT_ROW }, // step down to door (col 19 row 28 = DOOR, safe)
];

const TILE_KEYS: Record<number, string> = {
  [T.FLOOR]: 'tile_floor', [T.CARPET]: 'tile_carpet', [T.WALL]: 'tile_wall',
  [T.DESK]: 'tile_desk', [T.DOOR]: 'tile_door', [T.WINDOW]: 'tile_window',
  [T.PLANT]: 'tile_plant', [T.MTABLE]: 'tile_mtable', [T.COUNTER]: 'tile_counter',
  [T.COUCH]: 'tile_couch', [T.OFLOOR]: 'tile_ofloor', [T.MFLOOR]: 'tile_mfloor',
  [T.BFLOOR]: 'tile_bfloor', [T.CHAIR]: 'tile_chair', [T.CABINET]: 'tile_cabinet',
  [T.MONITOR]: 'tile_monitor',
};

interface NPC {
  sprite: Phaser.GameObjects.Sprite;
  config: CharConfig;
  patrolIndex: number;
  waitTimer: number;
  direction: string;
  moving: boolean;
  leavingStore?: boolean;
  leaveWaypoints?: { x: number; y: number }[];
  stuckMs: number;    // accumulated ms since last meaningful progress
  steerSide: 1 | -1; // which side to try when steering around an obstacle
}

export class OfficeScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Sprite;
  private playerConfig!: CharConfig;
  private playerDir = 'down';
  private playerBody!: Phaser.Physics.Arcade.Body;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private npcs: NPC[] = [];
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;

  // UI
  private dialogueBox!: Phaser.GameObjects.Rectangle;
  private dialogueBorderLine!: Phaser.GameObjects.Rectangle;
  private dialogueText!: Phaser.GameObjects.Text;
  private dialogueName!: Phaser.GameObjects.Text;
  private continueHintText!: Phaser.GameObjects.Text;
  private interactHint!: Phaser.GameObjects.Text;
  private areaLabel!: Phaser.GameObjects.Text;

  private dialogueOpen = false;
  private currentNPC: NPC | null = null;
  private dialogueIndex = 0;
  private nearbyNPC: NPC | null = null;
  private lastArea = '';

  // Counter-service mechanic (active when Alan interacts with a counter customer)
  private counterActive = false;
  private counterNPC: NPC | null = null;
  private counterState: { customer: CustomerDef; exchangeIndex: number; score: number } | null = null;
  private counterGlobalScore = 0;
  private counterServed = 0;
  private counterLost = 0;

  // Rowan idle-time interrupt: fires after ROWAN_TIMEOUT ms without a player response
  private rowanTimer: Phaser.Time.TimerEvent | null = null;
  private static readonly ROWAN_TIMEOUT   = 10000;
  private static readonly ROWAN_PENALTY   = 15;
  private static readonly ROWAN_LINES = [
    'Were you planning to serve that customer TODAY, or next week?',
    'That customer has been waiting 10 seconds. I am watching you.',
    'At this rate I would have served them AND rebooted the server.',
    'Management reminder: slowness affects YOUR performance review.',
    'That customer does not have ALL day. Neither do I.',
    'That is what scripts are for. USE. THE. SCRIPT.',
  ];

  constructor() { super({ key: 'Office' }); }

  create() {
    const charId: string = this.registry.get('selectedChar') ?? 'rowan';
    this.playerConfig = getCharacter(charId);

    this.buildMap();
    this.createPlayer();
    this.createNPCs(charId);
    this.setupCamera();
    this.setupInput();
    this.createUI();
    this.game.events.on(EV.PLAYER_RESPONSE, this.handleCounterResponse, this);
  }

  // ── Map ────────────────────────────────────────────────────────────────────

  private buildMap() {
    this.walls = this.physics.add.staticGroup();
    for (let row = 0; row < MAP_HEIGHT; row++) {
      for (let col = 0; col < MAP_WIDTH; col++) {
        const tileId = MAP_DATA[row][col];
        const key = TILE_KEYS[tileId] ?? 'tile_floor';
        const x = col * TILE_SIZE + TILE_SIZE / 2;
        const y = row * TILE_SIZE + TILE_SIZE / 2;
        this.add.image(x, y, key).setDepth(0);
        if (isSolid(row, col)) {
          const b = this.physics.add.staticImage(x, y, key);
          b.setAlpha(0);
          b.refreshBody();
          this.walls.add(b);
        }
      }
    }
  }

  // ── Player ────────────────────────────────────────────────────────────────

  private createPlayer() {
    const { x, y } = this.tileToWorld(this.playerConfig.startTile.x, this.playerConfig.startTile.y);
    // Start on idle-down frame (frame 0)
    this.player = this.physics.add.sprite(x, y, this.playerConfig.id, IDLE_FRAME.down);
    this.player.setDepth(5);
    this.playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    this.playerBody.setSize(28, 16).setOffset(10, 28);
    this.playerBody.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.walls);
  }

  // ── NPCs ──────────────────────────────────────────────────────────────────

  private createNPCs(playerId: string) {
    for (const cfg of CHARACTERS) {
      if (cfg.id === playerId) continue;
      const { x, y } = this.tileToWorld(cfg.startTile.x, cfg.startTile.y);
      const sprite = this.physics.add.sprite(x, y, cfg.id, IDLE_FRAME.down);
      sprite.setDepth(5);
      (sprite.body as Phaser.Physics.Arcade.Body).setSize(28, 16).setOffset(10, 28);
      this.physics.add.collider(sprite, this.walls);
      this.physics.add.collider(sprite, this.player);

      this.add.text(x, y - 30, cfg.name, {
        fontSize: '9px', fontFamily: 'monospace', color: '#ffffff',
        stroke: '#000000', strokeThickness: 3,
        backgroundColor: '#00000060', padding: { x: 3, y: 1 },
      }).setDepth(10).setOrigin(0.5, 1).setName(`nametag_${cfg.id}`);

      this.npcs.push({ sprite, config: cfg, patrolIndex: 0, waitTimer: 0, direction: 'down', moving: false, stuckMs: 0, steerSide: 1 });
    }
  }

  // ── Camera ────────────────────────────────────────────────────────────────

  private setupCamera() {
    const mapW = MAP_WIDTH * TILE_SIZE;
    const mapH = MAP_HEIGHT * TILE_SIZE;
    this.physics.world.setBounds(0, 0, mapW, mapH);
    this.cameras.main.setBounds(0, 0, mapW, mapH);
    // No Phaser zoom — canvas is CSS-scaled in GameCanvas.tsx instead.
    // This keeps all UI coordinate math at 1:1.
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
  }

  // ── Input ─────────────────────────────────────────────────────────────────

  private setupInput() {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    this.input.keyboard!.on('keydown-E', () => {
      if (this.counterActive) return;
      if (this.dialogueOpen) {
        this.advanceDialogue();
      } else if (this.nearbyNPC) {
        const npc = this.nearbyNPC;
        if (COUNTER_CUSTOMER_IDS.has(npc.config.id) && this.isPlayerAtCounter()) {
          this.openCounterInteraction(npc);
        } else {
          this.openDialogue(npc);
        }
      }
    });

    this.input.keyboard!.on('keydown-SPACE', () => {
      if (this.counterActive) return;
      if (this.dialogueOpen) this.advanceDialogue();
    });
  }

  // ── UI ────────────────────────────────────────────────────────────────────

  private createUI() {
    // Dialogue box — fixed to screen with setScrollFactor(0)
    // Positions are in native game pixels (800×600), no zoom applied here.
    this.dialogueBox = this.add
      .rectangle(0, GAME_HEIGHT - 110, GAME_WIDTH, 110, 0x0a0a1a, 0.93)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(20).setVisible(false);

    this.dialogueBorderLine = this.add
      .rectangle(0, GAME_HEIGHT - 110, GAME_WIDTH, 3, 0x4a90d9)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(21).setVisible(false);

    this.dialogueName = this.add
      .text(18, GAME_HEIGHT - 105, '', {
        fontSize: '11px', fontFamily: '"Press Start 2P", monospace', color: '#4fc3f7',
      }).setScrollFactor(0).setDepth(21).setVisible(false);

    this.dialogueText = this.add
      .text(18, GAME_HEIGHT - 82, '', {
        fontSize: '12px', fontFamily: 'monospace', color: '#ffffff',
        wordWrap: { width: GAME_WIDTH - 50 }, lineSpacing: 5,
      }).setScrollFactor(0).setDepth(21).setVisible(false);

    this.continueHintText = this.add
      .text(GAME_WIDTH - 16, GAME_HEIGHT - 10, '▼ E / SPACE', {
        fontSize: '9px', fontFamily: 'monospace', color: '#888888',
      }).setOrigin(1, 1).setScrollFactor(0).setDepth(21).setVisible(false);

    this.interactHint = this.add
      .text(0, 0, '[ E ] Talk', {
        fontSize: '10px', fontFamily: 'monospace', color: '#ffeb3b',
        stroke: '#000000', strokeThickness: 3,
        backgroundColor: '#00000080', padding: { x: 4, y: 2 },
      }).setDepth(15).setOrigin(0.5, 1).setVisible(false);

    this.areaLabel = this.add
      .text(GAME_WIDTH - 10, 10, '', {
        fontSize: '10px', fontFamily: 'monospace', color: '#cccccc',
        stroke: '#000000', strokeThickness: 2,
        backgroundColor: '#00000080', padding: { x: 6, y: 3 },
      }).setOrigin(1, 0).setScrollFactor(0).setDepth(20);

    this.add
      .text(10, 10, `Playing as: ${this.playerConfig.name}`, {
        fontSize: '10px', fontFamily: 'monospace', color: '#ffffff',
        stroke: '#000000', strokeThickness: 2,
        backgroundColor: '#00000080', padding: { x: 6, y: 3 },
      }).setOrigin(0, 0).setScrollFactor(0).setDepth(20);

    this.add.text(10, GAME_HEIGHT - 10, 'WASD / Arrows: Move  |  E: Talk', {
      fontSize: '9px', fontFamily: 'monospace', color: '#666666',
    }).setOrigin(0, 1).setScrollFactor(0).setDepth(20);
  }

  // ── Dialogue ──────────────────────────────────────────────────────────────

  private openDialogue(npc: NPC) {
    this.dialogueOpen = true;
    this.currentNPC = npc;
    this.dialogueIndex = 0;

    // Face the player
    const dx = this.player.x - npc.sprite.x;
    const dy = this.player.y - npc.sprite.y;
    npc.direction = Math.abs(dx) > Math.abs(dy)
      ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    (npc.sprite.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    npc.moving = false;

    // Play talk animation if available, else freeze on idle frame
    const talkKey = `${npc.config.id}-talk-${npc.direction}`;
    if (this.anims.exists(talkKey)) {
      npc.sprite.anims.play(talkKey, true);
    } else {
      npc.sprite.anims.stop();
      npc.sprite.setFrame(IDLE_FRAME[npc.direction] ?? 0);
    }

    // Player faces NPC
    const pdx = npc.sprite.x - this.player.x;
    const pdy = npc.sprite.y - this.player.y;
    this.playerDir = Math.abs(pdx) > Math.abs(pdy)
      ? (pdx > 0 ? 'right' : 'left') : (pdy > 0 ? 'down' : 'up');
    this.player.anims.stop();
    this.player.setFrame(IDLE_FRAME[this.playerDir] ?? 0);
    this.playerBody.setVelocity(0, 0);

    this.showDialogueLine(npc);
  }

  private showDialogueLine(npc: NPC) {
    const line = npc.config.dialogues[this.dialogueIndex % npc.config.dialogues.length];
    this.dialogueBox.setVisible(true);
    this.dialogueBorderLine.setVisible(true);
    this.dialogueName.setText(npc.config.name).setVisible(true);
    this.dialogueText.setText(line).setVisible(true);
    this.continueHintText.setVisible(true);
    this.interactHint.setVisible(false);
  }

  private advanceDialogue() {
    this.dialogueIndex++;
    if (this.dialogueIndex >= (this.currentNPC?.config.dialogues.length ?? 1)) {
      this.closeDialogue();
    } else if (this.currentNPC) {
      this.showDialogueLine(this.currentNPC);
    }
  }

  private closeDialogue() {
    // Stop talk animation, return NPC to idle
    if (this.currentNPC) {
      this.currentNPC.sprite.anims.stop();
      this.currentNPC.sprite.setFrame(IDLE_FRAME[this.currentNPC.direction] ?? 0);
    }
    this.dialogueOpen = false;
    this.currentNPC = null;
    this.dialogueBox.setVisible(false);
    this.dialogueBorderLine.setVisible(false);
    this.dialogueName.setVisible(false);
    this.dialogueText.setVisible(false);
    this.continueHintText.setVisible(false);
  }

  // ── Update ────────────────────────────────────────────────────────────────

  update(_time: number, delta: number) {
    if (!this.dialogueOpen && !this.counterActive) this.handlePlayerMovement();
    this.updateNPCs(delta);
    this.updateNameTags();
    this.checkNearbyNPC();
    this.updateAreaLabel();
  }

  private handlePlayerMovement() {
    const speed = PLAYER_SPEED;
    let vx = 0, vy = 0;
    const left = this.cursors.left.isDown || this.wasd.A.isDown;
    const right = this.cursors.right.isDown || this.wasd.D.isDown;
    const up = this.cursors.up.isDown || this.wasd.W.isDown;
    const down = this.cursors.down.isDown || this.wasd.S.isDown;

    if (left) { vx = -speed; this.playerDir = 'left'; }
    else if (right) { vx = speed; this.playerDir = 'right'; }
    if (up) { vy = -speed; if (!left && !right) this.playerDir = 'up'; }
    else if (down) { vy = speed; if (!left && !right) this.playerDir = 'down'; }

    if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }
    this.playerBody.setVelocity(vx, vy);

    if (vx !== 0 || vy !== 0) {
      this.player.anims.play(`${this.playerConfig.id}-walk-${this.playerDir}`, true);
    } else {
      this.player.anims.stop();
      this.player.setFrame(IDLE_FRAME[this.playerDir] ?? 0);
    }
  }

  private updateNPCs(delta: number) {
    for (const npc of this.npcs) {
      if (this.dialogueOpen && npc === this.currentNPC) continue;
      if (this.counterActive && npc === this.counterNPC) continue;
      const body = npc.sprite.body as Phaser.Physics.Arcade.Body;

      if (npc.leavingStore) {
        this.updateLeavingNPC(npc, body);
        continue;
      }

      if (npc.waitTimer > 0) {
        npc.waitTimer -= delta;
        body.setVelocity(0, 0);
        npc.sprite.anims.stop();
        npc.sprite.setFrame(IDLE_FRAME[npc.direction] ?? 0);
        // Reappear at door when respawn pause ends
        if (npc.waitTimer <= 0 && npc.sprite.alpha === 0) {
          npc.sprite.setAlpha(1);
          const tag = this.children.getByName(`nametag_${npc.config.id}`) as Phaser.GameObjects.Text | null;
          if (tag) tag.setAlpha(1);
        }
        continue;
      }
      // Don't interact with or detect invisible NPCs
      if (npc.sprite.alpha === 0) continue;

      const target = npc.config.patrolPoints[npc.patrolIndex];
      const { x: tx, y: ty } = this.tileToWorld(target.x, target.y);
      const dx = tx - npc.sprite.x;
      const dy = ty - npc.sprite.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 4) {
        npc.sprite.setPosition(tx, ty);
        body.setVelocity(0, 0);
        npc.patrolIndex = (npc.patrolIndex + 1) % npc.config.patrolPoints.length;
        // Long pause only at the counter tile — quick step everywhere else
        const atCounter = Math.abs(tx - COUNTER_WAIT_X) < 4 && Math.abs(ty - COUNTER_WAIT_Y) < 4;
        npc.waitTimer = atCounter
          ? Phaser.Math.Between(4000, 6000)
          : Phaser.Math.Between(200, 500);
        npc.moving = false;
        npc.stuckMs  = 0;
        npc.steerSide = 1; // reset avoidance bias for next segment
      } else {
        this.moveNPCToward(npc, body, dx, dy, dist);
      }
    }
  }

  private updateNameTags() {
    for (const npc of this.npcs) {
      const tag = this.children.getByName(`nametag_${npc.config.id}`) as Phaser.GameObjects.Text | null;
      if (tag) tag.setPosition(npc.sprite.x, npc.sprite.y - 30);
    }
  }

  private checkNearbyNPC() {
    if (this.dialogueOpen || this.counterActive) { this.interactHint.setVisible(false); return; }
    let closest: NPC | null = null;
    let closestDist = INTERACTION_DIST;
    for (const npc of this.npcs) {
      if (npc.sprite.alpha === 0) continue; // invisible — not interactable
      const dx = this.player.x - npc.sprite.x;
      const dy = this.player.y - npc.sprite.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < closestDist) { closestDist = d; closest = npc; }
    }
    this.nearbyNPC = closest;
    if (closest) {
      this.interactHint.setPosition(this.player.x, this.player.y - 32).setVisible(true);
    } else {
      this.interactHint.setVisible(false);
    }
  }

  private updateAreaLabel() {
    const col = Math.floor(this.player.x / TILE_SIZE);
    const row = Math.floor(this.player.y / TILE_SIZE);
    const area = getAreaName(row, col);
    if (area !== this.lastArea) {
      this.lastArea = area;
      this.areaLabel.setText(area);
    }
  }

  // ── Obstacle-avoiding NPC movement ────────────────────────────────────────

  private moveNPCToward(
    npc: NPC,
    body: Phaser.Physics.Arcade.Body,
    dx: number, dy: number, dist: number,
  ) {
    const ux = dx / dist;   // unit vector toward target
    const uy = dy / dist;

    // body.touching reflects collisions from the previous physics frame.
    // If the NPC is pressing into a wall, steer perpendicular to get around it.
    const t = body.touching;
    const blockedH = (ux < 0 && t.left)  || (ux > 0 && t.right);
    const blockedV = (uy < 0 && t.up)    || (uy > 0 && t.down);

    if (blockedH || blockedV) {
      npc.stuckMs += 16; // approximate — exact delta not needed here
      if (npc.stuckMs > 700) {
        // Flip to the other side so the NPC tries the other way around
        npc.steerSide = (-npc.steerSide) as 1 | -1;
        npc.stuckMs = 0;
      }
      // Perpendicular unit vector: rotate 90° in steerSide direction
      const px = -uy * npc.steerSide;
      const py =  ux * npc.steerSide;
      body.setVelocity(px * NPC_SPEED, py * NPC_SPEED);
    } else {
      npc.stuckMs = 0;
      body.setVelocity(ux * NPC_SPEED, uy * NPC_SPEED);
    }

    npc.moving = true;
    npc.direction = Math.abs(dx) > Math.abs(dy)
      ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    npc.sprite.anims.play(`${npc.config.id}-walk-${npc.direction}`, true);
  }

  private tileToWorld(col: number, row: number) {
    return { x: col * TILE_SIZE + TILE_SIZE / 2, y: row * TILE_SIZE + TILE_SIZE / 2 };
  }

  // ── Counter-service mechanic ───────────────────────────────────────────────

  private isPlayerAtCounter(): boolean {
    const col = Math.floor(this.player.x / TILE_SIZE);
    const row = Math.floor(this.player.y / TILE_SIZE);
    return col >= STAFF_COL_MIN && col <= STAFF_COL_MAX
        && row >= STAFF_ROW_MIN && row <= STAFF_ROW_MAX;
  }

  private openCounterInteraction(npc: NPC) {
    const customerDef = CUSTOMERS.find(c => c.id === npc.config.id);
    if (!customerDef) { this.openDialogue(npc); return; }

    const [min, max] = customerDef.scoreRange;
    const score = Math.floor(Math.random() * (max - min + 1)) + min;

    this.counterState = { customer: customerDef, exchangeIndex: 0, score };
    this.counterActive = true;
    this.counterNPC = npc;

    (npc.sprite.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    npc.moving = false;
    npc.sprite.anims.stop();
    npc.sprite.setFrame(4); // idle-up (facing staff)

    this.player.anims.stop();
    this.player.setFrame(0); // idle-down (facing customer)
    this.playerBody.setVelocity(0, 0);

    this.game.events.emit(EV.CUSTOMER_ARRIVING, {
      name: customerDef.name,
      charBonus: this.playerConfig.counterBonus ?? 0,
      charCurse: this.playerConfig.counterCurse ?? 0,
      charName:  this.playerConfig.name,
    });
    this.time.delayedCall(400, () => this.showCounterExchange());
  }

  private showCounterExchange() {
    if (!this.counterState) return;
    const { customer, exchangeIndex, score } = this.counterState;
    const exchange = customer.exchanges[exchangeIndex];
    if (!exchange) return;

    this.game.events.emit(EV.EXCHANGE_SHOW, {
      exchange,
      score,
      globalScore: this.counterGlobalScore,
      customerName: customer.name,
      customerDifficulty: customer.difficulty,
      exchangeIndex,
      totalExchanges: customer.exchanges.length,
    });

    // Start idle timer — Rowan appears if the player doesn't respond in time
    this.cancelRowanTimer();
    this.rowanTimer = this.time.delayedCall(
      OfficeScene.ROWAN_TIMEOUT,
      this.onRowanTimeout,
      [],
      this,
    );
  }

  private cancelRowanTimer() {
    if (this.rowanTimer) {
      this.rowanTimer.remove(false);
      this.rowanTimer = null;
    }
  }

  private onRowanTimeout() {
    if (!this.counterState || !this.counterActive) return;
    if (this.playerConfig.id === 'rowan') return; // Rowan does not interrupt himself

    const penalty = OfficeScene.ROWAN_PENALTY;
    const line = Phaser.Utils.Array.GetRandom(OfficeScene.ROWAN_LINES) as string;
    this.rowanTimer = null;

    this.counterState.score -= penalty;

    this.game.events.emit(EV.ROWAN_INTERRUPT, { line, penalty });
    this.game.events.emit(EV.SCORE_UPDATE, {
      score: this.counterState.score,
      globalScore: this.counterGlobalScore,
      delta: -penalty,
      flavour: 'Rowan interrupted',
    });

    if (this.counterState.score <= 0) {
      this.endCounterInteraction(false);
    } else {
      // Player still hasn't responded — restart timer for the same exchange
      this.rowanTimer = this.time.delayedCall(
        OfficeScene.ROWAN_TIMEOUT,
        this.onRowanTimeout,
        [],
        this,
      );
    }
  }

  private handleCounterResponse({ optionIndex }: { optionIndex: number }) {
    if (!this.counterState || !this.counterActive) return;
    this.cancelRowanTimer();

    const { customer, exchangeIndex, score } = this.counterState;
    const exchange = customer.exchanges[exchangeIndex];
    if (!exchange) return;

    const option = exchange.responses[optionIndex];

    // Character modifier: random value in [-curse, +bonus] applied per response
    const bonus    = this.playerConfig.counterBonus ?? 0;
    const curse    = this.playerConfig.counterCurse ?? 0;
    const modRange = bonus + curse;
    const charMod  = modRange > 0
      ? Math.floor(Math.random() * (modRange + 1)) - curse
      : 0;

    let newScore = score + option.delta + charMod;
    if (option.effect === 'discount') newScore += 15;
    else if (option.effect === 'surcharge') newScore -= 20;
    if (option.globalBonus) this.counterGlobalScore += option.globalBonus;

    this.counterState.score = newScore;
    this.counterState.exchangeIndex++;

    // Build flavour: response text + char modifier feedback when non-zero
    const flavourParts: string[] = [];
    if (option.flavourText) flavourParts.push(option.flavourText);
    if (charMod !== 0) {
      const sign = charMod > 0 ? '+' : '';
      flavourParts.push(`${charMod > 0 ? '✨' : '💀'} ${this.playerConfig.name}: ${sign}${charMod}`);
    }

    this.game.events.emit(EV.SCORE_UPDATE, {
      score: newScore,
      globalScore: this.counterGlobalScore,
      delta: option.delta + charMod,
      flavour: flavourParts.join(' · ') || option.flavourText,
    });

    const finished = this.counterState.exchangeIndex >= customer.exchanges.length;
    const success = newScore >= customer.successThreshold
      || (finished && newScore >= customer.closingThreshold);
    const failure = newScore <= 0
      || (finished && !success);

    if (success || failure) {
      this.endCounterInteraction(success);
    } else {
      this.time.delayedCall(600, () => this.showCounterExchange());
    }
  }

  private endCounterInteraction(success: boolean) {
    if (!this.counterState) return;
    this.cancelRowanTimer();
    const { customer, score } = this.counterState;

    if (success) {
      this.counterGlobalScore += Math.floor(score / 10);
      this.counterServed++;
    } else {
      this.counterLost++;
    }

    this.game.events.emit(EV.TRANSACTION_END, {
      status: success ? 'success' : 'failure',
      score,
      globalScore: this.counterGlobalScore,
      customerName: customer.name,
      customersServed: this.counterServed,
      customersLost: this.counterLost,
    });

    this.counterActive = false;
    this.counterState = null;

    // Customer walks to exit and respawns at their startTile
    if (this.counterNPC) {
      this.counterNPC.leavingStore = true;
      this.counterNPC.leaveWaypoints = [...LEAVE_WAYPOINTS];
      this.counterNPC = null;
    }
  }

  private updateLeavingNPC(npc: NPC, body: Phaser.Physics.Arcade.Body) {
    if (!npc.leaveWaypoints?.length) {
      // Reached exit door — hide NPC and teleport to startTile
      npc.sprite.setAlpha(0);
      const tag = this.children.getByName(`nametag_${npc.config.id}`) as Phaser.GameObjects.Text | null;
      if (tag) tag.setAlpha(0);

      const { x: sx, y: sy } = this.tileToWorld(npc.config.startTile.x, npc.config.startTile.y);
      npc.sprite.setPosition(sx, sy);
      body.reset(sx, sy);
      npc.leavingStore = false;
      npc.leaveWaypoints = undefined;
      npc.patrolIndex = 0;
      npc.waitTimer = Phaser.Math.Between(4000, 8000); // off-screen pause
      npc.moving = false;
      npc.sprite.anims.stop();
      npc.sprite.setFrame(IDLE_FRAME.down);
      return;
    }

    const wp = npc.leaveWaypoints[0];
    const { x: tx, y: ty } = this.tileToWorld(wp.x, wp.y);
    const dx = tx - npc.sprite.x;
    const dy = ty - npc.sprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 8) {
      npc.leaveWaypoints.shift();
      npc.stuckMs = 0;
    } else {
      this.moveNPCToward(npc, body, dx, dy, dist);
    }
  }

  shutdown() {
    this.game.events.off(EV.PLAYER_RESPONSE, this.handleCounterResponse, this);
  }
}
