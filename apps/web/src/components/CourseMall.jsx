import { useState } from 'react';
import { HiSearch, HiAcademicCap, HiStar, HiUsers, HiBookOpen, HiCheckCircle, HiLockClosed, HiSparkles } from 'react-icons/hi';

// Giá trong DB lưu dưới dạng số nhỏ (499 = 499.000đ)
// Nếu giá < 10.000 thì nhân 1000, rồi format theo chuẩn Việt Nam
function formatPrice(raw) {
  if (!raw && raw !== 0) return 'Liên hệ';
  const num = typeof raw === 'string' ? parseFloat(raw.replace(/[^\d.]/g, '')) : Number(raw);
  if (isNaN(num) || num === 0) return 'Miễn phí';
  const actualPrice = num < 10000 ? num * 1000 : num;
  return actualPrice.toLocaleString('vi-VN') + ' VNĐ';
}

export default function CourseMall({ courses, coursesLoading, coursesError, currentUser, onSelectCourse, onCheckoutCourse }) {
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'free' | 'paid' | 'owned'

  const subjects = ['All', 'Toán học', 'Vật lý', 'Hóa học', 'Tiếng Anh'];

  // Enrich courses with visual data
  const decoratedCourses = courses.map(c => {
    const isPurchased = currentUser?.enrollments?.some(e => e.courseId === c.id);
    const isFree = !c.price || c.price === 0 || c.price === '0';
    const isOwned = isPurchased || (isFree && currentUser?.startedFreeCourses?.includes(c.id));

    let rating = '4.9';
    let students = '1,240';
    let duration = '45 giờ học';
    let imageBg = 'linear-gradient(135deg, #6C5CE7, #a29bfe)';

    if (c.id === 1) {
      rating = '4.8'; students = '2,150'; duration = '32 giờ học';
      imageBg = 'linear-gradient(135deg, #0984E3, #74b9ff)';
    } else if (c.id === 2) {
      rating = '4.9'; students = '1,890'; duration = '40 giờ học';
      imageBg = 'linear-gradient(135deg, #e17055, #fab1a0)';
    } else if (c.id === 3) {
      rating = '4.7'; students = '950'; duration = '28 giờ học';
      imageBg = 'linear-gradient(135deg, #00b894, #55efc4)';
    } else if (c.id % 3 === 0) {
      imageBg = 'linear-gradient(135deg, #fd79a8, #e84393)';
    } else if (c.id % 3 === 1) {
      imageBg = 'linear-gradient(135deg, #fdcb6e, #e17055)';
    }

    return { ...c, isPurchased, isFree, isOwned, rating, students, duration, imageBg };
  });

  // Filter by tab
  const tabFiltered = decoratedCourses.filter(c => {
    if (activeTab === 'free') return c.isFree;
    if (activeTab === 'paid') return !c.isFree;
    if (activeTab === 'owned') return c.isOwned;
    return true; // 'all'
  });

  // Filter by subject + search
  const filteredCourses = tabFiltered.filter(c => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.teacherName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubject === 'All' || c.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  const tabConfig = [
    { key: 'all',   label: 'Tất cả',   icon: '📚', count: decoratedCourses.length },
    { key: 'free',  label: 'Miễn phí', icon: '🎁', count: decoratedCourses.filter(c => c.isFree).length },
    { key: 'paid',  label: 'Trả phí',  icon: '💎', count: decoratedCourses.filter(c => !c.isFree).length },
    { key: 'owned', label: 'Đã mua',   icon: '✅', count: decoratedCourses.filter(c => c.isOwned).length },
  ];

  return (
    <div className="course-mall-container animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Hero Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #6C5CE7 0%, #FD79A8 100%)',
          borderRadius: 'var(--radius-lg)',
          padding: '36px',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(108,92,231,0.25)'
        }}
      >
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '600px' }}>
          <span style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Kho Khóa Học EduPath AI
          </span>
          <h1 style={{ fontSize: '26px', fontWeight: '800', marginTop: '14px', marginBottom: '10px', lineHeight: '1.3' }}>
            Chinh Phục Điểm Số Ước Mơ Cùng Đội Ngũ Thủ Khoa & Chuyên Gia
          </h1>
          <p style={{ fontSize: '14px', opacity: 0.9, lineHeight: '1.5', marginBottom: '24px' }}>
            Học tập thông minh hơn với lộ trình tự động điều chỉnh theo năng lực thực tế. Khám phá {decoratedCourses.length}+ khóa học từ miễn phí đến nâng cao.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', borderRadius: '12px', padding: '10px 18px', fontSize: '13px', fontWeight: '700' }}>
              🎁 {decoratedCourses.filter(c => c.isFree).length} khóa miễn phí
            </div>
            <div style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', borderRadius: '12px', padding: '10px 18px', fontSize: '13px', fontWeight: '700' }}>
              💎 {decoratedCourses.filter(c => !c.isFree).length} khóa cao cấp
            </div>
            <div style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', borderRadius: '12px', padding: '10px 18px', fontSize: '13px', fontWeight: '700' }}>
              ✅ {decoratedCourses.filter(c => c.isOwned).length} đã sở hữu
            </div>
          </div>
        </div>
        <div style={{ position: 'absolute', right: '-50px', bottom: '-50px', width: '250px', height: '250px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', filter: 'blur(30px)' }} />
        <div style={{ position: 'absolute', right: '150px', top: '-50px', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', filter: 'blur(20px)' }} />
      </div>

      {/* Filter & Search Bar */}
      <div className="card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Tab Filter: All / Free / Paid / Owned */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {tabConfig.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 18px',
                borderRadius: '24px',
                border: activeTab === tab.key ? '2px solid var(--primary)' : '2px solid var(--border)',
                background: activeTab === tab.key ? 'var(--primary)' : 'var(--bg-main)',
                color: activeTab === tab.key ? '#fff' : 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: activeTab === tab.key ? '0 4px 12px rgba(108,92,231,0.3)' : 'none'
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              <span style={{
                background: activeTab === tab.key ? 'rgba(255,255,255,0.25)' : 'var(--border)',
                color: activeTab === tab.key ? '#fff' : 'var(--text-muted)',
                borderRadius: '12px',
                padding: '1px 8px',
                fontSize: '11px',
                fontWeight: '800'
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Subject + Search Row */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
            {subjects.map(subj => (
              <button
                key={subj}
                onClick={() => setSelectedSubject(subj)}
                style={{
                  border: '1px solid var(--border)',
                  background: selectedSubject === subj ? 'var(--primary-bg)' : 'transparent',
                  color: selectedSubject === subj ? 'var(--primary)' : 'var(--text-secondary)',
                  fontWeight: selectedSubject === subj ? '700' : '500',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s'
                }}
              >
                {subj === 'All' ? 'Tất cả môn' : subj}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', minWidth: '260px' }}>
            <HiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '18px' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Tìm tên khóa học, thầy cô..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '38px', width: '100%', fontSize: '13px' }}
            />
          </div>
        </div>
      </div>

      {/* Loading State */}
      {coursesLoading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '20px' }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="card" style={{ height: '260px', padding: 0, overflow: 'hidden' }}>
              <div style={{ height: '110px', background: 'linear-gradient(90deg, var(--bg-main) 25%, var(--border) 50%, var(--bg-main) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
              <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ height: '12px', width: '60%', borderRadius: '6px', background: 'var(--border)' }} />
                <div style={{ height: '10px', width: '80%', borderRadius: '6px', background: 'var(--bg-main)' }} />
                <div style={{ height: '10px', width: '40%', borderRadius: '6px', background: 'var(--bg-main)' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error Banner */}
      {coursesError && !coursesLoading && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: '#ef4444' }}>
          <span style={{ fontSize: '18px' }}>⚠️</span>
          <div>
            <strong>Đang dùng dữ liệu mẫu</strong> — Không thể kết nối API: {coursesError}
          </div>
        </div>
      )}

      {/* Course Grid */}
      {!coursesLoading && filteredCourses.length > 0 ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <HiAcademicCap style={{ color: 'var(--primary)', fontSize: '20px' }} />
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)' }}>
              {filteredCourses.length} khóa học
              {activeTab !== 'all' && ` · ${tabConfig.find(t => t.key === activeTab)?.label}`}
              {selectedSubject !== 'All' && ` · ${selectedSubject}`}
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '20px' }}>
            {filteredCourses.map(c => (
              <div
                key={c.id}
                className="card landing-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  overflow: 'hidden',
                  padding: 0,
                  height: '100%',
                  border: c.isOwned ? '2px solid var(--accent-green)' : '1px solid var(--border)',
                  transition: 'all 0.25s',
                  position: 'relative'
                }}
              >
                {/* Badge góc trên phải */}
                {c.isOwned && (
                  <div style={{
                    position: 'absolute', top: '10px', right: '10px', zIndex: 3,
                    background: 'var(--accent-green)', color: '#fff',
                    borderRadius: '20px', padding: '3px 10px',
                    fontSize: '10px', fontWeight: '800',
                    display: 'flex', alignItems: 'center', gap: '4px',
                    boxShadow: '0 2px 8px rgba(0,200,100,0.4)'
                  }}>
                    <HiCheckCircle /> Đã sở hữu
                  </div>
                )}
                {c.isFree && !c.isOwned && (
                  <div style={{
                    position: 'absolute', top: '10px', right: '10px', zIndex: 3,
                    background: 'linear-gradient(135deg, #00b894, #00cec9)', color: '#fff',
                    borderRadius: '20px', padding: '3px 10px',
                    fontSize: '10px', fontWeight: '800',
                    boxShadow: '0 2px 8px rgba(0,184,148,0.4)'
                  }}>
                    🎁 MIỄN PHÍ
                  </div>
                )}

                {/* Visual Banner */}
                <div style={{ background: c.imageBg, height: '110px', padding: '16px 16px 12px', color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                  <span style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', width: 'fit-content', padding: '3px 10px', borderRadius: '10px', fontSize: '10px', fontWeight: 'bold', marginBottom: '6px' }}>
                    {c.subject}
                  </span>
                  <h4 style={{ fontSize: '14.5px', fontWeight: 'bold', margin: 0, lineHeight: '1.35', textShadow: '0 2px 4px rgba(0,0,0,0.25)', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {c.title}
                  </h4>
                </div>

                {/* Info */}
                <div style={{ padding: '18px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '14px' }}>
                  <div>
                    <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0 }}>
                      Giảng viên: <strong>{c.teacherName}</strong>
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {c.lessons?.length || 0} bài giảng · {c.duration}
                    </p>
                    <div style={{ display: 'flex', gap: '14px', marginTop: '10px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <HiStar style={{ color: '#f1c40f' }} /> {c.rating}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <HiUsers /> {c.students} học viên
                      </span>
                    </div>
                  </div>

                  {/* Action Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                    <div>
                      {c.isFree ? (
                        <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--accent-green)' }}>Miễn phí</span>
                      ) : (
                        <>
                          <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block', textDecoration: 'line-through' }}>
                            {formatPrice((Number(c.price) < 10000 ? Number(c.price) * 1000 : Number(c.price)) * 1.3)}
                          </span>
                          <span style={{ fontSize: '17px', color: 'var(--accent-orange)', fontWeight: '800' }}>
                            {formatPrice(c.price)}
                          </span>
                        </>
                      )}
                    </div>

                    {c.isOwned ? (
                      <button
                        className="btn-primary"
                        style={{ padding: '8px 16px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}
                        onClick={() => onSelectCourse(c)}
                      >
                        <HiBookOpen /> Vào học
                      </button>
                    ) : c.isFree ? (
                      <button
                        className="btn-primary"
                        style={{ padding: '8px 16px', fontSize: '12px', background: 'linear-gradient(135deg, #00b894, #00cec9)', border: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}
                        onClick={() => onSelectCourse(c)}
                      >
                        <HiSparkles /> Học ngay
                      </button>
                    ) : (
                      <button
                        className="btn-primary"
                        style={{ padding: '8px 16px', fontSize: '12px', background: 'linear-gradient(135deg, #e17055, #fab1a0)', border: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}
                        onClick={() => onCheckoutCourse(c)}
                      >
                        <HiLockClosed /> Mua khóa học
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '50px 20px' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600' }}>
            Không tìm thấy khóa học nào phù hợp.
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '6px' }}>
            Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.
          </p>
          <button
            style={{ marginTop: '16px', padding: '8px 20px', borderRadius: '20px', border: '1px solid var(--primary)', background: 'transparent', color: 'var(--primary)', cursor: 'pointer', fontWeight: '700', fontSize: '13px' }}
            onClick={() => { setActiveTab('all'); setSelectedSubject('All'); setSearchQuery(''); }}
          >
            Xem tất cả
          </button>
        </div>
      )}
    </div>
  );
}
