export default function DashboardLayout({ children, sidebarRail }) {
  return (
    <div className="dashboard-grid-layout" style={{ width: '100%' }}>
      <div 
        className="dashboard-columns-wrapper" 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: sidebarRail ? 'minmax(0, 2.5fr) minmax(0, 1fr)' : '100%', 
          gap: '24px',
          alignItems: 'start'
        }}
      >
        <div className="dashboard-main-column" style={{ display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 }}>
          {children}
        </div>
        {sidebarRail && (
          <div className="dashboard-side-rail" style={{ display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 }}>
            {sidebarRail}
          </div>
        )}
      </div>
    </div>
  );
}
