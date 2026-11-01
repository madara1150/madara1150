// Paints assets/hero.svg, a hand-painted looking countryside. Run: node scripts/hero.mjs
import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAPER_FILTER, SERIF, flower, ridge, ridgePath, round, seeded, tuft } from './paint.mjs';

const W = 1200;
const H = 440;
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'hero.svg');

function cloud(cx, cy, width, height, seed) {
  const random = seeded(seed);
  const puffs = [];
  const count = Math.round(width / 26);
  for (let i = 0; i < count; i++) {
    const t = (i + 0.5) / count;
    const swell = Math.sin(Math.PI * t) ** 0.8;
    const r = height * (0.16 + 0.26 * swell * (0.6 + random() * 0.6));
    puffs.push({ x: cx - width / 2 + width * t, y: cy - swell * height * (0.2 + random() * 0.5), r });
  }
  const layer = (dx, dy, scale, fill, keep = () => true) => `<g fill="${fill}">${puffs.filter(keep)
    .map((p) => `<circle cx="${round(p.x + dx * p.r)}" cy="${round(p.y + dy * p.r)}" r="${round(p.r * scale)}"/>`).join('')}</g>`;
  return `<ellipse cx="${cx}" cy="${cy}" rx="${round(width * 0.54)}" ry="${round(height * 0.17)}" fill="#a9bfd6"/>
      ${layer(0.05, 0.14, 1.02, '#b4c6dc')}
      ${layer(-0.04, 0, 0.96, '#e6e2e0')}
      ${layer(-0.13, -0.15, 0.82, '#fbf6ec')}
      ${layer(-0.24, -0.3, 0.52, '#ffffff', (_, i) => i % 2 === 0)}`;
}

function trees(y, from, to, step, seed, colors) {
  const random = seeded(seed);
  let body = '';
  for (let x = from; x < to; x += step * (0.6 + random())) {
    const r = 9 + random() * 11;
    const base = y(x) + 3;
    body += `<g><circle cx="${round(x)}" cy="${round(base - r)}" r="${round(r)}" fill="${colors[0]}"/>`
      + `<circle cx="${round(x + r * 0.7)}" cy="${round(base - r * 0.7)}" r="${round(r * 0.7)}" fill="${colors[0]}"/>`
      + `<circle cx="${round(x - r * 0.3)}" cy="${round(base - r * 1.3)}" r="${round(r * 0.55)}" fill="${colors[1]}"/></g>`;
  }
  return body;
}

function bigTree(x, ground) {
  const random = seeded(41);
  const foliage = (count, spread, size, lift, fill) => {
    let body = '';
    for (let i = 0; i < count; i++) {
      const a = random() * Math.PI * 2;
      const d = Math.sqrt(random());
      const px = x + Math.cos(a) * d * spread;
      const py = ground - 150 + Math.sin(a) * d * spread * 0.62 - lift;
      body += `<circle cx="${round(px)}" cy="${round(py)}" r="${round(size * (0.7 + random() * 0.5))}"/>`;
    }
    return `<g fill="${fill}">${body}</g>`;
  };
  return `<ellipse cx="${x + 18}" cy="${round(ground + 2)}" rx="120" ry="11" fill="#2e5a3c" opacity=".38"/>
      <path d="M${x - 14} ${round(ground + 3)}C${x - 7} ${round(ground - 40)} ${x - 9} ${round(ground - 72)} ${x - 26} ${round(ground - 118)}L${x - 11} ${round(ground - 122)}C${x - 2} ${round(ground - 92)} ${x + 3} ${round(ground - 92)} ${x + 7} ${round(ground - 124)}L${x + 27} ${round(ground - 120)}C${x + 11} ${round(ground - 74)} ${x + 11} ${round(ground - 40)} ${x + 20} ${round(ground + 3)}Z" fill="#5d4632"/>
      <g class="tree">
        ${foliage(22, 112, 42, -12, '#2f6146')}
        ${foliage(26, 104, 33, 6, '#477f4e')}
        ${foliage(22, 92, 25, 26, '#74a65a')}
        ${foliage(14, 74, 15, 46, '#aecb76')}
      </g>`;
}

function cottage(x, ground) {
  return `<g>
        <ellipse cx="${x + 8}" cy="${round(ground + 1)}" rx="50" ry="6" fill="#3f6e43" opacity=".4"/>
        <rect x="${x + 16}" y="${round(ground - 62)}" width="9" height="24" fill="#8a5d48"/>
        <rect x="${x - 34}" y="${round(ground - 36)}" width="68" height="36" fill="#f6ecd8"/>
        <rect x="${x + 16}" y="${round(ground - 36)}" width="18" height="36" fill="#dfd0b4"/>
        <path d="M${x - 42} ${round(ground - 34)}L${x - 6} ${round(ground - 66)}L${x + 42} ${round(ground - 34)}Z" fill="#c4633f"/>
        <path d="M${x - 6} ${round(ground - 66)}L${x + 42} ${round(ground - 34)}H${x + 8}Z" fill="#a44d33"/>
        <rect x="${x - 22}" y="${round(ground - 22)}" width="13" height="22" fill="#6f7f5c"/>
        <rect x="${x - 2}" y="${round(ground - 28)}" width="13" height="12" fill="#f4cf79"/>
        <path d="M${x + 4.5} ${round(ground - 28)}v12M${x - 2} ${round(ground - 22)}h13" stroke="#8a5d48" stroke-width="1.2"/>
      </g>`;
}

