/* Prancer 3D (the generator): the traits, rolled from the seed. Every chapter of the Purranchise is in here:
     Prancers (Ch 01)     the coat genetics gene for gene (X-linked orange and tortie, dilute, agouti tabbies, silver,
                          white spotting, colourpoints, the rare gold), fur, temperaments, laser eyes, and the Prance
     Prancer Pads (02)    a corner of a Pad as a setting
     Prancer Portraits    the three kinds (domestic, wild, supernatural), the spirits, the wardrobe, eyewear, earrings
     Wild Ride (04)       the twelve wild species and their morphs, and their habitats
     Prancer Post (05)    Heartstrong's paper route as a setting
     and beside them      the Posey Paw and the deep space of the astronaut painting, Prance Trance, the Sphere stage
   roll(R) returns the genes in the shape the avatar (src/avatar.js) reads, plus the names the piece shows. */

const hsl = (h, s, l) => { h = ((h % 360) + 360) % 360; s /= 100; l /= 100; const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return "#" + [f(0), f(8), f(4)].map((x) => Math.round(x * 255).toString(16).padStart(2, "0")).join(""); };
const mix = (a, b, k) => { const p = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)), x = p(a), y = p(b); return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * k).toString(16).padStart(2, "0")).join(""); };
const PIG = { Black: [270, 18, 14], Blue: [222, 32, 56], Chocolate: [16, 45, 30], Lilac: [300, 18, 70], Cinnamon: [18, 62, 44], Fawn: [24, 52, 72], Ginger: [24, 88, 56], Cream: [38, 82, 76] };
const AGR = { Black: [34, 55, 50], Blue: [210, 25, 72], Chocolate: [22, 50, 56], Lilac: [300, 22, 80], Cinnamon: [24, 70, 64], Fawn: [30, 70, 82] };
const EYES = { Green: "#7fe06a", Gold: "#f6c52e", Copper: "#ef7a26", Hazel: "#bcbb46", Blue: "#62bdff", Amber: "#ffb21e", "Pale Green": "#c4f2a0" };
/* Wild Ride's table: weight, coat hsl, pattern, ears, eyes, extras */
const WILD = { Lion: [13, [40, 80, 60], "Plain", "Round", "Amber", { mane: 1 }], Tiger: [13, [24, 92, 54], "Stripes", "Round", "Amber", {}], Cheetah: [11, [42, 85, 62], "Spots", "Small", "Amber", {}],
  Leopard: [11, [38, 85, 58], "Rosettes", "Round", "Green", {}], Jaguar: [8, [34, 82, 56], "Jaguar Rosettes", "Round", "Gold", {}], "Snow Leopard": [7, [205, 18, 84], "Rosettes", "Round", "Pale Green", { pale: 1 }],
  Lynx: [8, [30, 45, 64], "Freckles", "Tufted", "Amber", {}], Caracal: [5, [22, 66, 58], "Plain", "Tall Tufted", "Amber", {}], Serval: [6, [42, 85, 62], "Spots", "Huge", "Amber", {}],
  "Clouded Leopard": [4, [34, 60, 58], "Clouds", "Round", "Amber", {}], Puma: [6, [30, 55, 60], "Plain", "Round", "Gold", {}], Ocelot: [4, [40, 80, 62], "Chain", "Round", "Amber", {}] };
const SPIRIT = { Ghost: [16, { rim: "#bff6ff", eye: "#9ff0ff" }], Nekomata: [14, { rim: "#b48cff", eye: "#f6c52e" }],
  Cosmic: [14, { body: "#1b1240", mark: "#ffffff", rim: "#b48cff", eye: "#ffffff", muz: "#2a1d5c", nose: "#b48cff", pat: "Constellations" }],
  Infernal: [13, { body: "#1c0707", mark: "#ff5a1f", rim: "#ff3b1f", eye: "#ffcf3a", muz: "#2b0a0a", nose: "#ff5a1f", pat: "Embers" }],
  Celestial: [12, { body: "#fbf6ea", mark: "#e8b84a", rim: "#ffe28a", eye: "#7fd3ff", muz: "#ffffff", nose: "#f4a7b9", pat: "Gilded" }],
  Cyber: [12, { body: "url(#chrome)", mark: "#3ff2ff", rim: "#3ff2ff", eye: "#3ff2ff", muz: "#c9d1db", nose: "#3a4250", pat: "Circuits" }],
  Crystal: [10, { body: "#7fe8ff", mark: "#e9fdff", rim: "#c8fbff", eye: "#ff7ad9", muz: "#bff6ff", nose: "#ff7ad9", pat: "Facets" }],
  Shadow: [9, { body: "#050409", mark: null, rim: "#6a3cff", eye: "#fffb8a", muz: "#0b0912", nose: "#1b1530", pat: "Void" }] };
