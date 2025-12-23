export type RegionKey =
  | "AMERICAS - North" | "AMERICAS - Central & South"
  | "EUROPE - Western & Northern" | "EUROPE - Eastern & Central" | "EUROPE - Minority & Other"
  | "AFRICA - North" | "AFRICA - West" | "AFRICA - East" | "AFRICA - Central & Southern"
  | "MIDDLE EAST & WESTERN ASIA"
  | "ASIA - South" | "ASIA - Southeast" | "ASIA - East" | "ASIA - Central & North"
  | "OCEANIA"
  | "MYSTERIOUS";

export const REGION_LANGS: Record<RegionKey, string[]> = {
  "AMERICAS - North": [
    "English (US)", "English (Canadian)", "French (Canadian)", "Spanish",
    // Native/Indigenous
    "Navajo", "Ojibwe", "Inuktitut", "Inupiaq", "Mohawk", "Tlingit",
    "Chilcotin", "Chipewyan", "Cree", "Dakota", "Lakota", "Mi'kmaq",
    "Blackfoot", "Crow", "Hopi", "Choctaw", "Cherokee", "Yupik",
    "Haida", "Salish", "Tsimshian", "Kutenai"
  ],
  "AMERICAS - Central & South": [
    "Spanish", "Portuguese (Brazil)", "Quechua", "Guarani", "Aymara"
  ],
  "EUROPE - Western & Northern": [
    "English (British)", "French", "German", "Spanish", "Italian", "Dutch", "Swedish", "Norwegian", "Danish"
  ],
  "EUROPE - Eastern & Central": [
    "Polish", "Russian", "Ukrainian", "Romanian", "Greek", "Hungarian", "Czech", "Slovak", "Serbian", "Croatian", "Slovenian"
  ],
  "EUROPE - Minority & Other": [
    "Catalan", "Basque", "Welsh", "Scottish Gaelic", "Breton"
  ],
  "AFRICA - North": [
    "Arabic (Morocco)", "Arabic (Egypt)", "Berber (Tamazight)", "Arabic (MSA)"
  ],
  "AFRICA - West": [
    "Pidgin English (Nigerian Pidgin)", "Yoruba", "Hausa", "Igbo", "Fula"
  ],
  "AFRICA - East": [
    "Swahili", "Amharic", "Somali", "Tigrinya"
  ],
  "AFRICA - Central & Southern": [
    "Zulu", "Xhosa", "Shona", "Sesotho", "Setswana"
  ],
  "MIDDLE EAST & WESTERN ASIA": [
    "Arabic (MSA)", "Hebrew", "Persian (Farsi)", "Turkish", "Kurdish (Sorani)"
  ],
  "ASIA - South": [
    "Hindi", "Bengali", "Urdu", "Tamil", "Telugu", "Kannada", "Malayalam", "Marathi", "Punjabi (Gurmukhi)"
  ],
  "ASIA - Southeast": [
    "Indonesian", "Filipino", "Tagalog", "Vietnamese", "Thai", "Burmese", "Javanese", "Sundanese"
  ],
  "ASIA - East": [
    "Chinese (Mandarin)", "Chinese (Cantonese)", "Japanese", "Korean"
  ],
  "ASIA - Central & North": [
    "Kazakh", "Uzbek", "Tajik", "Turkmen", "Uighur"
  ],
  "OCEANIA": [
    "Maori", "Samoan", "Tongan", "Fijian", "Bislama"
  ],
  "MYSTERIOUS": [
    "Other",
    "Esperanto",
    "Lojban",
    "Toki Pona",
    "Klingon (tlhIngan Hol)",
    "Na'vi",
    "Dothraki",
    "Sindarin (Elvish)",
    "Quenya (Elvish)",
    "Valyrian (High Valyrian)",
    "R'lyehian",
    "Star Wars Basic"
  ],
};


