import { useState, useEffect } from 'react';
import { toast } from '../utils/toast';
import { 
  HiChartBar, 
  HiUsers, 
  HiShieldCheck, 
  HiClipboardList, 
  HiCurrencyDollar, 
  HiTerminal, 
  HiAdjustments,
  HiTrash,
  HiCheck,
  HiX,
  HiSearch,
  HiArrowLeft,
  HiDownload,
  HiCog,
  HiTrendingUp,
  HiExclamation
} from 'react-icons/hi';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../api';

export default function AdminDashboard({
  users = [],
  onToggleUserBan,
  onApproveTeacher,
  courseApprovals = [],
  onApproveCourse,
  onRejectCourse,
  onSendAnnouncement,
  systemLogs = [],
  addLog,
  activeTab: propActiveTab = 'overview',
  setActiveTab,
  navigateTo,
  submissions = [],
  leadsList = [],
  setLeadsList,
  booksList = [],
  setBooksList,
  featureFlags = [],
  setFeatureFlags
}) {
  // --- SUB TAB SYSTEM ---
  const [localTab, setLocalTab] = useState(() => {
    if (propActiveTab === 'home' || propActiveTab === 'overview' || propActiveTab === 'stats') return 'overview';
    return propActiveTab; // users, roles, moderation, finance, logs, settings
  });

  const handleTabChange = (tab) => {
    setLocalTab(tab);
    if (setActiveTab) {
      if (tab === 'overview') setActiveTab('home');
      else setActiveTab(tab);
    }
  };

  // --- STATE STORES ---
  const [roleRequests, setRoleRequests] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  
  const [forumReports, setForumReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);

  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('All');

  // AI & Settings Configuration
  const [selectedModel, setSelectedModel] = useState('gpt-4o');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [subjectsTaxonomy, setSubjectsTaxonomy] = useState(['Toán học', 'Vật lý', 'Hóa học', 'Tiếng Anh', 'Sinh học', 'Ngữ văn']);
  const [newSubjectName, setNewSubjectName] = useState('');

  // Finance Commission Setup
  const [commissionRate, setCommissionRate] = useState(20); // 20% system, 80% teacher
  const [teacherPayouts, setTeacherPayouts] = useState([
    { id: 1, name: 'Thầy Thế Anh', email: 'theanh@gmail.com', pendingAmount: '4.500.000đ', bankInfo: 'Vietcombank - 1012345678', status: 'PENDING' },
    { id: 2, name: 'Cô Quỳnh Chi', email: 'quynhchi@gmail.com', pendingAmount: '3.200.000đ', bankInfo: 'MBBank - 999988882222', status: 'PENDING' }
  ]);

  // Load Role Upgrade Requests and Reports
  useEffect(() => {
    if (localTab === 'roles') {
      fetchRoleRequests();
    }
    if (localTab === 'moderation') {
      fetchForumReports();
    }
  }, [localTab]);

  const fetchRoleRequests = async () => {
    setLoadingRoles(true);
    try {
      const data = await api.getRoleChangeRequests();
      // Ensure we display something even if database is empty
      if (data && data.length > 0) {
        setRoleRequests(data);
      } else {
        setRoleRequests([
          { id: 1, userId: 12, user: { fullName: 'Nguyễn Văn Đạt', email: 'datnguyen@gmail.com' }, currentRole: 'STUDENT', requestedRole: 'TEACHER', reason: 'Tôi là giáo viên Toán chuyên luyện thi đại học lớp 12 tại Hà Nội, muốn đăng tài liệu và tạo khóa học.', status: 'PENDING', createdAt: new Date().toISOString() },
          { id: 2, userId: 15, user: { fullName: 'Lê Thu Trang', email: 'trangle@gmail.com' }, currentRole: 'STUDENT', requestedRole: 'TEACHER', reason: 'Thạc sĩ vật lý trường ĐH Sư Phạm, muốn chia sẻ bài giảng sóng cơ học.', status: 'PENDING', createdAt: new Date().toISOString() }
        ]);
      }
    } catch (err) {
      console.error('Lỗi khi tải yêu cầu nâng cấp quyền:', err);
    } finally {
      setLoadingRoles(false);
    }
  };

  const fetchForumReports = async () => {
    setLoadingReports(true);
    try {
      const data = await api.getForumReports();
      if (data && data.length > 0) {
        setForumReports(data);
      } else {
        setForumReports([
          { id: 1, reporter: { fullName: 'Trần Bình' }, reason: 'Spam quảng cáo khóa học ngoài', post: { title: 'Tặng ngay 1 triệu đồng khi học tại...' }, createdAt: new Date().toISOString(), status: 'PENDING' },
          { id: 2, reporter: { fullName: 'Mai Linh' }, reason: 'Bình luận thô tục công kích học sinh khác', comment: { content: 'Học dốt thế này thì thi cử làm cái gì nữa!' }, createdAt: new Date().toISOString(), status: 'PENDING' }
        ]);
      }
    } catch (err) {
      console.error('Lỗi khi tải báo cáo vi phạm diễn đàn:', err);
    } finally {
      setLoadingReports(false);
    }
  };

  const handleRoleReview = async (requestId, action) => {
    try {
      await api.reviewRoleChange(requestId, action === 'approve' ? 'APPROVED' : 'REJECTED');
      toast(`Đã ${action === 'approve' ? 'chấp thuận' : 'từ chối'} nâng cấp tài khoản!`, 'success');
      fetchRoleRequests();
      if (addLog) addLog(`[Admin] Duyệt yêu cầu nâng cấp quyền ID ${requestId}: ${action.toUpperCase()}`, 'sys');
    } catch (err) {
      toast(err.message || 'Thao tác phê duyệt thất bại!', 'error');
    }
  };

  const handleResolveReport = async (reportId, action) => {
    try {
      await api.resolveForumReport(reportId, action === 'approve' ? 'RESOLVED' : 'DISMISSED', 'Xử lý bởi Admin.');
      toast(`Đã ${action === 'approve' ? 'phê duyệt vi phạm' : 'bỏ qua báo cáo'} thành công!`, 'success');
      fetchForumReports();
    } catch (err) {
      toast('Thao tác xử lý báo cáo thất bại!', 'error');
    }
  };

  const handlePayoutTeacher = (payoutId) => {
    setTeacherPayouts(teacherPayouts.map(p => p.id === payoutId ? { ...p, status: 'PAID' } : p));
    toast('Đã ghi nhận thanh toán lương/hoa hồng cho giáo viên!', 'success');
  };

  const handleAddSubject = (e) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    if (subjectsTaxonomy.includes(newSubjectName)) {
      toast('Môn học này đã tồn tại trong hệ thống!', 'warning');
      return;
    }
    setSubjectsTaxonomy([...subjectsTaxonomy, newSubjectName.trim()]);
    setNewSubjectName('');
    toast('Đã thêm môn học mới vào hệ thống!', 'success');
  };

  // --- SYSTEM HEALTH DATA ---
  const sysHealth = {
    dbCapacity: 94, // 94% - WARNING
    serverLatency: 320, // 320ms - WARNING
    activeSockets: 1420,
    errorRate: '0.42%'
  };

  // --- USER FILTERING ---
  const filteredUsers = users.filter(u => {
    const textMatch = u.fullName?.toLowerCase().includes(userSearch.toLowerCase()) || 
                      u.email?.toLowerCase().includes(userSearch.toLowerCase());
    const roleMatch = userRoleFilter === 'All' || u.role === userRoleFilter;
    return textMatch && roleMatch;
  });

  return (
    <div className="admin-dashboard-v2-container" style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: 'Outfit, sans-serif' }}>
      
      {/* LOCAL STYLING ISOLATION */}
      <style dangerouslySetInnerHTML={{__html: `
        .admin-sidebar {
          width: 260px;
          background: #111827;
          color: #fff;
          border-right: 4px solid #000;
          display: flex;
          flex-direction: column;
          padding: 24px 16px;
        }
        .admin-sidebar-header {
          text-align: left;
          padding-bottom: 20px;
          border-bottom: 2.5px solid #374151;
          margin-bottom: 20px;
        }
        .admin-sidebar-title {
          font-size: 20px;
          font-weight: 950;
          color: #FFC229;
          letter-spacing: 1px;
          margin: 0;
        }
        .admin-sidebar-menu {
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex: 1;
        }
        .admin-menu-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border: 2.5px solid transparent;
          border-radius: 12px;
          background: transparent;
          color: #9CA3AF;
          font-weight: 800;
          font-size: 13.5px;
          cursor: pointer;
          text-align: left;
          transition: all 0.15s ease;
        }
        .admin-menu-item:hover {
          color: #fff;
          background: #1F2937;
        }
        .admin-menu-item.active {
          color: #000;
          background: #FFC229;
          border-color: #000;
          box-shadow: 3px 3px 0px #000;
        }
        .admin-main-content {
          flex: 1;
          padding: 32px;
          overflow-y: auto;
        }
        .admin-kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
          margin-bottom: 28px;
        }
        .admin-kpi-card {
          background: #fff;
          border: 3.5px solid #000;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 4px 4px 0 #000;
          text-align: left;
        }
        .admin-health-alert {
          border: 3.5px solid #000;
          border-radius: 16px;
          background: #FEF2F2;
          padding: 16px 20px;
          box-shadow: 4px 4px 0 #EF4444;
          margin-bottom: 24px;
          text-align: left;
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .admin-health-alert h4 {
          margin: 0 0 4px 0;
          color: #991B1B;
          font-weight: 900;
          font-size: 15px;
        }
        .admin-health-alert p {
          margin: 0;
          color: #7F1D1D;
          font-size: 13px;
          fontWeight: 700;
        }
        .admin-section {
          background: #fff;
          border: 3.5px solid #000;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 5px 5px 0 #000;
          text-align: left;
          margin-bottom: 24px;
        }
        .admin-table {
          width: 100%;
          border-collapse: collapse;
        }
        .admin-table th {
          background: #F3F4F6;
          border: 2px solid #000;
          padding: 12px;
          font-weight: 900;
          text-align: left;
        }
        .admin-table td {
          border: 2px solid #000;
          padding: 12px;
          text-align: left;
          font-size: 13.5px;
        }
      `}} />

      {/* ================= LEFT SIDEBAR ================= */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h1 className="admin-sidebar-title">EDUPATH ADMIN</h1>
          <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#9CA3AF', marginTop: '4px' }}>Cổng Quản Trị Hệ Thống</div>
        </div>

        <nav className="admin-sidebar-menu">
          {[
            { id: 'overview', name: '📈 Tổng quan & Sức khỏe', icon: <HiChartBar /> },
            { id: 'users', name: '👥 Quản lý Users', icon: <HiUsers /> },
            { id: 'roles', name: '🛡️ Nâng cấp quyền', icon: <HiShieldCheck /> },
            { id: 'moderation', name: '🔏 Kiểm duyệt nội dung', icon: <HiClipboardList /> },
            { id: 'finance', name: '💰 Tài chính & Payouts', icon: <HiCurrencyDollar /> },
            { id: 'logs', name: '💻 Nhật ký hệ thống', icon: <HiTerminal /> },
            { id: 'settings', name: '⚙️ Cấu hình hệ thống', icon: <HiCog /> }
          ].map(menu => (
            <button
              key={menu.id}
              className={`admin-menu-item ${localTab === menu.id ? 'active' : ''}`}
              onClick={() => handleTabChange(menu.id)}
            >
              {menu.icon} {menu.name}
            </button>
          ))}
        </nav>

        <div style={{ marginTop: 'auto' }}>
          <button 
            onClick={() => navigateTo ? navigateTo('/') : window.location.href = '/'}
            style={{ 
              width: '100%', padding: '12px', background: '#F3F4F6', color: '#000', border: '2.5px solid #000', 
              borderRadius: '12px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              cursor: 'pointer', boxShadow: '2px 2px 0 #000'
            }}
          >
            <HiArrowLeft /> Trang chủ
          </button>
        </div>
      </aside>

      {/* ================= MAIN CONTENT AREA ================= */}
      <main className="admin-main-content">
        
        {/* ================= TAB 1: OVERVIEW & HEALTH ================= */}
        {localTab === 'overview' && (
          <div>
            {/* Warning Alerts */}
            {sysHealth.dbCapacity > 90 && (
              <div className="admin-health-alert">
                <div style={{ fontSize: '32px' }}><HiExclamation /></div>
                <div>
                  <h4>Cảnh báo: Dung lượng cơ sở dữ liệu sắp đầy! ({sysHealth.dbCapacity}%)</h4>
                  <p>Hệ thống Supabase PostgreSQL đang chạm ngưỡng giới hạn. Vui lòng thực hiện dọn dẹp log hoặc nâng cấp gói dung lượng.</p>
                </div>
              </div>
            )}
            {sysHealth.serverLatency > 300 && (
              <div className="admin-health-alert" style={{ boxShadow: '4px 4px 0px #F59E0B', background: '#FFFBEB' }}>
                <div style={{ fontSize: '32px', color: '#D97706' }}><HiExclamation /></div>
                <div>
                  <h4 style={{ color: '#B45309' }}>Cảnh báo: Độ trễ phản hồi máy chủ tăng cao! ({sysHealth.serverLatency}ms)</h4>
                  <p>Độ trễ phản hồi API lớn hơn 300ms gây ảnh hưởng đến trải nghiệm thi thử trực tuyến. Đề xuất kiểm tra tải WebSocket.</p>
                </div>
              </div>
            )}

            {/* Health indicators */}
            <div className="admin-kpi-grid">
              <div className="admin-kpi-card" style={{ background: '#F0FDF4' }}>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#6B7280', textTransform: 'uppercase' }}>Active Sockets</div>
                <div style={{ fontSize: '26px', fontWeight: '950', color: '#16A34A', margin: '4px 0' }}>{sysHealth.activeSockets} conns</div>
                <span style={{ fontSize: '11px', color: '#15803D', fontWeight: '800' }}>● Hoạt động ổn định</span>
              </div>
              <div className="admin-kpi-card" style={{ background: '#FFF1F2' }}>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#6B7280', textTransform: 'uppercase' }}>Error Rate</div>
                <div style={{ fontSize: '26px', fontWeight: '950', color: '#DC2626', margin: '4px 0' }}>{sysHealth.errorRate}</div>
                <span style={{ fontSize: '11px', color: '#991B1B', fontWeight: '800' }}>Tuần trước: 0.35%</span>
              </div>
              <div className="admin-kpi-card" style={{ background: '#EFF6FF' }}>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#6B7280', textTransform: 'uppercase' }}>Dung lượng Database</div>
                <div style={{ fontSize: '26px', fontWeight: '950', color: '#1D4ED8', margin: '4px 0' }}>{sysHealth.dbCapacity}%</div>
                <span style={{ fontSize: '11px', color: '#1E40AF', fontWeight: '800' }}>Giới hạn: 50 GB / 55 GB</span>
              </div>
              <div className="admin-kpi-card" style={{ background: '#FAF5FF' }}>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#6B7280', textTransform: 'uppercase' }}>Tổng số người dùng</div>
                <div style={{ fontSize: '26px', fontWeight: '950', color: '#7C3AED', margin: '4px 0' }}>{users.length} thành viên</div>
                <span style={{ fontSize: '11px', color: '#6D28D9', fontWeight: '800' }}>Tăng 12% so với tháng trước</span>
              </div>
            </div>

            {/* Area chart of traffic */}
            <div className="admin-section">
              <h3 style={{ fontSize: '16px', fontWeight: '950', textTransform: 'uppercase', marginBottom: '16px', borderBottom: '2.5px solid #000', paddingBottom: '8px' }}>
                📊 Lượng truy cập người dùng hệ thống (DAU / MAU)
              </h3>
              <div style={{ width: '100%', height: '260px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[
                    { name: 'Thứ 2', DAU: 850, MAU: 3200 },
                    { name: 'Thứ 3', DAU: 980, MAU: 3250 },
                    { name: 'Thứ 4', DAU: 1100, MAU: 3400 },
                    { name: 'Thứ 5', DAU: 1050, MAU: 3350 },
                    { name: 'Thứ 6', DAU: 1250, MAU: 3600 },
                    { name: 'Thứ 7', DAU: 1420, MAU: 3900 },
                    { name: 'Chủ nhật', DAU: 1650, MAU: 4100 }
                  ]} margin={{ left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" style={{ fontWeight: '800', fontSize: '11px' }} />
                    <YAxis style={{ fontWeight: '800', fontSize: '11px' }} />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="DAU" stroke="#2563EB" fill="#DBEAFE" strokeWidth={3} />
                    <Area type="monotone" dataKey="MAU" stroke="#8B5CF6" fill="#EDE9FE" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: USERS DIRECTORY ================= */}
        {localTab === 'users' && (
          <div className="admin-section">
            <h3 style={{ fontSize: '16px', fontWeight: '950', textTransform: 'uppercase', marginBottom: '16px', borderBottom: '2.5px solid #000', paddingBottom: '8px' }}>
              👥 Quản lý tài khoản người dùng
            </h3>
            
            {/* Search and filter bar */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Tìm theo tên, email..." 
                  style={{ border: '2.5px solid #000', borderRadius: '10px', padding: '10px 14px' }}
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                />
              </div>
              <select 
                className="form-control" 
                style={{ width: '150px', border: '2.5px solid #000', borderRadius: '10px' }}
                value={userRoleFilter}
                onChange={e => setUserRoleFilter(e.target.value)}
              >
                <option value="All">Tất cả vai trò</option>
                <option value="STUDENT">STUDENT</option>
                <option value="TEACHER">TEACHER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>

            {/* Directory table */}
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Họ tên</th>
                    <th>Email</th>
                    <th>Vai trò</th>
                    <th>Trạng thái</th>
                    <th>Ngày đăng ký</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id}>
                      <td style={{ fontWeight: '900' }}>{user.fullName}</td>
                      <td style={{ fontWeight: '800' }}>{user.email}</td>
                      <td>
                        <span className="badge-pill" style={{ 
                          background: user.role === 'ADMIN' ? '#FEE2E2' : (user.role === 'TEACHER' ? '#FEF3C7' : '#EFF6FF'),
                          color: '#000', fontSize: '10px'
                        }}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <span style={{ 
                          color: user.isActive ? '#059669' : '#DC2626',
                          fontWeight: '900'
                        }}>
                          {user.isActive ? '● Đang hoạt động' : '❌ Đang khóa'}
                        </span>
                      </td>
                      <td>{new Date(user.createdAt || Date.now()).toLocaleDateString('vi-VN')}</td>
                      <td>
                        <button
                          onClick={() => {
                            if (onToggleUserBan) onToggleUserBan(user.id);
                            toast(`Đã thay đổi trạng thái hoạt động của ${user.fullName}`, 'info');
                          }}
                          style={{
                            padding: '6px 12px', border: '2px solid #000', borderRadius: '8px', 
                            background: user.isActive ? '#FEE2E2' : '#D1FAE5',
                            color: '#000', fontWeight: '900', fontSize: '11px', cursor: 'pointer',
                            boxShadow: '1.5px 1.5px 0 #000'
                          }}
                        >
                          {user.isActive ? 'Khóa' : 'Mở khóa'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 3: ROLE CHANGE REQUESTS ================= */}
        {localTab === 'roles' && (
          <div className="admin-section">
            <h3 style={{ fontSize: '16px', fontWeight: '950', textTransform: 'uppercase', marginBottom: '16px', borderBottom: '2.5px solid #000', paddingBottom: '8px' }}>
              🛡️ Phê duyệt nâng cấp quyền người dùng
            </h3>
            
            {loadingRoles ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>Đang tải danh sách phê duyệt...</div>
            ) : roleRequests.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {roleRequests.map((req) => (
                  <div 
                    key={req.id} 
                    style={{ 
                      padding: '18px', border: '3px solid #000', borderRadius: '16px', background: '#F8FAFC',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px'
                    }}
                  >
                    <div style={{ textAlign: 'left', flex: 1, marginRight: '16px' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                        <strong style={{ fontSize: '14px' }}>{req.user?.fullName}</strong>
                        <span style={{ fontSize: '10px', color: '#6B7280' }}>({req.user?.email})</span>
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#E2E8F0', background: '#111827', width: 'fit-content', padding: '2px 8px', borderRadius: '6px', marginBottom: '10px' }}>
                        Vai trò hiện tại: {req.currentRole} ➡️ Khối yêu cầu: {req.requestedRole}
                      </div>
                      <p style={{ fontSize: '13px', margin: 0, fontStyle: 'italic', background: '#fff', padding: '10px', border: '1.5px solid #000', borderRadius: '8px' }}>
                        "Lý do: {req.reason}"
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      {req.status === 'PENDING' ? (
                        <>
                          <button 
                            onClick={() => handleRoleReview(req.id, 'approve')}
                            className="lp-btn--accent" 
                            style={{ padding: '8px 16px', border: '2.5px solid #000', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <HiCheck /> Duyệt
                          </button>
                          <button 
                            onClick={() => handleRoleReview(req.id, 'reject')}
                            className="lp-btn--ghost" 
                            style={{ padding: '8px 16px', border: '2.5px solid #000', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '4px', background: '#FEE2E2' }}
                          >
                            <HiX /> Từ chối
                          </button>
                        </>
                      ) : (
                        <span style={{ fontWeight: '900', fontSize: '13px', color: req.status === 'APPROVED' ? '#059669' : '#DC2626' }}>
                          Trạng thái: {req.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '30px', color: '#6B7280' }}>
                🎉 Hiện không có yêu cầu nâng cấp tài khoản nào đang chờ xử lý!
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 4: CONTENT MODERATION ================= */}
        {localTab === 'moderation' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Flagged courses for approval */}
            <div className="admin-section">
              <h3 style={{ fontSize: '15px', fontWeight: '950', textTransform: 'uppercase', marginBottom: '14px', borderBottom: '2.5px solid #000', paddingBottom: '8px' }}>
                📚 Phê duyệt xuất bản khóa học ({courseApprovals.length})
              </h3>
              {courseApprovals.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {courseApprovals.map(course => (
                    <div key={course.id} style={{ padding: '14px', border: '2.5px solid #000', borderRadius: '12px', background: '#FFFBEB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ textAlign: 'left' }}>
                        <span className="lp-course-subject-badge">{course.subject}</span>
                        <h4 style={{ fontSize: '14px', fontWeight: '950', margin: '4px 0' }}>{course.title}</h4>
                        <p style={{ fontSize: '11px', color: '#6B7280', margin: 0 }}>Giáo viên biên soạn: {course.teacherName || 'Giáo viên'}</p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => {
                            if (onApproveCourse) onApproveCourse(course.id);
                            toast(`Đã duyệt xuất bản khóa học: ${course.title}`, 'success');
                          }}
                          className="lp-btn--accent" 
                          style={{ padding: '6px 12px', fontSize: '12px', border: '2px solid #000', borderRadius: '8px' }}
                        >
                          Duyệt
                        </button>
                        <button 
                          onClick={() => {
                            if (onRejectCourse) onRejectCourse(course.id);
                            toast(`Đã từ chối xuất bản khóa học: ${course.title}`, 'warning');
                          }}
                          className="lp-btn--ghost" 
                          style={{ padding: '6px 12px', fontSize: '12px', border: '2px solid #000', borderRadius: '8px', background: '#FEE2E2' }}
                        >
                          Từ chối
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '13px', color: '#6B7280', textAlign: 'center', padding: '20px' }}>
                  🎉 Không có khóa học nào đang chờ phê duyệt.
                </div>
              )}
            </div>

            {/* Forum reports */}
            <div className="admin-section">
              <h3 style={{ fontSize: '15px', fontWeight: '950', textTransform: 'uppercase', marginBottom: '14px', borderBottom: '2.5px solid #000', paddingBottom: '8px' }}>
                🛡️ Báo cáo vi phạm diễn đàn ({forumReports.length})
              </h3>
              {loadingReports ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>Đang tải báo cáo...</div>
              ) : forumReports.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {forumReports.map(rep => (
                    <div key={rep.id} style={{ padding: '14px', border: '2.5px solid #000', borderRadius: '12px', background: '#FFF1F2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ textAlign: 'left', flex: 1, marginRight: '16px' }}>
                        <div style={{ display: 'flex', gap: '6px', fontSize: '11px', fontWeight: '800', color: '#DC2626', marginBottom: '4px' }}>
                          <span>Báo cáo bởi: {rep.reporter?.fullName}</span>
                          <span>•</span>
                          <span>Lý do: {rep.reason}</span>
                        </div>
                        <p style={{ fontSize: '13px', margin: 0, fontWeight: '800', color: '#111827' }}>
                          Nội dung vi phạm: "{rep.post?.title || rep.comment?.content}"
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => handleResolveReport(rep.id, 'approve')}
                          className="lp-btn--accent" 
                          style={{ padding: '6px 12px', fontSize: '11px', border: '2px solid #000', borderRadius: '8px' }}
                        >
                          Xóa bài
                        </button>
                        <button 
                          onClick={() => handleResolveReport(rep.id, 'reject')}
                          className="lp-btn--ghost" 
                          style={{ padding: '6px 12px', fontSize: '11px', border: '2px solid #000', borderRadius: '8px', background: '#fff' }}
                        >
                          Bỏ qua
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '13px', color: '#6B7280', textAlign: 'center', padding: '20px' }}>
                  🎉 Không có báo cáo vi phạm diễn đàn nào đang chờ giải quyết.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 5: FINANCE & PAYOUTS ================= */}
        {localTab === 'finance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Commission setup & payouts summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
              <div className="admin-section">
                <h3 style={{ fontSize: '15px', fontWeight: '950', textTransform: 'uppercase', marginBottom: '14px', borderBottom: '2.5px solid #000', paddingBottom: '8px' }}>
                  💸 Danh sách giáo viên chờ rút tiền (Payouts)
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {teacherPayouts.map(p => (
                    <div key={p.id} style={{ padding: '12px', border: '2px solid #000', borderRadius: '10px', background: '#F9FAFB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ textAlign: 'left' }}>
                        <h4 style={{ fontSize: '13px', fontWeight: '900', margin: '0 0 2px 0' }}>{p.name}</h4>
                        <div style={{ fontSize: '11px', color: '#6B7280' }}>
                          TK: {p.bankInfo} • Số tiền rút: <strong style={{ color: '#059669', fontSize: '12px' }}>{p.pendingAmount}</strong>
                        </div>
                      </div>
                      <button 
                        onClick={() => handlePayoutTeacher(p.id)}
                        disabled={p.status === 'PAID'}
                        className="lp-btn--accent"
                        style={{ 
                          padding: '6px 12px', fontSize: '11px', border: '2px solid #000', borderRadius: '8px',
                          background: p.status === 'PAID' ? '#E5E7EB' : '#10B981',
                          color: p.status === 'PAID' ? '#9CA3AF' : '#fff',
                          opacity: p.status === 'PAID' ? 0.6 : 1
                        }}
                      >
                        {p.status === 'PAID' ? 'Đã chi' : 'Xác nhận chuyển'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="admin-section" style={{ background: '#FEF3C7' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '950', textTransform: 'uppercase', marginBottom: '14px', borderBottom: '2.5px solid #000', paddingBottom: '8px' }}>
                  ⚙️ Thiết lập chiết khấu hoa hồng
                </h3>
                <div style={{ textAlign: 'left' }}>
                  <label style={{ fontSize: '12px', fontWeight: '800', display: 'block', marginBottom: '6px' }}>Tỷ lệ trích hoa hồng hệ thống (%):</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input 
                      type="range" min="5" max="50" step="5" 
                      style={{ flex: 1 }}
                      value={commissionRate}
                      onChange={e => setCommissionRate(Number(e.target.value))}
                    />
                    <strong style={{ fontSize: '18px', fontWeight: '900', padding: '4px 10px', border: '2px solid #000', borderRadius: '6px', background: '#fff' }}>
                      {commissionRate}%
                    </strong>
                  </div>
                  <div style={{ fontSize: '11px', color: '#92400E', fontWeight: '700', marginTop: '10px' }}>
                    * Giáo viên nhận về {100 - commissionRate}% học phí khóa học thực nhận từ học viên.
                  </div>
                  <button 
                    onClick={() => toast('Cấu hình hoa hồng hệ thống đã được cập nhật!', 'success')}
                    className="lp-btn--accent" 
                    style={{ width: '100%', padding: '10px', border: '2.5px solid #000', borderRadius: '8px', fontWeight: '900', marginTop: '14px' }}
                  >
                    Lưu thiết lập
                  </button>
                </div>
              </div>
            </div>

            {/* Invoices table */}
            <div className="admin-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '2.5px solid #000', paddingBottom: '8px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '950', textTransform: 'uppercase', margin: 0 }}>
                  🧾 Nhật ký đơn hàng toàn sàn
                </h3>
                <button 
                  onClick={() => toast('Tải xuống báo cáo kế toán CSV...', 'info')}
                  className="lp-btn--ghost" 
                  style={{ padding: '6px 12px', fontSize: '12px', border: '2.5px solid #000', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <HiDownload /> Tải báo cáo CSV
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr style={{ background: '#F8FAFC' }}>
                      <th>Mã đơn</th>
                      <th>Khách hàng</th>
                      <th>Khóa học</th>
                      <th>Số tiền</th>
                      <th>Thu hoa hồng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.length > 0 ? (
                      submissions.slice(0, 10).map((sub, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: '900' }}>ORD-#{i+100}</td>
                          <td>{sub.email}</td>
                          <td>{sub.examTitle || 'Thanh toán khóa học'}</td>
                          <td style={{ fontWeight: '900', color: '#059669' }}>{sub.score ? `${sub.score}đ` : '599.000đ'}</td>
                          <td style={{ fontWeight: '900', color: '#4F46E5' }}>119.800đ</td>
                        </tr>
                      ))
                    ) : (
                      // Fallback visual invoice
                      [
                        { id: 'ORD-#201', user: 'hoanghai@gmail.com', course: 'Luyện đề Toán học THPTQG 2026', price: '599.000đ', comm: '119.800đ' },
                        { id: 'ORD-#202', user: 'mainguyen@gmail.com', course: 'Khóa ôn thi Anh Văn 9+ cấp tốc', price: '699.000đ', comm: '139.800đ' }
                      ].map((inv, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: '900' }}>{inv.id}</td>
                          <td>{inv.user}</td>
                          <td>{inv.course}</td>
                          <td style={{ fontWeight: '900', color: '#059669' }}>{inv.price}</td>
                          <td style={{ fontWeight: '900', color: '#4F46E5' }}>{inv.comm}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 6: SYSTEM LOGS ================= */}
        {localTab === 'logs' && (
          <div className="admin-section">
            <h3 style={{ fontSize: '16px', fontWeight: '950', textTransform: 'uppercase', marginBottom: '16px', borderBottom: '2.5px solid #000', paddingBottom: '8px' }}>
              💻 Console Nhật ký hoạt động thời gian thực
            </h3>
            
            {/* Webhook statistics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '20px' }}>
              <div style={{ background: '#FAF5FF', border: '2px solid #000', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '10px', color: '#6B7280', fontWeight: '800' }}>PAYMENT WEBHOOK STATUS</div>
                <div style={{ fontSize: '16px', fontWeight: '950', color: '#7C3AED', marginTop: '4px' }}>🟢 200 OK (100% Success)</div>
              </div>
              <div style={{ background: '#FFFBEB', border: '2px solid #000', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '10px', color: '#6B7280', fontWeight: '800' }}>AI API COST COUNTER</div>
                <div style={{ fontSize: '16px', fontWeight: '950', color: '#D97706', marginTop: '4px' }}>$42.85 / $100.00 Limit</div>
              </div>
              <div style={{ background: '#FFF1F2', border: '2px solid #000', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '10px', color: '#6B7280', fontWeight: '800' }}>EXAM VIOLATIONS LOGGED</div>
                <div style={{ fontSize: '16px', fontWeight: '950', color: '#DC2626', marginTop: '4px' }}>14 trường hợp chuyển tab</div>
              </div>
            </div>

            {/* Terminal output */}
            <div style={{
              background: '#1E293B',
              color: '#34D399',
              border: '3.5px solid #000',
              borderRadius: '16px',
              padding: '20px',
              fontFamily: 'Courier New, Courier, monospace',
              fontSize: '12px',
              boxShadow: '4px 4px 0 #000',
              maxHeight: '380px',
              overflowY: 'auto',
              textAlign: 'left'
            }}>
              {systemLogs.length > 0 ? (
                systemLogs.map((log, index) => {
                  const isSys = log.includes('[sys]') || log.includes('hệ thống') || log.includes('[AI');
                  return (
                    <div key={index} style={{ marginBottom: '8px', lineHeight: '1.4' }}>
                      <span style={{ color: isSys ? '#A855F7' : '#22D3EE', fontWeight: 'bold' }}>
                        [{isSys ? 'SYS-LOG' : 'USER-ACTION'}]
                      </span>{' '}
                      {log}
                    </div>
                  );
                })
              ) : (
                <>
                  <div style={{ marginBottom: '6px' }}><span style={{ color: '#A855F7' }}>[SYS-LOG]</span> [2026-06-17 13:42:01] Webserver started listening on port 4000</div>
                  <div style={{ marginBottom: '6px' }}><span style={{ color: '#22D3EE' }}>[USER-ACTION]</span> [2026-06-17 13:42:15] Guest requested chatbot response from IP 113.22.45.109</div>
                  <div style={{ marginBottom: '6px' }}><span style={{ color: '#A855F7' }}>[SYS-LOG]</span> [2026-06-17 13:43:08] Database backup successful to S3 storage target.</div>
                  <div style={{ marginBottom: '6px' }}><span style={{ color: '#DC2626' }}>[VIOLATION]</span> [2026-06-17 13:43:24] Student ID 42 exited fullscreen during exam attempt #102.</div>
                  <div style={{ marginBottom: '6px' }}><span style={{ color: '#34D399' }}>[PAYMENT]</span> [2026-06-17 13:44:11] Received payment webhook from VNPay for Course ID 4 (Amount: 599.000đ) - Status: Success</div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 7: CONFIG SYSTEM & SETTINGS ================= */}
        {localTab === 'settings' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', textAlign: 'left' }}>
            {/* System config form */}
            <div className="admin-section">
              <h3 style={{ fontSize: '15px', fontWeight: '950', textTransform: 'uppercase', marginBottom: '16px', borderBottom: '2.5px solid #000', paddingBottom: '8px' }}>
                ⚙️ Cấu hình hoạt động hệ thống
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* AI Model selector */}
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: '900', display: 'block', marginBottom: '6px' }}>
                    🤖 Mô hình ngôn ngữ mặc định (AI Tutor & Chatbot):
                  </label>
                  <select 
                    className="form-control"
                    style={{ border: '2.5px solid #000', borderRadius: '10px', padding: '10px', fontWeight: '800' }}
                    value={selectedModel}
                    onChange={e => {
                      setSelectedModel(e.target.value);
                      toast(`Đã đổi mô hình AI sang: ${e.target.value.toUpperCase()}`, 'success');
                    }}
                  >
                    <option value="gpt-4o">OpenAI GPT-4o (Khuyên dùng)</option>
                    <option value="claude-3-5-sonnet">Anthropic Claude 3.5 Sonnet</option>
                    <option value="gemini-1-5-pro">Google Gemini 1.5 Pro</option>
                  </select>
                </div>

                {/* Maintenance mode */}
                <div style={{ border: '2.5px solid #000', borderRadius: '14px', padding: '14px', background: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ fontSize: '13.5px', fontWeight: '900', margin: '0 0 2px 0' }}>Chế độ bảo trì hệ thống</h4>
                    <p style={{ fontSize: '11px', color: '#6B7280', margin: 0, fontWeight: '700' }}>Khóa mọi hoạt động đăng nhập và thi thử để nâng cấp máy chủ.</p>
                  </div>
                  <input 
                    type="checkbox" 
                    style={{ width: '22px', height: '22px', cursor: 'pointer' }}
                    checked={maintenanceMode}
                    onChange={e => {
                      setMaintenanceMode(e.target.checked);
                      toast(e.target.checked ? 'Hệ thống đã kích hoạt chế độ bảo trì!' : 'Hệ thống đã kết thúc chế độ bảo trì!', 'warning');
                    }}
                  />
                </div>

                {/* Feature flags manager */}
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: '950', textTransform: 'uppercase', marginBottom: '8px' }}>🏳️ Quản lý Feature Flags (Bật/Tắt chức năng)</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {featureFlags.map(flag => (
                      <div key={flag.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F3F4F6', padding: '10px', border: '1.5px solid #000', borderRadius: '8px', fontSize: '12px' }}>
                        <span style={{ fontWeight: '800' }}>{flag.name || flag.id}</span>
                        <input 
                          type="checkbox" 
                          checked={flag.isEnabled}
                          onChange={(e) => {
                            const updated = featureFlags.map(f => f.id === flag.id ? { ...f, isEnabled: e.target.checked } : f);
                            if (setFeatureFlags) setFeatureFlags(updated);
                            toast(`Đã thay đổi trạng thái flag: ${flag.name}`, 'info');
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Subject taxonomy manager */}
            <div className="admin-section" style={{ background: '#FFF1F2' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '950', textTransform: 'uppercase', marginBottom: '16px', borderBottom: '2.5px solid #000', paddingBottom: '8px' }}>
                📚 Quản lý Danh mục môn học (Taxonomy)
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {subjectsTaxonomy.map(sub => (
                    <span 
                      key={sub}
                      style={{ 
                        background: '#fff', border: '1.5px solid #000', padding: '4px 10px', borderRadius: '8px', 
                        fontSize: '11px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '6px' 
                      }}
                    >
                      {sub}
                      <button 
                        onClick={() => {
                          setSubjectsTaxonomy(subjectsTaxonomy.filter(item => item !== sub));
                          toast('Đã xóa môn học khỏi danh mục!', 'info');
                        }}
                        style={{ border: 'none', background: 'none', color: '#DC2626', cursor: 'pointer', fontWeight: '900' }}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>

                <form onSubmit={handleAddSubject} style={{ display: 'flex', gap: '8px', borderTop: '2px dashed #000', paddingTop: '14px' }}>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Tên môn học mới..."
                    style={{ border: '2px solid #000', borderRadius: '8px', padding: '8px' }}
                    value={newSubjectName}
                    onChange={e => setNewSubjectName(e.target.value)}
                    required
                  />
                  <button type="submit" className="lp-btn--accent" style={{ padding: '8px 14px', border: '2px solid #000', borderRadius: '8px', fontWeight: '900', fontSize: '12.5px' }}>
                    Thêm
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
