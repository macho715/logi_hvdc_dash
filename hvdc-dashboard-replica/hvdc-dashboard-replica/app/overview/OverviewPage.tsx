/* eslint-disable @next/next/no-img-element */
'use client';

import * as React from 'react';

const DESIGN_W = 2048;
const DESIGN_H = 1365;

type Rect = { x: number; y: number; w: number; h: number };

type KpiCardData = {
  id: string;
  rect: Rect;
  title: string;
  value: string;
  meta?: React.ReactNode;
  theme: 'cool' | 'hot' | 'warm' | 'neutral';
};

type SiteCardData = {
  id: string;
  rect: Rect;
  label: string;
  value: string;
  accent: string;
  theme: string;
  pending: string;
  warehouse: string;
  delta: string;
  deltaTrack: string;
};

type MissionBlock = {
  id: string;
  rect: Rect;
  title: string;
  badge?: string;
  rows: Array<{ accent: string; primary: string; secondary: string }>;
};

const kpiCards: KpiCardData[] = [
  {
    id: 'total',
    rect: { x: 146, y: 135, w: 278, h: 127 },
    title: 'TOTAL SHIPMENTS',
    value: '8,680',
    theme: 'cool',
  },
  {
    id: 'delivered',
    rect: { x: 437, y: 135, w: 278, h: 127 },
    title: 'DELIVERED TO SITE',
    value: '6,622',
    theme: 'cool',
  },
  {
    id: 'open-radar',
    rect: { x: 727, y: 135, w: 323, h: 127 },
    title: 'OPEN RADAR',
    value: '332',
    meta: (
      <div className="mt-2 flex items-center gap-4 text-hud-xs text-[#F4C7B8]">
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-hud-red shadow-glow-amber" />
          228 | 11750
        </span>
        <span className="text-hud-red">Red</span>
      </div>
    ),
    theme: 'hot',
  },
  {
    id: 'overdue',
    rect: { x: 1063, y: 135, w: 323, h: 127 },
    title: 'OVERDUE ETA',
    value: '1,002',
    meta: (
      <div className="mt-2 flex items-center gap-2 text-hud-sm text-hud-red">
        <span className="h-4 w-4 rounded-full bg-hud-orange shadow-[0_0_12px_rgba(255,145,87,.45)]" />
      </div>
    ),
    theme: 'hot',
  },
  {
    id: 'mosb',
    rect: { x: 1398, y: 135, w: 318, h: 127 },
    title: 'MOSB PENDING',
    value: '520',
    meta: (
      <div className="mt-2 flex items-center gap-2 text-hud-xs text-hud-amber">
        <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-hud-amber/40 text-[9px] leading-none">
          ×
        </span>
        Important
      </div>
    ),
    theme: 'warm',
  },
  {
    id: 'agi-readiness',
    rect: { x: 1727, y: 135, w: 279, h: 127 },
    title: 'AGI READINESS',
    value: '1,057',
    meta: (
      <div className="mt-2 grid grid-cols-[auto_auto_auto] gap-x-4 gap-y-1 text-hud-2xs text-hud-textMuted">
        <span className="inline-flex items-center gap-1.5"><Dot color="#51606F" size={8} /> PHU</span>
        <span className="text-hud-amber">15.8%</span>
        <span>DAS 49%</span>
        <span className="inline-flex items-center gap-1.5"><Dot color="#51606F" size={8} /> MIR</span>
        <span className="text-[#F7DF8F]">88.1%</span>
        <span>MAS 99%</span>
      </div>
    ),
    theme: 'cool',
  },
];

const siteCards: SiteCardData[] = [
  {
    id: 'shu',
    rect: { x: 145, y: 864, w: 213, h: 291 },
    label: 'SHU',
    value: '2,962',
    accent: '#58E1C9',
    theme:
      'radial-gradient(120% 160% at 0% 0%, rgba(55,198,171,.18), transparent 55%), linear-gradient(180deg, rgba(15,31,44,.95) 0%, rgba(11,21,34,.98) 100%)',
    pending: '382',
    warehouse: '130gs',
    delta: '+12.5%',
    deltaTrack: '29%',
  },
  {
    id: 'mir',
    rect: { x: 374, y: 864, w: 213, h: 291 },
    label: 'MIR',
    value: '2,753',
    accent: '#5C87FF',
    theme:
      'radial-gradient(120% 160% at 0% 0%, rgba(67,117,246,.2), transparent 55%), linear-gradient(180deg, rgba(17,26,52,.95) 0%, rgba(12,18,37,.98) 100%)',
    pending: '169',
    warehouse: '98.7s',
    delta: '96.7%',
    deltaTrack: '28%',
  },
  {
    id: 'das',
    rect: { x: 604, y: 864, w: 213, h: 291 },
    label: 'DAS',
    value: '2,346',
    accent: '#8A58FF',
    theme:
      'radial-gradient(120% 160% at 0% 0%, rgba(138,88,255,.18), transparent 55%), linear-gradient(180deg, rgba(28,23,49,.95) 0%, rgba(16,14,32,.98) 100%)',
    pending: '971',
    warehouse: '88.3os',
    delta: '00.5%',
    deltaTrack: '26%',
  },
];

