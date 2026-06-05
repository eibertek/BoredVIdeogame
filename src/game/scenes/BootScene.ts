import * as Phaser from 'phaser';
import { TILE_SIZE, T } from '../constants';
import { getCharacter, type CharConfig } from '../characters';

export const FRAME_W = 48;
export const FRAME_H = 48;

// Characters that have real PNG sprite sheets
const PNG_CHARS = new Set(['rowan', 'alan', 'adam', 'ellie', 'amish', 'ben']);

// PNG sprite sheet row order: 0=walk_down, 1=walk_up, 2=walk_left, 3=walk_right
// Row 12=talk_down, 13=talk_up, 14=talk_left, 15=talk_right
// Frame number = row * 4 + col

// Eye colours per character
const EYE_COLORS: Record<string, number> = {
  rowan: 0x9ca3af, alan: 0x5b9bd5, adam: 0x7c5230,
  ellie: 0x92400e, brit: 0x06b6d4, amish: 0x4a3000, ben: 0x6b7280,
};

const HAIR_RADIUS: Record<string, number> = {
  rowan: 9, alan: 12, adam: 11, ellie: 12, brit: 15, amish: 12, ben: 10,
};

export class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'Boot' }); }

  // ── Preload PNGs ────────────────────────────────────────────────────────

  preload() {
    for (const id of PNG_CHARS) {
      this.load.spritesheet(id, `/assets/characters/${id}_sheet.png`, {
        frameWidth: FRAME_W,
        frameHeight: FRAME_H,
      });
    }
  }

  // ── Create ───────────────────────────────────────────────────────────────

  create() {
    this.generateTileTextures();

    // PNG characters — create animations from loaded sheets
    for (const id of PNG_CHARS) {
      this.createPNGAnimations(id);
    }

    // Brit has no PNG — generate sprite programmatically
    // Generated sprites: Brit (playable, no PNG) + Mariano (customer, no PNG)
    const brit = getCharacter('brit');
    this.generateBritTexture(brit);
    this.generateMarianoTexture();

    const mode: string = this.registry.get('gameMode') ?? 'explore';
    this.scene.start(mode === 'counter' ? 'Counter' : 'Office');
  }

  // ── PNG animation setup ───────────────────────────────────────────────

  private createPNGAnimations(id: string) {
    const dirs = ['down', 'up', 'left', 'right'];
    // Walk rows 0–3
    for (let row = 0; row < 4; row++) {
      const start = row * 4;
      this.anims.create({
        key: `${id}-walk-${dirs[row]}`,
        frames: this.anims.generateFrameNumbers(id, { start, end: start + 3 }),
        frameRate: 8,
        repeat: -1,
      });
    }
    // Talk rows 12–15
    for (let row = 0; row < 4; row++) {
      const start = (12 + row) * 4;
      this.anims.create({
        key: `${id}-talk-${dirs[row]}`,
        frames: this.anims.generateFrameNumbers(id, { start, end: start + 3 }),
        frameRate: 6,
        repeat: -1,
      });
    }
  }

  // ── Brit generated texture (4 cols × 4 rows, same layout as PNG) ─────

  private generateBritTexture(c: CharConfig) {
    const g = this.add.graphics();
    const dirs = ['down', 'up', 'left', 'right'];
    // PNG row order: down=row0, up=row1, left=row2, right=row3
    // Our drawCharFrame dir: 0=down, 3=up, 1=left, 2=right
    const pngRowToDir = [0, 3, 1, 2];

    for (let row = 0; row < 4; row++) {
      const dir = pngRowToDir[row];
      for (let col = 0; col < 4; col++) {
        this.drawCharFrame(g, col * FRAME_W, row * FRAME_H, c, dir, col);
      }
    }

    g.generateTexture(c.id, FRAME_W * 4, FRAME_H * 4);
    g.destroy();

    // Add numbered frame data so generateFrameNumbers works
    const tex = this.textures.get(c.id);
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        tex.add(row * 4 + col, 0, col * FRAME_W, row * FRAME_H, FRAME_W, FRAME_H);
      }
    }

    for (let row = 0; row < 4; row++) {
      const start = row * 4;
      this.anims.create({
        key: `brit-walk-${dirs[row]}`,
        frames: this.anims.generateFrameNumbers(c.id, { start, end: start + 3 }),
        frameRate: 8,
        repeat: -1,
      });
    }
  }

  // ── Mariano generated texture (customer-only character) ─────────────────

  private generateMarianoTexture() {
    const mariano: CharConfig = {
      id: 'mariano',
      name: 'Mariano',
      role: 'Customer',
      description: '',
      shirtColor: 0x1e40af,   // dark blue
      hairColor:  0x2d1b00,   // dark brown
      skinColor:  0xc8956c,   // medium
      pantsColor: 0x374151,
      expression: 'neutral',
      cardColor:  'from-blue-900 to-blue-700',
      startTile:  { x: 19, y: 25 },
      patrolPoints: [{ x: 19, y: 25 }],
      dialogues: [],
    };

    const g = this.add.graphics();
    const dirs = ['down', 'up', 'left', 'right'];
    const pngRowToDir = [0, 3, 1, 2];

    for (let row = 0; row < 4; row++) {
      const dir = pngRowToDir[row];
      for (let col = 0; col < 4; col++) {
        this.drawCharFrame(g, col * FRAME_W, row * FRAME_H, mariano, dir, col);
      }
    }

    g.generateTexture('mariano', FRAME_W * 4, FRAME_H * 4);
    g.destroy();

    const tex = this.textures.get('mariano');
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        tex.add(row * 4 + col, 0, col * FRAME_W, row * FRAME_H, FRAME_W, FRAME_H);
      }
    }

    for (let row = 0; row < 4; row++) {
      const start = row * 4;
      this.anims.create({
        key: `mariano-walk-${dirs[row]}`,
        frames: this.anims.generateFrameNumbers('mariano', { start, end: start + 3 }),
        frameRate: 8,
        repeat: -1,
      });
    }
  }

  // ── Arc helpers ──────────────────────────────────────────────────────────

  private fillArc(
    g: Phaser.GameObjects.Graphics,
    x: number, y: number, r: number,
    start: number, end: number, ccw = false,
  ) {
    g.beginPath(); g.arc(x, y, r, start, end, ccw); g.closePath(); g.fillPath();
  }

  private lighten(c: number, amt = 45): number {
    return (Math.min(255, ((c >> 16) & 0xff) + amt) << 16) |
      (Math.min(255, ((c >> 8) & 0xff) + amt) << 8) |
      Math.min(255, (c & 0xff) + amt);
  }

  private darken(c: number, amt = 40): number {
    return (Math.max(0, ((c >> 16) & 0xff) - amt) << 16) |
      (Math.max(0, ((c >> 8) & 0xff) - amt) << 8) |
      Math.max(0, (c & 0xff) - amt);
  }

  // ── Tile textures ────────────────────────────────────────────────────────

  private generateTileTextures() {
    this.mkTile('tile_floor', (g) => {
      g.fillStyle(0xd6c9a8); g.fillRect(0, 0, 32, 32);
      g.lineStyle(1, 0xc4b48e, 0.4); g.strokeRect(0, 0, 32, 32);
    });
    this.mkTile('tile_carpet', (g) => {
      g.fillStyle(0x3d5a80); g.fillRect(0, 0, 32, 32);
      g.fillStyle(0x4a6d9a, 0.3); g.fillRect(2, 2, 28, 28);
      g.lineStyle(1, 0x2e4460, 0.5); g.strokeRect(0, 0, 32, 32);
    });
    this.mkTile('tile_wall', (g) => {
      g.fillStyle(0x3d3d4f); g.fillRect(0, 0, 32, 32);
      g.fillStyle(0x484860, 0.5);
      [[0,0,15,7],[17,0,15,7],[0,16,15,7],[17,16,15,7],[8,8,16,7],[8,24,16,7]]
        .forEach(([x,y,w,h]) => g.fillRect(x,y,w,h));
      g.lineStyle(1, 0x2a2a3a, 0.8); g.strokeRect(0, 0, 32, 32);
    });
    this.mkTile('tile_desk', (g) => {
      g.fillStyle(0x8b5e3c); g.fillRect(0, 0, 32, 32);
      g.fillStyle(0xa0714f); g.fillRect(2, 2, 28, 28);
      g.fillStyle(0x6b4226); g.fillRect(0, 28, 32, 4);
      g.lineStyle(1, 0x6b4226); g.strokeRect(0, 0, 32, 32);
    });
    this.mkTile('tile_door', (g) => {
      g.fillStyle(0xd6c9a8); g.fillRect(0, 0, 32, 32);
      g.fillStyle(0x8b6914, 0.4); g.fillRect(8, 0, 16, 32);
    });
    this.mkTile('tile_window', (g) => {
      g.fillStyle(0x3d3d4f); g.fillRect(0, 0, 32, 32);
      g.fillStyle(0x87ceeb, 0.6); g.fillRect(4, 4, 24, 24);
      g.fillStyle(0xb0e0f8, 0.4); g.fillRect(6, 6, 10, 20); g.fillRect(18, 6, 10, 20);
      g.lineStyle(2, 0xffffff, 0.3); g.strokeRect(4, 4, 24, 24);
      g.lineBetween(16, 4, 16, 28); g.lineBetween(4, 16, 28, 16);
    });
    this.mkTile('tile_plant', (g) => {
      g.fillStyle(0xd6c9a8); g.fillRect(0, 0, 32, 32);
      g.fillStyle(0xb07040); g.fillRect(10, 20, 12, 10);
      g.fillStyle(0x228b22); g.fillCircle(16, 12, 9);
      g.fillStyle(0x32a832); g.fillCircle(11, 10, 6); g.fillCircle(21, 10, 6); g.fillCircle(16, 6, 5);
    });
    this.mkTile('tile_mtable', (g) => {
      g.fillStyle(0x5c3d1e); g.fillRect(0, 0, 32, 32);
      g.fillStyle(0x7a5230); g.fillRect(2, 2, 28, 28);
      g.lineStyle(2, 0x3d2810); g.strokeRect(0, 0, 32, 32);
    });
    this.mkTile('tile_counter', (g) => {
      g.fillStyle(0xc4a882); g.fillRect(0, 0, 32, 32);
      g.fillStyle(0xd4b88e); g.fillRect(2, 2, 28, 22);
      g.fillStyle(0xa08060); g.fillRect(0, 24, 32, 8);
      g.lineStyle(1, 0x8b6440); g.strokeRect(0, 0, 32, 32);
    });
    this.mkTile('tile_couch', (g) => {
      g.fillStyle(0xd6c9a8); g.fillRect(0, 0, 32, 32);
      g.fillStyle(0x7b3f3f); g.fillRect(2, 8, 28, 22);
      g.fillStyle(0x9b5555); g.fillRect(4, 10, 24, 18);
      g.fillStyle(0x7b3f3f); g.fillRect(2, 8, 4, 22); g.fillRect(26, 8, 4, 22);
    });
    this.mkTile('tile_ofloor', (g) => {
      g.fillStyle(0x3d2b1f); g.fillRect(0, 0, 32, 32);
      g.fillStyle(0x4a3528, 0.7); g.fillRect(0, 0, 15, 15); g.fillRect(17, 17, 15, 15);
      g.lineStyle(1, 0x2a1f15, 0.5); g.strokeRect(0, 0, 32, 32);
    });
    this.mkTile('tile_mfloor', (g) => {
      g.fillStyle(0xe8e0d0); g.fillRect(0, 0, 32, 32);
      g.lineStyle(1, 0xd0c8b8, 0.6);
      g.lineBetween(0, 16, 32, 16); g.lineBetween(16, 0, 16, 32);
    });
    this.mkTile('tile_bfloor', (g) => {
      g.fillStyle(0xf0f0e8); g.fillRect(0, 0, 32, 32);
      g.fillStyle(0xe0e0d8); g.fillRect(0, 0, 15, 15); g.fillRect(17, 17, 15, 15);
      g.lineStyle(1, 0xd0d0c8, 0.5); g.strokeRect(0, 0, 32, 32);
    });
    this.mkTile('tile_chair', (g) => {
      g.fillStyle(0xd6c9a8); g.fillRect(0, 0, 32, 32);
      g.fillStyle(0x1e3570); g.fillRect(6, 8, 20, 4);
      g.fillStyle(0x2d4a8a); g.fillRect(8, 10, 16, 16);
      g.fillStyle(0x888888); g.fillRect(8, 24, 4, 6); g.fillRect(20, 24, 4, 6);
    });
    this.mkTile('tile_cabinet', (g) => {
      g.fillStyle(0x808080); g.fillRect(0, 0, 32, 32);
      g.fillStyle(0x9a9a9a); g.fillRect(2, 2, 28, 13); g.fillRect(2, 17, 28, 13);
      g.fillStyle(0xc0c0c0); g.fillCircle(16, 8, 2); g.fillCircle(16, 23, 2);
      g.lineStyle(1, 0x606060); g.strokeRect(0, 0, 32, 32); g.lineBetween(0, 15, 32, 15);
    });
    this.mkTile('tile_monitor', (g) => {
      g.fillStyle(0xa0714f); g.fillRect(0, 0, 32, 32);
      g.fillStyle(0x1a1a2e); g.fillRoundedRect(6, 4, 20, 18, 2);
      g.fillStyle(0x3a7bd5, 0.8); g.fillRect(8, 6, 16, 14);
      g.fillStyle(0x808080); g.fillRect(14, 22, 4, 4); g.fillRect(10, 26, 12, 2);
    });
  }

  private mkTile(key: string, fn: (g: Phaser.GameObjects.Graphics) => void) {
    const g = this.add.graphics(); fn(g);
    g.generateTexture(key, TILE_SIZE, TILE_SIZE); g.destroy();
  }

  // ── Sprite frame drawing (for Brit only) ─────────────────────────────────

  private drawCharFrame(
    g: Phaser.GameObjects.Graphics,
    ox: number, oy: number,
    c: CharConfig, dir: number, frame: number,
  ) {
    const cx = ox + 24;
    // 4-frame walk cycle: idle, step1, step2, step1
    const sw = frame === 0 ? 0 : frame === 2 ? -4 : 4;

    if (dir === 0) this.drawDown(g, ox, oy, cx, c, sw);
    else if (dir === 3) this.drawUp(g, ox, oy, cx, c, sw);
    else this.drawSide(g, ox, oy, cx, c, sw, dir === 2);
  }

  private drawDown(g: Phaser.GameObjects.Graphics, ox: number, oy: number, cx: number, c: CharConfig, sw: number) {
    g.fillStyle(0x000000, 0.18); g.fillEllipse(cx, oy + 47, 30, 7);
    g.fillStyle(0x1a1a1a); g.fillRect(ox + 12, oy + 40 + sw, 12, 5); g.fillRect(ox + 26, oy + 40 - sw, 12, 5);
    g.fillStyle(0x2d1a0a); g.fillRect(ox + 13, oy + 41 + sw, 10, 3); g.fillRect(ox + 27, oy + 41 - sw, 10, 3);
    g.fillStyle(0x1a1a1a); g.fillRect(ox + 13, oy + 32 + sw, 11, 11); g.fillRect(ox + 26, oy + 32 - sw, 11, 11);
    g.fillStyle(c.pantsColor); g.fillRect(ox + 14, oy + 33 + sw, 9, 9); g.fillRect(ox + 27, oy + 33 - sw, 9, 9);
    g.fillStyle(this.lighten(c.pantsColor, 25)); g.fillRect(ox + 14, oy + 33 + sw, 4, 4); g.fillRect(ox + 27, oy + 33 - sw, 4, 4);
    const aw = Math.round(sw * 0.45);
    g.fillStyle(0x1a1a1a); g.fillRect(ox + 5, oy + 23 + aw, 9, 14); g.fillRect(ox + 36, oy + 23 - aw, 9, 14);
    g.fillStyle(c.shirtColor); g.fillRect(ox + 6, oy + 24 + aw, 7, 12); g.fillRect(ox + 37, oy + 24 - aw, 7, 12);
    g.fillStyle(0x1a1a1a); g.fillRect(ox + 12, oy + 22, 26, 14);
    g.fillStyle(c.shirtColor); g.fillRect(ox + 13, oy + 23, 24, 12);
    g.fillStyle(this.lighten(c.shirtColor, 35)); g.fillRect(ox + 14, oy + 23, 9, 4);
    g.fillStyle(this.darken(c.shirtColor, 25)); g.fillRect(ox + 13, oy + 31, 24, 4);
    g.fillStyle(0x1a1a1a); g.fillRect(ox + 20, oy + 21, 10, 4);
    g.fillStyle(c.skinColor); g.fillRect(ox + 21, oy + 22, 8, 3);
    g.fillStyle(0x1a1a1a); g.fillCircle(cx, oy + 13, 13);
    g.fillStyle(c.skinColor); g.fillCircle(cx, oy + 13, 12);
    g.fillStyle(this.darken(c.skinColor, 15)); g.fillRect(ox + 18, oy + 20, 12, 4);
    this.drawHairFront(g, cx, oy, c);
    const ec = EYE_COLORS[c.id] ?? 0x5b3a1a;
    this.drawEye(g, cx - 7, oy + 10, ec);
    this.drawEye(g, cx + 3, oy + 10, ec);
    g.fillStyle(this.darken(c.skinColor, 30)); g.fillRect(cx - 1, oy + 16, 2, 2);
    this.drawMouthFront(g, cx, oy + 19, c.expression);
    if (c.hasGlasses) this.drawGlassesFront(g, cx, oy + 10);
    if (c.hasTie) {
      const tc = c.tieColor ?? 0xef4444;
      g.fillStyle(0x1a1a1a); g.fillTriangle(cx - 3, oy + 23, cx + 3, oy + 23, cx, oy + 32);
      g.fillStyle(tc); g.fillTriangle(cx - 2, oy + 23, cx + 2, oy + 23, cx, oy + 31);
    }
  }

  private drawUp(g: Phaser.GameObjects.Graphics, ox: number, oy: number, cx: number, c: CharConfig, sw: number) {
    g.fillStyle(0x000000, 0.18); g.fillEllipse(cx, oy + 47, 30, 7);
    g.fillStyle(0x1a1a1a); g.fillRect(ox + 12, oy + 40 + sw, 12, 5); g.fillRect(ox + 26, oy + 40 - sw, 12, 5);
    g.fillStyle(0x2d1a0a); g.fillRect(ox + 13, oy + 41 + sw, 10, 3); g.fillRect(ox + 27, oy + 41 - sw, 10, 3);
    g.fillStyle(0x1a1a1a); g.fillRect(ox + 13, oy + 32 + sw, 11, 11); g.fillRect(ox + 26, oy + 32 - sw, 11, 11);
    g.fillStyle(c.pantsColor); g.fillRect(ox + 14, oy + 33 + sw, 9, 9); g.fillRect(ox + 27, oy + 33 - sw, 9, 9);
    const aw = Math.round(sw * 0.45);
    g.fillStyle(0x1a1a1a); g.fillRect(ox + 5, oy + 23 + aw, 9, 14); g.fillRect(ox + 36, oy + 23 - aw, 9, 14);
    g.fillStyle(c.shirtColor); g.fillRect(ox + 6, oy + 24 + aw, 7, 12); g.fillRect(ox + 37, oy + 24 - aw, 7, 12);
    g.fillStyle(0x1a1a1a); g.fillRect(ox + 12, oy + 22, 26, 14);
    g.fillStyle(c.shirtColor); g.fillRect(ox + 13, oy + 23, 24, 12);
    g.fillStyle(0x1a1a1a); g.fillRect(ox + 20, oy + 21, 10, 4);
    g.fillStyle(c.skinColor); g.fillRect(ox + 21, oy + 22, 8, 3);
    g.fillStyle(c.hairColor); g.fillCircle(cx, oy + 13, 13);
    g.fillStyle(this.lighten(c.hairColor, 20)); g.fillCircle(cx - 3, oy + 9, 4);
    g.fillStyle(this.darken(c.hairColor, 20)); g.fillCircle(cx + 2, oy + 15, 4);
    if (c.id === 'ellie' || c.id === 'brit') {
      g.fillStyle(0x1a1a1a); g.fillRect(ox + 14, oy + 22, 20, 5);
      g.fillStyle(c.hairColor); g.fillRect(ox + 15, oy + 22, 18, 4);
    }
  }

  private drawSide(g: Phaser.GameObjects.Graphics, ox: number, oy: number, cx: number, c: CharConfig, sw: number, facingRight: boolean) {
    const fd = facingRight ? 1 : -1;
    const faceX = cx + fd * 3;
    g.fillStyle(0x000000, 0.18); g.fillEllipse(cx, oy + 47, 30, 7);
    g.fillStyle(0x1a1a1a);
    g.fillRect(ox + 12, oy + 40 + sw, 12, 5); g.fillRect(ox + 15, oy + 40 - sw, 12, 5);
    g.fillStyle(0x2d1a0a);
    g.fillRect(ox + 13, oy + 41 + sw, 10, 3); g.fillRect(ox + 16, oy + 41 - sw, 10, 3);
    g.fillStyle(0x1a1a1a);
    g.fillRect(ox + 14, oy + 32 + sw, 10, 11); g.fillRect(ox + 16, oy + 32 - sw, 10, 11);
    g.fillStyle(c.pantsColor);
    g.fillRect(ox + 15, oy + 33 + sw, 8, 9); g.fillRect(ox + 17, oy + 33 - sw, 8, 9);
    const aw = Math.round(sw * 0.5);
    g.fillStyle(0x1a1a1a); g.fillRect(facingRight ? ox + 9 : ox + 31, oy + 22 + aw, 7, 13);
    g.fillStyle(this.darken(c.shirtColor, 20)); g.fillRect(facingRight ? ox + 10 : ox + 32, oy + 23 + aw, 5, 11);
    g.fillStyle(0x1a1a1a); g.fillRect(facingRight ? ox + 33 : ox + 10, oy + 22 - aw, 7, 13);
    g.fillStyle(c.shirtColor); g.fillRect(facingRight ? ox + 34 : ox + 11, oy + 23 - aw, 5, 11);
    g.fillStyle(0x1a1a1a); g.fillRect(ox + 13, oy + 22, 22, 14);
    g.fillStyle(c.shirtColor); g.fillRect(ox + 14, oy + 23, 20, 12);
    g.fillStyle(this.lighten(c.shirtColor, 30));
    g.fillRect(facingRight ? ox + 14 : ox + 20, oy + 23, 8, 5);
    g.fillStyle(0x1a1a1a); g.fillRect(ox + 19, oy + 21, 10, 4);
    g.fillStyle(c.skinColor); g.fillRect(ox + 20, oy + 22, 8, 3);
    g.fillStyle(0x1a1a1a); g.fillCircle(faceX, oy + 13, 13);
    g.fillStyle(c.skinColor); g.fillCircle(faceX, oy + 13, 12);
    const earX = faceX - fd * 10;
    g.fillStyle(0x1a1a1a); g.fillCircle(earX, oy + 14, 5);
    g.fillStyle(c.skinColor); g.fillCircle(earX, oy + 14, 4);
    g.fillStyle(this.darken(c.skinColor, 20)); g.fillCircle(earX, oy + 14, 2);
    this.drawHairSide(g, faceX, oy, c, facingRight);
    g.fillStyle(this.darken(c.skinColor, 25));
    g.fillRect(faceX + fd * 9, oy + 15, fd * 2, 2); g.fillRect(faceX + fd * 10, oy + 16, fd * 1, 2);
    const ec = EYE_COLORS[c.id] ?? 0x5b3a1a;
    this.drawEye(g, faceX + fd * 5, oy + 10, ec);
    if (c.hasGlasses) {
      g.lineStyle(1.5, 0x374151, 1);
      g.strokeRect(faceX + (facingRight ? 2 : -7), oy + 7, 6, 6);
    }
  }

  private drawEye(g: Phaser.GameObjects.Graphics, ex: number, ey: number, irisColor: number) {
    g.fillStyle(0x1a1a1a); g.fillRect(ex - 1, ey - 1, 8, 7);
    g.fillStyle(0xffffff); g.fillRect(ex, ey, 6, 5);
    g.fillStyle(irisColor); g.fillRect(ex + 1, ey, 4, 5);
    g.fillStyle(0x0a0a0a); g.fillRect(ex + 2, ey + 1, 2, 3);
    g.fillStyle(0xffffff); g.fillRect(ex + 1, ey + 1, 1, 1);
    g.fillStyle(0x1a1a1a); g.fillRect(ex, ey - 1, 6, 1);
  }

  private drawHairFront(g: Phaser.GameObjects.Graphics, cx: number, oy: number, c: CharConfig) {
    const r = HAIR_RADIUS[c.id] ?? 12;
    const hc = c.hairColor;
    const hl = this.lighten(hc, 30);
    const hd = this.darken(hc, 20);
    const hcy = oy + 13 - Math.max(0, r - 11);
    g.fillStyle(0x1a1a1a); g.fillCircle(cx, hcy, r + 1);
    g.fillStyle(hc); g.fillCircle(cx, hcy, r);
    g.fillStyle(hl); g.fillCircle(cx - Math.round(r * 0.35), hcy - Math.round(r * 0.3), Math.round(r * 0.4));
    g.fillStyle(hd); g.fillRect(cx - r + 1, hcy + Math.round(r * 0.5), r * 2 - 2, Math.round(r * 0.4));
    switch (c.id) {
      case 'rowan':
        g.fillStyle(0x1a1a1a); g.fillRect(cx - r, oy, r * 2, 4);
        g.fillStyle(hc); g.fillRect(cx - r + 1, oy + 1, r * 2 - 2, 3);
        g.fillStyle(hd); g.fillRect(cx - r + 1, hcy - 2, 4, 6);
        break;
      case 'alan':
        g.fillStyle(0x1a1a1a); g.fillEllipse(cx + 3, hcy - r - 1, 9, 7);
        g.fillStyle(hc); g.fillEllipse(cx + 3, hcy - r, 7, 6);
        g.fillStyle(hl); g.fillEllipse(cx + 2, hcy - r, 4, 3);
        break;
      case 'brit':
        g.fillStyle(0x1a1a1a); g.fillCircle(cx - r + 2, hcy - 3, 8); g.fillCircle(cx + r - 2, hcy - 3, 8);
        g.fillStyle(hc); g.fillCircle(cx - r + 3, hcy - 3, 7); g.fillCircle(cx + r - 3, hcy - 3, 7);
        g.fillStyle(hl); g.fillCircle(cx - r + 5, hcy - 5, 3); g.fillCircle(cx + r - 5, hcy - 5, 3);
        break;
      case 'amish':
        g.fillStyle(0x1a1a1a); g.fillRect(cx - r + 1, oy, r * 2 - 2, 3);
        g.fillStyle(hc); g.fillRect(cx - r + 2, oy + 1, r * 2 - 4, 2);
        break;
      case 'ben':
        g.fillStyle(hd); g.fillRect(cx + 1, hcy - r + 1, 3, r - 2);
        g.fillStyle(hl); g.fillRect(cx - r + 3, hcy - r + 3, 5, 4);
        break;
      case 'ellie':
        g.fillStyle(hl); g.fillRect(cx - r + 3, hcy - r + 2, 4, 6);
        g.fillStyle(0x1a1a1a); g.fillRect(cx + 6, hcy + r - 4, 8, 6);
        g.fillStyle(hc); g.fillRect(cx + 7, hcy + r - 3, 6, 5);
        break;
    }
    // Overdraw lower half with skin so hair only shows on top
    g.fillStyle(c.skinColor);
    this.fillArc(g, cx, oy + 13, 12, 0.1, Math.PI - 0.1, false);
  }

  private drawHairSide(g: Phaser.GameObjects.Graphics, faceX: number, oy: number, c: CharConfig, facingRight: boolean) {
    const hc = c.hairColor;
    const hl = this.lighten(hc, 30);
    const fd = facingRight ? 1 : -1;
    const r = HAIR_RADIUS[c.id] ?? 12;
    g.fillStyle(0x1a1a1a); g.fillCircle(faceX, oy + 13, r + 1);
    g.fillStyle(hc); g.fillCircle(faceX, oy + 13, r);
    g.fillStyle(hl); g.fillCircle(faceX - fd * 3, oy + 9, Math.round(r * 0.4));
    g.fillStyle(c.skinColor);
    this.fillArc(g, faceX, oy + 13, 12, facingRight ? -0.6 : Math.PI * 0.7, facingRight ? Math.PI * 0.7 : Math.PI + 0.6, false);
    if (c.id === 'brit') {
      const bx = faceX - fd * (r - 2);
      g.fillStyle(0x1a1a1a); g.fillCircle(bx, oy + 12, 7);
      g.fillStyle(hc); g.fillCircle(bx, oy + 12, 6);
    }
    if (c.id === 'ellie' || c.id === 'brit') {
      const nx = faceX - fd * 8;
      g.fillStyle(0x1a1a1a); g.fillRect(nx - 3, oy + 21, 8, 7);
      g.fillStyle(hc); g.fillRect(nx - 2, oy + 22, 6, 6);
    }
  }

  private drawMouthFront(g: Phaser.GameObjects.Graphics, cx: number, y: number, expr: CharConfig['expression']) {
    const d = 0x1a1a1a;
    if (expr === 'happy') {
      g.fillStyle(d);
      g.fillRect(cx - 3, y, 1, 2); g.fillRect(cx - 2, y + 1, 1, 2);
      g.fillRect(cx - 1, y + 2, 2, 1); g.fillRect(cx + 1, y + 1, 1, 2); g.fillRect(cx + 2, y, 1, 2);
      g.fillStyle(0xffffff); g.fillRect(cx - 2, y + 1, 4, 1);
    } else if (expr === 'grumpy') {
      g.fillStyle(d);
      g.fillRect(cx - 3, y + 2, 1, 2); g.fillRect(cx - 2, y + 1, 1, 2);
      g.fillRect(cx - 1, y, 2, 1); g.fillRect(cx + 1, y + 1, 1, 2); g.fillRect(cx + 2, y + 2, 1, 2);
      // Furrowed brows
      g.fillRect(cx - 9, y - 11, 5, 2); g.fillRect(cx - 8, y - 12, 4, 1);
      g.fillRect(cx + 4, y - 11, 5, 2); g.fillRect(cx + 4, y - 12, 4, 1);
    } else {
      g.fillStyle(d); g.fillRect(cx - 3, y + 1, 6, 2);
    }
  }

  private drawGlassesFront(g: Phaser.GameObjects.Graphics, cx: number, ey: number) {
    g.lineStyle(2, 0x374151, 1);
    g.strokeRect(cx - 10, ey - 2, 8, 8); g.strokeRect(cx + 2, ey - 2, 8, 8);
    g.lineBetween(cx - 2, ey + 2, cx + 2, ey + 2);
    g.lineBetween(cx - 10, ey + 2, cx - 13, ey + 1);
    g.lineBetween(cx + 10, ey + 2, cx + 13, ey + 1);
    g.lineStyle(1, 0xffffff, 0.5);
    g.lineBetween(cx - 9, ey - 1, cx - 6, ey - 1);
    g.lineBetween(cx + 3, ey - 1, cx + 6, ey - 1);
  }
}