const CLOTH = ["#1d2a44", "#111114", "#7a1c2b", "#2f5d3a", "#d6b25e", "#e9e4d8", "#ff6f61", "#3a7bd5", "#8e5cc7", "#f2a541", "#4ab3a4", "#ff8fb3"];
/* the words that seed each cat's outfit details (where a shirt's flowers fall, a bow tie's colour): never shown. No names this time
   (Yoeshi, 2026-11-07: too many overlaps across the generators); the key keeps the same draws, so every cat is as before */
const FIRST = ["Biscuit", "Mochi", "Pickles", "Noodle", "Waffles", "Tofu", "Nacho", "Dumpling", "Pudding", "Pretzel", "Bean", "Olive", "Clementine", "Juniper", "Pepper", "Miso", "Toast", "Bagel",
  "Churro", "Latte", "Pistachio", "Sprout", "Bramble", "Comet", "Nova", "Orbit", "Kiwi", "Mango", "Pixel", "Ziggy", "Bowie", "Luna", "Ripley", "Sushi", "Chai", "Rocket", "Marble", "Fig"];
const LAST = ["Whisker", "Purr", "Paw", "Tuna", "Mitten", "Toebean", "Scratch", "Yarn", "Catnip", "Sunbeam", "Pounce", "Floof", "Kibble", "Velvet"], END = ["worth", "field", "ton", "stein", "berg", "ley", "more", "wick", "bottom", "ington"];
const NS = [..."bdfhklmnprstvwyz"].flatMap((c) => [..."aeiou"].map((v) => c.toUpperCase() + v)).filter((x) => x !== "Lo" && x !== "No"), NM = ["la", "li", "ro", "bi", "bo", "zu", "fi", "lu", "ba", "wi"], NE = "bo by ki ko la li lo ly ma mi mo my na ni ny pa pi po py ra ri ro sy ta ti to zy zo bean bun kin nix pip puff zle ble bel lin mer sie tsy ver wen dle xie zie lou rin tto".split(" ");
export const TEMPS = [["Sweet", 10], ["Playful", 10], ["Curious", 9], ["Shy", 8], ["Goofy", 7], ["Chill", 7], ["Mischievous", 7], ["Confident", 7], ["Sleepy", 6], ["Sassy", 5], ["Dramatic", 5], ["Fierce", 5], ["Grumpy", 5], ["Mysterious", 4], ["Regal", 2], ["Zen", 2]];
/* each temperament's signature move, the one it does when you tap it */
export const MOVES = { Sweet: "wave", Playful: "pawsup", Curious: "posey", Shy: "knead", Goofy: "dance", Chill: "knead", Mischievous: "spin", Confident: "pawsup", Sleepy: "knead", Sassy: "posey",
  Dramatic: "spin", Fierce: "pawsup", Grumpy: "posey", Mysterious: "posey", Regal: "wave", Zen: "knead" };