const missionBlocks: MissionBlock[] = [
  {
    id: 'critical',
    rect: { x: 1476, y: 866, w: 472, h: 138 },
    title: 'Critical Alerts',
    badge: '1',
    rows: [
      {
        accent: '#FF9C4D',
        primary: 'Operational Blocker',
        secondary: 'AGI ocean Better  –  85.8%  ·  200 sqm',
      },
    ],
  },
  {
    id: 'queue',
    rect: { x: 1476, y: 1018, w: 472, h: 145 },
    title: 'Action Queue',
    badge: '224',
    rows: [
      {
        accent: '#F5C366',
        primary: 'Pending of MOSB  ·  6A2',
        secondary: 'AGI meting Blocked  ·  441  ·  755 egm',
      },
    ],
  },
  {
    id: 'next72',
    rect: { x: 1476, y: 1178, w: 472, h: 144 },
    title: 'Next 72 Hours',
    badge: '325',
    rows: [
      {
        accent: '#FF7D52',
        primary: 'Hitachi C  ·  from Shaqrin  ·  16S sqm  —  Jetlet Al port',
        secondary: '',
      },
      {
        accent: '#4E88FF',
        primary: 'Prysmian A  ·  La Havre  ·  3L4 sqm  —  Mina Zayed',
        secondary: '',
      },
    ],
  },
];

const flowStats = [
  { value: '781', label: 'Flow 0', x: 170, width: 90 },
  { value: '?', label: 'Flow 1', x: 280, width: 56 },
  { value: '2,593', label: 'Flow 8', x: 378, width: 96 },
  { value: '1,652', label: 'Flow 2', x: 552, width: 96 },
  { value: '547', label: 'Flow 3', x: 704, width: 80 },
  { value: '3,262', label: 'Flow 4', x: 883, width: 98 },
  { value: '32', label: 'Flow 5', x: 1122, width: 48 },
  { value: '6,680', label: 'Feat instmts', x: 1322, width: 110 },
];

const tabs = [
  { label: 'LOGISTICS CHAIN', active: true, x: 145, y: 1275, w: 280, h: 55 },
  { label: 'PIPELINE', active: false, x: 430, y: 1275, w: 220, h: 55 },
  { label: 'SITES', active: false, x: 654, y: 1275, w: 206, h: 55 },
  { label: 'CARGO', active: false, x: 864, y: 1275, w: 230, h: 55 },
];

export default function OverviewPage() {
  const frameRef = React.useRef<HTMLDivElement>(null);
  const scale = useArtboardScale(frameRef, DESIGN_W);

  return (
    <div className="min-h-screen bg-[#040814] p-6 text-hud-text">
      <div
        ref={frameRef}
        className="relative mx-auto w-full max-w-[1700px] overflow-hidden rounded-[30px] border border-white/5 bg-hud-shell shadow-[0_30px_100px_rgba(0,0,0,.6)] aspect-[2048/1365]"
      >
        <div
          className="absolute left-0 top-0 origin-top-left overflow-hidden"
          style={{ width: DESIGN_W, height: DESIGN_H, transform: `scale(${scale})` }}
        >
          <ArtboardBackground />
          <SidebarRail />
          <TopBar />
          <KpiRow />
          <MainMapPanel />
          <SectionHeader title="Site Health Matrix" rect={{ x: 145, y: 806, w: 1295, h: 40 }} />
          <SectionHeader title="Mission Control" rect={{ x: 1476, y: 806, w: 472, h: 40 }} withChevron />
          <HealthMatrix />
          <MissionControl />
          <FlowSummary />
          <BottomTabs />
        </div>
      </div>
    </div>
  );
}

