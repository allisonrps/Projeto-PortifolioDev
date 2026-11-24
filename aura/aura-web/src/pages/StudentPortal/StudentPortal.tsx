import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  MdSchool, MdAssignmentTurnedIn, MdMenuBook, MdVisibility,
  MdDateRange, MdNotes, MdAccessTime, MdOpenInNew, MdExpandMore, MdExpandLess,
  MdCameraAlt, MdZoomIn, MdZoomOut, MdCheck, MdEventAvailable, MdEmojiEvents,
  MdCardMembership, MdDownload, MdChat
} from 'react-icons/md';
import { publicStudentService } from '../../services/dataServices';
import type { ClassSheet, Certificate, ChatMessage } from '../../types';
import ChatWindow from '../../components/chat/ChatWindow';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Avatar, { getAbsoluteAvatarUrl } from '../../components/ui/Avatar';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { sanitizeHtml } from '../../utils/sanitizeHtml';
import './StudentPortal.css';

interface StudentProfile {
  id?: string;
  name: string;
  photoUrl?: string;
  subjectName: string;
  levelName: string;
  createdAt?: string;
  firstClassDate?: string;
  isActive?: boolean;
}

interface AssessmentItem {
  id: string;
  title: string;
  scheduledAt: string;
  grade?: number;
  maxGrade: number;
  notes?: string;
  type: 'exam' | 'exercise';
  isOnline: boolean;
  status: 'pending' | 'completed' | 'corrigir';
}

