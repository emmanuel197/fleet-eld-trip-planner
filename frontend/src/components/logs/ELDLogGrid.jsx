/**
 * ELDLogGrid Component
 * 
 * Renders an FMCSA-standard Driver's Daily Log grid using SVG.
 * Matches the official format from 49 CFR § 395.8:
 * 
 * - 24-hour horizontal axis (midnight to midnight)
 * - Hour numbers across top with 15-minute tick marks
 * - 4 duty status rows: Off Duty, Sleeper Berth, Driving, On Duty
 * - Colored horizontal bars showing duration in each status
 * - Vertical connector lines at status change points
 * - Total Hours column on the right (must sum to 24)
 * 
 * Props:
 *   log      - DailyLog object from API with duty_status_entries
 *   compact  - Boolean for smaller rendering in card view (default: false)
 *   theme    - 'dark' or 'light' (default: 'dark')
 */

import { Box } from '@mui/material';

// ── ELD Status definitions matching our design system ──
const STATUSES = [
  { key: 'off_duty', label: '1. Off Duty', short: 'Off', color: '#94A3B8' },
  { key: 'sleeper',  label: '2. Sleeper Berth', short: 'SB', color: '#818CF8' },
  { key: 'driving',  label: '3. Driving', short: 'Dr', color: '#34D399' },
  { key: 'on_duty',  label: '4. On Duty', short: 'OD', color: '#FBBF24' },
];

// Map status keys to total hour field names from API
const HOURS_MAP = {
  off_duty: 'off_duty_hours',
  sleeper: 'sleeper_berth_hours',
  driving: 'driving_hours',
  on_duty: 'on_duty_hours',
};

