import { useState } from 'react';
import { HiX, HiCheckCircle, HiLockOpen, HiSparkles, HiBeaker } from 'react-icons/hi';


export default function CheckoutModal({ course, onClose, onPaymentSuccess, addLog }) {
  const [step, setStep] = useState(1); // 1: Demo info, 2: Processing, 3: Success
  const [isActivating, setIsActivating] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('current_user')) || {};

  // Helper function to parse course price to actual VND
  const parsePrice = (priceVal) => {
    if (typeof priceVal === 'number') {
      if (priceVal < 10000) return priceVal * 1000;
      return priceVal;
    }
    if (typeof priceVal === 'string') {
      const cleaned = Number(priceVal.replace(/\D/g, ''));
      if (cleaned < 10000) return cleaned * 1000;
      return cleaned;
    }
    return 0;
  };

  const exactAmount = parsePrice(course.price);

  const handleDemoActivate = () => {
    setIsActivating(true);
    addLog(`[Demo Mode] Tiến hành mô phỏng thanh toán khóa học "${course.title}"...`, 'sys');
    setStep(2);
    setTimeout(() => {
      addLog(`[Demo Mode] Xác nhận thành công! Đã kích hoạt quyền sở hữu khóa học "${course.title}".`, 'sys');
      setStep(3);
      onPaymentSuccess(course.id);
      setIsActivating(false);
    }, 1500);
  };

  return (
    <div className="checkout-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 1050, padding: '16px'
    }}>
      <div className="checkout-modal animate-in" style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', boxShadow: '0 20px 45px rgba(0,0,0,0.15)',
        width: '100%', maxWidth: '460px', position: 'relative', overflow: 'hidden',
        padding: '28px'
      }}>

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '16px', right: '16px',
            border: 'none', background: 'none', color: 'var(--text-secondary)',
            fontSize: '20px', cursor: 'pointer', zIndex: 10
          }}
        >
          <HiX />
        </button>

        {/* STEP 1: Demo Checkout Info */}
        {step === 1 && (
          <div>
            {/* Demo Mode Badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: 'linear-gradient(135deg, #6C5CE7, #a29bfe)',
              color: '#fff', padding: '5px 14px', borderRadius: '20px',
              fontSize: '11px', fontWeight: 'bold', letterSpacing: '1px',
              textTransform: 'uppercase', marginBottom: '16px',
              boxShadow: '0 4px 14px rgba(108, 92, 231, 0.35)'
            }}>
              <HiBeaker /> DEMO MODE
            </div>

            <h3 style={{ fontSize: '19px', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
              Mô phỏng thanh toán khóa học
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.5 }}>
              Đây là phiên bản <strong style={{ color: 'var(--primary)' }}>Demo</strong> — thanh toán thật sẽ được tích hợp trong phiên bản chính thức. Nhấn nút bên dưới để mô phỏng quá trình mua khóa học thành công.
            </p>

            {/* Course Info Card */}
            <div style={{
              background: 'var(--bg-main)', borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)', padding: '16px', marginBottom: '20px'
            }}>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Khóa học được chọn:
              </div>
              <div style={{ fontWeight: 'bold', fontSize: '15px', color: 'var(--text-primary)', marginBottom: '12px' }}>
                {course.title}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                  899.000đ
                </div>
                <div style={{ fontSize: '18px', fontWeight: '900', color: 'var(--accent-orange)' }}>
                  {exactAmount.toLocaleString()}đ
                </div>
              </div>
            </div>

            {/* Demo Notice */}
            <div style={{
              background: 'rgba(108, 92, 231, 0.08)', border: '1px dashed rgba(108, 92, 231, 0.4)',
              borderRadius: 'var(--radius-md)', padding: '12px 14px', marginBottom: '20px',
              display: 'flex', gap: '10px', alignItems: 'flex-start'
            }}>
              <HiSparkles style={{ color: '#6C5CE7', flexShrink: 0, marginTop: '2px', fontSize: '16px' }} />
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
                Trong phiên bản demo, kích hoạt khóa học sẽ diễn ra <strong>ngay lập tức</strong> mà không cần thực hiện thanh toán thật. Chức năng thanh toán qua VietQR / SePay sẽ được tích hợp đầy đủ ở phiên bản release.
              </p>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                className="btn-primary"
                style={{
                  width: '100%', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '8px', padding: '12px',
                  background: 'linear-gradient(135deg, #6C5CE7, #a29bfe)', border: 'none',
                  fontWeight: 'bold', fontSize: '14px',
                  boxShadow: '0 6px 20px rgba(108, 92, 231, 0.3)'
                }}
                onClick={handleDemoActivate}
                disabled={isActivating}
              >
                <HiBeaker /> Kích hoạt Demo — Mở khóa ngay
              </button>

              <button className="btn-outline" style={{ width: '100%' }} onClick={onClose}>
                Hủy bỏ
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Processing splash */}
        {step === 2 && (
          <div style={{ textAlign: 'center', padding: '36px 10px' }}>
            <div style={{
              width: '52px', height: '52px',
              border: '4px solid var(--border)',
              borderTopColor: '#6C5CE7',
              borderRadius: '50%',
              margin: '0 auto 20px auto',
              animation: 'spin 1s linear infinite'
            }}></div>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-primary)' }}>
              Đang kích hoạt khóa học...
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Hệ thống đang xử lý yêu cầu của bạn. Vui lòng giữ nguyên màn hình trong giây lát.
            </p>
          </div>
        )}

        {/* STEP 3: Success */}
        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '24px 10px' }}>
            <div style={{ fontSize: '64px', color: 'var(--accent-green)', marginBottom: '14px' }}>
              <HiCheckCircle />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-primary)' }}>
              Kích hoạt thành công! 🎉
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.5' }}>
              Khóa học <strong style={{ color: 'var(--primary)' }}>{course.title}</strong> đã được kích hoạt trên hệ thống. Hãy bắt đầu chinh phục kiến thức và nhận lộ trình học tập cá nhân hóa ngay nào!
            </p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                onClick={onClose}
              >
                <HiLockOpen /> Vào học ngay
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
