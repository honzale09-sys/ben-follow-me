// Texty webu v češtině a vietnamštině. Texty produktů a kategorií se zadávají v administraci.

const I18N = {
  cs: {
    htmlTitle: 'followme – spodní prádlo a podprsenky',
    callSeller: 'Zavolat prodejci',
    call: 'Zavolat',
    mixColors: 'Barvy v mixu', pack: 'V balení', pcs: 'ks',
    shippingNote: 'Zajišťujeme i dopravu: 150 Kč za 1 krabici do 30 kg.',
    sale: 'Akce',
    saleUpTo: 'Akce až −{n} %',
    saleTitle: 'Akce a slevy',
    saleLead: 'Všechny kousky, které teď máme ve slevě, na jednom místě.',
    saleEmpty: 'Momentálně nemáme nic ve slevě. Zkuste se podívat později.',
    saleHome: 'Akce a slevy',
    saleHomeLead: 'Vybrané kousky za nižší ceny.',
    allSale: 'Zobrazit všechny akce',
    home: 'Úvod',
    eyebrow: 'Nová kolekce · podzim 2026',
    heroTitle: 'Pohodlí, které nosíte <em>nejblíž</em> k tělu',
    heroLead: 'Spodní prádlo pro ženy, muže i děti, podprsenky a noční košile. Prohlédněte si kolekci a o kousek, který se vám líbí, si řekněte telefonicky.',
    browseCats: 'Prohlédněte si kategorie',
    favourites: 'Oblíbené kousky',
    favouritesLead: 'Výběr toho nejoblíbenějšího z naší kolekce.',
    howTitle: 'Jak to u nás funguje',
    step1: 'Prohlédněte si kolekci', step1t: 'U každého kousku najdete cenu, materiál a velikosti.',
    step2: 'Najděte svou velikost', step2t: 'Pomůže vám naše <a href="#/velikosti" class="link-inline">tabulka velikostí</a>.',
    step3: 'Zavolejte prodejci', step3t: 'Na čísle {phone} se domluvíte na dostupnosti a předání.',
    storyEyebrow: 'O followme',
    storyTitle: 'Méně kousků, <em>lepší</em> materiály',
    storyText: 'Navrhujeme prádlo, které vydrží. Vybíráme certifikovanou bavlnu, modal, bambus i merino a šijeme v menších sériích. Proto u nás najdete méně modelů – ale každý z nich má svůj důvod.',
    statModels: 'pečlivě vybraných modelů',
    statCats: 'kategorií pro ženy, muže i děti',
    statNatural: 'přírodních vláken v bavlněné řadě',
    contactTitle: 'Zaujal vás některý kousek?',
    contactText: 'Na webu se neobjednává. Zavolejte prodejci, rád vám poradí s velikostí a domluví se s vámi na předání.',
    products: n => n === 1 ? 'produkt' : n >= 2 && n <= 4 ? 'produkty' : 'produktů',
    all: 'Vše',
    type: 'Typ',
    brand: 'Značka',
    color: 'Barva',
    colors: 'Barvy',
    size: 'Velikost',
    sizes: 'Velikosti',
    allBrands: 'Všechny značky',
    allColors: 'Všechny barvy',
    sort: 'Řadit',
    sortDefault: 'Doporučené', sortCheap: 'Od nejlevnějšího', sortExpensive: 'Od nejdražšího', sortSale: 'Ve slevě',
    nothingFound: 'Nic jsme nenašli',
    nothingFilter: 'Tomuto výběru teď nic neodpovídá.',
    emptyCategory: 'V této kategorii zatím nejsou žádné produkty. Brzy je doplníme.',
    clearFilters: 'Zrušit filtry',
    detail: 'Zobrazit detail →',
    soldOutNote: 'Přeškrtnuté velikosti momentálně nejsou k dispozici.',
    unavailable: 'Momentálně nedostupné',
    interested: 'Máte o tento kousek zájem?',
    interestedText: 'Na webu se neobjednává. Zavolejte prodejci a řekněte mu název produktu – <i>{name}</i>.',
    materialCare: 'Materiál a péče',
    careText: 'Perte na 30 °C v síťce na prádlo, nesušte v sušičce, nežehlete.',
    sizeDims: 'Rozměry velikostí',
    sizeTable: 'Tabulka velikostí',
    sizeTableLead: 'Změřte se měkkým krejčovským metrem přímo na těle. Pokud jste mezi dvěma velikostmi, doporučujeme tu větší. S výběrem vám rád poradí i prodejce na čísle {phone}.',
    related: 'Mohlo by se vám líbit',
    notFound: 'Stránka nenalezena', notFoundText: 'Tuto stránku jsme nenašli.', toHome: 'Na úvod',
    loadError: 'Produkty se nepodařilo načíst', loadErrorText: 'Zkuste stránku obnovit. Pokud problém trvá, zavolejte nám na {phone}.',
    footerText: 'Galerie spodního prádla, ve kterém se cítíte dobře. Na webu se neobjednává – o zboží se domluvíte telefonicky s prodejcem.',
    collection: 'Kolekce', info: 'Informace', sellerContact: 'Kontakt na prodejce',
    chartTitles: { damske: 'Dámské prádlo a noční košile', panske: 'Pánské boxerky a slipy', podprsenky: 'Podprsenky', detske: 'Dětské prádlo' },
    th: { size: 'Velikost', waist: 'Obvod pasu', hips: 'Obvod boků', under: 'Obvod pod prsy', bust: 'Obvod přes prsa', height: 'Výška dítěte', age: 'Věk' },
    years: 'let', yearsFew: 'roky',
    braletteNote: 'Bralette a sportovní podprsenky: XS (pod prsy 63–67 cm), S (68–72), M (73–77), L (78–82), XL (83–87).',
  },
  vi: {
    htmlTitle: 'followme – đồ lót và áo ngực',
    callSeller: 'Gọi người bán',
    call: 'Gọi',
    mixColors: 'Các màu trong mix', pack: 'Số lượng trong gói', pcs: 'chiếc',
    shippingNote: 'Chúng tôi có vận chuyển: 150 Kč 1 thùng 30 kg.',
    sale: 'Khuyến mãi',
    saleUpTo: 'Giảm đến {n}%',
    saleTitle: 'Khuyến mãi và giảm giá',
    saleLead: 'Tất cả sản phẩm đang giảm giá, tập trung ở một nơi.',
    saleEmpty: 'Hiện chưa có sản phẩm giảm giá. Hãy quay lại sau nhé.',
    saleHome: 'Khuyến mãi',
    saleHomeLead: 'Những món được chọn với giá ưu đãi.',
    allSale: 'Xem tất cả khuyến mãi',
    home: 'Trang chủ',
    eyebrow: 'Bộ sưu tập mới · thu 2026',
    heroTitle: 'Sự thoải mái bạn mặc <em>gần</em> cơ thể nhất',
    heroLead: 'Đồ lót cho nữ, nam và trẻ em, áo ngực và váy ngủ. Hãy xem bộ sưu tập và gọi điện cho chúng tôi khi bạn thích một món nào đó.',
    browseCats: 'Danh mục sản phẩm',
    favourites: 'Sản phẩm được yêu thích',
    favouritesLead: 'Những món được yêu thích nhất trong bộ sưu tập.',
    howTitle: 'Cách mua hàng',
    step1: 'Xem bộ sưu tập', step1t: 'Mỗi sản phẩm đều có giá, chất liệu và kích cỡ.',
    step2: 'Chọn kích cỡ phù hợp', step2t: 'Tham khảo <a href="#/velikosti" class="link-inline">bảng kích cỡ</a> của chúng tôi.',
    step3: 'Gọi cho người bán', step3t: 'Gọi số {phone} để hỏi hàng và hẹn nhận hàng.',
    storyEyebrow: 'Về followme',
    storyTitle: 'Ít mẫu hơn, chất liệu <em>tốt</em> hơn',
    storyText: 'Chúng tôi làm đồ lót bền lâu. Chọn cotton có chứng nhận, modal, sợi tre và len merino, may theo lô nhỏ. Vì vậy chúng tôi có ít mẫu hơn – nhưng mẫu nào cũng có lý do của nó.',
    statModels: 'mẫu được chọn lọc kỹ',
    statCats: 'danh mục cho nữ, nam và trẻ em',
    statNatural: 'sợi tự nhiên trong dòng cotton',
    contactTitle: 'Bạn thích món nào?',
    contactText: 'Trang web không nhận đặt hàng. Hãy gọi cho người bán – họ sẽ tư vấn kích cỡ và hẹn giao nhận với bạn.',
    products: () => 'sản phẩm',
    all: 'Tất cả',
    type: 'Loại',
    brand: 'Thương hiệu',
    color: 'Màu',
    colors: 'Màu sắc',
    size: 'Kích cỡ',
    sizes: 'Kích cỡ',
    allBrands: 'Tất cả thương hiệu',
    allColors: 'Tất cả màu',
    sort: 'Sắp xếp',
    sortDefault: 'Đề xuất', sortCheap: 'Giá thấp đến cao', sortExpensive: 'Giá cao đến thấp', sortSale: 'Đang giảm giá',
    nothingFound: 'Không tìm thấy sản phẩm',
    nothingFilter: 'Không có sản phẩm phù hợp với lựa chọn này.',
    emptyCategory: 'Danh mục này chưa có sản phẩm. Chúng tôi sẽ sớm bổ sung.',
    clearFilters: 'Xóa bộ lọc',
    detail: 'Xem chi tiết →',
    soldOutNote: 'Kích cỡ bị gạch hiện tạm hết hàng.',
    unavailable: 'Tạm hết hàng',
    interested: 'Bạn quan tâm đến sản phẩm này?',
    interestedText: 'Trang web không nhận đặt hàng. Hãy gọi cho người bán và cho biết tên sản phẩm – <i>{name}</i>.',
    materialCare: 'Chất liệu và bảo quản',
    careText: 'Giặt ở 30 °C trong túi giặt, không sấy máy, không là (ủi).',
    sizeDims: 'Số đo theo kích cỡ',
    sizeTable: 'Bảng kích cỡ',
    sizeTableLead: 'Đo trực tiếp trên cơ thể bằng thước dây mềm. Nếu bạn nằm giữa hai cỡ, nên chọn cỡ lớn hơn. Người bán cũng sẵn sàng tư vấn qua số {phone}.',
    related: 'Có thể bạn cũng thích',
    notFound: 'Không tìm thấy trang', notFoundText: 'Chúng tôi không tìm thấy trang này.', toHome: 'Về trang chủ',
    loadError: 'Không tải được sản phẩm', loadErrorText: 'Hãy thử tải lại trang. Nếu vẫn lỗi, gọi cho chúng tôi theo số {phone}.',
    footerText: 'Bộ sưu tập đồ lót giúp bạn luôn thấy thoải mái. Trang web không nhận đặt hàng – hãy gọi điện cho người bán.',
    collection: 'Bộ sưu tập', info: 'Thông tin', sellerContact: 'Liên hệ người bán',
    chartTitles: { damske: 'Đồ lót nữ và váy ngủ', panske: 'Quần boxer và quần sịp nam', podprsenky: 'Áo ngực', detske: 'Đồ lót trẻ em' },
    th: { size: 'Kích cỡ', waist: 'Vòng eo', hips: 'Vòng hông', under: 'Vòng chân ngực', bust: 'Vòng ngực', height: 'Chiều cao của bé', age: 'Tuổi' },
    years: 'tuổi', yearsFew: 'tuổi',
    braletteNote: 'Áo bralette và áo ngực thể thao: XS (chân ngực 63–67 cm), S (68–72), M (73–77), L (78–82), XL (83–87).',
  },
};

