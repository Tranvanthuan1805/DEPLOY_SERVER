import { useState } from 'react';
import { HiMail, HiLockClosed, HiUser, HiBookOpen, HiArrowLeft, HiEye, HiEyeOff, HiCheckCircle, HiExclamationCircle } from 'react-icons/hi';

export default function AuthPage({ defaultMode = 'login', onAuthSuccess, usersList, addLog, onBackToLanding }) {
  const [mode, setMode] = useState(defaultMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [combo, setCombo] = useState('A01 (Toán – Lý – Anh)');
  const [userRole, setUserRole] = useState('student');
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const switchMode = (m) => {
    setMode(m);
    setErrorMessage('');
    setSuccessMessage('');
    setName('');
    setPassword('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    setTimeout(() => {
      setLoading(false);

      if (mode === 'login') {
        if (email === 'admin@edupath.vn' && password === 'admin123') {
          addLog('Quản trị viên đăng nhập thành công', 'sys');
          onAuthSuccess({ name: 'Quản trị viên Hệ thống', email: 'admin@edupath.vn', role: 'admin', avatar: 'AD' });
          return;
        }
        const matched = usersList.find(u => u.email === email && u.password === password);
        if (matched) {
          if (matched.isBanned) {
            setErrorMessage('Tài khoản của bạn đã bị khóa do vi phạm chính sách hệ thống.');
            return;
          }
          if (matched.status === 'pending') {
            setErrorMessage('Tài khoản Giáo viên đang chờ Admin phê duyệt. Vui lòng thử lại sau.');
            return;
          }
          addLog(`"${matched.name}" đăng nhập thành công — vai trò: ${matched.role.toUpperCase()}`, 'sys');
          onAuthSuccess(matched);
        } else {
          setErrorMessage('Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.');
        }

      } else if (mode === 'signup') {
        if (!name.trim() || !email.trim() || !password.trim()) {
          setErrorMessage('Vui lòng điền đầy đủ tất cả các trường bắt buộc.');
          return;
        }
        if (password.length < 6) {
          setErrorMessage('Mật khẩu phải có ít nhất 6 ký tự.');
          return;
        }
        if (usersList.find(u => u.email === email) || email === 'admin@edupath.vn') {
          setErrorMessage('Email này đã được đăng ký bởi tài khoản khác.');
          return;
        }

        const newUser = {
          id: Date.now(),
          name,
          email,
          password,
          role: userRole,
          combo: userRole === 'student' ? combo : '',
          grade: userRole === 'student' ? '12' : '',
          avatar: name.substring(0, 2).toUpperCase(),
          isBanned: false,
          status: userRole === 'teacher' ? 'pending' : 'active',
          unlockedCourses: [],
        };

        addLog(`Tài khoản mới: "${name}" (${email}) — Vai trò: ${userRole.toUpperCase()}`, 'sys');
        onAuthSuccess(null, newUser);

        if (userRole === 'teacher') {
          setSuccessMessage('Đăng ký Giáo viên thành công! Hồ sơ của bạn đang chờ Admin phê duyệt.');
          setEmail(email);
          setPassword('');
          setMode('login');
        } else {
          setSuccessMessage('Đăng ký thành công! Hãy đăng nhập để bắt đầu học.');
          setEmail(email);
          setPassword('');
          setMode('login');
        }

      } else if (mode === 'forgot') {
        if (!resetEmail.trim()) return;
        addLog(`Yêu cầu khôi phục mật khẩu: ${resetEmail}`, 'sys');
        setResetSuccess(true);
      }
    }, 600);
  };

  return (
    <div className="auth-page-layout">
      {/* Left branding panel */}
      <div className="auth-brand-panel">
        <div className="auth-brand-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
            <div className="nav-logo-icon" style={{ width: 44, height: 44, fontSize: 22 }}>E</div>
            <span style={{ fontSize: '20px', fontWeight: '800', color: '#fff' }}>EduPath AI</span>
          </div>

          <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#fff', lineHeight: 1.3, marginBottom: 16 }}>
            Học thông minh.<br />Thi thật tự tin.
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '14px', lineHeight: 1.7, marginBottom: 32 }}>
            Nền tảng luyện thi THPTQG được hơn 42,500 học sinh tin chọn, với AI cá nhân hóa lộ trình và phân tích lỗ hổng kiến thức tức thì.
          </p>

          <div className="auth-brand-stats">
            {[
              { v: '42,500+', l: 'Học sinh' },
              { v: '98.4%', l: 'Đạt mục tiêu' },
              { v: '27+', l: 'Điểm THPTQG' },
            ].map((s, i) => (
              <div key={i} className="auth-brand-stat">
                <span className="auth-brand-stat-value">{s.v}</span>
                <span className="auth-brand-stat-label">{s.l}</span>
              </div>
            ))}
          </div>

          <div className="auth-brand-quote">
            <p>"EduPath giúp mình biết chính xác cần ôn gì mỗi ngày. Điểm tăng từ 6.5 lên 9.2 chỉ trong 3 tháng!"</p>
            <span>— Trần Ngọc Bích, Khối A01</span>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-form-panel">
        <div className="auth-form-wrapper">
          {/* Back button */}
          <button className="auth-back-btn" onClick={onBackToLanding}>
            <HiArrowLeft />
            Về trang chủ
          </button>

          <div className="auth-form-header">
            <h2>
              {mode === 'login' && 'Chào mừng trở lại!'}
              {mode === 'signup' && 'Tạo tài khoản mới'}
              {mode === 'forgot' && 'Khôi phục mật khẩu'}
            </h2>
            <p>
              {mode === 'login' && 'Đăng nhập để tiếp tục lộ trình học của bạn.'}
              {mode === 'signup' && 'Đăng ký miễn phí — không cần thẻ tín dụng.'}
              {mode === 'forgot' && 'Nhập email để nhận liên kết đặt lại mật khẩu.'}
            </p>
          </div>

          {/* Alerts */}
          {errorMessage && (
            <div className="auth-alert error">
              <HiExclamationCircle />
              {errorMessage}
            </div>
          )}
          {successMessage && (
            <div className="auth-alert success">
              <HiCheckCircle />
              {successMessage}
            </div>
          )}

          {/* FORGOT PASSWORD */}
          {mode === 'forgot' ? (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {!resetSuccess ? (
                <>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Nhập email đã đăng ký. Chúng tôi sẽ gửi liên kết đặt lại mật khẩu ngay.
                  </p>
                  <div className="auth-input-group">
                    <label>Địa chỉ Email</label>
                    <div className="auth-input-wrap">
                      <HiMail className="auth-input-icon" />
                      <input type="email" placeholder="email@example.com" value={resetEmail} onChange={e => setResetEmail(e.target.value)} required />
                    </div>
                  </div>
                  <button type="submit" className="btn-primary auth-submit-btn" disabled={loading}>
                    {loading ? 'Đang gửi...' : 'Gửi liên kết đặt lại mật khẩu'}
                  </button>
                </>
              ) : (
                <div className="auth-alert success" style={{ flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <HiCheckCircle />
                    <strong>Đã gửi thành công!</strong>
                  </div>
                  <p style={{ fontSize: '13px' }}>Kiểm tra hộp thư đến của <strong>{resetEmail}</strong> để hoàn tất đặt lại mật khẩu.</p>
                </div>
              )}
              <button type="button" className="auth-link-btn" onClick={() => { switchMode('login'); setResetSuccess(false); setResetEmail(''); }}>
                <HiArrowLeft style={{ marginRight: 4 }} /> Quay lại đăng nhập
              </button>
            </form>

          ) : (
            /* LOGIN & SIGNUP */
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {mode === 'signup' && (
                <div className="auth-input-group">
                  <label>Họ và tên <span className="required">*</span></label>
                  <div className="auth-input-wrap">
                    <HiUser className="auth-input-icon" />
                    <input type="text" placeholder="Ví dụ: Nguyễn Minh Anh" value={name} onChange={e => setName(e.target.value)} required />
                  </div>
                </div>
              )}

              <div className="auth-input-group">
                <label>Địa chỉ Email <span className="required">*</span></label>
                <div className="auth-input-wrap">
                  <HiMail className="auth-input-icon" />
                  <input type="email" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
              </div>

              <div className="auth-input-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ margin: 0 }}>Mật khẩu <span className="required">*</span></label>
                  {mode === 'login' && (
                    <button type="button" className="auth-link-inline" onClick={() => switchMode('forgot')}>
                      Quên mật khẩu?
                    </button>
                  )}
                </div>
                <div className="auth-input-wrap">
                  <HiLockClosed className="auth-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Tối thiểu 6 ký tự"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                  <button type="button" className="auth-eye-btn" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                    {showPassword ? <HiEyeOff /> : <HiEye />}
                  </button>
                </div>
              </div>

              {mode === 'signup' && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div className="auth-input-group">
                    <label>Bạn là:</label>
                    <div className="auth-role-selector">
                      <label className={`auth-role-option${userRole === 'student' ? ' selected' : ''}`}>
                        <input type="radio" name="role" value="student" checked={userRole === 'student'} onChange={() => setUserRole('student')} />
                        <span>🎒 Học sinh ôn thi</span>
                      </label>
                      <label className={`auth-role-option${userRole === 'teacher' ? ' selected' : ''}`}>
                        <input type="radio" name="role" value="teacher" checked={userRole === 'teacher'} onChange={() => setUserRole('teacher')} />
                        <span>🎓 Giảng viên</span>
                      </label>
                    </div>
                  </div>

                  {userRole === 'student' && (
                    <div className="auth-input-group">
                      <label>Khối thi mục tiêu <span className="required">*</span></label>
                      <div className="auth-input-wrap">
                        <HiBookOpen className="auth-input-icon" />
                        <select value={combo} onChange={e => setCombo(e.target.value)} style={{ appearance: 'none' }}>
                          <option value="A01 (Toán – Lý – Anh)">A01 — Toán, Vật lý, Tiếng Anh</option>
                          <option value="B00 (Toán – Hóa – Sinh)">B00 — Toán, Hóa học, Sinh học</option>
                          <option value="D01 (Toán – Văn – Anh)">D01 — Toán, Ngữ văn, Tiếng Anh</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button type="submit" className="btn-primary auth-submit-btn" disabled={loading}>
                {loading ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
              </button>
            </form>
          )}

          {mode !== 'forgot' && (
            <p className="auth-switch-mode">
              {mode === 'login' ? (
                <>Chưa có tài khoản? <button type="button" onClick={() => switchMode('signup')}>Đăng ký miễn phí</button></>
              ) : (
                <>Đã có tài khoản? <button type="button" onClick={() => switchMode('login')}>Đăng nhập ngay</button></>
              )}
            </p>
          )}

          {/* Demo hint - collapsible */}
          {mode === 'login' && <DemoHint />}
        </div>
      </div>
    </div>
  );
}

function DemoHint() {
  const [open, setOpen] = useState(false);
  return (
    <div className="demo-hint-box">
      <button className="demo-hint-toggle" onClick={() => setOpen(!open)}>
        🔑 Tài khoản demo thử nghiệm {open ? '▲' : '▼'}
      </button>
      {open && (
        <div className="demo-hint-content">
          <div><strong>Học sinh:</strong> student@gmail.com / student123</div>
          <div><strong>Giáo viên:</strong> teacher@gmail.com / teacher123</div>
          <div><strong>Admin:</strong> admin@edupath.vn / admin123</div>
        </div>
      )}
    </div>
  );
}
