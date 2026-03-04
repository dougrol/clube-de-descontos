"""
force_dark_auth.py — ProtectFlow AI & Auth Screen Contrast Fixer
================================================================
Fixes identified low-contrast color variables in:
  - App.tsx            → loading screen bg
  - Login.tsx          → gray-600 text labels in 'Associações Parceiras'
  - Register.tsx       → gray-600 ultra-faint footer disclaimer
  - VehicleProtection.tsx → gray-600 label + bg-gray-700 fallback button
  
All replacements are SAFE string substitutions that preserve TSX validity.
Run from the project root:  python force_dark_auth.py
"""

import os
import re

# ── Paths ──────────────────────────────────────────────────────────────────
BASE = os.path.dirname(os.path.abspath(__file__))

FILES = {
    "App.tsx": os.path.join(BASE, "App.tsx"),
    "Login.tsx": os.path.join(BASE, "screens", "Login.tsx"),
    "Register.tsx": os.path.join(BASE, "screens", "Register.tsx"),
    "VehicleProtection.tsx": os.path.join(BASE, "screens", "VehicleProtection.tsx"),
    "Splash.tsx": os.path.join(BASE, "screens", "Splash.tsx"),
    "ForgotPassword.tsx": os.path.join(BASE, "screens", "ForgotPassword.tsx"),
}

# ── Replacement Rules ──────────────────────────────────────────────────────
# Each rule is (file_key, old_string, new_string, description)
RULES = [
    # ── App.tsx ──────────────────────────────────────────────────────────────
    # Loading screen uses bare 'bg-black'; align with obsidian dark theme
    (
        "App.tsx",
        'className="min-h-screen bg-black flex items-center justify-center text-gold-500"',
        'className="min-h-screen bg-obsidian-950 flex items-center justify-center text-gold-500"',
        "App.tsx: Replace bg-black loading screen with bg-obsidian-950 for theme consistency",
    ),

    # ── Login.tsx ─────────────────────────────────────────────────────────────
    # "Associações Parceiras" label — text-gray-600 is barely visible on black/dark bg
    (
        "Login.tsx",
        'className="text-gray-600 text-[9px] uppercase tracking-[0.2em] text-center mb-4"',
        'className="text-gray-400 text-[9px] uppercase tracking-[0.2em] text-center mb-4"',
        "Login.tsx: 'Associações Parceiras' label contrast fix (gray-600 → gray-400)",
    ),
    # Sub-text description below role switcher — gray-400 is fine but ensure it's consistent
    # Partner: "Acesse com E-mail" span opacity-70 on gray text: ensure gray-400 base
    # (already gray-400 in Login.tsx partner button inactive state — no change needed)

    # Error text in login form
    (
        "Login.tsx",
        'className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 flex items-start gap-3"',
        'className="bg-red-500/15 border border-red-500/60 rounded-lg p-3 flex items-start gap-3"',
        "Login.tsx: Error alert bg/border contrast bump for dark mode readability",
    ),

    # ── Register.tsx ──────────────────────────────────────────────────────────
    # Footer disclaimer: text-gray-600 is WCAG fail on black bg
    (
        "Register.tsx",
        'className="text-[10px] text-gray-600 text-center mt-4"',
        'className="text-[10px] text-gray-400 text-center mt-4"',
        "Register.tsx: Footer disclaimer contrast fix (gray-600 → gray-400)",
    ),

    # ── VehicleProtection.tsx (ProtectFlow AI) ───────────────────────────────
    # "Associações Parceiras" section label — gray-600 is near-invisible on dark bg
    (
        "VehicleProtection.tsx",
        'className="text-gray-600 text-[9px] uppercase tracking-[0.2em] text-center mb-4"',
        'className="text-gray-400 text-[9px] uppercase tracking-[0.2em] text-center mb-4"',
        "VehicleProtection.tsx: 'Associações Parceiras' label contrast fix (gray-600 → gray-400)",
    ),
    # Non-popular plan "CONTRATAR AGORA" button: bg-gray-700 is barely visible dark-on-dark
    (
        "VehicleProtection.tsx",
        "'bg-gray-700 hover:bg-gray-600 text-white'",
        "'bg-obsidian-600 hover:bg-obsidian-500 text-white border border-white/10'",
        "VehicleProtection.tsx: Non-popular plan button contrast fix (gray-700 → obsidian-600)",
    ),
    # text-theme-muted feature list items — ensure they aren't overridden
    # (already using text-theme-muted which resolves to #999 in dark — acceptable but borderline)
    # Upgrade: use text-gray-300 for feature text so it's easy to read in dark mode
    (
        "VehicleProtection.tsx",
        'className="text-theme-muted text-sm font-medium"',
        'className="text-gray-300 text-sm font-medium"',
        "VehicleProtection.tsx: Plan feature list text contrast fix (text-theme-muted → text-gray-300)",
    ),
]

# ── Runner ─────────────────────────────────────────────────────────────────

def apply_fixes():
    total_changes = 0
    print("=" * 60)
    print("  ProtectFlow AI — Dark Mode Contrast Fixer")
    print("=" * 60)

    for file_key, old, new, description in RULES:
        file_path = FILES.get(file_key)
        if not file_path:
            print(f"\n[SKIP] Unknown file key: {file_key}")
            continue

        if not os.path.exists(file_path):
            print(f"\n[SKIP] File not found: {file_path}")
            continue

        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        if old not in content:
            print(f"\n[INFO] Pattern not found (already fixed or unchanged): {description}")
            continue

        new_content = content.replace(old, new)
        count = content.count(old)

        with open(file_path, "w", encoding="utf-8") as f:
            f.write(new_content)

        total_changes += count
        print(f"\n[FIX] {file_key} — {count} replacement(s)")
        print(f"      {description}")

    print("\n" + "=" * 60)
    print(f"  Done! {total_changes} total fix(es) applied.")
    print("  Run 'npm run build' or 'tsc' to verify no TSX errors.")
    print("=" * 60)


if __name__ == "__main__":
    apply_fixes()
