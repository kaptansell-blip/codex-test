#!/usr/bin/env python3
"""Kişisel belgeleri uygulama için şifreler.

Kullanım:
    python3 tools/encrypt_docs.py <manifest.json> <cikti.json> "<parola>"

manifest.json biçimi:
{
  "info": { ...uygulamada gösterilecek kişisel bilgiler... },
  "docs": [
    {"id": "ucak", "title": "...", "subtitle": "...",
     "images": ["yol/sayfa1.jpg"], "pdf": "yol/belge.pdf", "pdfName": "bilet.pdf"}
  ]
}

Çıktı: PBKDF2-SHA256 + AES-256-GCM ile şifrelenmiş JSON.
Uygulama (docs/app.js) aynı parametrelerle Web Crypto üzerinden çözer.
Düz metin belgeler ve parola depoya GİRMEZ.
"""
import base64
import json
import os
import sys

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

ITERATIONS = 400_000


def b64(data: bytes) -> str:
    return base64.b64encode(data).decode("ascii")


def read_b64(path: str) -> str:
    with open(path, "rb") as fh:
        return b64(fh.read())


def main() -> None:
    if len(sys.argv) != 4:
        sys.exit(__doc__)
    manifest_path, out_path, passphrase = sys.argv[1:]
    with open(manifest_path, encoding="utf-8") as fh:
        manifest = json.load(fh)
    base = os.path.dirname(os.path.abspath(manifest_path))

    def resolve(p: str) -> str:
        return p if os.path.isabs(p) else os.path.join(base, p)

    docs = []
    for doc in manifest["docs"]:
        entry = {k: v for k, v in doc.items() if k not in ("images", "pdf")}
        entry["images"] = ["data:image/jpeg;base64," + read_b64(resolve(p)) for p in doc.get("images", [])]
        if doc.get("pdf"):
            entry["pdf"] = read_b64(resolve(doc["pdf"]))
        docs.append(entry)

    plaintext = json.dumps({"info": manifest["info"], "docs": docs}, ensure_ascii=False).encode("utf-8")
    salt = os.urandom(16)
    iv = os.urandom(12)
    kdf = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt, iterations=ITERATIONS)
    key = kdf.derive(passphrase.encode("utf-8"))
    ciphertext = AESGCM(key).encrypt(iv, plaintext, None)

    with open(out_path, "w", encoding="ascii") as fh:
        json.dump({"v": 1, "kdf": "PBKDF2-SHA256", "iter": ITERATIONS,
                   "salt": b64(salt), "iv": b64(iv), "ct": b64(ciphertext)}, fh)
    print(f"{out_path}: {len(plaintext)//1024} KB düz metin şifrelendi")


if __name__ == "__main__":
    main()