function ArtboardBackground() {
  return (
    <>
      <div className="absolute inset-0 bg-hud-shell" />
      <div
        className="absolute inset-0 opacity-35"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px)',
          backgroundSize: '70px 70px',
          maskImage: 'linear-gradient(180deg, rgba(0,0,0,.55), transparent 75%)',
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_0%,rgba(53,110,255,.18),transparent_18%),radial-gradient(circle_at_76%_32%,rgba(255,118,92,.1),transparent_22%),radial-gradient(circle_at_88%_86%,rgba(53,110,255,.14),transparent_22%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,.22)_100%)]" />
    </>
  );
}

function SidebarRail() {
  const itemY = [36, 94, 166, 229, 292, 355];

  return (
    <Box rect={{ x: 0, y: 0, w: 110, h: DESIGN_H }} className="border-r border-white/5 bg-[linear-gradient(180deg,rgba(9,15,30,.95),rgba(5,10,24,.98))]">
      <div className="absolute inset-y-0 right-0 w-px bg-[linear-gradient(180deg,rgba(59,86,165,.14),rgba(59,86,165,0))]" />
      <div className="absolute left-[20px] top-[36px]">
        <IconButton active={false} icon={<MiniWindowIcon />} />
      </div>
      <div className="absolute left-[8px] top-[78px] h-[68px] w-[68px] rounded-[18px] border border-[#2F76FF]/45 bg-[linear-gradient(180deg,rgba(47,118,255,.95),rgba(36,94,216,.95))] shadow-glow-blue">
        <div className="grid h-full place-items-center">
          <SearchIcon className="h-6 w-6 text-white" />
        </div>
      </div>
      <div className="absolute left-[28px] top-[166px]">
        <IconButton active={false} icon={<CompassIcon />} />
      </div>
      <div className="absolute left-[28px] top-[229px]">
        <IconButton active={false} icon={<HelpIcon />} />
      </div>
      <div className="absolute left-[28px] top-[292px]">
        <IconButton active={false} icon={<CubeIcon />} />
      </div>
      <div className="absolute left-[28px] top-[355px]">
        <IconButton active={false} icon={<ChatIcon />} />
      </div>
    </Box>
  );
}

function TopBar() {
  return (
    <>
      <div className="absolute left-[138px] top-[29px] text-[26px] font-semibold tracking-[0.06em] text-white">
        HVDC CONTROL TOWER
      </div>

      <div className="absolute left-[145px] top-[84px] h-[50px] w-[865px] rounded-[18px] border border-[#1E2A48] bg-[linear-gradient(180deg,rgba(14,21,40,.96),rgba(11,16,31,.98))] shadow-panel">
        <div className="absolute left-[18px] top-1/2 -translate-y-1/2">
          <SearchIcon className="h-5 w-5 text-[#2F76FF]" />
        </div>
        <div className="absolute left-[48px] top-1/2 -translate-y-1/2 text-hud-sm text-hud-textMuted">
          Search HVDC / Project / Vendor / Flow...
        </div>
      </div>

      <Chip x={1030} y={88} w={115} label="Origin Arc" active icon={<Dot color="#6EB2FF" size={10} />} />
      <Chip x={1162} y={88} w={113} label="Voyage" icon={<ShipIcon className="h-4 w-4 text-[#CFD8F4]" />} />
      <Chip x={1292} y={88} w={128} label="Next 72h" active icon={<ThumbIcon className="h-4 w-4 text-[#FFD39A]" />} />
      <Chip x={1438} y={88} w={112} label="Heatmap" icon={<Dot color="#FF8B45" size={10} />} />

      <div className="absolute left-[1768px] top-[34px] text-hud-xs text-hud-textMuted">Updated:06:45:23</div>

      <div className="absolute left-[1881px] top-[26px] flex h-[40px] w-[123px] items-center justify-between rounded-full border border-white/6 bg-[linear-gradient(180deg,rgba(12,18,34,.96),rgba(8,13,26,.98))] px-3 shadow-panel">
        <span className="inline-flex h-[30px] w-[52px] items-center justify-center rounded-full bg-[linear-gradient(180deg,rgba(47,118,255,.92),rgba(56,125,255,.8))] text-hud-xs font-semibold text-white shadow-glow-blue">
          ENG
        </span>
        <span className="text-hud-xs font-medium text-hud-textMuted">한국어</span>
      </div>
    </>
  );
}

