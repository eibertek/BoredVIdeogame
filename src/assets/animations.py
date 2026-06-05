"""
Definicion de animaciones. Cada funcion devuelve una lista de 'pose' dicts,
uno por frame, para una direccion dada.

Animaciones:
  walk   -> 4 frames (idle, paso-izq, idle, paso-der)
  attack -> 4 frames (anticipacion, golpe, golpe, recuperacion)
  magic  -> 4 frames (carga, carga, disparo, disparo) + proyectil via extras
  talk   -> 4 frames (boca cerrada/abierta alternando + leve bob)

Devuelven (poses, extras_fn_per_frame) cuando hay overlay (magia/ataque).
"""

# --------------------------- WALK -----------------------------------------
def walk(facing):
    frames = [
        {"leg_l": 0,  "leg_r": 0,  "bob": 0, "arm_l": 0, "arm_r": 0},
        {"leg_l": -2, "leg_r": 2,  "bob": -1, "arm_l": 1, "arm_r": -1},
        {"leg_l": 0,  "leg_r": 0,  "bob": 0, "arm_l": 0, "arm_r": 0},
        {"leg_l": 2,  "leg_r": -2, "bob": -1, "arm_l": -1, "arm_r": 1},
    ]
    return frames, [None] * 4


# --------------------------- TALK -----------------------------------------
def talk(facing):
    frames = [
        {"leg_l": 0, "leg_r": 0, "bob": 0, "mouth_open": False, "arm_l": 0, "arm_r": 0},
        {"leg_l": 0, "leg_r": 0, "bob": 0, "mouth_open": True,  "arm_l": 0, "arm_r": -1},
        {"leg_l": 0, "leg_r": 0, "bob": -1, "mouth_open": False, "arm_l": 0, "arm_r": 0},
        {"leg_l": 0, "leg_r": 0, "bob": 0, "mouth_open": True,  "arm_l": -1, "arm_r": 0},
    ]
    return frames, [None] * 4


# --------------------------- ATTACK ---------------------------------------
def _slash_extra(direction):
    """Devuelve una funcion que dibuja un arco de golpe segun direccion."""
    from engine import rect, px, shade
    def fn(draw, p, cx, sy, facing, pose):
        if not pose.get("show_fx"):
            return
        col = (255, 240, 200, 230)
        col2 = (255, 200, 120, 200)
        if facing == "right":
            for i, yy in enumerate(range(sy - 2, sy + 8)):
                xx = cx + 9 + (2 if 2 < i < 7 else 0)
                px(draw, xx, yy, col); px(draw, xx - 1, yy, col2)
        elif facing == "left":
            for i, yy in enumerate(range(sy - 2, sy + 8)):
                xx = cx - 9 - (2 if 2 < i < 7 else 0)
                px(draw, xx, yy, col); px(draw, xx + 1, yy, col2)
        elif facing == "down":
            for i, xx in enumerate(range(cx - 5, cx + 6)):
                yy = sy + 12 + (2 if 2 < i < 8 else 0)
                px(draw, xx, yy, col); px(draw, xx, yy - 1, col2)
        else:  # up
            for i, xx in enumerate(range(cx - 5, cx + 6)):
                yy = sy - 2 - (2 if 2 < i < 8 else 0)
                px(draw, xx, yy, col); px(draw, xx, yy + 1, col2)
    return fn


def attack(facing):
    d = {"left": -1, "right": 1}.get(facing, 0)
    # mano que ataca: en down/up usamos brazo der; en lados, el del frente
    frames = [
        # anticipacion: brazo atras
        {"leg_l": 1, "leg_r": -1, "bob": 0, "arm_r": -3, "arm_r_x": -d*2, "lean": -d},
        # golpe: brazo adelante extendido
        {"leg_l": -1, "leg_r": 2, "bob": -1, "arm_r": 4, "arm_r_x": d*4, "lean": d, "show_fx": True},
        {"leg_l": -1, "leg_r": 2, "bob": -1, "arm_r": 4, "arm_r_x": d*4, "lean": d, "show_fx": True},
        # recuperacion
        {"leg_l": 0, "leg_r": 0, "bob": 0, "arm_r": 1, "arm_r_x": d*1, "lean": 0},
    ]
    fx = _slash_extra(facing)
    return frames, [None, fx, fx, None]


# --------------------------- MAGIC ----------------------------------------
def _magic_extra(direction, charging):
    from engine import rect, px
    def fn(draw, p, cx, sy, facing, pose):
        phase = pose.get("magic_phase")
        # color de magia segun acento del personaje
        c = p.accent
        cl = (min(255,c[0]+60), min(255,c[1]+60), min(255,c[2]+60), 255)
        if phase == "charge":
            # orbe creciendo frente a las manos
            r = pose.get("orb", 2)
            ox, oy = cx, sy + 4
            if facing == "right": ox = cx + 9
            elif facing == "left": ox = cx - 9
            elif facing == "up": oy = sy - 3
            elif facing == "down": oy = sy + 13
            rect(draw, ox - r, oy - r, ox + r, oy + r, c)
            rect(draw, ox - r + 1, oy - r + 1, ox + r - 1, oy + r - 1, cl)
            px(draw, ox, oy, (255, 255, 255, 255))
        elif phase == "shoot":
            # proyectil saliendo
            if facing == "right":
                bx, by = cx + 14, sy + 4
                rect(draw, bx, by - 2, bx + 5, by + 2, c)
                rect(draw, bx + 1, by - 1, bx + 4, by + 1, cl)
                px(draw, bx + 6, by, c); px(draw, bx + 7, by, c)
            elif facing == "left":
                bx, by = cx - 14, sy + 4
                rect(draw, bx - 5, by - 2, bx, by + 2, c)
                rect(draw, bx - 4, by - 1, bx - 1, by + 1, cl)
                px(draw, bx - 6, by, c); px(draw, bx - 7, by, c)
            elif facing == "up":
                bx, by = cx, sy - 6
                rect(draw, bx - 2, by - 5, bx + 2, by, c)
                rect(draw, bx - 1, by - 4, bx + 1, by - 1, cl)
            else:
                bx, by = cx, sy + 16
                rect(draw, bx - 2, by, bx + 2, by + 5, c)
                rect(draw, bx - 1, by + 1, bx + 1, by + 4, cl)
    return fn


def magic(facing):
    d = {"left": -1, "right": 1}.get(facing, 0)
    frames = [
        {"leg_l": 0, "leg_r": 0, "bob": 0, "arm_r": 2, "arm_r_x": d*2, "arm_l": 2, "arm_l_x": -d*2 if d==0 else d*2, "magic_phase": "charge", "orb": 2},
        {"leg_l": 0, "leg_r": 0, "bob": -1, "arm_r": 3, "arm_r_x": d*3, "arm_l": 3, "magic_phase": "charge", "orb": 3},
        {"leg_l": -1, "leg_r": 1, "bob": 0, "arm_r": 4, "arm_r_x": d*4, "arm_l": 4, "lean": d, "magic_phase": "shoot"},
        {"leg_l": -1, "leg_r": 1, "bob": 0, "arm_r": 3, "arm_r_x": d*3, "arm_l": 3, "lean": d, "magic_phase": "shoot"},
    ]
    fx = _magic_extra(facing, True)
    return frames, [fx, fx, fx, fx]


ANIMATIONS = {
    "walk": walk,
    "attack": attack,
    "magic": magic,
    "talk": talk,
}
FRAME_COUNTS = {"walk": 4, "attack": 4, "magic": 4, "talk": 4}
DIRECTIONS = ["down", "up", "left", "right"]
