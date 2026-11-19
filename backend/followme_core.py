#!/usr/bin/env python3
"""Server galerie followme.

Web:            http://localhost:8765
Administrace:   http://localhost:8765/admin.html  (heslo je v config.json)

Server je dostupný i ostatním zařízením ve stejné síti (Wi-Fi) přes IP adresu
tohoto počítače, např. http://192.168.0.168:8765. Jen pro tento počítač nastavte LAN = False.

Celý katalog (kategorie, typy, značky, barvy a produkty) je v data/catalog.json,
nahrané fotky v public/uploads/.
"""
import base64
import http.server
import json
import os
import re
import secrets
import socket
import threading
import time
import unicodedata
from urllib.parse import urlparse

PORT = int(os.environ.get('PORT') or 8765)  # hosting obvykle určí port sám
LAN = True  # True = web uvidí i ostatní na stejné Wi-Fi, False = jen tento počítač
ROOT = os.path.dirname(os.path.abspath(__file__))
PUBLIC = os.path.join(ROOT, 'public')
UPLOADS = os.path.join(PUBLIC, 'uploads')
CATALOG_FILE = os.path.join(ROOT, 'data', 'catalog.json')
CONFIG_FILE = os.path.join(ROOT, 'config.json')

COLLECTIONS = ('categories', 'types', 'brands', 'colors', 'products')
ARTS = {'briefs', 'highwaist', 'thong', 'bra', 'bralette', 'set', 'body', 'garter',
        'boxers', 'trunks', 'slip', 'nightgown', 'socks'}
SIZE_CHARTS = {'', 'damske', 'panske', 'podprsenky', 'detske'}
IMAGE_TYPES = {'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif'}
MAX_IMAGE = 8 * 1024 * 1024
TOKEN_TTL = 12 * 3600

lock = threading.Lock()
tokens = {}  # token -> čas vypršení


def load_config():
    if not os.path.exists(CONFIG_FILE):
        cfg = {'admin_password': secrets.token_urlsafe(9)}
        with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump(cfg, f, ensure_ascii=False, indent=2)
        os.chmod(CONFIG_FILE, 0o600)
    with open(CONFIG_FILE, encoding='utf-8') as f:
        return json.load(f)


def admin_password():
    """Heslo z proměnné prostředí ADMIN_PASSWORD (hosting), jinak z config.json."""
    return os.environ.get('ADMIN_PASSWORD') or str(load_config().get('admin_password', ''))


def load_catalog():
    with open(CATALOG_FILE, encoding='utf-8') as f:
        catalog = json.load(f)
    for key in COLLECTIONS:
        catalog.setdefault(key, [])
    return catalog


def save_catalog(catalog):
    tmp = CATALOG_FILE + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)
        f.write('\n')
    os.replace(tmp, CATALOG_FILE)


def slugify(text):
    text = unicodedata.normalize('NFKD', text.replace('đ', 'd').replace('Đ', 'D')).encode('ascii', 'ignore').decode()
    return re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')[:60] or 'polozka'


def new_id(items, name):
    ids = {i['id'] for i in items}
    base = slugify(name)
    pid, n = base, 2
    while pid in ids:
        pid, n = f'{base}-{n}', n + 1
    return pid


# ---------- Kontrola dat z administrace ----------

class Invalid(Exception):
    pass


def text(data, key, limit=2000):
    return str(data.get(key) or '').strip()[:limit]


def loc(data, key, limit=2000, required=None):
    """Text v češtině a vietnamštině: {'cs': …, 'vi': …}."""
    v = data.get(key) or {}
    if isinstance(v, str):
        v = {'cs': v}
    out = {lang: str(v.get(lang) or '').strip()[:limit] for lang in ('cs', 'vi')}
    if required and not out['cs']:
        raise Invalid(required)
    return out


def number(data, key, default=0):
    try:
        return int(round(float(data.get(key))))
    except (TypeError, ValueError):
        return default


def hex_color(value, default):
    value = str(value or '').strip()
    return value.lower() if re.fullmatch(r'#[0-9a-fA-F]{6}', value) else default


def clean_category(d, cat):
    return {
        'name': loc(d, 'name', 60, 'Vyplňte název kategorie.'),
        'title': loc(d, 'title', 120),
        'lead': loc(d, 'lead', 600),
        'bg': hex_color(d.get('bg'), '#f3e4de'),
        'art': text(d, 'art') if text(d, 'art') in ARTS else 'briefs',
        'artColor': hex_color(d.get('artColor'), '#e8c4bc'),
        'sizeChart': text(d, 'sizeChart') if text(d, 'sizeChart') in SIZE_CHARTS else '',
        'order': number(d, 'order', len(cat['categories']) + 1),
    }


def clean_type(d, cat):
    c = text(d, 'cat')
    if c not in {x['id'] for x in cat['categories']}:
        raise Invalid('Vyberte kategorii.')
    return {
        'cat': c,
        'name': loc(d, 'name', 60, 'Vyplňte název typu.'),
        'order': number(d, 'order', len([t for t in cat['types'] if t['cat'] == c]) + 1),
    }


