// Shared mutable state for virtual touch controls.
// Updated by MobileControls (React) and consumed each frame by OfficeScene (Phaser).
// Safe because JS is single-threaded — no locking needed.
export const touchInput = {
  left: false,
  right: false,
  up: false,
  down: false,
  // Set to true on button press; OfficeScene resets it to false after handling.
  interactTap: false,
};