function KpiRow() {
  return (
    <>
      {kpiCards.map((card) => (
        <KpiCard key={card.id} data={card} />
      ))}
    </>
  );
}

function MainMapPanel() {
  return (
    <Box
      rect={{ x: 132, y: 293, w: 1872, h: 493 }}
      className="overflow-hidden rounded-[28px] border border-white/6 bg-[linear-gradient(180deg,rgba(10,16,30,.6),rgba(7,12,25,.4))]"
    >
      <MapLegendRail />
      <div className="absolute left-[418px] top-[0px] h-full w-[1454px] overflow-hidden rounded-[0_24px_24px_0]">
        <img
          src="/assets/hvdc-map-main.png"
          alt="HVDC network map"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,12,21,.04),rgba(8,12,21,.18))]" />
      </div>
    </Box>
  );
}

function MapLegendRail() {
  return (
    <Box
      rect={{ x: 0, y: 0, w: 418, h: 493 }}
      className="border-r border-white/5 bg-[linear-gradient(180deg,rgba(11,17,31,.96),rgba(8,13,25,.98))]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(150%_150%_at_0%_0%,rgba(70,113,250,.14),transparent_55%)]" />
      <div className="absolute left-[24px] top-[22px] h-[380px] w-[321px] rounded-[20px] border border-[#24314E] bg-[linear-gradient(180deg,rgba(18,27,49,.88),rgba(12,19,34,.9))] p-[18px] shadow-panel">
        <div className="mb-5 flex items-center gap-5 text-hud-2xs uppercase tracking-[0.18em] text-hud-textMuted">
          <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full border border-[#7080A7] bg-transparent" /> Hode</span>
          <span>4lissinpront</span>
        </div>

        <div className="space-y-4 text-hud-sm text-hud-textSoft">
          <LegendItem color="#4C5A9B" title="Annor" subtitle="Surtinens" />
          <LegendItem color="#D1BE72" title="Warehous" subtitle="Hamages" />
          <LegendItem color="#D1BE72" title="MOSB Yard" subtitle="Flonts" />
          <LegendItem color="#6170C8" title="HVDC Sites" subtitle="Emropects" bulb />
        </div>

        <div className="mt-5 rounded-[18px] border border-white/5 bg-[linear-gradient(180deg,rgba(24,31,56,.94),rgba(16,22,39,.98))] p-4">
          <div className="space-y-2.5 text-hud-sm text-hud-textSoft">
            <LegendItem color="#D1BE72" title="Origin" subtitle="Atipor" small />
            <LegendItem color="#A8AEB8" title="Rose (Vaport" subtitle="" hollow small />
            <LegendItem color="#A8AEB8" title="Warehoss" subtitle="" hollow small />
            <LegendItem color="#FFC56E" title="MOSB Yard" subtitle="" square small />
            <LegendItem color="#6B87FF" title="Flow.t" subtitle="Wh" square small />
          </div>
        </div>

        <div className="absolute bottom-[18px] left-[18px] right-[18px] rounded-[14px] border border-white/5 bg-[linear-gradient(180deg,rgba(14,21,38,.9),rgba(10,15,28,.96))] px-4 py-3">
          <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-hud-textMuted">
            <span className="inline-flex items-center gap-2">
              <span className="flex gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-[#5EE3CB]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#FFC56E]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#5C87FF]" />
              </span>
              Gate Voyared
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm bg-[#5C87FF]" />
              <span className="h-2.5 w-2.5 rounded-sm bg-[#FFC56E]" />
            </span>
          </div>
          <div className="flex items-center justify-between text-hud-2xs text-hud-textSoft">
            <span>✦  W1.  Porqfhr</span>
            <span>S5I9</span>
          </div>
        </div>
      </div>
    </Box>
  );
}

function HealthMatrix() {
  return (
    <>
      {siteCards.map((site) => (
        <SiteCard key={site.id} data={site} />
      ))}

      <Box
        rect={{ x: 834, y: 864, w: 606, h: 291 }}
        className="overflow-hidden rounded-[22px] border border-white/6 bg-[linear-gradient(180deg,rgba(16,21,39,.96),rgba(10,14,28,.98))] shadow-panel"
      >
        <div className="absolute inset-0 bg-[radial-gradient(120%_150%_at_10%_0%,rgba(255,193,94,.14),transparent_55%),radial-gradient(80%_110%_at_100%_100%,rgba(45,118,255,.12),transparent_50%)]" />
        <div className="absolute left-[26px] top-[20px] text-[34px] font-semibold tracking-[0.02em] text-[#F5D36F]">
          AGI
        </div>
        <div className="absolute left-[26px] top-[72px] text-[56px] font-semibold leading-none text-white">
          1,027
        </div>
        <div className="absolute left-[166px] top-[82px] text-[18px] font-medium text-hud-textMuted">53% · 16.9%</div>
        <div className="absolute left-[28px] top-[124px] text-hud-xs font-semibold uppercase tracking-[0.12em] text-white">SH2</div>
        <div className="absolute left-[96px] top-[126px] h-[10px] w-[180px] rounded-full bg-white/8">
          <div className="h-full w-[118px] rounded-full bg-[linear-gradient(90deg,#FFCC69,#F5A948)] shadow-glow-amber" />
        </div>

        <div className="absolute inset-y-[22px] right-[20px] w-[170px] rounded-[20px] bg-[linear-gradient(180deg,rgba(12,18,35,.85),rgba(9,13,26,.92))]">
          <div className="absolute right-[18px] top-[18px] text-[60px] font-semibold leading-none tracking-[-0.05em] text-white">9,299</div>
          <div className="absolute right-[18px] top-[110px] text-[44px] font-semibold leading-none tracking-[-0.04em] text-[#5C87FF]">2,892</div>
          <div className="absolute right-[18px] top-[152px] text-hud-sm text-hud-textMuted">26.3%</div>
          <div className="absolute right-[18px] top-[186px] text-[42px] font-semibold leading-none text-white">578</div>
          <div className="absolute right-[18px] top-[226px] text-hud-sm text-hud-textMuted">206.1%</div>
          <div className="absolute right-[18px] top-[240px] text-[42px] font-semibold leading-none text-[#5C87FF]">712%</div>
        </div>

        <div className="absolute left-[230px] top-[84px] h-[188px] w-[275px] overflow-hidden rounded-[18px]">
          <img
            src="/assets/hvdc-map-mini.png"
            alt="AGI site mini network map"
            className="h-full w-full object-cover opacity-95"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,11,22,.02),rgba(8,11,22,.18))]" />
        </div>
      </Box>
    </>
  );
}

