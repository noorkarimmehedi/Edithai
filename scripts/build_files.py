import os, base64, json

BASE = "/Users/noorkarimmehedi/Downloads/untitled folder 5/voicemail-ai"

# We store each file content as base64 to avoid any escaping problems
files_b64 = {}

# 1. src/types/index.ts
files_b64["src/types/index.ts"] = """ZXhwb3J0IHR5cGUgQ29ubmVjdGlvblN0YXR1cyA9ICJjb25uZWN0ZWQiIHwgImRpc2Nvbm5lY3RlZCIgfCAiY29ubmVjdGluZyI7C