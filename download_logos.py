#!/usr/bin/env python3
"""
Scarica il logo principale da una lista di siti.

Uso:
    python3 download_logos.py siti.txt [cartella_output] [num_workers]

Formato di `siti.txt` (una riga per sito):
    Nome Azienda | https://example.com/
    https://solo-url.com/           # senza nome -> usa il dominio

Righe vuote e righe che iniziano con '#' sono ignorate.
Default output: ./loghi
Default workers: 20 (download in parallelo)
Dipendenze: requests, beautifulsoup4  (pip install requests beautifulsoup4)
"""

from __future__ import annotations

import mimetypes
import re
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "it-IT,it;q=0.9,en;q=0.8",
}

LOGO_KEYWORDS = ("logo", "brand")
TIMEOUT = 15


def score_img(tag) -> int:
    """Punteggio per un tag <img>: più alto = più probabile che sia il logo."""
    attrs = " ".join(
        str(tag.get(a, "")) for a in ("class", "id", "alt", "src", "title")
    ).lower()
    score = 0
    for kw in LOGO_KEYWORDS:
        if kw in attrs:
            score += 10
    if tag.find_parent(["header", "nav"]):
        score += 5
    if "icon" in attrs or "favicon" in attrs:
        score -= 3
    if "sprite" in attrs:
        score -= 5
    return score


def find_logo_url(html: str, base_url: str) -> str | None:
    soup = BeautifulSoup(html, "html.parser")

    # 1) <img> con "logo" negli attributi, preferendo header/nav
    candidates = []
    for img in soup.find_all("img"):
        s = score_img(img)
        src = img.get("src") or img.get("data-src") or img.get("data-lazy-src")
        if src and s > 0:
            candidates.append((s, urljoin(base_url, src)))
    if candidates:
        candidates.sort(reverse=True)
        return candidates[0][1]

    # 2) <link rel="icon"> con sizes più grande
    best_icon = None
    best_size = -1
    for link in soup.find_all("link", rel=True):
        rels = [r.lower() for r in link.get("rel", [])]
        if any(r in rels for r in ("icon", "shortcut icon", "apple-touch-icon")):
            href = link.get("href")
            if not href:
                continue
            sizes = link.get("sizes", "")
            m = re.match(r"(\d+)", sizes)
            size = int(m.group(1)) if m else 0
            if size > best_size:
                best_size = size
                best_icon = urljoin(base_url, href)
    if best_icon:
        return best_icon

    # 3) og:image come fallback (spesso è social preview, non logo)
    og = soup.find("meta", property="og:image")
    if og and og.get("content"):
        return urljoin(base_url, og["content"])

    # 4) /favicon.ico
    return urljoin(base_url, "/favicon.ico")


def ext_from_response(resp: requests.Response, url: str) -> str:
    ct = resp.headers.get("Content-Type", "").split(";")[0].strip().lower()
    ext = mimetypes.guess_extension(ct) if ct else None
    if ext in (".jpe", ".jpeg"):
        ext = ".jpg"
    if not ext:
        path_ext = Path(urlparse(url).path).suffix.lower()
        ext = path_ext or ".bin"
    return ext


def safe_name(name: str) -> str:
    name = name.strip().replace(" ", "_")
    return re.sub(r"[^a-zA-Z0-9._-]", "_", name) or "logo"


def parse_line(line: str) -> tuple[str | None, str] | None:
    """Ritorna (nome, url) o None se la riga va saltata."""
    line = line.strip()
    if not line or line.startswith("#"):
        return None
    if "|" in line:
        name, _, url = line.partition("|")
        return name.strip() or None, url.strip()
    return None, line


_print_lock = threading.Lock()


def log(*parts: str) -> None:
    with _print_lock:
        print(" ".join(parts), flush=True)


def fetch_with_retry(
    session: requests.Session, url: str, attempts: int = 2
) -> requests.Response:
    last_exc: Exception | None = None
    for i in range(attempts):
        try:
            r = session.get(url, headers=HEADERS, timeout=TIMEOUT, allow_redirects=True)
            r.raise_for_status()
            return r
        except requests.RequestException as e:
            last_exc = e
            if i < attempts - 1:
                time.sleep(0.5 * (i + 1))
    assert last_exc is not None
    raise last_exc


