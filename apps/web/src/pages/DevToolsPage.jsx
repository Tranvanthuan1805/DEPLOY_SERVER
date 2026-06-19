import React, { useState } from 'react';

export default function DevToolsPage({
  currentUser,
  setCurrentUser,
  navigateTo,
  handleAuthSuccess,
  handleLogout,
  addLog
}) {
  const [customRole, setCustomRole] = useState(currentUser?.role || 'guest');
  const [customName, setCustomName] = useState(currentUser?.name || 'Guest User');
  const [customEmail, setCustomEmail] = useState(currentUser?.email || '');

  const quickSwitch = async (email, password) => {
    try {
      if (addLog) addLog(`DevTools: Attempting quick switch to ${email}`, 'info');
      // We can call api login or handle mock login
      // For this devtool helper, we can perform it by simulating Auth success or logging out first
      if (currentUser) {
        handleLogout();
      }

      // Import api dynamically or use standard login logic
      const { api } = await import('../api');
      const response = await api.login({ email, password });
      handleAuthSuccess(response.user);
      if (addLog) addLog(`DevTools: Successfully switched to ${response.user.name} (${response.user.role})`, 'success');
      
      // Navigate to correct dashboard based on role
      if (response.user.role === 'admin') {
        navigateTo('/admin');
      } else if (response.user.role === 'teacher') {
        navigateTo('/teacher');
      } else {
        navigateTo('/dashboard/home');
      }
    } catch (error) {
      console.error('DevTools login failed:', error);
      if (addLog) addLog(`DevTools switch failed: ${error.message}`, 'error');
    }
  };

  const handleApplyCustom = () => {
    if (!currentUser) {
      // Mock guest upgrade
      const mockUser = {
        id: Date.now(),
        name: customName,
        email: customEmail || 'dev@edupath.ai',
        role: customRole,
        avatar: customName.slice(0, 2).toUpperCase(),
        unlockedCourses: [1, 2],
        combo: 'A01 (Toán – Lý – Anh)',
        grade: '12'
      };
      handleAuthSuccess(mockUser);
    } else {
      setCurrentUser({
        ...currentUser,
        role: customRole,
        name: customName,
        email: customEmail || currentUser.email
      });
    }
    if (addLog) addLog('DevTools: Applied custom user settings', 'success');
  };

  return (
    <div style={{
      maxWidth: '800px',
      margin: '40px auto',
      padding: '32px',
      background: 'rgba(30, 41, 59, 0.7)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '24px',
      color: '#f8fafc',
      fontFamily: "'Inter', sans-serif",
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        paddingBottom: '20px',
        marginBottom: '24px'
      }}>
        <div>
          <span style={{
            fontSize: '11px',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            color: '#fff',
            padding: '4px 10px',
            borderRadius: '20px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>Developer Mode</span>
          <h2 style={{ fontSize: '24px', fontWeight: '800', margin: '8px 0 0 0', background: 'linear-gradient(to right, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            EduPath AI DevTools Console
          </h2>
        </div>
        <button 
          onClick={() => navigateTo('/')}
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            color: '#cbd5e1',
            padding: '8px 16px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.15)'}
          onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.08)'}
        >
          Back to Portal
        </button>
      </div>

      {/* Current User Session Status */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        padding: '20px',
        borderRadius: '16px',
        marginBottom: '32px'
      }}>
        <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: '0 0 12px 0', color: '#94a3b8' }}>
          Current Active Session
        </h3>
        {currentUser ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '18px'
            }}>
              {currentUser.avatar || currentUser.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{currentUser.name}</div>
              <div style={{ fontSize: '13px', color: '#94a3b8' }}>{currentUser.email} • Role: <strong style={{ color: '#818cf8', textTransform: 'uppercase' }}>{currentUser.role}</strong></div>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: '14px', color: '#ef4444', fontWeight: 'semibold' }}>
            No Active User (Logged Out / Guest State)
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Quick Role Switcher */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, color: '#38bdf8' }}>
            Quick User Switcher
          </h3>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
            Login instantly into one of the default pre-seeded test accounts:
          </p>

          <button
            onClick={() => quickSwitch('student@gmail.com', 'student123')}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.05))',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '14px',
              padding: '14px 20px',
              color: '#fff',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(59,130,246,0.15)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>🎓 Student Workspace</div>
              <div style={{ fontSize: '12px', color: '#93c5fd' }}>student@gmail.com / student123</div>
            </div>
            <span style={{ fontSize: '18px' }}>→</span>
          </button>

          <button
            onClick={() => quickSwitch('teacher@gmail.com', 'teacher123')}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.05))',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '14px',
              padding: '14px 20px',
              color: '#fff',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(16,185,129,0.15)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>👨‍🏫 Teacher Dashboard</div>
              <div style={{ fontSize: '12px', color: '#6ee7b7' }}>teacher@gmail.com / teacher123</div>
            </div>
            <span style={{ fontSize: '18px' }}>→</span>
          </button>

          <button
            onClick={() => quickSwitch('Tranvanthuan2005tt@gmail.com', 'admin123')}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.05))',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '14px',
              padding: '14px 20px',
              color: '#fff',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(239,68,68,0.15)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>⚙️ Admin Panel</div>
              <div style={{ fontSize: '12px', color: '#fca5a5' }}>Tranvanthuan2005tt@gmail.com / admin123</div>
            </div>
            <span style={{ fontSize: '18px' }}>→</span>
          </button>
        </div>

        {/* Custom User Modifier */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, color: '#818cf8' }}>
            Custom Role & Profile Modifier
          </h3>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
            Modify the current user's profile metadata directly for testing:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#94a3b8' }}>User Full Name</label>
            <input 
              type="text" 
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                padding: '8px 12px',
                color: '#fff',
                fontSize: '13.5px'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#94a3b8' }}>User Role</label>
            <select
              value={customRole}
              onChange={(e) => setCustomRole(e.target.value)}
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                padding: '8px 12px',
                color: '#fff',
                fontSize: '13.5px'
              }}
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
              <option value="guest">Guest</option>
            </select>
          </div>

          <button
            onClick={handleApplyCustom}
            style={{
              marginTop: '10px',
              background: '#4f46e5',
              color: '#fff',
              border: 'none',
              padding: '12px',
              borderRadius: '10px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#4338ca'}
            onMouseLeave={(e) => e.target.style.background = '#4f46e5'}
          >
            Apply Profile Changes
          </button>
        </div>
      </div>
    </div>
  );
}
