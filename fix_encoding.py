import re

with open(r'c:\Users\user\e-library-front\src\pages\LeaderboardPage.tsx', 'rb') as f:
    raw = f.read()

# The file was saved as Windows-1252 misread as UTF-8, then re-read.
# Actually it's UTF-8 content that was decoded as latin-1 and re-encoded.
# Let's try to re-encode: decode as latin-1, re-encode as utf-8
try:
    text = raw.decode('utf-8')
    # Now fix windows-1252 mojibake: chars were encoded as utf-8 bytes,
    # then read as windows-1252 and stored as utf-8
    # Reverse: encode back to bytes as latin-1, decode as utf-8
    fixed_bytes = text.encode('latin-1', errors='replace')
    fixed = fixed_bytes.decode('utf-8', errors='replace')
    print("FIXED sample:", repr(fixed[1100:1200]))
    with open(r'c:\Users\user\e-library-front\src\pages\LeaderboardPage.tsx', 'w', encoding='utf-8') as f:
        f.write(fixed)
    print("OK - written")
except Exception as e:
    print("ERROR:", e)
