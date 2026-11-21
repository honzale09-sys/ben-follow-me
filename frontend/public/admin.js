(() => {
  'use strict';
  const { escapeHTML, productVisual, SIZE_CHARTS, SIZE_PRESETS, ART_TYPES, art, VAT_RATE } = window;
  const netOf = price => new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.round(price / (1 + VAT_RATE / 100) * 100) / 100) + '\u00a0Kč';

  const $ = sel => document.querySelector(sel);
  const e = escapeHTML;
  const cs = o => (o && typeof o === 'object' ? o.cs : o) || '';
  const czk = n => new Intl.NumberFormat('cs-CZ').format(n) + ' Kč';
  const TOKEN_KEY = 'followme-admin-token';

  let token = null;
  try { token = sessionStorage.getItem(TOKEN_KEY); } catch (err) { /* bez úložiště se přihlášení drží jen do obnovení stránky */ }
  let CAT = { categories: [], types: [], brands: [], colors: [], products: [] };
  let tab = 'products';
  let editing = null;        // upravovaná položka, null = nová
  let photo = null;          // cesta k fotce u otevřeného produktu
  let pickedColors = [];     // barvy v pořadí výběru – první je hlavní
  let pendingDelete = null;
  const view = { q: '', cat: '', brand: '', size: '', avail: '' };

  // Všechny velikosti z produktů, seřazené od nejmenší
  function allSizes(list) {
    const order = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', ...Object.values(SIZE_PRESETS).flat()];
    const rank = s => (order.indexOf(s) + 1) || 999;
    return [...new Set(list.flatMap(p => p.sizes))].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b, 'cs', { numeric: true }));
  }

  const form = $('[data-form]');
  const editor = $('[data-editor]');
  const confirmBox = $('[data-confirm]');
  const byIdIn = (coll, id) => CAT[coll].find(x => x.id === id);

  /* ---------- API ---------- */

  async function api(method, url, body) {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && url !== '/api/login') { logout(data.error); throw new Error(data.error); }
    if (!res.ok) throw new Error(data.error || 'Něco se pokazilo, zkuste to znovu.');
    return data;
  }

  async function reload() {
    CAT = await api('GET', '/api/catalog');
    CAT.categories.sort((a, b) => a.order - b.order);
    CAT.types.sort((a, b) => a.order - b.order);
    CAT.brands.sort((a, b) => a.name.localeCompare(b.name, 'cs'));
    CAT.colors.sort((a, b) => cs(a.name).localeCompare(cs(b.name), 'cs'));
    renderTab();
  }

  /* ---------- Přihlášení ---------- */

  function showLogin(msg) {
    $('[data-panel]').hidden = true;
    $('[data-login]').hidden = false;
    $('[data-login-error]').textContent = msg || '';
    $('#password').value = '';
    $('#password').focus();
  }

  async function showPanel() {
    $('[data-login]').hidden = true;
    $('[data-panel]').hidden = false;
    await reload();
  }

  function logout(msg) {
    if (token) fetch('/api/logout', { method: 'POST', headers: { Authorization: 'Bearer ' + token } }).catch(() => {});
    token = null;
    try { sessionStorage.removeItem(TOKEN_KEY); } catch (err) { /* nic */ }
    showLogin(msg);
  }

  $('[data-login-form]').addEventListener('submit', async ev => {
    ev.preventDefault();
    const btn = ev.target.querySelector('button');
    btn.disabled = true;
    try {
      const data = await api('POST', '/api/login', { password: $('#password').value });
      token = data.token;
      try { sessionStorage.setItem(TOKEN_KEY, token); } catch (err) { /* nic */ }
      await showPanel();
    } catch (err) {
      $('[data-login-error]').textContent = err.message;
    } finally {
      btn.disabled = false;
    }
  });
  $('[data-logout]').addEventListener('click', () => logout());

  /* ---------- Pomocné pro formuláře ---------- */

  const opts = (list, value) => list.map(([v, txt]) => `<option value="${e(v)}" ${v === value ? 'selected' : ''}>${e(txt)}</option>`).join('');
  const catOpts = () => CAT.categories.map(c => [c.id, cs(c.name)]);

  function field(label, inner, cls = '') {
    return `<div class="form-field ${cls}"><label>${label}</label>${inner}</div>`;
  }
  function fText(name, label, value = '', { required, placeholder = '', max = 200, cls = '', type = 'text' } = {}) {
    return field(label + (required ? ' *' : ''), `<input name="${name}" type="${type}" value="${e(value)}" maxlength="${max}" placeholder="${e(placeholder)}" ${required ? 'required' : ''}>`, cls);
  }
  // Pole v češtině a vietnamštině vedle sebe
  function fLoc(name, label, value, { required, textarea, placeholder = '', max = 200 } = {}) {
    const v = value || {};
    const input = lang => textarea
      ? `<textarea name="${name}__${lang}" rows="3" maxlength="${max}" placeholder="${lang === 'cs' ? e(placeholder) : 'tiếng Việt'}">${e(v[lang] || '')}</textarea>`
      : `<input name="${name}__${lang}" type="text" value="${e(v[lang] || '')}" maxlength="${max}" placeholder="${lang === 'cs' ? e(placeholder) : 'tiếng Việt'}" ${lang === 'cs' && required ? 'required' : ''}>`;
    return `<div class="form-field full loc-field">
      <label>${label}${required ? ' *' : ''}</label>
      <div class="loc-pair">
        <div class="loc"><span class="lang-tag">CZ</span>${input('cs')}</div>
        <div class="loc"><span class="lang-tag">VI</span>${input('vi')}</div>
      </div>
    </div>`;
  }
  function fSelect(name, label, list, value, { required, empty, cls = '' } = {}) {
    return field(label + (required ? ' *' : ''), `<select name="${name}" ${required ? 'required' : ''}>
      ${empty !== undefined ? `<option value="">${e(empty)}</option>` : ''}${opts(list, value)}</select>`, cls);
  }
  function fColor(name, label, value) {
    return field(label, `<div class="color-input"><input type="color" name="${name}" value="${e(value)}"><span>${e(value)}</span></div>`);
  }
  const val = name => (form.elements[name] ? form.elements[name].value : '').trim();
  const locVal = name => ({ cs: val(name + '__cs'), vi: val(name + '__vi') });

  /* ---------- Části katalogu ---------- */

  const usage = {
    categories: id => CAT.products.filter(p => p.cat === id).length,
    types: id => CAT.products.filter(p => p.type === id).length,
    brands: id => CAT.products.filter(p => p.brand === id).length,
    colors: id => CAT.products.filter(p => p.colors.includes(id)).length,
  };
  const pcs = n => `${n} ${n === 1 ? 'produkt' : n >= 2 && n <= 4 ? 'produkty' : 'produktů'}`;
  const actions = id => `<div class="prow-actions">
      <button type="button" class="btn btn-ghost btn-sm" data-edit="${id}">Upravit</button>
      <button type="button" class="btn btn-ghost btn-sm btn-danger-ghost" data-delete="${id}">Smazat</button>
    </div>`;

  const TABS = {
    products: {
      title: 'Produkty', add: '+ Přidat produkt', single: 'produkt',
      note: () => `${pcs(CAT.products.length)} · ${CAT.products.filter(p => p.oldPrice).length} v akci (vyplněná původní cena)`,
      toolbar: () => `<div class="toolbar-filters">
          <input type="search" placeholder="Hledat podle názvu…" data-view="q" value="${e(view.q)}" aria-label="Hledat">
          <select data-view="cat" aria-label="Kategorie"><option value="">Všechny kategorie</option>${opts(catOpts(), view.cat)}<option value="__akce" ${view.cat === '__akce' ? 'selected' : ''}>Jen v akci</option></select>
          ${CAT.brands.length ? `<select data-view="brand" aria-label="Značka"><option value="">Všechny značky</option>${opts(CAT.brands.map(b => [b.id, b.name]), view.brand)}</select>` : ''}
          <select data-view="size" aria-label="Velikost"><option value="">Všechny velikosti</option>${opts(allSizes(CAT.products).map(s => [s, 'Velikost ' + s]), view.size)}</select>
          ${view.size ? `<select data-view="avail" aria-label="Dostupnost"><option value="">dostupné i nedostupné</option>${opts([['ano', 'jen dostupné'], ['ne', 'jen nedostupné']], view.avail)}</select>` : ''}
        </div>`,
      items: () => CAT.products.filter(p =>
        (!view.cat || (view.cat === '__akce' ? p.oldPrice : p.cat === view.cat)) &&
        (!view.brand || p.brand === view.brand) &&
        (!view.size || (p.sizes.includes(view.size) &&
          (!view.avail || (view.avail === 'ano') !== p.soldOut.includes(view.size)))) &&
        (!view.q || (cs(p.name) + ' ' + (p.name.vi || '')).toLowerCase().includes(view.q.toLowerCase()))),
      row: p => {
        const c = byIdIn('categories', p.cat);
        const ty = byIdIn('types', p.type);
        const b = byIdIn('brands', p.brand);
        const colors = p.colors.map(id => byIdIn('colors', id)).filter(Boolean);
        return `<div class="prow">
          <div class="prow-media" style="--bg:${c ? c.bg : '#eee'}">${productVisual(p, (colors[0] || {}).hex || (c || {}).artColor, cs(p.name))}</div>
          <div class="prow-main">
            <div class="prow-name">${e(cs(p.name))} ${cs(p.tag) ? `<span class="pill">${e(cs(p.tag))}</span>` : ''} ${p.oldPrice ? '<span class="pill pill-sale">AKCE</span>' : ''} ${p.name.vi ? '' : '<span class="pill pill-muted" title="Chybí vietnamský název">bez VI</span>'}</div>
            <div class="prow-meta">${c ? e(cs(c.name)) : '—'}${ty ? ' · ' + e(cs(ty.name)) : ''}${b ? ' · <b>' + e(b.name) + '</b>' : ''}</div>
            <div class="prow-meta">${colors.map(x => `<span class="swatch${x.id === 'mix' ? ' mix' : ''}" style="background:${x.hex}" title="${e(cs(x.name))}"></span>`).join('')} ${p.sizes.map(s => { const x = p.soldOut.includes(s) ? `<s>${e(s)}</s>` : e(s); return s === view.size ? `<mark>${x}</mark>` : x; }).join(' · ')}</div>
          </div>
          <div class="prow-price">${czk(p.price)}<small>${netOf(p.price)} bez DPH</small>${p.oldPrice ? `<s>${czk(p.oldPrice)}</s>` : ''}</div>
          <div class="prow-actions">
            <a href="./#/produkt/${p.id}" target="_blank" rel="noopener" class="btn btn-ghost btn-sm">Na webu ↗</a>
            <button type="button" class="btn btn-ghost btn-sm" data-edit="${p.id}">Upravit</button>
            <button type="button" class="btn btn-ghost btn-sm btn-danger-ghost" data-delete="${p.id}">Smazat</button>
          </div>
        </div>`;
      },
      form: p => productForm(p),
      payload: () => productPayload(),
      deleteText: p => `Produkt <b>„${e(cs(p.name))}“</b> zmizí z webu. Tuto akci nejde vrátit.`,
    },

    categories: {
      title: 'Kategorie', add: '+ Přidat kategorii', single: 'kategorii',
      note: () => 'Pořadí určuje, jak jdou kategorie za sebou v menu a na úvodní stránce. Sekce Akce se plní sama produkty se slevou.',
      toolbar: () => '',
      items: () => CAT.categories,
      row: c => `<div class="prow">
          <div class="prow-media" style="--bg:${c.bg}">${art(c.art, c.artColor)}</div>
          <div class="prow-main">
            <div class="prow-name">${e(cs(c.name))} <span class="muted">/ ${e(c.name.vi || '—')}</span></div>
            <div class="prow-meta">${pcs(usage.categories(c.id))} · ${CAT.types.filter(x => x.cat === c.id).length} typů · pořadí ${c.order}${c.sizeChart ? ' · tabulka: ' + SIZE_CHARTS[c.sizeChart] : ''}</div>
          </div>
          <div class="prow-price"></div>
          ${actions(c.id)}
        </div>`,
      form: c => {
        c = c || { name: {}, title: {}, lead: {}, bg: '#f3e4de', art: 'briefs', artColor: '#e8c4bc', sizeChart: 'damske', order: CAT.categories.length + 1 };
        return `<div class="form-grid">
          ${fLoc('name', 'Název v menu', c.name, { required: true, placeholder: 'např. Plavky', max: 60 })}
          ${fLoc('title', 'Nadpis stránky (nepovinné)', c.title, { placeholder: 'např. Dámské plavky', max: 120 })}
          ${fLoc('lead', 'Úvodní text', c.lead, { textarea: true, max: 600 })}
          ${fColor('bg', 'Barva pozadí', c.bg)}
          ${fSelect('sizeChart', 'Tabulka velikostí', Object.entries(SIZE_CHARTS), c.sizeChart, { empty: '— žádná —' })}
          ${fSelect('art', 'Obrázek na dlaždici', Object.entries(ART_TYPES), c.art)}
          ${fColor('artColor', 'Barva obrázku', c.artColor)}
          ${fText('order', 'Pořadí', c.order, { type: 'number', max: 4 })}
        </div>`;
      },
      payload: () => ({ name: locVal('name'), title: locVal('title'), lead: locVal('lead'), bg: val('bg'), sizeChart: val('sizeChart'), art: val('art'), artColor: val('artColor'), order: val('order') }),
      deleteText: c => {
        const n = usage.categories(c.id);
        return n ? `V kategorii <b>„${e(cs(c.name))}“</b> je ${pcs(n)}. Nejdřív je přesuňte do jiné kategorie nebo smažte.`
          : `Kategorie <b>„${e(cs(c.name))}“</b> i její typy zmizí z webu.`;
      },
    },

    types: {
      title: 'Typy', add: '+ Přidat typ', single: 'typ',
      note: () => 'Typy prádla v rámci kategorie (např. tanga, klasické, s vysokým pasem). Návštěvníci podle nich filtrují.',
      toolbar: () => `<div class="toolbar-filters"><select data-view="cat" aria-label="Kategorie"><option value="">Všechny kategorie</option>${opts(catOpts(), view.cat)}</select></div>`,
      items: () => CAT.types.filter(x => !view.cat || x.cat === view.cat)
        .sort((a, b) => CAT.categories.findIndex(c => c.id === a.cat) - CAT.categories.findIndex(c => c.id === b.cat) || a.order - b.order),
      row: x => `<div class="prow prow-simple">
          <div class="prow-main">
            <div class="prow-name">${e(cs(x.name))} <span class="muted">/ ${e(x.name.vi || '—')}</span></div>
            <div class="prow-meta">${e(cs((byIdIn('categories', x.cat) || {}).name))} · ${pcs(usage.types(x.id))} · pořadí ${x.order}</div>
          </div>
          ${actions(x.id)}
        </div>`,
      form: x => {
        x = x || { cat: view.cat || (CAT.categories[0] || {}).id, name: {}, order: '' };
        return `<div class="form-grid">
          ${fSelect('cat', 'Kategorie', catOpts(), x.cat, { required: true })}
          ${fText('order', 'Pořadí', x.order, { type: 'number', max: 4, placeholder: 'na konec' })}
          ${fLoc('name', 'Název typu', x.name, { required: true, placeholder: 'např. Tanga', max: 60 })}
        </div>`;
      },
      payload: () => ({ cat: val('cat'), name: locVal('name'), order: val('order') }),
      deleteText: x => `Typ <b>„${e(cs(x.name))}“</b> se smaže.${usage.types(x.id) ? ` U ${pcs(usage.types(x.id))} se typ odebere, produkty zůstanou.` : ''}`,
    },

    brands: {
      title: 'Značky', add: '+ Přidat značku', single: 'značku',
      note: () => 'Značky přiřadíte produktům ve formuláři produktu. Na webu podle nich jde filtrovat.',
      toolbar: () => '',
      items: () => CAT.brands,
      row: b => `<div class="prow prow-simple">
          <div class="prow-main">
            <div class="prow-name">${e(b.name)}</div>
            <div class="prow-meta">${pcs(usage.brands(b.id))}</div>
          </div>
          ${actions(b.id)}
        </div>`,
      form: b => `<div class="form-grid">${fText('name', 'Název značky', (b || {}).name || '', { required: true, placeholder: 'např. Melosi', max: 60, cls: 'full' })}</div>`,
      payload: () => ({ name: val('name') }),
      deleteText: b => `Značka <b>„${e(b.name)}“</b> se smaže.${usage.brands(b.id) ? ` U ${pcs(usage.brands(b.id))} se značka odebere, produkty zůstanou.` : ''}`,
    },

    colors: {
      title: 'Barvy', add: '+ Přidat barvu', single: 'barvu',
      note: () => 'Produkt může mít víc barev najednou (mix barev). Podle barvy jde na webu filtrovat.',
      toolbar: () => '',
      items: () => CAT.colors,
      row: c => `<div class="prow prow-simple">
          <span class="swatch swatch-xl${c.id === 'mix' ? ' mix' : ''}" style="background:${c.hex}"></span>
          <div class="prow-main">
            <div class="prow-name">${e(cs(c.name))} <span class="muted">/ ${e(c.name.vi || '—')}</span></div>
            <div class="prow-meta">${c.hex} · ${pcs(usage.colors(c.id))}</div>
          </div>
          ${actions(c.id)}
        </div>`,
      form: c => {
        c = c || { name: {}, hex: '#c8a2c8' };
        return `<div class="form-grid">
          ${fLoc('name', 'Název barvy', c.name, { required: true, placeholder: 'např. Vínová', max: 40 })}
          ${fColor('hex', 'Odstín', c.hex)}
        </div>`;
      },
      payload: () => ({ name: locVal('name'), hex: val('hex') }),
      deleteText: c => `Barva <b>„${e(cs(c.name))}“</b> se smaže.${usage.colors(c.id) ? ` U ${pcs(usage.colors(c.id))} se odebere, produkty zůstanou.` : ''}`,
    },
  };

  /* ---------- Výpis ---------- */

  function renderTab() {
    const T = TABS[tab];
    document.querySelectorAll('[data-tab]').forEach(b => b.toggleAttribute('aria-current', b.dataset.tab === tab));
    $('[data-tab-title]').textContent = T.title;
    $('[data-tab-note]').textContent = T.note();
    $('[data-new]').textContent = T.add;
    $('[data-toolbar]').innerHTML = T.toolbar();
    $('[data-toolbar]').hidden = !T.toolbar();
    renderList();
  }

  function renderList() {
    const T = TABS[tab];
    const items = T.items();
    const all = T.items === TABS.products.items ? CAT.products.length : items.length;
    $('[data-list]').innerHTML = (items.length !== all ? `<p class="list-count">Zobrazeno ${items.length} z ${all}${view.size ? ` · velikost <b>${e(view.size)}</b>` : ''}</p>` : '') +
      (items.length ? items.map(T.row).join('')
      : `<div class="empty"><h2>${all ? 'Nic neodpovídá filtru' : 'Zatím tu nic není'}</h2><p>${all ? 'Zkuste filtr změnit.' : `Klikněte na „${e(T.add.replace('+ ', ''))}“.`}</p></div>`);
  }

  document.querySelector('.admin-tabs').addEventListener('click', ev => {
    const b = ev.target.closest('[data-tab]');
    if (!b) return;
    tab = b.dataset.tab;
    Object.assign(view, { q: '', cat: '', brand: '', size: '', avail: '' });
    renderTab();
  });

  $('[data-toolbar]').addEventListener('input', ev => {
    const f = ev.target.closest('[data-view]');
    if (!f) return;
    view[f.dataset.view] = f.value;
    if (f.dataset.view === 'size') {
      // Výběr dostupnosti se ukáže jen při zvolené velikosti
      if (!f.value) view.avail = '';
      renderTab();
      $('[data-toolbar] [data-view="size"]').focus();
    } else renderList();
  });

  /* ---------- Formulář produktu ---------- */

  function productForm(p) {
    const firstCat = view.cat && view.cat !== '__akce' ? view.cat : (CAT.categories[0] || {}).id;
    p = p || { cat: firstCat, type: '', brand: '', name: {}, desc: {}, material: {}, tag: {}, price: '', oldPrice: '', colors: [], art: (byIdIn('categories', firstCat) || {}).art || 'briefs', image: null, sizes: [], soldOut: [], sizeChart: '' };
    const sizes = p.sizes.length ? p.sizes : (SIZE_PRESETS[(byIdIn('categories', p.cat) || {}).sizeChart] || []);
    return `<div class="editor-grid">
      <div class="editor-media">
        <div class="preview" data-preview></div>
        <label class="btn btn-ghost btn-sm btn-block file-btn">Nahrát fotku
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" data-file hidden></label>
        <button type="button" class="link" data-remove-photo hidden>Odebrat fotku</button>
        <p class="hint">Bez fotky se ukáže ilustrace podle tvaru a první barvy.</p>
      </div>
      <div class="form-grid">
        ${fLoc('name', 'Název', p.name, { required: true, placeholder: 'např. Krajkové kalhotky Luna', max: 120 })}
        ${fSelect('cat', 'Kategorie', catOpts(), p.cat, { required: true })}
        <div class="form-field" data-type-field>${typeSelect(p.cat, p.type)}</div>
        ${fSelect('brand', 'Značka', CAT.brands.map(b => [b.id, b.name]), p.brand, { empty: '— bez značky —' })}
        ${fSelect('art', 'Tvar ilustrace', Object.entries(ART_TYPES), p.art)}
        ${field('Cena s DPH (Kč) *', `<input name="price" type="number" value="${e(p.price)}" maxlength="7" required><div class="hint" data-net>${p.price !== '' ? 'Bez DPH: ' + netOf(p.price) : `Zadejte cenu včetně DPH ${VAT_RATE} %`}</div>`)}
        ${fText('oldPrice', 'Původní cena (Kč) – vyplňte pro AKCI', p.oldPrice || '', { type: 'number', max: 7, placeholder: 'jen u slevy' })}
        ${fText('pack', 'Počet ks v balení', p.pack || '', { max: 20, placeholder: 'např. 3' })}
        ${fLoc('tag', 'Štítek', p.tag, { placeholder: 'např. Novinka', max: 40 })}
        <div class="form-field full">
          <label>Barvy <span class="hint">– vyberte jednu nebo víc (mix barev). První vybraná je hlavní a kreslí se podle ní ilustrace.</span></label>
          <div class="color-picks" data-colors>
            ${CAT.colors.map(c => `<label class="color-pick"><input type="checkbox" name="colors" value="${c.id}" ${p.colors.includes(c.id) ? 'checked' : ''}><span class="swatch${c.id === 'mix' ? ' mix' : ''}" style="background:${c.hex}"></span>${e(cs(c.name))}</label>`).join('')}
          </div>
          <button type="button" class="link" data-goto-colors>Přidat novou barvu…</button>
        </div>
        ${fLoc('mixColors', 'Jaké barvy jsou v mixu', p.mixColors, { placeholder: 'např. černá, bílá, růžová', max: 300 })}
        <div class="form-field full">
          <label>Velikosti *</label>
          <input name="sizes" type="text" required value="${e(sizes.join(', '))}" placeholder="např. XS, S, M, L, XL">
          <div class="presets">
            <span class="hint">Rychle vyplnit:</span>
            ${Object.entries(SIZE_PRESETS).map(([k, list]) => `<button type="button" class="chip" data-preset="${k}">${list[0]}–${list[list.length - 1]}</button>`).join('')}
            <button type="button" class="chip" data-preset="uni">Univerzální</button>
          </div>
        </div>
        <div class="form-field full">
          <label>Momentálně nedostupné velikosti</label>
          <div class="checks" data-soldout></div>
        </div>
        ${fSelect('sizeChart', 'Tabulka velikostí', Object.entries(SIZE_CHARTS), p.sizeChart, { empty: '— podle kategorie —', cls: 'full' })}
        ${fLoc('material', 'Materiál', p.material, { placeholder: 'např. 95 % bavlna, 5 % elastan', max: 300 })}
        ${fLoc('desc', 'Popis', p.desc, { textarea: true, max: 2000 })}
      </div>
    </div>`;
  }

  function typeSelect(catId, value) {
    const list = CAT.types.filter(x => x.cat === catId).map(x => [x.id, cs(x.name)]);
    return `<label>Typ</label><select name="type"><option value="">— bez typu —</option>${opts(list, value)}</select>`;
  }

  const parseSizes = () => [...new Set(val('sizes').split(/[,;]+/).map(s => s.trim()).filter(Boolean))];

  function renderSoldOut(checked) {
    const box = form.querySelector('[data-soldout]');
    if (!box) return;
    const keep = checked || [...form.querySelectorAll('[name="soldOut"]:checked')].map(i => i.value);
    const sizes = parseSizes();
    box.innerHTML = sizes.length
      ? sizes.map(s => `<label class="inline-check"><input type="checkbox" name="soldOut" value="${e(s)}" ${keep.includes(s) ? 'checked' : ''}> ${e(s)}</label>`).join('')
      : '<span class="hint">Nejdřív zadejte velikosti.</span>';
  }

  function renderPreview() {
    const box = form.querySelector('[data-preview]');
    if (!box) return;
    const c = byIdIn('categories', val('cat')) || {};
    const firstColor = byIdIn('colors', pickedColors[0]);
    form.querySelectorAll('.color-pick').forEach(l => l.classList.toggle('main', l.querySelector('input').value === pickedColors[0]));
    box.style.setProperty('--bg', c.bg || '#f3e4de');
    box.innerHTML = productVisual({ image: photo, art: val('art') }, (firstColor || {}).hex || c.artColor, val('name__cs'));
    form.querySelector('[data-remove-photo]').hidden = !photo;
  }

  function toggleMix() {
    form.elements.mixColors__cs.closest('.form-field').style.display = pickedColors.includes('mix') ? '' : 'none';
  }

  function productPayload() {
    return {
      name: locVal('name'), cat: val('cat'), type: val('type'), brand: val('brand'), art: val('art'),
      price: val('price'), oldPrice: val('oldPrice'), tag: locVal('tag'),
      pack: val('pack'), colors: pickedColors, mixColors: locVal('mixColors'),
      image: photo, sizes: parseSizes(),
      soldOut: [...form.querySelectorAll('[name="soldOut"]:checked')].map(i => i.value),
      sizeChart: val('sizeChart'), material: locVal('material'), desc: locVal('desc'),
    };
  }

  // Fotku před nahráním zmenšíme, ať se web načítá rychle
  async function shrinkImage(file) {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.86);
  }

  /* ---------- Otevření a uložení formuláře ---------- */

  function openEditor(item) {
    const T = TABS[tab];
    editing = item || null;
    photo = item && tab === 'products' ? item.image : null;
    pickedColors = item && tab === 'products' ? [...item.colors] : [];
    $('[data-form-title]').textContent = item ? `Upravit ${T.single}` : `Nový ${T.single}`.replace('Nový kategorii', 'Nová kategorie').replace('Nový značku', 'Nová značka').replace('Nový barvu', 'Nová barva');
    $('[data-form-error]').textContent = '';
    $('[data-form-body]').innerHTML = T.form(item);
    editor.classList.toggle('modal-narrow', tab !== 'products' && tab !== 'categories');
    if (tab === 'products') {
      renderSoldOut(item ? item.soldOut : []);
      renderPreview();
      toggleMix();
    }
    editor.showModal();
    const first = form.querySelector('input:not([type=file]):not([type=checkbox]), select');
    if (first) first.focus();
  }

  $('[data-new]').addEventListener('click', () => openEditor(null));
  editor.addEventListener('click', ev => {
    if (ev.target.closest('[data-close]') || ev.target === editor) editor.close();
  });

  form.addEventListener('input', ev => {
    const n = ev.target.name || '';
    if (ev.target.type === 'color') ev.target.nextElementSibling.textContent = ev.target.value;
    if (tab !== 'products') return;
    if (n === 'sizes') renderSoldOut();
    if (n === 'price') form.querySelector('[data-net]').textContent = val('price') ? 'Bez DPH: ' + netOf(+val('price')) : `Zadejte cenu včetně DPH ${VAT_RATE} %`;
    if (n === 'colors') {
      pickedColors = pickedColors.filter(id => id !== ev.target.value);
      if (ev.target.checked) pickedColors.push(ev.target.value);
      toggleMix();
    }
    if (n === 'cat') {
      form.querySelector('[data-type-field]').innerHTML = typeSelect(val('cat'), '');
      const c = byIdIn('categories', val('cat'));
      if (!editing && c && SIZE_PRESETS[c.sizeChart]) { form.elements.sizes.value = SIZE_PRESETS[c.sizeChart].join(', '); renderSoldOut([]); }
      if (!editing && c) form.elements.art.value = c.art;
    }
    if (['cat', 'art', 'colors', 'name__cs'].includes(n)) renderPreview();
  });

  form.addEventListener('click', ev => {
    const b = ev.target.closest('[data-preset]');
    if (b) {
      form.elements.sizes.value = b.dataset.preset === 'uni' ? 'Univerzální' : SIZE_PRESETS[b.dataset.preset].join(', ');
      renderSoldOut();
    }
    if (ev.target.closest('[data-remove-photo]')) { photo = null; renderPreview(); }
    if (ev.target.closest('[data-goto-colors]')) {
      editor.close();
      tab = 'colors';
      renderTab();
      openEditor(null);
    }
  });

  form.addEventListener('change', async ev => {
    if (!ev.target.matches('[data-file]')) return;
    const file = ev.target.files[0];
    ev.target.value = '';
    if (!file) return;
    const box = form.querySelector('[data-preview]');
    box.classList.add('loading');
    $('[data-form-error]').textContent = '';
    try {
      const res = await api('POST', '/api/upload', { data: await shrinkImage(file) });
      photo = res.path;
      renderPreview();
    } catch (err) {
      $('[data-form-error]').textContent = err.message || 'Fotku se nepodařilo nahrát.';
    } finally {
      box.classList.remove('loading');
    }
  });

  form.addEventListener('submit', async ev => {
    ev.preventDefault();
    let bad = null;
    form.querySelectorAll('[required]').forEach(inp => {
      const ok = inp.value.trim() !== '' && inp.checkValidity();
      inp.closest('.form-field').classList.toggle('invalid', !ok);
      if (!ok && !bad) bad = inp;
    });
    if (bad) { bad.focus(); $('[data-form-error]').textContent = 'Vyplňte prosím povinná pole označená hvězdičkou.'; return; }

    const btn = $('[data-save]');
    btn.disabled = true;
    try {
      const payload = TABS[tab].payload();
      if (editing) await api('PUT', `/api/${tab}/${editing.id}`, payload);
      else await api('POST', `/api/${tab}`, payload);
      editor.close();
      toast(editing ? 'Změny uloženy' : 'Přidáno');
      await reload();
    } catch (err) {
      $('[data-form-error]').textContent = err.message;
    } finally {
      btn.disabled = false;
    }
  });

  /* ---------- Mazání ---------- */

  $('[data-list]').addEventListener('click', ev => {
    const ed = ev.target.closest('[data-edit]');
    if (ed) return openEditor(byIdIn(tab, ed.dataset.edit));
    const del = ev.target.closest('[data-delete]');
    if (del) {
      pendingDelete = byIdIn(tab, del.dataset.delete);
      const blocked = tab === 'categories' && usage.categories(pendingDelete.id) > 0;
      $('[data-confirm-text]').innerHTML = TABS[tab].deleteText(pendingDelete);
      $('[data-confirm-yes]').hidden = blocked;
      $('[data-confirm-no]').textContent = blocked ? 'Rozumím' : 'Ponechat';
      confirmBox.showModal();
    }
  });

  $('[data-confirm-no]').addEventListener('click', () => confirmBox.close());
  $('[data-confirm-yes]').addEventListener('click', async () => {
    try {
      await api('DELETE', `/api/${tab}/${pendingDelete.id}`);
      confirmBox.close();
      toast('Smazáno');
      await reload();
    } catch (err) {
      confirmBox.close();
      toast(err.message);
    }
  });

  /* ---------- Hláška ---------- */

  const toastEl = $('.toast');
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2600);
  }

  /* ---------- Start ---------- */

  if (token) showPanel().catch(() => {});
  else showLogin();
})();