def clean_brand(d, cat):
    name = text(d, 'name', 60)
    if not name:
        raise Invalid('Vyplňte název značky.')
    return {'name': name}


def clean_color(d, cat):
    h = hex_color(d.get('hex'), None)
    if not h:
        raise Invalid('Vyberte odstín barvy.')
    return {'name': loc(d, 'name', 40, 'Vyplňte název barvy.'), 'hex': h}


def clean_product(d, cat):
    c = text(d, 'cat')
    if c not in {x['id'] for x in cat['categories']}:
        raise Invalid('Vyberte kategorii.')
    name = loc(d, 'name', 120, 'Vyplňte název produktu.')
    try:
        price = int(round(float(d.get('price'))))
        if price < 0:
            raise ValueError
    except (TypeError, ValueError):
        raise Invalid('Cena musí být kladné číslo.')
    old_price = None
    if d.get('oldPrice') not in (None, '', 0, '0'):
        try:
            old_price = int(round(float(d.get('oldPrice'))))
        except (TypeError, ValueError):
            raise Invalid('Původní cena musí být číslo.')
        if old_price <= price:
            raise Invalid('Původní cena musí být vyšší než aktuální cena.')
    sizes = list(dict.fromkeys(str(s).strip()[:12] for s in (d.get('sizes') or []) if str(s).strip()))
    if not sizes:
        raise Invalid('Zadejte alespoň jednu velikost.')
    t = text(d, 'type')
    if t and not any(x['id'] == t and x['cat'] == c for x in cat['types']):
        t = ''
    brand = text(d, 'brand')
    if brand not in {x['id'] for x in cat['brands']}:
        brand = ''
    color_ids = {x['id'] for x in cat['colors']}
    image = d.get('image') or None
    if image and not re.fullmatch(r'uploads/[A-Za-z0-9._-]+', image):
        raise Invalid('Neplatná fotka.')
    return {
        'cat': c,
        'type': t,
        'brand': brand,
        'name': name,
        'desc': loc(d, 'desc', 2000),
        'material': loc(d, 'material', 300),
        'tag': loc(d, 'tag', 40),
        'price': price,
        'oldPrice': old_price,
        'colors': [x for x in dict.fromkeys(d.get('colors') or []) if x in color_ids],
        'art': text(d, 'art') if text(d, 'art') in ARTS else 'briefs',
        'image': image,
        'sizes': sizes,
        'soldOut': [s for s in (d.get('soldOut') or []) if s in sizes],
        'sizeChart': text(d, 'sizeChart') if text(d, 'sizeChart') in SIZE_CHARTS else '',
    }


CLEANERS = {'categories': clean_category, 'types': clean_type, 'brands': clean_brand,
            'colors': clean_color, 'products': clean_product}


def id_source(coll, item):
    return item['name'] if coll == 'brands' else item['name']['cs']


