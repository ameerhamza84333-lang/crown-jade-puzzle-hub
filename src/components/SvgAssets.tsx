import React from 'react';

export const CrownIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M3 18L4.8 7.5L9.5 11.5L12 5L14.5 11.5L19.2 7.5L21 18H3Z"
      fill="url(#crownGrad)"
      stroke="#B45309"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
    <rect x="3.5" y="18.2" width="17" height="2.6" rx="1.2" fill="#F59E0B" stroke="#B45309" strokeWidth="1.2" />
    <circle cx="12" cy="4.2" r="1.3" fill="#FDE047" />
    <circle cx="4.5" cy="6.8" r="1.1" fill="#FDE047" />
    <circle cx="19.5" cy="6.8" r="1.1" fill="#FDE047" />
    <defs>
      <linearGradient id="crownGrad" x1="3" y1="5" x2="21" y2="19" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FDE047" />
        <stop offset="0.55" stopColor="#F59E0B" />
        <stop offset="1" stopColor="#D97706" />
      </linearGradient>
    </defs>
  </svg>
);

export const StarIcon: React.FC<{ className?: string; filled?: boolean }> = ({
  className = 'w-6 h-6',
  filled = true,
}) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M12 2.5L14.9 8.4L21.4 9.3L16.7 13.9L17.8 20.4L12 17.3L6.2 20.4L7.3 13.9L2.6 9.3L9.1 8.4L12 2.5Z"
      fill={filled ? 'url(#starGrad)' : 'rgba(255,255,255,0.14)'}
      stroke={filled ? '#B45309' : 'rgba(255,255,255,0.28)'}
      strokeWidth="1.3"
      strokeLinejoin="round"
    />
    <defs>
      <linearGradient id="starGrad" x1="4" y1="2" x2="20" y2="21" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FEF08A" />
        <stop offset="0.5" stopColor="#FACC15" />
        <stop offset="1" stopColor="#EA580C" />
      </linearGradient>
    </defs>
  </svg>
);

export const GemIcon: React.FC<{
  className?: string;
  variant?: 'cyan' | 'ruby' | 'emerald' | 'amber';
}> = ({ className = 'w-5 h-5', variant = 'cyan' }) => {
  const palette = {
    cyan: { top: '#67E8F9', mid: '#06B6D4', dark: '#0E7490', stroke: '#155E75' },
    ruby: { top: '#FDA4AF', mid: '#F43F5E', dark: '#BE123C', stroke: '#881337' },
    emerald: { top: '#6EE7B7', mid: '#10B981', dark: '#047857', stroke: '#064E3B' },
    amber: { top: '#FDE68A', mid: '#F59E0B', dark: '#B45309', stroke: '#78350F' },
  }[variant];

  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <polygon points="7,3 17,3 22,9 12,21 2,9" fill={palette.mid} stroke={palette.stroke} strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="7,3 17,3 15.2,9 8.8,9" fill={palette.top} />
      <polygon points="8.8,9 15.2,9 12,21" fill={palette.dark} opacity="0.5" />
      <polygon points="2,9 8.8,9 12,21" fill={palette.dark} opacity="0.28" />
      <polygon points="7,3 8.8,9 2,9" fill={palette.top} opacity="0.65" />
    </svg>
  );
};

export const BrandEmblemSvg: React.FC<{ className?: string }> = ({ className = 'w-12 h-12' }) => (
  <svg viewBox="0 0 56 56" fill="none" className={className} aria-hidden="true">
    {/* Sapphire Block Cluster */}
    <rect x="4" y="10" width="22" height="22" rx="5" fill="#2563EB" stroke="#93C5FD" strokeWidth="1.6" />
    <rect x="7" y="13" width="16" height="6" rx="2.5" fill="#60A5FA" opacity="0.6" />
    <rect x="16" y="24" width="22" height="22" rx="5" fill="#10B981" stroke="#A7F3D0" strokeWidth="1.6" />
    <rect x="19" y="27" width="16" height="6" rx="2.5" fill="#6EE7B7" opacity="0.55" />
    {/* Gold Mahjong Accent Tile */}
    <rect x="28" y="6" width="22" height="26" rx="5" fill="#FFFBEB" stroke="#F59E0B" strokeWidth="2" />
    <path
      d="M39 12.5L41.5 16.5L44 13.5L43 21H35L34 13.5L36.5 16.5L39 12.5Z"
      fill="#D97706"
      stroke="#92400E"
      strokeWidth="1"
      strokeLinejoin="round"
    />
    <rect x="35" y="22.5" width="8" height="2.2" rx="1" fill="#B45309" />
  </svg>
);

