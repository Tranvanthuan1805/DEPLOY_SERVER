import { useState, useEffect } from 'react';
import { HiDocumentDownload, HiDocumentText, HiPresentationChartBar, HiZoomIn, HiZoomOut, HiSun, HiMoon } from 'react-icons/hi';

export default function CourseMaterials({ materials = [], onDownload }) {
  const [selectedMat, setSelectedMat] = useState(null);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [theme, setTheme] = useState('light'); // light, night, sepia

  useEffect(() => {
    if (materials && materials.length > 0) {
      if (!selectedMat || !materials.find(m => m.id === selectedMat.id)) {
        setSelectedMat(materials[0]);
        setPage(1);
      }
    } else {
      setSelectedMat(null);
    }
  }, [materials]);

  const getIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'pdf': return <HiDocumentText style={{ color: '#EF4444', fontSize: '18px' }} />;
      case 'slide':
      case 'ppt': return <HiPresentationChartBar style={{ color: '#F59E0B', fontSize: '18px' }} />;
      default: return <HiDocumentText style={{ color: '#3B82F6', fontSize: '18px' }} />;
    }
  };

  const getMockContent = (mat, pageNum) => {
    const isSlide = mat.file_type.toLowerCase() === 'slide' || mat.file_type.toLowerCase() === 'ppt';
    if (isSlide) {
      if (pageNum === 1) {
        return {
          title: `GIỚI THIỆU CHUYÊN ĐỀ: ${mat.title}`,
          bullets: [
            "• Khái quát các định nghĩa cơ bản và định lý trọng tâm.",
            "• Phân tích cấu trúc câu hỏi trong đề thi THPTQG 5 năm gần nhất.",
            "• Nhận diện các bẫy lý thuyết thường gặp cần tránh tuyệt đối.",
            "• Lộ trình tự luyện 7 ngày bứt phá chuyên đề."
          ]
        };
      }
      if (pageNum === 2) {
        return {
          title: "PHƯƠNG PHÁP TƯ DUY & GIẢI NHANH",
          bullets: [
            "• Kỹ năng loại trừ phương án sai nhanh trong 15 giây.",
            "• Công thức giải nhanh và mẹo ghi nhớ sơ đồ tư duy.",
            "• Sử dụng máy tính Casio để tối ưu hóa thời gian tính toán.",
            "• Ví dụ thực tế từ các đề thi thử trường chuyên."
          ]
        };
      }
      return {
        title: "BÀI TẬP VẬN DỤNG & TỔNG KẾT",
        bullets: [
          "• Tổng hợp 10 bài tập mẫu kèm giải thích chi tiết.",
          "• Tự đánh giá năng lực thông qua Quick Quiz.",
          "• Tài liệu tham khảo đọc thêm trang 25-30 sách giáo khoa.",
          "• Giải đáp thắc mắc trực tiếp cùng Trợ lý AI và Giáo viên."
        ]
      };
    } else {
      // PDF
      if (pageNum === 1) {
        return {
          title: `TÀI LIỆU HỌC TẬP: ${mat.title} - PHẦN 1`,
          bullets: [
            "1. TÓM TẮT LÝ THUYẾT CỐT LÕI:",
            "Hệ thống hóa toàn bộ định nghĩa, tính chất, hệ quả cần ghi nhớ.",
            "Các công thức toán học/vật lý quan trọng được định dạng rõ ràng.",
            "2. PHÂN TÍCH VÍ DỤ MINH HỌA:",
            "Ví dụ 1: Bài toán cơ bản áp dụng trực tiếp công thức.",
            "Lời giải chi tiết từng bước giải thích rõ lý do chọn đáp án."
          ]
        };
      }
      return {
        title: `TÀI LIỆU HỌC TẬP: ${mat.title} - PHẦN 2`,
        bullets: [
          "3. NHẬT KÝ LỖI SAI THƯỜNG GẶP:",
          "- Nhầm lẫn đơn vị đo lường cơ bản (ví dụ: cm và m).",
          "- Bỏ quên điều kiện xác định của phương trình logarit.",
          "4. BÀI TẬP TỰ LUYỆN ĐỀ XUẤT:",
          "Gồm 20 câu trắc nghiệm chia đều theo 3 mức độ nhận thức: Nhận biết, Thông hiểu và Vận dụng."
        ]
      };
    }
  };

  if (materials.length === 0) {
    return (
      <div className="cm-card animate-in" style={{ padding: '24px', textAlign: 'center' }}>
        <p style={{ fontSize: '13px', color: 'var(--stone-text-secondary)', margin: 0 }}>
          Bài giảng này chưa đính kèm tài liệu học liệu.
        </p>
      </div>
    );
  }

  const maxPages = selectedMat?.file_type.toLowerCase() === 'pdf' ? 2 : 3;
  const mockContent = selectedMat ? getMockContent(selectedMat, page) : null;
  const themeBg = theme === 'night' ? '#1E293B' : theme === 'sepia' ? '#FDFBF7' : '#FFFFFF';
  const themeText = theme === 'night' ? '#F1F5F9' : theme === 'sepia' ? '#433422' : '#1C1917';
  const themeBorder = theme === 'night' ? '#334155' : theme === 'sepia' ? '#EAE6DF' : '#EAE6DF';

  return (
    <div className="cm-card animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px' }}>
      <h3 className="cm-title" style={{ margin: 0, fontSize: '15px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px' }}>
        📂 Học liệu bài giảng lồng ghép trực tiếp
      </h3>

      <div style={{ display: 'flex', gap: '16px', minHeight: '360px', flexWrap: 'wrap' }} className="materials-container-flex">
        {/* Style tag for responsive materials view */}
        <style>{`
          .materials-list-col {
            width: 220px;
            flex-shrink: 0;
            display: flex;
            flex-direction: column;
            gap: 10px;
            border-right: 1.5px solid var(--border-warm);
            padding-right: 16px;
          }
          .material-viewer-col {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
          }
          .mat-list-btn {
            width: 100%;
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 12px;
            border: 2px solid #000;
            border-radius: 10px;
            font-size: 12px;
            font-weight: 800;
            text-align: left;
            cursor: pointer;
            transition: all 0.15s;
            box-shadow: 2px 2px 0px #000;
          }
          .mat-list-btn:hover {
            transform: translate(-1px, -1px);
            box-shadow: 3px 3px 0px #000;
          }
          .mat-list-btn--active {
            background: #000 !important;
            color: #fff !important;
            box-shadow: none !important;
            transform: translate(1px, 1px) !important;
          }
          @media (max-width: 768px) {
            .materials-list-col {
              width: 100%;
              border-right: none;
              padding-right: 0;
              border-bottom: 1.5px solid var(--border-warm);
              padding-bottom: 16px;
            }
          }
        `}</style>

        {/* Column 1: Materials list select sidebar */}
        <div className="materials-list-col">
          <span style={{ fontSize: '11px', fontWeight: '900', color: 'var(--stone-text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
            Danh sách tài liệu ({materials.length})
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '380px', paddingRight: '4px' }}>
            {materials.map(mat => {
              const isActive = selectedMat && selectedMat.id === mat.id;
              return (
                <button
                  key={mat.id}
                  onClick={() => {
                    setSelectedMat(mat);
                    setPage(1);
                  }}
                  className={`mat-list-btn ${isActive ? 'mat-list-btn--active' : ''}`}
                  style={{ background: '#fff', color: '#000' }}
                >
                  {getIcon(mat.file_type)}
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {mat.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Column 2: Document reader main view */}
        <div className="material-viewer-col">
          {selectedMat ? (
            <>
              {/* Controls bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px', borderBottom: '1.5px solid var(--border-warm)', paddingBottom: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                  <span style={{ fontSize: '10px', color: 'var(--stone-text-muted)', fontWeight: 'bold' }}>ĐANG ĐỌC TÀI LIỆU</span>
                  <strong style={{ fontSize: '13px', color: 'var(--stone-text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '280px' }}>{selectedMat.title}</strong>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button 
                    onClick={() => setZoom(z => Math.max(75, z - 25))} 
                    style={{ background: 'none', border: '1.5px solid var(--border-warm)', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex' }}
                    title="Thu nhỏ"
                  >
                    <HiZoomOut />
                  </button>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', minWidth: '35px', textAlign: 'center' }}>{zoom}%</span>
                  <button 
                    onClick={() => setZoom(z => Math.min(150, z + 25))} 
                    style={{ background: 'none', border: '1.5px solid var(--border-warm)', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex' }}
                    title="Phóng to"
                  >
                    <HiZoomIn />
                  </button>

                  <div style={{ width: '1px', height: '18px', background: 'var(--border-warm)', margin: '0 2px' }} />
                  
                  <button 
                    onClick={() => setTheme(t => t === 'light' ? 'sepia' : t === 'sepia' ? 'night' : 'light')} 
                    style={{ background: 'none', border: '1.5px solid var(--border-warm)', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex', color: theme === 'night' ? '#F59E0B' : '#64748B' }}
                    title="Đổi giao diện đọc"
                  >
                    {theme === 'night' ? <HiSun /> : <HiMoon />}
                  </button>
                </div>
              </div>

              {/* Lined Paper View Container */}
              <div style={{ display: 'flex', justifyContent: 'center', background: '#F1F5F9', borderRadius: '12px', padding: '16px', minHeight: '260px', overflow: 'hidden' }}>
                <div style={{ 
                  width: '100%',
                  maxWidth: '560px', 
                  background: themeBg, 
                  color: themeText, 
                  border: `1.5px solid ${themeBorder}`, 
                  borderRadius: '8px', 
                  padding: '20px', 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: 'top center',
                  transition: 'all 0.2s',
                  textAlign: 'left'
                }}>
                  {mockContent && (
                    <>
                      <h3 style={{ fontSize: '14px', fontWeight: '900', borderBottom: `1.5px solid ${themeBorder}`, paddingBottom: '8px', marginTop: 0 }}>
                        {mockContent.title}
                      </h3>
                      <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', lineHeight: 1.6 }}>
                        {mockContent.bullets.map((b, i) => (
                          <p key={i} style={{ margin: 0 }}>{b}</p>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Bottom footer pagination */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', borderTop: '1.5px solid var(--border-warm)', paddingTop: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--stone-text-secondary)', fontWeight: 'bold' }}>
                  Trang {page} / {maxPages}
                </span>
                
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button 
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="cm-btn"
                    style={{ padding: '4px 10px', fontSize: '11px', background: page === 1 ? '#e2e8f0' : '', cursor: page === 1 ? 'default' : 'pointer' }}
                  >
                    Trang trước
                  </button>
                  <button 
                    disabled={page === maxPages}
                    onClick={() => setPage(p => Math.min(maxPages, p + 1))}
                    className="cm-btn"
                    style={{ padding: '4px 10px', fontSize: '11px', background: page === maxPages ? '#e2e8f0' : '', cursor: page === maxPages ? 'default' : 'pointer' }}
                  >
                    Trang tiếp
                  </button>
                </div>

                <button 
                  className="cm-btn"
                  style={{ padding: '4px 10px', fontSize: '11px', background: 'var(--emerald-light)', color: 'var(--emerald-primary)', border: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                  onClick={() => onDownload(selectedMat)}
                >
                  <HiDocumentDownload /> Tải tài liệu
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--stone-text-muted)', fontSize: '13px', fontStyle: 'italic' }}>
              Hãy chọn một tài liệu ở danh sách bên trái để đọc trực tiếp.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
