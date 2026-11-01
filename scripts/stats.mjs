// Builds the live profile cards from the GitHub GraphQL API.
// Run: GITHUB_TOKEN=... node scripts/stats.mjs <output-dir>
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAPER_FILTER, SANS, SERIF, flower, ridge, ridgePath, round, seeded, tuft } from './paint.mjs';

const LOGIN = 'madara1150';
const LANGUAGE_WINDOW_YEARS = 3;

const QUERY = `query($login: String!) {
  user(login: $login) {
    followers { totalCount }
    repositories(ownerAffiliations: OWNER, privacy: PUBLIC, isFork: false, first: 100, orderBy: { field: PUSHED_AT, direction: DESC }) {
      totalCount
      nodes {
        name
        pushedAt
        languages(first: 10, orderBy: { field: SIZE, direction: DESC }) { edges { size node { name } } }
      }
    }
    contributionsCollection {
      contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } }
    }
  }
}`;

const NOTES = [
  ['Make it work, make it right, then make it fast.', 'ทำให้ใช้ได้ก่อน ทำให้ถูก แล้วค่อยทำให้เร็ว'],
  ['A good commit message is a gift to future you.', 'ข้อความ commit ที่ดีคือของขวัญให้ตัวเองในอนาคต'],
  ['Delete code whenever you can. It has no bugs once gone.', 'ลบโค้ดได้ก็ลบ โค้ดที่ไม่มีอยู่ไม่มีบั๊ก'],
  ['Read the error message. All of it.', 'อ่านข้อความ error ให้จบ ทุกบรรทัด'],
  ['Business logic belongs where the next developer will look.', 'วาง business logic ไว้ในที่ที่คนต่อไปจะหาเจอ'],
  ['Name things for what they mean, not how they work.', 'ตั้งชื่อตามความหมาย ไม่ใช่ตามวิธีทำงาน'],
  ['In Odoo, inherit before you override.', 'ใน Odoo สืบทอดก่อนคิดจะเขียนทับ'],
  ['Measure first. Slow code is rarely where you guessed.', 'วัดผลก่อน จุดที่ช้ามักไม่ใช่จุดที่เดาไว้'],
  ['A test is a note saying what must never break.', 'test คือโน้ตบอกว่าอะไรห้ามพัง'],
  ['Small pull requests get real reviews.', 'PR เล็กๆ ถึงจะได้รีวิวจริงจัง'],
  ['If you had to explain it twice, write it down.', 'เรื่องไหนอธิบายสองรอบแล้ว ให้เขียนเก็บไว้'],
  ['Backups count only after you have restored one.', 'backup นับว่ามีจริงเมื่อเคยกู้คืนสำเร็จแล้ว'],
  ['Ask what the user needs before asking which framework.', 'ถามว่าผู้ใช้ต้องการอะไร ก่อนถามว่าใช้เฟรมเวิร์กไหน'],
  ['Rest is part of the work. Go outside for a while.', 'การพักก็เป็นส่วนหนึ่งของงาน ออกไปเดินเล่นบ้าง'],
];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

export function streaks(days, today) {
  let longest = 0;
  let run = 0;
  for (const { contributionCount } of days) {
    run = contributionCount > 0 ? run + 1 : 0;
    longest = Math.max(longest, run);
  }
  // Today has not finished yet, so an empty today does not break the streak.
  const past = days.filter((d) => d.date <= today);
  if (past.at(-1)?.date === today && past.at(-1).contributionCount === 0) past.pop();
  let current = 0;
  while (past.length && past.pop().contributionCount > 0) current += 1;
  return { current, longest };
}

export function topLanguages(repos, now, limit = 5) {
  // Old coursework should not outrank what is being written today.
  const cutoff = new Date(now);
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - LANGUAGE_WINDOW_YEARS);
  const sizes = new Map();
  for (const repo of repos) {
    if (new Date(repo.pushedAt) < cutoff) continue;
    for (const { size, node } of repo.languages.edges) sizes.set(node.name, (sizes.get(node.name) ?? 0) + size);
  }
  const total = [...sizes.values()].reduce((a, b) => a + b, 0);
  return [...sizes].sort((a, b) => b[1] - a[1]).slice(0, limit)
    .map(([name, size]) => ({ name, percent: (size / total) * 100 }));
}