export default function StudentPortalPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [assessments, setAssessments] = useState<AssessmentItem[]>([]);
  const [sheets, setSheets] = useState<ClassSheet[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sheets' | 'assessments' | 'certificates' | 'messages'>('sheets');
  const [assessmentFilter, setAssessmentFilter] = useState<'all' | 'exam' | 'exercise'>('all');
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);

  // Chat states
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);

  const loadChat = async (silent = false) => {
    if (!studentId) return;
    if (!silent) setChatLoading(true);
    try {
      const res = await publicStudentService.getMessages(studentId);
      setChatMessages(res.data);
      setChatUnreadCount(0);
    } catch {
      // silencioso
    } finally {
      if (!silent) setChatLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'messages' && studentId) {
      loadChat();
      const interval = setInterval(() => {
        loadChat(true);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab, studentId]);

  const handleSendMessage = async (text: string) => {
    if (!studentId) return;
    try {
      const res = await publicStudentService.sendMessage(studentId, text);
      setChatMessages(prev => [...prev, res.data]);
    } catch {
      toast.error('Erro ao enviar mensagem.');
      throw new Error();
    }
  };
  const handleDeleteMessage = async (messageId: string) => {
    if (!studentId) return;
    try {
      await publicStudentService.deleteMessage(studentId, messageId);
      setChatMessages(prev => prev.filter(m => m.id !== messageId));
      toast.success('Mensagem apagada com sucesso!');
    } catch {
      toast.error('Erro ao apagar mensagem.');
      throw new Error();
    }
  };
  // Reader Modal states
  const [selectedSheet, setSelectedSheet] = useState<ClassSheet | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(10);
  const [loadingStatus, setLoadingStatus] = useState('Conectando ao Espaço do Aluno...');
  const [openingSheetId, setOpeningSheetId] = useState<string | null>(null);
  const [openingProgress, setOpeningProgress] = useState(0);
  const sheetCacheRef = useRef<Record<string, ClassSheet>>({});
  const [expandedLevels, setExpandedLevels] = useState<string[]>([]);

  // Photo Upload & Crop Modal states
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [fitScale, setFitScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgElementRef = useRef<HTMLImageElement | null>(null);

  const handleSelectFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast.error('A imagem deve ter menos de 20MB.');
      e.target.value = '';
      return;
    }

    const toastId = toast.loading('Carregando foto...');

    try {
      const fileNameLower = file.name.toLowerCase();
      const isHeic =
        fileNameLower.endsWith('.heic') ||
        fileNameLower.endsWith('.heif') ||
        file.type.includes('heic') ||
        file.type.includes('heif');

      // Se for formato HEIC/HEIF de iPhone, converte para JPEG
      if (isHeic) {
        try {
          const heic2anyModule = await import('heic2any');
          const heic2any = (heic2anyModule as any).default || heic2anyModule;
          const convertedBlob = await heic2any({
            blob: file,
            toType: 'image/jpeg',
            quality: 0.9,
          });
          const singleBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
          file = new File([singleBlob], 'photo.jpg', { type: 'image/jpeg' });
        } catch (heicErr) {
          console.warn('Falha na conversão de HEIC:', heicErr);
        }
      }

      const reader = new FileReader();
      reader.onerror = () => {
        toast.dismiss(toastId);
        toast.error('Não foi possível ler o arquivo selecionado.');
      };

      reader.onload = () => {
        const result = reader.result as string;
        const img = new Image();
        img.onerror = () => {
          toast.dismiss(toastId);
          toast.error('O formato da imagem não pôde ser decodificado. Experimente salvar como JPEG ou PNG.');
        };
        img.onload = () => {
          toast.dismiss(toastId);
          imgElementRef.current = img;
          setImageSrc(result);
          // Calcula escala base para a foto caber inteira no quadrado de 260px
          const baseFit = Math.min(260 / (img.naturalWidth || 260), 260 / (img.naturalHeight || 260));
          setFitScale(baseFit);
          setZoom(1); // Zoom inicial perfeito de 100%
          setOffset({ x: 0, y: 0 });
          setCropModalOpen(true);
        };
        img.src = result;
      };

      reader.readAsDataURL(file);
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error('Erro ao processar imagem: ' + (err?.message || 'formato incompatível'));
    } finally {
      e.target.value = '';
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = { x: e.touches[0].clientX - offset.x, y: e.touches[0].clientY - offset.y };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setOffset({
      x: e.touches[0].clientX - dragStartRef.current.x,
      y: e.touches[0].clientY - dragStartRef.current.y
    });
  };

  const handleTouchEnd = () => setIsDragging(false);

  const handleSaveCroppedPhoto = async () => {
    if (!studentId || !imgElementRef.current) return;
    setUploadingPhoto(true);

    try {
      const img = imgElementRef.current;
      const canvas = document.createElement('canvas');
      const targetSize = 400; // Resolução ideal de alta nitidez
      canvas.width = targetSize;
      canvas.height = targetSize;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        toast.error('Falha ao processar a imagem no navegador.');
        setUploadingPhoto(false);
        return;
      }

      // Caixa de recorte de 260px na tela do modal e resolução alvo de 400x400
      const cropBoxSize = 260;
      const scaleRatio = targetSize / cropBoxSize;
      const effectiveScale = fitScale * zoom * scaleRatio;

      ctx.save();
      // Fundo branco caso haja transparência
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, targetSize, targetSize);

      // Centraliza origem no canvas e aplica o deslocamento proporcional
      ctx.translate(targetSize / 2 + offset.x * scaleRatio, targetSize / 2 + offset.y * scaleRatio);
      ctx.scale(effectiveScale, effectiveScale);

      // Desenha a imagem centrada na origem sem restrições de corte out-of-bounds
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
      ctx.restore();

      // Gerar Base64 universal em JPEG (100% suportado por qualquer navegador e SkiaSharp)
      let base64Data = '';
      try {
        base64Data = canvas.toDataURL('image/jpeg', 0.90);
      } catch {
        base64Data = canvas.toDataURL();
      }

      const res = await publicStudentService.uploadPhoto(studentId, base64Data);
      toast.success('Foto atualizada com sucesso!');
      setProfile(prev => prev ? { ...prev, photoUrl: res.data.photoUrl } : null);
      setCropModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data || 'Erro ao enviar a foto.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const toggleLevel = (levelId: string) => {
    if (expandedLevels.includes(levelId)) {
      setExpandedLevels(expandedLevels.filter(id => id !== levelId));
    } else {
      setExpandedLevels([...expandedLevels, levelId]);
    }
  };

  useEffect(() => {
    if (!studentId) return;
    setLoading(true);
    setLoadingProgress(12);
    setLoadingStatus('Conectando ao Espaço do Aluno...');

    const timer1 = setTimeout(() => {
      setLoadingProgress(42);
      setLoadingStatus('Carregando perfil e notas...');
    }, 180);

    const timer2 = setTimeout(() => {
      setLoadingProgress(76);
      setLoadingStatus('Otimizando fichas pedagógicas...');
    }, 420);

    const timer3 = setTimeout(() => {
      setLoadingProgress(92);
      setLoadingStatus('Quase pronto...');
    }, 700);

    Promise.all([
      publicStudentService.getProfile(studentId),
      publicStudentService.getExamsAndExercises(studentId),
      publicStudentService.getClassSheets(studentId),
      publicStudentService.getCertificates(studentId)
    ])
      .then(([profileRes, assessmentsRes, sheetsRes, certsRes]) => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        setLoadingProgress(100);
        setLoadingStatus('Tudo pronto!');
        setProfile(profileRes.data);
        setAssessments(assessmentsRes.data);
        setSheets(sheetsRes.data);
        setCertificates(certsRes.data);
        setTimeout(() => {
          setLoading(false);
        }, 220);
      })
      .catch(() => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        setLoading(false);
        toast.error('Erro ao acessar o portal do aluno. Verifique o link.');
      });
  }, [studentId]);

  const openSheetReader = async (sheetId: string) => {
    // Se a ficha já está em cache em memória, abre instantaneamente (0ms de espera)
    if (sheetCacheRef.current[sheetId]) {
      setSelectedSheet(sheetCacheRef.current[sheetId]);
      return;
    }

    setOpeningSheetId(sheetId);
    setOpeningProgress(20);

    const progressInterval = setInterval(() => {
      setOpeningProgress(prev => {
        if (prev >= 92) return prev;
        return prev + Math.floor(Math.random() * 18 + 12);
      });
    }, 65);

    try {
      const res = await publicStudentService.getClassSheetDetail(sheetId);
      clearInterval(progressInterval);
      setOpeningProgress(100);
      sheetCacheRef.current[sheetId] = res.data;
      setTimeout(() => {
        setSelectedSheet(res.data);
        setOpeningSheetId(null);
        setOpeningProgress(0);
      }, 150);
    } catch {
      clearInterval(progressInterval);
      setOpeningSheetId(null);
      setOpeningProgress(0);
      toast.error('Erro ao abrir o conteúdo da ficha.');
    }
  };

  const getGradeVariant = (grade?: number, maxGrade: number = 10) => {
    if (grade === undefined || grade === null) return 'secondary';
    const percentage = (grade / maxGrade) * 100;
    if (percentage >= 70) return 'success';
    if (percentage >= 50) return 'warning';
    return 'danger';
  };

  if (loading) {
    return (
      <div className="portal-loading-container animate-fadeIn">
        <div className="portal-loading-card">
          <div className="portal-loading-brand">
            <span className="portal-brand-title">AURA</span>
            <span className="portal-brand-badge">Espaço do Aluno</span>
          </div>

          <div className="portal-loading-percentage">
            {Math.round(loadingProgress)}%
          </div>

          <div className="portal-progress-bar-container">
            <div
              className="portal-progress-bar-fill"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>

          <p className="portal-loading-status-text">
            {loadingStatus}
          </p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="portal-error-container">
        <Card variant="elevated" className="error-card">
          <h2>Oops! Link Inválido</h2>
          <p>Não encontramos os dados do aluno. Verifique se o endereço está correto ou solicite um novo link ao seu professor.</p>
        </Card>
      </div>
    );
  }

  // Tempo de Aluno Ativo (Anos / Meses / Dias)
  const activeStartDateRaw = profile?.firstClassDate || profile?.createdAt;
  const activeStartDate = activeStartDateRaw ? new Date(activeStartDateRaw) : new Date();
  const diffMs = Math.max(0, Date.now() - activeStartDate.getTime());
  const totalActiveDays = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  const activeYears = Math.floor(totalActiveDays / 365);
  const activeMonths = Math.floor((totalActiveDays % 365) / 30);
  const activeRemDays = totalActiveDays % 30;

  const activeTenureShort = activeYears > 0
    ? (activeMonths > 0 ? `${activeYears}a ${activeMonths}m` : `${activeYears}a`)
    : activeMonths > 0
      ? `${activeMonths} ${activeMonths === 1 ? 'mês' : 'meses'}`
      : `${totalActiveDays}d`;

  const activeTenureFull = activeYears > 0
    ? `${activeYears} ${activeYears === 1 ? 'ano' : 'anos'}${activeMonths > 0 ? ` e ${activeMonths} ${activeMonths === 1 ? 'mês' : 'meses'}` : ''}`
    : activeMonths > 0
      ? `${activeMonths} ${activeMonths === 1 ? 'mês' : 'meses'}${activeRemDays > 0 ? ` e ${activeRemDays} ${activeRemDays === 1 ? 'dia' : 'dias'}` : ''}`
      : `${totalActiveDays} ${totalActiveDays === 1 ? 'dia' : 'dias'}`;

  // Média Geral de Notas (normalizada de 0 a 10)
  const gradedAssessments = assessments
    .filter(a => a.grade !== null && a.grade !== undefined)
    .map(a => ((a.grade || 0) / (a.maxGrade || 10)) * 10);
  const averageGradeNum = gradedAssessments.length > 0
    ? gradedAssessments.reduce((sum, val) => sum + val, 0) / gradedAssessments.length
    : null;
  const averageGradeDisplay = averageGradeNum !== null ? averageGradeNum.toFixed(1) : '--';
  const gradePerfTier = averageGradeNum === null
    ? 'grade-perf-none'
    : averageGradeNum >= 8
      ? 'grade-perf-green'
      : averageGradeNum >= 6
        ? 'grade-perf-yellow'
        : averageGradeNum >= 4
          ? 'grade-perf-orange'
          : 'grade-perf-red';
  const gradePerfLabel = averageGradeNum === null
    ? 'Sem avaliações'
    : averageGradeNum >= 8
      ? 'Excelente desempenho'
      : averageGradeNum >= 6
        ? 'Bom desempenho'
        : averageGradeNum >= 4
          ? 'Atenção necessária'
          : 'Desempenho crítico';

  return (
    <div className="student-portal-wrapper">
      {/* Perfil do Aluno */}
      <section className="portal-hero">
        <div className="portal-hero-container">
          <Card variant="elevated" className="portal-profile-card animate-slideUp">
            <div className="portal-profile-header">
              <div className="portal-profile-info">
                {/* Avatar com botão de trocar foto */}
                <div className="portal-avatar-wrapper">
                  <Avatar src={profile.photoUrl} name={profile.name} size="lg" shape="circle" />
                  <button
                    type="button"
                    className="portal-photo-edit-btn"
                    onClick={() => fileInputRef.current?.click()}
                    title="Alterar minha foto de perfil"
                  >
                    <MdCameraAlt />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*,.heic,.heif,.jpg,.jpeg,.png,.webp,.bmp,.gif,.tif,.tiff"
                    style={{ display: 'none' }}
                    onChange={handleSelectFile}
                  />
                </div>

                <div className="portal-student-meta">
                  <h1 className="portal-student-name">{profile.name}</h1>
                  <div className="portal-student-tags">
                    <Badge variant="primary">{profile.subjectName}</Badge>
                    <Badge variant="secondary">{profile.levelName}</Badge>
                  </div>
                </div>
              </div>

              {/* Lado direito do cabeçalho preenchido pelos 2 mostradores circulares réplicas do painel do professor */}
              <div className="portal-dials-right">
                {/* 1. Tempo que o aluno está ativo */}
                <div className="metric-dial-item metric-dial-tenure">
                  <div className="metric-dial-circle">
                    <MdEventAvailable />
                  </div>
                  <span className="metric-dial-counter">{activeTenureShort}</span>
                  <div className="metric-dial-tooltip">
                    <strong>Tempo como Aluno Ativo</strong>
                    <span>{activeTenureFull}</span>
                  </div>
                </div>

                {/* 2. Média de notas */}
                <div className={`metric-dial-item metric-dial-grade ${gradePerfTier}`}>
                  <div className="metric-dial-circle">
                    <MdEmojiEvents />
                  </div>
                  <span className="metric-dial-counter">{averageGradeDisplay}</span>
                  <div className="metric-dial-tooltip">
                    <strong>Média de Notas ({gradePerfLabel})</strong>
                    <span>
                      {gradedAssessments.length > 0
                        ? `Nota média ${averageGradeDisplay} / 10 em ${gradedAssessments.length} ${gradedAssessments.length === 1 ? 'atividade avaliada' : 'atividades avaliadas'}`
                        : 'Nenhuma prova ou exercício avaliado ainda'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Abas e Conteúdo */}
      <main className="portal-main-content">
        <div className="portal-tabs-row">
          <button
            className={`portal-tab-btn ${activeTab === 'sheets' ? 'active' : ''}`}
            onClick={() => setActiveTab('sheets')}
          >
            <MdMenuBook /> Fichas ({sheets.length})
          </button>
          <button
            className={`portal-tab-btn ${activeTab === 'assessments' ? 'active' : ''}`}
            onClick={() => setActiveTab('assessments')}
          >
            <MdAssignmentTurnedIn /> Atividades ({assessments.length})
          </button>
          <button
            className={`portal-tab-btn ${activeTab === 'certificates' ? 'active' : ''}`}
            onClick={() => setActiveTab('certificates')}
          >
            <MdCardMembership /> Certificados ({certificates.length})
          </button>
          <button
            className={`portal-tab-btn ${activeTab === 'messages' ? 'active' : ''}`}
            onClick={() => setActiveTab('messages')}
          >
            <MdChat /> Mensagens {chatUnreadCount > 0 && <Badge variant="primary">{chatUnreadCount}</Badge>}
          </button>
        </div>

        <div className="portal-tab-body">
          {activeTab === 'sheets' && (() => {
            // Agrupar fichas liberadas por nível
            const grouped = sheets.reduce((acc, sheet) => {
              const lvlId = sheet.levelId;
              const lvlName = sheet.levelName || 'Geral / Outros';
              if (!acc[lvlId]) {
                acc[lvlId] = { id: lvlId, name: lvlName, items: [] };
              }
              acc[lvlId].items.push(sheet);
              return acc;
            }, {} as Record<string, { id: string; name: string; items: ClassSheet[] }>);

            const levelGroups = Object.values(grouped);

            return (
              <div className="portal-sheets-container animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {levelGroups.map(group => {
                  const isExpanded = expandedLevels.includes(group.id);
                  return (
                    <Card key={group.id} style={{ padding: '0px', overflow: 'hidden' }}>
                      {/* Cabeçalho do Nível */}
                      <div 
                        onClick={() => toggleLevel(group.id)} 
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          padding: '14px 16px', 
                          background: 'var(--bg-glass)', 
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <MdSchool className="sheet-card-icon" style={{ fontSize: '18px', color: 'var(--accent-primary)' }} />
                          <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{group.name}</strong>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({group.items.length} material(ais))</span>
                        </div>
                        <div style={{ color: 'var(--text-muted)' }}>
                          {isExpanded ? <MdExpandLess size={20} /> : <MdExpandMore size={20} />}
                        </div>
                      </div>

                      {/* Grade de fichas do nível (exibido se expandido) */}
                      {isExpanded && (
                        <div style={{ padding: '16px', background: 'rgba(0,0,0,0.1)', borderTop: '1px solid var(--border-color)' }}>
                          <div className="portal-sheets-grid">
                            {group.items.map(sheet => {
                              const isOpeningThisSheet = openingSheetId === sheet.id;
                              return (
                                <Card
                                  key={sheet.id}
                                  hoverable={!isOpeningThisSheet}
                                  className={`portal-sheet-card ${isOpeningThisSheet ? 'portal-sheet-card-loading' : ''}`}
                                  onClick={() => !openingSheetId && openSheetReader(sheet.id)}
                                  style={{ minHeight: '110px', padding: '12px' }}
                                >
                                  <div className="portal-sheet-card-header">
                                    <h3 className="portal-sheet-title" style={{ fontSize: '14px' }}>{sheet.title}</h3>
                                  </div>
                                  <div className="portal-sheet-card-footer" style={{ marginTop: '8px', paddingTop: '6px' }}>
                                    {isOpeningThisSheet ? (
                                      <span className="read-action-text" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
                                        <div className="spinner-inline" /> Carregando ({openingProgress}%)...
                                      </span>
                                    ) : (
                                      <span className="read-action-text"><MdVisibility /> Ler Material</span>
                                    )}
                                  </div>
                                </Card>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}
                {sheets.length === 0 && (
                  <div className="portal-empty-state">
                    <p>Nenhuma ficha pedagógica liberada para você ainda.</p>
                  </div>
                )}
              </div>
            );
          })()}

          {activeTab === 'assessments' && (() => {
            const filtered = assessments.filter(item => {
              if (assessmentFilter === 'all') return true;
              return item.type === assessmentFilter;
            });

            return (
              <div className="portal-assessments-list animate-fadeIn">
                {/* Toggle Filtro */}
                <div className="portal-filter-toggle" style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
                  <button 
                    onClick={() => setAssessmentFilter('all')}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      background: assessmentFilter === 'all' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                      color: '#ffffff',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    Todas
                  </button>
                  <button 
                    onClick={() => setAssessmentFilter('exam')}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      background: assessmentFilter === 'exam' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                      color: '#ffffff',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    Provas
                  </button>
                  <button 
                    onClick={() => setAssessmentFilter('exercise')}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      background: assessmentFilter === 'exercise' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                      color: '#ffffff',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    Exercícios
                  </button>
                </div>

                {filtered.map(item => {
                  const formatGrade = (num: number) => num % 1 === 0 ? num.toString() : num.toFixed(1);
                  return (
                    <Card key={item.id} className="portal-assessment-card">
                      {/* Linha 1: Título e Data */}
                      <div className="assessment-line-1" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h3 className="assessment-title" style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                          {item.isOnline ? (
                            <a 
                              href={`/quiz/${item.id}`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}
                              title={
                                item.status === 'pending' ? 'Clique para realizar esta atividade' : 
                                item.status === 'corrigir' ? 'Aguardando correção do professor (Visualizar respostas)' : 
                                'Clique para ver o gabarito'
                              }
                            >
                              {item.title}
                            </a>
                          ) : (
                            item.title
                          )}
                        </h3>
                        <span className="assessment-date" style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <MdDateRange /> {format(new Date(item.scheduledAt), 'dd/MM/yyyy')}
                        </span>
                      </div>

                      {/* Linha 2: Tags e Notas */}
                      <div className="assessment-line-2" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                          <Badge variant={item.type === 'exam' ? 'primary' : 'secondary'}>
                            {item.type === 'exam' ? 'Prova' : 'Exercício'}
                          </Badge>
                          
                          {(!item.isOnline || item.status === 'completed') && (
                            <Badge variant="success">
                              Concluída
                            </Badge>
                          )}
                          
                          {item.isOnline && item.status === 'corrigir' && (
                            <Badge variant="warning">
                              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '16px' }} title="Aguardando Correção">
                                <MdAccessTime size={14} />
                              </span>
                            </Badge>
                          )}
                          
                          {item.isOnline && item.status === 'pending' && (
                            <Badge variant="info">
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <MdOpenInNew size={14} /> Em Aberto
                              </span>
                            </Badge>
                          )}
                        </div>

                        <div className="assessment-grade-part">
                          {item.grade !== undefined && item.grade !== null ? (
                            <Badge variant={getGradeVariant(item.grade, item.maxGrade)}>
                              {formatGrade(item.grade)}/{formatGrade(item.maxGrade)}
                            </Badge>
                          ) : (
                            <Badge variant="warning">Sem Nota</Badge>
                          )}
                        </div>
                      </div>

                      {item.notes && (
                        <div className="assessment-notes-part" style={{ marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
                          <MdNotes className="notes-icon" />
                          <p>{item.notes}</p>
                        </div>
                      )}
                    </Card>
                  );
                })}
                {filtered.length === 0 && (
                  <div className="portal-empty-state">
                    <p>Nenhuma prova ou exercício encontrado para esta opção.</p>
                  </div>
                )}
              </div>
            );
          })()}

          {activeTab === 'certificates' && (
            <div className="portal-certificates-container animate-fadeIn">
              {certificates.length === 0 ? (
                <Card variant="elevated" className="empty-certificates-card" style={{ textAlign: 'center', padding: '56px 20px', margin: '20px 0' }}>
                  <div style={{ fontSize: '48px', color: 'var(--accent-primary)', marginBottom: '14px' }}>
                    <MdCardMembership />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
                    Nenhum Certificado Emitido Ainda
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto', lineHeight: 1.5 }}>
                    Continue seus estudos e conclua suas avaliações! Seu professor postará aqui seus certificados oficiais de conclusão e mérito acadêmico.
                  </p>
                </Card>
              ) : (
                <div className="portal-certificates-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginTop: '16px' }}>
                  {certificates.map(cert => {
                    const isPdf = cert.fileType === 'pdf' || cert.fileUrl.toLowerCase().endsWith('.pdf');
                    const fullUrl = getAbsoluteAvatarUrl(cert.fileUrl);
                    return (
                      <Card
                        key={cert.id}
                        variant="elevated"
                        className="portal-certificate-card animate-slideUp"
                        hoverable
                        onClick={() => setSelectedCertificate(cert)}
                        style={{ cursor: 'pointer', overflow: 'hidden' }}
                      >
                        <div
                          className="portal-cert-preview-box"
                          style={{
                            height: '180px',
                            background: 'var(--bg-tertiary)',
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden'
                          }}
                        >
                          {isPdf ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#ff5555' }}>
                              <span style={{ fontSize: '48px' }}>📄</span>
                              <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                                Documento PDF
                              </span>
                            </div>
                          ) : (
                            <img
                              src={fullUrl}
                              alt={cert.title}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e: any) => { e.currentTarget.style.display = 'none'; }}
                            />
                          )}
                          <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                            <Badge variant="primary">{isPdf ? 'PDF' : 'IMAGEM'}</Badge>
                          </div>
                        </div>

                        <div className="portal-cert-info" style={{ padding: '16px 6px 8px 6px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--accent-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                            <MdCardMembership />
                            Emitido em {format(new Date(cert.issueDate), 'dd/MM/yyyy')}
                          </span>
                          <h4 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text-primary)', lineHeight: 1.3 }}>
                            {cert.title}
                          </h4>
                          {cert.description && (
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 16px 0', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {cert.description}
                            </p>
                          )}

                          <Button size="sm" variant="outline" fullWidth icon={<MdVisibility />}>
                            Abrir Certificado
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="portal-chat-section animate-fadeIn">
              <ChatWindow
                messages={chatMessages}
                currentSenderType="student"
                otherPartyName="Professor(a)"
                otherPartySubtitle="Tire dúvidas, envie recados e receba orientações"
                onSendMessage={handleSendMessage}
                onDeleteMessage={handleDeleteMessage}
                loading={chatLoading}
              />
            </div>
          )}
        </div>
      </main>

      {/* Leitor de Ficha Pedagógica (Modal) */}
      {selectedSheet && (
        <Modal
          isOpen={!!selectedSheet}
          onClose={() => setSelectedSheet(null)}
          title={selectedSheet.title}
          size="lg"
          footer={
            <Button variant="primary" onClick={() => setSelectedSheet(null)}>
              Concluir Leitura
            </Button>
          }
        >
          <div className="sheet-reader-body">
            <div
              className="sheet-reader-content"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedSheet.content) }}
            />
          </div>
        </Modal>
      )}

      {/* Modal de Recorte e Ajuste da Foto */}
      {cropModalOpen && (
        <Modal
          isOpen={cropModalOpen}
          onClose={() => !uploadingPhoto && setCropModalOpen(false)}
          title="Ajustar Foto de Perfil"
          size="md"
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', width: '100%' }}>
              <Button
                variant="ghost"
                onClick={() => setCropModalOpen(false)}
                disabled={uploadingPhoto}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveCroppedPhoto}
                isLoading={uploadingPhoto}
                icon={<MdCheck />}
              >
                Salvar Foto
              </Button>
            </div>
          }
        >
          <div className="crop-modal-content">
            <p className="crop-instruction">
              Arraste a imagem para enquadrar seu rosto dentro do círculo e use os controles para dar zoom.
            </p>

            <div
              className="crop-container"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {imageSrc && (
                <img
                  src={imageSrc}
                  alt="Pré-visualização"
                  className="crop-preview-image"
                  draggable={false}
                  style={{
                    transform: `translate(${offset.x}px, ${offset.y}px) scale(${fitScale * zoom})`,
                  }}
                />
              )}
              {/* Máscara de recorte circular com sobreposição suave */}
              <div className="crop-circle-mask" />
            </div>

            {/* Controles de Zoom */}
            <div className="crop-controls-row">
              <button
                type="button"
                className="crop-zoom-btn"
                onClick={() => setZoom(prev => Math.max(0.3, +(prev - 0.1).toFixed(2)))}
                title="Diminuir Zoom"
              >
                <MdZoomOut />
              </button>
              <input
                type="range"
                min="0.3"
                max="3"
                step="0.05"
                value={zoom}
                onChange={e => setZoom(parseFloat(e.target.value))}
                className="crop-zoom-slider"
              />
              <button
                type="button"
                className="crop-zoom-btn"
                onClick={() => setZoom(prev => Math.min(3, +(prev + 0.1).toFixed(2)))}
                title="Aumentar Zoom"
              >
                <MdZoomIn />
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal de Visualização de Certificado */}
      {selectedCertificate && (
        <Modal
          isOpen={!!selectedCertificate}
          onClose={() => setSelectedCertificate(null)}
          title={selectedCertificate.title}
          size="lg"
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '10px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Emitido em {format(new Date(selectedCertificate.issueDate), 'dd/MM/yyyy')}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <a
                  href={getAbsoluteAvatarUrl(selectedCertificate.fileUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  style={{ textDecoration: 'none' }}
                >
                  <Button variant="outline" icon={<MdDownload />}>
                    Baixar / Abrir
                  </Button>
                </a>
                <Button variant="primary" onClick={() => setSelectedCertificate(null)}>
                  Fechar
                </Button>
              </div>
            </div>
          }
        >
          <div className="certificate-modal-content" style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', padding: '10px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--success-light)', color: 'var(--success)', padding: '8px 16px', borderRadius: 'var(--radius-full)', fontSize: '13px', fontWeight: 600 }}>
              <span>🎓</span> Certificado Oficial Verificado
            </div>

            {selectedCertificate.description && (
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '600px', margin: '0' }}>
                {selectedCertificate.description}
              </p>
            )}

            {selectedCertificate.fileType === 'pdf' || selectedCertificate.fileUrl.toLowerCase().endsWith('.pdf') ? (
              <div style={{ width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-color)', background: '#1e1e2d' }}>
                <iframe
                  src={getAbsoluteAvatarUrl(selectedCertificate.fileUrl)}
                  title={selectedCertificate.title}
                  style={{ width: '100%', height: '540px', border: 'none' }}
                />
              </div>
            ) : (
              <div style={{ maxWidth: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', border: '2px solid var(--border-color)' }}>
                <img
                  src={getAbsoluteAvatarUrl(selectedCertificate.fileUrl)}
                  alt={selectedCertificate.title}
                  style={{ maxWidth: '100%', maxHeight: '65vh', display: 'block', objectFit: 'contain' }}
                />
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Rodapé do Portal */}
      <footer className="portal-footer animate-fadeIn">
        <div className="portal-footer-content">
          <p className="portal-footer-copy" style={{ fontWeight: 600 }}>Aura</p>
        </div>
      </footer>
    </div>
  );
}