function ELDLogGrid({ log, compact = false, theme = 'dark' }) {
  // Dimensions
  const W = compact ? 420 : 640;        // Total SVG width
  const LEFT = compact ? 48 : 80;       // Left margin (labels)
  const RIGHT = compact ? 32 : 48;      // Right margin (totals)
  const TOP = compact ? 18 : 26;        // Top margin (hour numbers)
  const ROW_H = compact ? 20 : 30;      // Row height
  const GRID_W = W - LEFT - RIGHT;      // Grid drawing area width
  const TOTAL_H = TOP + ROW_H * 4 + 4;  // Total SVG height

  // Convert hour (0-24) to x pixel position
  const hToPx = (h) => LEFT + (h / 24) * GRID_W;

  // Theme colors
  const isDark = theme === 'dark';
  const gridStroke = isDark ? 'rgba(148,163,184,0.15)' : 'rgba(148,163,184,0.3)';
  const tickStroke = isDark ? 'rgba(148,163,184,0.08)' : 'rgba(148,163,184,0.15)';
  const labelColor = isDark ? '#94A3B8' : '#64748B';
  const rowBgEven = isDark ? 'rgba(148,163,184,0.04)' : 'rgba(148,163,184,0.06)';
  const rowBgOdd = 'transparent';
  const connectorColor = isDark ? 'rgba(248,250,252,0.5)' : 'rgba(30,41,59,0.4)';

  // Get entries from log data
  const entries = log?.duty_status_entries || [];

  // Font sizes
  const hourFontSize = compact ? 5.5 : 8;
  const labelFontSize = compact ? 5 : 7.5;
  const totalFontSize = compact ? 6.5 : 9;

  return (
    <Box sx={{ width: '100%', overflowX: 'auto' }}>
      <svg
        width="100%"
        viewBox={`0 0 ${W} ${TOTAL_H}`}
        style={{ fontFamily: '"Inter", sans-serif' }}
      >
        {/* ── Hour labels across top ── */}
        {Array.from({ length: 24 }, (_, h) => {
          const x = hToPx(h);
          let label;
          if (h === 0) label = 'Mid';
          else if (h === 12) label = 'Noon';
          else if (h > 12) label = String(h - 12);
          else label = String(h);

          return (
            <text
              key={`hr-${h}`}
              x={x} y={TOP - 5}
              textAnchor="middle"
              fontSize={hourFontSize}
              fill={labelColor}
              fontWeight="600"
            >
              {label}
            </text>
          );
        })}

        {/* "Hrs" header for totals column */}
        <text
          x={W - 6} y={TOP - 5}
          textAnchor="end"
          fontSize={hourFontSize - 0.5}
          fill={labelColor}
          fontWeight="700"
        >
          Hrs
        </text>

        {/* ── Grid rows ── */}
        {STATUSES.map((status, rowIdx) => {
          const y = TOP + rowIdx * ROW_H;

          return (
            <g key={status.key}>
              {/* Row background */}
              <rect
                x={LEFT} y={y}
                width={GRID_W} height={ROW_H}
                fill={rowIdx % 2 === 0 ? rowBgEven : rowBgOdd}
                stroke={gridStroke}
                strokeWidth="0.5"
              />

              {/* Row label (left side) */}
              <text
                x={LEFT - 4} y={y + ROW_H / 2 + (compact ? 2 : 3.5)}
                textAnchor="end"
                fontSize={labelFontSize}
                fill={status.color}
                fontWeight="600"
              >
                {compact ? status.short : status.label}
              </text>

              {/* Hour lines and 15-minute tick marks */}
              {Array.from({ length: 24 }, (_, h) => (
                <g key={`tick-${h}`}>
                  {/* Hour line (full height) */}
                  <line
                    x1={hToPx(h)} y1={y}
                    x2={hToPx(h)} y2={y + ROW_H}
                    stroke={gridStroke} strokeWidth="0.5"
                  />
                  {/* 15-min ticks (bottom third of row) */}
                  {[0.25, 0.5, 0.75].map(q => (
                    <line
                      key={q}
                      x1={hToPx(h + q)} y1={y + ROW_H * 0.65}
                      x2={hToPx(h + q)} y2={y + ROW_H}
                      stroke={tickStroke} strokeWidth="0.3"
                    />
                  ))}
                </g>
              ))}

              {/* Duty status bars */}
              {entries
                .filter(e => e.status === status.key)
                .map((entry, i) => {
                  const x1 = hToPx(entry.start_hour);
                  const x2 = hToPx(entry.end_hour);
                  if (x2 - x1 < 0.5) return null; // Skip tiny segments
                  return (
                    <rect
                      key={`bar-${i}`}
                      x={x1} y={y + 4}
                      width={x2 - x1}
                      height={ROW_H - 8}
                      fill={status.color}
                      opacity={0.75}
                      rx="1.5"
                    />
                  );
                })}

              {/* Total hours (right side) */}
              <text
                x={W - 6} y={y + ROW_H / 2 + (compact ? 2 : 3.5)}
                textAnchor="end"
                fontSize={totalFontSize}
                fill={status.color}
                fontWeight="700"
              >
                {log?.[HOURS_MAP[status.key]]?.toFixed?.(1) || '0'}
              </text>
            </g>
          );
        })}

        {/* ── Vertical status-change connector lines ── */}
        {entries.map((entry, i) => {
          if (i === 0) return null;
          const prev = entries[i - 1];
          if (!prev || prev.status === entry.status) return null;

          const x = hToPx(entry.start_hour);
          const prevRowIdx = STATUSES.findIndex(s => s.key === prev.status);
          const currRowIdx = STATUSES.findIndex(s => s.key === entry.status);
          if (prevRowIdx < 0 || currRowIdx < 0) return null;

          const y1 = TOP + prevRowIdx * ROW_H + ROW_H / 2;
          const y2 = TOP + currRowIdx * ROW_H + ROW_H / 2;

          return (
            <line
              key={`conn-${i}`}
              x1={x} y1={y1} x2={x} y2={y2}
              stroke={connectorColor}
              strokeWidth={compact ? 0.8 : 1.2}
            />
          );
        })}

        {/* Bottom border */}
        <line
          x1={LEFT} y1={TOP + ROW_H * 4}
          x2={LEFT + GRID_W} y2={TOP + ROW_H * 4}
          stroke={gridStroke} strokeWidth="0.5"
        />
      </svg>
    </Box>
  );
}

export default ELDLogGrid;
