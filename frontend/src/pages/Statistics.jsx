import { useState, useEffect } from 'react';
import axios from 'axios';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';

const STATISTICS_API = '/api/v1/statistics';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({ icon, title, value, unit, loading, error }) {
  const displayValue = loading ? '--' : error ? '--' : value;

  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <div className="stat-title">{title}</div>
        <div className="stat-value">
          {displayValue}
          <span className="stat-unit">{unit}</span>
        </div>
      </div>
    </div>
  );
}

function TrafficChart({ hourlyData, loading, error }) {
  if (loading) {
    return (
      <div className="chart-container">
        <div className="chart-title">24小时车流量趋势</div>
        <div className="chart-loading">加载中...</div>
      </div>
    );
  }

  if (error || !hourlyData || hourlyData.length === 0) {
    return (
      <div className="chart-container">
        <div className="chart-title">24小时车流量趋势</div>
        <div className="chart-error">数据加载失败</div>
      </div>
    );
  }

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const data = params[0];
        return `${data.name}时<br/>车流量: ${data.value} 辆`;
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: hourlyData.map((d) => d.hour),
      axisLabel: {
        formatter: (value) => `${value}时`,
        color: '#64748b',
      },
      axisLine: {
        lineStyle: { color: '#e2e8f0' },
      },
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: '#64748b',
      },
      splitLine: {
        lineStyle: { color: '#e2e8f0', type: 'dashed' },
      },
    },
    series: [
      {
        name: '车流量',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: {
          color: '#3b82f6',
          width: 2,
        },
        itemStyle: {
          color: '#3b82f6',
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
            { offset: 1, color: 'rgba(59, 130, 246, 0.05)' },
          ]),
        },
        data: hourlyData.map((d) => d.count),
      },
    ],
  };

  return (
    <div className="chart-container">
      <div className="chart-title">24小时车流量趋势</div>
      <ReactECharts option={option} style={{ height: '220px' }} />
    </div>
  );
}

// Known event type label and color mapping
const EVENT_TYPE_CONFIG = {
  TRAFFIC_ACCIDENT: { label: '事故', color: '#ef4444' },
  FIRE_DISASTER: { label: '火灾', color: '#f97316' },
  TRAFFIC_CONGESTION: { label: '拥堵', color: '#f59e0b' },
  WRONG_WAY: { label: '逆行', color: '#3b82f6' },
  PEDESTRIAN_INTRUSION: { label: '行人闯入', color: '#8b5cf6' },
  other: { label: '其他', color: '#64748b' },
};

const FALLBACK_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#64748b', '#ec4899', '#f43f5e'];

/**
 * Transforms raw eventCounts from the API into the distribution array
 * used by EventPieChart. Percentages are rounded to whole numbers.
 */
function buildDistribution(eventCounts, totalEvents) {
  console.log('11111111', eventCounts);
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

/**
 * Pie chart driven by the `distribution` prop (array of
 * { type, percentage, color }). Falls back to a placeholder
 * when the array is empty.
 */
function EventPieChart({ distribution, loading, error }) {
  if (loading) {
    return (
      <div className="chart-container">
        <div className="chart-title">事件类型分布</div>
        <div className="pie-loading">
          <span className="pie-loading-text">加载中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chart-container">
        <div className="chart-title">事件类型分布</div>
        <div className="pie-loading">
          <span className="pie-error-text">数据加载失败</span>
        </div>
      </div>
    );
  }

  if (!distribution || distribution.length === 0) {
    return (
      <div className="chart-container">
        <div className="chart-title">事件类型分布</div>
        <div className="pie-loading">
          <span className="pie-loading-text">暂无数据</span>
        </div>
      </div>
    );
  }

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        return `${params.name}<br/>事件数: ${params.value} 次<br/>占比: ${params.percent}%`;
      },
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      textStyle: {
        color: '#64748b',
      },
    },
    series: [
      {
        name: '事件类型',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
          },
        },
        labelLine: {
          show: false,
        },
        data: distribution.map((item) => ({
          value: item.count,
          name: item.type,
          itemStyle: { color: item.color },
        })),
      },
    ],
  };

  return (
    <div className="chart-container">
      <div className="chart-title">事件类型分布</div>
      <ReactECharts option={option} style={{ height: '220px' }} />
    </div>
  );
}