function MissionControl() {
  return (
    <>
      {missionBlocks.map((block) => (
        <MissionPanel key={block.id} block={block} />
      ))}
    </>
  );
}

function FlowSummary() {
  return (
    <Box
      rect={{ x: 145, y: 1168, w: 1295, h: 101 }}
      className="overflow-hidden rounded-[18px] border border-white/5 bg-[linear-gradient(180deg,rgba(11,17,31,.88),rgba(8,12,25,.95))] px-6 py-5"
    >
      <div className="absolute left-[18px] top-[-40px] text-[18px] font-medium text-hud-textSoft">Flow Summary</div>
      <svg viewBox="0 0 1295 95" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="flowLine" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#F8D870" />
            <stop offset="28%" stopColor="#70EAD4" />
            <stop offset="57%" stopColor="#8A58FF" />
            <stop offset="80%" stopColor="#7EA2FF" />
            <stop offset="100%" stopColor="#D6D7EE" />
          </linearGradient>
          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d="M88 58 C140 53, 167 56, 211 56 S 308 42, 343 41 S 451 29, 497 31 S 573 58, 621 55 S 725 47, 768 48 S 886 59, 930 58 S 1050 58, 1180 57"
          fill="none"
          stroke="url(#flowLine)"
          strokeWidth="5"
          strokeLinecap="round"
          filter="url(#softGlow)"
          opacity="0.95"
        />
        {[116, 329, 455, 610].map((cx, index) => (
          <circle
            key={cx}
            cx={cx}
            cy={index % 2 ? 42 : 53}
            r="9"
            fill={index === 0 ? '#171D30' : '#171D30'}
            stroke={['#6C5D42', '#6AD9D0', '#F4D26E', '#6AD9D0'][index]}
            strokeWidth="4"
          />
        ))}
      </svg>

      <div className="absolute inset-x-0 top-[10px]">
        {flowStats.map((item) => (
          <div key={item.label} className="absolute text-center" style={{ left: item.x, width: item.width }}>
            <div className="text-[22px] font-semibold tracking-[-0.03em] text-white">{item.value}</div>
            <div className="mt-1 text-hud-2xs text-hud-textMuted">{item.label}</div>
          </div>
        ))}
      </div>

      <div className="absolute right-[44px] top-[66px] text-hud-2xs text-hud-textMuted">Sr / des</div>
    </Box>
  );
}

