// Pevná nastavení galerie followme. Kategorie, typy, značky, barvy a produkty
// se spravují v administraci (ukládají se do data/catalog.json).

var CONTACT_PHONE = '773 378 988';
var CONTACT_EMAIL = 'followmeben86@gmail.com';

// Prodejna (otevírací doba je v i18n.js: hoursValue)
var SHOP = {
  name: 'Ben Followme',
  address: 'Libušská 319, 142 00 Praha-Libuš (SAPA)',
  mapEmbed: 'https://maps.google.com/maps?q=Ben%20Followme%2C%20Libu%C5%A1sk%C3%A1%20319%2C%20142%2000%20Praha&z=16&output=embed',
  mapLink: 'https://www.google.com/maps/place/Ben+Followme/@50.0030889,14.47508,17z/data=!4m6!3m5!1s0x470b91c2cb0f07e7:0x5f8faaca52fd790d!8m2!3d50.0030889!4d14.47508',
};

// Provozovatel podle ARES (IČO 87730421). Prázdné údaje se na webu nezobrazí.
// DIČ fyzické osoby obsahuje rodné číslo, proto ho na web nedáváme (patří jen na faktury).
var COMPANY = {
  name: 'Hung Cuong Lé',
  ico: '87730421',
  dic: '',
  seat: 'Leopoldova 2040/30, Chodov, 149 00 Praha 4',
  tradeRegister: true,   // fyzická osoba zapsaná v živnostenském rejstříku
};

// Sazba DPH v %.
var VAT_RATE = 21;
// false = ceny v administraci se zadávají BEZ DPH a cena s DPH se dopočítá (současný stav)
// true  = ceny se zadávají VČETNĚ DPH a dopočítá se cena bez DPH
var PRICES_INCLUDE_VAT = false;

// Rychlé vyplnění velikostí v administraci
var SIZE_PRESETS = {
  damske: ['XS', 'S', 'M', 'L', 'XL'],
  panske: ['S', 'M', 'L', 'XL', 'XXL'],
  podprsenky: ['70B', '75B', '75C', '80B', '80C', '85C', '85D'],
  detske: ['98/104', '110/116', '122/128', '134/140', '146/152'],
};

// Tvary ilustrací, které se zobrazí, když produkt nemá fotku
var ART_TYPES = {
  briefs: 'Kalhotky', highwaist: 'Kalhotky s vysokým pasem', thong: 'Tanga',
  bra: 'Podprsenka', bralette: 'Bralette / sportovní', set: 'Souprava',
  body: 'Body', garter: 'Podvazkový pás', nightgown: 'Noční košile',
  boxers: 'Boxerky', trunks: 'Boxerky krátké', slip: 'Slipy', socks: 'Ponožky',
};

// Tabulky velikostí (texty jsou v i18n.js)
var SIZE_CHARTS = {
  damske: 'Dámská (XS–XL)',
  panske: 'Pánská (S–XXL)',
  podprsenky: 'Podprsenky (70B–85D)',
  detske: 'Dětská (98–152)',
};