function foreground(y) {
  const random = seeded(19);
  const groups = [['', '#4b8147'], ['', '#68994f'], ['', '#8db55f']];
  const blooms = [];
  for (let x = -10; x < W + 10; x += 7) {
    const g = groups[Math.floor(random() * 3)];
    g[0] += tuft(x, y(x) + 8 + random() * 44, 16 + random() * 22, random);
    if (random() < 0.11) {
      const by = y(x) + 12 + random() * 42;
      blooms.push(flower(x, by, 2 + random() * 1.4, ['#fffdf5', '#fff4c7', '#f6c7c7'][Math.floor(random() * 3)]));
    }
  }
  return `${groups.map(([d, fill], i) => `<path class="sway s${i}" d="${d}" fill="${fill}"/>`).join('\n      ')}
      <g class="sway s1">${blooms.join('')}</g>`;
}

function seeds() {
  const random = seeded(5);
  let body = '';
  for (let i = 0; i < 12; i++) {
    const y = 190 + random() * 210;
    body += `<g class="seed" style="animation-delay:-${round(random() * 24)}s;animation-duration:${round(19 + random() * 12)}s">`
      + `<g transform="translate(-30 ${round(y)}) rotate(${round(random() * 50 - 10)})"><path d="M0 0v-9M0-9l-3.5-3M0-9l3.5-3M0-9v-4.5" stroke="#fffdf3" stroke-width=".9" fill="none"/><circle r="1.2" fill="#b98f55"/></g></g>`;
  }
  return body;
}

