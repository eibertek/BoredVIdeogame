"""
Genera, por cada personaje:
  - <nombre>_sheet.png : spritesheet 48x48 por celda
  - <nombre>_sheet@4x.png : version escalada x4 para previsualizar
Y un metadata.json maestro con coordenadas de cada frame.

Layout del spritesheet (columnas = frames, filas = anim x direccion):
  Filas en orden:
    walk_down, walk_up, walk_left, walk_right,
    attack_down, attack_up, attack_left, attack_right,
    magic_down, magic_up, magic_left, magic_right,
    talk_down, talk_up, talk_left, talk_right
  Cada fila tiene 4 columnas (frames 0..3).
"""
import os, json
from PIL import Image
from engine import render, W, H
from animations import ANIMATIONS, DIRECTIONS, FRAME_COUNTS
from characters import CHARACTERS, ORDER

OUT = "/home/claude/spritegen/assets"
os.makedirs(OUT, exist_ok=True)

ANIM_ORDER = ["walk", "attack", "magic", "talk"]
COLS = 4  # frames por anim
ROWS = len(ANIM_ORDER) * len(DIRECTIONS)  # 16

CELL = 48

def build_character(name, pal):
    sheet = Image.new("RGBA", (COLS * CELL, ROWS * CELL), (0, 0, 0, 0))
    frames_meta = {}
    row = 0
    for anim in ANIM_ORDER:
        for facing in DIRECTIONS:
            poses, extras_list = ANIMATIONS[anim](facing)
            for col, pose in enumerate(poses):
                extra = extras_list[col] if col < len(extras_list) else None
                img = render(pal, facing, pose, extras=extra)
                sheet.paste(img, (col * CELL, row * CELL), img)
            key = f"{anim}_{facing}"
            frames_meta[key] = {
                "row": row,
                "frames": len(poses),
                "y": row * CELL,
                "x_start": 0,
                "rects": [[c * CELL, row * CELL, CELL, CELL] for c in range(len(poses))],
            }
            row += 1
    path = os.path.join(OUT, f"{name}_sheet.png")
    sheet.save(path)
    # preview x4
    sheet.resize((sheet.width * 4, sheet.height * 4), 0).save(
        os.path.join(OUT, f"{name}_sheet@4x.png"))
    return frames_meta, path


def main():
    master = {
        "meta": {
            "cell_size": CELL,
            "directions": DIRECTIONS,
            "animations": {a: FRAME_COUNTS[a] for a in ANIM_ORDER},
            "row_order": [f"{a}_{d}" for a in ANIM_ORDER for d in DIRECTIONS],
            "note": "Personajes originales (arquetipos). Cada celda 48x48. "
                    "Filas = animacion x direccion, columnas = frames.",
        },
        "characters": {},
    }
    for name in ORDER:
        meta, path = build_character(name, CHARACTERS[name])
        master["characters"][name] = {
            "sheet": f"{name}_sheet.png",
            "preview": f"{name}_sheet@4x.png",
            "animations": meta,
        }
        print(f"  {name}: {path}")
    with open(os.path.join(OUT, "metadata.json"), "w") as f:
        json.dump(master, f, indent=2, ensure_ascii=False)
    print("metadata.json escrito")


if __name__ == "__main__":
    main()
