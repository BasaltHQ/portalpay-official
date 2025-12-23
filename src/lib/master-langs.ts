import type { RegionKey } from "./region-langs";

// Master language list (flat) copied from the selector in page.tsx.
// Items include group headers followed by languages.
export const GROUPS = [
  "AFRICA - West",
  "AFRICA - East",
  "AFRICA - Central & Southern",
  "AFRICA - North",
  "ASIA - South",
  "ASIA - Southeast",
  "ASIA - East",
  "ASIA - Central & North",
  "MIDDLE EAST & WESTERN ASIA",
  "EUROPE - Western & Northern",
  "EUROPE - Eastern & Central",
  "EUROPE - Minority & Other",
  "AMERICAS - North",
  "AMERICAS - Central & South",
  "OCEANIA",
  "OTHER/UNCLASSIFIED",
  "CONSTRUCTED & FICTIONAL LANGUAGES",
] as const;

export const MASTER_LANGS_FLAT: string[] = [
  // AFRICA - West
  "AFRICA - West",
  "Akan","Bambara","Berom","Efik","Esan","Fula","Fulah (Fulfulde)","Hausa","Idoma","Igbo","Itsekiri","Ijaw","Nupe","Pidgin English (Nigerian Pidgin)","Urhobo","Yoruba",
  // AFRICA - East
  "AFRICA - East",
  "Amharic","Chichewa","Ganda","Kikuyu","Kinyarwanda","Maasai","Somali","Swahili","Tigrinya",
  // AFRICA - Central & Southern
  "AFRICA - Central & Southern",
  "Bemba","Herero","Kanembu","Kanuri","Kongo","Kpelle","Kuanyama","Ndonga","Rundi","Sandawe","Sango","Sesotho","Setswana","Shona","Swati","Tsonga","Tswana","Tumbuka","Venda","Wolaytta","Wolof","Xhosa","Zulu",
  // AFRICA - North
  "AFRICA - North",
  "Arabic (Algeria)","Arabic (Egypt)","Arabic (Morocco)","Arabic (Sudan)","Berber (Tamazight)",
  // ASIA - South
  "ASIA - South",
  "Assamese","Bengali","Bhojpuri","Dogri","Gujarati","Haryanvi","Hindi","Kannada","Kashmiri","Konkani","Maithili","Malayalam","Manipuri (Meitei)","Marathi","Nagpuri","Nepali","Nepali (Indian)","Odia","Punjabi (Gurmukhi)","Punjabi (Shahmukhi)","Rajasthani","Sanskrit","Santali","Sindhi","Sinhala","Tamil","Telugu","Tulu","Urdu","Urdu (Indian)",
  // ASIA - Southeast
  "ASIA - Southeast",
  "Acehnese","Balinese","Bislama","Cebuano","Filipino","Hiligaynon","Ilocano","Indonesian","Javanese","Minangkabau","Mizo","Pampangan","Pangasinan","Sasak","Sundanese","Tagalog","Tetum","Thai","Vietnamese","Waray",
  // ASIA - East
  "ASIA - East",
  "Ainu","Cantonese (Chinese)","Chinese (Cantonese)","Chinese (Gan)","Chinese (Hakka)","Chinese (Hokkien)","Chinese (Jin)","Chinese (Mandarin)","Chinese (Min)","Chinese (Wu)","Chinese (Xiang)","Japanese","Korean","Mongolian",
  // ASIA - Central & North
  "ASIA - Central & North",
  "Avar","Avestan","Azerbaijani (North)","Azerbaijani (South)","Chechen","Chuvash","Dari","Ingush","Kalmyk","Karakalpak","Karachay-Balkar","Kazakh","Kirghiz","Komi","Kumyk","Kurdish (Kurmanji)","Kurdish (Sorani)","Kurdish (Zazaki)","Kyrgyz","Lao","Pashto","Tajik","Tatar","Turkish","Turkmen","Uighur","Uzbek",
  // MIDDLE EAST & WESTERN ASIA
  "MIDDLE EAST & WESTERN ASIA",
  "Arabic (Gulf)","Arabic (Iraq)","Arabic (Levant)","Arabic (MSA)","Aramaic","Armenian (Eastern)","Armenian (Western)","Hebrew","Ossetian","Persian (Farsi)","Syriac","Phoenician","Old Persian",
  // EUROPE - Western & Northern
  "EUROPE - Western & Northern",
  "Breton","Catalan","Cornish","Danish","Dutch","English","English (Australian)","English (British)","English (Canadian)","English (Indian)","English (Nigerian)","English (US)","Faroese","Flemish","French","French (Belgian)","French (Canadian)","French (Swiss)","Frisian","Friulian","Galician","German","German (Austrian)","German (Swiss)","Icelandic","Irish","Italian","Ladino","Latin","Limburgish","Lombard","Low German","Luxembourgish","Manx","Neapolitan","Norwegian","Norwegian (Bokmål)","Norwegian (Nynorsk)","Occitan","Picard","Plautdietsch","Portuguese (Brazil)","Portuguese (Portugal)","Romansh","Scots","Scottish Gaelic","Sicilian","Spanish","Swedish","Swiss German","Venetian","Walloon","Welsh","Western Frisian",
  // EUROPE - Eastern & Central
  "EUROPE - Eastern & Central",
  "Albanian","Asturian","Belarusian","Bosnian","Bulgarian","Byelorussian","Croatian","Czech","Estonian","Georgian","Greek","Hungarian","Latgalian","Latvian","Lithuanian","Macedonian","Montenegrin","Polish","Romanian","Rusyn","Russian","Serbian","Serbo-Croatian","Slovak","Slovenian","Udmurt","Ukrainian","Upper Sorbian","Võro","Votic","Zaza",
  // EUROPE - Minority & Other
  "EUROPE - Minority & Other",
  "Aragonese","Braj","Crimean Tatar","Greenlandic (Kalaallisut)","Kalaallisut (Greenlandic)","Kashubian","Mirandese","Osage","Quenya (Elvish)","Rhaeto-Romance","Romany","Sardinian","Solresol","Votic",
  // AMERICAS - North
  "AMERICAS - North",
  "Chilcotin","Chipewyan","Inuktitut","Inupiaq","Mohawk","Navajo","Ojibwe","Tlingit",
  // AMERICAS - Central & South
  "AMERICAS - Central & South",
  "Aymara","Guarani","Mapudungun","Mayan (Yucatec)","Quechua","Rapa Nui","Rapanui","Sranan Tongo","Zapotec",
  // OCEANIA
  "OCEANIA",
  "Bislama","Fijian","Maori","Marshallese","Niuean","Samoan","Tahitian","Tetum","Tongan",
  // OTHER/UNCLASSIFIED
  "OTHER/UNCLASSIFIED",
  "Angas (Ngas)","Carolinian","Chamorro","Ebira","Fon","Glosa","Hawaiian","Ido","Iban","Isoko","Jju","Jukun","Kawi","Kutenai","Lojban","Manchu","Minionese (Despicable Me)","Mende","Mossi","Nama","Nogai","North Frisian","Novial","Nyanja","Old Church Slavonic","Old English","Old French","Old High German","Old Norse","Old Prussian","Other","Palauan","Pali","Phoenician","Rusyn","Shan","Sotho","Twi",
  // CONSTRUCTED & FICTIONAL LANGUAGES
  "CONSTRUCTED & FICTIONAL LANGUAGES",
  "Al Bhed (Final Fantasy)","Ancient Egyptian","Atlantean (Disney)","Babm","Barsoomian (Martian, Burroughs)","Black Speech (Tolkien)","Brithenig","Cityspeak (Blade Runner)","Clockwork Orange Nadsat","Cockney Rhyming Slang","D'ni (Myst)","Dovahzul (Skyrim)","Dothraki","Enochian","Esperanto","Furbish (Furby)","Gargish (Ultima)","Gnommish (Artemis Fowl)","Goa'uld (Stargate)","Huttese (Star Wars)","Interlingua","Interlingue (Occidental)","Klingon (tlhIngan Hol)","Kobold (D&D)","Kryptonian","Lapine (Watership Down)","Láadan","Lojban","Minionese (Despicable Me)","Na'vi","Newspeak (Orwell)","Old Tongue (Wheel of Time)","Parseltongue (Harry Potter)","Quenya (Elvish)","R'lyehian","Rohirric (Tolkien)","Simlish (The Sims)","Sindarin (Elvish)","Solresol","Star Wars Basic","Syldavian (Tintin)","Tengwar (Tolkien)","Toki Pona","Valyrian (High Valyrian)","Vulcan (Star Trek)",
];

