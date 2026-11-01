// Generates the bilingual project cards in assets/cards. Run: node scripts/cards.mjs
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SANS, SERIF } from './paint.mjs';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'cards');

const cards = [
  {
    file: 'project-link-github',
    title: 'Project GitHub Integration',
    rank: 'ODOO',
    en: ['Webhook bridge that keeps Odoo project tasks', 'in sync with GitHub pull requests.'],
    th: ['เชื่อม Pull Request บน GitHub กับ Task', 'ใน Odoo ให้อัปเดตสถานะเองผ่าน Webhook'],
    tags: ['Python', 'Odoo 16', 'Webhooks'],
  },
  {
    file: 'budget',
    title: 'Budget Suite',
    rank: 'ODOO',
    en: ['Modules for budget plans, appropriations', 'and commitments, with a custom UI.'],
    th: ['ชุดโมดูลวางแผนงบประมาณ จัดสรรงบ', 'และติดตามภาระผูกพัน พร้อม UI เฉพาะทาง'],
    tags: ['Python', 'OWL', 'SCSS'],
  },
  {
    file: 'portfolio',
    title: 'Personal Portfolio',
    rank: 'WEB',
    en: ['Portfolio site with an admin panel,', 'a Go API and Docker deployment.'],
    th: ['เว็บ Portfolio พร้อมหน้าแอดมิน', 'API ภาษา Go และ Docker'],
    tags: ['Next.js', 'TypeScript', 'Go'],
  },
  {
    file: 'tier-validation',
    title: 'Tier Validation Step',
    rank: 'ODOO',
    en: ['Adds extra capabilities to the approval flow', 'of OCA base_tier_validation.'],
    th: ['เพิ่มความสามารถให้ขั้นตอนอนุมัติของโมดูล', 'base_tier_validation จาก OCA'],
    tags: ['Python', 'Odoo', 'OCA'],
  },
  {
    file: 'hand-tracker',
    title: 'Hand Tracking Game',
    rank: 'CV',
    en: ['Computer-vision game played with your hands,', 'built for a KMITL course project.'],
    th: ['เกมบังคับด้วยมือผ่าน Computer Vision', 'โปรเจกต์วิชา comvision ที่ สจล.'],
    tags: ['Python', 'Computer Vision'],
  },
  {
    file: 'docker-odoo',
    title: 'Docker Odoo',
    rank: 'DEVOPS',
    en: ['Spin up Odoo 16 and pgAdmin locally', 'with a single docker compose up.'],
    th: ['เปิดใช้ Odoo 16 และ pgAdmin บนเครื่อง', 'ด้วยคำสั่ง docker compose up คำสั่งเดียว'],
    tags: ['Docker', 'Odoo 16', 'PostgreSQL'],
  },
];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

function card({ title, rank, en, th, tags }) {
  let x = 24;
  const pills = tags.map((tag) => {
    const w = Math.round(tag.length * 7.3 + 22);
    const pill = `<rect x="${x}" y="178" width="${w}" height="26" rx="13" fill="#e6ecd4"/>`
      + `<text x="${x + w / 2}" y="196" text-anchor="middle" fill="#46613f" font-size="13">${esc(tag)}</text>`;
    x += w + 8;
    return pill;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 226" width="400" height="226" role="img" aria-label="${esc(title)}">
  <title>${esc(title)}</title>
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fdf9ee"/><stop offset="1" stop-color="#f3ecd8"/></linearGradient></defs>
  <style>
    @keyframes sway { 0%, 100% { transform: rotate(-5deg); } 50% { transform: rotate(6deg); } }
    .sprig { transform-origin: 366px 62px; animation: sway 6s ease-in-out infinite; }
    @media (prefers-reduced-motion: reduce) { .sprig { animation: none; } }
  </style>
  <rect width="400" height="226" rx="14" fill="url(#g)"/>
  <rect x=".75" y=".75" width="398.5" height="224.5" rx="13.5" fill="none" stroke="#d8cdaf" stroke-width="1.5"/>
  <g class="sprig" fill="none" stroke="#7da35f" stroke-width="1.6" stroke-linecap="round">
    <path d="M366 62C364 50 368 40 366 26"/>
    <path d="M366 52c-6-1-9-5-10-10c6 0 9 4 10 10zM366 42c6-1 9-5 10-10c-6 0-9 4-10 10zM366 32c-4-1-6-4-7-8c4 0 6 3 7 8z" fill="#a9c583" stroke="none"/>
  </g>
  <g font-family="${SANS}">
    <text x="24" y="42" fill="#2f4634" font-family="${SERIF}" font-size="21" font-weight="700">${esc(title)}</text>
    <text x="24" y="62" fill="#b5764c" font-size="11" font-weight="600" letter-spacing="1.5">${esc(rank)}</text>
    <text x="24" y="90" fill="#44524a" font-size="14">${esc(en[0])}</text>
    <text x="24" y="109" fill="#44524a" font-size="14">${esc(en[1])}</text>
    <text x="24" y="136" fill="#7a6a4c" font-size="14">${esc(th[0])}</text>
    <text x="24" y="156" fill="#7a6a4c" font-size="14">${esc(th[1])}</text>
    ${pills}
  </g>
</svg>
`;
}

await mkdir(OUT, { recursive: true });
await Promise.all(cards.map((c) => writeFile(join(OUT, `${c.file}.svg`), card(c))));
console.log(`wrote ${cards.length} cards`);
