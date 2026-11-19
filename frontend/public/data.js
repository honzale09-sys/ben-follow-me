// Pevná nastavení galerie followme. Kategorie, typy, značky, barvy a produkty
// se spravují v administraci (ukládají se do data/catalog.json).

const CONTACT_PHONE = '773 378 988';

// Rychlé vyplnění velikostí v administraci
const SIZE_PRESETS = {
  damske: ['XS', 'S', 'M', 'L', 'XL'],
  panske: ['S', 'M', 'L', 'XL', 'XXL'],
  podprsenky: ['70B', '75B', '75C', '80B', '80C', '85C', '85D'],
  detske: ['98/104', '110/116', '122/128', '134/140', '146/152'],
};

// Tvary ilustrací, které se zobrazí, když produkt nemá fotku
const ART_TYPES = {
  briefs: 'Kalhotky', highwaist: 'Kalhotky s vysokým pasem', thong: 'Tanga',
  bra: 'Podprsenka', bralette: 'Bralette / sportovní', set: 'Souprava',
  body: 'Body', garter: 'Podvazkový pás', nightgown: 'Noční košile',
  boxers: 'Boxerky', trunks: 'Boxerky krátké', slip: 'Slipy', socks: 'Ponožky',
};

// Tabulky velikostí (texty jsou v i18n.js)
const SIZE_CHARTS = {
  damske: 'Dámská (XS–XL)',
  panske: 'Pánská (S–XXL)',
  podprsenky: 'Podprsenky (70B–85D)',
  detske: 'Dětská (98–152)',
};
