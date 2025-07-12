"""A script that generates the intro/outro screens for the demo video"""

import argparse
import os
from PIL import Image, ImageFont, ImageDraw
from tqdm import tqdm
from helpers import *

parser = argparse.ArgumentParser()
parser.add_argument("--scene", dest="SCENE", default="intro", help="intro or outro")
parser.add_argument(
    "--debug", dest="DEBUG", action="store_true", help="Just display details?"
)
parsed_args = parser.parse_args()

# File locations
script_path = "scripts/"
output_path = f"{script_path}output/"
frames_path = f"{output_path}{parsed_args.SCENE}-frames/{{fn}}.png"
output_file = f"{output_path}black-out-music-{parsed_args.SCENE}.mp4"

# Config
frame_w = 1920
frame_h = 1280
fps = 30
multiplier = 2
letter_spacing = 0
top = 0.333
margin = 0.05
bg_color = "#1b1b1c"
canvas_w = frame_w * multiplier
canvas_h = frame_h * multiplier
font_path = f"{script_path}VT323-Regular.ttf"
font_size_h1 = 200 * multiplier
font_size_h2 = 180 * multiplier

# durations
total_ms = 1600

# Text content
h1 = [
    {"text": "BLACKOUT", "color": "#ffc800"},
    {"text": "MUSIC", "color": "#ffc800"},
]
h2 = [{"text": "DEMO", "color": "#d8dbde"}]

if parsed_args.SCENE == "outro":
    h1 = [
        {"text": "TRY IT OUT", "color": "#d8dbde"},
    ]
    h2 = [
        {"text": "BLACKOUT", "color": "#ffc800"},
        {"text": "MUSIC", "color": "#ffc800"},
        {"text": ".BRIANFOO.COM", "color": "#d8dbde"},
    ]
    font_size_h2 = 90 * multiplier

h1_font = ImageFont.truetype(font=font_path, size=font_size_h1)
h2_font = ImageFont.truetype(font=font_path, size=font_size_h2)


def get_char_data(texts, y, font, letter_spacing_x):
    """Get character positioning data from text"""
    chars = []
    for text in texts:
        letters = list(text["text"])

        for letter in letters:
            x0, y0, x1, y1 = font.getbbox(letter)
            w = x1 - x0 if letter != " " else round_int((x1 - x0) * 0.5)
            h = y1 - y0
            chars.append(
                {
                    "text": letter,
                    "y": y,
                    "w": w,
                    "h": h,
                    "color": text["color"],
                    "font": font,
                }
            )

    char_count = len(chars)
    width = sum([char["w"] for char in chars]) + (char_count - 1) * letter_spacing_x
    x = (canvas_w - width) * 0.5
    for i, char in enumerate(chars):
        chars[i]["x"] = x
        x += letter_spacing_x + char["w"]

    return chars


def draw_frame(fn, frame, total, chars):
    """Draw a specific frame"""
    # ms = frame_to_ms(frame, fps)
    base = Image.new(mode="RGB", size=(canvas_w, canvas_h), color=bg_color)
    draw = ImageDraw.Draw(base)
    char_count = len(chars)
    progress = 1.0 * (frame - 1) / (total - 1)

    for i, c in enumerate(chars):
        draw.text((c["x"], c["y"]), c["text"], font=c["font"], fill=c["color"])

    base = base.resize((frame_w, frame_h))
    base.save(fn)


def main(args):
    """Main function"""

    # Clear output
    make_directories(frames_path)
    clear_directory(os.path.dirname(frames_path))

    # Get positioning of text
    h1_top = top * canvas_h
    margin_y = margin * canvas_h
    letter_spacing_x = letter_spacing * canvas_w
    _h1_x0, h1_y0, _h1_x1, h1_y1 = h1_font.getbbox("L")
    h1_height = h1_y1 - h1_y0
    h2_top = h1_top + h1_height + margin_y
    h1_chars = get_char_data(h1, h1_top, h1_font, letter_spacing_x)
    h2_chars = get_char_data(h2, h2_top, h2_font, letter_spacing_x)
    chars = h1_chars + h2_chars
    for i, _char in enumerate(chars):
        chars[i]["i"] = i

    total_frames = ms_to_frame(total_ms, fps)

    if args.DEBUG:
        debug_ms = 0
        debug_frame = ms_to_frame(debug_ms, fps)
        draw_frame(f"{output_path}test.png", debug_frame, total_frames, chars)

    else:
        for i in tqdm(range(total_frames)):
            frame = i + 1
            fn = frames_path.format(fn=zero_pad(frame, total_frames))
            draw_frame(fn, frame, total_frames, chars)

    return True


main(parsed_args)
