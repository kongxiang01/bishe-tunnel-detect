import { useState, useEffect } from 'react';
import axios from 'axios';

const STATISTICS_API = '/api/v1/statistics';

// Mock data for 24-hour traffic trend (no API yet)
const hourlyData = [
  { hour: 0, count: 45 },
  { hour: 1, count: 28 },
  { hour: 2, count: 22 },
  { hour: 3, count: 18 },
  { hour: 4, count: 25 },
  { hour: 5, count: 68 },
  { hour: 6, count: 156 },
  { hour: 7, count: 289 },
  { hour: 8, count: 342 },
  { hour: 9, count: 267 },
  { hour: 10, count: 198 },
  { hour: 11, count: 234 },
  { hour: 12, count: 312 },
  { hour: 13, count: 276 },
  { hour: 14, count: 245 },
  { hour: 15, count: 289 },
  { hour: 16, count: 324 },
  { hour: 17, count: 398 },
  { hour: 18, count: 356 },
  { hour: 19, count: 267 },
  { hour: 20, count: 189 },
  { hour: 21, count: 134 },
  { hour: 22, count: 98 },
  { hour: 23, count: 67 },
];

// Mock data for recent events summary (no API yet)
const deviceSummary = [
  { device: '摄像头A-入口', eventsToday: 8, topEvent: '超速' },
  { device: '摄像头B-出口', eventsToday: 6, topEvent: '违停' },
  { device: '摄像头C-隧道北', eventsToday: 5, topEvent: '超速' },
  { device: '摄像头D-隧道南', eventsToday: 4, topEvent: '逆行' },
];

// Known event type label and color mapping
const EVENT_TYPE_CONFIG = {
  accident:        { label: '事故',   color: '#ef4444' },
  fire:            { label: '火灾',   color: '#f97316' },
  congestion:      { label: '拥堵',   color: '#f59e0b' },
  speeding:        { label: '超速',   color: '#ef4444' },
  illegal_parking: { label: '违停',   color: '#f59e0b' },
  wrong_way:       { label: '逆行',   color: '#3b82f6' },
  pedestrian:      { label: '行人',   color: '#8b5cf6' },
  other:           { label: '其他',   color: '#64748b' },
};

const FALLBACK_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#64748b', '#ec4899', '#f43f5e'];

/**
 * Transforms raw eventCounts from the API into the distribution array
 * used by EventPieChart. Percentages are rounded to whole numbers.
 */
function buildDistribution(eventCounts, totalEvents) {
  return Object.entries(eventCounts).map(([type, count], index) => {
    const config = EVENT_TYPE_CONFIG[type];
    return {
      type: config ? config.label : type,
      count,
      percentage: Math.round((count / totalEvents) * 100),
      color: config ? config.color : FALLBACK_COLORS[index % FALLBACK_COLORS.length],
    };
  });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({ icon, title, value, unit, trend, trendValue }) {
  const isPositive = trend === 'up';
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <div className="stat-title">{title}</div>
        <div className="stat-value">
          {value}
          <span className="stat-unit">{unit}</span>
        </div>
        <div className={`stat-trend ${isPositive ? 'positive' : 'negative'}`}>
          <span className="trend-arrow">{isPositive ? '↑' : '↓'}</span>
          <span className="trend-value">{trendValue}</span>
        </div>
      </div>
    </div>
  );
}