def try_scrape_logo(
    session: requests.Session, site: str, out_dir: Path, filename: str
) -> Path | None:
    """Scrape HTML del sito per trovare e scaricare il logo."""
    try:
        r = fetch_with_retry(session, site)
    except requests.RequestException:
        return None

    logo_url = find_logo_url(r.text, r.url)
    if not logo_url:
        return None

    try:
        lr = fetch_with_retry(session, logo_url)
    except requests.RequestException:
        return None

    if len(lr.content) < 100:
        return None

    ext = ext_from_response(lr, logo_url)
    out_path = out_dir / f"{filename}{ext}"
    out_path.write_bytes(lr.content)
    return out_path


def try_fallback_icon(
    session: requests.Session, domain: str, out_dir: Path, filename: str
) -> tuple[Path, str] | None:
    """Prova servizi esterni di favicon. Ritorna (path, source) o None."""
    services = [
        ("DDG",   f"https://icons.duckduckgo.com/ip3/{domain}.ico",           ".ico", 200),
        ("Goog",  f"https://www.google.com/s2/favicons?domain={domain}&sz=256", ".png", 500),
    ]
    for source, url, default_ext, min_size in services:
        try:
            r = session.get(url, headers=HEADERS, timeout=TIMEOUT, allow_redirects=True)
            r.raise_for_status()
        except requests.RequestException:
            continue
        if len(r.content) < min_size:
            continue
        ext = ext_from_response(r, url) or default_ext
        out_path = out_dir / f"{filename}{ext}"
        out_path.write_bytes(r.content)
        return out_path, source
    return None


def process(
    entry: tuple[str | None, str],
    out_dir: Path,
    session: requests.Session,
) -> tuple[str, tuple[str | None, str]]:
    """Ritorna (status, entry). status in {ok, fail}."""
    name, site = entry
    if not site.startswith(("http://", "https://")):
        site = "https://" + site
    domain = urlparse(site).hostname or site
    label = name or domain
    filename = safe_name(name) if name else safe_name(domain)

    # 1. Scraping del sito
    path = try_scrape_logo(session, site, out_dir, filename)
    if path:
        log(f"[OK]   {label} -> {path.name} ({path.stat().st_size} byte)")
        return "ok", entry

    # 2. Fallback a DuckDuckGo / Google favicon
    result = try_fallback_icon(session, domain, out_dir, filename)
    if result:
        path, source = result
        log(f"[FB-{source}] {label} -> {path.name} ({path.stat().st_size} byte)")
        return "ok", entry

    # 3. Fallito
    log(f"[FAIL] {label}  ({site})")
    return "fail", entry


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 1
    list_file = Path(sys.argv[1])
    out_dir = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("loghi")
    workers = int(sys.argv[3]) if len(sys.argv) > 3 else 20
    out_dir.mkdir(parents=True, exist_ok=True)

    entries = []
    for line in list_file.read_text(encoding="utf-8").splitlines():
        parsed = parse_line(line)
        if parsed is not None:
            entries.append(parsed)

    total = len(entries)
    log(f"Siti: {total} | workers paralleli: {workers} | output: {out_dir}/")

    counts = {"ok": 0, "fail": 0}
    failed: list[tuple[str | None, str]] = []
    with requests.Session() as s:
        with ThreadPoolExecutor(max_workers=workers) as pool:
            futures = {pool.submit(process, e, out_dir, s): e for e in entries}
            for i, fut in enumerate(as_completed(futures), 1):
                try:
                    status, entry = fut.result()
                except Exception as e:
                    log(f"[ERR]  exception: {e}")
                    counts["fail"] += 1
                    continue
                counts[status] += 1
                if status == "fail":
                    failed.append(entry)
                if i % 50 == 0 or i == total:
                    log(f"--- progresso: {i}/{total} "
                        f"(ok={counts['ok']} fail={counts['fail']})")

    # Scrivi failed.txt accanto a out_dir (così finisce anche nell'artifact)
    failed_path = out_dir / "failed.txt"
    if failed:
        with open(failed_path, "w", encoding="utf-8") as f:
            f.write("# Siti dove non e' stato possibile scaricare alcun logo\n")
            f.write("# Formato: Nome | URL (stesso di siti.txt, puoi rilanciare solo questi)\n")
            for name, url in failed:
                f.write(f"{name} | {url}\n" if name else f"{url}\n")
        log(f"Scritto {failed_path} con {len(failed)} siti falliti")
    elif failed_path.exists():
        failed_path.unlink()

    log(f"\nFINE: ok={counts['ok']} fail={counts['fail']} / {total}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
