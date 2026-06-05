export const TILE_SIZE = 32;
export const MAP_WIDTH = 40;
export const MAP_HEIGHT = 30;
export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;
export const PLAYER_SPEED = 160;
export const NPC_SPEED = 60;
export const INTERACTION_DIST = 80;

// Tile IDs
export const T = {
  FLOOR: 0,
  WALL: 1,
  CARPET: 2,
  DESK: 3,
  DOOR: 4,
  WINDOW: 5,
  PLANT: 6,
  MTABLE: 7,   // meeting table
  COUNTER: 8,  // reception counter
  COUCH: 9,
  OFLOOR: 10,  // office floor (dark parquet)
  MFLOOR: 11,  // meeting room floor
  BFLOOR: 12,  // break room floor
  CHAIR: 13,
  CABINET: 14,
  MONITOR: 15,
} as const;

// Which tiles block movement
export const SOLID_TILES = new Set([
  T.WALL, T.DESK, T.WINDOW, T.PLANT, T.MTABLE, T.COUNTER, T.COUCH, T.CABINET,
]);