export const BlockPreviewSvg: React.FC<{ className?: string }> = ({ className = 'w-20 h-20' }) => (
  <svg viewBox="0 0 88 88" fill="none" className={className} aria-hidden="true">
    <rect x="4" y="4" width="80" height="80" rx="14" fill="#0B1F54" stroke="rgba(147,197,253,0.32)" strokeWidth="1.5" />
    {/* 3x3 Mini Grid */}
    {[0, 1, 2].map((r) =>
      [0, 1, 2].map((c) => (
        <rect
          key={`${r}-${c}`}
          x={14 + c * 21}
          y={14 + r * 21}
          width="18"
          height="18"
          rx="4"
          fill="#163278"
        />
      )),
    )}
    {/* L-piece Cyan */}
    {[
      [0, 0],
      [1, 0],
      [2, 0],
      [2, 1],
    ].map(([r, c], i) => (
      <g key={`c-${i}`}>
        <rect x={14 + c * 21} y={14 + r * 21} width="18" height="18" rx="4" fill="#06B6D4" stroke="#67E8F9" strokeWidth="1.2" />
        <rect x={16.5 + c * 21} y={16.5 + r * 21} width="13" height="4.5" rx="2" fill="#A5F3FC" opacity="0.55" />
      </g>
    ))}
    {/* Square Amber */}
    {[
      [0, 1],
      [0, 2],
      [1, 2],
    ].map(([r, c], i) => (
      <g key={`a-${i}`}>
        <rect x={14 + c * 21} y={14 + r * 21} width="18" height="18" rx="4" fill="#F59E0B" stroke="#FDE68A" strokeWidth="1.2" />
        <rect x={16.5 + c * 21} y={16.5 + r * 21} width="13" height="4.5" rx="2" fill="#FEF3C7" opacity="0.55" />
      </g>
    ))}
    {/* Gem Cell */}
    <rect x={14 + 2 * 21} y={14 + 2 * 21} width="18" height="18" rx="4" fill="#EC4899" stroke="#F9A8D4" strokeWidth="1.2" />
    <polygon points="65,59 69,63 65,71 61,63" fill="#FDF2F8" opacity="0.9" />
  </svg>
);

export const MahjongPreviewSvg: React.FC<{ className?: string }> = ({ className = 'w-20 h-20' }) => (
  <svg viewBox="0 0 88 88" fill="none" className={className} aria-hidden="true">
    {/* Back tile */}
    <rect x="12" y="16" width="38" height="50" rx="7" fill="#065F46" />
    <rect x="12" y="13" width="38" height="48" rx="7" fill="#FEFCE8" stroke="#D97706" strokeWidth="1.5" />
    <circle cx="31" cy="31" r="6" fill="#DC2626" />
    <circle cx="31" cy="31" r="2.2" fill="#FEFCE8" />
    <circle cx="31" cy="46" r="6" fill="#059669" />
    <circle cx="31" cy="46" r="2.2" fill="#FEFCE8" />
    {/* Front overlapping tile */}
    <rect x="38" y="24" width="38" height="50" rx="7" fill="#064E3B" />
    <rect x="38" y="20" width="38" height="48" rx="7" fill="#FFFBEB" stroke="#F59E0B" strokeWidth="1.8" />
    <text
      x="57"
      y="49"
      textAnchor="middle"
      fill="#B91C1C"
      fontSize="24"
      fontWeight="800"
      fontFamily="serif"
    >
      中
    </text>
  </svg>
);

// ============================================================================
// Mahjong Tile Face SVG Renderer (34 Distinct Crisp Offline Vector Tiles)
// ============================================================================

const DOT_LAYOUTS: Record<number, Array<[number, number, string]>> = {
  1: [[50, 54, '#DC2626']],
  2: [
    [50, 34, '#059669'],
    [50, 72, '#1D4ED8'],
  ],
  3: [
    [32, 30, '#1D4ED8'],
    [50, 53, '#DC2626'],
    [68, 76, '#059669'],
  ],
  4: [
    [34, 34, '#1D4ED8'],
    [66, 34, '#059669'],
    [34, 72, '#059669'],
    [66, 72, '#1D4ED8'],
  ],
  5: [
    [32, 30, '#1D4ED8'],
    [68, 30, '#059669'],
    [50, 53, '#DC2626'],
    [32, 76, '#059669'],
    [68, 76, '#1D4ED8'],
  ],
  6: [
    [35, 29, '#059669'],
    [65, 29, '#059669'],
    [35, 53, '#DC2626'],
    [65, 53, '#DC2626'],
    [35, 77, '#DC2626'],
    [65, 77, '#DC2626'],
  ],
  7: [
    [30, 26, '#059669'],
    [50, 32, '#059669'],
    [70, 38, '#059669'],
    [34, 58, '#DC2626'],
    [66, 58, '#DC2626'],
    [34, 79, '#DC2626'],
    [66, 79, '#DC2626'],
  ],
  8: [
    [35, 25, '#1D4ED8'],
    [65, 25, '#1D4ED8'],
    [35, 44, '#1D4ED8'],
    [65, 44, '#1D4ED8'],
    [35, 63, '#1D4ED8'],
    [65, 63, '#1D4ED8'],
    [35, 82, '#1D4ED8'],
    [65, 82, '#1D4ED8'],
  ],
  9: [
    [29, 28, '#059669'],
    [50, 28, '#059669'],
    [71, 28, '#059669'],
    [29, 53, '#DC2626'],
    [50, 53, '#DC2626'],
    [71, 53, '#DC2626'],
    [29, 78, '#1D4ED8'],
    [50, 78, '#1D4ED8'],
    [71, 78, '#1D4ED8'],
  ],
};

