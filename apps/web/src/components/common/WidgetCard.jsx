export default function WidgetCard({ title, icon: Icon, value, subtitle, trend, trendType, onClick }) {
  const isPositive = trendType === 'positive';
  const isNegative = trendType === 'negative';
  return (
    <div className="card widget-card animate-in" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default', padding: '20px' }}>
      <div className="widget-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)', margin: 0 }}>
          {title}
        </h4>
        {Icon && (
          <span className="widget-icon" style={{ fontSize: '18px', color: 'var(--primary)' }}>
            <Icon />
          </span>
        )}
      </div>
      <div className="widget-value" style={{ fontSize: '24px', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '4px' }}>
        {value}
      </div>
      <div className="widget-footer" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px' }}>
        {trend && (
          <span style={{ 
            color: isPositive ? '#10b981' : isNegative ? '#ef4444' : 'var(--text-muted)',
            fontWeight: 'bold'
          }}>
            {trend}
          </span>
        )}
        {subtitle && (
          <span style={{ color: 'var(--text-muted)' }}>
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
