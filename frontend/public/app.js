(() => {
  'use strict';
  const { L, t, escapeHTML, productVisual, SIZE_PRESETS, art, sizeTable, setLang, CONTACT_PHONE } = window;

  const app = document.getElementById('app');
  const e = escapeHTML;
  const TEL = 'tel:+420' + CONTACT_PHONE.replace(/\s/g, '');
  const czk = n => new Intl.NumberFormat(window.LANG === 'vi' ? 'vi-VN' : 'cs-CZ').format(n) + ' Kč';

  let CAT = { categories: [], types: [], brands: [], colors: [], products: [] };
  let byId = {}, catById = {}, typeById = {}, brandById = {}, colorById = {};
  const filters = { group: '', brand: '', color: '', size: '', sort: 'doporucene' };
  let filterScope = null;

  async function loadCatalog() {
    try {
      const res = await fetch('/api/catalog', { cache: 'no-store' });
      if (!res.ok) throw new Error(res.status);
      CAT = await res.json();
    } catch (err) {
      app.innerHTML = `<div class="wrap empty"><h2>${t('loadError')}</h2>
        <p>${t('loadErrorText', { phone: `<a href="${TEL}">${CONTACT_PHONE}</a>` })}</p></div>`;
      return false;
    }
    CAT.categories.sort((a, b) => a.order - b.order);
    CAT.types.sort((a, b) => a.order - b.order);
    CAT.brands.sort((a, b) => a.name.localeCompare(b.name, 'cs'));
    const index = list => Object.fromEntries(list.map(x => [x.id, x]));
    byId = index(CAT.products); catById = index(CAT.categories); typeById = index(CAT.types);
    brandById = index(CAT.brands); colorById = index(CAT.colors);
    return true;
  }

  /* ---------- Pomocné ---------- */

  const colorsOf = p => p.colors.map(id => colorById[id]).filter(Boolean);
  const hexOf = p => (colorsOf(p)[0] || {}).hex || (catById[p.cat] || {}).artColor;
  const bgOf = p => (catById[p.cat] || {}).bg || '#f3e4de';
  const visual = p => productVisual(p, hexOf(p), L(p.name));
  const onSale = p => !!p.oldPrice;
  const discount = p => p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  const count = n => `${n} ${t('products')(n)}`;

  function priceHTML(p) {
    return p.oldPrice
      ? `<div class="price sale">${czk(p.price)} <s>${czk(p.oldPrice)}</s></div>`
      : `<div class="price">${czk(p.price)}</div>`;
  }

  // Velikosti jsou jen informace – nejde je vybírat
  function sizesHTML(p, cls = '') {
    return `<ul class="sizes ${cls}" aria-label="${t('sizes')}">
      ${p.sizes.map(s => p.soldOut.includes(s)
        ? `<li class="size out" title="${t('unavailable')}"><s>${e(s)}</s></li>`
        : `<li class="size">${e(s)}</li>`).join('')}
    </ul>`;
  }

  function swatchesHTML(p, max = 5) {
    const cs = colorsOf(p);
    if (!cs.length) return '';
    const shown = cs.slice(0, max);
    return `<div class="card-meta" title="${e(cs.map(c => L(c.name)).join(', '))}">
      <span class="swatches">${shown.map(c => `<span class="swatch${c.id === 'mix' ? ' mix' : ''}" style="background:${c.hex}"></span>`).join('')}</span>
      ${cs.length === 1 ? e(L(cs[0].name)) : `${cs.length > max ? '+' + (cs.length - max) + ' · ' : ''}${e(cs.map(c => L(c.name)).slice(0, 2).join(', '))}${cs.length > 2 ? '…' : ''}`}
    </div>`;
  }

  function cardHTML(p) {
    const tag = L(p.tag);
    const d = discount(p);
    const brand = brandById[p.brand];
    return `<article class="card">
      <a href="#/produkt/${p.id}" class="card-media ${p.image ? 'has-photo' : ''}" style="--bg:${bgOf(p)}">
        ${visual(p)}
        ${tag ? `<span class="badge">${e(tag)}</span>` : ''}
        ${d ? `<span class="badge sale">−${d} %</span>` : ''}
      </a>
      <div class="card-body">
        ${brand ? `<div class="card-brand">${e(brand.name)}</div>` : ''}
        <a href="#/produkt/${p.id}" class="card-title">${e(L(p.name))}</a>
        ${swatchesHTML(p)}
        ${priceHTML(p)}
        <div class="sizes-label">${t('sizes')}</div>
        ${sizesHTML(p)}
        <a href="#/produkt/${p.id}" class="card-more">${t('detail')}</a>
      </div>
    </article>`;
  }

  function phoneIcon() {
    return `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.3 2.2Z" fill="currentColor"/></svg>`;
  }

  function contactBand() {
    return `<section class="section">
      <div class="wrap contact-band">
        <div><h2>${t('contactTitle')}</h2><p>${t('contactText')}</p></div>
        <a href="${TEL}" class="btn btn-light btn-lg">${phoneIcon()} ${CONTACT_PHONE}</a>
      </div>
    </section>`;
  }

  const phoneLink = `<a href="${TEL}" class="link-inline">${CONTACT_PHONE}</a>`;

  /* ---------- Hlavička a patička ---------- */

  function renderChrome() {
    document.documentElement.lang = window.LANG;
    document.querySelector('[data-nav-links]').innerHTML =
      CAT.categories.map(c => `<a href="#/kategorie/${c.id}" data-nav="${c.id}">${e(L(c.name))}</a>`).join('') +
      `<a href="#/akce" data-nav="akce" class="nav-sale">${t('sale')}</a>`;
    document.querySelectorAll('[data-lang]').forEach(b => b.setAttribute('aria-pressed', b.dataset.lang === window.LANG));
    document.querySelectorAll('[data-phone-label]').forEach(el => { el.setAttribute('aria-label', t('callSeller')); });
    document.querySelector('[data-footer]').innerHTML = `
      <div>
        <a href="#/" class="logo logo-sm">follow<em>me</em></a>
        <p class="muted">${t('footerText')}</p>
      </div>
      <div>
        <h4>${t('collection')}</h4>
        ${CAT.categories.map(c => `<a href="#/kategorie/${c.id}">${e(L(c.name))}</a>`).join('')}
        <a href="#/akce">${t('sale')}</a>
      </div>
      <div>
        <h4>${t('info')}</h4>
        <a href="#/velikosti">${t('sizeTable')}</a>
      </div>
      <div>
        <h4>${t('sellerContact')}</h4>
        <a href="${TEL}">${CONTACT_PHONE}</a>
      </div>`;
  }

  /* ---------- Stránky ---------- */

  function pageHome() {
    const sale = CAT.products.filter(onSale).sort((a, b) => discount(b) - discount(a));
    const best = [...CAT.products.filter(p => L(p.tag) && !onSale(p)), ...CAT.products.filter(p => !L(p.tag) && !onSale(p))].slice(0, 8);
    const countIn = id => CAT.products.filter(p => p.cat === id).length;
    return `
    <section class="hero">
      <div class="wrap hero-grid">
        <div>
          <div class="eyebrow">${t('eyebrow')}</div>
          <h1>${t('heroTitle')}</h1>
          <p class="lead">${t('heroLead')}</p>
          <div class="hero-actions">
            ${CAT.categories.slice(0, 2).map((c, i) => `<a href="#/kategorie/${c.id}" class="btn ${i ? 'btn-ghost' : ''}">${e(L(c.title) || L(c.name))}</a>`).join('')}
            ${sale.length ? `<a href="#/akce" class="btn btn-sale">${t('saleUpTo', { n: Math.max(...sale.map(discount)) })}</a>` : ''}
          </div>
        </div>
        <div class="hero-art" aria-hidden="true">
          <div class="piece p1">${art('bra', '#f7f3ec')}</div>
          <div class="piece p2">${art('highwaist', '#e3c6a8')}</div>
          <div class="piece p3">${art('boxers', '#2f3b52')}</div>
        </div>
      </div>
    </section>

    <section class="section" style="padding-top:0">
      <div class="wrap">
        <div class="section-head"><div><h2>${t('browseCats')}</h2></div></div>
        <div class="cat-tiles">
          ${CAT.categories.map(c => `
            <a href="#/kategorie/${c.id}" class="cat-tile" style="--bg:${c.bg}">
              <div class="tile-art">${art(c.art, c.artColor)}</div>
              <h3>${e(L(c.name))}</h3>
              <span>${count(countIn(c.id))}</span>
            </a>`).join('')}
          ${sale.length ? `<a href="#/akce" class="cat-tile cat-tile-sale">
              <div class="tile-sale">−${Math.max(...sale.map(discount))}&nbsp;%</div>
              <h3>${t('sale')}</h3>
              <span>${count(sale.length)}</span>
            </a>` : ''}
        </div>
      </div>
    </section>

    ${sale.length ? `<section class="section sale-section">
      <div class="wrap">
        <div class="section-head">
          <div><h2>${t('saleHome')}</h2><p>${t('saleHomeLead')}</p></div>
          <a href="#/akce" class="btn btn-ghost">${t('allSale')}</a>
        </div>
        <div class="grid">${sale.slice(0, 4).map(cardHTML).join('')}</div>
      </div>
    </section>` : ''}

    ${best.length ? `<section class="section">
      <div class="wrap">
        <div class="section-head"><div><h2>${t('favourites')}</h2><p>${t('favouritesLead')}</p></div></div>
        <div class="grid">${best.map(cardHTML).join('')}</div>
      </div>
    </section>` : ''}

    <section class="section">
      <div class="wrap">
        <div class="section-head"><div><h2>${t('howTitle')}</h2></div></div>
        <div class="steps">
          <div class="step"><span class="step-no">1</span><b>${t('step1')}</b><p>${t('step1t')}</p></div>
          <div class="step"><span class="step-no">2</span><b>${t('step2')}</b><p>${t('step2t')}</p></div>
          <div class="step"><span class="step-no">3</span><b>${t('step3')}</b><p>${t('step3t', { phone: phoneLink })}</p></div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="wrap story">
        <div>
          <div class="eyebrow">${t('storyEyebrow')}</div>
          <h2>${t('storyTitle')}</h2>
          <p>${t('storyText')}</p>
        </div>
        <div class="story-stats">
          <div><b>${CAT.products.length}</b><span>${t('statModels')}</span></div>
          <div><b>${CAT.categories.length}</b><span>${t('statCats')}</span></div>
          <div><b>98 %</b><span>${t('statNatural')}</span></div>
        </div>
      </div>
    </section>

    ${contactBand()}`;
  }

  // Výpis produktů s filtry – pro kategorii i pro Akce
  function listing({ crumbs, title, lead, all, groups, groupKey, defaultSort }) {
    let items = all;
    if (filters.group) items = items.filter(p => p[groupKey] === filters.group);
    if (filters.brand) items = items.filter(p => p.brand === filters.brand);
    if (filters.color) items = items.filter(p => p.colors.includes(filters.color));
    if (filters.size) items = items.filter(p => p.sizes.includes(filters.size) && !p.soldOut.includes(filters.size));
    const sort = filters.sort === 'doporucene' ? defaultSort : filters.sort;
    if (sort === 'levne') items = [...items].sort((a, b) => a.price - b.price);
    if (sort === 'drahe') items = [...items].sort((a, b) => b.price - a.price);
    if (sort === 'sleva') items = [...items].sort((a, b) => discount(b) - discount(a));

    const brands = CAT.brands.filter(b => all.some(p => p.brand === b.id));
    const colors = CAT.colors.filter(c => all.some(p => p.colors.includes(c.id)));
    const order = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', ...Object.values(SIZE_PRESETS).flat()];
    const rank = s => (order.indexOf(s) + 1) || 999;
    const sizes = [...new Set(all.flatMap(p => p.sizes))].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b, 'cs', { numeric: true }));
    const anyFilter = filters.group || filters.brand || filters.color || filters.size;
    const sel = (key, label, allLabel, opts) => opts.length ? `<label class="filter">${label}
      <select data-filter="${key}"><option value="">${allLabel}</option>
        ${opts.map(([v, txt]) => `<option value="${e(v)}" ${filters[key] === v ? 'selected' : ''}>${e(txt)}</option>`).join('')}
      </select></label>` : '';

    return `
    <section class="wrap page-head">
      <div class="breadcrumbs"><a href="#/">${t('home')}</a> / ${crumbs}</div>
      <h1>${title}</h1>
      ${lead ? `<p>${lead}</p>` : ''}
      ${groups.length ? `<div class="type-tabs" role="group" aria-label="${t('type')}">
        <button type="button" class="chip ${!filters.group ? 'active' : ''}" data-set="group" data-value="">${t('all')}</button>
        ${groups.map(g => `<button type="button" class="chip ${filters.group === g.id ? 'active' : ''}" data-set="group" data-value="${g.id}">${e(L(g.name))}</button>`).join('')}
      </div>` : ''}
    </section>
    <section class="wrap">
      ${all.length ? `<div class="toolbar">
        <div class="toolbar-filters">
          ${sel('brand', t('brand'), t('allBrands'), brands.map(b => [b.id, b.name]))}
          ${sel('color', t('color'), t('allColors'), colors.map(c => [c.id, L(c.name)]))}
          ${sizes.length > 1 ? `<span class="filter-label">${t('size')}:</span>
            <button type="button" class="chip ${!filters.size ? 'active' : ''}" data-set="size" data-value="">${t('all')}</button>
            ${sizes.map(s => `<button type="button" class="chip ${filters.size === s ? 'active' : ''}" data-set="size" data-value="${e(s)}">${e(s)}</button>`).join('')}` : ''}
        </div>
        <div class="toolbar-right">
          <span>${count(items.length)}</span>
          <label>${t('sort')}
            <select data-filter="sort">
              ${[['doporucene', t('sortDefault')], ['levne', t('sortCheap')], ['drahe', t('sortExpensive')], ['sleva', t('sortSale')]]
                .map(([v, txt]) => `<option value="${v}" ${filters.sort === v ? 'selected' : ''}>${txt}</option>`).join('')}
            </select>
          </label>
        </div>
      </div>` : ''}
      ${items.length
        ? `<div class="grid">${items.map(cardHTML).join('')}</div>`
        : `<div class="empty"><h2>${t('nothingFound')}</h2>
           <p>${all.length ? t('nothingFilter') : (groupKey === 'cat' ? t('saleEmpty') : t('emptyCategory'))}</p>
           ${anyFilter ? `<button type="button" class="btn" data-clear-filters>${t('clearFilters')}</button>` : ''}</div>`}
    </section>
    <div style="height:64px"></div>`;
  }

  function pageCategory(id) {
    const c = catById[id];
    if (!c) return pageNotFound();
    const all = CAT.products.filter(p => p.cat === id);
    return listing({
      crumbs: e(L(c.name)),
      title: e(L(c.title) || L(c.name)),
      lead: e(L(c.lead)),
      all,
      groups: CAT.types.filter(ty => ty.cat === id && all.some(p => p.type === ty.id)),
      groupKey: 'type',
      defaultSort: 'doporucene',
    });
  }

  function pageSale() {
    const all = CAT.products.filter(onSale);
    return listing({
      crumbs: t('sale'),
      title: t('saleTitle'),
      lead: t('saleLead'),
      all,
      groups: CAT.categories.filter(c => all.some(p => p.cat === c.id)),
      groupKey: 'cat',
      defaultSort: 'sleva',
    });
  }

  function pageProduct(id) {
    const p = byId[id];
    if (!p) return pageNotFound();
    const c = catById[p.cat] || { name: {}, bg: '#f3e4de' };
    const ty = typeById[p.type];
    const brand = brandById[p.brand];
    const cs = colorsOf(p);
    const chart = p.sizeChart || c.sizeChart;
    const related = CAT.products.filter(x => x.cat === p.cat && x.id !== p.id).slice(0, 4);
    const name = L(p.name);
    return `
    <div class="wrap">
      <div class="pdp">
        <div class="pdp-media ${p.image ? 'has-photo' : ''}" style="--bg:${c.bg}">${visual(p)}</div>
        <div class="pdp-info">
          <div class="breadcrumbs"><a href="#/">${t('home')}</a> / <a href="#/kategorie/${p.cat}">${e(L(c.name))}</a>${ty ? ` / <a href="#/kategorie/${p.cat}" data-goto-type="${ty.id}">${e(L(ty.name))}</a>` : ''}</div>
          ${L(p.tag) ? `<div class="eyebrow" style="margin:0">${e(L(p.tag))}</div>` : ''}
          ${brand ? `<div class="pdp-brand">${e(brand.name)}</div>` : ''}
          <h1>${e(name)}</h1>
          ${priceHTML(p)}
          ${L(p.desc) ? `<p class="desc">${e(L(p.desc))}</p>` : ''}

          ${cs.length ? `<div class="field-label"><span>${cs.length > 1 ? t('colors') : t('color')}</span></div>
          <div class="color-list">${cs.map(col => `<span class="color-item"><span class="swatch swatch-lg${col.id === 'mix' ? ' mix' : ''}" style="background:${col.hex}"></span>${e(L(col.name))}</span>`).join('')}</div>` : ''}
          ${p.colors.includes('mix') && L(p.mixColors) ? `<p class="mix-note" data-testid="mix-colors-note"><b>${t('mixColors')}:</b> ${e(L(p.mixColors))}</p>` : ''}

          <div class="field-label"><span>${t('sizes')}</span>${chart ? `<a href="#/velikosti" class="link">${t('sizeTable')}</a>` : ''}</div>
          ${sizesHTML(p, 'sizes-lg')}
          ${p.soldOut.length ? `<p class="size-note">${t('soldOutNote')}</p>` : ''}

          <div class="contact-box">
            <b>${t('interested')}</b>
            <p>${t('interestedText', { name: e(name) })}</p>
            <a href="${TEL}" class="btn btn-block btn-lg">${phoneIcon()} ${t('call')} ${CONTACT_PHONE}</a>
            <p class="shipping-note" data-testid="shipping-note">${t('shippingNote')}</p>
          </div>

          <div class="details">
            ${L(p.material) ? `<details open><summary>${t('materialCare')}</summary>
              <p>${e(L(p.material))}</p><p>${t('careText')}</p>
            </details>` : ''}
            ${chart ? `<details><summary>${t('sizeDims')}</summary>${sizeTable(chart)}</details>` : ''}
          </div>
        </div>
      </div>

      ${related.length ? `<section class="section" style="padding-top:0">
        <div class="section-head"><h2>${t('related')}</h2></div>
        <div class="grid">${related.map(cardHTML).join('')}</div>
      </section>` : ''}
    </div>`;
  }

  function pageSizes() {
    return `<div class="wrap page-head">
      <div class="breadcrumbs"><a href="#/">${t('home')}</a> / ${t('sizeTable')}</div>
      <h1>${t('sizeTable')}</h1>
      <p>${t('sizeTableLead', { phone: phoneLink })}</p>
    </div>
    <div class="wrap" style="display:grid;gap:20px;padding-bottom:64px">
      ${['damske', 'panske', 'podprsenky', 'detske'].map(ch => `<div class="fieldset"><h3>${t('chartTitles')[ch]}</h3>${sizeTable(ch)}</div>`).join('')}
    </div>`;
  }

  function pageNotFound() {
    return `<div class="wrap empty"><h2>${t('notFound')}</h2><p>${t('notFoundText')}</p><a href="#/" class="btn">${t('toHome')}</a></div>`;
  }

  /* ---------- Router ---------- */

  function resetFilters(scope) {
    if (filterScope === scope) return;
    filterScope = scope;
    Object.assign(filters, { group: '', brand: '', color: '', size: '', sort: 'doporucene' });
  }

  function render(keepScroll) {
    const y = window.scrollY;
    const parts = location.hash.replace(/^#\/?/, '').split('/');
    let html, nav = null, title = t('htmlTitle');
    switch (parts[0]) {
      case '': html = pageHome(); break;
      case 'kategorie':
        resetFilters('cat:' + parts[1]);
        html = pageCategory(parts[1]); nav = parts[1];
        if (catById[parts[1]]) title = L(catById[parts[1]].title) || L(catById[parts[1]].name);
        break;
      case 'akce':
        resetFilters('akce');
        html = pageSale(); nav = 'akce'; title = t('saleTitle');
        break;
      case 'produkt':
        html = pageProduct(parts[1]);
        if (byId[parts[1]]) { nav = byId[parts[1]].cat; title = L(byId[parts[1]].name); }
        break;
      case 'velikosti': html = pageSizes(); title = t('sizeTable'); break;
      default: html = pageNotFound();
    }
    app.innerHTML = html;
    document.title = parts[0] ? `${title} | followme` : title;
    document.querySelectorAll('[data-nav]').forEach(a => a.classList.toggle('active', a.dataset.nav === nav));
    window.scrollTo(0, keepScroll ? y : 0);
  }

  /* ---------- Události ---------- */

  document.addEventListener('click', ev => {
    const set = ev.target.closest('[data-set]');
    if (set) { filters[set.dataset.set] = set.dataset.value; render(true); return; }
    if (ev.target.closest('[data-clear-filters]')) {
      Object.assign(filters, { group: '', brand: '', color: '', size: '' });
      render(true);
      return;
    }
    const goto = ev.target.closest('[data-goto-type]');
    if (goto) { filterScope = 'cat:' + goto.getAttribute('href').split('/')[2]; filters.group = goto.dataset.gotoType; }
    const lang = ev.target.closest('[data-lang]');
    if (lang) { setLang(lang.dataset.lang); renderChrome(); render(true); }
  });

  document.addEventListener('change', ev => {
    const f = ev.target.closest('[data-filter]');
    if (f) { filters[f.dataset.filter] = f.value; render(true); }
  });

  window.addEventListener('hashchange', () => render(false));
  loadCatalog().then(ok => { if (ok) { renderChrome(); render(false); } });
})();