const BAMBOO_LAYOUTS: Record<number, Array<[number, number, number, string]>> = {
  2: [
    [50, 24, 24, '#059669'],
    [50, 56, 24, '#1D4ED8'],
  ],
  3: [
    [50, 22, 22, '#1D4ED8'],
    [34, 55, 24, '#059669'],
    [66, 55, 24, '#059669'],
  ],
  4: [
    [34, 24, 23, '#1D4ED8'],
    [66, 24, 23, '#059669'],
    [34, 56, 23, '#059669'],
    [66, 56, 23, '#1D4ED8'],
  ],
  5: [
    [30, 24, 22, '#059669'],
    [70, 24, 22, '#1D4ED8'],
    [50, 41, 22, '#DC2626'],
    [30, 58, 22, '#1D4ED8'],
    [70, 58, 22, '#059669'],
  ],
  6: [
    [31, 24, 23, '#059669'],
    [50, 24, 23, '#059669'],
    [69, 24, 23, '#059669'],
    [31, 56, 23, '#1D4ED8'],
    [50, 56, 23, '#1D4ED8'],
    [69, 56, 23, '#1D4ED8'],
  ],
  7: [
    [50, 17, 19, '#DC2626'],
    [30, 40, 20, '#059669'],
    [50, 40, 20, '#1D4ED8'],
    [70, 40, 20, '#059669'],
    [30, 64, 20, '#059669'],
    [50, 64, 20, '#1D4ED8'],
    [70, 64, 20, '#059669'],
  ],
  8: [
    [29, 20, 20, '#059669'],
    [43, 20, 20, '#059669'],
    [57, 20, 20, '#059669'],
    [71, 20, 20, '#059669'],
    [29, 57, 20, '#1D4ED8'],
    [43, 57, 20, '#DC2626'],
    [57, 57, 20, '#DC2626'],
    [71, 57, 20, '#1D4ED8'],
  ],
  9: [
    [31, 18, 18, '#DC2626'],
    [50, 18, 18, '#1D4ED8'],
    [69, 18, 18, '#059669'],
    [31, 43, 18, '#DC2626'],
    [50, 43, 18, '#1D4ED8'],
    [69, 43, 18, '#059669'],
    [31, 68, 18, '#DC2626'],
    [50, 68, 18, '#1D4ED8'],
    [69, 68, 18, '#059669'],
  ],
};

const CHAR_NUMS = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