function BottomTabs() {
  return (
    <>
      {tabs.map((tab) => (
        <Box
          key={tab.label}
          rect={{ x: tab.x, y: tab.y, w: tab.w, h: tab.h }}
          className={`rounded-full border ${
            tab.active
              ? 'border-white/8 bg-[linear-gradient(180deg,rgba(17,24,46,.96),rgba(10,16,31,.98))] shadow-panel'
              : 'border-white/6 bg-[linear-gradient(180deg,rgba(14,20,37,.82),rgba(10,14,27,.94))]'
          }`}
        >
          <div className="flex h-full items-center justify-center gap-3 text-hud-md font-medium tracking-[0.02em] text-hud-textSoft">
            <span className={`inline-flex h-5 w-5 items-center justify-center rounded ${tab.active ? 'bg-[#26345A]' : 'bg-transparent'}`}>
              {tab.label === 'PIPELINE' ? <PipeIcon className="h-4 w-4 text-hud-textMuted" /> : null}
              {tab.label === 'SITES' ? <ArrowRightIcon className="h-4 w-4 text-hud-textMuted" /> : null}
              {tab.label === 'CARGO' ? <CubeIcon className="h-4 w-4 text-hud-textMuted" /> : null}
            </span>
            {tab.label}
            <span className="text-hud-textMuted">›</span>
          </div>
        </Box>
      ))}
    </>
  );
}

function SectionHeader({
  title,
  rect,
  withChevron = false,
}: {
  title: string;
  rect: Rect;
  withChevron?: boolean;
}) {
  return (
    <Box rect={rect} className="">
      <div className="absolute left-0 top-0 text-[18px] font-medium text-hud-textSoft">{title}</div>
      <div className="absolute left-[204px] top-[20px] h-px w-[calc(100%-220px)] bg-[linear-gradient(90deg,rgba(77,100,166,.65),rgba(77,100,166,.12),rgba(77,100,166,0))]" />
      {withChevron ? (
        <div className="absolute right-[0px] top-[2px] flex items-center gap-3 text-hud-textMuted">
          <span className="text-lg">◐</span>
          <span>»</span>
        </div>
      ) : null}
    </Box>
  );
}

function KpiCard({ data }: { data: KpiCardData }) {
  const themeClass =
    data.theme === 'hot'
      ? 'bg-hud-card-hot'
      : data.theme === 'warm'
        ? 'bg-hud-card-warm'
        : 'bg-hud-card';

  return (
    <Box
      rect={data.rect}
      className={`overflow-hidden rounded-[22px] border border-white/6 ${themeClass} shadow-panel backdrop-blur-hud`}
    >
      <div className="absolute inset-0 opacity-55" style={{ backgroundImage: 'radial-gradient(circle at 22% 28%, rgba(87,126,255,.2), transparent 34%), radial-gradient(circle at 74% 40%, rgba(255,115,91,.16), transparent 28%), radial-gradient(circle at 48% 78%, rgba(255,255,255,.045), transparent 16%)' }} />
      <div className="relative h-full px-6 py-5">
        <div className="text-[12px] font-medium tracking-[0.18em] text-hud-textMuted">{data.title}</div>
        <div className="mt-4 flex items-end gap-3">
          <div className="text-hud-xl font-semibold tracking-[-0.05em] text-white">{data.value}</div>
          {data.id === 'overdue' ? <span className="mb-1 inline-flex h-4 w-4 rounded-full bg-hud-orange shadow-[0_0_12px_rgba(255,145,87,.45)]" /> : null}
        </div>
        {data.meta}
      </div>
    </Box>
  );
}

