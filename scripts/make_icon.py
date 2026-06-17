import struct
import zlib
import os

def make_png(path, width=256, height=256, color=(255, 120, 0, 255)):
    def chunk(name, data):
        c = name + data
        crc = struct.pack(">I", zlib.crc32(c) & 0xFFFFFFFF)
        return struct.pack(">I", len(data)) + c + crc

    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    raw = b"".join(bytes((*color, 255)) * width for _ in range(height))
    comp = zlib.compress(raw)
    with open(path, "wb") as f:
        f.write(sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", comp) + chunk(b"IEND", b""))

out = r"C:\Users\anant\OneDrive\Desktop\NightlyBuilder\OceanOS\resources\icon.png"
os.makedirs(os.path.dirname(out), exist_ok=True)
make_png(out)
print(out)
