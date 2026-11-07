import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  MdSchool, MdAssignmentTurnedIn, MdMenuBook, MdVisibility,
  MdDateRange, MdNotes, MdAccessTime, MdOpenInNew, MdExpandMore, MdExpandLess,
  MdCameraAlt, MdZoomIn, MdZoomOut, MdCrop, MdCheck, MdClose
} from 'react-icons/md';
import { publicStudentService } from '../../services/dataServices';
import type { ClassSheet } from '../../types';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Avatar from '../../components/ui/Avatar';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import './StudentPortal.css';

interface StudentProfile {
  id?: string;
  name: string;
  photoUrl?: string;
  subjectName: string;
  levelName: string;
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
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sheets' | 'assessments'>('sheets');
  const [assessmentFilter, setAssessmentFilter] = useState<'all' | 'exam' | 'exercise'>('all');

  // Reader Modal states
  const [selectedSheet, setSelectedSheet] = useState<ClassSheet | null>(null);
  const [expandedLevels, setExpandedLevels] = useState<string[]>([]);

  // Photo Upload & Crop Modal states
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgElementRef = useRef<HTMLImageElement | null>(null);

  const handleSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione um arquivo de imagem válido.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('A imagem deve ter menos de 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const img = new Image();
      img.onload = () => {
        imgElementRef.current = img;
        setImageSrc(result);
        setZoom(1);
        setOffset({ x: 0, y: 0 });
        setCropModalOpen(true);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
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

      // Caixa de recorte de 260px na tela do modal
      const cropBoxSize = 260;
      const baseScale = Math.max(cropBoxSize / img.naturalWidth, cropBoxSize / img.naturalHeight);
      const currentScale = baseScale * zoom;

      // Coordenadas centrais
      const centerScreenX = cropBoxSize / 2;
      const centerScreenY = cropBoxSize / 2;

      const imgScreenLeft = (cropBoxSize - img.naturalWidth * currentScale) / 2 + offset.x;
      const imgScreenTop = (cropBoxSize - img.naturalHeight * currentScale) / 2 + offset.y;

      // Converter coordenadas do cropBox (0..cropBoxSize) para a imagem original (0..img.naturalWidth)
      const srcLeft = (0 - imgScreenLeft) / currentScale;
      const srcTop = (0 - imgScreenTop) / currentScale;
      const srcSize = cropBoxSize / currentScale;

      ctx.drawImage(
        img,
        srcLeft,
        srcTop,
        srcSize,
        srcSize,
        0,
        0,
        targetSize,
        targetSize
      );

      // Gerar Base64 em WebP (ou JPEG caso não suportado)
      const base64Data = canvas.toDataURL('image/webp', 0.85);

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

    Promise.all([
      publicStudentService.getProfile(studentId),
      publicStudentService.getExamsAndExercises(studentId),
      publicStudentService.getClassSheets(studentId)
    ])
      .then(([profileRes, assessmentsRes, sheetsRes]) => {
        setProfile(profileRes.data);
        setAssessments(assessmentsRes.data);
        setSheets(sheetsRes.data);
      })
      .catch(() => {
        toast.error('Erro ao acessar o portal do aluno. Verifique o link.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [studentId]);

  const openSheetReader = async (sheetId: string) => {
    try {
      const res = await publicStudentService.getClassSheetDetail(sheetId);
      setSelectedSheet(res.data);
    } catch {
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
      <div className="portal-loading-container">
        <div className="spinner"></div>
        <p>Carregando Espaço do Aluno...</p>
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

  return (
    <div className="student-portal-wrapper">
      {/* Perfil do Aluno */}
      <section className="portal-hero">
        <div className="portal-hero-container">
          <Card variant="elevated" className="portal-profile-card animate-slideUp">
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
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  style={{ display: 'none' }}
                  onChange={handleSelectFile}
                />
              </div>

              <div>
                <h1 className="portal-student-name">{profile.name}</h1>
                <div className="portal-student-tags">
                  <Badge variant="primary">{profile.subjectName}</Badge>
                  <Badge variant="secondary">{profile.levelName}</Badge>
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
                            {group.items.map(sheet => (
                              <Card
                                key={sheet.id}
                                hoverable
                                className="portal-sheet-card"
                                onClick={() => openSheetReader(sheet.id)}
                                style={{ minHeight: '110px', padding: '12px' }}
                              >
                                <div className="portal-sheet-card-header">
                                  <h3 className="portal-sheet-title" style={{ fontSize: '14px' }}>{sheet.title}</h3>
                                </div>
                                <div className="portal-sheet-card-footer" style={{ marginTop: '8px', paddingTop: '6px' }}>
                                  <span className="read-action-text"><MdVisibility /> Ler Material</span>
                                </div>
                              </Card>
                            ))}
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
            <div className="sheet-reader-content" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.7', color: 'var(--text-primary)' }}>
              {selectedSheet.content}
            </div>
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
                    transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
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
                onClick={() => setZoom(prev => Math.max(0.5, prev - 0.15))}
                title="Diminuir Zoom"
              >
                <MdZoomOut />
              </button>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.05"
                value={zoom}
                onChange={e => setZoom(parseFloat(e.target.value))}
                className="crop-zoom-slider"
              />
              <button
                type="button"
                className="crop-zoom-btn"
                onClick={() => setZoom(prev => Math.min(3, prev + 0.15))}
                title="Aumentar Zoom"
              >
                <MdZoomIn />
              </button>
            </div>
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
