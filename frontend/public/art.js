// Ilustrace produktů (použijí se, když produkt nemá nahranou fotku). Sdílí je galerie i administrace.


// Každý tvar dostane atributy přímo (ne přes <style>), aby se barvy více SVG na stránce nepletly
const strap = (d, w, k) => `<path d="${d}" ${k.so} stroke-width="${w + 2.4}" stroke-linecap="round"/><path d="${d}" ${k.s} stroke-width="${w}" stroke-linecap="round"/>`;
const SHAPES = {
  bra: k => `
    ${strap('M70 100 L79 42', 4, k)}
    ${strap('M130 100 L121 42', 4, k)}
    <rect x="40" y="118" width="120" height="18" rx="7" ${k.f}/>
    <path d="M44 124 C46 92 72 80 99 113 L100 124 Z" ${k.f}/>
    <path d="M156 124 C154 92 128 80 101 113 L100 124 Z" ${k.f}/>
    <path d="M50 116 C56 98 74 92 94 112" ${k.dl} stroke-width="1.6" stroke-dasharray="2 4"/>
    <path d="M150 116 C144 98 126 92 106 112" ${k.dl} stroke-width="1.6" stroke-dasharray="2 4"/>
    <circle cx="100" cy="118" r="3.5" ${k.d}/>`,
  bralette: k => `
    ${strap('M68 106 L82 44', 3, k)}
    ${strap('M132 106 L118 44', 3, k)}
    <path d="M48 124 L76 76 L99 124 Z" ${k.f}/>
    <path d="M152 124 L124 76 L101 124 Z" ${k.f}/>
    <rect x="42" y="120" width="116" height="22" rx="8" ${k.f}/>
    <path d="M46 131 H154" ${k.dl} stroke-width="1.4" stroke-dasharray="3 4"/>`,
  briefs: k => `
    <path d="M38 68 H162 L156 94 C130 102 112 122 108 152 H92 C88 122 70 102 44 94 Z" ${k.f}/>
    <path d="M40 79 H160" ${k.dl} stroke-width="1.6"/>
    <path d="M48 92 C72 100 88 118 93 146" ${k.dl} stroke-width="1.3" stroke-dasharray="2 4"/>
    <path d="M152 92 C128 100 112 118 107 146" ${k.dl} stroke-width="1.3" stroke-dasharray="2 4"/>`,
  highwaist: k => `
    <path d="M44 48 H156 L158 98 C132 106 114 126 109 156 H91 C86 126 68 106 42 98 Z" ${k.f}/>
    <path d="M44 64 H156" ${k.dl} stroke-width="1.6"/>
    <path d="M45 96 C70 104 86 122 92 150" ${k.dl} stroke-width="1.3" stroke-dasharray="2 4"/>
    <path d="M155 96 C130 104 114 122 108 150" ${k.dl} stroke-width="1.3" stroke-dasharray="2 4"/>`,
  boxers: k => `
    <path d="M46 56 H154 L164 150 L112 154 L100 106 L88 154 L36 150 Z" ${k.f}/>
    <rect x="46" y="54" width="108" height="16" rx="3" ${k.d} opacity=".55"/>
    <path d="M100 72 V104" ${k.dl} stroke-width="1.4" stroke-dasharray="3 3"/>
    <path d="M40 140 L86 144 M160 140 L114 144" ${k.dl} stroke-width="1.4"/>`,
  trunks: k => `
    <path d="M46 62 H154 L158 132 L114 138 L100 110 L86 138 L42 132 Z" ${k.f}/>
    <rect x="46" y="60" width="108" height="16" rx="3" ${k.d} opacity=".55"/>
    <path d="M100 78 C92 90 92 100 100 108" ${k.dl} stroke-width="1.4"/>
    <path d="M45 124 L84 129 M155 124 L116 129" ${k.dl} stroke-width="1.4"/>`,
  slip: k => `
    <path d="M42 64 H158 L154 92 C128 100 112 120 110 144 H90 C88 120 72 100 46 92 Z" ${k.f}/>
    <rect x="42" y="62" width="116" height="14" rx="3" ${k.d} opacity=".55"/>
    <path d="M100 80 C92 92 93 104 100 114" ${k.dl} stroke-width="1.4"/>`,
  thong: k => `
    <path d="M38 70 H162 L150 84 C126 92 108 112 103 150 H97 C92 112 74 92 50 84 Z" ${k.f}/>
    <path d="M42 74 Q48 80 54 74 Q60 80 66 74 Q72 80 78 74 Q84 80 90 74 Q96 80 102 74 Q108 80 114 74 Q120 80 126 74 Q132 80 138 74 Q144 80 150 74 Q156 80 158 74" ${k.dl} stroke-width="1.3"/>
    <path d="M100 92 C96 104 98 118 100 140" ${k.dl} stroke-width="1.2" stroke-dasharray="2 4"/>`,
  garter: k => `
    ${strap('M58 100 L56 156', 2.5, k)}
    ${strap('M84 98 L83 160', 2.5, k)}
    ${strap('M142 100 L144 156', 2.5, k)}
    ${strap('M116 98 L117 160', 2.5, k)}
    <path d="M38 62 H162 L156 104 C128 96 72 96 44 104 Z" ${k.f}/>
    <path d="M42 70 H158" ${k.dl} stroke-width="1.4" stroke-dasharray="3 4"/>
    <path d="M46 98 Q52 92 58 98 Q64 92 70 98 Q76 92 82 97 M118 97 Q124 92 130 98 Q136 92 142 98 Q148 92 154 98" ${k.dl} stroke-width="1.3"/>
    ${[56, 83, 117, 144].map(x => `<rect x="${x - 4}" y="154" width="8" height="8" rx="2" ${k.d}/>`).join('')}`,
  body: k => `
    <g transform="translate(0,-6)">
      ${strap('M64 70 L76 26', 3, k)}
      ${strap('M136 70 L124 26', 3, k)}
      <path d="M54 66 C62 86 88 94 100 92 C112 94 138 86 146 66 C142 98 142 120 150 142 C128 146 112 160 108 176 H92 C88 160 72 146 50 142 C58 120 58 98 54 66 Z" ${k.f}/>
      <path d="M58 72 C66 90 90 98 100 96 C110 98 134 90 142 72" ${k.dl} stroke-width="1.4" stroke-dasharray="2 4"/>
      <path d="M100 96 V150" ${k.dl} stroke-width="1.2"/>
      <path d="M56 140 C76 144 90 156 93 172 M144 140 C124 144 110 156 107 172" ${k.dl} stroke-width="1.3" stroke-dasharray="2 4"/>
    </g>`,
  set: k => `
    <g transform="translate(40,-14) scale(.6)">${SHAPES.bra(k)}</g>
    <g transform="translate(40,62) scale(.6)">${SHAPES.thong(k)}</g>`,
  nightgown: k => `
    <g transform="translate(0,-6)">
      ${strap('M80 54 L86 20', 2.5, k)}
      ${strap('M120 54 L114 20', 2.5, k)}
      <path d="M70 52 C82 64 118 64 130 52 L134 92 C138 120 150 148 160 170 C120 178 80 178 40 170 C50 148 62 120 66 92 Z" ${k.f}/>
      <path d="M72 58 C84 70 116 70 128 58" ${k.dl} stroke-width="1.4" stroke-dasharray="2 4"/>
      <path d="M68 90 C88 96 112 96 132 90" ${k.dl} stroke-width="1.2"/>
      <path d="M44 166 Q50 172 56 167 Q62 173 68 168 Q74 174 80 169 Q86 175 92 170 Q98 176 104 170 Q110 175 116 169 Q122 174 128 168 Q134 173 140 167 Q146 172 152 166" ${k.dl} stroke-width="1.3"/>
    </g>`,
  socks: k => {
    const sock = (x, y) => `
      <path d="M${x} ${y} H${x + 30} V${y + 78} C${x + 30} ${y + 98} ${x + 22} ${y + 108} ${x + 6} ${y + 110} H${x - 22} C${x - 34} ${y + 110} ${x - 36} ${y + 96} ${x - 24} ${y + 90} L${x} ${y + 78} Z" ${k.f}/>
      <rect x="${x}" y="${y}" width="30" height="18" rx="2" ${k.d} opacity=".5"/>
      ${[6, 12, 18, 24].map(o => `<path d="M${x + o} ${y + 2} V${y + 16}" ${k.dl} stroke-width="1.1"/>`).join('')}
      <path d="M${x - 24} ${y + 104} C${x - 18} ${y + 96} ${x - 8} ${y + 96} ${x - 2} ${y + 104}" ${k.dl} stroke-width="1.2" stroke-dasharray="2 3"/>`;
    return sock(70, 34) + sock(120, 46);
  },
};

