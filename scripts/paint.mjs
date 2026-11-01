// Small seeded drawing helpers shared by the hero and meadow scenes.

export const SERIF = "Georgia,'Noto Serif Thai','Sarabun','Leelawadee UI',Tahoma,serif";
export const SANS = "'Segoe UI','Noto Sans Thai','Sarabun',Tahoma,system-ui,sans-serif";

export const round = (v) => +v.toFixed(1);

export function seeded(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A rolling skyline: returns its height at x so objects can sit on it.
export function ridge(base, amp, seed) {
  const random = seeded(seed);
  const waves = [1, 2.3, 4.1].map((f, i) => ({
    f: (f * Math.PI * 2) / 1200,
    a: amp / (i + 1),
    p: random() * Math.PI * 2,
  }));
  return (x) => base + waves.reduce((y, w) => y + Math.sin(x * w.f + w.p) * w.a, 0);
}

export function ridgePath(y, width, height) {
  let d = `M0 ${height}L0 ${round(y(0))}`;
  for (let x = 20; x <= width; x += 20) d += `L${x} ${round(y(x))}`;
  return `${d}L${width} ${height}Z`;
}

// A cluster of grass blades growing from (x, y).
export function tuft(x, y, height, random, blades = 4) {
  let d = '';
  for (let i = 0; i < blades; i++) {
    const foot = x + (i - blades / 2) * 2.2;
    const lean = (random() - 0.45) * height * 0.55;
    const h = height * (0.65 + random() * 0.35);
    d += `M${round(foot)} ${round(y)}Q${round(foot + lean * 0.3)} ${round(y - h * 0.6)} ${round(foot + lean)} ${round(y - h)}`
      + `Q${round(foot + lean * 0.3 + 2.4)} ${round(y - h * 0.55)} ${round(foot + 2.6)} ${round(y)}Z`;
  }
  return d;
}

export function flower(x, y, r, color) {
  const petals = [0, 72, 144, 216, 288].map((a) => {
    const t = (a * Math.PI) / 180;
    return `<circle cx="${round(x + Math.cos(t) * r)}" cy="${round(y + Math.sin(t) * r)}" r="${round(r * 0.85)}"/>`;
  }).join('');
  return `<g fill="${color}">${petals}</g><circle cx="${round(x)}" cy="${round(y)}" r="${round(r * 0.7)}" fill="#e9b949"/>`;
}

// Soft fibres of watercolour paper, laid over a finished scene.
export const PAPER_FILTER = `<filter id="paper" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency=".75" numOctaves="3" seed="7"/>
      <feColorMatrix values="0 0 0 0 .35  0 0 0 0 .3  0 0 0 0 .22  0 0 0 .55 -.2"/>
    </filter>`;
