\
#!/usr/bin/env node
/**
 * apply_map_poi_patch.mjs
 *
 * 목적:
 * - 레포 내 MapView.tsx(DeckGL 사용) 파일을 탐색하여
 *   HVDC POI 레이어(createHvdcPoiLayers)를 자동 주입합니다.
 *
 * 사용:
 *   node scripts/hvdc/apply_map_poi_patch.mjs
 *
 * 주의:
 * - 패턴 기반 주입이므로, MapView 구현이 특이한 경우 수동 통합이 필요할 수 있습니다.
 */

import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = process.cwd();

const IGNORE_DIRS = new Set([
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  'out',
  'coverage'
]);

function walk(dir) {
  const out = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.isDirectory()) {
      if (IGNORE_DIRS.has(e.name)) continue;
      out.push(...walk(path.join(dir, e.name)));
    } else {
      out.push(path.join(dir, e.name));
    }
  }
  return out;
}

function isLikelyMapView(filePath, content) {
  const nameOk = /MapView\.(t|j)sx?$/.test(path.basename(filePath));
  if (!nameOk) return false;
  const hasDeck = content.includes('DeckGL') || content.includes('@deck.gl');
  const hasLayers = content.includes('layers={') || content.includes('layers={[') || content.includes('const layers');
  return hasDeck && hasLayers;
}

function ensureImport(content, importLine) {
  if (content.includes(importLine)) return content;

  // insert after last import line
  const lines = content.split('\n');
  let lastImportIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('import ')) lastImportIdx = i;
  }
  if (lastImportIdx >= 0) {
    lines.splice(lastImportIdx + 1, 0, importLine);
    return lines.join('\n');
  }
  // fallback: prepend
  return `${importLine}\n${content}`;
}

function injectLayers(content) {
  if (content.includes('createHvdcPoiLayers(')) return { content, changed: false };

  // Case 1) inline JSX: layers={[ ... ]}
  const marker1 = 'layers={[';
  const idx1 = content.indexOf(marker1);
  if (idx1 !== -1) {
    const insertPos = idx1 + marker1.length;
    const injected = `${content.slice(0, insertPos)}\n        ...createHvdcPoiLayers(),${content.slice(insertPos)}`;
    return { content: injected, changed: true };
  }

  // Case 2) const layers = [ ... ]
  const re = /const\s+layers\s*=\s*\[/;
  const m = re.exec(content);
  if (m) {
    const insertPos = m.index + m[0].length;
    const injected = `${content.slice(0, insertPos)}\n  ...createHvdcPoiLayers(),${content.slice(insertPos)}`;
    return { content: injected, changed: true };
  }

  return { content, changed: false };
}

function main() {
  const files = walk(REPO_ROOT);

  const candidates = [];
  for (const f of files) {
    if (!/MapView\.(t|j)sx?$/.test(f)) continue;
    const txt = fs.readFileSync(f, 'utf8');
    if (isLikelyMapView(f, txt)) candidates.push({ f, txt });
  }

  if (candidates.length === 0) {
    console.error('[apply_map_poi_patch] MapView.tsx 후보를 찾지 못했습니다.');
    console.error('  - DeckGL을 사용하는 MapView 파일이 없거나, 파일명이 다를 수 있습니다.');
    console.error('  - 수동 통합: apps/logistics-dashboard/components/map/HvdcPoiLayers.ts를 MapView에 import하고 layers 배열에 스프레드하세요.');
    process.exit(1);
  }

  // prefer apps/logistics-dashboard first
  candidates.sort((a, b) => {
    const aScore = a.f.includes(path.join('apps', 'logistics-dashboard')) ? 0 : 1;
    const bScore = b.f.includes(path.join('apps', 'logistics-dashboard')) ? 0 : 1;
    return aScore - bScore;
  });

  const target = candidates[0];
  const filePath = target.f;
  let content = target.txt;

  const rel = path.relative(path.dirname(filePath), path.join(REPO_ROOT, 'apps', 'logistics-dashboard', 'components', 'map', 'HvdcPoiLayers'));
  const relImportPath = rel.startsWith('.') ? rel : `./${rel}`;
  const importLine = `import { createHvdcPoiLayers } from '${relImportPath.replace(/\\/g, '/')}';`;

  content = ensureImport(content, importLine);

  const inj = injectLayers(content);
  if (!inj.changed) {
    console.error('[apply_map_poi_patch] layers 주입 패턴을 찾지 못했습니다. 수동 통합이 필요합니다.');
    console.error(`  - 대상 파일: ${filePath}`);
    process.exit(2);
  }

  fs.writeFileSync(filePath, inj.content, 'utf8');
  console.log('[apply_map_poi_patch] OK');
  console.log(`  - patched: ${filePath}`);
}

main();
