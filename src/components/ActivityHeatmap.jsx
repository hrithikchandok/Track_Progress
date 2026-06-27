// GitHub-style contribution grid for the full calendar year (Jan → Dec).
// Week columns are flexible (flex: 1 1 0) so the grid fills the card edge-to-edge;
// cells are square. Real activity from `dailyLogs` is bucketed into 4 levels.

const EMPTY = 'var(--heat0)';
const LEVELS = [
  'var(--heat1)',
  'var(--heat2)',
  'var(--heat3)',
  'var(--heat4)',
];
const LEGEND = [EMPTY, ...LEVELS];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function localKey(d) {
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
}

function heatLevel(count) {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 9) return 3;
  return 4;
}

function buildYear(dailyLogs, year) {
  const jan1 = new Date(year, 0, 1);
  const cur = new Date(year, 0, 1 - jan1.getDay()); // Sunday on/before Jan 1
  const end = new Date(year, 11, 31);
  const weeks = [];
  const monthAt = {};
  let wi = 0, lastMonth = -1;

  while (cur <= end) {
    const col = [];
    for (let d = 0; d < 7; d++) {
      const inYear = cur.getFullYear() === year;
      const m = cur.getMonth();
      if (d === 0 && inYear && m !== lastMonth) { monthAt[wi] = MONTHS[m]; lastMonth = m; }
      const key = localKey(cur);
      col.push({ inYear, key, count: inYear ? (dailyLogs[key] || 0) : 0 });
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(col);
    wi++;
  }
  return { weeks, monthAt };
}

export default function ActivityHeatmap({ dailyLogs = {} }) {
  const year = new Date().getFullYear();
  const { weeks, monthAt } = buildYear(dailyLogs, year);
  const totalActivity = Object.entries(dailyLogs).reduce((a, [k, v]) => (k === '__d' ? a : a + v), 0);

  return (
    <div className="heatmap-section">
      <div className="heatmap-header">
        <span className="heatmap-title">Activity</span>
        <span className="heatmap-total">{totalActivity} total</span>
      </div>

      <div style={{ width: '100%' }}>
        {/* Month labels — aligned to the first week-column of each month */}
        <div style={{ display: 'flex', gap: 3, marginBottom: 7 }}>
          {weeks.map((_, wi) => (
            <div key={wi} style={{ flex: '1 1 0', minWidth: 0, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--faint)', letterSpacing: '.02em', whiteSpace: 'nowrap', overflow: 'visible' }}>
              {monthAt[wi] || ''}
            </div>
          ))}
        </div>

        {/* Week columns */}
        <div style={{ display: 'flex', gap: 3 }}>
          {weeks.map((col, wi) => (
            <div key={wi} style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
              {col.map((day, di) => (
                <div
                  key={di}
                  title={day.inYear ? `${day.key}: ${day.count} ${day.count === 1 ? 'activity' : 'activities'}` : ''}
                  style={{
                    width: '100%',
                    aspectRatio: '1 / 1',
                    borderRadius: 2,
                    background: day.inYear ? (day.count === 0 ? EMPTY : LEVELS[heatLevel(day.count) - 1]) : 'transparent',
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end', marginTop: 14, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--faint)' }}>
        Less
        {LEGEND.map((c, i) => (
          <span key={i} style={{ width: 11, height: 11, borderRadius: 2, background: c }} />
        ))}
        More
      </div>
    </div>
  );
}
