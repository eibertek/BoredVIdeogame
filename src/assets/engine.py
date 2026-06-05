"""
16-bit sprite drawing engine, 48x48.
Draws a "chibi" character in parts, parameterised by palette and pose.

Coordinate system: 48x48 canvas, origin top-left.
The character occupies ~ x[12..36], y[6..46].

Each pose function receives a dict of animation parameters
(limb offsets, etc.) and returns the RGBA image.
"""

from PIL import Image, ImageDraw

W = H = 48

# ---------------------------------------------------------------------------
# Utilidades de color / sombreado
# ---------------------------------------------------------------------------

def shade(color, factor):
    """Aclara (factor>1) u oscurece (factor<1) un color RGB(A)."""
    r, g, b = color[:3]
    a = color[3] if len(color) > 3 else 255
    r = max(0, min(255, int(r * factor)))
    g = max(0, min(255, int(g * factor)))
    b = max(0, min(255, int(b * factor)))
    return (r, g, b, a)


def px(draw, x, y, color):
    draw.point((int(x), int(y)), fill=color)


def rect(draw, x0, y0, x1, y1, color):
    x0, x1 = sorted((int(x0), int(x1)))
    y0, y1 = sorted((int(y0), int(y1)))
    draw.rectangle([x0, y0, x1, y1], fill=color)


# ---------------------------------------------------------------------------
# Paleta de personaje
# ---------------------------------------------------------------------------

class Palette:
    def __init__(self, skin, hair, shirt, pants, shoe, accent=None,
                 hair_style="short", has_glasses=False, has_beard=False,
                 shirt_logo=None):
        self.skin = skin
        self.skin_d = shade(skin, 0.82)
        self.skin_l = shade(skin, 1.12)
        self.hair = hair
        self.hair_d = shade(hair, 0.75)
        self.shirt = shirt
        self.shirt_d = shade(shirt, 0.78)
        self.shirt_l = shade(shirt, 1.15)
        self.pants = pants
        self.pants_d = shade(pants, 0.78)
        self.shoe = shoe
        self.shoe_d = shade(shoe, 0.7)
        self.accent = accent or shade(shirt, 1.3)
        self.hair_style = hair_style       # short, long, ponytail, bald, manbun
        self.has_glasses = has_glasses
        self.has_beard = has_beard
        self.shirt_logo = shirt_logo       # color del logo en el pecho o None
        self.outline = (28, 24, 32, 255)
        self.eye = (40, 40, 50, 255)


# ---------------------------------------------------------------------------
# Dibujo de cabeza segun direccion
# ---------------------------------------------------------------------------