export const MahjongTileFace: React.FC<{ tileType: string }> = ({ tileType }) => {
  const [suit, val] = tileType.split('-');

  if (suit === 'dot') {
    const num = Number(val);
    const pips = DOT_LAYOUTS[num] || [];
    const radius = num === 1 ? 21 : num <= 4 ? 11.5 : num <= 6 ? 9.5 : 7.8;
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true">
        <text x="12" y="18" fontSize="13" fontWeight="800" fill="#334155">
          {num}
        </text>
        {pips.map(([cx, cy, color], idx) => (
          <g key={idx}>
            <circle cx={cx} cy={cy} r={radius} fill={color} />
            <circle cx={cx} cy={cy} r={radius * 0.56} fill="none" stroke="#FFFBEB" strokeWidth={num === 1 ? 3 : 1.7} />
            <circle cx={cx} cy={cy} r={radius * 0.22} fill="#FFFBEB" />
          </g>
        ))}
      </svg>
    );
  }

  if (suit === 'bam') {
    const num = Number(val);
    if (num === 1) {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true">
          <text x="12" y="18" fontSize="13" fontWeight="800" fill="#047857">
            1
          </text>
          {/* Classic Emerald Sparrow Emblem */}
          <path
            d="M35 66C35 50 45 36 60 32C58 40 62 46 69 47C63 54 64 68 50 75C41 79 34 73 35 66Z"
            fill="#059669"
          />
          <path d="M55 36C62 28 70 28 73 33C68 35 65 39 62 43" fill="#DC2626" />
          <circle cx="59" cy="36" r="2.2" fill="#FFFBEB" />
          <path d="M36 74L26 83M48 76L44 86" stroke="#B45309" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    }
    const stalks = BAMBOO_LAYOUTS[num] || [];
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true">
        <text x="12" y="18" fontSize="13" fontWeight="800" fill="#047857">
          {num}
        </text>
        {stalks.map(([x, y, h, color], idx) => (
          <g key={idx}>
            <rect x={x - 3.6} y={y} width="7.2" height={h} rx="3.2" fill={color} />
            <rect x={x - 5} y={y + h * 0.45} width="10" height="2.6" rx="1.2" fill="#FEF3C7" stroke={color} strokeWidth="0.8" />
          </g>
        ))}
      </svg>
    );
  }

  if (suit === 'chr') {
    const num = Number(val);
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true">
        <text x="12" y="18" fontSize="13" fontWeight="800" fill="#1E293B">
          {num}
        </text>
        <text
          x="52"
          y="46"
          textAnchor="middle"
          fontSize="30"
          fontWeight="800"
          fill="#0F172A"
          fontFamily="serif"
        >
          {CHAR_NUMS[num]}
        </text>
        <text
          x="52"
          y="83"
          textAnchor="middle"
          fontSize="31"
          fontWeight="800"
          fill="#DC2626"
          fontFamily="serif"
        >
          萬
        </text>
      </svg>
    );
  }

  if (suit === 'wind') {
    const map: Record<string, { char: string; label: string; color: string }> = {
      E: { char: '東', label: 'E', color: '#0F172A' },
      S: { char: '南', label: 'S', color: '#0F172A' },
      W: { char: '西', label: 'W', color: '#1D4ED8' },
      N: { char: '北', label: 'N', color: '#1D4ED8' },
    };
    const info = map[val] || map.E;
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true">
        <text x="12" y="18" fontSize="13" fontWeight="800" fill={info.color}>
          {info.label}
        </text>
        <text
          x="51"
          y="67"
          textAnchor="middle"
          fontSize="48"
          fontWeight="800"
          fill={info.color}
          fontFamily="serif"
        >
          {info.char}
        </text>
      </svg>
    );
  }

  if (suit === 'drag') {
    if (val === 'R') {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true">
          <text x="12" y="18" fontSize="12" fontWeight="800" fill="#DC2626">
            C
          </text>
          <text x="51" y="69" textAnchor="middle" fontSize="50" fontWeight="800" fill="#DC2626" fontFamily="serif">
            中
          </text>
        </svg>
      );
    }
    if (val === 'G') {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true">
          <text x="12" y="18" fontSize="12" fontWeight="800" fill="#059669">
            F
          </text>
          <text x="51" y="69" textAnchor="middle" fontSize="48" fontWeight="800" fill="#059669" fontFamily="serif">
            發
          </text>
        </svg>
      );
    }
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true">
        <text x="12" y="18" fontSize="12" fontWeight="800" fill="#1D4ED8">
          B
        </text>
        <rect x="24" y="22" width="52" height="58" rx="6" fill="none" stroke="#1D4ED8" strokeWidth="6" />
        <rect x="32" y="30" width="36" height="42" rx="3" fill="none" stroke="#60A5FA" strokeWidth="2.5" strokeDasharray="5 4" />
      </svg>
    );
  }

  // Flowers / Seasons
  const flowerColors: Record<string, { petal: string; center: string; label: string }> = {
    '1': { petal: '#E11D48', center: '#FACC15', label: '梅' },
    '2': { petal: '#7C3AED', center: '#FDE047', label: '蘭' },
    '3': { petal: '#D97706', center: '#FEF08A', label: '菊' },
    '4': { petal: '#0D9488', center: '#FDE047', label: '竹' },
  };
  const flw = flowerColors[val] || flowerColors['1'];
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true">
      <text x="12" y="18" fontSize="13" fontWeight="800" fill={flw.petal}>
        {flw.label}
      </text>
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <ellipse
          key={deg}
          cx="50"
          cy="36"
          rx="10"
          ry="16"
          fill={flw.petal}
          opacity="0.88"
          transform={`rotate(${deg} 50 54)`}
        />
      ))}
      <circle cx="50" cy="54" r="10" fill={flw.center} stroke="#92400E" strokeWidth="1.5" />
    </svg>
  );
};