// Tmavé barvy dostanou světlé obrysy, aby byly vidět detaily
function isDark(hex) {
  const n = parseInt(String(hex).slice(1), 16);
  const [r, g, b] = [n >> 16 & 255, n >> 8 & 255, n & 255];
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.45;
}

function art(type, hex, label) {
  hex = /^#[0-9a-f]{6}$/i.test(hex || '') ? hex : '#d9d4d0';
  const dark = isDark(hex);
  const stroke = dark ? 'rgba(255,255,255,.4)' : 'rgba(43,42,46,.45)';
  const detail = dark ? 'rgba(255,255,255,.45)' : 'rgba(43,42,46,.35)';
  const k = {
    f: `fill="${hex}" stroke="${stroke}" stroke-width="1.4" stroke-linejoin="round"`,
    s: `fill="none" stroke="${hex}"`,
    so: `fill="none" stroke="${stroke}"`,
    d: `fill="${detail}"`,
    dl: `fill="none" stroke="${detail}"`,
  };
  return `<svg viewBox="0 0 200 200" role="img" aria-label="${label || ''}">
    <ellipse cx="100" cy="170" rx="58" ry="6" fill="rgba(43,42,46,.07)"/>
    ${(SHAPES[type] || SHAPES.briefs)(k)}
  </svg>`;
}

function escapeHTML(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

// Fotka produktu, nebo ilustrace podle tvaru a (první) barvy
function productVisual(p, hex, label) {
  if (p.image) return `<img src="${escapeHTML(p.image)}" alt="${escapeHTML(label)}" loading="lazy">`;
  return art(p.art, hex, escapeHTML(label));
}