const shell = (label, width, height, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${esc(label)}">
  <title>${esc(label)}</title>
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fdf9ee"/><stop offset="1" stop-color="#f3ecd8"/></linearGradient></defs>
  <style>
    @keyframes grow { from { transform: scaleX(0); } }
    @keyframes fade { from { opacity: 0; transform: translateY(6px); } }
    .bar { transform-box: fill-box; transform-origin: left; animation: grow 1.8s cubic-bezier(.2, .8, .2, 1) backwards; }
    .fade { animation: fade 1.2s ease-out backwards; }
    @media (prefers-reduced-motion: reduce) { .bar, .fade { animation: none; } }
  </style>
  <rect width="${width}" height="${height}" rx="14" fill="url(#g)"/>
  <rect x=".75" y=".75" width="${width - 1.5}" height="${height - 1.5}" rx="13.5" fill="none" stroke="#d8cdaf" stroke-width="1.5"/>
  <g font-family="${SANS}">
${body}
  </g>
</svg>
`;

export function statsCard({ contributions, current, longest, repos, followers, updated }) {
  const cells = [
    [contributions, 'contributions · 12 months', 'การมีส่วนร่วมในรอบปี'],
    [`${current} ${current === 1 ? 'day' : 'days'}`, 'current streak', 'ทำต่อเนื่องตอนนี้'],
    [`${longest} ${longest === 1 ? 'day' : 'days'}`, 'longest streak · 12 months', 'ต่อเนื่องนานที่สุด'],
    [repos, 'public repositories', 'โปรเจกต์สาธารณะ'],
  ];
  const body = cells.map(([value, en, th], i) => {
    const x = 24 + (i % 2) * 176;
    const y = 86 + Math.floor(i / 2) * 76;
    return `    <g class="fade" style="animation-delay:${i * 0.2}s">
      <text x="${x}" y="${y}" fill="#2f4634" font-family="${SERIF}" font-size="27" font-weight="700">${esc(value)}</text>
      <text x="${x}" y="${y + 20}" fill="#44524a" font-size="12">${esc(en)}</text>
      <text x="${x}" y="${y + 37}" fill="#7a6a4c" font-size="12">${esc(th)}</text>
    </g>`;
  }).join('\n');
  return shell('GitHub stats', 400, 240, `    <text x="24" y="40" fill="#2f4634" font-family="${SERIF}" font-size="19" font-weight="700">At a Glance <tspan fill="#7a6a4c" font-size="14" font-weight="400">· ภาพรวม</tspan></text>
    <text x="376" y="38" text-anchor="end" fill="#a39573" font-size="11">${esc(updated)} · ${followers} ${followers === 1 ? 'follower' : 'followers'}</text>
${body}`);
}

export function languagesCard(languages) {
  const shades = ['#5e8c61', '#8fb26b', '#d9a95f', '#c4744a', '#7fa8b8'];
  const body = languages.map(({ name, percent }, i) => {
    const y = 72 + i * 33;
    const width = Math.max(4, (percent / languages[0].percent) * 232);
    return `    <g>
      <text x="24" y="${y + 11}" fill="#44524a" font-size="14">${esc(name)}</text>
      <rect x="112" y="${y}" width="232" height="11" rx="5.5" fill="#e8e0ca"/>
      <rect class="bar" style="animation-delay:${i * 0.15}s" x="112" y="${y}" width="${width.toFixed(1)}" height="11" rx="5.5" fill="${shades[i]}"/>
      <text x="376" y="${y + 11}" text-anchor="end" fill="#7a6a4c" font-size="12">${percent.toFixed(0)}%</text>
    </g>`;
  }).join('\n');
  return shell('Most used languages', 400, 240, `    <text x="24" y="40" fill="#2f4634" font-family="${SERIF}" font-size="19" font-weight="700">Languages <tspan fill="#7a6a4c" font-size="14" font-weight="400">· ภาษาที่ใช้</tspan></text>
    <text x="376" y="38" text-anchor="end" fill="#a39573" font-size="11">last ${LANGUAGE_WINDOW_YEARS} years · ${LANGUAGE_WINDOW_YEARS} ปีล่าสุด</text>
${body}`);
}

export function noteCard(date) {
  const index = Math.floor(Date.parse(date) / 86_400_000) % NOTES.length;
  const [en, th] = NOTES[index];
  return shell('Note of the day', 816, 116, `    <text class="fade" x="30" y="36" fill="#b5764c" font-size="12" font-weight="600" letter-spacing="1.5">TODAY'S NOTE · บันทึกวันนี้</text>
    <text x="786" y="36" text-anchor="end" fill="#a39573" font-size="11">${esc(date)}</text>
    <text class="fade" style="animation-delay:.3s" x="30" y="67" fill="#2f4634" font-family="${SERIF}" font-size="19">${esc(en)}</text>
    <text class="fade" style="animation-delay:.6s" x="30" y="95" fill="#7a6a4c" font-size="16">${esc(th)}</text>`);
}

// The past year as a field: one clump of grass per week, taller when that week was busy.
export function meadowCard(weeks) {
  const W = 900;
  const H = 220;
  const counts = weeks.map((w) => w.contributionDays.reduce((sum, d) => sum + d.contributionCount, 0));
  const peak = Math.max(...counts, 1);
  const random = seeded(11);
  const ground = ridge(176, 6, 2);
  const blades = [['', '#4b8147'], ['', '#68994f'], ['', '#8db55f']];
  let blooms = '';
  counts.forEach((count, i) => {
    const x = 28 + (i * (W - 56)) / Math.max(counts.length - 1, 1);
    const size = 9 + Math.sqrt(count / peak) * 74;
    blades[i % 3][0] += tuft(x, ground(x) + 5, size, random, count ? 6 : 3);
    if (count) {
      const color = ['#fffdf5', '#f6c7c7', '#fff0b5'][i % 3];
      blooms += `<path d="M${round(x)} ${round(ground(x) + 2)}V${round(ground(x) - size - 7)}" stroke="#55793f" stroke-width="1"/>`
        + flower(x, ground(x) - size - 8, 2 + (count / peak) * 2.6, color);
    }
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="A meadow where each clump of grass is one week of contributions from the past year">
  <title>Contribution meadow</title>
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8ec7e3"/><stop offset=".75" stop-color="#fbeecd"/></linearGradient>
    <linearGradient id="soil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9cc66a"/><stop offset="1" stop-color="#4f8449"/></linearGradient>
    ${PAPER_FILTER}
    <clipPath id="frame"><rect width="${W}" height="${H}" rx="14"/></clipPath>
  </defs>
  <style>
    @keyframes breeze { 0%, 100% { transform: skewX(-1.8deg); } 50% { transform: skewX(2.2deg); } }
    .sway { transform-origin: 0 180px; animation: breeze 7s ease-in-out infinite; }
    .s1 { animation-delay: -2.3s; animation-duration: 8.2s; }
    .s2 { animation-delay: -4.4s; animation-duration: 6.3s; }
    @media (prefers-reduced-motion: reduce) { .sway { animation: none; } }
  </style>
  <g clip-path="url(#frame)">
    <rect width="${W}" height="${H}" fill="url(#sky)"/>
    <text x="28" y="34" fill="#23506a" font-family="${SERIF}" font-size="18" font-weight="700">A Year in the Meadow <tspan font-family="${SANS}" font-size="14" font-weight="400">· ทุ่งหญ้าหนึ่งปี</tspan></text>
    <text x="28" y="54" fill="#23506a" font-family="${SANS}" font-size="12">Each clump is one week; busier weeks grow taller · หนึ่งกอคือหนึ่งสัปดาห์ ยิ่งทำมากยิ่งสูง</text>
    <path d="${ridgePath(ground, W, H)}" fill="url(#soil)"/>
    <g class="sway s0"><path d="${blades[0][0]}" fill="${blades[0][1]}"/></g>
    <g class="sway s1"><path d="${blades[1][0]}" fill="${blades[1][1]}"/></g>
    <g class="sway s2"><path d="${blades[2][0]}" fill="${blades[2][1]}"/></g>
    <g class="sway s1">${blooms}</g>
    <rect width="${W}" height="${H}" filter="url(#paper)" opacity=".5"/>
  </g>
</svg>
`;
}

async function fetchUser(token) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: QUERY, variables: { login: LOGIN } }),
  });
  const { data, errors } = await res.json();
  if (errors || !data?.user) throw new Error(JSON.stringify(errors ?? res.status));
  return data.user;
}

export function render(user, now = new Date()) {
  const today = now.toISOString().slice(0, 10);
  const calendar = user.contributionsCollection.contributionCalendar;
  const days = calendar.weeks.flatMap((w) => w.contributionDays);
  return {
    'stats.svg': statsCard({
      contributions: calendar.totalContributions,
      ...streaks(days, today),
      repos: user.repositories.totalCount,
      followers: user.followers.totalCount,
      updated: today,
    }),
    'languages.svg': languagesCard(topLanguages(user.repositories.nodes, now)),
    'note.svg': noteCard(today),
    'meadow.svg': meadowCard(calendar.weeks),
  };
}

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  const out = process.argv[2] ?? 'dist';
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN is required');
  const files = render(await fetchUser(token));
  await mkdir(out, { recursive: true });
  await Promise.all(Object.entries(files).map(([name, svg]) => writeFile(join(out, name), svg)));
  console.log(`wrote ${Object.keys(files).join(', ')} to ${out}`);
}
