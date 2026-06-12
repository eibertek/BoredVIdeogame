import { T, MAP_WIDTH, MAP_HEIGHT, SOLID_TILES } from './constants';

// ──────────────────────────────────────────────────────────────────────────────
//  TechTown — top-down tech store layout
//
//  Map 40 × 30 tiles (each 32 px = 1280 × 960 px total)
//
//  Row  0      Outer back wall (red brick)
//  Row  1      Back windows / display signage
//  Rows 2-3    Back wall shelving (full width, wall-hugging)
//  Rows 4-13   Main shop floor
//    Cols 0-1  Left wall (brick)
//    Cols 38-39 Right wall (brick)
//    Cols 1-3  Left wall shelves (cabinets)
//    Cols 36-38 Right wall shelves (cabinets)
//    Rows 4-8  Center aisle: shelf islands (laptops / gaming)
//    Rows 9-13 Center aisle: demo tables + open floor
//  Rows 10-14  Counter zone — left side (cols 2-12)
//  Rows 15-22  Lower shop floor — peripherals & accessories
//  Rows 23-24  Open floor / last-chance zone
//  Rows 25-27  Entrance lobby (light cream floor)
//  Row  28     Front windows + glass entrance doors
//  Row  29     Outer front wall
// ──────────────────────────────────────────────────────────────────────────────

