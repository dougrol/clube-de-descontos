import os
import re

TARGET_DIRS = ["screens", "components"]
BASE_DIR = r"c:\Users\dougl\Downloads\tavares-car"

# We want to replace text-white with text-theme-text, EXCEPT when there is a strong background color nearby in the same className string.
# Match something like: className="..."
# Strategy: find all className strings. For each string, if it contains text-white, check if it contains bg-blue-, bg-red-, bg-green-, bg-gold-, bg-orange-, bg-emerald-, bg-signal-, bg-pink-.
# If it contains any of those colored backgrounds, DO NOT replace.
# Otherwise, replace text-white with text-theme-text.

STRONG_BGS = [
    "bg-blue-", "bg-red-", "bg-green-", "bg-gold-", "bg-orange-", "bg-emerald-", "bg-signal-", "bg-pink-", "bg-indigo-", "bg-purple-", "bg-[#", "bg-[var"
]

files_changed = 0

for d in TARGET_DIRS:
    path = os.path.join(BASE_DIR, d)
    for root, _, files in os.walk(path):
        for f in files:
            if f.endswith(".tsx") or f.endswith(".ts"):
                filepath = os.path.join(root, f)
                with open(filepath, "r", encoding="utf-8") as file:
                    content = file.read()

                # Find all class strings
                def replacer(match):
                    class_str = match.group(0)
                    if "text-white" in class_str:
                        has_strong_bg = any(bg in class_str for bg in STRONG_BGS)
                        if not has_strong_bg:
                            # Also don't replace if it's explicitly text-white/50 etc, just exact word bounds
                            # Using regex sub for exact word match
                            class_str = re.sub(r'\btext-white\b', 'text-theme-text', class_str)
                    return class_str

                new_content = re.sub(r'(className=)(["\'])(.*?)\2', replacer, content)
                new_content = re.sub(r'(className=\{[`"\'])(.*?)([`"\']\})', replacer, new_content)

                # Special case explicitly text-gray-400/500 -> text-theme-muted
                def replacer_gray(match):
                    class_str = match.group(0)
                    has_strong_bg = any(bg in class_str for bg in STRONG_BGS)
                    if not has_strong_bg:
                        class_str = re.sub(r'\btext-gray-400\b', 'text-theme-muted', class_str)
                        class_str = re.sub(r'\btext-gray-500\b', 'text-theme-muted', class_str)
                    return class_str

                new_content = re.sub(r'(className=)(["\'])(.*?)\2', replacer_gray, new_content)
                new_content = re.sub(r'(className=\{[`"\'])(.*?)([`"\']\})', replacer_gray, new_content)
                # Let's see if content changed
                if new_content != content:
                    with open(filepath, "w", encoding="utf-8") as file:
                        file.write(new_content)
                    files_changed += 1

print(f"Done. Replaced text-white in {files_changed} files.")