export function roll(R) {
  const wp = (o) => { const e = Array.isArray(o) ? o : Object.entries(o); let s = e.reduce((a, x) => a + x[1], 0) * R(); for (const [k, w] of e) { s -= w; if (s <= 0) return k; } return e[e.length - 1][0]; };
  const ch = (p) => R() < p, pk = (a) => a[Math.floor(R() * a.length)];
  const G = {};
  /* what it is */
  const KIND = wp([["Domestic", 58], ["Wild", 27], ["Supernatural", 15]]); G.KIND = KIND;
  /* coat genetics (Prancers), rolled for every cat so the order never shifts; ghosts and nekomata wear theirs */
  const MALE = ch(0.5); let ORANGE = false, TORTIE = false;
  if (MALE) ORANGE = ch(0.25); else { const r = R(); if (r < 0.08) ORANGE = true; else if (r < 0.36) TORTIE = true; }
  const EU = wp([["Black", 72], ["Chocolate", 20], ["Cinnamon", 8]]), DILUTE = ch(0.2), AGOUTI = ORANGE || ch(0.45);
  const TPAT = wp([["Mackerel", 34], ["Classic", 22], ["Spotted", 18], ["Ticked", 10], ["Marbled", 8], ["Shaded", 6], ["Rosetted", 5]]), SILVER = !ORANGE && ch(0.12);
  const WHITE0 = wp([["None", 54], ["Locket", 7], ["Mitts", 13], ["Tuxedo", 13], ["Bicolor", 7], ["Harlequin", 3], ["Van", 3], ["Solid White", 3]]);
  const POINT = !ORANGE && !TORTIE && WHITE0 === "None" && ch(0.08), LYNX = POINT && ch(0.4), BRINDLE = TORTIE && ch(0.45);
  const FUR0 = wp([["Shorthair", 58], ["Longhair", 24], ["Rex", 10], ["Hairless", 8]]), GOLD0 = ch(1 / 60), NEON0 = ch(0.22);
  const EUN = { Black: ["Black", "Blue"], Chocolate: ["Chocolate", "Lilac"], Cinnamon: ["Cinnamon", "Fawn"] }[EU][+DILUTE], REDN = DILUTE ? "Cream" : "Ginger";
  let EYEN = wp([["Green", 30], ["Gold", 35], ["Copper", 15], ["Hazel", 15], ["Blue", 5]]); if (POINT) EYEN = "Blue";
  const EARS0 = wp([["Pointed", 70], ["Tufted", FUR0 === "Longhair" ? 45 : 10], ["Folded", FUR0 === "Hairless" ? 0 : 12], ["Round", 8]]), TAIL0 = wp([["Long", 60], ["Question", 26], ["Bob", 14]]);
  const SPECIES = wp(Object.entries(WILD).map(([k, v]) => [k, v[0]])), SPK = wp(Object.entries(SPIRIT).map(([k, v]) => [k, v[0]]));
  const MORPH = SPECIES === "Tiger" ? wp([["Classic", 88], ["White", 8], ["Golden", 4]]) : SPECIES === "Leopard" || SPECIES === "Jaguar" ? wp([["Classic", 88], ["Black", 12]]) : SPECIES === "Lion" ? wp([["Classic", 92], ["White", 8]]) : "Classic";
  const DOM = KIND === "Domestic", WLD = KIND === "Wild", SUP = KIND === "Supernatural", GENES = DOM || (SUP && (SPK === "Ghost" || SPK === "Nekomata"));
  const GOLD = DOM && GOLD0, WHITE = GENES && !GOLD ? WHITE0 : "None", SW = WHITE === "Solid White", TABBY = GENES && AGOUTI && !POINT && !SW && !GOLD;
  const pig = (n) => hsl(...PIG[n]);
  let body, mark = null, patch = null, point = null, muz, nose = "#ff8fb3", earIn = "#ff8fb3", PAT = "Solid", EYEC, rim = "#ffffff";
  if (GENES) {
    if (GOLD) body = "url(#gold)"; else if (SW) body = "#f4f6fb";
    else if (POINT) { point = pig(EUN); body = mix(pig(EUN), "#fbf4e6", 0.82); if (LYNX) mark = mix(point, "#000000", 0.35); }
    else { const main = ORANGE ? REDN : EUN; body = TABBY && !ORANGE ? (SILVER ? hsl(200, 12, 82) : hsl(...AGR[EUN])) : pig(main); if (TORTIE) patch = pig(REDN);
      if (TABBY) mark = ORANGE ? (DILUTE ? hsl(30, 70, 58) : hsl(16, 80, 38)) : EUN === "Black" ? hsl(260, 25, 12) : mix(pig(EUN), "#000000", 0.5); }
    PAT = GOLD || SW ? "Solid" : POINT ? (LYNX ? "Lynx Point" : "Colorpoint") : TABBY ? TPAT : TORTIE ? (BRINDLE ? "Brindle" : "Tortie") : "Solid";
    muz = point || (WHITE !== "None" && !SW ? "#f4f6fb" : body); EYEC = [EYES[EYEN], EYES[EYEN]];
    if (WHITE0 === "Van" || SW ? ch(0.3) : false) EYEC = [EYES.Blue, EYES.Copper];   // odd eyes, as white cats sometimes have
  } else if (WLD) {
    let [, c, wpat, wears, weyes, wx] = WILD[SPECIES]; if (MORPH === "White") { c = [205, 18, 86]; wx = { pale: 1 }; weyes = "Blue"; } if (MORPH === "Golden") c = [42, 65, 74];
    const black = MORPH === "Black"; body = black ? hsl(c[0], 18, 12) : hsl(...c); mark = wpat === "Plain" ? null : black ? hsl(c[0], 20, 5) : wx.pale ? hsl(215, 12, 36) : hsl(c[0], 45, 13);
    muz = black ? body : mix(body, "#ffffff", 0.7); nose = wx.pale ? "#f2a3b6" : black ? "#2a1a1a" : hsl(8, 50, 42); earIn = mix(body, "#ffffff", 0.45); PAT = wpat; EYEN = weyes; EYEC = [EYES[weyes], EYES[weyes]];
    G.MANE = SPECIES === "Lion" && (MALE || ch(0.5)) ? (MORPH === "White" ? "Cream" : wp([["Blond", 40], ["Tawny", 40], ["Dark", 17], ["Black", 3]])) : "None";
    G.WEARS = wears;
  }
  if (SUP) { const sp = SPIRIT[SPK][1]; rim = sp.rim; EYEC = [sp.eye, sp.eye];
    if (!GENES) { body = sp.body; mark = sp.mark; muz = sp.muz; nose = sp.nose; earIn = mix(sp.rim, "#000000", 0.3); PAT = sp.pat; }
    if (SPK === "Ghost") { body = "#d6f3ff"; muz = "#f2fbff"; nose = "#9fd8f0"; earIn = "#a9e2f7"; if (mark) mark = "#6fb9da"; if (patch) patch = "#a9dcef"; if (point) point = "#8fc6df"; }
    if (SPK === "Nekomata") EYEC = [EYES[EYEN], EYES[EYEN]]; }
  const NEON = !GOLD && !SUP && NEON0;   // the Neon finish: a dark coat whose markings glow, as the Prancers were drawn
  if (NEON) { rim = mark || patch || point || body; if (mark) mark = mix(mark, "#ffffff", 0.25); body = mix(body, "#05040a", 0.82); muz = mix(muz, "#05040a", 0.6); }
  const FUR = GENES ? FUR0 : WLD ? (SPECIES === "Snow Leopard" || SPECIES === "Lynx" ? "Longhair" : "Shorthair") : SPK === "Shadow" || SPK === "Celestial" ? "Longhair" : "Shorthair";
  if (FUR === "Hairless" && !GOLD) body = mix(body, "#f3b7b0", 0.4);
  const EARS = WLD ? G.WEARS : SUP && !GENES ? (SPK === "Celestial" ? "Pointed" : wp([["Pointed", 70], ["Tufted", 20], ["Huge", 10]])) : EARS0;
  const TAILK = WLD ? (SPECIES === "Lynx" || SPECIES === "Caracal" ? "Bob" : "Long") : TAIL0;
  const BUILD = wp([["Slim", 30], ["Classic", 50], ["Chonk", 20]]), BW = { Slim: 0.9, Classic: 1, Chonk: 1.2 }[BUILD], CW = { Slim: 0.95, Classic: 1.03, Chonk: 1.15 }[BUILD] + (MALE ? 0.04 : 0);
  /* character */
  const TEMP = wp(TEMPS), MOVE = MOVES[TEMP];
  const LASER = ch(0.08) ? wp([["Blue", 35], ["Red", 35], ["Green", 15], ["Gold", 15]]) : "None";   // the hidden trait the community found (#69), now a little more common
  /* the wardrobe (Portraits) */
  const OUTFIT = wp([["None", 30], ["Hoodie", 7], ["Turtleneck", 5], ["Suit & Tie", 5], ["Leather Jacket", 4], ["Denim Jacket", 4], ["Band Tee", 6], ["Sweater", 5], ["Varsity Jacket", 4],
    ["Overalls", 4], ["Astronaut", 2.5], ["Puffer Jacket", 4], ["Flannel", 4], ["Raincoat", 3], ["Lab Coat", 3], ["Tracksuit", 4], ["Hawaiian Shirt", 4], ["Kimono", 3], ["Royal Robe", 1.3]]);
  const C1 = pk(CLOTH), C2 = pk(CLOTH);
  const JACKET = OUTFIT === "Leather Jacket" ? "#16151a" : OUTFIT === "Denim Jacket" ? "#3d6aa8" : OUTFIT === "Suit & Tie" ? pk(["#1d2a44", "#111114", "#2b2b33", C1]) : C1;
  const TEE = OUTFIT === "Overalls" ? pk(["#f6f6f2", C2]) : OUTFIT === "Band Tee" ? pk(["#111114", "#111114", C1]) : OUTFIT === "Flannel" || OUTFIT === "Lab Coat" ? pk(["#f6f6f2", C2]) : null;
  const SLEEVE = { None: null, Hoodie: C1, Turtleneck: C1, "Suit & Tie": JACKET, "Leather Jacket": JACKET, "Denim Jacket": JACKET, Sweater: C1, "Varsity Jacket": "#f1e9d6", Overalls: TEE, Astronaut: "#f2f2ee",
    "Puffer Jacket": C1, Flannel: C1, Raincoat: "#f6c431", "Lab Coat": "#f7f8fa", Tracksuit: C1, "Band Tee": TEE, "Hawaiian Shirt": C1, Kimono: C1, "Royal Robe": "#8c1c2e" }[OUTFIT];
  const PANTS = OUTFIT === "Tracksuit" ? C1 : OUTFIT === "Suit & Tie" ? JACKET : OUTFIT === "Overalls" ? "#3d6aa8" : OUTFIT === "Astronaut" ? "#f2f2ee" : null;
  const EYEWEAR = LASER !== "None" ? "None" : wp([["None", 58], ["Round Glasses", 8], ["Heart Glasses", 6], ["Aviators", 8], ["Cat-Eye Glasses", 7], ["3D Glasses", 5]]).replace("Round Glasses", "Glasses");
  const EARRING = wp([["None", 76], ["Gold Hoop", 11], ["Pearl", 7], ["Tez Stud", 6]]);
  /* where it stands: a setting from the chapters; the wild cats' own country; the spirits' realms */
  const SETTING = WLD ? wp([["Jungle", 35], ["Snowfall", SPECIES === "Snow Leopard" || SPECIES === "Lynx" ? 60 : 8], ["Savanna", SPECIES === "Lion" || SPECIES === "Cheetah" ? 50 : 15], ["Portrait Studio", 25]])
    : SUP ? wp([["Deep Space", SPK === "Cosmic" ? 60 : 25], ["The Sphere", 20], ["Portrait Studio", 25], ["Pad Corner", 10]])
    : wp([["Portrait Studio", 30], ["Pad Corner", 24], ["Paper Route", 18], ["The Sphere", 16], ["Deep Space", OUTFIT === "Astronaut" ? 60 : 12]]);
  const HUE = R() * 360;   // the setting's own colour
  const r1 = R(), KEY = `${FIRST[Math.floor(r1 * FIRST.length)]}${ch(0.55) ? " " + pk(LAST) + pk(END) : ""}`;
  /* the name (Yoeshi 2026-11-07: a brand constant after all): one word, its own to Prancer 3D (no Portraits name), built from the same
     draw as the key, so nothing else changes: 78 starts x 10 middles x 49 endings, 38,220 names, under one repeat expected in 256; every
     combination checked for unfortunate words */
  const n = Math.floor(r1 * 4294967296), NAME = NS[n % 78] + NM[(n >>> 7) % 10] + NE[(n >>> 11) % 49];
  /* rolled last, so nothing above changes: a hat, an instrument from the Purrancers, or something held from the chapters */
  const HAT = wp([["None", 46], ["Beanie", 6], ["Cap", 6], ["Top Hat", 5], ["Crown", 4], ["Party Hat", 5], ["Beret", 5], ["Wizard Hat", 4], ["Headphones", 6], ["Cowboy Hat", 4], ["Flower Crown", 4], ["Bucket Hat", 4], ["Chef Hat", 3], ["Propeller Cap", 3], ["Pirate Hat", 2.5], ["Viking Helmet", 2]]);
  const INSTR = wp([["None", 84], ["Ruby Acoustic", 4], ["Nylon Guitar", 3.5], ["Ukulele", 3.5], ["Violin", 2.5], ["Alto Sax", 2.5]]);
  const HOLD = INSTR !== "None" ? "None" : wp([["None", 52], ["Newspaper", 5], ["None", 5] /* was the Tarot Card (Yoeshi, 2026-11-10: out of the held things); its share holds nothing, so every other cat keeps what it held */, ["Tez Coin", 4], ["Boba Tea", 4], ["Fish", 4], ["Yarn Ball", 4], ["Rose", 4], ["Donut", 4], ["Ice Cream", 4], ["Balloon", 4], ["Lollipop", 3], ["Magic Wand", 3], ["Coffee", 4], ["Pizza", 3]]);
  /* the legendary combos: one cat in fifty (Yoeshi, 2026-11-07: 2% each for the legendaries and the Mythics), each of the four as likely; a legendary wears its own gear, holds its own thing and stands in its own place.
     Decided from the hue already rolled, with no draw of its own: a draw here would move every seed's blinks and glances, which share the stream */
  const LEGENDS = { Astronaut: ["None", "None", "Deep Space"], "Night Guardian": ["Guardian Cowl", "Crescent", "Night City"], Adventurer: ["Fedora", "Golden Idol", "Lost Temple"], Sphinx: ["Nemes", "Golden Ankh", "Giza at Dusk"] };
  const LEGEND = HUE % 2.4 < 0.048 ? Object.keys(LEGENDS)[Math.floor(HUE / 2.4) % 4] : "None", LEG = LEGEND !== "None", LG = LEGENDS[LEGEND] || [];
  /* the fighting-class Mythics, the Portraits' four (Yoeshi, 2026-11-07: "the mythics need to be in there too"), each in its own gear, in the place it rolled.
     From the hue as well, a slice beside the legendaries', so never both and no draw of its own */
  const MYTHS = { "Star Monk": ["Hooded Robe", "Hood", "Plasma Blade"], Gladiator: ["Gladiator's Armor", "Gladiator's Helm", "Gladius"], "CIB Agent": ["Suit & Tie", "None", "Blaster"], "Sword Knight": ["Knight's Armor", "Ribbon Bow", "Enchanted Blade"] };
  const MYTH = HUE % 2.4 >= 0.048 && HUE % 2.4 < 0.096 ? Object.keys(MYTHS)[Math.floor(HUE / 2.4) % 4] : "None", MY = MYTH !== "None", MG = MYTHS[MYTH] || [], CIB = MYTH === "CIB Agent", SPEC = LEG || MY;
  const HAT1 = LEG ? LG[0] : MY ? MG[1] : HAT, INSTR1 = SPEC ? "None" : INSTR, HOLD1 = LEG ? LG[1] : MY ? MG[2] : HOLD, SETTING1 = LEG ? LG[2] : SETTING, OUTFIT1 = LEG ? LEGEND : MY ? MG[0] : OUTFIT,
    EYEWEAR1 = CIB ? "Agent Shades" : SPEC ? "None" : EYEWEAR, EARRING1 = SPEC ? "None" : EARRING;
  /* a domestic Agent is a cat in black, as in the Portraits; the Star Monk's blade takes one of seven colours */
  const PLN = ["Blue", "Green", "Purple", "Yellow", "Red", "Orange", "White"][Math.floor(HUE * 37) % 7];
  if (LEGEND === "Astronaut") G.MANE = "None";   /* a sealed helmet: no mane can sit outside the glass (the hood, helm, cowl, fedora and nemes sit on the mane naturally) */
  const INK = CIB && GENES; if (INK) { body = muz = "#17151d"; mark = patch = point = null; PAT = "Solid"; }
  Object.assign(G, { LEGEND, GENES, NEON, GOLD: GOLD && !INK, bodyFill: GOLD && !INK ? "url(#gold)" : body, markC: mark, patchC: patch, pointC: point, muzC: muz, noseC: nose, earIn, RIM: rim, EYEC, PAT, WHITE: INK ? "None" : WHITE, WHITEC: "#f4f6fb",
    FUR, EARS, TAILK, BUILD, BW, CW, MALE, TEMP, MOVE, OUTFIT, JACKET, TEE, SLEEVE, PANTS, SHORTSLEEVE: LEGEND !== "Astronaut" && (OUTFIT === "Band Tee" || OUTFIT === "Overalls" || OUTFIT === "Hawaiian Shirt"), C1, SPK: SUP ? SPK : "", HALO: SUP && SPK === "Celestial", HORNS: SUP && SPK === "Infernal", WINGS: SUP && (SPK === "Celestial" || (SPK === "Infernal" && HUE % 2 < 1)),
    LASER, EYEWEAR: EYEWEAR1, EARRING: EARRING1, SETTING: SETTING1, HUE, KEY, NAME, HAT: HAT1, INSTR: INSTR1, HOLD: HOLD1, C2, SPECIES: WLD ? SPECIES : null, MORPH,
    MYTH: MY, MONK: MYTH === "Star Monk", GLAD: MYTH === "Gladiator", CIB, KNIGHT: MYTH === "Sword Knight", PLC: MYTH === "Star Monk" ? { Blue: "#3fa0ff", Green: "#3fff6a", Purple: "#b45cff", Yellow: "#ffe23f", Red: "#ff2a3c", Orange: "#ff8a1f", White: "#e8f4ff" }[PLN] : null });
  if (MY) Object.assign(G, { SHORTSLEEVE: false, JACKET: "#0d0d11", SLEEVE: { "Suit & Tie": "#0d0d11", "Knight's Armor": "#c9d1dc", "Hooded Robe": "#6b4a2e" }[MG[0]] || null, PANTS: CIB ? "#0d0d11" : MYTH === "Sword Knight" ? "#bcc5d1" : null });
  /* the card */
  const coat = GOLD ? "Maneki Gold" : SW ? "White" : POINT ? EUN + (LYNX ? " Lynx Point" : " Point") : TORTIE ? (DILUTE ? "Dilute " : "") + (AGOUTI ? "Torbie" : "Tortoiseshell") : (ORANGE ? REDN : SILVER && TABBY ? "Silver" : EUN) + (TABBY && !TORTIE ? " " + TPAT + " Tabby" : "");
  G.FEAT = { Name: NAME, Kind: KIND, Cat: WLD ? (MORPH !== "Classic" ? MORPH + " " : "") + SPECIES : SUP ? SPK : "Domestic", Coat: GENES ? coat + (WHITE !== "None" && !SW ? (WHITE === "Mitts" ? ", Mitted" : WHITE === "Locket" ? " with Locket" : " & White") : "") : PAT,
    Pattern: PAT, Fur: FUR, Finish: GOLD ? "Gold" : NEON ? "Neon" : SUP ? SPK : "Lit", Eyes: EYEC[0] !== EYEC[1] ? "Odd-Eyed" : SUP && !GENES ? SPK + " Glow" : EYEN, Ears: EARS, Tail: TAILK, Build: BUILD,
    Outfit: OUTFIT1, Headwear: HAT1, Eyewear: EYEWEAR1, Earring: EARRING1, Instrument: INSTR1, Holding: HOLD1, "Laser Eyes": LASER, Setting: SETTING1, Temperament: TEMP, Signature: { wave: "Wave", pawsup: "Paws Up", posey: "Posey Paw", knead: "Knead", dance: "Prance Trance", spin: "Spin" }[MOVE] };
  if (G.MANE && G.MANE !== "None") G.FEAT.Mane = G.MANE; if (G.WINGS) G.FEAT.Wings = SPK === "Infernal" ? "Bat" : "Feathered"; if (LEG) G.FEAT.Legendary = LEGEND; if (MY) { G.FEAT.Mythic = MYTH; if (G.PLC) G.FEAT.Blade = PLN; } if (INK) Object.assign(G.FEAT, { Coat: "Black", Pattern: "Solid", Finish: "Lit" });
  return G;
}
