print("=== SCRIPT FIX_VITE INICIOU ===")
input("Pressione ENTER para continuar...")
import os
import shutil
import subprocess
from datetime import datetime

PROJECT = os.path.abspath(".")
LOG_FILE = os.path.join(PROJECT, f"fix_vite_log_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt")

def log(msg: str):
    print(msg)
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(msg + "\n")
    except:
        pass

def has(cmd: str) -> bool:
    return shutil.which(cmd) is not None

def run(cmd: str):
    log(f"\n> {cmd}")
    try:
        p = subprocess.run(cmd, shell=True, text=True, capture_output=True)
        if p.stdout:
            log(p.stdout.strip())
        if p.stderr:
            log(p.stderr.strip())
        log(f"[exit={p.returncode}]")
        return p.returncode
    except Exception as e:
        log(f"ERRO ao executar '{cmd}': {e}")
        return 1

log("=== INICIO fix_vite.py ===")
log(f"Projeto: {PROJECT}")
log(f"Log: {LOG_FILE}")

# abrir VS Code (opcional)
if has("code"):
    run(f'code "{PROJECT}"')
else:
    log("AVISO: comando 'code' nao encontrado. No VS Code: Ctrl+Shift+P -> Install 'code' in PATH")

# checar node/npm
if not has("node") or not has("npm"):
    log("ERRO: Node.js ou NPM nao encontrados. Instale Node.js e tente novamente.")
    raise SystemExit(1)

# checar package.json
if not os.path.exists("package.json"):
    log("ERRO: package.json nao encontrado. Rode este script na pasta raiz do projeto.")
    raise SystemExit(1)

# instalar deps
run("npm install")

# lint fix (se existir)
run("npm run lint -- --fix")

# format (se existir)
run("npm run format")

# checar TS
if os.path.exists("tsconfig.json"):
    run("npx tsc --noEmit")

# build
run("npm run build")

log("\n=== FIM fix_vite.py ===")
log("Abra o arquivo de log acima e me mande o conteudo/print se tiver erro.")