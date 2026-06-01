const fs = require('fs');
const path = require('path');

const base = __dirname;
const imgExt = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.JPG', '.JPEG', '.PNG', '.GIF', '.WEBP']);
const vidExt = new Set(['.mp4', '.mov', '.webm', '.MP4', '.MOV', '.WEBM']);
const monthMap = {
  'января': 1, 'февраля': 2, 'марта': 3, 'апреля': 4, 'мая': 5, 'июня': 6,
  'июля': 7, 'августа': 8, 'сентября': 9, 'октября': 10, 'ноября': 11, 'декабря': 12
};

function parseFolder(name) {
  const m = name.match(/^(\d{1,2})\s+(.+)$/);
  if (!m) return null;
  const month = monthMap[m[2].trim().toLowerCase()];
  if (!month) return null;
  const year = month >= 9 ? 2025 : 2026;
  return `${year}-${String(month).padStart(2, '0')}-${String(+m[1]).padStart(2, '0')}`;
}

const result = {};

for (const name of fs.readdirSync(base)) {
  const p = path.join(base, name);
  const st = fs.statSync(p);

  if (st.isDirectory() && name !== '.git') {
    const key = parseFolder(name);
    if (!key) continue;
    const files = fs.readdirSync(p);
    const txt = files.find((f) => f.endsWith('.txt'));
    result[key] = {
      folder: name,
      textFile: txt || 'Текстовый документ.txt',
      images: files.filter((f) => imgExt.has(path.extname(f))).sort(),
      videos: files.filter((f) => vidExt.has(path.extname(f))).sort(),
      text: txt ? fs.readFileSync(path.join(p, txt), 'utf8').trim() : ''
    };
  } else if (name.endsWith('.txt')) {
    const key = parseFolder(name.replace('.txt', ''));
    if (key) {
      result[key] = {
        folder: null,
        textFile: name,
        images: [],
        videos: [],
        text: fs.readFileSync(p, 'utf8').trim()
      };
    }
  }
}

const sorted = Object.fromEntries(Object.keys(result).sort().map((k) => [k, result[k]]));

fs.writeFileSync(path.join(base, 'memories.json'), JSON.stringify(sorted, null, 2), 'utf8');
fs.writeFileSync(
  path.join(base, 'memories-data.js'),
  `window.MEMORIES_DATA = ${JSON.stringify(sorted, null, 2)};\n`,
  'utf8'
);

console.log('Готово:', Object.keys(sorted).length, 'дат');
