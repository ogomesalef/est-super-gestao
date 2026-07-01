#!/usr/bin/env python3
"""Autoriza Gmail API (cx@) via navegador — mesmo OAuth do est-artes."""

from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path

# Evita erro quando Google adiciona openid ao scope
os.environ["OAUTHLIB_RELAX_TOKEN_SCOPE"] = "1"

from google_auth_oauthlib.flow import InstalledAppFlow

ROOT = Path(__file__).resolve().parent.parent
CREDENTIALS = Path(__file__).resolve().parent.parent.parent / "est-artes" / "scripts" / "credentials.json"
ENV_FILE = ROOT / ".env"

SCOPES = [
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/documents",
    "https://www.googleapis.com/auth/spreadsheets.readonly",
]


def update_env_refresh_token(token: str) -> None:
    text = ENV_FILE.read_text(encoding="utf-8") if ENV_FILE.exists() else ""
    key = "GMAIL_REFRESH_TOKEN"
    line = f'{key}="{token}"'
    if re.search(rf"^{re.escape(key)}=", text, flags=re.M):
        text = re.sub(rf"^{re.escape(key)}=.*$", line, text, flags=re.M)
    else:
        text = text.rstrip() + "\n" + line + "\n"
    ENV_FILE.write_text(text, encoding="utf-8")
    print(f"Atualizado {ENV_FILE}")


def main() -> None:
    if not CREDENTIALS.exists():
        print(f"Credenciais não encontradas: {CREDENTIALS}", file=sys.stderr)
        sys.exit(1)

    print("Abrindo navegador — faça login com cx@estrategiavestibulares.com.br")
    flow = InstalledAppFlow.from_client_secrets_file(str(CREDENTIALS), SCOPES)
    creds = flow.run_local_server(port=0, prompt="consent", open_browser=True)

    data = json.loads(creds.to_json())
    refresh = data.get("refresh_token")
    if not refresh:
        print("Sem refresh_token. Revogue em myaccount.google.com/permissions e tente de novo.", file=sys.stderr)
        sys.exit(1)

    out = ROOT / "gmail-token.json"
    out.write_text(json.dumps(data, indent=2), encoding="utf-8")
    update_env_refresh_token(refresh)

    # Também preenche GOOGLE_CLIENT_ID/SECRET no .env se vazio
    client = json.loads(CREDENTIALS.read_text())["installed"]
    env = ENV_FILE.read_text(encoding="utf-8")
    for k, v in [
        ("GOOGLE_CLIENT_ID", client["client_id"]),
        ("GOOGLE_CLIENT_SECRET", client["client_secret"]),
        ("GMAIL_SENDER_EMAIL", "cx@estrategiavestibulares.com.br"),
    ]:
        if re.search(rf"^{re.escape(k)}=", env, flags=re.M):
            env = re.sub(rf"^{re.escape(k)}=.*$", f'{k}="{v}"', env, flags=re.M)
        else:
            env = env.rstrip() + f'\n{k}="{v}"\n'
    ENV_FILE.write_text(env, encoding="utf-8")

    print("OK — refresh token salvo.")
    print(refresh[:20] + "...")


if __name__ == "__main__":
    main()