def draw_head(draw, p, cx, top, facing, mouth_open=False, blink=False):
    """Cabeza centrada en cx, parte superior en y=top. ~16px alto, 14 ancho."""
    hw = 7                      # medio ancho de cara
    face_x0, face_x1 = cx - hw, cx + hw
    face_y0, face_y1 = top + 3, top + 15

    # --- pelo trasero (para long/ponytail) detras de la cara ---
    if facing != "up" and p.hair_style in ("long", "ponytail"):
        rect(draw, face_x0 - 1, face_y0 + 1, face_x1 + 1, face_y1 + 4, p.hair_d)

    # --- cara ---
    rect(draw, face_x0, face_y0, face_x1, face_y1, p.skin)
    # sombra lateral
    rect(draw, face_x1 - 1, face_y0, face_x1, face_y1, p.skin_d)
    # cuello
    rect(draw, cx - 2, face_y1, cx + 2, face_y1 + 2, p.skin_d)

    # --- pelo ---
    if p.hair_style != "bald":
        # casquete superior
        rect(draw, face_x0 - 1, top, face_x1 + 1, face_y0 + 1, p.hair)
        rect(draw, face_x0 - 1, top, face_x1 + 1, top + 1, p.hair_d)
        if facing == "up":
            # de espaldas: todo el craneo es pelo
            rect(draw, face_x0 - 1, top, face_x1 + 1, face_y1, p.hair)
            rect(draw, face_x1, top, face_x1 + 1, face_y1, p.hair_d)
        else:
            # patillas / flequillo
            rect(draw, face_x0 - 1, face_y0, face_x0, face_y0 + 3, p.hair)
            rect(draw, face_x1, face_y0, face_x1 + 1, face_y0 + 3, p.hair)
            if p.hair_style == "long":
                rect(draw, face_x0 - 1, face_y0, face_x0, face_y1 + 3, p.hair)
                rect(draw, face_x1, face_y0, face_x1 + 1, face_y1 + 3, p.hair)
        if p.hair_style == "ponytail":
            if facing in ("left", "right", "down"):
                side = -1 if facing == "left" else (1 if facing == "right" else 1)
                bx = cx + side * (hw + 1)
                # coleta colgando por detras/lateral
                rect(draw, bx, top + 2, bx + side * 2, top + 10, p.hair)
                rect(draw, bx + side, top + 4, bx + side * 2, top + 9, p.hair_d)
            else:  # up: coleta cae por la espalda, centrada
                rect(draw, cx - 1, top + 2, cx + 1, top + 12, p.hair)
                rect(draw, cx, top + 4, cx + 1, top + 11, p.hair_d)
        if p.hair_style == "manbun" and facing != "down":
            rect(draw, cx - 2, top - 2, cx + 2, top, p.hair)

    # --- rasgos faciales (no en 'up') ---
    if facing != "up":
        ey = face_y0 + 4
        if facing == "down":
            lx, rx = cx - 4, cx + 3
            if blink:
                px(draw, lx, ey, p.skin_d); px(draw, rx, ey, p.skin_d)
            else:
                px(draw, lx, ey, p.eye); px(draw, rx, ey, p.eye)
            if p.has_glasses:
                rect(draw, lx - 1, ey - 1, lx + 1, ey + 1, p.outline)
                rect(draw, rx - 1, ey - 1, rx + 1, ey + 1, p.outline)
                px(draw, cx, ey, p.outline)
            # boca
            my = face_y1 - 2
            if mouth_open:
                rect(draw, cx - 1, my, cx + 1, my + 1, p.skin_d)
            else:
                rect(draw, cx - 1, my, cx + 1, my, p.skin_d)
            if p.has_beard:
                rect(draw, face_x0, my - 1, face_x1, face_y1, shade(p.hair, 0.9))
                rect(draw, cx - 1, my, cx + 1, my + (1 if mouth_open else 0),
                     p.skin if mouth_open else p.skin_d)
        else:  # left / right
            d = -1 if facing == "left" else 1
            ex = cx + d * 3
            if blink:
                px(draw, ex, ey, p.skin_d)
            else:
                px(draw, ex, ey, p.eye)
            if p.has_glasses:
                rect(draw, ex - 1, ey - 1, ex + 1, ey + 1, p.outline)
            # nariz
            px(draw, cx + d * (hw), ey + 1, p.skin_d)
            my = face_y1 - 2
            if mouth_open:
                rect(draw, ex - 1, my, ex + 1, my + 1, p.skin_d)
            else:
                px(draw, ex, my, p.skin_d)
            if p.has_beard:
                rect(draw, cx, my - 1, face_x1 if d > 0 else face_x0,
                     face_y1, shade(p.hair, 0.9))


# ---------------------------------------------------------------------------
# Dibujo de cuerpo (torso, brazos, piernas) segun direccion + offsets
# ---------------------------------------------------------------------------