const far = ridge(258, 26, 3);
const mid = ridge(292, 15, 8);
const near = ridge(326, 17, 12);
const front = ridge(388, 11, 21);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="madara1150. A painted countryside with drifting clouds, a cottage and a large tree.">
  <title>madara1150</title>
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3f8fc4"/>
      <stop offset=".42" stop-color="#83c0df"/>
      <stop offset=".68" stop-color="#d6e7dc"/>
      <stop offset=".82" stop-color="#f8ecc9"/>
    </linearGradient>
    <radialGradient id="sun" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="#fff8dc" stop-opacity=".95"/>
      <stop offset=".35" stop-color="#ffeeb8" stop-opacity=".45"/>
      <stop offset="1" stop-color="#ffeeb8" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="hill1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfd98a"/><stop offset="1" stop-color="#83b268"/></linearGradient>
    <linearGradient id="hill2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a3cb6c"/><stop offset=".6" stop-color="#7eb35c"/><stop offset="1" stop-color="#5c9451"/></linearGradient>
    <linearGradient id="hill3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6fa451"/><stop offset="1" stop-color="#3a6c42"/></linearGradient>
    <filter id="brush" x="-5%" y="-10%" width="110%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency=".016" numOctaves="3" seed="4"/>
      <feDisplacementMap in="SourceGraphic" scale="11"/><feGaussianBlur stdDeviation=".7"/>
    </filter>
    <filter id="leaf" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency=".05" numOctaves="2" seed="9"/>
      <feDisplacementMap in="SourceGraphic" scale="5"/><feGaussianBlur stdDeviation=".5"/>
    </filter>
    <filter id="haze"><feGaussianBlur stdDeviation="1.2"/></filter>
    <filter id="smoke" x="-100%" y="-50%" width="300%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>
    ${PAPER_FILTER}
    <clipPath id="frame"><rect width="${W}" height="${H}" rx="18"/></clipPath>
  </defs>

  <style>
    @keyframes drift { from { transform: translateX(-34px); } to { transform: translateX(34px); } }
    @keyframes breeze { 0%, 100% { transform: skewX(-1.2deg); } 50% { transform: skewX(1.6deg); } }
    @keyframes rustle { 0%, 100% { transform: rotate(-.5deg); } 50% { transform: rotate(.7deg); } }
    @keyframes float { 0% { transform: translate(0, 0); opacity: 0; } 8%, 88% { opacity: .95; } 50% { transform: translate(640px, -56px); } 100% { transform: translate(1270px, -128px); opacity: 0; } }
    @keyframes smoke { 0% { transform: translate(0, 0) scale(.5); opacity: 0; } 18% { opacity: .75; } 100% { transform: translate(44px, -74px) scale(2.2); opacity: 0; } }
    @keyframes fly { from { transform: translate(-80px, 16px); } to { transform: translate(1280px, -34px); } }
    @keyframes flap { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(.45); } }
    @keyframes glow { 0%, 100% { opacity: .75; } 50% { opacity: 1; } }
    @keyframes rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
    @keyframes role { 0% { opacity: 0; } 4%, 29% { opacity: 1; } 33%, 100% { opacity: 0; } }

    .cloud-a { animation: drift 26s ease-in-out infinite alternate; }
    .cloud-b { animation: drift 38s ease-in-out infinite alternate-reverse; }
    .sway { transform-origin: 0 ${H}px; animation: breeze 7s ease-in-out infinite; }
    .s1 { animation-delay: -2.2s; animation-duration: 8.5s; }
    .s2 { animation-delay: -4.1s; animation-duration: 6.2s; }
    .tree { transform-origin: 958px 332px; animation: rustle 9s ease-in-out infinite; }
    .seed { opacity: 0; animation: float 24s linear infinite; }
    .puff { opacity: 0; transform-box: fill-box; transform-origin: center; animation: smoke 7s ease-out infinite; }
    .birds { animation: fly 52s linear infinite; }
    .bird { transform-box: fill-box; transform-origin: center; animation: flap 1.1s ease-in-out infinite; }
    .sun { animation: glow 9s ease-in-out infinite; }
    .in { opacity: 0; animation: rise 1.4s ease-out forwards; }
    .d1 { animation-delay: .6s; }
    .role { opacity: 0; animation: role 18s infinite; }
    .r2 { animation-delay: 6s; } .r3 { animation-delay: 12s; }

    @media (prefers-reduced-motion: reduce) {
      .cloud-a, .cloud-b, .sway, .tree, .seed, .puff, .birds, .bird, .sun, .in, .role { animation: none; }
      .seed, .puff, .birds { opacity: 0; }
      .in, .r1 { opacity: 1; }
    }
  </style>

  <g clip-path="url(#frame)">
    <rect width="${W}" height="${H}" fill="url(#sky)"/>
    <circle class="sun" cx="1085" cy="74" r="230" fill="url(#sun)"/>

    <g filter="url(#brush)">
      <g class="cloud-b">${cloud(1120, 196, 330, 84, 31)}</g>
      <g class="cloud-a">${cloud(830, 204, 500, 176, 17)}</g>
      <g class="cloud-b">${cloud(190, 236, 330, 58, 23)}</g>
    </g>

    <g class="birds" fill="none" stroke="#3b5a68" stroke-width="1.8" stroke-linecap="round">
      <path class="bird" d="M0 96q7-7 12 0q6-7 13 0"/>
      <path class="bird" style="animation-delay:-.4s" d="M34 84q6-6 10 0q5-6 11 0"/>
      <path class="bird" style="animation-delay:-.7s" d="M-30 80q5-5 9 0q5-5 10 0"/>
    </g>

    <path d="${ridgePath(far, W, H)}" fill="#8db4c6" opacity=".85" filter="url(#haze)"/>
    <g filter="url(#leaf)">
      <path d="${ridgePath(mid, W, H)}" fill="url(#hill1)"/>
      ${trees(mid, -10, W + 10, 62, 6, ['#6f9f6c', '#8bb67c'])}
      <path d="${ridgePath(near, W, H)}" fill="url(#hill2)"/>
      ${trees(near, 520, 760, 48, 13, ['#4e8551', '#6fa35d'])}
      ${cottage(330, near(330))}
      <path d="M322 ${round(near(322) + 1)}C300 346 410 356 382 374S228 400 262 ${H}H356C330 410 462 392 438 370S336 344 340 ${round(near(340) + 1)}Z" fill="#efe2bf" opacity=".92"/>
      ${bigTree(958, near(958) + 6)}
    </g>

    <g fill="#fbf8ef" filter="url(#smoke)">
      <circle class="puff" cx="350" cy="${round(near(330) - 66)}" r="7"/>
      <circle class="puff" style="animation-delay:-2.3s" cx="350" cy="${round(near(330) - 66)}" r="7"/>
      <circle class="puff" style="animation-delay:-4.6s" cx="350" cy="${round(near(330) - 66)}" r="7"/>
    </g>

    <path d="${ridgePath(front, W, H)}" fill="url(#hill3)" filter="url(#leaf)"/>
    ${foreground(front)}
    ${seeds()}

    <g font-family="${SERIF}">
      <text class="in" x="62" y="96" fill="#fffdf4" font-size="60" font-weight="700" letter-spacing=".5" style="paint-order:stroke" stroke="#25566f" stroke-opacity=".28" stroke-width="3">madara1150</text>
      <g class="in d1" fill="#163d52" font-size="23" font-style="italic">
        <g transform="translate(64 140)">
          <text class="role r1">Hello, and welcome</text>
          <text class="role r2" font-style="normal">สวัสดี ยินดีต้อนรับ</text>
          <text class="role r3">Thanks for stopping by</text>
        </g>
      </g>
    </g>

    <rect width="${W}" height="${H}" filter="url(#paper)" opacity=".5"/>
  </g>
</svg>
`;

await writeFile(OUT, svg);
console.log(`wrote hero.svg (${Math.round(svg.length / 1024)} KB)`);
