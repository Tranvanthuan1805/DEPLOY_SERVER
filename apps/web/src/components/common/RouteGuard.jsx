import { useEffect } from 'react';

export function RedirectToLogin() {
  useEffect(() => {
    // Redirect to home and open login modal
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new CustomEvent('popstate'));
    window.dispatchEvent(new CustomEvent('edupath-auth-redirect', { detail: { mode: 'login' } }));
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      padding: '40px 20px',
      fontFamily: "'Outfit', 'Inter', sans-serif"
    }}>
      <div style={{
        background: '#fff',
        border: '3px solid #000',
        borderRadius: '16px',
        padding: '40px',
        maxWidth: '460px',
        width: '100%',
        boxShadow: '6px 6px 0px #000',
        textAlign: 'center'
      }}>
        <h3 style={{ margin: '0 0 16px 0', fontWeight: '900' }}>Phiên đăng nhập yêu cầu</h3>
        <p style={{ color: '#555', fontSize: '13.5px', marginBottom: '0' }}>
          Vui lòng đăng nhập để tiếp tục. Hệ thống đang tự động mở trang đăng nhập...
        </p>
      </div>
    </div>
  );
}

export function AccessDenied() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      padding: '40px 20px',
      fontFamily: "'Outfit', 'Inter', sans-serif"
    }}>
      <div style={{
        background: '#fff',
        border: '3px solid #000',
        borderRadius: '16px',
        padding: '40px',
        maxWidth: '460px',
        width: '100%',
        boxShadow: '6px 6px 0px #000',
        textAlign: 'center'
      }}>
        <div style={{
          width: '60px', height: '60px', borderRadius: '12px',
          background: '#ef4444', color: '#fff', fontSize: '28px', fontWeight: '950',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '3px solid #000000', boxShadow: '3px 3px 0px #000000',
          margin: '0 auto 20px'
        }}>
          !
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: '950', color: '#000', margin: '0 0 8px 0' }}>
          TRUY CẬP BỊ TỪ CHỐI
        </h2>
        <p style={{ fontSize: '13px', color: '#555', lineHeight: '1.6', margin: '0 0 28px 0', fontWeight: '700' }}>
          Tài khoản của em không có quyền truy cập vào khu vực này. Vui lòng liên hệ quản trị viên hoặc chuyển đổi tài khoản phù hợp.
        </p>
        <button
          onClick={() => {
            window.history.pushState({}, '', '/dashboard');
            window.dispatchEvent(new CustomEvent('popstate'));
          }}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '8px',
            background: '#ef4444',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 'bold',
            border: '2px solid #000',
            boxShadow: '3px 3px 0px #000',
            cursor: 'pointer'
          }}
        >
          Quay lại Bảng điều khiển
        </button>
      </div>
    </div>
  );
}

export default function RouteGuard({ allowedRoles, currentUser, children }) {
  if (!currentUser) {
    return <RedirectToLogin />;
  }

  const userRole = currentUser.role?.toUpperCase();
  const isAllowed = allowedRoles.map(r => r.toUpperCase()).includes(userRole);

  if (!isAllowed) {
    return <AccessDenied />;
  }

  return children;
}
