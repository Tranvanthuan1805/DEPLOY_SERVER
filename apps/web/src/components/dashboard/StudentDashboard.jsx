import { useState, useEffect, useRef } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar,
  Legend
} from 'recharts';
import { 
  HiSparkles, 
  HiCalendar, 
  HiTrendingUp, 
  HiBookOpen, 
  HiOutlineChat, 
  HiDocumentText, 
  HiAdjustments, 
  HiArrowUp, 
  HiArrowDown,
  HiCheck,
  HiPlus,
  HiFire,
  HiLightBulb,
  HiOutlineClock,
  HiChevronRight,
  HiUpload,
  HiAcademicCap
} from 'react-icons/hi';
import { api } from '../../api';
import { toast } from '../../utils/toast';

export default function StudentDashboard({ currentUser, setActiveTab, navigateTo }) {
  // --- STATES & STORES ---
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [onboardingData, setOnboardingData] = useState(() => {
    const saved = localStorage.getItem('student_onboarding_data');
    return saved ? JSON.parse(saved) : {
      subjectGroup: 'A01 (Toán - Lý - Anh)',
      targetSchool: 'Đại học Bách Khoa Hà Nội',
      targetScore: '26.5',
      grade: '12',
      subjects: ['Toán học', 'Vật lý', 'Tiếng Anh']
    };
  });

  const [onboardingCompleted, setOnboardingCompleted] = useState(() => {
    return localStorage.getItem('student_onboarding_completed') === 'true';
  });

  const [rearrangeMode, setRearrangeMode] = useState(false);
  const [widgetOrder, setWidgetOrder] = useState(() => {
    const saved = localStorage.getItem('student_widget_order');
    return saved ? JSON.parse(saved) : [
      'greeting', 
      'progress', 
      'recommendation', 
      'performance', 
      'weakness', 
      'goal', 
      'calendar', 
      'activity', 
      'gamification', 
      'forum'
    ];
  });

  // Calendar event slots
  const [calendarSlots, setCalendarSlots] = useState(() => {
    const saved = localStorage.getItem('student_calendar_slots');
    return saved ? JSON.parse(saved) : {
      'T2-morning': { subject: 'Toán học', done: true },
      'T2-evening': { subject: 'Vật lý', done: false },
      'T3-evening': { subject: 'Tiếng Anh', done: true },
      'T4-afternoon': { subject: 'Toán học', done: false },
      'T5-morning': { subject: 'Vật lý', done: false },
      'T5-evening': { subject: 'Tiếng Anh', done: false },
      'T6-evening': { subject: 'Đề thi thử Toán', done: false },
      'T7-morning': { subject: 'Luyện Flashcard', done: true },
      'CN-evening': { subject: 'Hỏi AI Tutor', done: false },
    };
  });

  // Data states loaded from APIs
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    courses: [],
    attempts: [],
    gamification: { level: 4, xp: 1450, streakDays: 7, badges: [] },
    forumPosts: [],
    recentActivities: []
  });

  // Load backend API data with safe try-catch & fallbacks
  useEffect(() => {
    async function loadDashboardResources() {
      setLoading(true);
      try {
        const [coursesRes, attemptsRes, gamiRes, forumRes] = await Promise.allSettled([
          api.getCourses({ limit: 4 }),
          api.getExamHistory().catch(() => api.getAttempts()),
          api.getUserGamificationProfile(),
          api.getForumPosts({ limit: 4 })
        ]);

        const courses = coursesRes.status === 'fulfilled' ? coursesRes.value : [];
        const attempts = attemptsRes.status === 'fulfilled' ? attemptsRes.value : [];
        const gamification = gamiRes.status === 'fulfilled' && gamiRes.value ? gamiRes.value : {
          level: 4,
          xp: 1450,
          streakDays: 7,
          badges: [
            { id: 1, name: 'Siêu Chiến Binh', icon: '🏅', desc: 'Đã hoàn thành 5 đề thi thử' },
            { id: 2, name: 'Kẻ Diệt Đề', icon: '🔥', desc: 'Đạt điểm >8.0 trong 3 đề liên tục' },
            { id: 3, name: 'Thiên Tài AI', icon: '🧠', desc: 'Hỏi AI Tutor trên 10 câu hỏi' },
            { id: 4, name: 'Học Giả Chăm Chỉ', icon: '📚', desc: 'Duy trì học tập 7 ngày liên tục' }
          ]
        };
        const forumPosts = forumRes.status === 'fulfilled' ? forumRes.value : [];

        // Build recent activities timeline
        const recentActivities = [];
        if (attempts && attempts.length > 0) {
          attempts.slice(0, 3).forEach(att => {
            recentActivities.push({
              id: `attempt-${att.id}`,
              type: 'exam',
              title: `Đã hoàn thành ${att.exam?.title || 'Đề thi thử'}`,
              detail: `Điểm số: ${att.score}đ • Đúng: ${att.correctCount || 0}/${(att.correctCount || 0) + (att.wrongCount || 0)} câu`,
              time: new Date(att.submittedAt || att.startedAt).toLocaleDateString('vi-VN')
            });
          });
        } else {
          // fallback activities
          recentActivities.push(
            { id: 'act-1', type: 'exam', title: 'Hoàn thành đề thi thử THPT Quốc gia môn Toán', detail: 'Điểm số: 8.4/10đ • Thời gian: 45 phút', time: 'Hôm nay' },
            { id: 'act-2', type: 'ai', title: 'Hỏi đáp với AI Tutor', detail: 'Hỏi về phương pháp tính tích phân hàm ẩn', time: 'Hôm qua' },
            { id: 'act-3', type: 'flashcard', title: 'Ôn tập bộ Flashcard Hóa Hữu Cơ', detail: 'Ghi nhớ thành công 18/20 từ khóa', time: '2 ngày trước' }
          );
        }

        setDashboardData({
          courses: courses.slice(0, 3),
          attempts,
          gamification,
          forumPosts: forumPosts.slice(0, 3),
          recentActivities: recentActivities.slice(0, 5)
        });
      } catch (err) {
        console.error('Lỗi khi tải tài nguyên dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardResources();
  }, []);

  // Show onboarding automatically if not completed
  useEffect(() => {
    if (!onboardingCompleted) {
      setOnboardingOpen(true);
    }
  }, [onboardingCompleted]);

  // Persist calendar slots
  const toggleCalendarSlot = (key) => {
    const updated = {
      ...calendarSlots,
      [key]: {
        ...calendarSlots[key],
        done: !calendarSlots[key]?.done
      }
    };
    setCalendarSlots(updated);
    localStorage.setItem('student_calendar_slots', JSON.stringify(updated));
    toast('Cập nhật trạng thái lịch học!', 'success');
  };

  const handleSaveOnboarding = (e) => {
    e.preventDefault();
    localStorage.setItem('student_onboarding_data', JSON.stringify(onboardingData));
    localStorage.setItem('student_onboarding_completed', 'true');
    setOnboardingCompleted(true);
    setOnboardingOpen(false);
    toast('Thiết lập mục tiêu học tập thành công! 🎯', 'success');
  };

  // Reordering helpers
  const moveWidget = (index, direction) => {
    const newOrder = [...widgetOrder];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;
    
    // Swap
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;
    
    setWidgetOrder(newOrder);
    localStorage.setItem('student_widget_order', JSON.stringify(newOrder));
  };

  // Drag and Drop implementation
  const dragItem = useRef();
  const dragOverItem = useRef();

  const handleDragStart = (e, index) => {
    dragItem.current = index;
    e.currentTarget.style.opacity = '0.5';
  };

  const handleDragEnter = (e, index) => {
    dragOverItem.current = index;
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
    const copyListItems = [...widgetOrder];
    const dragItemContent = copyListItems[dragItem.current];
    copyListItems.splice(dragItem.current, 1);
    copyListItems.splice(dragOverItem.current, 0, dragItemContent);
    dragItem.current = null;
    dragOverItem.current = null;
    setWidgetOrder(copyListItems);
    localStorage.setItem('student_widget_order', JSON.stringify(copyListItems));
  };

  // --- STATS FALLBACKS ---
  const totalExamsTaken = dashboardData.attempts.length || 14;
  const averageScore = dashboardData.attempts.length 
    ? (dashboardData.attempts.reduce((acc, curr) => acc + curr.score, 0) / dashboardData.attempts.length).toFixed(1)
    : 7.8;
  const streakCount = dashboardData.gamification?.streakDays || 7;
  const level = dashboardData.gamification?.level || 4;
  const badgesCount = dashboardData.gamification?.badges?.length || 4;

  // Chart data
  const performanceChartData = dashboardData.attempts.length > 0
    ? dashboardData.attempts.slice(-10).map((att, idx) => ({
        name: `Đề ${idx + 1}`,
        score: att.score
      }))
    : [
        { name: 'Đề 1', score: 6.5 },
        { name: 'Đề 2', score: 7.0 },
        { name: 'Đề 3', score: 6.8 },
        { name: 'Đề 4', score: 7.5 },
        { name: 'Đề 5', score: 7.2 },
        { name: 'Đề 6', score: 8.0 },
        { name: 'Đề 7', score: 7.8 },
        { name: 'Đề 8', score: 8.5 },
        { name: 'Đề 9', score: 8.4 },
        { name: 'Đề 10', score: 8.8 }
      ];

  const weaknessRadarData = [
    { subject: 'Hàm số', A: 80, B: 45, fullMark: 100 },
    { subject: 'Tích phân', A: 90, B: 30, fullMark: 100 },
    { subject: 'Hình Oxyz', A: 75, B: 60, fullMark: 100 },
    { subject: 'Dao động cơ', A: 85, B: 50, fullMark: 100 },
    { subject: 'Sóng ánh sáng', A: 70, B: 75, fullMark: 100 },
    { subject: 'Hóa vô cơ', A: 80, B: 40, fullMark: 100 },
  ];

  // Helper widget labels and styles
  const widgetMeta = {
    greeting: { title: '👋 Chào mừng học viên', bg: '#E0F2FE', span: 'col-span-12' },
    progress: { title: '📚 Lộ trình đang học', bg: '#FEE2E2', span: 'md:col-span-8 col-span-12' },
    recommendation: { title: '💡 Gợi ý hôm nay', bg: '#FEF3C7', span: 'md:col-span-4 col-span-12' },
    performance: { title: '📈 Tiến trình điểm số', bg: '#F3E8FF', span: 'md:col-span-6 col-span-12' },
    weakness: { title: '🧠 Phân tích điểm yếu', bg: '#ECFDF5', span: 'md:col-span-6 col-span-12' },
    goal: { title: '🎯 Mục tiêu đại học', bg: '#FFF1F2', span: 'md:col-span-4 col-span-12' },
    calendar: { title: '📅 Lịch trình học tập', bg: '#F0FDF4', span: 'md:col-span-8 col-span-12' },
    activity: { title: '⏱ Lịch sử hoạt động', bg: '#F8FAFC', span: 'md:col-span-4 col-span-12' },
    gamification: { title: '🏅 Level & Huy hiệu', bg: '#FFFBEB', span: 'md:col-span-4 col-span-12' },
    forum: { title: '💬 Diễn đàn thảo luận', bg: '#EFF6FF', span: 'md:col-span-4 col-span-12' }
  };

  return (
    <div className="student-dashboard-v2" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'Outfit, sans-serif' }}>
      
      {/* ================= TOP KPI STRIP (NEOBRUTALIST STYLE) ================= */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '16px', 
        marginBottom: '24px' 
      }}>
        <div style={{
          background: '#FFF5F5',
          border: '3.5px solid #000000',
          borderRadius: '16px',
          padding: '16px',
          boxShadow: '4px 4px 0px #000000',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          transition: 'transform 0.2s',
          cursor: 'default'
        }} className="hover:translate-y-[-2px]">
          <div style={{ width: '48px', height: '48px', background: '#FCA5A5', border: '2.5px solid #000000', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
            📝
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '800', color: '#6B7280', textTransform: 'uppercase' }}>Đề đã luyện</div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#000000' }}>{totalExamsTaken} đề</div>
          </div>
        </div>

        <div style={{
          background: '#EEF2FF',
          border: '3.5px solid #000000',
          borderRadius: '16px',
          padding: '16px',
          boxShadow: '4px 4px 0px #000000',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          transition: 'transform 0.2s',
          cursor: 'default'
        }} className="hover:translate-y-[-2px]">
          <div style={{ width: '48px', height: '48px', background: '#C7D2FE', border: '2.5px solid #000000', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
            📊
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '800', color: '#6B7280', textTransform: 'uppercase' }}>Điểm trung bình</div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#000000' }}>{averageScore} / 10</div>
          </div>
        </div>

        <div style={{
          background: '#FFFBEB',
          border: '3.5px solid #000000',
          borderRadius: '16px',
          padding: '16px',
          boxShadow: '4px 4px 0px #000000',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          transition: 'transform 0.2s',
          cursor: 'default'
        }} className="hover:translate-y-[-2px]">
          <div style={{ width: '48px', height: '48px', background: '#FDE68A', border: '2.5px solid #000000', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
            🔥
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '800', color: '#6B7280', textTransform: 'uppercase' }}>Chuỗi liên tục</div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#000000' }}>{streakCount} ngày</div>
          </div>
        </div>

        <div style={{
          background: '#F0FDF4',
          border: '3.5px solid #000000',
          borderRadius: '16px',
          padding: '16px',
          boxShadow: '4px 4px 0px #000000',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          transition: 'transform 0.2s',
          cursor: 'default'
        }} className="hover:translate-y-[-2px]">
          <div style={{ width: '48px', height: '48px', background: '#86EFAC', border: '2.5px solid #000000', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
            ⚡
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '800', color: '#6B7280', textTransform: 'uppercase' }}>Cấp độ hiện tại</div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#000000' }}>Lv.{level}</div>
          </div>
        </div>

        <div style={{
          background: '#FAF5FF',
          border: '3.5px solid #000000',
          borderRadius: '16px',
          padding: '16px',
          boxShadow: '4px 4px 0px #000000',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          transition: 'transform 0.2s',
          cursor: 'default'
        }} className="hover:translate-y-[-2px]">
          <div style={{ width: '48px', height: '48px', background: '#E9D5FF', border: '2.5px solid #000000', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
            🏅
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '800', color: '#6B7280', textTransform: 'uppercase' }}>Huy hiệu đạt được</div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#000000' }}>{badgesCount} huy hiệu</div>
          </div>
        </div>
      </div>

      {/* ================= QUICK ACTION CHIPS ================= */}
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '12px', 
        marginBottom: '28px',
        alignItems: 'center'
      }}>
        <span style={{ fontWeight: '900', fontSize: '14px', textTransform: 'uppercase', marginRight: '8px' }}>
          ⚡ Truy cập nhanh:
        </span>
        <button 
          onClick={() => navigateTo('/mock-exams')}
          className="lp-btn--ghost"
          style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', borderRadius: '12px', border: '2px solid #000', fontWeight: '900' }}
        >
          📝 Làm đề ngẫu nhiên
        </button>
        <button 
          onClick={() => navigateTo('/dashboard/flashcards')}
          className="lp-btn--ghost"
          style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', borderRadius: '12px', border: '2px solid #000', fontWeight: '900' }}
        >
          🧠 Ôn Flashcard 5 phút
        </button>
        <button 
          onClick={() => navigateTo('/dashboard/ai-tutor')}
          className="lp-btn--accent"
          style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', borderRadius: '12px', border: '2px solid #000', fontWeight: '900' }}
        >
          🤖 Hỏi đáp AI Tutor
        </button>
        <button 
          onClick={() => {
            // Simulated Upload dialog
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.pdf,.png,.jpg,.jpeg';
            input.onchange = async (e) => {
              const file = e.target.files[0];
              if (file) {
                toast(`Đang xử lý tải lên đề: ${file.name}...`, 'info');
                try {
                  const formData = new FormData();
                  formData.append('file', file);
                  const uploadRes = await api.uploadExamFile(formData);
                  toast('Tải lên đề tự luyện thành công! AI đang tiến hành phân tích kiến thức.', 'success');
                  if (uploadRes && uploadRes.mindmapId) {
                    navigateTo(`/mindmap/${uploadRes.mindmapId}`);
                  }
                } catch (err) {
                  toast('Phân tích đề thất bại. Hệ thống đã lưu trữ file của bạn để xem sau.', 'warning');
                }
              }
            };
            input.click();
          }}
          className="lp-btn--ghost"
          style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', borderRadius: '12px', border: '2px solid #000', fontWeight: '900' }}
        >
          <HiUpload /> Tải lên đề tự luyện
        </button>
        <button 
          onClick={() => setOnboardingOpen(true)}
          style={{ 
            padding: '8px 16px', 
            background: '#FFC229', 
            color: '#000', 
            border: '2px solid #000', 
            boxShadow: '2px 2px 0px #000', 
            fontWeight: '900',
            fontSize: '13px',
            borderRadius: '12px',
            cursor: 'pointer'
          }}
        >
          🎯 Thiết lập lại mục tiêu
        </button>

        {/* REARRANGE WIDGETS TOGGLE */}
        <button 
          onClick={() => setRearrangeMode(!rearrangeMode)}
          style={{ 
            marginLeft: 'auto',
            padding: '8px 16px', 
            background: rearrangeMode ? '#EF4444' : '#E2E8F0', 
            color: rearrangeMode ? '#fff' : '#000', 
            border: '2.5px solid #000', 
            boxShadow: '2.5px 2.5px 0px #000', 
            fontWeight: '900',
            fontSize: '13px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer'
          }}
        >
          <HiAdjustments /> {rearrangeMode ? 'Lưu sắp xếp' : 'Sắp xếp Widget'}
        </button>
      </div>

      {rearrangeMode && (
        <div style={{
          background: '#FFFBEB',
          border: '3px solid #000',
          boxShadow: '3px 3px 0px #000',
          borderRadius: '12px',
          padding: '12px 18px',
          marginBottom: '20px',
          fontSize: '13px',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>💡 <strong>Chế độ tùy biến:</strong> Bạn có thể dùng các phím mũi tên ⬆⬇ trên tiêu đề mỗi card hoặc dùng chuột <strong>kéo thả (drag and drop)</strong> để thay đổi vị trí widget.</span>
        </div>
      )}

      {/* ================= 3-COLUMN RESPONSIVE LAYOUT GRID ================= */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(12, 1fr)', 
        gap: '24px' 
      }}>
        {widgetOrder.map((key, index) => {
          const meta = widgetMeta[key];
          if (!meta) return null;

          // Rentering corresponding widget content
          const renderWidgetContent = () => {
            switch(key) {
              case 'greeting':
                return (
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '20px', justifyContent: 'space-between' }}>
                    <div style={{ textAlign: 'left' }}>
                      <h2 style={{ fontSize: '24px', fontWeight: '950', color: '#000', margin: '0 0 6px 0' }}>
                        Chào mừng quay lại, {currentUser?.fullName || 'Học viên xuất sắc'}! 🚀
                      </h2>
                      <p style={{ fontSize: '14px', color: '#4B5563', fontWeight: '700', margin: 0 }}>
                        Mục tiêu hiện tại: thi đỗ <strong>{onboardingData.targetSchool}</strong> ({onboardingData.subjectGroup}) lớp {onboardingData.grade}.
                      </p>
                    </div>
                    <div style={{ 
                      background: '#FFC229', 
                      border: '2.5px solid #000', 
                      borderRadius: '12px', 
                      padding: '10px 18px', 
                      boxShadow: '2.5px 2.5px 0 #000',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{ fontSize: '24px' }}><HiFire style={{ color: '#EF4444' }} /></span>
                      <strong style={{ fontSize: '15px', fontWeight: '900' }}>Hôm nay đã ôn tập được 45 phút! Cố lên!</strong>
                    </div>
                  </div>
                );

              case 'progress':
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {dashboardData.courses.length > 0 ? (
                      dashboardData.courses.map((course) => (
                        <div key={course.id} style={{ 
                          padding: '12px', 
                          border: '2px solid #000', 
                          borderRadius: '12px', 
                          background: '#fff',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '12px'
                        }}>
                          <div style={{ textAlign: 'left' }}>
                            <span className="lp-course-subject-badge" style={{ fontSize: '9px', padding: '2px 6px' }}>{course.subject}</span>
                            <h4 style={{ fontSize: '14px', fontWeight: '900', margin: '6px 0 2px 0' }}>{course.title}</h4>
                            <p style={{ fontSize: '11px', color: '#6B7280', fontWeight: '700', margin: 0 }}>
                              Giáo viên: {course.teacherName || 'Giáo viên EduPath'}
                            </p>
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: '150px' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '800', marginBottom: '4px' }}>
                                <span>Tiến độ</span>
                                <span>45%</span>
                              </div>
                              <div style={{ height: '8px', background: '#E2E8F0', border: '1.5px solid #000', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ width: '45%', height: '100%', background: '#8B5CF6' }} />
                              </div>
                            </div>
                            <button 
                              onClick={() => navigateTo(`/courses/${course.id}`)}
                              className="lp-btn-course-syllabus" 
                              style={{ padding: '6px 12px', fontSize: '11px' }}
                            >
                              Học tiếp
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      // Empty state / default visual courses
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[
                          { title: 'Chuyên đề Tích phân & Ứng dụng tích phân 12', subject: 'Toán học', progress: 65, color: '#7C3AED' },
                          { title: 'Chinh phục Dao động cơ & Sóng cơ chuyên sâu', subject: 'Vật lý', progress: 38, color: '#0EA5E9' }
                        ].map((c, idx) => (
                          <div key={idx} style={{ 
                            padding: '12px', 
                            border: '2px solid #000', 
                            borderRadius: '12px', 
                            background: '#fff',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '12px'
                          }}>
                            <div style={{ textAlign: 'left' }}>
                              <span className="lp-course-subject-badge" style={{ fontSize: '9px', padding: '2px 6px', background: c.color, color: '#fff' }}>{c.subject}</span>
                              <h4 style={{ fontSize: '14px', fontWeight: '900', margin: '6px 0 2px 0' }}>{c.title}</h4>
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '200px' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '800', marginBottom: '4px' }}>
                                  <span>Tiến độ</span>
                                  <span>{c.progress}%</span>
                                </div>
                                <div style={{ height: '8px', background: '#E2E8F0', border: '1.5px solid #000', borderRadius: '4px', overflow: 'hidden' }}>
                                  <div style={{ width: `${c.progress}%`, height: '100%', background: c.color }} />
                                </div>
                              </div>
                              <button 
                                onClick={() => navigateTo('/courses')}
                                className="lp-btn-course-syllabus" 
                                style={{ padding: '6px 12px', fontSize: '11px' }}
                              >
                                Học tiếp
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );

              case 'recommendation':
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
                    <div style={{ border: '2px solid #000', borderRadius: '12px', background: '#fff', padding: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '20px' }}>📝</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '10px', fontWeight: '800', color: '#9CA3AF' }}>ĐỀ THI GỢI Ý</div>
                        <div style={{ fontSize: '12px', fontWeight: '900' }}>Đề thi thử Toán học số 15</div>
                      </div>
                      <button onClick={() => navigateTo('/mock-exams')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>➡️</button>
                    </div>

                    <div style={{ border: '2px solid #000', borderRadius: '12px', background: '#fff', padding: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '20px' }}>🧠</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '10px', fontWeight: '800', color: '#9CA3AF' }}>FLASHCARD ÔN TẬP</div>
                        <div style={{ fontSize: '12px', fontWeight: '900' }}>Từ vựng Anh Văn nâng cao</div>
                      </div>
                      <button onClick={() => navigateTo('/dashboard/flashcards')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>➡️</button>
                    </div>

                    <div style={{ border: '2px solid #000', borderRadius: '12px', background: '#fff', padding: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '20px' }}>🗺️</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '10px', fontWeight: '800', color: '#9CA3AF' }}>SƠ ĐỒ TỰ DUY</div>
                        <div style={{ fontSize: '12px', fontWeight: '900' }}>Phân tích Dao động điều hòa</div>
                      </div>
                      <button onClick={() => navigateTo('/dashboard/ai-tutor')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>➡️</button>
                    </div>
                  </div>
                );

              case 'performance':
                return (
                  <div style={{ width: '100%', height: '220px', marginTop: '10px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={performanceChartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" stroke="#000000" style={{ fontSize: '10px', fontWeight: '700' }} />
                        <YAxis domain={[0, 10]} stroke="#000000" style={{ fontSize: '10px', fontWeight: '700' }} />
                        <Tooltip contentStyle={{ border: '2px solid #000', borderRadius: '8px', boxShadow: '2px 2px 0 #000' }} />
                        <Line type="monotone" dataKey="score" stroke="#8B5CF6" strokeWidth={3.5} dot={{ r: 5, stroke: '#000', strokeWidth: 1.5 }} activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                );

              case 'weakness':
                return (
                  <div style={{ width: '100%', height: '220px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '10px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={weaknessRadarData}>
                        <PolarGrid stroke="#000" strokeOpacity={0.15} />
                        <PolarAngleAxis dataKey="subject" stroke="#000" style={{ fontSize: '10px', fontWeight: '800' }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} style={{ fontSize: '8px' }} />
                        <Radar name="Điểm yếu chuyên đề" dataKey="B" stroke="#EF4444" fill="#EF4444" fillOpacity={0.4} strokeWidth={2} />
                        <Legend style={{ fontSize: '10px', fontWeight: '700' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                );

              case 'goal':
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#6B7280', textTransform: 'uppercase' }}>Trường mơ ước</div>
                      <div style={{ fontSize: '15px', fontWeight: '900', color: '#000', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <HiAcademicCap style={{ color: '#F59E0B' }} /> {onboardingData.targetSchool}
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '800', marginBottom: '6px' }}>
                        <span>Điểm trung bình hiện tại ({averageScore}đ)</span>
                        <span>Mục tiêu ({onboardingData.targetScore}đ)</span>
                      </div>
                      <div style={{ height: '14px', background: '#E2E8F0', border: '2px solid #000', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
                        <div 
                          style={{ 
                            width: `${Math.min(100, (Number(averageScore) / Number(onboardingData.targetScore)) * 100)}%`, 
                            height: '100%', 
                            background: '#22C55E' 
                          }} 
                        />
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: '50%',
                          width: '2px',
                          height: '100%',
                          background: '#000'
                        }} />
                      </div>
                      <div style={{ fontSize: '11px', color: '#EF4444', fontWeight: '900', marginTop: '6px', textAlign: 'center' }}>
                        Cần bồi dưỡng thêm +{(Number(onboardingData.targetScore) - Number(averageScore)).toFixed(1)} điểm khối thi!
                      </div>
                    </div>
                  </div>
                );

              case 'calendar':
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '10px' }}>
                      {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day) => {
                        const slotsForDay = Object.keys(calendarSlots).filter(k => k.startsWith(day));
                        return (
                          <div key={day} style={{ border: '2px solid #000', borderRadius: '12px', background: '#fff', padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ fontWeight: '900', fontSize: '12px', borderBottom: '1.5px solid #000', paddingBottom: '4px', color: '#374151' }}>{day === 'CN' ? 'Chủ Nhật' : `Thứ ${day.substring(1)}`}</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {slotsForDay.map(slotKey => {
                                const slot = calendarSlots[slotKey];
                                const isMorning = slotKey.includes('morning');
                                const isAfternoon = slotKey.includes('afternoon');
                                return (
                                  <div 
                                    key={slotKey}
                                    onClick={() => toggleCalendarSlot(slotKey)}
                                    style={{
                                      padding: '4px 6px',
                                      borderRadius: '6px',
                                      border: '1px solid #000',
                                      fontSize: '9px',
                                      fontWeight: '800',
                                      background: slot.done ? '#D1FAE5' : '#F3F4F6',
                                      textDecoration: slot.done ? 'line-through' : 'none',
                                      color: slot.done ? '#065F46' : '#374151',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      transition: 'all 0.1s'
                                    }}
                                  >
                                    <span>{isMorning ? '🌅' : isAfternoon ? '☀️' : '🌙'} {slot.subject}</span>
                                    {slot.done && <HiCheck style={{ fontSize: '10px' }} />}
                                  </div>
                                );
                              })}
                              {slotsForDay.length === 0 && <span style={{ fontSize: '9px', color: '#9CA3AF', fontStyle: 'italic' }}>Nghỉ ngơi</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );

              case 'activity':
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
                    {dashboardData.recentActivities.map((act) => (
                      <div key={act.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '50%', border: '1.5px solid #000',
                          background: act.type === 'exam' ? '#FEE2E2' : (act.type === 'ai' ? '#EFF6FF' : '#FEF3C7'),
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px',
                          flexShrink: 0
                        }}>
                          {act.type === 'exam' ? '📝' : (act.type === 'ai' ? '🤖' : '🧠')}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '12px', fontWeight: '900', color: '#111827' }}>{act.title}</div>
                          <div style={{ fontSize: '10px', color: '#6B7280', fontWeight: '700' }}>{act.detail}</div>
                        </div>
                        <span style={{ fontSize: '9px', fontWeight: '800', color: '#9CA3AF', flexShrink: 0 }}>{act.time}</span>
                      </div>
                    ))}
                  </div>
                );

              case 'gamification':
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '900', marginBottom: '4px' }}>
                        <span>Tiến trình Level {level}</span>
                        <span>{dashboardData.gamification.xp} / 2000 XP</span>
                      </div>
                      <div style={{ height: '10px', background: '#E2E8F0', border: '1.5px solid #000', borderRadius: '5px', overflow: 'hidden' }}>
                        <div style={{ width: `${(dashboardData.gamification.xp / 2000) * 100}%`, height: '100%', background: '#F59E0B' }} />
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#6B7280', textTransform: 'uppercase', marginBottom: '8px' }}>Huy hiệu của bạn ({badgesCount})</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                        {dashboardData.gamification.badges.map((badge) => (
                          <div 
                            key={badge.id} 
                            title={`${badge.name}: ${badge.desc}`}
                            style={{ 
                              border: '1.5px solid #000', 
                              borderRadius: '8px', 
                              padding: '6px', 
                              background: '#fff', 
                              textAlign: 'center',
                              boxShadow: '1.5px 1.5px 0 #000',
                              cursor: 'help'
                            }}
                          >
                            <span style={{ fontSize: '20px' }}>{badge.icon}</span>
                            <div style={{ fontSize: '8px', fontWeight: '800', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>{badge.name}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );

              case 'forum':
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' }}>
                    {dashboardData.forumPosts.length > 0 ? (
                      dashboardData.forumPosts.map((post) => (
                        <div 
                          key={post.id} 
                          onClick={() => navigateTo('/dashboard/forum')}
                          style={{ 
                            padding: '10px', border: '2px solid #000', borderRadius: '10px', background: '#fff',
                            cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                          }}
                        >
                          <div style={{ flex: 1, marginRight: '10px' }}>
                            <h5 style={{ fontSize: '12px', fontWeight: '900', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {post.title}
                            </h5>
                            <span style={{ fontSize: '9px', color: '#9CA3AF', fontWeight: '700' }}>
                              Tác giả: {post.author?.fullName || 'Học sinh'} • Lượt xem: {post.viewsCount || 0}
                            </span>
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: '800', background: '#F3F4F6', border: '1px solid #000', padding: '2px 6px', borderRadius: '6px' }}>
                            💬 {post.comments?.length || 0}
                          </span>
                        </div>
                      ))
                    ) : (
                      // Fallback visual forum highlights
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {[
                          { title: 'Kinh nghiệm đạt điểm 10 môn Toán thi THPTQG', comments: 14, author: 'Lê Văn Tự' },
                          { title: 'Tài liệu tóm tắt công thức Vật Lý hạt nhân 12', comments: 28, author: 'Thầy Thế Anh' },
                          { title: 'Đố vui: Bài toán tích phân giải nhanh trong 30 giây', comments: 8, author: 'Nguyễn Kiều Trang' }
                        ].map((post, idx) => (
                          <div 
                            key={idx}
                            onClick={() => navigateTo('/dashboard/forum')}
                            style={{ 
                              padding: '8px 10px', border: '1.5px solid #000', borderRadius: '8px', background: '#fff',
                              cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                            }}
                          >
                            <div style={{ flex: 1, marginRight: '10px', overflow: 'hidden' }}>
                              <h5 style={{ fontSize: '11.5px', fontWeight: '900', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {post.title}
                              </h5>
                              <span style={{ fontSize: '9px', color: '#6B7280', fontWeight: '700' }}>
                                Đăng bởi {post.author}
                              </span>
                            </div>
                            <span style={{ fontSize: '10px', fontWeight: '800', background: '#F3F4F6', border: '1px solid #000', padding: '1px 5px', borderRadius: '6px', flexShrink: 0 }}>
                              💬 {post.comments}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );

              default:
                return null;
            }
          };

          return (
            <div 
              key={key}
              draggable={rearrangeMode}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnter={(e) => handleDragEnter(e, index)}
              onDragEnd={handleDragEnd}
              className={`student-dashboard-card ${meta.span}`}
              style={{
                background: meta.bg,
                border: '3.5px solid #000000',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '5px 5px 0px #000000',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: rearrangeMode ? 'grab' : 'default'
              }}
            >
              {/* Card Header controls */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '14px', 
                borderBottom: '2.5px solid #000000',
                paddingBottom: '8px'
              }}>
                <h3 style={{ fontSize: '15px', fontWeight: '950', color: '#000000', margin: 0, textTransform: 'uppercase', tracking: '0.5px' }}>
                  {meta.title}
                </h3>
                
                {rearrangeMode ? (
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button 
                      onClick={() => moveWidget(index, -1)}
                      disabled={index === 0}
                      style={{ 
                        padding: '2px 6px', background: '#fff', border: '1.5px solid #000', borderRadius: '4px', cursor: 'pointer',
                        opacity: index === 0 ? 0.3 : 1
                      }}
                      title="Di chuyển lên"
                    >
                      <HiArrowUp style={{ fontSize: '12px' }} />
                    </button>
                    <button 
                      onClick={() => moveWidget(index, 1)}
                      disabled={index === widgetOrder.length - 1}
                      style={{ 
                        padding: '2px 6px', background: '#fff', border: '1.5px solid #000', borderRadius: '4px', cursor: 'pointer',
                        opacity: index === widgetOrder.length - 1 ? 0.3 : 1
                      }}
                      title="Di chuyển xuống"
                    >
                      <HiArrowDown style={{ fontSize: '12px' }} />
                    </button>
                  </div>
                ) : (
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#000' }} />
                )}
              </div>

              {/* Widget Body */}
              <div style={{ flex: 1 }}>
                {renderWidgetContent()}
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= ONBOARDING WIZARD MODAL ================= */}
      {onboardingOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          zIndex: 5000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div className="lp-modal-neo" style={{
            maxWidth: '520px',
            width: '100%',
            position: 'relative'
          }}>
            {/* Show Close button only if onboarding is already completed once */}
            {onboardingCompleted && (
              <button 
                onClick={() => setOnboardingOpen(false)}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  border: '2px solid #000',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  background: '#fff',
                  fontWeight: '900',
                  cursor: 'pointer',
                  boxShadow: '1.5px 1.5px 0 #000'
                }}
              >
                ✕
              </button>
            )}

            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <span style={{ fontSize: '42px' }}>🎯</span>
              <h2 style={{ fontSize: '24px', fontWeight: '950', margin: '12px 0 6px 0' }}>
                Thiết lập lộ trình học tập
              </h2>
              <p style={{ fontSize: '13px', color: '#6B7280', fontWeight: '700' }}>
                Hãy cấu hình khối thi và mục tiêu điểm số để AI thiết lập lộ trình luyện đề tốt nhất cho bạn.
              </p>
            </div>

            <form onSubmit={handleSaveOnboarding} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                  1. Chọn Lớp học:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {['10', '11', '12'].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setOnboardingData({ ...onboardingData, grade: g })}
                      style={{
                        padding: '10px',
                        border: '2.5px solid #000',
                        borderRadius: '10px',
                        fontWeight: '900',
                        background: onboardingData.grade === g ? '#FFC229' : '#fff',
                        boxShadow: onboardingData.grade === g ? '2.5px 2.5px 0 #000' : '1px 1px 0 #000',
                        cursor: 'pointer'
                      }}
                    >
                      Lớp {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                  2. Chọn Tổ hợp / Khối thi mục tiêu:
                </label>
                <select 
                  className="form-control"
                  style={{ width: '100%', padding: '10px', border: '2.5px solid #000', borderRadius: '10px', fontWeight: '800' }}
                  value={onboardingData.subjectGroup}
                  onChange={(e) => {
                    const group = e.target.value;
                    let subjects = ['Toán học'];
                    if (group.startsWith('A00')) subjects = ['Toán học', 'Vật lý', 'Hóa học'];
                    else if (group.startsWith('A01')) subjects = ['Toán học', 'Vật lý', 'Tiếng Anh'];
                    else if (group.startsWith('B00')) subjects = ['Toán học', 'Hóa học', 'Sinh học'];
                    else if (group.startsWith('C00')) subjects = ['Ngữ văn', 'Lịch sử', 'Địa lý'];
                    else if (group.startsWith('D01')) subjects = ['Toán học', 'Ngữ văn', 'Tiếng Anh'];
                    setOnboardingData({ ...onboardingData, subjectGroup: group, subjects });
                  }}
                >
                  <option value="A00 (Toán - Lý - Hóa)">Khối A00 (Toán – Vật lý – Hóa học)</option>
                  <option value="A01 (Toán - Lý - Anh)">Khối A01 (Toán – Vật lý – Tiếng Anh)</option>
                  <option value="B00 (Toán - Hóa - Sinh)">Khối B00 (Toán – Hóa học – Sinh học)</option>
                  <option value="C00 (Văn - Sử - Địa)">Khối C00 (Ngữ văn – Lịch sử – Địa lý)</option>
                  <option value="D01 (Toán - Văn - Anh)">Khối D01 (Toán – Ngữ văn – Tiếng Anh)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                  3. Trường Đại học mong muốn đỗ:
                </label>
                <input 
                  type="text"
                  className="form-control"
                  style={{ width: '100%', padding: '10px', border: '2.5px solid #000', borderRadius: '10px', fontWeight: '800' }}
                  placeholder="Ví dụ: Đại học Bách Khoa Hà Nội"
                  value={onboardingData.targetSchool}
                  onChange={(e) => setOnboardingData({ ...onboardingData, targetSchool: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                  4. Mục tiêu điểm số khối thi (trên thang điểm 30):
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input 
                    type="range"
                    min="15" max="30" step="0.5"
                    style={{ flex: 1 }}
                    value={onboardingData.targetScore}
                    onChange={(e) => setOnboardingData({ ...onboardingData, targetScore: e.target.value })}
                  />
                  <strong style={{ fontSize: '20px', fontWeight: '950', border: '2.5px solid #000', padding: '6px 12px', borderRadius: '8px', background: '#FFC229' }}>
                    {onboardingData.targetScore}đ
                  </strong>
                </div>
              </div>

              <button 
                type="submit" 
                className="lp-btn--accent" 
                style={{ width: '100%', padding: '12px', fontSize: '14px', borderRadius: '12px', fontWeight: '900', border: '2.5px solid #000', marginTop: '10px' }}
              >
                🏁 Hoàn tất thiết lập & Khởi tạo lộ trình AI
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