function TrafficChart() {
  const maxCount = Math.max(...hourlyData.map(d => d.count));
  const chartWidth = 100;
  const chartHeight = 50;
  const padding = 2;

  const points = hourlyData.map(d => ({
    x: (d.hour / 23) * (chartWidth - padding * 2) + padding,
    y: chartHeight - (d.count / maxCount) * (chartHeight - padding * 2) - padding,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div className="chart-container">
      <div className="chart-title">24小时车流量趋势</div>
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight + 10}`} className="line-chart">
        {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
          <line
            key={ratio}
            x1={padding}
            y1={padding + ratio * (chartHeight - padding * 2)}
            x2={chartWidth - padding}
            y2={padding + ratio * (chartHeight - padding * 2)}
            stroke="var(--border-default)"
            strokeWidth="0.3"
          />
        ))}
        <path d={pathD} fill="none" stroke="var(--accent-primary)" strokeWidth="0.8" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="0.8" fill="var(--accent-primary)" />
        ))}
      </svg>
      <div className="chart-x-labels">
        <span>0时</span>
        <span>6时</span>
        <span>12时</span>
        <span>18时</span>
        <span>24时</span>
      </div>
    </div>
  );
}

/**
 * Pie chart driven by the `distribution` prop (array of
 * { type, percentage, color }). Falls back to a placeholder
 * when the array is empty.
 */
function EventPieChart({ distribution, loading, error }) {
  const radius = 20;
  const centerX = 25;
  const centerY = 22;

  const renderBody = () => {
    if (loading) {
      return (
        <div className="pie-loading">
          <span className="pie-loading-text">加载中...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="pie-loading">
          <span className="pie-error-text">数据加载失败</span>
        </div>
      );
    }

    if (!distribution || distribution.length === 0) {
      return (
        <div className="pie-loading">
          <span className="pie-loading-text">暂无数据</span>
        </div>
      );
    }

    let currentAngle = -90;
    const paths = distribution.map((item) => {
      const angle = (item.percentage / 100) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;

      const startRad = (startAngle * Math.PI) / 180;
      const endRad   = (endAngle   * Math.PI) / 180;

      const x1 = centerX + radius * Math.cos(startRad);
      const y1 = centerY + radius * Math.sin(startRad);
      const x2 = centerX + radius * Math.cos(endRad);
      const y2 = centerY + radius * Math.sin(endRad);

      const largeArc = angle > 180 ? 1 : 0;

      return {
        d:          `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`,
        color:      item.color,
        type:       item.type,
        percentage: item.percentage,
        count:      item.count,
      };
    });

    return (
      <div className="pie-chart-wrapper">
        <svg viewBox="0 0 50 44" className="pie-chart">
          {paths.map((path, i) => (
            <path key={i} d={path.d} fill={path.color} />
          ))}
        </svg>
        <div className="pie-legend">
          {distribution.map((item, i) => (
            <div key={i} className="legend-item">
              <span className="legend-color" style={{ backgroundColor: item.color }}></span>
              <span className="legend-label">{item.type}</span>
              <span className="legend-value">
                {item.count != null ? `${item.count}次` : `${item.percentage}%`}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="chart-container">
      <div className="chart-title">事件类型分布</div>
      {renderBody()}
    </div>
  );
}

function TimeRangeBtn({ label, active, onClick }) {
  return (
    <button
      className={`header-btn time-range-btn ${active ? 'active' : ''}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function Statistics() {
  const [timeRange, setTimeRange] = useState('今日');

  // Real data from API
  const [totalEvents,     setTotalEvents]     = useState(null);
  const [eventDistribution, setEventDistribution] = useState([]);
  const [statsLoading,    setStatsLoading]    = useState(true);
  const [statsError,      setStatsError]      = useState(null);

  const timeRanges = ['今日', '本周', '本月', '本年'];

  useEffect(() => {
    // Set Authorization header from stored token (same pattern as Monitor.jsx)
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
    }

    setStatsLoading(true);
    setStatsError(null);

    axios
      .get(`${STATISTICS_API}/events`)
      .then(res => {
        const { eventCounts, totalEvents: total } = res.data;
        setTotalEvents(total);
        setEventDistribution(buildDistribution(eventCounts, total));
      })
      .catch(err => {
        console.error('Failed to fetch statistics:', err);
        setStatsError(err.message || '请求失败');
      })
      .finally(() => {
        setStatsLoading(false);
      });
  }, []);

  // Display value for the total-events stat card
  const totalEventsDisplay = statsLoading
    ? '--'
    : statsError
      ? '--'
      : String(totalEvents ?? '--');

  return (
    <div className="page">
      <style>{`
        .stats-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-md) var(--spacing-lg);
          background: var(--bg-card);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-default);
          margin-bottom: var(--spacing-lg);
          box-shadow: var(--shadow-card);
        }

        .stats-header h1 {
          font-size: 1.5rem;
          font-weight: 600;
          background: linear-gradient(135deg, var(--text-primary) 0%, var(--accent-primary) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.02em;
        }

        .time-range-selector {
          display: flex;
          gap: var(--spacing-sm);
        }

        .time-range-btn {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-sm) var(--spacing-md);
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .time-range-btn:hover {
          background: var(--bg-card-hover);
          border-color: var(--border-hover);
          color: var(--text-primary);
          transform: translateY(-1px);
        }

        .time-range-btn.active {
          background: var(--accent-primary);
          border-color: var(--accent-primary);
          color: #000;
          font-weight: 600;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--spacing-lg);
          margin-bottom: var(--spacing-lg);
        }

        .stat-card {
          background: var(--bg-card);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          padding: var(--spacing-lg);
          box-shadow: var(--shadow-card);
          display: flex;
          align-items: flex-start;
          gap: var(--spacing-md);
          transition: border-color var(--transition-normal);
        }

        .stat-card:hover {
          border-color: var(--border-hover);
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--accent-primary-dim);
          border-radius: var(--radius-md);
          font-size: 1.5rem;
          flex-shrink: 0;
        }

        .stat-content {
          flex: 1;
          min-width: 0;
        }

        .stat-title {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin-bottom: var(--spacing-xs);
        }

        .stat-value {
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.2;
        }

        .stat-unit {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-secondary);
          margin-left: var(--spacing-xs);
        }

        .stat-trend {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          margin-top: var(--spacing-xs);
          font-size: 0.75rem;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 999px;
        }

        .stat-trend.positive {
          background: rgba(16, 185, 129, 0.15);
          color: var(--accent-success);
        }

        .stat-trend.negative {
          background: rgba(239, 68, 68, 0.15);
          color: var(--accent-danger);
        }

        .charts-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: var(--spacing-lg);
          margin-bottom: var(--spacing-lg);
        }

        .chart-card {
          background: var(--bg-card);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          padding: var(--spacing-lg);
          box-shadow: var(--shadow-card);
        }

        .chart-container {
          height: 100%;
        }

        .chart-title {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: var(--spacing-md);
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }

        .chart-title::before {
          content: '';
          width: 4px;
          height: 16px;
          background: linear-gradient(180deg, var(--accent-primary), var(--accent-secondary));
          border-radius: 2px;
        }

        .line-chart {
          width: 100%;
          height: 180px;
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
          border: 1px solid var(--border-default);
        }

        .chart-x-labels {
          display: flex;
          justify-content: space-between;
          margin-top: var(--spacing-sm);
          padding: 0 var(--spacing-xs);
        }

        .chart-x-labels span {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .pie-chart-wrapper {
          display: flex;
          align-items: center;
          gap: var(--spacing-lg);
        }

        .pie-chart {
          width: 140px;
          height: 140px;
          flex-shrink: 0;
        }

        .pie-legend {
          flex: 1;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-sm) 0;
          border-bottom: 1px solid var(--border-default);
        }

        .legend-item:last-child {
          border-bottom: none;
        }

        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 3px;
          flex-shrink: 0;
        }

        .legend-label {
          flex: 1;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .legend-value {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .pie-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 140px;
        }

        .pie-loading-text {
          font-size: 0.875rem;
          color: var(--text-muted);
        }

        .pie-error-text {
          font-size: 0.875rem;
          color: var(--accent-danger);
        }

        .table-card {
          background: var(--bg-card);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          padding: var(--spacing-lg);
          box-shadow: var(--shadow-card);
        }

        .table-title {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: var(--spacing-md);
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }

        .table-title::before {
          content: '';
          width: 4px;
          height: 16px;
          background: linear-gradient(180deg, var(--accent-primary), var(--accent-secondary));
          border-radius: 2px;
        }

        .summary-table {
          width: 100%;
          border-collapse: collapse;
        }

        .summary-table th {
          text-align: left;
          padding: var(--spacing-sm) var(--spacing-md);
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid var(--border-default);
        }

        .summary-table td {
          padding: var(--spacing-md);
          font-size: 0.875rem;
          color: var(--text-primary);
          border-bottom: 1px solid var(--border-default);
        }

        .summary-table tr:last-child td {
          border-bottom: none;
        }

        .summary-table tr:hover td {
          background: var(--bg-card-hover);
        }

        .event-type-badge {
          display: inline-block;
          padding: 2px 10px;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 600;
          background: rgba(239, 68, 68, 0.15);
          color: var(--accent-danger);
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .event-type-badge.warning {
          background: rgba(245, 158, 11, 0.15);
          color: var(--accent-warning);
          border-color: rgba(245, 158, 11, 0.3);
        }

        .event-type-badge.info {
          background: rgba(59, 130, 246, 0.15);
          color: var(--accent-secondary);
          border-color: rgba(59, 130, 246, 0.3);
        }

        .event-type-badge.neutral {
          background: var(--bg-surface);
          color: var(--text-secondary);
          border-color: var(--border-default);
        }

        @media (max-width: 1200px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .charts-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .stats-header {
            flex-direction: column;
            gap: var(--spacing-md);
          }
          .stats-grid {
            grid-template-columns: 1fr;
          }
          .pie-chart-wrapper {
            flex-direction: column;
          }
        }
      `}</style>

      {/* Header */}
      <div className="stats-header">
        <h1>统计分析</h1>
        <div className="time-range-selector">
          {timeRanges.map(range => (
            <TimeRangeBtn
              key={range}
              label={range}
              active={timeRange === range}
              onClick={() => setTimeRange(range)}
            />
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        {/* Mock — no traffic API yet */}
        <StatCard
          icon="🚗"
          title="今日车流量"
          value="1,234"
          unit=""
          trend="up"
          trendValue="+12.5%"
        />
        {/* Mock — no speed API yet */}
        <StatCard
          icon="🚀"
          title="平均车速"
          value="62.5"
          unit="km/h"
          trend="up"
          trendValue="+3.2%"
        />
        {/* Real data from /api/v1/statistics/events */}
        <StatCard
          icon="⚠️"
          title="事件总数"
          value={totalEventsDisplay}
          unit=""
          trend="down"
          trendValue={statsError ? '获取失败' : statsLoading ? '...' : '-8.3%'}
        />
        {/* Mock — no device online API yet */}
        <StatCard
          icon="📹"
          title="在线设备"
          value="4/6"
          unit=""
          trend="up"
          trendValue="67%"
        />
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-card">
          <TrafficChart />
        </div>
        <div className="chart-card">
          {/* Real data from /api/v1/statistics/events */}
          <EventPieChart
            distribution={eventDistribution}
            loading={statsLoading}
            error={statsError}
          />
        </div>
      </div>

      {/* Events Summary Table — mock, no API yet */}
      <div className="table-card">
        <div className="table-title">设备事件汇总</div>
        <table className="summary-table">
          <thead>
            <tr>
              <th>设备名称</th>
              <th>今日事件数</th>
              <th>主要事件类型</th>
            </tr>
          </thead>
          <tbody>
            {deviceSummary.map((item, index) => (
              <tr key={index}>
                <td>{item.device}</td>
                <td>{item.eventsToday}</td>
                <td>
                  <span className={`event-type-badge ${
                    item.topEvent === '超速' ? '' :
                    item.topEvent === '违停' ? 'warning' :
                    item.topEvent === '逆行' ? 'info' : 'neutral'
                  }`}>
                    {item.topEvent}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
