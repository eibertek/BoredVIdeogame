"""
Definicion de los 6 personajes (arquetipos originales, no retratos reales).
Cada uno = nombre interno + Palette.

Los colores de remera siguen la idea de "equipo de tienda con remera roja"
para empleados y manager con remera oscura, clientes con ropa variada.
"""
from engine import Palette

# acento = color de la magia del personaje

CHARACTERS = {
    # Manager - remera oscura/negra, serio, pelo corto
    "rowan": Palette(
        skin=(226, 178, 140, 255), hair=(74, 52, 40, 255),
        shirt=(34, 34, 40, 255), pants=(48, 48, 56, 255), shoe=(24, 24, 28, 255),
        hair_style="short", has_beard=True,
        accent=(120, 90, 230, 255),  # magia violeta (autoridad)
        shirt_logo=(210, 210, 220, 255),
    ),
    # Cajero 1 - remera roja de staff, pelo corto claro
    "alan": Palette(
        skin=(232, 190, 152, 255), hair=(150, 110, 60, 255),
        shirt=(196, 40, 44, 255), pants=(40, 44, 60, 255), shoe=(30, 30, 34, 255),
        hair_style="short",
        accent=(240, 120, 40, 255),  # magia naranja
        shirt_logo=(255, 255, 255, 255),
    ),
    # Cajero 2 - remera roja de staff, pelo oscuro, lentes, barba
    "adam": Palette(
        skin=(200, 150, 112, 255), hair=(40, 32, 30, 255),
        shirt=(196, 40, 44, 255), pants=(46, 46, 54, 255), shoe=(28, 28, 32, 255),
        hair_style="short", has_glasses=True, has_beard=True,
        accent=(40, 180, 200, 255),  # magia cyan
        shirt_logo=(255, 255, 255, 255),
    ),
    # Repositora - remera roja de staff, coleta, mujer
    "ellie": Palette(
        skin=(236, 196, 164, 255), hair=(96, 64, 40, 255),
        shirt=(196, 40, 44, 255), pants=(50, 54, 70, 255), shoe=(40, 40, 46, 255),
        hair_style="ponytail",
        accent=(80, 200, 120, 255),  # magia verde
        shirt_logo=(255, 255, 255, 255),
    ),
    # Cliente - ropa de calle azul, pelo medio
    "amish": Palette(
        skin=(180, 130, 96, 255), hair=(28, 24, 22, 255),
        shirt=(56, 96, 180, 255), pants=(70, 64, 58, 255), shoe=(48, 36, 28, 255),
        hair_style="short", has_beard=True,
        accent=(230, 200, 60, 255),  # magia dorada
    ),
    # Ladron - capucha/ropa oscura verdosa, encapuchado (manbun como gorro)
    "ben": Palette(
        skin=(214, 168, 132, 255), hair=(36, 40, 36, 255),
        shirt=(54, 64, 54, 255), pants=(38, 40, 42, 255), shoe=(22, 22, 24, 255),
        hair_style="short",
        accent=(200, 50, 60, 255),  # magia roja (peligro)
    ),
}

ORDER = ["rowan", "alan", "adam", "ellie", "amish", "ben"]
