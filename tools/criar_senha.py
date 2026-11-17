#!/usr/bin/env python3
"""Gera o passwordHash de um cliente para o CLIENTS_JSON.

Uso:  python3 tools/criar_senha.py
A senha é digitada sem aparecer na tela e nunca é salva em lugar nenhum.
"""
import base64
import getpass
import hashlib
import secrets

ITERATIONS = 210_000

pwd = getpass.getpass("Senha do cliente: ")
if len(pwd) < 10:
    raise SystemExit("Use pelo menos 10 caracteres.")
if pwd != getpass.getpass("Repita a senha: "):
    raise SystemExit("As senhas não conferem.")

salt = secrets.token_bytes(16)
digest = hashlib.pbkdf2_hmac("sha256", pwd.encode(), salt, ITERATIONS, dklen=32)
print("\npasswordHash:")
print(f"pbkdf2_sha256${ITERATIONS}${base64.b64encode(salt).decode()}${base64.b64encode(digest).decode()}")
