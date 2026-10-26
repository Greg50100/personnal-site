/** Coordonnées des broches des symboles de schematic.jsx (fichier séparé pour le rechargement à chaud). */
export const opAmpPins = (x, y) => ({ top: [x, y - 15], bottom: [x, y + 15], out: [x + 70, y] })
export const npnPins = (x, y) => ({ base: [x, y], collector: [x + 26, y - 30], emitter: [x + 26, y + 30] })
export const mosfetPins = (x, y) => ({ source: [x - 28, y], drain: [x + 28, y], gate: [x, y - 34] })
export const bufferPins = (x, y) => ({ in: [x - 12, y], out: [x + 42, y], oe: [x + 12, y + 28] })