export function regionKeyFromGroup(group: string): (RegionKey | null) {
  // Only return geographic regions; non-geographic groups map to null
  switch (group) {
    case 'OTHER/UNCLASSIFIED':
    case 'CONSTRUCTED & FICTIONAL LANGUAGES':
      return null;
    default:
      return group as any as RegionKey;
  }
}

// Languages by geographic region plus two non-geographic groups
export const LANGS_BY_REGION_OR_GROUP: Record<string, string[]> = (() => {
  const map: Record<string, string[]> = {
    'AMERICAS - North': [],
    'AMERICAS - Central & South': [],
    'EUROPE - Western & Northern': [],
    'EUROPE - Eastern & Central': [],
    'EUROPE - Minority & Other': [],
    'AFRICA - North': [],
    'AFRICA - West': [],
    'AFRICA - East': [],
    'AFRICA - Central & Southern': [],
    'MIDDLE EAST & WESTERN ASIA': [],
    'ASIA - South': [],
    'ASIA - Southeast': [],
    'ASIA - East': [],
    'ASIA - Central & North': [],
    'OCEANIA': [],
    'OTHER/UNCLASSIFIED': [],
    'CONSTRUCTED & FICTIONAL LANGUAGES': [],
  };
  let current: string = '';
  for (const item of MASTER_LANGS_FLAT) {
    if (GROUPS.includes(item as any)) { current = item; continue; }
    const key = current || '';
    if (!key) continue;
    const arr = map[key] || (map[key] = []);
    if (!arr.includes(item)) arr.push(item);
  }
  return map as any;
})();

