import { getHeatmapData } from '../utils/progress';

const HEAT_COLORS = [
  'var(--panel-2)',
  'rgba(245,181,68,0.25)',
  'rgba(245,181,68,0.5)',
  'rgba(245,181,68,0.75)',
  'var(--accent)',
];

function heatLevel(count) {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 9) return 3;
  return 4;
}

export default function ActivityHeatmap({ dailyLogs = {} }) {
  const weeks = getHeatmapData(dailyLogs);

  const monthLabels = weeks.map((week, wi) => {
    const first = week.find(d => d !== null);
    if (!first) return null;
    const prevFirst = wi > 0 ? weeks[wi - 1].find(d => d !== null) : null;
    if (!prevFirst || first.date.slice(0, 7) !== prevFirst.date.slice(0, 7)) {
      return new Date(first.date + 'T00:00:00').toLocaleString('default', { month: 'short' });
    }
    return null;
  });

  const totalActivity = Object.entries(dailyLogs).reduce((a, [k, v]) => k === '__d' ? a : a + v, 0);

  return (
    <div className="heatmap-section">
      <div className="heatmap-header">
        <span className="heatmap-title">Activity</span>
        <span className="heatmap-total">{totalActivity} total</span>
      </div>

      <div className="heatmap-scroll">
        {/* Month labels */}
        <div style={{ display: 'flex', gap: 2, marginLeft: 24, marginBottom: 4 }}>
          {weeks.map((_, wi) => (
            <div key={wi} style={{ width: 11, flexShrink: 0, overflow: 'visible', whiteSpace: 'nowrap', fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--faint)' }}>
              {monthLabels[wi] || ''}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>
          {/* Day labels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, width: 20, textAlign: 'right', paddingRight: 2 }}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={i} style={{ height: 11, lineHeight: '11px', fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--faint)', visibility: [1, 3, 5].includes(i) ? 'visible' : 'hidden' }}>
                {day}
              </div>
            ))}
          </div>

          {/* Week columns */}
          <div style={{ display: 'flex', gap: 2 }}>
            {weeks.map((week, wi) => (
              <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {week.map((day, di) => (
                  <div
                    key={di}
                    title={day ? `${day.date}: ${day.count} ${day.count === 1 ? 'activity' : 'activities'}` : ''}
                    style={{
                      width: 11,
                      height: 11,
                      borderRadius: 2,
                      background: day ? HEAT_COLORS[heatLevel(day.count)] : 'transparent',
                      border: day ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 10, marginLeft: 24 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--faint)', marginRight: 4 }}>Less</span>
          {HEAT_COLORS.map((c, i) => (
            <div key={i} style={{ width: 11, height: 11, borderRadius: 2, background: c, border: '1px solid rgba(255,255,255,0.04)' }} />
          ))}
          <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--faint)', marginLeft: 4 }}>More</span>
        </div>
      </div>
    </div>
  );
}
