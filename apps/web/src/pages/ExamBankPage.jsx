import { useState, useEffect, useMemo } from 'react';
import { toast } from '../utils/toast';
import { api } from '../api';
import {
  HiSearch, HiDownload, HiEye, HiX,
  HiAcademicCap, HiDocumentText, HiClock,
  HiChartBar, HiArrowLeft, HiSparkles,
  HiBookOpen, HiClipboardList, HiLockClosed
} from 'react-icons/hi';

// ============================================================
// SUBJECT CONFIGURATION WITH DB MAPPINGS
// ============================================================
const SUBJECTS = [
  { id: 'toan', name: 'Toán Học', emoji: '🦉', color: '#5b75f3', dbName: 'Toán Học' },
  { id: 'van', name: 'Ngữ Văn', emoji: '🦋', color: '#4598a7', dbName: 'Ngữ Văn' },
  { id: 'anh', name: 'Tiếng Anh', emoji: '🐸', color: '#db8142', dbName: 'Tiếng Anh' },
  { id: 'ly', name: 'Vật Lý', emoji: '🦊', color: '#52ad58', dbName: 'Vật Lý' },
  { id: 'hoa', name: 'Hóa Học', emoji: '🐙', color: '#cf6674', dbName: 'Hóa Học' },
  { id: 'sinh', name: 'Sinh Học', emoji: '🐢', color: '#6f4ab3', dbName: 'Sinh Học' },
  { id: 'su', name: 'Lịch Sử', emoji: '📜', color: '#c44747', dbName: 'Lịch Sử' },
  { id: 'dia', name: 'Địa Lý', emoji: '🌍', color: '#2d8659', dbName: 'Địa Lý' },
  { id: 'ielts', name: 'Toeic & Ielts', emoji: '🇬🇧', color: '#e17055', dbName: 'Toeic & Ielts' },
  { id: 'sat', name: 'SAT', emoji: '🎓', color: '#00cec9', dbName: 'SAT' },
  { id: 'toeic', name: 'TOEIC', emoji: '📖', color: '#6c5ce7', dbName: 'TOEIC' },
  { id: 'dgnl', name: 'ĐGNL', emoji: '📝', color: '#fdcb6e', dbName: 'ĐGNL' }
];

const LEVELS = ['Tất cả', '10', '11', '12', 'Sinh viên'];
const PRICE_FILTERS = ['Tất cả', 'Miễn phí', 'Premium'];

// ============================================================
// RENDER HELPER FOR STRUCTURED METADATA
// ============================================================
function renderDescription(desc) {
  if (!desc) {
    return <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0, fontStyle: 'italic' }}>Không có mô tả chi tiết cho tài liệu này.</p>;
  }
  try {
    const parsed = JSON.parse(desc);
    if (Array.isArray(parsed)) {
      return parsed.map((item, idx) => {
        if (item.type === 'heading') {
          return <h4 key={idx} style={{ fontSize: '14.5px', fontWeight: '800', marginTop: '16px', marginBottom: '8px', color: '#1e293b' }}>{item.text}</h4>;
        }
        if (item.type === 'paragraph') {
          return <p key={idx} style={{ fontSize: '13.5px', color: '#475569', lineHeight: '1.6', marginBottom: '8px' }}>{item.text}</p>;
        }
        if (item.type === 'list') {
          return (
            <ul key={idx} style={{ paddingLeft: '20px', fontSize: '13.5px', color: '#475569', marginBottom: '10px', listStyleType: 'disc' }}>
              {item.items?.map((li, lIdx) => <li key={lIdx} style={{ marginBottom: '4px' }}>{li}</li>)}
            </ul>
          );
        }
        if (item.type === 'divider') {
          return <hr key={idx} style={{ border: 'none', borderTop: '1px dashed #e2e8f0', margin: '14px 0' }} />;
        }
        return null;
      });
    }
  } catch (e) {
    // Treat as raw text if JSON parse fails
  }
  return <p style={{ fontSize: '13.5px', color: '#475569', lineHeight: '1.6', whiteSpace: 'pre-wrap', margin: 0 }}>{desc}</p>;
}