function TimeRangeBtn({ label, active, onClick }) {
  return (
    <button className={`header-btn time-range-btn ${active ? 'active' : ''}`} onClick={onClick}>
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function Statistics() {
  const [timeRange, setTimeRange] = useState('今日');

  // Traffic API data
  const [trafficData, setTrafficData] = useState(null);
  const [trafficLoading, setTrafficLoading] = useState(true);
  const [trafficError, setTrafficError] = useState(null);

  // Events API data
  const [totalEvents, setTotalEvents] = useState(null);
  const [eventDistribution, setEventDistribution] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState(null);

  // Devices API data
  const [deviceStats, setDeviceStats] = useState([]);
  const [devicesLoading, setDevicesLoading] = useState(true);
  const [devicesError, setDevicesError] = useState(null);

  const timeRanges = ['今日', '本周', '本月', '本年'];

  useEffect(() => {
    // Set Authorization header from stored token (same pattern as Monitor.jsx)
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
    }

    // Fetch traffic data
    setTrafficLoading(true);
    setTrafficError(null);
    axios
      .get(`${STATISTICS_API}/traffic`)
      .then((res) => {
        setTrafficData(res.data.data || null);
      })
      .catch((err) => {
        console.error('Failed to fetch traffic:', err);
        setTrafficError(err.message || '请求失败');
      })
      .finally(() => {
        setTrafficLoading(false);
      });

    // Fetch events data
    setEventsLoading(true);
    setEventsError(null);
    axios
      .get(`${STATISTICS_API}/events`)
      .then((res) => {
        const { eventCounts, totalEvents: total } = res.data.data || {};
        setTotalEvents(total);
        setEventDistribution(buildDistribution(eventCounts || {}, total || 0));
      })
      .catch((err) => {
        console.error('Failed to fetch events:', err);
        setEventsError(err.message || '请求失败');
      })
      .finally(() => {
        setEventsLoading(false);
      });

    // Fetch devices data
    setDevicesLoading(true);
    setDevicesError(null);
    axios
      .get(`${STATISTICS_API}/devices`)
      .then((res) => {
        setDeviceStats(res.data.data?.deviceStats || []);
      })
      .catch((err) => {
        console.error('Failed to fetch devices:', err);
        setDevicesError(err.message || '请求失败');
      })
      .finally(() => {
        setDevicesLoading(false);
      });
  }, []);

  // Format online devices display
  const onlineDevicesDisplay =
    trafficLoading || trafficError
      ? '--'
      : `${trafficData?.onlineDevices ?? '--'}/${trafficData?.totalDevices ?? '--'}`;

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

        .chart-loading, .chart-error {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 220px;
          font-size: 0.875rem;
          color: var(--text-muted);
        }

        .chart-error {
          color: var(--accent-danger);
        }

        .pie-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 220px;
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

        .table-loading, .table-error {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-xl);
          font-size: 0.875rem;
          color: var(--text-muted);
        }

        .table-error {
          color: var(--accent-danger);
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
          {timeRanges.map((range) => (
            <TimeRangeBtn key={range} label={range} active={timeRange === range} onClick={() => setTimeRange(range)} />
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        <StatCard
          icon="🚗"
          title="今日车流量"
          value={trafficLoading || trafficError ? null : (trafficData?.todayTraffic ?? null)}
          unit="辆"
          loading={trafficLoading}
          error={trafficError}
        />
        <StatCard
          icon="⚠️"
          title="事件总数"
          value={eventsLoading || eventsError ? null : totalEvents}
          unit="起"
          loading={eventsLoading}
          error={eventsError}
        />
        <StatCard
          icon="📹"
          title="设备总数"
          value={trafficLoading || trafficError ? null : (trafficData?.totalDevices ?? null)}
          unit="台"
          loading={trafficLoading}
          error={trafficError}
        />
        <StatCard
          icon="🟢"
          title="在线设备"
          value={trafficLoading || trafficError ? null : (trafficData?.onlineDevices ?? null)}
          unit="台"
          loading={trafficLoading}
          error={trafficError}
        />
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-card">
          <TrafficChart hourlyData={trafficData?.hourlyData} loading={trafficLoading} error={trafficError} />
        </div>
        <div className="chart-card">
          <EventPieChart distribution={eventDistribution} loading={eventsLoading} error={eventsError} />
        </div>
      </div>

      {/* Device Stats Table */}
      <div className="table-card">
        <div className="table-title">设备事件汇总</div>
        {devicesLoading ? (
          <div className="table-loading">加载中...</div>
        ) : devicesError ? (
          <div className="table-error">数据加载失败</div>
        ) : deviceStats.length === 0 ? (
          <div className="table-loading">暂无数据</div>
        ) : (
          <table className="summary-table">
            <thead>
              <tr>
                <th>设备名称</th>
                <th>今日事件数</th>
                <th>最后事件时间</th>
              </tr>
            </thead>
            <tbody>
              {deviceStats.map((item, index) => (
                <tr key={index}>
                  <td>{item.deviceName}</td>
                  <td>{item.eventCount}</td>
                  <td>{item.lastEventTime || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
