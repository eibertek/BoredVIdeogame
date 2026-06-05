import { T, MAP_WIDTH, MAP_HEIGHT, SOLID_TILES } from './constants';

// ──────────────────────────────────────────────────────────────────────────────
//  Epic Sales Co. — open-plan tech store
//
//  No internal walls.
//  Counter: left side, cols 2-12, staff accesses from above (no wall blocking).
//  Shelves: display islands arranged in horizontal bands across the floor.
//
//  Map 40 × 30 tiles (each 32 px):
//
//  Row  0    Outer back wall
//  Row  1    Back windows (full width)
//  Rows 2-3  Back area — open
//  Rows 4-5  SHELF BAND A  (top)
//  Rows 6-7  Aisle + demo tables (center)
//  Rows 8-9  SHELF BAND B
//  Rows 10-14 Counter zone (left) + open (right)
//  Rows 11-13 SHELF BAND C (right of counter)
//  Rows 15-16 Aisle
//  Rows 17-18 SHELF BAND D
//  Rows 19-20 Aisle
//  Rows 21-22 SHELF BAND E
//  Rows 23-24 Open floor
//  Rows 25-27 Entrance lobby
//  Row  28    Front windows + entrance doors
//  Row  29    Outer front wall
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

  // ── Outer boundary ─────────────────────────────────────────────────────────
  for (let c = 0; c < MAP_WIDTH; c++) { m[0][c] = T.WALL; m[MAP_HEIGHT - 1][c] = T.WALL; }
  for (let r = 0; r < MAP_HEIGHT; r++) { m[r][0] = T.WALL; m[r][MAP_WIDTH - 1] = T.WALL; }

  // ── Back windows (row 1, full width) ───────────────────────────────────────
  for (let c = 1; c <= 38; c++) m[1][c] = T.WINDOW;

  // ──────────────────────────────────────────────────────────────────────────
  //  COUNTER — left side, cols 2-12
  //  Staff area:     rows 10-13, cols 2-12  (open floor, no barrier above)
  //  Counter bar:    row 14, cols 2-12      (collidable — serves as the desk)
  //  Customer side:  rows 15+ (customer approaches from below)
  // ──────────────────────────────────────────────────────────────────────────
  for (let c = 2; c <= 12; c++) m[14][c] = T.COUNTER;
  // Left vertical cap (marks end of counter)
  m[11][2] = T.COUNTER; m[12][2] = T.COUNTER; m[13][2] = T.COUNTER;

  // Cashier equipment on staff side (row 13)
  set(13, 4, T.CHAIR);  set(13, 5, T.MONITOR);
  set(13, 7, T.CHAIR);  set(13, 8, T.MONITOR);
  set(13, 10, T.CHAIR); set(13, 11, T.MONITOR);

  // Small storage cabinet in staff area
  set(10, 11, T.CABINET); set(10, 10, T.CABINET);

  // Plants flanking the counter
  set(10, 1, T.PLANT); set(15, 1, T.PLANT);

  // ──────────────────────────────────────────────────────────────────────────
  //  SHELF ISLANDS — helper: place a 2×2 display island at (r, c)
  //    row r  : [DESK][MONITOR]  — product display top
  //    row r+1: [CABINET][CABINET] — shelving bottom
  // ──────────────────────────────────────────────────────────────────────────
  const island = (r: number, c: number) => {
    set(r,     c,     T.DESK);    set(r,     c + 1, T.MONITOR);
    set(r + 1, c,     T.CABINET); set(r + 1, c + 1, T.CABINET);
  };

  // Flat single-row shelf (wall-hugging or narrow unit)
  const shelf = (r: number, c: number, w = 3) => {
    for (let i = 0; i < w; i++) set(r, c + i, T.CABINET);
  };

  // ── BAND A (rows 4-5) — top of store ───────────────────────────────────────
  // Six islands evenly spread across the full width
  for (const c of [4, 10, 16, 22, 28, 34]) island(4, c);
  // Category label shelves against back wall (row 2)
  for (const c of [5, 12, 19, 26, 33]) shelf(2, c, 3);
  // Decorative plants at band ends
  set(3, 1, T.PLANT); set(3, 38, T.PLANT);

  // ── Demo tables between Band A and Band B (rows 6-7) ──────────────────────
  // Two big demo tables in the centre
  fill(6, 16, 7, 20, T.MTABLE); // demo table left
  fill(6, 24, 7, 28, T.MTABLE); // demo table right
  // Chairs around demo tables
  for (let c = 16; c <= 20; c++) { set(5, c, T.CHAIR); set(8, c, T.CHAIR); }
  for (let c = 24; c <= 28; c++) { set(5, c, T.CHAIR); set(8, c, T.CHAIR); }
  set(6, 14, T.CHAIR); set(7, 14, T.CHAIR);
  set(6, 22, T.CHAIR); set(7, 22, T.CHAIR);
  set(6, 30, T.CHAIR); set(7, 30, T.CHAIR);

  // ── BAND B (rows 8-9) ──────────────────────────────────────────────────────
  for (const c of [4, 10, 17, 24, 31]) island(8, c);
  set(8, 38, T.PLANT); set(9, 1, T.PLANT);

  // ── BAND C (rows 11-12) — right of counter (cols 14+) ─────────────────────
  for (const c of [14, 20, 26, 32]) island(11, c);
  set(10, 38, T.PLANT);

  // ── BAND D (rows 17-18) ────────────────────────────────────────────────────
  for (const c of [4, 10, 16, 22, 28, 34]) island(17, c);
  set(16, 1, T.PLANT); set(16, 38, T.PLANT);

  // ── BAND E (rows 21-22) ────────────────────────────────────────────────────
  for (const c of [6, 12, 18, 24, 30]) island(21, c);
  set(20, 1, T.PLANT); set(20, 38, T.PLANT);

  // ── Cabinets / shelves along right wall ───────────────────────────────────
  // Right wall shelves (col 38 is outer wall, so use col 37)
  for (const r of [4, 8, 12, 17, 21]) set(r, 37, T.CABINET);

  // ── ENTRANCE LOBBY (rows 25-27) ────────────────────────────────────────────
  fill(25, 1, 27, 38, T.BFLOOR);

  // Waiting couches
  set(25, 3, T.COUCH); set(25, 4, T.COUCH);
  set(25, 35, T.COUCH); set(25, 36, T.COUCH);

  // Info / welcome desk in lobby centre
  for (let c = 17; c <= 22; c++) set(25, c, T.COUNTER);
  set(26, 18, T.CHAIR); set(26, 19, T.CHAIR); set(26, 20, T.CHAIR);

  // Lobby plants
  set(25, 1, T.PLANT); set(25, 38, T.PLANT);
  set(27, 1, T.PLANT); set(27, 38, T.PLANT);

  // ── Front windows + wide entrance doors (row 28) ──────────────────────────
  for (let c = 1; c <= 12; c++) m[28][c] = T.WINDOW;
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
  if (row >= 2 && row <= 9) {
    if (col <= 12) return '💻 Laptops';
    if (col <= 25) return '🖥️ Demo';
    return '🎮 Gaming';
  }
  if (row >= 10 && row <= 14 && col <= 12) return '🏪 Counter';
  if (row >= 10 && row <= 16) {
    if (col <= 18) return '📱 Phones';
    return '🔌 Accessories';
  }
  if (row >= 17 && row <= 22) {
    if (col <= 15) return '🖨️ Peripherals';
    if (col <= 28) return '💾 Software';
    return '🎧 Audio & Video';
  }
  if (row >= 23 && row <= 27) return '🏪 Lobby';
  return 'Epic Sales Co.';
}