function SiteCard({ data }: { data: SiteCardData }) {
  return (
    <Box
      rect={data.rect}
      className="overflow-hidden rounded-[22px] border border-white/6 shadow-panel"
      style={{ backgroundImage: data.theme }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,.02),rgba(255,255,255,0))]" />
      <div className="relative h-full px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="text-[34px] font-semibold tracking-[0.02em]" style={{ color: data.accent }}>
            {data.label}
          </div>
          <div className="text-hud-xs text-hud-textMuted">◭  ⌂</div>
        </div>
        <div className="mt-2 flex items-start gap-3">
          <div className="text-[50px] font-semibold leading-none tracking-[-0.05em] text-white">{data.value}</div>
          <div className="mt-2 text-hud-sm text-hud-textMuted">Total<br />Assinets</div>
        </div>

        <div className="mt-6 space-y-3 text-hud-sm text-hud-textSoft">
          <div className="flex items-center gap-4">
            <span className="text-hud-textMuted">Pending</span>
            <span className="font-semibold text-white">{data.pending}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-hud-textMuted">Warehouse</span>
            <span className="font-medium text-white">{data.warehouse}</span>
          </div>
        </div>

        <div className="absolute bottom-[20px] left-[18px] right-[18px] h-[18px] rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,.06),rgba(255,255,255,.08))]">
          <div className="relative h-full rounded-full" style={{ background: `linear-gradient(90deg, ${data.accent}40, ${data.accent}B3)` }}>
            <div
              className="absolute left-[12px] top-1/2 -translate-y-1/2 text-[11px] font-semibold"
              style={{ color: data.accent }}
            >
              {data.delta}
            </div>
            <div className="absolute right-[12px] top-1/2 -translate-y-1/2 text-[11px] font-medium text-hud-textMuted">
              {data.deltaTrack}
            </div>
          </div>
        </div>
      </div>
    </Box>
  );
}

function MissionPanel({ block }: { block: MissionBlock }) {
  return (
    <Box
      rect={block.rect}
      className="overflow-hidden rounded-[22px] border border-white/6 bg-[linear-gradient(180deg,rgba(12,18,34,.95),rgba(8,13,26,.98))] px-5 py-4 shadow-panel"
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="text-[16px] font-medium text-white">{block.title}</div>
        {block.badge ? (
          <span className="inline-flex min-w-[28px] items-center justify-center rounded-full bg-white/6 px-2 py-0.5 text-hud-xs font-semibold text-[#F3C562]">
            {block.badge}
          </span>
        ) : null}
        {block.id === 'next72' ? <span className="ml-auto text-hud-2xs text-hud-textMuted">Incoming Chocket</span> : null}
      </div>

      <div className="space-y-3">
        {block.rows.map((row, index) => (
          <div
            key={`${block.id}-${index}`}
            className="flex min-h-[64px] items-start gap-3 rounded-[16px] border border-white/5 bg-[linear-gradient(180deg,rgba(17,23,42,.9),rgba(10,14,28,.95))] px-4 py-3"
          >
            <div className="mt-1 h-[42px] w-[4px] rounded-full" style={{ backgroundColor: row.accent }} />
            <div className="flex-1">
              <div className="text-[15px] font-medium text-white">{row.primary}</div>
              {row.secondary ? <div className="mt-1 text-hud-xs text-hud-textMuted">{row.secondary}</div> : null}
            </div>
            <div className="grid h-8 w-8 place-items-center rounded-md border border-white/6 bg-white/[0.03] text-hud-textMuted">
              <LockIcon className="h-4 w-4" />
            </div>
          </div>
        ))}
      </div>
    </Box>
  );
}

function Chip({
  x,
  y,
  w,
  label,
  active = false,
  icon,
}: {
  x: number;
  y: number;
  w: number;
  label: string;
  active?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <Box
      rect={{ x, y, w, h: 38 }}
      className={`rounded-full border px-4 ${
        active
          ? 'border-[#2F76FF]/40 bg-[linear-gradient(180deg,rgba(47,118,255,.92),rgba(35,95,218,.84))] shadow-glow-blue'
          : 'border-white/6 bg-[linear-gradient(180deg,rgba(18,23,39,.92),rgba(11,16,29,.95))]'
      }`}
    >
      <div className="flex h-full items-center justify-center gap-2 text-hud-xs font-medium text-white">
        {icon}
        <span className={active ? 'text-white' : 'text-hud-textSoft'}>{label}</span>
        {!active ? <span className="text-hud-textMuted">▼</span> : null}
      </div>
    </Box>
  );
}

function IconButton({
  active,
  icon,
}: {
  active: boolean;
  icon: React.ReactNode;
}) {
  return (
    <div
      className={`grid h-[26px] w-[26px] place-items-center rounded-full border ${
        active
          ? 'border-[#2F76FF]/60 bg-[#2F76FF]/18 text-white'
          : 'border-white/10 bg-transparent text-hud-textMuted'
      }`}
    >
      {icon}
    </div>
  );
}