export function getLanguagesForRegion(regionOrGroup: string): string[] {
  return LANGS_BY_REGION_OR_GROUP[regionOrGroup] || [];
}

function normalizeLabel(input: string): string {
  try {
    return (input || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // strip diacritics
      .replace(/\(.*?\)/g, '') // remove parentheticals
      .replace(/[^a-z0-9]+/gi, ' ')
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase();
  } catch {
    return (input || '').toLowerCase().trim();
  }
}

// Reverse lookup: language -> group name (exact and normalized)
const LANG_TO_GROUP: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  let current = '';
  for (const item of MASTER_LANGS_FLAT) {
    if ((GROUPS as readonly string[]).includes(item as any)) { current = item; continue; }
    const exact = item.trim().toLowerCase();
    const norm = normalizeLabel(item);
    if (current) {
      if (exact && !out[exact]) out[exact] = current;
      if (norm && !out[norm]) out[norm] = current;
    }
  }
  return out;
})();

export function getGroupForLanguage(lang: string): string | null {
  const exact = (lang || '').trim().toLowerCase();
  if (exact && LANG_TO_GROUP[exact]) return LANG_TO_GROUP[exact];
  const norm = normalizeLabel(lang || '');
  return (norm && LANG_TO_GROUP[norm]) ? LANG_TO_GROUP[norm] : null;
}