def draw_body(draw, p, cx, shoulder_y, facing, pose):
    """
    pose: dict con
      arm_l, arm_r  -> offset vertical de la mano (px) (+ adelante/abajo)
      arm_l_x, arm_r_x -> offset horizontal de la mano
      leg_l, leg_r  -> offset horizontal del pie (paso)
      lean          -> inclinacion del torso
    """
    torso_top = shoulder_y
    torso_bot = shoulder_y + 11
    tw = 6  # medio ancho torso
    lean = pose.get("lean", 0)

    # --- piernas / pies ---
    leg_top = torso_bot
    leg_bot = leg_top + 6
    ll = pose.get("leg_l", 0)
    lr = pose.get("leg_r", 0)
    # pierna izq
    rect(draw, cx - 4 + ll, leg_top, cx - 1 + ll, leg_bot, p.pants)
    rect(draw, cx - 4 + ll, leg_bot, cx - 1 + ll, leg_bot + 1, p.shoe)
    rect(draw, cx - 4 + ll, leg_bot + 1, cx - 1 + ll, leg_bot + 1, p.shoe_d)
    # pierna der
    rect(draw, cx + 1 + lr, leg_top, cx + 4 + lr, leg_bot, p.pants)
    rect(draw, cx + 1 + lr, leg_bot, cx + 4 + lr, leg_bot + 1, p.shoe)
    rect(draw, cx + 1 + lr, leg_bot + 1, cx + 4 + lr, leg_bot + 1, p.shoe_d)
    # sombra pantalon
    rect(draw, cx + 1, leg_top, cx + 4, leg_bot, p.pants_d) if facing == "right" else None

    # --- torso (remera) ---
    rect(draw, cx - tw + lean, torso_top, cx + tw + lean, torso_bot, p.shirt)
    # sombreado de volumen
    rect(draw, cx + tw - 1 + lean, torso_top, cx + tw + lean, torso_bot, p.shirt_d)
    rect(draw, cx - tw + lean, torso_top, cx - tw + 1 + lean, torso_bot, p.shirt_l)
    # cuello de remera
    if facing != "up":
        rect(draw, cx - 2 + lean, torso_top, cx + 2 + lean, torso_top + 1, p.shirt_d)
    # logo en el pecho
    if p.shirt_logo and facing == "down":
        px(draw, cx + 2 + lean, torso_top + 3, p.shirt_logo)
        px(draw, cx + 3 + lean, torso_top + 3, p.shirt_logo)
        px(draw, cx + 2 + lean, torso_top + 4, p.shirt_logo)

    # --- brazos ---
    arm_top = torso_top + 1
    al = pose.get("arm_l", 0)
    ar = pose.get("arm_r", 0)
    alx = pose.get("arm_l_x", 0)
    arx = pose.get("arm_r_x", 0)
    arm_len = 6

    def arm(side):
        d = -1 if side == "l" else 1
        base_x = cx + d * tw + lean
        off = al if side == "l" else ar
        offx = alx if side == "l" else arx
        sx = base_x + d  # hombro
        # manga (remera) - hombro/brazo alto
        rect(draw, sx, arm_top, sx + d * 2, arm_top + 2, p.shirt)
        rect(draw, sx + d * 2, arm_top, sx + d * 2, arm_top + 2, p.shirt_d)
        # antebrazo (piel) cae hacia la mano
        hx = sx + d * 2 + offx
        hy = arm_top + 3 + off
        # trazo del antebrazo desde el codo a la mano
        ex_, ey_ = sx + d * 2, arm_top + 2
        steps = max(abs(hx - ex_), abs(hy - ey_), 1)
        for s in range(steps + 1):
            ix = round(ex_ + (hx - ex_) * s / steps)
            iy = round(ey_ + (hy - ey_) * s / steps)
            px(draw, ix, iy, p.skin if s < steps else p.skin_l)
            px(draw, ix, iy + 1, p.skin_d)
        # mano
        rect(draw, hx, hy, hx + d, hy + 1, p.skin_l)

    arm("l")
    arm("r")


# ---------------------------------------------------------------------------
# Render de un frame completo
# ---------------------------------------------------------------------------

def render(p, facing, pose, extras=None):
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    cx = 24
    bob = pose.get("bob", 0)          # rebote vertical del cuerpo entero
    shoulder_y = 22 + bob
    head_top = 6 + bob

    # sombra en el piso
    rect(draw, cx - 6, 45, cx + 6, 46, (0, 0, 0, 60))

    draw_body(draw, p, cx, shoulder_y, facing, pose)
    draw_head(draw, p, cx, head_top, facing,
              mouth_open=pose.get("mouth_open", False),
              blink=pose.get("blink", False))

    if extras:
        extras(draw, p, cx, shoulder_y, facing, pose)

    return img