function LegendItem({
  color,
  title,
  subtitle,
  bulb = false,
  hollow = false,
  square = false,
  small = false,
}: {
  color: string;
  title: string;
  subtitle: string;
  bulb?: boolean;
  hollow?: boolean;
  square?: boolean;
  small?: boolean;
}) {
  const size = small ? 10 : 12;
  const shared = {
    width: size,
    height: size,
  };

  return (
    <div className="flex items-center gap-3">
      {square ? (
        <span className="inline-block rounded-sm" style={{ ...shared, backgroundColor: color }} />
      ) : hollow ? (
        <span className="inline-block rounded-full border" style={{ ...shared, borderColor: color }} />
      ) : bulb ? (
        <span className="inline-flex items-center justify-center rounded-full" style={{ ...shared, backgroundColor: `${color}22`, border: `1px solid ${color}55` }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
        </span>
      ) : (
        <span className="inline-block rounded-full" style={{ ...shared, backgroundColor: color }} />
      )}
      <span className="font-medium text-white">{title}</span>
      {subtitle ? <span className="text-hud-textMuted">- {subtitle}</span> : null}
    </div>
  );
}

function Box({
  rect,
  className,
  style,
  children,
}: {
  rect: Rect;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`absolute ${className ?? ''}`}
      style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h, ...style }}
    >
      {children}
    </div>
  );
}

function Dot({ color, size = 10 }: { color: string; size?: number }) {
  return <span className="inline-block rounded-full" style={{ width: size, height: size, backgroundColor: color }} />;
}

function useArtboardScale(ref: React.RefObject<HTMLDivElement | null>, designWidth: number) {
  const [scale, setScale] = React.useState(1);

  React.useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;

    const update = () => setScale(node.clientWidth / designWidth);
    update();

    const observer = new ResizeObserver(() => update());
    observer.observe(node);

    return () => observer.disconnect();
  }, [designWidth, ref]);

  return scale;
}

/* ---------- inline icon set: no external dependency ---------- */

function SearchIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.8">
      <circle cx="11" cy="11" r="6.3" />
      <path d="M16.2 16.2L20 20" strokeLinecap="round" />
    </svg>
  );
}

function MiniWindowIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="5" y="4.5" width="14" height="15" rx="2.5" />
      <path d="M8 8.5h8" />
    </svg>
  );
}

function CompassIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="7" />
      <path d="M9.5 14.5l1.2-4.2 4.2-1.2-1.2 4.2-4.2 1.2z" />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="7" />
      <path d="M9.5 9.5a2.5 2.5 0 0 1 5 0c0 1.4-1.6 1.9-2.4 2.7-.5.5-.6.9-.6 1.3" />
      <circle cx="12" cy="16.8" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

function CubeIcon({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3.8l7 4v8.4l-7 4-7-4V7.8l7-4z" />
      <path d="M12 12l7-4M12 12L5 8M12 12v8.2" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 7.5h12a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-7l-4 3v-3H6a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2z" />
    </svg>
  );
}

function ShipIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 14.8l2.2 3h11.6l2.2-3-8-7-8 7z" />
      <path d="M6.5 18.2c1 .9 2 .9 3 0 1 .9 2 .9 3 0 1 .9 2 .9 3 0 1 .9 2 .9 3 0" strokeLinecap="round" />
    </svg>
  );
}

function ThumbIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M9.8 10.2V6.6c0-1.9 1-3.6 2.7-4.5l.8-.4.9 1.6-.8.4c-.8.4-1.3 1.3-1.3 2.2v4.3h6.1c1.4 0 2.4 1.3 2.1 2.6l-1.5 6.4a2.4 2.4 0 0 1-2.3 1.9H9.4a2.4 2.4 0 0 1-2.4-2.4V10.2h2.8zM3 10.6h2.5v10.2H3z" />
    </svg>
  );
}

function PipeIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 12h8a4 4 0 0 0 4-4V4" />
      <path d="M4 8v8" />
      <path d="M16 4h4v4" />
    </svg>
  );
}

function ArrowRightIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}

function LockIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="6.5" y="10.5" width="11" height="8.5" rx="2" />
      <path d="M9 10V8.4a3 3 0 0 1 6 0V10" />
    </svg>
  );
}
