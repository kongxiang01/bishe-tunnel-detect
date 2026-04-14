import { useState } from 'react';

// Mock data for 24-hour traffic trend
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

// Mock data for event type distribution
const eventDistribution = [
  { type: '超速', percentage: 45, color: '#ef4444' },
  { type: '违停', percentage: 30, color: '#f59e0b' },
  { type: '逆行', percentage: 15, color: '#3b82f6' },
  { type: '其他', percentage: 10, color: '#64748b' },
];

// Mock data for recent events summary
const deviceSummary = [
  { device: '摄像头A-入口', eventsToday: 8, topEvent: '超速' },
  { device: '摄像头B-出口', eventsToday: 6, topEvent: '违停' },
  { device: '摄像头C-隧道北', eventsToday: 5, topEvent: '超速' },
  { device: '摄像头D-隧道南', eventsToday: 4, topEvent: '逆行' },
];

// Stat card component
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

// Line chart component for 24-hour traffic
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
        {/* Grid lines */}
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
        {/* Line */}
        <path d={pathD} fill="none" stroke="var(--accent-primary)" strokeWidth="0.8" />
        {/* Points */}
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

// Pie chart component for event distribution
function EventPieChart() {
  const radius = 20;
  const centerX = 25;
  const centerY = 22;
  let currentAngle = -90;

  const paths = eventDistribution.map((item, index) => {
    const angle = (item.percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);

    const largeArc = angle > 180 ? 1 : 0;

    return {
      d: `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`,
      color: item.color,
      type: item.type,
      percentage: item.percentage,
    };
  });

  return (
    <div className="chart-container">
      <div className="chart-title">事件类型分布</div>
      <div className="pie-chart-wrapper">
        <svg viewBox="0 0 50 44" className="pie-chart">
          {paths.map((path, i) => (
            <path key={i} d={path.d} fill={path.color} />
          ))}
        </svg>
        <div className="pie-legend">
          {eventDistribution.map((item, i) => (
            <div key={i} className="legend-item">
              <span className="legend-color" style={{ backgroundColor: item.color }}></span>
              <span className="legend-label">{item.type}</span>
              <span className="legend-value">{item.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Time range button component
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

// Main Statistics page component
export default function Statistics() {
  const [timeRange, setTimeRange] = useState('今日');

  const timeRanges = ['今日', '本周', '本月', '本年'];

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
        <StatCard
          icon="🚗"
          title="今日车流量"
          value="1,234"
          unit=""
          trend="up"
          trendValue="+12.5%"
        />
        <StatCard
          icon="🚀"
          title="平均车速"
          value="62.5"
          unit="km/h"
          trend="up"
          trendValue="+3.2%"
        />
        <StatCard
          icon="⚠️"
          title="事件总数"
          value="23"
          unit=""
          trend="down"
          trendValue="-8.3%"
        />
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
          <EventPieChart />
        </div>
      </div>

      {/* Events Summary Table */}
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
