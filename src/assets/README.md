# Sprite Pack — Pokémon-style RPG Game

**Original** characters inspired by the *roles* of a tech store
(manager, cashiers, store manager, customer, VIP). They are not based on real people:
they are generic archetypes you can freely use and modify in your game.

## Contents

For each character (`rowan`, `alan`, `adam`, `ellie`, `amish`, `ben`):

- `<name>_sheet.png` — spritesheet, cells of **48×48 px**
- `<name>_sheet@4x.png` — ×4 version for preview only

Also:
- `metadata.json` — exact coordinates of each frame
- `viewer.html` — viewer to see animations in motion

## Spritesheet layout

- **Columns**: 4 frames per animation (0 → 3)
- **Rows**: 16, in this order (animation × direction):

```
row  0: walk_down       row  8: magic_down
row  1: walk_up         row  9: magic_up
row  2: walk_left       row 10: magic_left
row  3: walk_right      row 11: magic_right
row  4: attack_down     row 12: talk_down
row  5: attack_up       row 13: talk_up
row  6: attack_left     row 14: talk_left
row  7: attack_right    row 15: talk_right
```

To get the rectangle of a frame:
`x = column * 48`, `y = row * 48`, width/height = 48.
(Also pre-calculated in `metadata.json` → `characters.<name>.animations.<anim>_<dir>.rects`.)

## Included animations (4 animations × 4 directions)

| Animation | Frames | Description |
|-----------|--------|-------------|
| `walk`    | 4 | Walking (idle / left step / idle / right step) |
| `attack`  | 4 | Melee attack with hit flash |
| `magic`   | 4 | Magic shot: charging orb + outgoing projectile |
| `talk`    | 4 | Talking (mouth open/closed for dialogues) |

Each character has their own magic colour (Rowan purple, Alan orange,
Adam cyan, Ellie green, Amish gold, Ben red).

## How to use in an engine

### Phaser 3
```js
this.load.spritesheet('rowan', 'rowan_sheet.png', { frameWidth: 48, frameHeight: 48 });
// walk_down = frames 0..3, walk_up = 4..7, etc. (row * 4 + column)
this.anims.create({ key:'rowan_walk_down', frames:this.anims.generateFrameNumbers('rowan',{start:0,end:3}), frameRate:8, repeat:-1 });
```

### Godot / Unity
Import the PNG, slice into 48×48 cells, and use `metadata.json` to map
rows/columns to each animation.

## Regenerating / modifying

Source code is in the `src/` folder. Edit `characters.py` to change
colours, hairstyles, glasses/beard, shirt logo; `animations.py` to adjust
the frames. Then run `python3 build.py`.

## Rights note

These sprites are original designs based on generic character archetypes.
They are not portraits of real people and do not reproduce registered trademarks.
You are free to use, modify and distribute them in your project.
