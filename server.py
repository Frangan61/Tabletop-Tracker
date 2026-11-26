#!/usr/bin/env python3
"""TableTop Tracker — serveur local (loopback uniquement).

Sert l'application statique (static/) et fait proxy vers l'API XML de
BoardGameGeek (BGG) pour la recherche de jeux et la fiche (poids/complexité).

Lancement :  python3 server.py   puis ouvrir http://127.0.0.1:8000
Sans ce serveur, l'app fonctionne aussi en ouvrant static/index.html
directement (file://) avec saisie manuelle des jeux.
"""

import json
import os
import socket
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

HOST = os.environ.get("HOST", "127.0.0.1")  # mettre 0.0.0.0 pour servir sur le réseau local (Wi-Fi)
PORT = int(os.environ.get("PORT", "8787"))
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
BGG_API = "https://boardgamegeek.com/xmlapi2"
USER_AGENT = "TableTopTracker/1.0 (local score tracking app)"
BGG_API_KEY = os.environ.get("BGG_API_KEY", "").strip()


def bgg_get(path, params, retries=4):
    qs = urllib.parse.urlencode(params)
    url = f"{BGG_API}/{path}?{qs}"
    headers = {"User-Agent": USER_AGENT}
    if BGG_API_KEY:
        headers["Authorization"] = "Bearer " + BGG_API_KEY
    last_error = None
    for _ in range(retries):
        req = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=20) as resp:
                return resp.read().decode("utf-8", "replace")
        except urllib.error.HTTPError as e:
            if e.code == 202:
                # BGG met la requête en file d'attente : on patiente et on réessaie
                last_error = e
                time.sleep(2.5)
                continue
            raise
    raise RuntimeError(f"BGG indisponible (file d'attente saturée) après {retries} essais") from last_error


def text_of(elem, path, default=None):
    found = elem.find(path)
    if found is None:
        return default
    return (found.text or "").strip() or default


def parse_search(xml_text):
    root = ET.fromstring(xml_text)
    items = []
    for item in root.findall("./item"):
        name = item.find("./name")
        year = item.find("./yearpublished")
        items.append({
            "id": item.get("id"),
            "name": (name.get("value") if name is not None else "") or "Sans nom",
            "year": year.get("value") if year is not None else None,
        })
    return items


def parse_thing(xml_text):
    root = ET.fromstring(xml_text)
    item = root.find("./item")
    if item is None:
        raise RuntimeError("Réponse BGG inattendue")
    names = item.findall("./name")
    primary = next((n for n in names if n.get("type") == "primary"), names[0] if names else None)
    stats = item.find("./statistics/ratings")
    weight = None
    if stats is not None:
        w = stats.find("./averageweight")
        if w is not None and w.get("value") and w.get("value") != "N/A":
            try:
                weight = round(float(w.get("value")), 2)
            except ValueError:
                weight = None
    def values(path):
        return [el.get("value") for el in item.findall(path) if el.get("value")]

    # "Best" de suggested_numplayers : meilleur nombre de joueurs selon les votes BGG
    best_players = None
    for poll in item.findall("./poll"):
        if poll.get("name") == "suggested_numplayers":
            bests = [r.get("numplayers") for r in poll.findall("./results/result") if r.get("value") == "Best"]
            if bests:
                best_players = max(int(b) for b in bests if b.isdigit())

    return {
        "id": item.get("id"),
        "name": primary.get("value") if primary is not None else "Sans nom",
        "year": text_of(item, "./yearpublished"),
        "complexity": weight,
        "minPlayers": text_of(item, "./minplayers"),
        "maxPlayers": text_of(item, "./maxplayers"),
        "bestPlayers": best_players,
        "playingtime": text_of(item, "./playingtime"),
        "minplaytime": text_of(item, "./minplaytime"),
        "maxplaytime": text_of(item, "./maxplaytime"),
        "categories": values("./boardgamecategory"),
        "mechanics": values("./boardgamemechanic"),
        "image": text_of(item, "./image"),
        "thumbnail": text_of(item, "./thumbnail"),
    }


class Handler(SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.1"  # keep-alive : une seule connexion TCP pour tous les fichiers
    timeout = 30  # ferme les connexions keep-alive inactives

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def handle_one_request(self):
        # Le navigateur ferme parfois la connexion en cours de transfert (reload rapide) :
        # on ignore ces erreurs au lieu de spammer la traceback.
        try:
            super().handle_one_request()
        except (BrokenPipeError, ConnectionResetError):
            self.close_connection = True

    def _json(self, payload, status=200):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        try:
            self._do_GET()
        except (BrokenPipeError, ConnectionResetError):
            self.close_connection = True

    def _do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/bgg/search":
            q = urllib.parse.parse_qs(parsed.query).get("q", [""])[0].strip()
            if not q:
                self._json({"error": "Paramètre q requis"}, 400)
                return
            try:
                xml_text = bgg_get("search", {"query": q, "type": "boardgame"})
                self._json(parse_search(xml_text))
            except Exception as e:
                self._json({"error": str(e)}, 502)
            return
        if parsed.path == "/api/bgg/thing":
            gid = urllib.parse.parse_qs(parsed.query).get("id", [""])[0].strip()
            if not gid:
                self._json({"error": "Paramètre id requis"}, 400)
                return
            try:
                xml_text = bgg_get("thing", {"id": gid, "stats": "1"})
                self._json(parse_thing(xml_text))
            except Exception as e:
                self._json({"error": str(e)}, 502)
            return
        super().do_GET()

    def log_message(self, fmt, *args):
        pass  # silencieux : le logging par requête ralentit le serveur (surtout sur téléphone)


class Server(ThreadingHTTPServer):
    daemon_threads = True

    def get_request(self):
        sock, addr = super().get_request()
        # TCP_NODELAY : évite le délai Nagle/delayed-ACK (~40 ms par requête)
        try:
            sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
        except OSError:
            pass
        return sock, addr


def main():
    server = Server((HOST, PORT), Handler)
    print(f"TableTop Tracker disponible sur http://{HOST}:{server.server_port}  (Ctrl+C pour arrêter)", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
