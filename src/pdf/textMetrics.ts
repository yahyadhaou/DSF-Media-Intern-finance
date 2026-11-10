/**
 * Glyph widths of Helvetica Regular (Adobe AFM, 1000 units per em). Arimo, the font embedded in the
 * PDF, has the same metrics, so these numbers predict where a line wraps. The HTML is split into
 * pages before it is rendered (no layout engine is available at that point), so row heights have
 * to be calculated, not measured.
 */
const WIDTHS: Record<string, number> = {
  ' ': 278, '!': 278, '"': 355, '#': 556, $: 556, '%': 889, '&': 667, "'": 191, '(': 333, ')': 333, '*': 389, '+': 584,
  ',': 278, '-': 333, '.': 278, '/': 278, ':': 278, ';': 278, '<': 584, '=': 584, '>': 584, '?': 556, '@': 1015,
  A: 667, B: 667, C: 722, D: 722, E: 667, F: 611, G: 778, H: 722, I: 278, J: 500, K: 667, L: 556, M: 833, N: 722,
  O: 778, P: 667, Q: 778, R: 722, S: 667, T: 611, U: 722, V: 667, W: 944, X: 667, Y: 667, Z: 611,
  '[': 278, '\\': 278, ']': 278, '^': 469, _: 556, '`': 333,
  a: 556, b: 556, c: 500, d: 556, e: 556, f: 278, g: 556, h: 556, i: 222, j: 222, k: 500, l: 222, m: 833, n: 556,
  o: 556, p: 556, q: 556, r: 333, s: 500, t: 278, u: 556, v: 500, w: 722, x: 500, y: 500, z: 500,
  '{': 334, '|': 260, '}': 334, '~': 584,
  ä: 556, ö: 556, ü: 556, Ä: 667, Ö: 778, Ü: 722, ß: 611, é: 556, è: 556, '€': 556, '–': 556, '·': 278, '×': 584,
  '„': 333, '“': 333, '”': 333,
};
for (let digit = 0; digit <= 9; digit += 1) WIDTHS[String(digit)] = 556;

const FALLBACK_WIDTH = 556;

export function textWidth(text: string, fontSize: number): number {
  let total = 0;
  for (const char of text) total += WIDTHS[char] ?? FALLBACK_WIDTH;
  return (total * fontSize) / 1000;
}

/** Splits into chunks that end after a space or hyphen: the places where a line may break. */
function breakChunks(paragraph: string): string[] {
  const chunks: string[] = [];
  let current = '';
  for (const char of paragraph) {
    current += char;
    if (char === ' ' || char === '-') {
      chunks.push(current);
      current = '';
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

/** Number of lines `text` needs in a box `width` pt wide. Breaks at spaces and after hyphens, like the browser. */
export function countLines(text: string, fontSize: number, width: number): number {
  let lines = 0;
  for (const paragraph of text.split('\n')) {
    lines += 1;
    let used = 0;
    for (const chunk of breakChunks(paragraph)) {
      // A trailing space may hang over the edge of the line.
      const visible = textWidth(chunk.replace(/ +$/, ''), fontSize);
      if (used > 0 && used + visible > width) {
        lines += 1;
        used = 0;
      }
      used += textWidth(chunk, fontSize);
    }
  }
  return lines;
}