function buildMap(): number[][] {
  const m: number[][] = Array.from({ length: MAP_HEIGHT }, () =>
    new Array(MAP_WIDTH).fill(T.FLOOR),
  );

  const set  = (r: number, c: number, tile: number) => { m[r][c] = tile; };
  const fill = (r1: number, c1: number, r2: number, c2: number, tile: number) => {
    for (let r = r1; r <= r2; r++)
      for (let c = c1; c <= c2; c++)
        m[r][c] = tile;
  };

  // ── Outer boundary ──────────────────────────────────────────────────────────
  for (let c = 0; c < MAP_WIDTH; c++) { m[0][c] = T.WALL; m[MAP_HEIGHT - 1][c] = T.WALL; }
  for (let r = 0; r < MAP_HEIGHT; r++) { m[r][0] = T.WALL; m[r][MAP_WIDTH - 1] = T.WALL; }

  // ── Back windows row 1 ──────────────────────────────────────────────────────
  for (let c = 1; c <= 38; c++) m[1][c] = T.WINDOW;

  // ── Left side wall (inner structural wall col 1, rows 2-24) ────────────────
  // (col 0 is outer WALL, col 1 stays as floor — it's a walkable aisle)

  // ── Back wall shelves (rows 2-3, full width minus walls) ───────────────────
  // These represent the big shelving units along the entire back wall
  for (let c = 1; c <= 38; c++) {
    m[2][c] = T.CABINET;
    m[3][c] = T.CABINET;
  }
  // Planting some back-wall signs/plants for variety
  set(2, 6,  T.PLANT);
  set(2, 13, T.PLANT);
  set(2, 20, T.PLANT);
  set(2, 27, T.PLANT);
  set(2, 34, T.PLANT);

  // ── Left wall shelving (cols 1-2, rows 4-22) ───────────────────────────────
  for (let r = 4; r <= 22; r++) {
    m[r][1] = T.CABINET;
    m[r][2] = T.CABINET;
  }
  // Left wall plants (break up shelves visually)
  set(6,  1, T.PLANT);
  set(12, 1, T.PLANT);
  set(18, 1, T.PLANT);

  // ── Right wall shelving (cols 37-38, rows 4-22) ────────────────────────────
  for (let r = 4; r <= 22; r++) {
    m[r][37] = T.CABINET;
    m[r][38] = T.CABINET;
  }
  // Right wall plants
  set(4,  38, T.PLANT);
  set(10, 38, T.PLANT);
  set(16, 38, T.PLANT);
  set(22, 38, T.PLANT);

  // ──────────────────────────────────────────────────────────────────────────
  //  COUNTER — checkout counter, left-center area
  //  Staff area:    rows 10-13, cols 3-13 (open floor behind counter)
  //  Counter bar:   row 14, cols 3-13   (solid — customer-facing desk)
  //  Customer side: rows 15+ (open floor)
  // ──────────────────────────────────────────────────────────────────────────
  for (let c = 3; c <= 13; c++) m[14][c] = T.COUNTER;
  // Left vertical cap
  m[11][3] = T.COUNTER; m[12][3] = T.COUNTER; m[13][3] = T.COUNTER;

  // Staff equipment on staff side (row 13)
  set(13, 5,  T.CHAIR); set(13, 6,  T.MONITOR);
  set(13, 8,  T.CHAIR); set(13, 9,  T.MONITOR);
  set(13, 11, T.CHAIR); set(13, 12, T.MONITOR);

  // Small storage at back of counter area
  set(10, 12, T.CABINET); set(10, 11, T.CABINET); set(10, 10, T.CABINET);

  // Plants flanking the counter
  set(10, 3, T.PLANT);
  set(15, 3, T.PLANT);

  // ── SHELF ISLANDS — center floor display units ──────────────────────────────
  // Helper: single shelf island (DESK = display top, CABINET = storage bottom)
  const island = (r: number, c: number) => {
    set(r,     c,     T.DESK);    set(r,     c + 1, T.MONITOR);
    set(r + 1, c,     T.CABINET); set(r + 1, c + 1, T.CABINET);
  };

  // Flat 4-wide wall shelf
  const wallShelf = (r: number, c: number, w = 4) => {
    for (let i = 0; i < w; i++) set(r, c + i, T.CABINET);
  };

  // ── AISLE A (rows 4-5): laptops / computers — center-right ─────────────────
  for (const c of [15, 19, 23, 27, 31]) island(4, c);

  // ── AISLE B (rows 7-8): gaming / accessories ───────────────────────────────
  for (const c of [15, 19, 23, 27, 31]) island(7, c);

  // ── Demo tables (rows 10-11): product trial area ────────────────────────────
  fill(10,  16, 11, 20, T.MTABLE); // demo table A
  fill(10,  24, 11, 28, T.MTABLE); // demo table B
  fill(10,  30, 11, 34, T.MTABLE); // demo table C
  // Chairs around demo tables
  for (let c = 16; c <= 20; c++) { set(9, c, T.CHAIR); set(12, c, T.CHAIR); }
  for (let c = 24; c <= 28; c++) { set(9, c, T.CHAIR); set(12, c, T.CHAIR); }
  for (let c = 30; c <= 34; c++) { set(9, c, T.CHAIR); set(12, c, T.CHAIR); }

  // ── AISLE C (rows 15-16): phones / tablets ─────────────────────────────────
  for (const c of [16, 21, 26, 31]) island(15, c);
  set(14, 34, T.PLANT); set(14, 14, T.PLANT);

  // ── AISLE D (rows 18-19): peripherals & audio ──────────────────────────────
  for (const c of [16, 21, 26, 31]) island(18, c);

  // ── AISLE E (rows 21-22): accessories & cables ─────────────────────────────
  for (const c of [13, 18, 23, 28, 33]) island(21, c);
  set(20, 3, T.PLANT); set(23, 3, T.PLANT);

  // ── Display shelves mid-store (rows 6, 13, 17, 20) ─────────────────────────
  // Small end-cap shelves at aisle entrances
  wallShelf(6, 14, 2); wallShelf(6, 33, 2);
  wallShelf(13, 14, 2); wallShelf(13, 33, 2);

  // ── ENTRANCE LOBBY (rows 25-27) ─────────────────────────────────────────────
  fill(25, 1, 27, 38, T.BFLOOR);

  // Welcome/info desk in lobby centre
  for (let c = 17; c <= 22; c++) set(25, c, T.COUNTER);
  set(26, 18, T.CHAIR); set(26, 19, T.CHAIR); set(26, 20, T.CHAIR);

  // Waiting couches by the sides
  set(25, 4,  T.COUCH); set(25, 5,  T.COUCH); set(25, 6,  T.COUCH);
  set(25, 34, T.COUCH); set(25, 35, T.COUCH); set(25, 36, T.COUCH);

  // Lobby plants
  set(25, 1, T.PLANT); set(25, 38, T.PLANT);
  set(27, 1, T.PLANT); set(27, 38, T.PLANT);

  // ── Front windows + glass entrance doors (row 28) ────────────────────────
  for (let c = 1;  c <= 12; c++) m[28][c] = T.WINDOW;
  for (let c = 13; c <= 26; c++) m[28][c] = T.DOOR;   // wide entrance
  for (let c = 27; c <= 38; c++) m[28][c] = T.WINDOW;

  return m;
}

export const MAP_DATA = buildMap();

export function isSolid(row: number, col: number): boolean {
  if (row < 0 || row >= MAP_HEIGHT || col < 0 || col >= MAP_WIDTH) return true;
  return SOLID_TILES.has(MAP_DATA[row][col] as never);
}

export function getAreaName(row: number, col: number): string {
  if (row <= 1) return 'Storage';
  if (row <= 3) return '📦 Back Stock';
  if (row >= 4 && row <= 8) {
    if (col <= 2)  return '🧱 Wall';
    if (col <= 14) return '🏪 Counter';
    if (col <= 25) return '💻 Laptops & Computers';
    return '🎮 Gaming';
  }
  if (row >= 9 && row <= 13) {
    if (col <= 14) return '🏪 Counter Zone';
    return '🖥️ Demo Area';
  }
  if (row >= 14 && row <= 14 && col <= 13) return '🏪 Counter';
  if (row >= 15 && row <= 17) return '📱 Phones & Tablets';
  if (row >= 18 && row <= 20) return '🔌 Peripherals';
  if (row >= 21 && row <= 23) return '🎧 Accessories';
  if (row >= 25 && row <= 27) return '🏪 Lobby';
  return 'TechTown';
}
