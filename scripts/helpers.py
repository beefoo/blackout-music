"""Helper functions"""

import glob
import os


def clear_directory(dirname):
    """Function for emptying a directory"""
    dirname = dirname.strip("/")
    file_string = f"{dirname}/*"
    filenames = glob.glob(file_string)
    for fn in filenames:
        if os.path.isfile(fn):
            os.remove(fn)


def frame_to_ms(frame, fps):
    """Convert frame number to milliseconds based on FPS"""
    ms = (1.0 * frame / fps) * 1000.0
    return round_int(ms)


def make_directories(filenames):
    """Function for creating directories if they do not exist."""
    if not isinstance(filenames, list):
        filenames = [filenames]
    for filename in filenames:
        dirname = os.path.dirname(filename)
        if not os.path.exists(dirname):
            os.makedirs(dirname)


def ms_to_frame(ms, fps):
    """Convert milliseconds to frame number based on FPS"""
    return round_int((ms / 1000.0) * fps)


def round_int(value):
    """Round a number, then convert to an integer"""
    return int(round(value))


def zero_pad(number, total):
    """Pad a number given a total"""
    padding = len(str(total))
    return str(number).zfill(padding)