// ============================================================
// EXAM BANK PAGE COMPONENT (DOCUMENT REPOSITORY)
// ============================================================
export default function ExamBankPage({ currentUser, navigateTo }) {
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('Tất cả');
  const [selectedPriceFilter, setSelectedPriceFilter] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);

  // Load documents from backend
  useEffect(() => {
    let active = true;
    const fetchDocuments = async () => {
      setLoading(true);
      try {
        const queryParams = {};
        if (selectedSubject !== 'all') {
          const matched = SUBJECTS.find(s => s.id === selectedSubject);
          queryParams.subject = matched ? matched.dbName : selectedSubject;
        }
        if (selectedLevel !== 'Tất cả') {
          queryParams.level = selectedLevel;
        }
        if (selectedPriceFilter === 'Miễn phí') {
          queryParams.isFree = 'true';
        } else if (selectedPriceFilter === 'Premium') {
          queryParams.isFree = 'false';
        }
        if (searchQuery.trim()) {
          queryParams.search = searchQuery;
        }
        
        const data = await api.getDocumentResources(queryParams);
        if (active) {
          setDocuments(data);
          setError(null);
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Không thể tải danh sách tài liệu.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchDocuments();
    }, 300);

    return () => {
      active = false;
      clearTimeout(delayDebounceFn);
    };
  }, [selectedSubject, selectedLevel, selectedPriceFilter, searchQuery]);

  // Compute metrics from fetched data
  const stats = useMemo(() => {
    const total = documents.length;
    const uniqueSubjects = new Set(documents.map(d => d.subject)).size;
    const freeCount = documents.filter(d => d.isFree).length;
    return { total, uniqueSubjects, freeCount };
  }, [documents]);

  const handleDownload = (doc) => {
    if (doc.driveUrl) {
      window.open(doc.driveUrl, '_blank');
      toast(`Đang tải xuống: ${doc.title}`, 'success');
    } else {
      toast(`Tài liệu này chưa có liên kết tải trực tiếp.`, 'error');
    }
  };

  const isGuest = !currentUser;

  return (
    <div className="exambank-page">
      {/* Guest Header */}
      {isGuest && (
        <header className="exambank-guest-header">
          <div className="exambank-guest-header__logo" onClick={() => navigateTo('/')}>
            <div className="exambank-guest-header__logo-icon">E</div>
            <span>EduPath <em>AI</em></span>
          </div>
          <div className="exambank-guest-header__actions">
            <button className="exambank-guest-header__btn exambank-guest-header__btn--back" onClick={() => navigateTo('/')}>
              <HiArrowLeft style={{ marginRight: 4 }} /> Trang chủ
            </button>
            <button
              className="exambank-guest-header__btn exambank-guest-header__btn--login"
              onClick={() => {
                navigateTo('/');
                setTimeout(() => window.dispatchEvent(new CustomEvent('edupath-auth-redirect', { detail: { mode: 'login' } })), 100);
              }}
            >
              Đăng nhập
            </button>
            <button
              className="exambank-guest-header__btn exambank-guest-header__btn--register"
              onClick={() => {
                navigateTo('/');
                setTimeout(() => window.dispatchEvent(new CustomEvent('edupath-auth-redirect', { detail: { mode: 'register' } })), 100);
              }}
            >
              Đăng ký miễn phí
            </button>
          </div>
        </header>
      )}

      {/* Hero */}
      <div className="exambank-hero">
        <div className="exambank-hero__badge">
          <HiAcademicCap /> Ngân hàng tài liệu học tập
        </div>
        <h1>
          Ngân hàng tài liệu <span>EduPath AI</span>
        </h1>
        <p className="exambank-hero__desc">
          Thư viện tích hợp hàng ngàn tài liệu học tập, chuyên đề ôn thi thử, ebook công thức toán học và từ vựng phong phú.
          Truy cập Google Drive để xem và tải về miễn phí.
        </p>

        <div className="exambank-stats">
          <div className="exambank-stat">
            <span className="exambank-stat__number">{stats.total}</span>
            <div className="exambank-stat__label">Tài liệu khả dụng</div>
          </div>
          <div className="exambank-stat">
            <span className="exambank-stat__number">{stats.uniqueSubjects}</span>
            <div className="exambank-stat__label">Chuyên mục môn học</div>
          </div>
          <div className="exambank-stat">
            <span className="exambank-stat__number">{stats.freeCount}</span>
            <div className="exambank-stat__label">Tài liệu Miễn phí</div>
          </div>
          <div className="exambank-stat">
            <span className="exambank-stat__number">Khối 10-ĐH</span>
            <div className="exambank-stat__label">Cấp bậc học tập</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="exambank-filters">
        <div className="exambank-filters__inner">
          {/* Subject Filter */}
          <div className="exambank-filters__row">
            <span className="exambank-filters__label">📚 Môn học</span>
            <div className="exambank-filters__chips">
              <button
                className={`exambank-chip ${selectedSubject === 'all' ? 'exambank-chip--active' : ''}`}
                onClick={() => setSelectedSubject('all')}
              >
                Tất cả
              </button>
              {SUBJECTS.map(s => (
                <button
                  key={s.id}
                  className={`exambank-chip ${selectedSubject === s.id ? 'exambank-chip--active' : ''}`}
                  style={selectedSubject === s.id ? { background: s.color, borderColor: s.color } : {}}
                  onClick={() => setSelectedSubject(s.id)}
                >
                  {s.emoji} {s.name}
                </button>
              ))}
            </div>
          </div>

          <div className="exambank-filters__divider" />

          {/* Level + Price Tier + Search */}
          <div className="exambank-filters__row">
            <span className="exambank-filters__label">🎓 Lớp học</span>
            <div className="exambank-filters__chips">
              {LEVELS.map(l => (
                <button
                  key={l}
                  className={`exambank-chip ${selectedLevel === l ? 'exambank-chip--active' : ''}`}
                  onClick={() => setSelectedLevel(l)}
                >
                  {l === 'Tất cả' ? 'Tất cả' : (l === 'Sinh viên' ? 'Sinh viên' : `Lớp ${l}`)}
                </button>
              ))}
            </div>

            <span className="exambank-filters__label" style={{ marginLeft: 8 }}>⚡ Bản quyền</span>
            <div className="exambank-filters__chips">
              {PRICE_FILTERS.map(pf => (
                <button
                  key={pf}
                  className={`exambank-chip ${selectedPriceFilter === pf ? 'exambank-chip--active' : ''}`}
                  onClick={() => setSelectedPriceFilter(pf)}
                >
                  {pf}
                </button>
              ))}
            </div>
          </div>

          <div className="exambank-filters__divider" />

          <div className="exambank-filters__row">
            <div className="exambank-filters__search">
              <HiSearch className="exambank-filters__search-icon" />
              <input
                type="text"
                placeholder="Tìm kiếm tài liệu học tập theo tiêu đề..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <span className="exambank-filters__count">
              Hiển thị {documents.length} tài liệu phù hợp
            </span>
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div className="exambank-content">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div className="auth-alert success" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              💡 Đang tải danh sách tài liệu...
            </div>
          </div>
        ) : error ? (
          <div className="auth-alert error" style={{ maxWidth: '400px', margin: '40px auto', textAlign: 'center' }}>
            {error}
          </div>
        ) : documents.length === 0 ? (
          <div className="exambank-empty">
            <div className="exambank-empty__icon">📭</div>
            <h3 className="exambank-empty__title">Không tìm thấy tài liệu</h3>
            <p className="exambank-empty__desc">Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
          </div>
        ) : (
          <div className="exambank-grid">
            {documents.map((doc) => {
              // Match subject color and emoji
              const matchedSubject = SUBJECTS.find(s => s.dbName.toLowerCase() === doc.subject.toLowerCase());
              const cardColor = matchedSubject ? matchedSubject.color : '#64748b';
              const cardEmoji = matchedSubject ? matchedSubject.emoji : '📄';
              
              // Get file extension from title (e.g. PDF)
              const ext = doc.title.split('.').pop()?.toUpperCase() || 'PDF';
              const displayExt = ext.length > 4 ? 'DOC' : ext;

              return (
                <article
                  key={doc.id}
                  className="exambank-card"
                  style={{ '--card-color': cardColor }}
                >
                  <div className="exambank-card__header">
                    <div className="exambank-card__year-badge" style={{ background: cardColor }}>
                      <span>{displayExt}</span>
                      <small>Định dạng</small>
                    </div>
                    <div className="exambank-card__info">
                      <div className="exambank-card__subject-tag">
                        {cardEmoji} {doc.subject}
                      </div>
                      <h3 className="exambank-card__title" style={{ fontSize: '14px', fontWeight: '800', maxHeight: '42px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {doc.title}
                      </h3>
                      <p className="exambank-card__subtitle" style={{ fontSize: '11.5px', marginTop: '4px' }}>
                        Khối lớp: {doc.level === 'Sinh viên' ? 'Sinh viên' : `Lớp ${doc.level}`}
                      </p>
                    </div>
                  </div>

                  <div className="exambank-card__stats" style={{ background: '#FAF8F4' }}>
                    <div className="exambank-card__stat">
                      <span className="exambank-card__stat-value" style={{ color: doc.isFree ? '#22C55E' : '#E28743' }}>
                        {doc.isFree ? 'Miễn phí' : 'Premium'}
                      </span>
                      <div className="exambank-card__stat-label">Bản quyền</div>
                    </div>
                    <div className="exambank-card__stat">
                      <span className="exambank-card__stat-value">
                        {doc.price === 0 ? '0đ' : `${doc.price.toLocaleString('vi-VN')}đ`}
                      </span>
                      <div className="exambank-card__stat-label">Đơn giá</div>
                    </div>
                    <div className="exambank-card__stat">
                      <span className="exambank-card__stat-value">Drive</span>
                      <div className="exambank-card__stat-label">Lưu trữ</div>
                    </div>
                  </div>

                  <div className="exambank-card__actions">
                    <button
                      className="exambank-card__btn exambank-card__btn--view"
                      onClick={() => setPreviewDoc(doc)}
                    >
                      <HiEye /> Xem chi tiết
                    </button>
                    <button
                      className="exambank-card__btn exambank-card__btn--download"
                      onClick={() => handleDownload(doc)}
                    >
                      <HiDownload /> Tải tài liệu
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewDoc && (
        <div className="exambank-modal-overlay" onClick={() => setPreviewDoc(null)}>
          <div className="exambank-modal" onClick={e => e.stopPropagation()}>
            <div className="exambank-modal__header">
              <h2>
                📁 Chi tiết tài liệu: {previewDoc.title}
              </h2>
              <button className="exambank-modal__close" onClick={() => setPreviewDoc(null)}>
                <HiX />
              </button>
            </div>

            <div className="exambank-modal__body">
              {/* Document info tags */}
              <div className="exambank-modal__exam-info">
                <div className="exambank-modal__exam-tag">
                  📚 Môn học: <strong>{previewDoc.subject}</strong>
                </div>
                <div className="exambank-modal__exam-tag">
                  🎓 Trình độ: <strong>{previewDoc.level === 'Sinh viên' ? 'Sinh viên' : `Lớp ${previewDoc.level}`}</strong>
                </div>
                <div className="exambank-modal__exam-tag">
                  💰 Học phí: <strong style={{ color: previewDoc.isFree ? '#10b981' : '#d97706' }}>{previewDoc.price === 0 ? 'Miễn phí' : `${previewDoc.price.toLocaleString('vi-VN')}đ`}</strong>
                </div>
                <div className="exambank-modal__exam-tag">
                  📁 Nơi lưu: <strong>Google Drive</strong>
                </div>
              </div>

              {/* Description block */}
              <div className="exambank-modal__section">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1.5px solid #e2e8f0', paddingBottom: '8px', marginBottom: '16px' }}>
                  <HiDocumentText /> Tóm tắt tài liệu & mô tả chi tiết
                </h3>
                <div className="exambank-modal__question" style={{ background: '#faf9f6', padding: '20px', borderRadius: '12px', border: '1.5px solid #e8e2d6' }}>
                  {renderDescription(previewDoc.description)}
                </div>
              </div>

              {/* Notice */}
              <div style={{
                background: '#fffbeb',
                border: '1.5px solid #fbbf24',
                borderRadius: 12,
                padding: '14px 18px',
                fontSize: '13px',
                color: '#92400e',
                lineHeight: 1.6,
                marginBottom: '24px'
              }}>
                <strong>📌 Hướng dẫn sử dụng:</strong> Tài liệu học tập của em sẽ được mở và tải về trực tiếp từ tài khoản Google Drive chính thức của hệ thống. Vui lòng bấm vào nút dưới đây để chuyển hướng tới Drive.
              </div>

              {/* Action Buttons */}
              <div className="exambank-modal__actions">
                <button className="exambank-modal__btn exambank-modal__btn--secondary" onClick={() => setPreviewDoc(null)}>
                  Đóng cửa sổ
                </button>
                <button className="exambank-modal__btn exambank-modal__btn--primary" onClick={() => handleDownload(previewDoc)}>
                  <HiDownload /> Mở Google Drive để Tải về
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
