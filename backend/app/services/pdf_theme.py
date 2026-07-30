"""Colours for generated PDF documents.

The four generators (item lists, labels, payout receipts, closure reports) each
carried their own hardcoded Tailwind palette — 132 occurrences of 30-odd distinct
values that had never matched the application's own colours. These constants replace
them with the ALPE brand palette.

Print is not screen. Two rules shaped the choices:

- Ink is a real cost. Labels are printed by the thousand for a single bourse, so the
  label sheet stays essentially black on white; colour is reserved for the parts that
  carry meaning.
- Very light fills disappear on a cheap printer. Backgrounds here stay light enough
  to read black text over, but dark enough to survive.

Article label stock colours are NOT defined here: sky_blue, pink and the rest in
label.py map to the physical paper the association buys, and changing them would
break the link with what volunteers handle.
"""

# --- Brand ---------------------------------------------------------------------
BRAND_PRIMARY = "#00a0d0"  # ALPE blue, for rules and accents
BRAND_INK = "#005070"  # deep blue, 8.82:1 on white — headings and banners
BRAND_SECONDARY = "#f08040"  # ALPE orange, accents only

# --- Text ----------------------------------------------------------------------
TEXT_STRONG = "#262e34"  # body copy and figures
TEXT_BODY = "#3a444c"  # secondary copy, 9.95:1
TEXT_MUTED = "#4f5a64"  # labels and captions, 7.05:1 — darker than the screen
# equivalent so it survives printing
TEXT_ON_DARK = "#ffffff"

# --- Surfaces ------------------------------------------------------------------
SURFACE_PAGE = "#ffffff"
SURFACE_MUTED = "#f4f7f9"  # table header rows, boxed sections
SURFACE_SOFT = "#e9eef2"  # slightly stronger fill where separation is needed
BORDER = "#d7dfe6"
BORDER_STRONG = "#b7c3cc"

# --- Semantics -----------------------------------------------------------------
# Deliberately restrained: on paper these read as emphasis, not as UI state.
SUCCESS = "#1f7a33"  # 5.40:1
SUCCESS_SOFT = "#eaf6ec"
WARNING = "#8e401a"  # 7.25:1
WARNING_SOFT = "#fef2ea"
DANGER = "#b32d2d"  # 6.31:1
DANGER_SOFT = "#fdecec"