const LANG_KEY = 'followme-lang';
var LANG = 'cs';
try { if (localStorage.getItem(LANG_KEY) === 'vi') LANG = 'vi'; } catch (err) { /* bez úložiště zůstane čeština */ }

function setLang(lang) {
  LANG = lang === 'vi' ? 'vi' : 'cs';
  try { localStorage.setItem(LANG_KEY, LANG); } catch (err) { /* nic */ }
}

// Text rozhraní; {phone} a {name} se doplní
function t(key, vars) {
  let s = I18N[LANG][key] ?? I18N.cs[key] ?? key;
  if (typeof s === 'string' && vars) s = s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m);
  return s;
}

// Text z administrace ve zvoleném jazyce, s náhradou češtinou
function L(obj) {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  return (LANG === 'vi' && obj.vi) ? obj.vi : (obj.cs || '');
}

function sizeTable(chart) {
  const th = t('th');
  const table = (head, rows) => `<div class="table-scroll"><table class="sizes-table">
    <tr>${head.map(h => `<th>${h}</th>`).join('')}</tr>
    ${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}
  </table></div>`;
  if (chart === 'podprsenky') {
    return table([th.size, th.under, th.bust], [
      ['70B', '68–72 cm', '84–86 cm'], ['75B', '73–77 cm', '89–91 cm'], ['75C', '73–77 cm', '91–93 cm'],
      ['80B', '78–82 cm', '94–96 cm'], ['80C', '78–82 cm', '96–98 cm'], ['85C', '83–87 cm', '101–103 cm'],
      ['85D', '83–87 cm', '103–105 cm'],
    ]) + `<p style="margin-top:10px">${t('braletteNote')}</p>`;
  }
  if (chart === 'panske') {
    return table([th.size, th.waist, th.hips], [
      ['S', '76–81 cm', '90–95 cm'], ['M', '82–87 cm', '96–101 cm'], ['L', '88–94 cm', '102–107 cm'],
      ['XL', '95–101 cm', '108–113 cm'], ['XXL', '102–108 cm', '114–119 cm'],
    ]);
  }
  if (chart === 'detske') {
    const y = (a, b) => `${a}–${b} ${b <= 4 ? t('yearsFew') : t('years')}`;
    return table([th.size, th.height, th.age], [
      ['98/104', '93–104 cm', y(3, 4)], ['110/116', '105–116 cm', y(5, 6)], ['122/128', '117–128 cm', y(7, 8)],
      ['134/140', '129–140 cm', y(9, 10)], ['146/152', '141–152 cm', y(11, 12)],
    ]);
  }
  return table([th.size, th.waist, th.hips], [
    ['XS', '60–64 cm', '84–88 cm'], ['S', '65–69 cm', '89–93 cm'], ['M', '70–74 cm', '94–98 cm'],
    ['L', '75–80 cm', '99–104 cm'], ['XL', '81–86 cm', '105–110 cm'],
  ]);
}