def delete_item(cat, coll, item_id):
    """Smaže položku a uklidí odkazy na ni. Vrací text pro administraci, nebo vyhodí Invalid."""
    items = cat[coll]
    if not any(i['id'] == item_id for i in items):
        raise Invalid('Položka už neexistuje.')
    note = ''
    if coll == 'categories':
        used = [p for p in cat['products'] if p['cat'] == item_id]
        if used:
            raise Invalid(f'V kategorii je {len(used)} produktů. Nejdřív je přesuňte do jiné kategorie nebo smažte.')
        cat['types'] = [t for t in cat['types'] if t['cat'] != item_id]
    elif coll in ('types', 'brands'):
        key = 'type' if coll == 'types' else 'brand'
        for p in cat['products']:
            if p[key] == item_id:
                p[key] = ''
    elif coll == 'colors':
        for p in cat['products']:
            p['colors'] = [c for c in p['colors'] if c != item_id]
    cat[coll] = [i for i in items if i['id'] != item_id]
    return note


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PUBLIC, **kwargs)

    def log_message(self, fmt, *args):
        pass

    def end_headers(self):
        # Ať prohlížeč vždy načte aktuální verzi stránek i katalogu
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    # --- pomocné ---
    def send_json(self, status, payload):
        body = json.dumps(payload, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def read_json(self, limit=12 * 1024 * 1024):
        length = int(self.headers.get('Content-Length') or 0)
        if length > limit:
            raise ValueError('Požadavek je příliš velký.')
        raw = self.rfile.read(length) if length else b'{}'
        return json.loads(raw.decode('utf-8') or '{}')

    def authorized(self):
        auth = self.headers.get('Authorization', '')
        token = auth[7:] if auth.startswith('Bearer ') else ''
        exp = tokens.get(token)
        if exp and exp > time.time():
            return True
        self.send_json(401, {'error': 'Přihlášení vypršelo, přihlaste se prosím znovu.'})
        return False

    def route(self):
        """/api/<kolekce>[/<id>] → (kolekce, id), jinak None."""
        m = re.fullmatch(r'/api/([a-z]+)(?:/([a-z0-9-]+))?', urlparse(self.path).path)
        if m and m.group(1) in COLLECTIONS:
            return m.group(1), m.group(2)
        return None

    # --- HTTP metody ---
    def do_GET(self):
        path = urlparse(self.path).path
        if path == '/api/catalog':
            with lock:
                return self.send_json(200, load_catalog())
        if path.startswith('/api/'):
            return self.send_json(404, {'error': 'Nenalezeno'})
        return super().do_GET()

    def do_POST(self):
        path = urlparse(self.path).path
        try:
            data = self.read_json()
        except ValueError as e:
            return self.send_json(400, {'error': str(e) or 'Neplatná data.'})

        if path == '/api/login':
            password = str(data.get('password') or '')
            if secrets.compare_digest(password, admin_password()):
                token = secrets.token_urlsafe(24)
                tokens[token] = time.time() + TOKEN_TTL
                return self.send_json(200, {'token': token})
            time.sleep(1)
            return self.send_json(401, {'error': 'Nesprávné heslo.'})

        if not self.authorized():
            return

        if path == '/api/logout':
            tokens.pop(self.headers.get('Authorization', '')[7:], None)
            return self.send_json(200, {'ok': True})

        if path == '/api/upload':
            m = re.fullmatch(r'data:(image/[a-z]+);base64,(.+)', str(data.get('data') or ''), re.S)
            if not m or m.group(1) not in IMAGE_TYPES:
                return self.send_json(400, {'error': 'Nahrajte obrázek JPG, PNG, WEBP nebo GIF.'})
            blob = base64.b64decode(m.group(2))
            if len(blob) > MAX_IMAGE:
                return self.send_json(400, {'error': 'Fotka je větší než 8 MB.'})
            os.makedirs(UPLOADS, exist_ok=True)
            name = f'{int(time.time())}-{secrets.token_hex(4)}{IMAGE_TYPES[m.group(1)]}'
            with open(os.path.join(UPLOADS, name), 'wb') as f:
                f.write(blob)
            return self.send_json(200, {'path': f'uploads/{name}'})

        r = self.route()
        if not r or r[1]:
            return self.send_json(404, {'error': 'Nenalezeno'})
        coll = r[0]
        with lock:
            cat = load_catalog()
            try:
                item = CLEANERS[coll](data, cat)
            except Invalid as e:
                return self.send_json(400, {'error': str(e)})
            item = {'id': new_id(cat[coll], id_source(coll, item)), **item}
            if coll == 'products':
                cat[coll].insert(0, item)
            else:
                cat[coll].append(item)
            save_catalog(cat)
        return self.send_json(201, item)

    def do_PUT(self):
        r = self.route()
        if not r or not r[1]:
            return self.send_json(404, {'error': 'Nenalezeno'})
        if not self.authorized():
            return
        try:
            data = self.read_json()
        except ValueError as e:
            return self.send_json(400, {'error': str(e) or 'Neplatná data.'})
        coll, item_id = r
        with lock:
            cat = load_catalog()
            try:
                item = CLEANERS[coll](data, cat)
            except Invalid as e:
                return self.send_json(400, {'error': str(e)})
            for i, old in enumerate(cat[coll]):
                if old['id'] == item_id:
                    if coll == 'types' and old['cat'] != item['cat']:
                        # Typ přesunutý do jiné kategorie už k produktům původní kategorie nepatří
                        for p in cat['products']:
                            if p['type'] == item_id:
                                p['type'] = ''
                    cat[coll][i] = {'id': item_id, **item}
                    save_catalog(cat)
                    return self.send_json(200, cat[coll][i])
        return self.send_json(404, {'error': 'Položka už neexistuje.'})

    def do_DELETE(self):
        r = self.route()
        if not r or not r[1]:
            return self.send_json(404, {'error': 'Nenalezeno'})
        if not self.authorized():
            return
        with lock:
            cat = load_catalog()
            try:
                delete_item(cat, *r)
            except Invalid as e:
                return self.send_json(409, {'error': str(e)})
            save_catalog(cat)
        return self.send_json(200, {'ok': True})

class V6Server(http.server.ThreadingHTTPServer):
    address_family = socket.AF_INET6

    def server_bind(self):
        # IPv6 poslouchá zvlášť, IPv4 obsluhuje druhý server
        self.socket.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 1)
        super().server_bind()


def lan_ip():
    """IP adresa tohoto počítače v místní síti (bez odesílání dat)."""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(('192.168.0.1', 9))
            return s.getsockname()[0]
    except OSError:
        return None


if __name__ == '__main__':
    load_config()
    host4, host6 = ('0.0.0.0', '::') if LAN else ('127.0.0.1', '::1')
    servers = [http.server.ThreadingHTTPServer((host4, PORT), Handler)]
    try:
        servers.append(V6Server((host6, PORT), Handler))
    except OSError:
        pass
    for s in servers[1:]:
        threading.Thread(target=s.serve_forever, daemon=True).start()
    print(f'followme běží na http://localhost:{PORT}  ·  administrace: http://localhost:{PORT}/admin.html')
    ip = lan_ip() if LAN else None
    if ip:
        print(f'Ostatní na stejné Wi-Fi: http://{ip}:{PORT}')
    try:
        servers[0].serve_forever()
    except KeyboardInterrupt:
        pass
