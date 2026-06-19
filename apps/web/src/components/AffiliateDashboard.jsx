import { useState, useEffect, useRef } from 'react';
import {
  HiUsers, HiTrendingUp, HiDatabase, HiClipboardCheck,
  HiCollection, HiCog, HiChartBar, HiArrowUp, HiHome,
  HiClipboard, HiDuplicate, HiCheck, HiDownload
} from 'react-icons/hi';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import { api } from '../api';
import { toast } from '../utils/toast';
import WidgetCard from './common/WidgetCard';
import DashboardLayout from './common/DashboardLayout';

export default function AffiliateDashboard({ currentUser, activeTab, setActiveTab, navigateTo }) {
  const [profile, setProfile] = useState(null);
  const [referralsData, setReferralsData] = useState({ referrals: [], total: 0 });
  const [commissions, setCommissions] = useState([]);
  const [analytics, setAnalytics] = useState({ dailyEarnings: [], materialsStats: [] });
  const [materials, setMaterials] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [payoutAmount, setPayoutAmount] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankName, setBankName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('bank');
  const [withdrawError, setWithdrawError] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  // Pagination states for referrals
  const [refPage, setRefPage] = useState(1);
  const [refLimit] = useState(10);

  // Filters
  const [commissionStatusFilter, setCommissionStatusFilter] = useState('');

  // Copy state
  const [copiedId, setCopiedId] = useState(null);

  const fetchProfile = async () => {
    try {
      const data = await api.getAffiliateMe();
      if (data) {
        setProfile(data);
        setBankAccount(data.bankAccount || '');
        setBankName(data.bankName || '');
        setTaxId(data.taxId || '');
        setPayoutMethod(data.payoutMethod || 'bank');
      }
    } catch (err) {
      toast(err.message || 'Lỗi khi tải thông tin đối tác', 'error');
    }
  };

  const fetchReferrals = async () => {
    try {
      const data = await api.getMyReferrals(refPage, refLimit);
      if (data) {
        setReferralsData(data);
      }
    } catch (err) {
      console.warn('Cannot fetch referrals:', err);
    }
  };

  const fetchCommissions = async () => {
    try {
      const data = await api.getMyCommissions(commissionStatusFilter);
      if (data) {
        setCommissions(data);
      }
    } catch (err) {
      console.warn('Cannot fetch commissions:', err);
    }
  };

  const fetchAnalyticsAndMaterials = async () => {
    try {
      const [analData, matData] = await Promise.all([
        api.getMyAnalytics(),
        api.getMarketingMaterials()
      ]);
      if (analData) setAnalytics(analData);
      if (matData) setMaterials(matData);
    } catch (err) {
      console.warn('Cannot fetch analytics / materials:', err);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const data = await api.getAffiliateLeaderboard();
      if (data) setLeaderboard(data);
    } catch (err) {
      console.warn('Cannot fetch leaderboard:', err);
    }
  };

  const fetchPayoutHistory = async () => {
    // In our backend, payout requests are fetched under commissions / admin payouts.
    // For affiliate, they request payout. We can fetch pending payouts from backend
    // Or display historical withdrawals by checking the Payout model.
    // Wait! Let's check if the backend has a /affiliate/payouts endpoint.
    // Ah, in api.js we have api.requestPayout(amount).
    // Let's create an endpoint on the backend if needed or check if we can list payouts.
    // Wait, the client lists payout request logs. To be completely robust, let's query the payouts database.
    // Since we don't have a direct /affiliate/me/payouts endpoint in index.ts, we can fetch all payouts from commissions or let the backend route support it.
    // Wait, in apps/api/src/controllers/affiliate.ts we have getAdminPendingPayouts, but not getMyPayouts.
    // Let's double check if we need to add a controller or just fetch from /affiliate/me where payouts list is returned if included.
    // Let's check `apps/api/src/controllers/affiliate.ts` getAffiliateMe:
    // It returns: affiliate = prisma.affiliate.findUnique({ include: { user, referrals } })
    // Wait, we can fetch the payouts via another query or add it to getAffiliateMe or a direct endpoint.
    // Let's look at `apps/api/src/controllers/affiliate.ts` line 92:
    // It includes referrals, but not payouts. We can add payouts to getAffiliateMe include block!
    // Wait, did we include payouts in getAffiliateMe?
    // Let's check the `apps/api/src/controllers/affiliate.ts` file around line 92. Let's see:
    // It has:
    // `include: { user: { select: { email, fullName, avatarUrl } }, referrals: { where: { isConverted: true } } }`
    // We can update it later if needed, or we can add payout history to AffiliateDashboard by including Payout in getAffiliateMe.
    // Wait, let's view getAffiliateMe again or just fetch it. Let's look at getAffiliateMe in affiliate.ts:
    // `include: { user: { select: { ... } }, referrals: { ... } }`
    // Let's edit `apps/api/src/controllers/affiliate.ts` to include `payouts` in getAffiliateMe so payouts are fetched automatically!
    // Yes! Let's do that. But first, let's write `AffiliateDashboard.jsx`.
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([
        fetchProfile(),
        fetchReferrals(),
        fetchCommissions(),
        fetchAnalyticsAndMaterials(),
        fetchLeaderboard()
      ]);
      setLoading(false);
    };
    loadAll();
  }, [currentUser, activeTab, refPage, commissionStatusFilter]);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast('Đã sao chép vào bộ nhớ tạm!', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setWithdrawError('');

    if (!payoutAmount || isNaN(Number(payoutAmount)) || Number(payoutAmount) <= 0) {
      setWithdrawError('Số tiền rút không hợp lệ.');
      return;
    }

    if (!profile.bankAccount || !profile.bankName) {
      setWithdrawError('Vui lòng thiết lập cấu hình ngân hàng thanh toán trước.');
      return;
    }

    try {
      await api.requestPayout(Number(payoutAmount));
      toast('Yêu cầu rút tiền đã được gửi thành công!', 'success');
      setPayoutAmount('');
      // Reload profile to reflect balance updates
      fetchProfile();
    } catch (err) {
      setWithdrawError(err.message || 'Lỗi khi yêu cầu rút tiền.');
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await api.updateAffiliateMe({
        bankAccount,
        bankName,
        taxId,
        payoutMethod
      });
      toast('Cập nhật cấu hình thanh toán thành công!', 'success');
      fetchProfile();
    } catch (err) {
      toast(err.message || 'Lỗi khi cập nhật cấu hình', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const trackMaterialClick = async (materialId) => {
    try {
      await api.trackMaterialClick(materialId, false);
      fetchAnalyticsAndMaterials();
    } catch (err) {
      console.warn(err);
    }
  };

  if (loading || !profile) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ animation: 'spin 1s linear infinite', width: '40px', height: '40px', border: '4px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%' }} />
      </div>
    );
  }

  // Calculate stats
  const totalReferrals = referralsData.total;
  const convertedReferrals = profile.referralsCount || referralsData.referrals.filter(r => r.isConverted).length;
  const conversionRate = totalReferrals > 0 ? ((convertedReferrals / totalReferrals) * 100).toFixed(1) : '0.0';

  // Minimum withdrawal limits based on tier
  const minPayouts = {
    BRONZE: 200000,
    SILVER: 150000,
    GOLD: 50000,
    PLATINUM: 50000
  };
  const minPayoutAmount = minPayouts[profile.tier] || 200000;

  // Custom tooltips for Recharts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'var(--bg-card)', padding: '10px 14px', borderRadius: 10,
          border: '1px solid var(--border)', fontSize: 12
        }}>
          <p style={{ fontWeight: 700, marginBottom: 6 }}>Ngày: {label}</p>
          <p style={{ color: 'var(--primary)', marginBottom: 2 }}>
            Thu nhập: <strong>{payload[0].value.toLocaleString()}đ</strong>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="affiliate-dashboard animate-in" style={{ padding: '24px 28px 48px 28px', maxWidth: '1280px', margin: '0 auto', fontFamily: "'Outfit', 'Inter', sans-serif" }}>
      
      {/* Banner / Header Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2.5px solid #000', paddingBottom: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '950', color: '#000', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            🤝 KHÔNG GIAN ĐỐI TÁC TIẾP THỊ (AFFILIATE)
          </h1>
          <p style={{ fontSize: '13px', color: '#555', margin: '4px 0 0 0', fontWeight: 'bold' }}>
            Chia sẻ liên kết tiếp thị, giới thiệu học sinh mới và nhận hoa hồng lên tới 30% giá trị giao dịch.
          </p>
        </div>
        <span style={{ fontSize: '12px', fontWeight: '900', background: '#2ECC71', color: '#fff', border: '2.5px solid #000', padding: '6px 14px', borderRadius: '8px', boxShadow: '3px 3px 0px #000' }}>
          CẤP BẬC: {profile.tier} ({Math.round(profile.commissionRate * 100)}% hoa hồng)
        </span>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        <WidgetCard
          title="SỐ DƯ KHẢ DỤNG"
          icon={HiTrendingUp}
          value={`${profile.pendingEarnings.toLocaleString()}đ`}
          trend={profile.pendingEarnings >= minPayoutAmount ? "Đủ điều kiện rút ✓" : `Tối thiểu ${minPayoutAmount.toLocaleString()}đ`}
          trendType={profile.pendingEarnings >= minPayoutAmount ? "positive" : "neutral"}
          subtitle="Có thể yêu cầu thanh toán"
          onClick={() => setActiveTab('payouts')}
        />
        <WidgetCard
          title="TỔNG THU NHẬP ĐÃ KIẾM"
          icon={HiDatabase}
          value={`${profile.totalEarnings.toLocaleString()}đ`}
          subtitle="Toàn bộ lịch sử hoa hồng"
          onClick={() => setActiveTab('commissions')}
        />
        <WidgetCard
          title="ĐÃ THANH TOÁN"
          icon={HiClipboardCheck}
          value={`${profile.paidEarnings.toLocaleString()}đ`}
          subtitle="Chuyển khoản thành công"
        />
        <WidgetCard
          title="TỈ LỆ CHUYỂN ĐỔI"
          icon={HiUsers}
          value={`${conversionRate}%`}
          trend={`${convertedReferrals} / ${totalReferrals} lượt mua`}
          trendType="positive"
          subtitle="Khách hàng đăng ký mua khóa học"
          onClick={() => setActiveTab('referrals')}
        />
      </div>

      {/* Main Tabs Navigation */}
      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', borderBottom: '2.5px solid #000', paddingBottom: '12px', marginBottom: '24px' }}>
        {[
          { key: 'home', label: '📊 Tổng quan', icon: HiHome },
          { key: 'referrals', label: '👥 Người giới thiệu', icon: HiUsers },
          { key: 'commissions', label: '💰 Lịch sử hoa hồng', icon: HiDatabase },
          { key: 'payouts', label: '💸 Rút tiền mặt', icon: HiClipboardCheck },
          { key: 'materials', label: '📣 Tài liệu tiếp thị', icon: HiCollection },
          { key: 'leaderboard', label: '🏆 Xếp hạng đối tác', icon: HiChartBar },
          { key: 'settings', label: '⚙️ Cấu hình thanh toán', icon: HiCog }
        ].map(tab => {
          const isSelected = activeTab === tab.key;
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                fontSize: '13px',
                fontWeight: '800',
                borderRadius: '8px',
                border: '2px solid #000',
                background: isSelected ? '#F3E8FF' : '#fff',
                color: isSelected ? '#7C3AED' : '#000',
                cursor: 'pointer',
                boxShadow: isSelected ? '3px 3px 0px #000' : '2px 2px 0px #000',
                transform: isSelected ? 'translate(-1px, -1px)' : 'none',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap'
              }}
            >
              <TabIcon />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tabs Content */}
      <div className="tab-content" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'home' && (
          <DashboardLayout
            sidebarRail={
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Promo Link Copy Card */}
                <div className="card" style={{ border: '3.5px solid #000', boxShadow: '5px 5px 0px #000', padding: '20px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '950', borderBottom: '2.5px solid #000', paddingBottom: '8px', marginBottom: '14px' }}>
                    🔗 LIÊN KẾT GIỚI THIỆU NHANH
                  </h3>
                  <p style={{ fontSize: '12px', color: '#555', lineHeight: '1.5', marginBottom: '12px' }}>
                    Gửi đường dẫn này cho bạn bè hoặc chèn vào bài viết tiếp thị của em. Khi họ click và đăng ký mua, em sẽ nhận được hoa hồng trực tiếp.
                  </p>
                  <div style={{ background: '#fafbff', border: '2px solid #000', borderRadius: '8px', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#7C3AED', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {`http://localhost:4000/affiliate/track-click/${profile.referralCode}`}
                    </span>
                    <button
                      onClick={() => handleCopy(`http://localhost:4000/affiliate/track-click/${profile.referralCode}`, 'link')}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center' }}
                      title="Sao chép"
                    >
                      {copiedId === 'link' ? <HiCheck style={{ color: '#2ECC71' }} /> : <HiDuplicate />}
                    </button>
                  </div>
                  <span style={{ fontSize: '11px', color: '#7c3aed', fontWeight: 'bold' }}>
                    ✓ Cookie lưu trữ 30 ngày. Mã giới thiệu: {profile.referralCode}
                  </span>
                </div>

                {/* Tier Rules Box */}
                <div className="card" style={{ border: '3.5px solid #000', boxShadow: '5px 5px 0px #000', padding: '20px', background: '#FFFDF9' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '950', borderBottom: '2.5px solid #000', paddingBottom: '8px', marginBottom: '14px' }}>
                    📈 QUY CHẾ HẠNG ĐỐI TÁC
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px dashed #ccc' }}>
                      <strong>🥉 Đồng (BRONZE)</strong>
                      <span>Hoa hồng: 15% (Rút tối thiểu: 200k)</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px dashed #ccc' }}>
                      <strong>🥈 Bạc (SILVER)</strong>
                      <span>Hoa hồng: 20% (Rút tối thiểu: 150k)</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px dashed #ccc' }}>
                      <strong>🥇 Vàng (GOLD)</strong>
                      <span>Hoa hồng: 25% (Rút tối thiểu: 50k)</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong>💎 Kim cương (PLATINUM)</strong>
                      <span>Hoa hồng: 30% (Rút tối thiểu: 50k)</span>
                    </div>
                  </div>
                </div>

              </div>
            }
          >
            
            {/* 30-day earnings chart widget */}
            <div className="card" style={{ border: '3.5px solid #000', boxShadow: '5px 5px 0px #000', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '950', margin: 0 }}>
                  📈 DOANH THU HOA HỒNG 30 NGÀY QUA
                </h3>
                <span style={{ fontSize: '11px', color: '#666', fontWeight: 'bold' }}>Đơn vị: Việt Nam Đồng (VND)</span>
              </div>
              <div style={{ width: '100%', height: 260 }}>
                {analytics.dailyEarnings && analytics.dailyEarnings.length > 0 ? (
                  <ResponsiveContainer>
                    <AreaChart data={analytics.dailyEarnings}>
                      <defs>
                        <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={v => `${v / 1000}k`} tick={{ fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="earnings" stroke="#7C3AED" strokeWidth={3} fillOpacity={1} fill="url(#colorEarnings)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#999', fontSize: '13px' }}>
                    Chưa có doanh số ghi nhận trong 30 ngày qua.
                  </div>
                )}
              </div>
            </div>

            {/* Quick Referrals List Table */}
            <div className="card" style={{ border: '3.5px solid #000', boxShadow: '5px 5px 0px #000', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '950', margin: 0 }}>
                  👥 ĐĂNG KÝ MỚI GIỚI THIỆU GẦN ĐÂY
                </h3>
                <button onClick={() => setActiveTab('referrals')} style={{ border: 'none', background: 'none', color: '#7C3AED', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}>
                  Xem tất cả
                </button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2.5px solid #000', color: '#000', fontWeight: 'bold' }}>
                      <th style={{ padding: '10px' }}>Họ tên học viên</th>
                      <th style={{ padding: '10px' }}>Email (Đã ẩn)</th>
                      <th style={{ padding: '10px' }}>Thời gian click</th>
                      <th style={{ padding: '10px' }}>Trạng thái mua</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referralsData.referrals.length > 0 ? (
                      referralsData.referrals.slice(0, 5).map((ref) => (
                        <tr key={ref.id} style={{ borderBottom: '1.5px solid #eee' }}>
                          <td style={{ padding: '10px', fontWeight: 'bold' }}>{ref.referredUserName}</td>
                          <td style={{ padding: '10px', color: '#666' }}>{ref.referredUserEmailMasked}</td>
                          <td style={{ padding: '10px', color: '#999' }}>{new Date(ref.clickedAt).toLocaleString('vi-VN')}</td>
                          <td style={{ padding: '10px' }}>
                            {ref.isConverted ? (
                              <span style={{ fontSize: '11px', background: 'rgba(46, 204, 113, 0.1)', color: '#2ECC71', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                                Đã mua khóa học ✓
                              </span>
                            ) : (
                              <span style={{ fontSize: '11px', background: 'rgba(241, 196, 15, 0.1)', color: '#D97706', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                                Chưa kích hoạt
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#999' }}>Chưa có lượt giới thiệu nào. Hãy chia sẻ liên kết tiếp thị để bắt đầu!</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </DashboardLayout>
        )}

        {/* TAB 2: REFERRALS */}
        {activeTab === 'referrals' && (
          <div className="card" style={{ border: '3.5px solid #000', boxShadow: '5px 5px 0px #000', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '950', borderBottom: '2.5px solid #000', paddingBottom: '8px', marginBottom: '16px' }}>
              👥 CHI TIẾT TẤT CẢ NGƯỜI ĐƯỢC GIỚI THIỆU
            </h3>
            <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2.5px solid #000', color: '#000', fontWeight: 'bold' }}>
                    <th style={{ padding: '12px' }}>Họ tên học viên</th>
                    <th style={{ padding: '12px' }}>Email (Đã ẩn)</th>
                    <th style={{ padding: '12px' }}>Nguồn tiếp thị</th>
                    <th style={{ padding: '12px' }}>Thời gian click</th>
                    <th style={{ padding: '12px' }}>Thời gian đăng ký/mua</th>
                    <th style={{ padding: '12px' }}>Trạng thái mua hàng</th>
                  </tr>
                </thead>
                <tbody>
                  {referralsData.referrals.length > 0 ? (
                    referralsData.referrals.map((ref) => (
                      <tr key={ref.id} style={{ borderBottom: '1.5px solid #eee' }}>
                        <td style={{ padding: '12px', fontWeight: 'bold' }}>{ref.referredUserName}</td>
                        <td style={{ padding: '12px', color: '#666' }}>{ref.referredUserEmailMasked}</td>
                        <td style={{ padding: '12px', color: '#666' }}>{ref.source || 'Tự do'}</td>
                        <td style={{ padding: '12px', color: '#999' }}>{new Date(ref.clickedAt).toLocaleString('vi-VN')}</td>
                        <td style={{ padding: '12px', color: '#999' }}>{ref.convertedAt ? new Date(ref.convertedAt).toLocaleString('vi-VN') : '-'}</td>
                        <td style={{ padding: '12px' }}>
                          {ref.isConverted ? (
                            <span style={{ fontSize: '11.5px', background: 'rgba(46, 204, 113, 0.1)', color: '#2ECC71', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                              Đã mua khóa học ✓
                            </span>
                          ) : (
                            <span style={{ fontSize: '11.5px', background: 'rgba(241, 196, 15, 0.1)', color: '#D97706', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                              Chưa kích hoạt
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#999' }}>Không tìm thấy lượt giới thiệu nào.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {referralsData.total > refLimit && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px' }}>
                <button
                  disabled={refPage === 1}
                  onClick={() => setRefPage(refPage - 1)}
                  className="btn-outline"
                  style={{ padding: '6px 16px', fontSize: '12.5px', borderRadius: '8px', cursor: 'pointer' }}
                >
                  ◀ Trước
                </button>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                  Trang {refPage} / {referralsData.totalPages}
                </span>
                <button
                  disabled={refPage >= referralsData.totalPages}
                  onClick={() => setRefPage(refPage + 1)}
                  className="btn-outline"
                  style={{ padding: '6px 16px', fontSize: '12.5px', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Sau ▶
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: COMMISSIONS */}
        {activeTab === 'commissions' && (
          <div className="card" style={{ border: '3.5px solid #000', boxShadow: '5px 5px 0px #000', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2.5px solid #000', paddingBottom: '8px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '950', margin: 0 }}>
                💰 CHI TIẾT LỊCH SỬ HOA HỒNG
              </h3>
              
              {/* Filter by Status */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '12.5px', fontWeight: 'bold' }}>Trạng thái:</span>
                <select
                  value={commissionStatusFilter}
                  onChange={e => setCommissionStatusFilter(e.target.value)}
                  style={{ padding: '6px 12px', fontSize: '12.5px', border: '2px solid #000', borderRadius: '6px' }}
                >
                  <option value="">Tất cả</option>
                  <option value="PENDING">Đang xử lý (Pending)</option>
                  <option value="APPROVED">Khả dụng rút (Approved)</option>
                  <option value="PAID">Đã thanh toán (Paid)</option>
                  <option value="CANCELLED">Hủy bỏ (Cancelled)</option>
                </select>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2.5px solid #000', color: '#000', fontWeight: 'bold' }}>
                    <th style={{ padding: '12px' }}>Mã đơn hàng</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Giá trị giao dịch</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Số tiền hoa hồng</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Tỷ lệ</th>
                    <th style={{ padding: '12px' }}>Thời gian ghi nhận</th>
                    <th style={{ padding: '12px' }}>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.length > 0 ? (
                    commissions.map((comm) => (
                      <tr key={comm.id} style={{ borderBottom: '1.5px solid #eee' }}>
                        <td style={{ padding: '12px', fontWeight: 'bold' }}>#{comm.orderId}</td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          {(comm.amount / comm.rate).toLocaleString()}đ
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#7C3AED', fontWeight: '900' }}>
                          {comm.amount.toLocaleString()}đ
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>
                          {Math.round(comm.rate * 100)}%
                        </td>
                        <td style={{ padding: '12px', color: '#999' }}>
                          {new Date(comm.earnedAt).toLocaleString('vi-VN')}
                        </td>
                        <td style={{ padding: '12px' }}>
                          {comm.status === 'PENDING' && (
                            <span style={{ fontSize: '11px', background: 'rgba(241, 196, 15, 0.1)', color: '#d97706', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                              Tạm duyệt (Chờ đối soát 7 ngày)
                            </span>
                          )}
                          {comm.status === 'APPROVED' && (
                            <span style={{ fontSize: '11px', background: 'rgba(46, 204, 113, 0.1)', color: '#2ECC71', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                              Khả dụng rút ✓
                            </span>
                          )}
                          {comm.status === 'PAID' && (
                            <span style={{ fontSize: '11px', background: 'rgba(52, 152, 219, 0.1)', color: '#3498db', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                              Đã chuyển khoản
                            </span>
                          )}
                          {comm.status === 'CANCELLED' && (
                            <span style={{ fontSize: '11px', background: 'rgba(231, 76, 60, 0.1)', color: '#e74c3c', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                              Đã hủy (Hoàn trả đơn)
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#999' }}>Chưa phát sinh hoa hồng nào. Hãy chia sẻ liên kết để có học sinh đăng ký!</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: PAYOUTS */}
        {activeTab === 'payouts' && (
          <DashboardLayout
            sidebarRail={
              <div className="card" style={{ border: '3.5px solid #000', boxShadow: '5px 5px 0px #000', padding: '20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '950', borderBottom: '2.5px solid #000', paddingBottom: '8px', marginBottom: '14px' }}>
                  ℹ️ LƯU Ý KHI RÚT TIỀN
                </h3>
                <ul style={{ fontSize: '12px', color: '#555', paddingLeft: '18px', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', lineHeight: '1.5' }}>
                  <li>Số dư tối thiểu để rút của cấp bậc <strong>{profile.tier}</strong> là <strong>{minPayoutAmount.toLocaleString()}đ</strong>.</li>
                  <li>Mỗi giao dịch rút tiền sẽ được bộ phận kế toán của hệ thống chuyển khoản trong vòng 24 - 48 giờ làm việc.</li>
                  <li>Nếu thông tin tài khoản ngân hàng chưa chính xác, số tiền sẽ được hoàn lại vào số dư khả dụng.</li>
                </ul>
              </div>
            }
          >
            
            {/* Withdraw form */}
            <div className="card" style={{ border: '3.5px solid #000', boxShadow: '5px 5px 0px #000', padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '950', borderBottom: '2.5px solid #000', paddingBottom: '8px', marginBottom: '16px' }}>
                💸 YÊU CẦU RÚT TIỀN MẶT VỀ NGÂN HÀNG
              </h3>
              
              <div style={{ background: '#F8FAF5', border: '1.5px solid #2ECC71', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#555', fontWeight: 'bold' }}>Số dư khả dụng hiện tại:</span>
                  <div style={{ fontSize: '28px', fontWeight: '950', color: '#2ECC71' }}>
                    {profile.pendingEarnings.toLocaleString()}đ
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '12px' }}>
                  <div>Ngân hàng: <strong>{profile.bankName || 'Chưa cấu hình'}</strong></div>
                  <div>Số tài khoản: <strong>{profile.bankAccount || 'Chưa cấu hình'}</strong></div>
                </div>
              </div>

              {withdrawError && (
                <div style={{ padding: '10px', background: 'rgba(231,76,60,0.1)', border: '1.5px solid #e74c3c', color: '#e74c3c', borderRadius: '6px', fontSize: '12.5px', marginBottom: '16px', fontWeight: 'bold' }}>
                  ⚠️ {withdrawError}
                </div>
              )}

              <form onSubmit={handleWithdraw} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Số tiền muốn rút (VND):</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder={`Nhập số tiền muốn rút (Tối thiểu ${minPayoutAmount.toLocaleString()}đ)`}
                    value={payoutAmount}
                    onChange={e => setPayoutAmount(e.target.value)}
                    required
                    style={{ width: '100%', padding: '12px', fontSize: '14px', border: '2px solid #000', borderRadius: '8px' }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={profile.pendingEarnings < minPayoutAmount}
                  className="btn-primary"
                  style={{
                    padding: '12px 24px',
                    fontSize: '13.5px',
                    fontWeight: '900',
                    border: '2px solid #000',
                    borderRadius: '8px',
                    boxShadow: profile.pendingEarnings >= minPayoutAmount ? '3px 3px 0px #000' : 'none',
                    background: profile.pendingEarnings >= minPayoutAmount ? '#7C3AED' : '#BDC3C7',
                    color: '#fff',
                    cursor: profile.pendingEarnings >= minPayoutAmount ? 'pointer' : 'not-allowed',
                    textAlign: 'center'
                  }}
                >
                  YÊU CẦU RÚT TIỀN 💸
                </button>
              </form>
            </div>

            {/* Payout requested list */}
            <div className="card" style={{ border: '3.5px solid #000', boxShadow: '5px 5px 0px #000', padding: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '950', borderBottom: '2.5px solid #000', paddingBottom: '8px', marginBottom: '16px' }}>
                📋 LỊCH SỬ RÚT TIỀN MẶT
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2.5px solid #000', color: '#000', fontWeight: 'bold' }}>
                      <th style={{ padding: '10px' }}>Số tiền rút</th>
                      <th style={{ padding: '10px' }}>Phương thức</th>
                      <th style={{ padding: '10px' }}>Thời gian yêu cầu</th>
                      <th style={{ padding: '10px' }}>Mã giao dịch</th>
                      <th style={{ padding: '10px' }}>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profile.payouts && profile.payouts.length > 0 ? (
                      profile.payouts.map((p) => (
                        <tr key={p.id} style={{ borderBottom: '1.5px solid #eee' }}>
                          <td style={{ padding: '10px', fontWeight: '900', color: '#e74c3c' }}>
                            -{p.amount.toLocaleString()}đ
                          </td>
                          <td style={{ padding: '10px', textTransform: 'uppercase' }}>{p.method}</td>
                          <td style={{ padding: '10px', color: '#999' }}>{new Date(p.requestedAt).toLocaleString('vi-VN')}</td>
                          <td style={{ padding: '10px', color: '#666', fontFamily: 'monospace' }}>{p.transactionId || '-'}</td>
                          <td style={{ padding: '10px' }}>
                            {p.status === 'PENDING' && (
                              <span style={{ fontSize: '11px', background: 'rgba(241, 196, 15, 0.1)', color: '#d97706', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                                Chờ phê duyệt
                              </span>
                            )}
                            {p.status === 'COMPLETED' && (
                              <span style={{ fontSize: '11px', background: 'rgba(46, 204, 113, 0.1)', color: '#2ECC71', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                                Đã thanh toán ✓
                              </span>
                            )}
                            {p.status === 'FAILED' && (
                              <span style={{ fontSize: '11px', background: 'rgba(231, 76, 60, 0.1)', color: '#e74c3c', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                                Từ chối / Hoàn tiền
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#999' }}>Không tìm thấy lịch sử giao dịch rút tiền nào.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </DashboardLayout>
        )}

        {/* TAB 5: MATERIALS */}
        {activeTab === 'materials' && (
          <div className="card" style={{ border: '3.5px solid #000', boxShadow: '5px 5px 0px #000', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '950', borderBottom: '2.5px solid #000', paddingBottom: '8px', marginBottom: '16px' }}>
              📣 TÀI LIỆU QUẢNG BÁ & TIẾP THỊ
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
              {materials.map((m) => (
                <div key={m.id} className="card" style={{ border: '2.5px solid #000', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', background: '#FFFDF9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="badge-pill" style={{ background: '#7C3AED', color: '#fff', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                      {m.type === 'link' ? '🔗 Liên kết tiếp thị' : '🖼️ Ảnh Banner quảng cáo'}
                    </span>
                    <span style={{ fontSize: '11px', color: '#666', fontWeight: 'bold' }}>
                      {m.clicks} click · {m.conversions} chuyển đổi
                    </span>
                  </div>

                  {m.imageUrl && (
                    <div style={{ border: '2px solid #000', borderRadius: '8px', overflow: 'hidden', height: '140px', background: '#ddd' }}>
                      <img src={m.imageUrl} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <strong style={{ fontSize: '13px' }}>Đoạn văn bản quảng bá đề xuất:</strong>
                    <p style={{ fontSize: '12px', color: '#334155', background: '#fafbff', border: '1.5px solid #eee', padding: '8px', borderRadius: '6px', margin: 0 }}>
                      {m.copy}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                    <button
                      className="btn-primary"
                      onClick={() => {
                        trackMaterialClick(m.id);
                        handleCopy(m.targetUrl, m.id);
                      }}
                      style={{ flex: 1, padding: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', border: '2px solid #000', borderRadius: '6px', background: '#7C3AED', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      {copiedId === m.id ? <HiCheck /> : <HiClipboard />}
                      {copiedId === m.id ? 'Đã sao chép Link' : 'Lấy Link tiếp thị'}
                    </button>
                    {m.imageUrl && (
                      <a
                        href={m.imageUrl}
                        download={`edupath_banner_${m.id}.jpg`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-outline"
                        style={{ padding: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #000', borderRadius: '6px', textDecoration: 'none', color: '#000', fontWeight: 'bold' }}
                      >
                        <HiDownload /> Tải ảnh
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: LEADERBOARD */}
        {activeTab === 'leaderboard' && (
          <div className="card" style={{ border: '3.5px solid #000', boxShadow: '5px 5px 0px #000', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '950', borderBottom: '2.5px solid #000', paddingBottom: '8px', marginBottom: '16px' }}>
              🏆 BẢNG XẾP HẠNG DOANH THU ĐỐI TÁC
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2.5px solid #000', color: '#000', fontWeight: 'bold' }}>
                    <th style={{ padding: '12px', width: '80px' }}>Hạng</th>
                    <th style={{ padding: '12px' }}>Đối tác tiếp thị</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Cấp bậc</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Tổng thu nhập tích lũy</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((item) => (
                    <tr key={item.rank} style={{ borderBottom: '1.5px solid #eee', background: item.name === currentUser.name ? '#F3E8FF' : 'transparent' }}>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          width: '28px', height: '28px', borderRadius: '50%',
                          background: item.rank === 1 ? '#FFE259' : item.rank === 2 ? '#BDC3C7' : item.rank === 3 ? '#E67E22' : 'transparent',
                          color: item.rank <= 3 ? '#000' : 'var(--text-secondary)',
                          border: item.rank <= 3 ? '2px solid #000' : 'none',
                          fontWeight: 'bold'
                        }}>
                          {item.rank}
                        </span>
                      </td>
                      <td style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#7C3AED', color: '#fff', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {item.name ? item.name.slice(0, 2).toUpperCase() : 'U'}
                        </div>
                        <strong>{item.name} {item.name === currentUser.name && '(Bạn)'}</strong>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>{item.tier}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: '900', color: '#7C3AED', fontSize: '14px' }}>
                        {item.totalEarnings.toLocaleString()}đ
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 7: PAYOUT SETTINGS */}
        {activeTab === 'settings' && (
          <div className="card" style={{ border: '3.5px solid #000', boxShadow: '5px 5px 0px #000', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '950', borderBottom: '2.5px solid #000', paddingBottom: '8px', marginBottom: '20px' }}>
              ⚙️ CẤU HÌNH THÔNG TIN THÀNH TOÁN & THUẾ
            </h3>
            
            <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                
                <div className="form-group">
                  <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>
                    Tên ngân hàng thụ hưởng:
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ví dụ: Vietcombank, Techcombank, VPBank..."
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px', fontSize: '13px', border: '2px solid #000', borderRadius: '6px' }}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>
                    Số tài khoản ngân hàng:
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Nhập số tài khoản ngân hàng thụ hưởng"
                    value={bankAccount}
                    onChange={e => setBankAccount(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px', fontSize: '13px', border: '2px solid #000', borderRadius: '6px' }}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>
                    Mã số thuế thu nhập cá nhân (Không bắt buộc):
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Nhập mã số thuế (nếu có)"
                    value={taxId}
                    onChange={e => setTaxId(e.target.value)}
                    style={{ width: '100%', padding: '10px', fontSize: '13px', border: '2px solid #000', borderRadius: '6px' }}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>
                    Phương thức thanh toán ưu tiên:
                  </label>
                  <select
                    value={payoutMethod}
                    onChange={e => setPayoutMethod(e.target.value)}
                    style={{ width: '100%', padding: '10px', fontSize: '13px', border: '2px solid #000', borderRadius: '6px' }}
                  >
                    <option value="bank">Chuyển khoản Ngân hàng (Bank Transfer)</option>
                    <option value="momo">Ví điện tử MoMo</option>
                  </select>
                </div>

              </div>

              <button
                type="submit"
                disabled={savingSettings}
                className="btn-primary"
                style={{
                  padding: '10px 24px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  border: '2px solid #000',
                  borderRadius: '6px',
                  boxShadow: '3px 3px 0px #000',
                  alignSelf: 'flex-end',
                  cursor: savingSettings ? 'not-allowed' : 'pointer'
                }}
              >
                {savingSettings ? 'Đang lưu...' : 'LƯU THIẾT LẬP THANH TOÁN ✓'}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
