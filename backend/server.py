import base64
import json
import os
import re
import secrets
import threading
import time
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, Response
from pymongo import MongoClient
from starlette.middleware.cors import CORSMiddleware

import followme_core as core

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

db = MongoClient(os.environ['MONGO_URL'])[os.environ['DB_NAME']]
lock = threading.Lock()


def load_catalog():
    doc = db.catalog.find_one({'_id': 'main'}, {'_id': 0})
    if not doc:
        doc = json.loads((ROOT_DIR / 'catalog_seed.json').read_text(encoding='utf-8'))
        db.catalog.replace_one({'_id': 'main'}, doc, upsert=True)
    for key in core.COLLECTIONS:
        doc.setdefault(key, [])
    if not any(c['id'] == 'mix' for c in doc['colors']):
        doc['colors'].append({'id': 'mix', 'name': {'cs': 'Mix', 'vi': 'Mix'}, 'hex': '#c8a2c8'})
        save_catalog(doc)
    return doc


def save_catalog(cat):
    db.catalog.replace_one({'_id': 'main'}, cat, upsert=True)


def clean_product(d, cat):
    img = d.get('image') or ''
    api_img = img.startswith('api/uploads/')
    item = core.clean_product({**d, 'image': img[4:] if api_img else (img or None)}, cat)
    if api_img:
        item['image'] = img
    item['mixColors'] = core.loc(d, 'mixColors', 300)
    return item


CLEANERS = {**core.CLEANERS, 'products': clean_product}

app = FastAPI()


def err(status, msg):
    return JSONResponse({'error': msg}, status_code=status)


def authorized(request: Request):
    auth = request.headers.get('Authorization', '')
    token = auth[7:] if auth.startswith('Bearer ') else ''
    return bool(token and db.sessions.find_one({'_id': token, 'exp': {'$gt': time.time()}}))


async def body(request: Request):
    raw = await request.body()
    try:
        return json.loads(raw.decode('utf-8') or '{}')
    except ValueError:
        return None


@app.get('/api/catalog')
def get_catalog():
    with lock:
        return JSONResponse(load_catalog(), headers={'Cache-Control': 'no-store'})


@app.get('/api/uploads/{name}')
def get_upload(name: str):
    doc = db.uploads.find_one({'_id': name})
    if not doc:
        return err(404, 'Nenalezeno')
    return Response(doc['data'], media_type=doc['type'], headers={'Cache-Control': 'public, max-age=31536000'})


@app.post('/api/login')
async def login(request: Request):
    data = await body(request) or {}
    if secrets.compare_digest(str(data.get('password') or ''), os.environ['ADMIN_PASSWORD']):
        token = secrets.token_urlsafe(24)
        db.sessions.delete_many({'exp': {'$lt': time.time()}})
        db.sessions.insert_one({'_id': token, 'exp': time.time() + core.TOKEN_TTL})
        return {'token': token}
    time.sleep(1)
    return err(401, 'Nesprávné heslo.')


@app.post('/api/logout')
def logout(request: Request):
    db.sessions.delete_one({'_id': request.headers.get('Authorization', '')[7:]})
    return {'ok': True}


@app.post('/api/upload')
async def upload(request: Request):
    if not authorized(request):
        return err(401, 'Přihlášení vypršelo, přihlaste se prosím znovu.')
    data = await body(request) or {}
    m = re.fullmatch(r'data:(image/[a-z]+);base64,(.+)', str(data.get('data') or ''), re.S)
    if not m or m.group(1) not in core.IMAGE_TYPES:
        return err(400, 'Nahrajte obrázek JPG, PNG, WEBP nebo GIF.')
    blob = base64.b64decode(m.group(2))
    if len(blob) > core.MAX_IMAGE:
        return err(400, 'Fotka je větší než 8 MB.')
    name = f'{int(time.time())}-{secrets.token_hex(4)}{core.IMAGE_TYPES[m.group(1)]}'
    db.uploads.insert_one({'_id': name, 'type': m.group(1), 'data': blob})
    return {'path': f'api/uploads/{name}'}


@app.post('/api/{coll}')
async def create(coll: str, request: Request):
    if coll not in core.COLLECTIONS:
        return err(404, 'Nenalezeno')
    if not authorized(request):
        return err(401, 'Přihlášení vypršelo, přihlaste se prosím znovu.')
    data = await body(request)
    if data is None:
        return err(400, 'Neplatná data.')
    with lock:
        cat = load_catalog()
        try:
            item = CLEANERS[coll](data, cat)
        except core.Invalid as e:
            return err(400, str(e))
        item = {'id': core.new_id(cat[coll], core.id_source(coll, item)), **item}
        if coll == 'products':
            cat[coll].insert(0, item)
        else:
            cat[coll].append(item)
        save_catalog(cat)
    return JSONResponse(item, status_code=201)


@app.put('/api/{coll}/{item_id}')
async def update(coll: str, item_id: str, request: Request):
    if coll not in core.COLLECTIONS:
        return err(404, 'Nenalezeno')
    if not authorized(request):
        return err(401, 'Přihlášení vypršelo, přihlaste se prosím znovu.')
    data = await body(request)
    if data is None:
        return err(400, 'Neplatná data.')
    with lock:
        cat = load_catalog()
        try:
            item = CLEANERS[coll](data, cat)
        except core.Invalid as e:
            return err(400, str(e))
        for i, old in enumerate(cat[coll]):
            if old['id'] == item_id:
                if coll == 'types' and old['cat'] != item['cat']:
                    for p in cat['products']:
                        if p['type'] == item_id:
                            p['type'] = ''
                cat[coll][i] = {'id': item_id, **item}
                save_catalog(cat)
                return cat[coll][i]
    return err(404, 'Položka už neexistuje.')


@app.delete('/api/{coll}/{item_id}')
def delete(coll: str, item_id: str, request: Request):
    if coll not in core.COLLECTIONS:
        return err(404, 'Nenalezeno')
    if not authorized(request):
        return err(401, 'Přihlášení vypršelo, přihlaste se prosím znovu.')
    with lock:
        cat = load_catalog()
        try:
            core.delete_item(cat, coll, item_id)
        except core.Invalid as e:
            return err(409, str(e))
        save_catalog(cat)
    return {'ok': True}


app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
