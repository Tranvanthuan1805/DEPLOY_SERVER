import { useState, useEffect, useRef } from 'react';
import { toast } from '../utils/toast';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  HiChartBar, 
  HiBookOpen, 
  HiDatabase, 
  HiCollection, 
  HiTrendingUp, 
  HiUsers, 
  HiCurrencyDollar, 
  HiPlus, 
  HiTrash, 
  HiCheck, 
  HiPlusCircle, 
  HiArrowUp, 
  HiArrowDown, 
  HiEye, 
  HiDownload, 
  HiUpload, 
  HiPencil, 
  HiAcademicCap,
  HiClipboardList,
  HiBriefcase
} from 'react-icons/hi';
import { api } from '../api';

export default function TeacherDashboard({
  courses: initialCourses,
  onCreateCourse,
  onDeleteCourse,
  questionBank: initialQuestionBank,
  onAddQuestion,
  addLog,
  activeTab: propActiveTab = 'overview',
  setActiveTab
}) {
  // --- SUB TAB SYSTEM ---
  // If activeTab is home/stats/questions etc, map to our tabs or maintain local sub tab
  const [localTab, setLocalTab] = useState(() => {
    if (propActiveTab === 'home' || propActiveTab === 'overview') return 'overview';
    if (propActiveTab === 'questions') return 'questions';
    if (propActiveTab === 'stats' || propActiveTab === 'students') return 'students';
    return propActiveTab; // courses, exams, revenue, etc.
  });

  const handleTabChange = (tab) => {
    setLocalTab(tab);
    if (setActiveTab) {
      if (tab === 'overview') setActiveTab('home');
      else if (tab === 'questions') setActiveTab('questions');
      else if (tab === 'students') setActiveTab('stats');
      else setActiveTab(tab);
    }
  };

  // --- STATE STORES ---
  const [courses, setCourses] = useState(initialCourses || []);
  const [questionBank, setQuestionBank] = useState(initialQuestionBank || []);
  const [activeCoursePreview, setActiveCoursePreview] = useState(null);

  // Sync props
  useEffect(() => {
    if (initialCourses) setCourses(initialCourses);
  }, [initialCourses]);

  useEffect(() => {
    if (initialQuestionBank) setQuestionBank(initialQuestionBank);
  }, [initialQuestionBank]);

  // --- OVERVIEW: Essay Review State ---
  const [essays, setEssays] = useState([
    { id: 1, studentName: 'Trần Minh Hoàng', topic: 'Nghị luận văn học bài thơ Tây Tiến', date: 'Hôm nay', answer: 'Tây Tiến của Quang Dũng đã khắc họa bức tranh thiên nhiên miền Tây hùng vĩ dữ dội và vẻ đẹp người lính hào hoa bi tráng. Em tâm đắc nhất hình ảnh đoàn binh không mọc tóc...', score: '', comment: '' },
    { id: 2, studentName: 'Vũ Quốc Đạt', topic: 'Phân tích nhân vật Tràng trong Vợ Nhặt', date: 'Hôm qua', answer: 'Nhân vật Tràng đại diện cho người nông dân nghèo trước Cách mạng. Qua hình ảnh nhặt vợ giữa ngày đói, Kim Lân thể hiện khát vọng sống mãnh liệt...', score: '', comment: '' }
  ]);
  const [reviewScore, setReviewScore] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [selectedEssayId, setSelectedEssayId] = useState(null);

  // --- QUESTION BANK: CRUD, Filters, Excel Import ---
  const [filterSubject, setFilterSubject] = useState('All');
  const [filterDifficulty, setFilterDifficulty] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [qText, setQText] = useState('');
  const [qSubject, setQSubject] = useState('Toán học');
  const [qTopic, setQTopic] = useState('Hàm số');
  const [qDiff, setQDiff] = useState('MEDIUM');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [qCorrect, setQCorrect] = useState('A');
  const [excelImporting, setExcelImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  // --- COURSES: Lesson Reorder & Student Preview ---
  const [selectedCourseId, setSelectedCourseId] = useState(null);

  // --- EXAMS: Builder & Stats ---
  const [exams, setExams] = useState([]);
  const [examTitle, setExamTitle] = useState('');
  const [examSubject, setExamSubject] = useState('Toán học');
  const [examDuration, setExamDuration] = useState('90');
  const [examGrade, setExamGrade] = useState('12');
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [examSubTab, setExamSubTab] = useState('list'); // list, build, moderate

  // --- STUDENTS: Enrolled directory ---
  const [students, setStudents] = useState([
    { id: 501, name: 'Nguyễn Minh Anh', grade: '12-A1', attempts: 9, avgScore: 8.5, streak: 9, status: 'Chăm chỉ', weakness: ['Cực trị hàm số', 'Tích phân hàm ẩn'] },
    { id: 502, name: 'Lê Hải Nam', grade: '12-A1', attempts: 6, avgScore: 7.2, streak: 4, status: 'Tiến bộ', weakness: ['Hình học Oxyz', 'Dao động cơ'] },
    { id: 503, name: 'Phạm Khánh Huyền', grade: '12-D2', attempts: 12, avgScore: 9.1, streak: 15, status: 'Xuất sắc', weakness: ['Đọc hiểu Tiếng Anh'] },
    { id: 504, name: 'Nguyễn Đức Thắng', grade: '11-B3', attempts: 5, avgScore: 5.8, streak: 2, status: 'Cần chú ý', weakness: ['Sóng cơ học', 'Este - Lipit'] }
  ]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  // --- REVENUE: breakdowns ---
  const revenueSummary = {
    grossEarnings: '38.600.000đ',
    netEarnings: '30.880.000đ', // 80% payout
    payoutRate: '80%',
    pendingPayout: '4.500.000đ',
    nextPayoutDate: '30/06/2026'
  };

  const invoices = [
    { id: 'INV-091', studentName: 'Nguyễn Minh Anh', courseName: 'Chuyên đề Tích phân & Giải tích 12', date: '15/06/2026', amount: '599.000đ', commission: '119.800đ' },
    { id: 'INV-088', studentName: 'Lê Hải Nam', courseName: 'Chuyên đề Tích phân & Giải tích 12', date: '14/06/2026', amount: '599.000đ', commission: '119.800đ' },
    { id: 'INV-085', studentName: 'Phạm Khánh Huyền', courseName: 'Khóa học tiếng Anh THPTQG 9+', date: '12/06/2026', amount: '699.000đ', commission: '139.800đ' },
    { id: 'INV-082', studentName: 'Vũ Quốc Đạt', courseName: 'Khóa học lý thuyết Vật lý 12', date: '10/06/2026', amount: '499.000đ', commission: '99.800đ' }
  ];

  // --- OVERVIEW: Chart data & Heatmap matrix ---
  const enrollmentChartData = [
    { name: 'T1', students: 18 },
    { name: 'T2', students: 32 },
    { name: 'T3', students: 54 },
    { name: 'T4', students: 88 },
    { name: 'T5', students: 115 },
    { name: 'T6', students: 148 }
  ];

  const revenueChartData = [
    { name: 'T1', revenue: 8.5 },
    { name: 'T2', revenue: 12.0 },
    { name: 'T3', revenue: 19.5 },
    { name: 'T4', revenue: 27.2 },
    { name: 'T5', revenue: 31.8 },
    { name: 'T6', revenue: 38.6 }
  ];

  const heatmapData = {
    students: ['Nguyễn Minh Anh', 'Lê Hải Nam', 'Phạm Khánh Huyền', 'Nguyễn Đức Thắng'],
    exams: ['Toán khảo sát', 'Toán giải tích', 'Lý dao động', 'Lý sóng cơ'],
    matrix: [
      [9.2, 8.4, 7.8, 8.0], // student 1
      [7.5, 6.8, 8.2, 7.0], // student 2
      [9.8, 9.5, 9.0, 9.2], // student 3
      [5.5, 6.0, 5.0, 4.5], // student 4
    ]
  };

  // --- HANDLERS ---
  const fileInputRef = useRef(null);

  const handleUploadExamJson = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const json = JSON.parse(evt.target.result);
          const imported = await api.importExam(json);
          toast(`Nhập đề thi "${imported.title}" thành công! Trạng thái: Chờ duyệt.`, 'success');
          addLog(`Nhập đề thi mới: ${imported.title}`, 'sys');
          loadExamsList();
        } catch (err) {
          toast(`Lỗi import: ${err.message}`, 'error');
        }
      };
      reader.readAsText(file);
    } catch (err) {
      toast('Không thể đọc file!', 'error');
    }
  };

  const handleApproveExam = async (examId) => {
    try {
      await api.updateExamStatus(examId, 'published');
      toast('Phê duyệt đề thi thành công! Đề thi đã được phát hành tới học sinh.', 'success');
      addLog(`Phê duyệt đề thi ID #${examId}`, 'sys');
      loadExamsList();
    } catch (err) {
      toast(`Lỗi phê duyệt: ${err.message}`, 'error');
    }
  };

  const loadExamsList = async () => {
    try {
      const data = await api.getExams();
      if (data && data.length > 0) {
        const mapped = data.map(e => ({
          id: e.id,
          title: e.title,
          subject: e.subject,
          duration: e.duration || 90,
          questionCount: e.questions?.length || e.examQuestions?.length || 0,
          attempts: e.attempts?.length || 0,
          avgScore: e.attempts && e.attempts.length > 0 ? Number((e.attempts.reduce((acc, a) => acc + (a.score || 0), 0) / e.attempts.length).toFixed(1)) : 0,
          maxScore: e.attempts && e.attempts.length > 0 ? Number(Math.max(...e.attempts.map(a => a.score || 0)).toFixed(1)) : 0,
          status: e.status || 'published',
          grade: e.grade
        }));
        setExams(mapped);
      } else {
        const saved = localStorage.getItem('teacher_created_exams');
        const fallback = saved ? JSON.parse(saved) : [
          { id: 101, title: 'Đề thi thử THPTQG Toán học số 1', subject: 'Toán học', duration: 90, questionCount: 50, attempts: 24, avgScore: 7.6, maxScore: 9.8, status: 'published', grade: 12 },
          { id: 102, title: 'Đề khảo sát Chất lượng Vật lý kì 1', subject: 'Vật lý', duration: 50, questionCount: 40, attempts: 18, avgScore: 6.8, maxScore: 9.5, status: 'published', grade: 11 }
        ];
        setExams(fallback);
      }
    } catch (err) {
      console.error('Failed to load exams in TeacherDashboard:', err);
    }
  };

  useEffect(() => {
    loadExamsList();
  }, []);

  const handleGradeEssay = (e) => {
    e.preventDefault();
    if (!reviewScore || !reviewComment) {
      toast('Vui lòng nhập điểm và lời bình xét duyệt!', 'warning');
      return;
    }
    setEssays(essays.filter(ess => ess.id !== selectedEssayId));
    setSelectedEssayId(null);
    setReviewScore('');
    setReviewComment('');
    addLog(`Giáo viên chấm điểm luận: ${reviewScore}/10`, 'sys');
    toast('Chấm điểm và gửi nhận xét thành công!', 'success');
  };

  const handleAddQuestionLocal = (e) => {
    e.preventDefault();
    if (!qText.trim() || !optA || !optB || !optC || !optD) {
      toast('Vui lòng điền đầy đủ câu hỏi và 4 đáp án!', 'warning');
      return;
    }

    const newQ = {
      id: questionBank.length + 1,
      content: qText,
      question: qText, // compatibility
      options: [
        { key: 'A', value: optA },
        { key: 'B', value: optB },
        { key: 'C', value: optC },
        { key: 'D', value: optD }
      ],
      correctAnswer: qCorrect,
      difficulty: qDiff,
      topic: qTopic,
      subject: qSubject,
      successRate: '85%'
    };

    if (onAddQuestion) {
      onAddQuestion(newQ);
    } else {
      setQuestionBank([newQ, ...questionBank]);
    }

    setQText('');
    setOptA('');
    setOptB('');
    setOptC('');
    setOptD('');
    toast('Thêm câu hỏi mới thành công!', 'success');
  };

  const handleExcelImport = () => {
    setExcelImporting(true);
    setImportProgress(0);
    const interval = setInterval(() => {
      setImportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setExcelImporting(false);
          // Insert 3 mock questions
          const mockQ = [
            { id: questionBank.length + 1, content: 'Tìm nguyên hàm của hàm số f(x) = e^2x.', options: [{key:'A',value:'1/2 e^2x + C'},{key:'B',value:'e^2x + C'},{key:'C',value:'2e^2x + C'},{key:'D',value:'e^x + C'}], correctAnswer: 'A', difficulty: 'EASY', topic: 'Tích phân', subject: 'Toán học', successRate: '92%' },
            { id: questionBank.length + 2, content: 'Một vật dao động điều hòa với chu kì T = 2s. Tần số góc của vật là:', options: [{key:'A',value:'pi rad/s'},{key:'B',value:'2pi rad/s'},{key:'C',value:'0.5pi rad/s'},{key:'D',value:'4pi rad/s'}], correctAnswer: 'A', difficulty: 'EASY', topic: 'Dao động cơ', subject: 'Vật lý', successRate: '88%' }
          ];
          setQuestionBank([...mockQ, ...questionBank]);
          toast('Nhập dữ liệu Excel thành công! Đã thêm 2 câu hỏi mới.', 'success');
          return 100;
        }
        return prev + 25;
      });
    }, 400);
  };

  // Lesson reordering
  const moveLesson = (courseId, lessonIndex, direction) => {
    const targetCourse = courses.find(c => c.id === courseId);
    if (!targetCourse) return;

    const lessons = [...targetCourse.lessons];
    const newIdx = lessonIndex + direction;
    if (newIdx < 0 || newIdx >= lessons.length) return;

    // swap order keys
    const temp = lessons[lessonIndex];
    lessons[lessonIndex] = lessons[newIdx];
    lessons[newIdx] = temp;

    const updatedCourses = courses.map(c => {
      if (c.id === courseId) {
        return { ...c, lessons };
      }
      return c;
    });

    setCourses(updatedCourses);
    toast('Đã thay đổi thứ tự bài học thành công!', 'success');
  };

  // Exam Builder
  const handleToggleQuestionSelect = (qId) => {
    if (selectedQuestions.includes(qId)) {
      setSelectedQuestions(selectedQuestions.filter(id => id !== qId));
    } else {
      setSelectedQuestions([...selectedQuestions, qId]);
    }
  };

  const handleBuildExam = async (e) => {
    e.preventDefault();
    if (!examTitle.trim()) {
      toast('Vui lòng điền tiêu đề đề thi!', 'warning');
      return;
    }
    if (selectedQuestions.length === 0) {
      toast('Vui lòng chọn ít nhất 1 câu hỏi từ ngân hàng!', 'warning');
      return;
    }

    try {
      const mappedQuestions = selectedQuestions.map((qId, idx) => {
        const q = questionBank.find(item => item.id === qId);
        if (!q) return null;
        
        const optionsArray = Array.isArray(q.options) ? q.options : [];
        const mappedOpts = optionsArray.map(opt => {
          const key = opt.key || opt.label || '';
          const value = opt.value || opt.text || '';
          return {
            option_label: key,
            option_text: value,
            is_correct: key === q.correctAnswer
          };
        });

        return {
          question_number: idx + 1,
          question_text: q.content || q.question || '',
          question_type: 'multiple_choice',
          difficulty: q.difficulty || 'MEDIUM',
          explanation: q.explanation || '',
          topic: q.topic || 'Chung',
          options: mappedOpts,
          question_image_url: q.imageUrl || q.question_image_url || null,
          audio_url: q.audioUrl || q.audio_url || null
        };
      }).filter(Boolean);

      const subjectSlug = examSubject === 'Toán học' ? 'toan-hoc' :
                          examSubject === 'Vật lý' ? 'vat-ly' :
                          examSubject === 'Hóa học' ? 'hoa-hoc' : 'tieng-anh';

      const examData = {
        title: examTitle,
        subject_slug: subjectSlug,
        subject_name: examSubject,
        year: new Date().getFullYear(),
        exam_code: 'EXAM_' + Date.now().toString().slice(-6),
        exam_type: 'internal',
        source: 'Giáo viên tự tạo',
        duration_minutes: Number(examDuration),
        total_questions: mappedQuestions.length,
        description: `Đề kiểm tra tự biên soạn môn ${examSubject}`,
        grade: Number(examGrade),
        questions: mappedQuestions
      };

      const res = await api.importExam(examData);
      toast(`Soạn đề thi thành công! ID đề: #${res.examId}. Trạng thái: Chờ duyệt.`, 'success');
      
      setExamTitle('');
      setSelectedQuestions([]);
      setExamSubTab('list');
      loadExamsList();
    } catch (err) {
      console.error(err);
      toast(`Lỗi khi tạo đề thi: ${err.message}`, 'error');
    }
  };

  // Filtered Questions
  const filteredQuestions = questionBank.filter(q => {
    const textMatch = q.content?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      q.question?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      q.topic?.toLowerCase().includes(searchQuery.toLowerCase());
    const subjectMatch = filterSubject === 'All' || q.subject === filterSubject;
    const diffMatch = filterDifficulty === 'All' || q.difficulty === filterDifficulty;
    return textMatch && subjectMatch && diffMatch;
  });

  return (
    <div className="teacher-dashboard-v2" style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'Outfit, sans-serif' }}>
      
      {/* ================= NEOBRUTALIST SUBTABS NAV ================= */}
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '12px', 
        marginBottom: '24px', 
        background: '#FFFBEB', 
        padding: '12px', 
        borderRadius: '16px', 
        border: '3px solid #000' 
      }}>
        {[
          { id: 'overview', name: '📈 Tổng quan', color: '#E0F2FE' },
          { id: 'courses', name: '📚 Khóa học', color: '#FEE2E2' },
          { id: 'questions', name: '🗄️ Ngân hàng câu hỏi', color: '#FEF3C7' },
          { id: 'exams', name: '📝 Đề kiểm tra', color: '#F3E8FF' },
          { id: 'students', name: '👥 Học sinh', color: '#ECFDF5' },
          { id: 'revenue', name: '💰 Doanh thu', color: '#EFF6FF' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            style={{
              padding: '10px 18px',
              border: '2.5px solid #000',
              borderRadius: '12px',
              fontWeight: '900',
              fontSize: '13.5px',
              cursor: 'pointer',
              background: localTab === tab.id ? '#000' : tab.color,
              color: localTab === tab.id ? '#fff' : '#000',
              boxShadow: localTab === tab.id ? 'none' : '3px 3px 0px #000',
              transform: localTab === tab.id ? 'translate(2px, 2px)' : 'none',
              transition: 'all 0.15s'
            }}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* ================= TAB 1: OVERVIEW ================= */}
      {localTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Metrics Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            {[
              { label: 'Khóa học phụ trách', val: `${courses.length} lớp`, bg: '#FFF1F2', icon: <HiBookOpen /> },
              { label: 'Học sinh đang học', val: '148 học viên', bg: '#F0FDF4', icon: <HiUsers /> },
              { label: 'Điểm số lớp trung bình', val: '8.2 / 10đ', bg: '#EEF2FF', icon: <HiAcademicCap /> },
              { label: 'Tổng doanh thu (Tạm tính)', val: revenueSummary.grossEarnings, bg: '#FFFBEB', icon: <HiCurrencyDollar /> }
            ].map((card, i) => (
              <div key={i} style={{ 
                background: card.bg, border: '3.5px solid #000', borderRadius: '16px', padding: '16px', boxShadow: '4px 4px 0 #000',
                display: 'flex', alignItems: 'center', gap: '14px'
              }}>
                <div style={{ width: '48px', height: '48px', border: '2.5px solid #000', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', background: '#fff' }}>
                  {card.icon}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: '#6B7280', textTransform: 'uppercase' }}>{card.label}</div>
                  <div style={{ fontSize: '20px', fontWeight: '950', color: '#000' }}>{card.val}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div style={{ border: '3.5px solid #000', borderRadius: '16px', padding: '20px', background: '#fff', boxShadow: '5px 5px 0 #000' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '950', textTransform: 'uppercase', marginBottom: '16px', borderBottom: '2.5px solid #000', paddingBottom: '8px', textAlign: 'left' }}>
                📈 Học viên đăng ký mới
              </h3>
              <div style={{ width: '100%', height: '220px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={enrollmentChartData} margin={{ left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" style={{ fontWeight: '800', fontSize: '11px' }} />
                    <YAxis style={{ fontWeight: '800', fontSize: '11px' }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="students" stroke="#F43F5E" fill="#FECDD3" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ border: '3.5px solid #000', borderRadius: '16px', padding: '20px', background: '#fff', boxShadow: '5px 5px 0 #000' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '950', textTransform: 'uppercase', marginBottom: '16px', borderBottom: '2.5px solid #000', paddingBottom: '8px', textAlign: 'left' }}>
                💰 Tốc độ doanh thu (Triệu VNĐ)
              </h3>
              <div style={{ width: '100%', height: '220px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueChartData} margin={{ left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" style={{ fontWeight: '800', fontSize: '11px' }} />
                    <YAxis style={{ fontWeight: '800', fontSize: '11px' }} />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="#3B82F6" stroke="#000" strokeWidth={2.5} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Student Matrix & Essay reviews */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
            {/* Matrix heatmap */}
            <div style={{ border: '3.5px solid #000', borderRadius: '16px', padding: '20px', background: '#fff', boxShadow: '5px 5px 0 #000' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '950', textTransform: 'uppercase', marginBottom: '16px', borderBottom: '2.5px solid #000', paddingBottom: '8px', textAlign: 'left' }}>
                🟩 Ma trận điểm số lớp học (Heatmap)
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr>
                      <th style={{ border: '2px solid #000', padding: '10px', background: '#F3F4F6' }}>Học viên</th>
                      {heatmapData.exams.map((ex, i) => (
                        <th key={i} style={{ border: '2px solid #000', padding: '10px', background: '#F3F4F6', fontWeight: '900' }}>{ex}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {heatmapData.students.map((st, sIdx) => (
                      <tr key={sIdx}>
                        <td style={{ border: '2px solid #000', padding: '10px', fontWeight: '900', background: '#FAF5FF', textAlign: 'left' }}>{st}</td>
                        {heatmapData.matrix[sIdx].map((score, eIdx) => {
                          let cellBg = '#FEE2E2'; // Red
                          let cellText = '#991B1B';
                          if (score >= 8.0) { cellBg = '#D1FAE5'; cellText = '#065F46'; } // Green
                          else if (score >= 5.0) { cellBg = '#FEF3C7'; cellText = '#92400E'; } // Yellow
                          return (
                            <td 
                              key={eIdx} 
                              style={{ 
                                border: '2px solid #000', 
                                padding: '10px', 
                                background: cellBg, 
                                color: cellText, 
                                fontWeight: '950',
                                textAlign: 'center'
                              }}
                            >
                              {score.toFixed(1)}đ
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pending Essay Grade Console */}
            <div style={{ border: '3.5px solid #000', borderRadius: '16px', padding: '20px', background: '#EFF6FF', boxShadow: '5px 5px 0 #000', textAlign: 'left' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '950', textTransform: 'uppercase', marginBottom: '14px', borderBottom: '2.5px solid #000', paddingBottom: '8px' }}>
                ✍️ Chấm thi tự luận ({essays.length})
              </h3>
              {essays.length > 0 ? (
                selectedEssayId === null ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {essays.map((ess) => (
                      <div 
                        key={ess.id}
                        onClick={() => setSelectedEssayId(ess.id)}
                        style={{ padding: '12px', border: '2px solid #000', borderRadius: '10px', background: '#fff', cursor: 'pointer' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '800', color: '#4B5563', marginBottom: '4px' }}>
                          <span>{ess.studentName}</span>
                          <span>{ess.date}</span>
                        </div>
                        <h4 style={{ fontSize: '12.5px', fontWeight: '900', margin: '0 0 6px 0' }}>{ess.topic}</h4>
                        <p style={{ fontSize: '11px', color: '#6B7280', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ess.answer}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>
                    {(() => {
                      const ess = essays.find(e => e.id === selectedEssayId);
                      return (
                        <form onSubmit={handleGradeEssay} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div style={{ fontSize: '12px', fontWeight: '850' }}>Học viên: <strong>{ess.studentName}</strong></div>
                          <div style={{ fontSize: '12px', fontWeight: '850' }}>Đề tài: <strong>{ess.topic}</strong></div>
                          <div style={{ 
                            padding: '10px', border: '2.5px solid #000', borderRadius: '8px', background: '#fff', 
                            fontSize: '12px', maxHeight: '120px', overflowY: 'auto', fontStyle: 'italic'
                          }}>
                            "{ess.answer}"
                          </div>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
                            <div>
                              <label style={{ fontSize: '11px', fontWeight: '800' }}>Điểm (0-10):</label>
                              <input 
                                type="number" 
                                min="0" max="10" step="0.5" 
                                className="form-control" 
                                value={reviewScore}
                                onChange={e => setReviewScore(e.target.value)}
                                required 
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '11px', fontWeight: '800' }}>Nhận xét giáo viên:</label>
                              <input 
                                type="text" 
                                className="form-control" 
                                placeholder="Bài viết tốt, lập luận chặt chẽ..."
                                value={reviewComment}
                                onChange={e => setReviewComment(e.target.value)}
                                required 
                              />
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button type="submit" className="lp-btn--accent" style={{ flex: 1, padding: '8px', fontSize: '12px', border: '2px solid #000', borderRadius: '8px', fontWeight: '800' }}>
                              Lưu điểm
                            </button>
                            <button type="button" onClick={() => setSelectedEssayId(null)} className="lp-btn--ghost" style={{ flex: 1, padding: '8px', fontSize: '12px', border: '2px solid #000', borderRadius: '8px', fontWeight: '800' }}>
                              Quay lại
                            </button>
                          </div>
                        </form>
                      );
                    })()}
                  </div>
                )
              ) : (
                <div style={{ fontSize: '13px', color: '#6B7280', textAlign: 'center', padding: '20px' }}>
                  🎉 Không có bài luận nào cần chấm điểm!
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: COURSES ================= */}
      {localTab === 'courses' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '24px', textAlign: 'left' }}>
          {/* Courses directory */}
          <div style={{ border: '3.5px solid #000', borderRadius: '16px', padding: '20px', background: '#fff', boxShadow: '5px 5px 0 #000' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '950', textTransform: 'uppercase', marginBottom: '16px', borderBottom: '2.5px solid #000', paddingBottom: '8px' }}>
              📚 Các khóa học của bạn
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {courses.map((course) => (
                <div 
                  key={course.id} 
                  style={{ 
                    padding: '16px', border: '3px solid #000', borderRadius: '14px', background: '#FAF5FF',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}
                >
                  <div>
                    <span className="lp-course-subject-badge">{course.subject}</span>
                    <h4 style={{ fontSize: '15px', fontWeight: '950', margin: '8px 0 4px 0' }}>{course.title}</h4>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '11.5px', fontWeight: '800', color: '#6B7280' }}>
                      <span>Bài học: {course.lessons?.length || 0} bài</span>
                      <span>Học viên: {course.enrollments?.length || 12} học sinh</span>
                      <span style={{ color: '#059669' }}>Phê duyệt: Đã kích hoạt</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => setSelectedCourseId(course.id)}
                      className="lp-btn--ghost" 
                      style={{ padding: '8px 12px', fontSize: '12px', border: '2px solid #000', borderRadius: '8px' }}
                    >
                      Chi tiết
                    </button>
                    <button 
                      onClick={() => setActiveCoursePreview(course.id)}
                      className="lp-btn--accent" 
                      style={{ padding: '8px 12px', fontSize: '12px', border: '2px solid #000', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <HiEye /> Xem thử
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Lesson Order & details panel */}
          <div style={{ border: '3.5px solid #000', borderRadius: '16px', padding: '20px', background: '#FEF3C7', boxShadow: '5px 5px 0 #000' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '950', textTransform: 'uppercase', marginBottom: '16px', borderBottom: '2.5px solid #000', paddingBottom: '8px' }}>
              📝 Quản lý bài học (Thay đổi thứ tự)
            </h3>
            {selectedCourseId ? (
              (() => {
                const course = courses.find(c => c.id === selectedCourseId);
                return (
                  <div>
                    <h4 style={{ fontSize: '13.5px', fontWeight: '900', color: '#000', marginBottom: '12px' }}>{course.title}</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {course.lessons.map((lesson, idx) => (
                        <div 
                          key={lesson.id}
                          style={{ 
                            padding: '10px 14px', border: '2px solid #000', borderRadius: '10px', background: '#fff',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                          }}
                        >
                          <span style={{ fontSize: '12.5px', fontWeight: '900' }}>
                            {idx + 1}. {lesson.name || lesson.title}
                          </span>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button 
                              onClick={() => moveLesson(course.id, idx, -1)}
                              disabled={idx === 0}
                              style={{ padding: '2px 6px', background: '#fff', border: '1.5px solid #000', borderRadius: '4px', cursor: 'pointer', opacity: idx === 0 ? 0.3 : 1 }}
                            >
                              <HiArrowUp />
                            </button>
                            <button 
                              onClick={() => moveLesson(course.id, idx, 1)}
                              disabled={idx === course.lessons.length - 1}
                              style={{ padding: '2px 6px', background: '#fff', border: '1.5px solid #000', borderRadius: '4px', cursor: 'pointer', opacity: idx === course.lessons.length - 1 ? 0.3 : 1 }}
                            >
                              <HiArrowDown />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()
            ) : (
              <div style={{ fontSize: '13px', color: '#6B7280', padding: '30px', textAlign: 'center' }}>
                💡 Hãy chọn một khóa học ở cột bên trái để quản lý và thay đổi thứ tự các bài giảng học tập.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 3: QUESTION BANK ================= */}
      {localTab === 'questions' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px', textAlign: 'left' }}>
          {/* Question Maker form */}
          <div style={{ border: '3.5px solid #000', borderRadius: '16px', padding: '20px', background: '#FFFBEB', boxShadow: '5px 5px 0 #000' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '950', textTransform: 'uppercase', marginBottom: '14px', borderBottom: '2.5px solid #000', paddingBottom: '8px' }}>
              ➕ Thêm câu hỏi vào ngân hàng
            </h3>
            <form onSubmit={handleAddQuestionLocal} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label style={{ fontSize: '11px', fontWeight: '900' }}>Nội dung câu hỏi:</label>
                <textarea 
                  className="form-control" 
                  rows="2" 
                  style={{ border: '2px solid #000', borderRadius: '8px' }}
                  value={qText}
                  onChange={e => setQText(e.target.value)}
                  placeholder="Ví dụ: Tính đạo hàm của y = tan(x)..." 
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '11px', fontWeight: '900' }}>Môn học:</label>
                  <select className="form-control" style={{ border: '2px solid #000', borderRadius: '8px' }} value={qSubject} onChange={e => setQSubject(e.target.value)}>
                    <option value="Toán học">Toán học</option>
                    <option value="Vật lý">Vật lý</option>
                    <option value="Hóa học">Hóa học</option>
                    <option value="Tiếng Anh">Tiếng Anh</option>
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '11px', fontWeight: '900' }}>Chương/Chuyên đề:</label>
                  <input type="text" className="form-control" style={{ border: '2px solid #000', borderRadius: '8px' }} value={qTopic} onChange={e => setQTopic(e.target.value)} placeholder="Tích phân" required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '11px', fontWeight: '900' }}>Độ khó:</label>
                  <select className="form-control" style={{ border: '2px solid #000', borderRadius: '8px' }} value={qDiff} onChange={e => setQDiff(e.target.value)}>
                    <option value="EASY">Dễ</option>
                    <option value="MEDIUM">Trung bình</option>
                    <option value="HARD">Khó</option>
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '11px', fontWeight: '900' }}>Đáp án Đúng:</label>
                  <select className="form-control" style={{ border: '2px solid #000', borderRadius: '8px' }} value={qCorrect} onChange={e => setQCorrect(e.target.value)}>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '10px', fontWeight: '800' }}>Đáp án A:</label>
                  <input type="text" className="form-control" style={{ border: '2px solid #000', borderRadius: '8px' }} value={optA} onChange={e => setOptA(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '10px', fontWeight: '800' }}>Đáp án B:</label>
                  <input type="text" className="form-control" style={{ border: '2px solid #000', borderRadius: '8px' }} value={optB} onChange={e => setOptB(e.target.value)} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '10px', fontWeight: '800' }}>Đáp án C:</label>
                  <input type="text" className="form-control" style={{ border: '2px solid #000', borderRadius: '8px' }} value={optC} onChange={e => setOptC(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '10px', fontWeight: '800' }}>Đáp án D:</label>
                  <input type="text" className="form-control" style={{ border: '2px solid #000', borderRadius: '8px' }} value={optD} onChange={e => setOptD(e.target.value)} required />
                </div>
              </div>

              <button type="submit" className="lp-btn--accent" style={{ padding: '10px', fontSize: '13px', borderRadius: '8px', border: '2.5px solid #000', fontWeight: '900', marginTop: '6px' }}>
                📥 Thêm vào ngân hàng đề
              </button>
            </form>

            {/* Excel Importer */}
            <div style={{ borderTop: '2.5px dashed #000', marginTop: '16px', paddingTop: '16px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: '950', textTransform: 'uppercase', marginBottom: '8px' }}>🚀 Nhập đề từ Excel / CSV</h4>
              <button 
                onClick={handleExcelImport}
                disabled={excelImporting}
                style={{ 
                  width: '100%', padding: '12px', border: '2.5px solid #000', borderRadius: '10px', background: '#F8FAFC',
                  fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  boxShadow: '2.5px 2.5px 0 #000'
                }}
              >
                <HiUpload /> {excelImporting ? `Đang xử lý ${importProgress}%...` : 'Upload File Excel (.xlsx, .csv)'}
              </button>
            </div>
          </div>

          {/* Question Directory list */}
          <div style={{ border: '3.5px solid #000', borderRadius: '16px', padding: '20px', background: '#fff', boxShadow: '5px 5px 0 #000', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '950', textTransform: 'uppercase', marginBottom: '14px', borderBottom: '2.5px solid #000', paddingBottom: '8px' }}>
              📂 Danh sách câu hỏi ({filteredQuestions.length})
            </h3>
            
            {/* Search/Filters */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Tìm nhanh..." 
                style={{ flex: 1, border: '2px solid #000', borderRadius: '8px', padding: '8px' }}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <select className="form-control" style={{ width: '110px', border: '2px solid #000', borderRadius: '8px' }} value={filterSubject} onChange={e => setFilterSubject(e.target.value)}>
                <option value="All">Tất cả môn</option>
                <option value="Toán học">Toán học</option>
                <option value="Vật lý">Vật lý</option>
                <option value="Hóa học">Hóa học</option>
                <option value="Tiếng Anh">Tiếng Anh</option>
              </select>
              <select className="form-control" style={{ width: '100px', border: '2px solid #000', borderRadius: '8px' }} value={filterDifficulty} onChange={e => setFilterDifficulty(e.target.value)}>
                <option value="All">Mọi độ khó</option>
                <option value="EASY">Dễ</option>
                <option value="MEDIUM">Trung bình</option>
                <option value="HARD">Khó</option>
              </select>
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '450px' }}>
              {filteredQuestions.map(q => (
                <div key={q.id} style={{ padding: '12px', border: '2px solid #000', borderRadius: '10px', background: '#F8FAFC' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#6B7280', fontWeight: '800', marginBottom: '6px' }}>
                    <span>#{q.id} • {q.subject} • Chuyên đề: {q.topic}</span>
                    <span style={{ 
                      color: q.difficulty === 'EASY' ? '#059669' : (q.difficulty === 'MEDIUM' ? '#D97706' : '#DC2626'),
                      fontWeight: '950'
                    }}>
                      {q.difficulty}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', fontWeight: '900', margin: '0 0 8px 0' }}>{q.content || q.question}</p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '11px', color: '#4B5563', marginBottom: '8px' }}>
                    {q.options?.map((opt, i) => (
                      <div key={i} style={{ fontWeight: q.correctAnswer === opt.key ? 'bold' : 'normal', color: q.correctAnswer === opt.key ? '#059669' : 'inherit' }}>
                        {opt.key}. {opt.value}
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E2E8F0', paddingTop: '6px', fontSize: '11px', fontWeight: '800', color: '#374151' }}>
                    <span style={{ color: '#2563EB' }}>📊 Tỷ lệ làm đúng: {q.successRate || '78%'}</span>
                    <button 
                      onClick={() => {
                        setQuestionBank(questionBank.filter(item => item.id !== q.id));
                        toast('Đã xóa câu hỏi khỏi ngân hàng đề!', 'info');
                      }}
                      style={{ border: 'none', background: 'none', color: '#EF4444', cursor: 'pointer' }}
                    >
                      Xóa câu hỏi
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 4: EXAMS ================= */}
      {localTab === 'exams' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
          {/* Exams inner subtabs */}
          <div style={{ display: 'flex', gap: '12px', borderBottom: '2.5px solid #000', paddingBottom: '12px' }}>
            {[
              { id: 'list', name: '📋 Danh sách đề thi' },
              { id: 'build', name: '🛠️ Soạn & Upload đề thi' },
              { id: 'moderate', name: '⚖️ Kiểm duyệt đề thi (' + exams.filter(e => e.status === 'pending').length + ')' }
            ].map(sub => (
              <button
                key={sub.id}
                onClick={() => setExamSubTab(sub.id)}
                style={{
                  padding: '8px 16px',
                  border: '2px solid #000',
                  borderRadius: '10px',
                  fontSize: '12.5px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  background: examSubTab === sub.id ? '#000' : '#fff',
                  color: examSubTab === sub.id ? '#fff' : '#000',
                  boxShadow: examSubTab === sub.id ? 'none' : '2px 2px 0px #000',
                  transform: examSubTab === sub.id ? 'translate(1px, 1px)' : 'none',
                  transition: 'all 0.1s'
                }}
              >
                {sub.name}
              </button>
            ))}
          </div>

          {/* Subtab 1: List */}
          {examSubTab === 'list' && (
            <div style={{ border: '3.5px solid #000', borderRadius: '16px', padding: '20px', background: '#fff', boxShadow: '5px 5px 0 #000' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '950', textTransform: 'uppercase', marginBottom: '14px', borderBottom: '2.5px solid #000', paddingBottom: '8px' }}>
                📋 Danh sách đề thi hệ thống
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                {exams.map((ex) => (
                  <div key={ex.id} style={{ padding: '14px', border: '2.5px solid #000', borderRadius: '12px', background: '#F8FAFC', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                        <h4 style={{ fontSize: '13.5px', fontWeight: '900', margin: 0 }}>{ex.title}</h4>
                        <span className="lp-course-subject-badge" style={{ fontSize: '9px' }}>{ex.subject}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 'bold', border: '1.5px solid #000', borderRadius: '6px', padding: '2px 6px', background: ex.status === 'pending' ? '#FEF3C7' : '#D1FAE5', color: ex.status === 'pending' ? '#D97706' : '#059669' }}>
                          {ex.status === 'pending' ? '⏱️ CHỜ DUYỆT' : '✓ ĐÃ PHÁT HÀNH'}
                        </span>
                        {ex.grade && (
                          <span style={{ fontSize: '10px', fontWeight: 'bold', border: '1.5px solid #000', borderRadius: '6px', padding: '2px 6px', background: '#EEF2FF', color: '#4F46E5' }}>
                            Lớp {ex.grade}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', background: '#fff', padding: '8px', border: '1.5px solid #000', borderRadius: '8px', fontSize: '10px', fontWeight: '800', textAlign: 'center' }}>
                      <div>
                        <div style={{ color: '#6B7280' }}>Câu hỏi</div>
                        <div style={{ fontSize: '12px', color: '#000' }}>{ex.questionCount}</div>
                      </div>
                      <div>
                        <div style={{ color: '#6B7280' }}>Lượt thi</div>
                        <div style={{ fontSize: '12px', color: '#2563EB' }}>{ex.attempts}</div>
                      </div>
                      <div>
                        <div style={{ color: '#6B7280' }}>T.Bình</div>
                        <div style={{ fontSize: '12px', color: '#D97706' }}>{ex.avgScore ? `${ex.avgScore}đ` : '---'}</div>
                      </div>
                      <div>
                        <div style={{ color: '#6B7280' }}>Cao nhất</div>
                        <div style={{ fontSize: '12px', color: '#059669' }}>{ex.maxScore ? `${ex.maxScore}đ` : '---'}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subtab 2: Build & Import */}
          {examSubTab === 'build' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div style={{ border: '3.5px solid #000', borderRadius: '16px', padding: '20px', background: '#F3E8FF', boxShadow: '5px 5px 0 #000' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '950', textTransform: 'uppercase', marginBottom: '14px', borderBottom: '2.5px solid #000', paddingBottom: '8px' }}>
                  🛠️ Soạn đề kiểm tra mới
                </h3>
                <form onSubmit={handleBuildExam} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '11.5px', fontWeight: '900' }}>Tiêu đề đề thi:</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={examTitle}
                      onChange={e => setExamTitle(e.target.value)}
                      placeholder="Ví dụ: Đề khảo sát chất lượng tháng 6" 
                      required 
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    <div className="form-group">
                      <label style={{ fontSize: '11.5px', fontWeight: '900' }}>Bộ môn:</label>
                      <select className="form-control" value={examSubject} onChange={e => setExamSubject(e.target.value)}>
                        <option value="Toán học">Toán học</option>
                        <option value="Vật lý">Vật lý</option>
                        <option value="Hóa học">Hóa học</option>
                        <option value="Tiếng Anh">Tiếng Anh</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '11.5px', fontWeight: '900' }}>Thời gian (Phút):</label>
                      <input type="number" className="form-control" value={examDuration} onChange={e => setExamDuration(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '11.5px', fontWeight: '900' }}>Khối lớp:</label>
                      <select className="form-control" value={examGrade} onChange={e => setExamGrade(e.target.value)}>
                        <option value="10">Lớp 10</option>
                        <option value="11">Lớp 11</option>
                        <option value="12">Lớp 12</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '11.5px', fontWeight: '900', display: 'block', marginBottom: '6px' }}>
                      Chọn câu hỏi từ ngân hàng ({selectedQuestions.length} đã chọn):
                    </label>
                    <div style={{ border: '2px solid #000', borderRadius: '10px', background: '#fff', maxHeight: '180px', overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {questionBank.map(q => (
                        <label key={q.id} style={{ display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer', fontSize: '12px' }}>
                          <input 
                            type="checkbox" 
                            checked={selectedQuestions.includes(q.id)}
                            onChange={() => handleToggleQuestionSelect(q.id)}
                          />
                          <span><strong>#{q.id}</strong> ({q.subject}): {q.content || q.question}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button type="submit" className="lp-btn--accent" style={{ padding: '10px', borderRadius: '8px', border: '2.5px solid #000', fontWeight: '900' }}>
                    🎉 Phát hành đề thi thử
                  </button>
                </form>
              </div>

              <div style={{ border: '3.5px solid #000', borderRadius: '16px', padding: '20px', background: '#FFFBEB', boxShadow: '5px 5px 0 #000', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <span style={{ fontSize: '48px' }}>📄</span>
                <h3 style={{ fontSize: '16px', fontWeight: '950', textTransform: 'uppercase', margin: '16px 0 8px 0' }}>
                  Upload đề thi từ File .json
                </h3>
                <p style={{ fontSize: '13px', color: '#4B5563', margin: '0 0 20px 0', maxWidth: '340px', textAlign: 'center', lineHeight: 1.5 }}>
                  Nhập đề thi trắc nghiệm đầy đủ (kèm đáp án, giải thích chi tiết, âm thanh ngoại ngữ và hình ảnh) nhanh chóng bằng file cấu trúc chuẩn JSON.
                </p>
                
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  style={{ 
                    padding: '12px 28px', border: '2.5px solid #000', borderRadius: '12px', background: '#E0F2FE',
                    fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                    boxShadow: '3px 3px 0 #000', transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translate(-1px, -1px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                >
                  <HiUpload /> Upload File JSON đề thi
                </button>
                
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleUploadExamJson} 
                  accept=".json" 
                  style={{ display: 'none' }} 
                />
              </div>
            </div>
          )}

          {/* Subtab 3: Moderate */}
          {examSubTab === 'moderate' && (
            <div style={{ border: '3.5px solid #000', borderRadius: '16px', padding: '20px', background: '#fff', boxShadow: '5px 5px 0 #000' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '950', textTransform: 'uppercase', marginBottom: '14px', borderBottom: '2.5px solid #000', paddingBottom: '8px' }}>
                ⚖️ Đề thi đang chờ kiểm duyệt & xuất bản
              </h3>
              {exams.filter(e => e.status === 'pending').length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
                  {exams.filter(e => e.status === 'pending').map((ex) => (
                    <div key={ex.id} style={{ padding: '16px', border: '2.5px solid #000', borderRadius: '14px', background: '#FFFDF5', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <h4 style={{ fontSize: '14px', fontWeight: '950', margin: 0 }}>{ex.title}</h4>
                          <span className="lp-course-subject-badge" style={{ fontSize: '9px' }}>{ex.subject}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', fontSize: '11px', fontWeight: '800', color: '#6B7280' }}>
                          <span>Số câu hỏi: <strong>{ex.questionCount} câu</strong></span>
                          <span>•</span>
                          <span>Thời gian: <strong>{ex.duration} phút</strong></span>
                          {ex.grade && (
                            <>
                              <span>•</span>
                              <span style={{ color: '#4F46E5' }}>Lớp {ex.grade}</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '8px', borderTop: '1.5px dashed #000', paddingTop: '12px', marginTop: '10px' }}>
                        <button 
                          onClick={() => handleApproveExam(ex.id)}
                          style={{ flex: 1, padding: '8px', border: '2px solid #000', borderRadius: '8px', background: '#ECFDF5', color: '#047857', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                        >
                          <HiCheck /> Duyệt đề thi
                        </button>
                        <button 
                          onClick={() => {
                            setExams(exams.filter(e => e.id !== ex.id));
                            toast('Đã từ chối và xóa đề thi khỏi hàng đợi kiểm duyệt.', 'info');
                          }}
                          style={{ padding: '8px 12px', border: '2px solid #000', borderRadius: '8px', background: '#FEE2E2', color: '#B91C1C', fontWeight: '800', cursor: 'pointer' }}
                        >
                          Từ chối
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280', fontSize: '13.5px' }}>
                  🎉 Không có đề thi nào đang chờ phê duyệt. Tất cả các đề đã được kiểm duyệt!
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 5: STUDENTS ================= */}
      {localTab === 'students' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px', textAlign: 'left' }}>
          {/* Students list */}
          <div style={{ border: '3.5px solid #000', borderRadius: '16px', padding: '20px', background: '#fff', boxShadow: '5px 5px 0 #000' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '950', textTransform: 'uppercase', marginBottom: '16px', borderBottom: '2.5px solid #000', paddingBottom: '8px' }}>
              👥 Danh sách học viên lớp học
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {students.map(st => (
                <div 
                  key={st.id}
                  onClick={() => setSelectedStudentId(st.id)}
                  style={{ 
                    padding: '12px', border: '2.5px solid #000', borderRadius: '12px', cursor: 'pointer',
                    background: selectedStudentId === st.id ? '#D1FAE5' : '#F9FAFB',
                    display: 'flex', justifyContent: 'space-between', alignItem: 'center'
                  }}
                >
                  <div>
                    <h4 style={{ fontSize: '13.5px', fontWeight: '950', margin: '0 0 2px 0' }}>{st.name}</h4>
                    <span style={{ fontSize: '11px', color: '#4B5563', fontWeight: '800' }}>Lớp: {st.grade} • Lượt kiểm tra: {st.attempts} bài</span>
                  </div>
                  <span style={{ 
                    fontSize: '11px', fontWeight: '900', border: '1.5px solid #000', padding: '2px 8px', borderRadius: '20px', alignSelf: 'center',
                    background: st.status === 'Xuất sắc' || st.status === 'Chăm chỉ' ? '#DEF7EC' : '#FEF3C7',
                    color: st.status === 'Xuất sắc' || st.status === 'Chăm chỉ' ? '#03543F' : '#92400E'
                  }}>
                    {st.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Student Profile / logs & weakness */}
          <div style={{ border: '3.5px solid #000', borderRadius: '16px', padding: '20px', background: '#ECFDF5', boxShadow: '5px 5px 0 #000' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '950', textTransform: 'uppercase', marginBottom: '16px', borderBottom: '2.5px solid #000', paddingBottom: '8px' }}>
              🔬 Phân tích tiến độ chi tiết
            </h3>
            
            {selectedStudentId ? (
              (() => {
                const st = students.find(s => s.id === selectedStudentId);
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: '950', color: '#065F46' }}>{st.name}</h4>
                      <strong style={{ fontSize: '13px', border: '1.5px solid #000', borderRadius: '8px', padding: '4px 8px', background: '#fff' }}>🔥 Streak: {st.streak} ngày</strong>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div style={{ background: '#fff', border: '2px solid #000', borderRadius: '10px', padding: '10px' }}>
                        <div style={{ fontSize: '10px', color: '#6B7280', fontWeight: '800' }}>ĐIỂM TRUNG BÌNH</div>
                        <div style={{ fontSize: '22px', fontWeight: '950', color: '#047857' }}>{st.avgScore} / 10đ</div>
                      </div>
                      <div style={{ background: '#fff', border: '2px solid #000', borderRadius: '10px', padding: '10px' }}>
                        <div style={{ fontSize: '10px', color: '#6B7280', fontWeight: '800' }}>XẾP HẠNG LỚP</div>
                        <div style={{ fontSize: '22px', fontWeight: '950', color: '#1E40AF' }}>Top 5</div>
                      </div>
                    </div>

                    <div>
                      <h5 style={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '6px' }}>📚 Kiến thức cần bồi dưỡng thêm:</h5>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {st.weakness.map((w, idx) => (
                          <span key={idx} style={{ background: '#FEE2E2', color: '#991B1B', border: '1.5px solid #000', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '900' }}>
                            ⚠️ {w}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h5 style={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '6px' }}>⏱ Nhật ký học tập gần nhất:</h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11.5px', color: '#374151', background: '#fff', padding: '10px', border: '2px solid #000', borderRadius: '10px' }}>
                        <div>• Đã hoàn thành Đề ôn tập Giải tích 12: <strong>8.8 điểm</strong></div>
                        <div>• Luyện 15 câu trắc nghiệm Tích phân phân thức</div>
                        <div>• Đọc tài liệu bài giảng Dao động tắt dần</div>
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div style={{ fontSize: '13px', color: '#6B7280', padding: '30px', textAlign: 'center' }}>
                💡 Chọn một học viên ở cột bên trái để hiển thị thông tin phân tích học tập chi tiết và lịch sử làm đề của họ.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 6: REVENUE ================= */}
      {localTab === 'revenue' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', textAlign: 'left' }}>
          {/* Revenue summary tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {[
              { title: 'Doanh thu phát sinh', val: revenueSummary.grossEarnings, desc: 'Tổng học viên thanh toán khóa học', bg: '#F8FAFC' },
              { title: 'Hoa hồng thụ hưởng (80%)', val: revenueSummary.netEarnings, desc: 'Lợi nhuận thực tế sau chiết khấu', bg: '#ECFDF5' },
              { title: 'Tỷ lệ thụ hưởng', val: revenueSummary.payoutRate, desc: 'Cấu hình chiết khấu của giáo viên', bg: '#FFFBEB' },
              { title: 'Số dư chờ thanh toán', val: revenueSummary.pendingPayout, desc: 'Kỳ thanh toán tiếp theo: ' + revenueSummary.nextPayoutDate, bg: '#EFF6FF' }
            ].map((box, i) => (
              <div key={i} style={{ background: box.bg, border: '3.5px solid #000', borderRadius: '16px', padding: '18px', boxShadow: '4px 4px 0 #000' }}>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#6B7280', textTransform: 'uppercase', marginBottom: '4px' }}>{box.title}</div>
                <div style={{ fontSize: '24px', fontWeight: '950', color: '#000', marginBottom: '4px' }}>{box.val}</div>
                <div style={{ fontSize: '10.5px', color: '#6B7280', fontWeight: '700' }}>{box.desc}</div>
              </div>
            ))}
          </div>

          {/* Invoice logs */}
          <div style={{ border: '3.5px solid #000', borderRadius: '16px', padding: '20px', background: '#fff', boxShadow: '5px 5px 0 #000' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '2.5px solid #000', paddingBottom: '8px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '950', textTransform: 'uppercase', margin: 0 }}>
                🧾 Nhật ký giao dịch mua khóa học
              </h3>
              <button 
                onClick={() => {
                  toast('Đang khởi tạo tải xuống file CSV giao dịch...', 'info');
                  setTimeout(() => {
                    toast('Đã tải xuống file báo cáo doanh thu thành công!', 'success');
                  }, 800);
                }}
                className="lp-btn--ghost" 
                style={{ padding: '6px 12px', fontSize: '12px', border: '2.5px solid #000', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <HiDownload /> Xuất báo cáo doanh thu (CSV)
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', textAlign: 'left' }}>
                    <th style={{ border: '2px solid #000', padding: '10px' }}>Mã hóa đơn</th>
                    <th style={{ border: '2px solid #000', padding: '10px' }}>Học viên</th>
                    <th style={{ border: '2px solid #000', padding: '10px' }}>Tên khóa học</th>
                    <th style={{ border: '2px solid #000', padding: '10px' }}>Ngày giao dịch</th>
                    <th style={{ border: '2px solid #000', padding: '10px' }}>Học phí</th>
                    <th style={{ border: '2px solid #000', padding: '10px' }}>Trích hoa hồng</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(inv => (
                    <tr key={inv.id}>
                      <td style={{ border: '2px solid #000', padding: '10px', fontWeight: '900' }}>{inv.id}</td>
                      <td style={{ border: '2px solid #000', padding: '10px', fontWeight: '700' }}>{inv.studentName}</td>
                      <td style={{ border: '2px solid #000', padding: '10px', textAlign: 'left' }}>{inv.courseName}</td>
                      <td style={{ border: '2px solid #000', padding: '10px' }}>{inv.date}</td>
                      <td style={{ border: '2px solid #000', padding: '10px', fontWeight: '900', color: '#059669' }}>{inv.amount}</td>
                      <td style={{ border: '2px solid #000', padding: '10px', fontWeight: '900', color: '#4F46E5' }}>{inv.commission}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= OPTIONAL PREVIEW OVERLAY ================= */}
      {activeCoursePreview !== null && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          zIndex: 6000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px'
        }}>
          <div className="lp-lesson-player-modal" style={{ width: '90%', maxWidth: '900px', height: '80vh' }}>
            <div className="lp-lp-header">
              <div>
                <span className="lp-lp-badge">Chế độ xem trước (Học sinh)</span>
                <h4>{courses.find(c => c.id === activeCoursePreview)?.title}</h4>
              </div>
              <button 
                onClick={() => setActiveCoursePreview(null)}
                style={{ border: '2px solid #000', background: '#fff', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', fontWeight: '900' }}
              >
                ✕
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', height: 'calc(100% - 70px)' }}>
              <div style={{ background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexDirection: 'column' }}>
                <span style={{ fontSize: '48px' }}>🎥</span>
                <p style={{ fontWeight: '800', marginTop: '10px' }}>Mô phỏng Trình phát video bài học</p>
                <div style={{ border: '2px solid #fff', padding: '6px 16px', borderRadius: '20px', fontSize: '11px', cursor: 'pointer' }} onClick={() => toast('Bắt đầu chơi video...', 'info')}>
                  Play Demo
                </div>
              </div>

              <div style={{ borderLeft: '3px solid #000', background: '#F8FAFC', overflowY: 'auto', padding: '16px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '950', textTransform: 'uppercase', marginBottom: '10px', textAlign: 'left' }}>Nội dung bài học:</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {courses.find(c => c.id === activeCoursePreview)?.lessons.map((less, idx) => (
                    <div key={idx} style={{ padding: '8px 10px', border: '1.5px solid #000', borderRadius: '6px', background: '#fff', fontSize: '12px', display: 'flex', gap: '6px', textAlign: 'left' }}>
                      <span>📖</span>
                      <span>Bài {idx + 1}: {less.name || less.title} ({less.duration || '15m'})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
