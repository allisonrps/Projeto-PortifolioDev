import { useEffect, useState, type FormEvent } from 'react';
import { MdAdd, MdDelete, MdEdit, MdExpandMore, MdExpandLess, MdOpenInNew, MdFormatBold, MdFormatItalic, MdFormatUnderlined, MdFormatColorText, MdInsertEmoticon } from 'react-icons/md';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { subjectService, levelService, classSheetService } from '../../services/dataServices';
import type { Subject, Level, ClassSheet } from '../../types';
import toast from 'react-hot-toast';
import { sanitizeHtml } from '../../utils/sanitizeHtml';
import './Subjects.css';

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [subjectModal, setSubjectModal] = useState(false);
  const [levelModal, setLevelModal] = useState(false);
  const [editSubject, setEditSubject] = useState<Subject | null>(null);
  const [editLevel, setEditLevel] = useState<Level | null>(null);
  const [subjectName, setSubjectName] = useState('');
  const [levelName, setLevelName] = useState('');
  const [levelSubjectId, setLevelSubjectId] = useState('');
  const [saving, setSaving] = useState(false);

  // Estados das Fichas de Aula (Class Sheets)
  const [expandedLevel, setExpandedLevel] = useState<string | null>(null);
  const [levelSheets, setLevelSheets] = useState<Record<string, ClassSheet[]>>({});
  const [sheetModal, setSheetModal] = useState(false);
  const [sheetTitle, setSheetTitle] = useState('');
  const [currentSheet, setCurrentSheet] = useState<ClassSheet | null>(null);
  const [activeLevelId, setActiveLevelId] = useState('');
  const [savingSheet, setSavingSheet] = useState(false);
  const [showEmojiMenu, setShowEmojiMenu] = useState(false);

  const EMOJI_LIST = [
    '📖', '💡', '🧠', '📝', '✏️', '🎓', '📐', '🧪', '🧬', '🎨', '🎵', '🏫', '📚', '🎒', '🧩',
    '⚠️', '📢', '⭐', '🎯', '🔥', '✅', '❌', 'ℹ️', '📌', '🚀', '⚡', '🔍', '📅', '👥', '🌈'
  ];

  const load = () => { subjectService.getAll().then(r => setSubjects(r.data)).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const toggleLevelExpand = async (levelId: string) => {
    if (expandedLevel === levelId) {
      setExpandedLevel(null);
    } else {
      setExpandedLevel(levelId);
      try {
        const res = await classSheetService.getByLevel(levelId);
        setLevelSheets(prev => ({ ...prev, [levelId]: res.data }));
      } catch {
        toast.error('Erro ao carregar fichas de aula.');
      }
    }
  };

  const handleCreateSheet = (levelId: string) => {
    setCurrentSheet(null);
    setSheetTitle('');
    setActiveLevelId(levelId);
    setSheetModal(true);
    setShowEmojiMenu(false);
    setTimeout(() => {
      const editor = document.getElementById('sheet-rich-editor');
      if (editor) editor.innerHTML = '';
    }, 100);
  };

  const handleEditSheet = (sheet: ClassSheet) => {
    setCurrentSheet(sheet);
    setSheetTitle(sheet.title);
    setActiveLevelId(sheet.levelId);
    setSheetModal(true);
    setShowEmojiMenu(false);
    setTimeout(() => {
      const editor = document.getElementById('sheet-rich-editor');
      if (editor) editor.innerHTML = sanitizeHtml(sheet.content);
    }, 100);
  };

  const handleSaveSheet = async (e: FormEvent) => {
    e.preventDefault();
    if (!sheetTitle.trim()) {
      toast.error('Preencha o título da ficha de aula.');
      return;
    }
    const editor = document.getElementById('sheet-rich-editor');
    const contentHtml = editor ? editor.innerHTML : '';
    if (!contentHtml.trim() || contentHtml === '<br>') {
      toast.error('Preencha o conteúdo da ficha de aula.');
      return;
    }

    setSavingSheet(true);
    try {
      if (currentSheet) {
        await classSheetService.update(currentSheet.id, { title: sheetTitle, content: contentHtml });
        toast.success('Ficha de aula atualizada!');
      } else {
        await classSheetService.create({ levelId: activeLevelId, title: sheetTitle, content: contentHtml });
        toast.success('Ficha de aula criada!');
      }
      setSheetModal(false);
      const res = await classSheetService.getByLevel(activeLevelId);
      setLevelSheets(prev => ({ ...prev, [activeLevelId]: res.data }));
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Erro ao salvar ficha de aula.');
    }
    setSavingSheet(false);
  };

  const handleDeleteSheet = async (levelId: string, sheetId: string) => {
    if (!confirm('Excluir esta ficha de aula?')) return;
    try {
      await classSheetService.delete(sheetId);
      toast.success('Ficha excluída!');
      const res = await classSheetService.getByLevel(levelId);
      setLevelSheets(prev => ({ ...prev, [levelId]: res.data }));
    } catch {
      toast.error('Erro ao excluir ficha.');
    }
  };

  const handleOpenPublicSheet = (sheetId: string) => {
    const url = `${window.location.origin}/sheet/${sheetId}`;
    window.open(url, '_blank');
  };

  const insertEmoji = (emoji: string) => {
    const editor = document.getElementById('sheet-rich-editor');
    if (!editor) return;
    editor.focus();

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    range.deleteContents();
    
    const textNode = document.createTextNode(emoji);
    range.insertNode(textNode);
    
    // Mover cursor
    range.setStartAfter(textNode);
    range.setEndAfter(textNode);
    selection.removeAllRanges();
    selection.addRange(range);
    
    setShowEmojiMenu(false);
  };

  const handleSaveSubject = async (e: FormEvent) => {
    e.preventDefault();
    if (!subjectName || !subjectName.trim()) {
      toast.error('Por favor, preencha o Nome da Matéria para salvar.');
      return;
    }
    setSaving(true);
    try {
      if (editSubject) { await subjectService.update(editSubject.id, { name: subjectName }); toast.success('Matéria atualizada!'); }
      else { await subjectService.create({ name: subjectName }); toast.success('Matéria criada!'); }
      setSubjectModal(false); load();
    } catch (err: any) { toast.error(err.response?.data?.message || err.response?.data?.error || 'Erro ao salvar matéria.'); }
    setSaving(false);
  };

  const handleSaveLevel = async (e: FormEvent) => {
    e.preventDefault();
    if (!levelName || !levelName.trim()) {
      toast.error('Por favor, preencha o Nome do Nível para salvar.');
      return;
    }
    setSaving(true);
    try {
      if (editLevel) { await levelService.update(editLevel.id, { name: levelName }); toast.success('Nível atualizado!'); }
      else { await levelService.create({ subjectId: levelSubjectId, name: levelName }); toast.success('Nível criado!'); }
      setLevelModal(false); load();
    } catch (err: any) { toast.error(err.response?.data?.message || err.response?.data?.error || 'Erro ao salvar nível.'); }
    setSaving(false);
  };

  const deleteSubject = async (id: string) => {
    if (!confirm('Excluir esta matéria?')) return;
    try { await subjectService.delete(id); toast.success('Excluída!'); load(); } catch { toast.error('Erro'); }
  };

  const deleteLevel = async (id: string) => {
    if (!confirm('Excluir este nível?')) return;
    try { await levelService.delete(id); toast.success('Excluído!'); load(); } catch { toast.error('Erro'); }
  };

  if (loading) return <div className="page-loading"><span className="loading-spinner" /></div>;

  return (
    <div className="subjects-page">
      <div className="page-toolbar">
        <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Matérias e Níveis</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="outline" icon={<MdAdd />} onClick={() => { setEditLevel(null); setLevelName(''); setLevelSubjectId(''); setLevelModal(true); }}>Novo Nível</Button>
          <Button icon={<MdAdd />} onClick={() => { setEditSubject(null); setSubjectName(''); setSubjectModal(true); }}>Nova Matéria</Button>
        </div>
      </div>

      {subjects.length === 0 ? (
        <Card variant="elevated" className="empty-state"><p className="empty-text">Nenhuma matéria cadastrada</p></Card>
      ) : (
        <div className="subjects-list">
          {subjects.map((subject, i) => (
            <Card key={subject.id} variant="elevated" accentColor="primary" className={`subject-item animate-slideUp stagger-${Math.min(i + 1, 6)}`}>
              <div className="subject-header" onClick={() => setExpanded(expanded === subject.id ? null : subject.id)}>
                <div className="subject-info"><h3>{subject.name}</h3><Badge variant="primary">{subject.studentCount}</Badge></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="subject-actions" onClick={e => e.stopPropagation()}>
                    <button className="icon-btn" onClick={() => { setEditSubject(subject); setSubjectName(subject.name); setSubjectModal(true); }}><MdEdit /></button>
                    <button className="icon-btn icon-btn-danger" onClick={() => deleteSubject(subject.id)}><MdDelete /></button>
                  </div>
                  {expanded === subject.id ? <MdExpandLess className="expand-icon" /> : <MdExpandMore className="expand-icon" />}
                </div>
              </div>
              {expanded === subject.id && (
                <div className="levels-section animate-slideDown">
                  {subject.levels.length === 0 ? <p className="empty-text">Nenhum nível</p> :
                    subject.levels.map(level => {
                      const isLevelExpanded = expandedLevel === level.id;
                      const sheets = levelSheets[level.id] || [];

                      return (
                        <div key={level.id} className="level-container" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '8px' }}>
                          <div className="level-item" style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={() => toggleLevelExpand(level.id)}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {isLevelExpanded ? <MdExpandLess style={{ fontSize: '18px' }} /> : <MdExpandMore style={{ fontSize: '18px' }} />}
                              <span style={{ fontWeight: 600 }}>{level.name}</span>
                              <Badge variant="secondary">{level.studentCount}</Badge>
                            </div>
                            <div className="level-actions" onClick={e => e.stopPropagation()}>
                              <button className="icon-btn" onClick={() => { setEditLevel(level); setLevelName(level.name); setLevelSubjectId(level.subjectId); setLevelModal(true); }} title="Editar nível"><MdEdit /></button>
                              <button className="icon-btn icon-btn-danger" onClick={() => deleteLevel(level.id)} title="Excluir nível"><MdDelete /></button>
                            </div>
                          </div>
                          
                          {isLevelExpanded && (
                            <div className="level-sheets-list animate-slideDown" style={{ paddingLeft: '0px', marginTop: '10px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', padding: '0 8px' }}>
                                <h5 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>📄 Fichas de Aula (Tema)</h5>
                                <button className="icon-btn" onClick={() => handleCreateSheet(level.id)} title="Adicionar Ficha de Aula"><MdAdd /></button>
                              </div>
                              {sheets.length === 0 ? (
                                <p className="empty-text" style={{ fontSize: '12px', padding: '10px 0', textAlign: 'left' }}>Nenhuma ficha de aula criada para este nível.</p>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  {sheets.map(sheet => (
                                    <div key={sheet.id} className="sheet-list-item">
                                      <span style={{ fontSize: '13px', fontWeight: 500 }}>{sheet.title}</span>
                                      <div style={{ display: 'flex', gap: '6px' }}>
                                        <button className="icon-btn" onClick={() => handleEditSheet(sheet)} title="Editar Ficha"><MdEdit /></button>
                                        <button className="icon-btn" onClick={() => handleOpenPublicSheet(sheet.id)} title="Abrir link público"><MdOpenInNew /></button>
                                        <button className="icon-btn icon-btn-danger" onClick={() => handleDeleteSheet(level.id, sheet.id)} title="Excluir Ficha"><MdDelete /></button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  }
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={subjectModal} onClose={() => setSubjectModal(false)} title={editSubject ? 'Editar Matéria' : 'Nova Matéria'} size="sm"
        footer={<><Button variant="ghost" onClick={() => setSubjectModal(false)}>Cancelar</Button><Button isLoading={saving} onClick={handleSaveSubject}>Salvar</Button></>}>
        <form onSubmit={handleSaveSubject}><Input label="Nome da Matéria" placeholder="Ex: Matemática" value={subjectName} onChange={e => setSubjectName(e.target.value)} required /></form>
      </Modal>

      <Modal isOpen={levelModal} onClose={() => setLevelModal(false)} title={editLevel ? 'Editar Nível' : 'Novo Nível'} size="sm"
        footer={<><Button variant="ghost" onClick={() => setLevelModal(false)}>Cancelar</Button><Button isLoading={saving} onClick={handleSaveLevel}>Salvar</Button></>}>
        <form onSubmit={handleSaveLevel} className="modal-form">
          {!levelSubjectId && <div className="input-group"><label className="input-label">Matéria</label>
            <select className="input-field" value={levelSubjectId} onChange={e => setLevelSubjectId(e.target.value)} required>
              <option value="">Selecione...</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>}
          <Input label="Nome do Nível" placeholder="Ex: Iniciante" value={levelName} onChange={e => setLevelName(e.target.value)} required />
        </form>
      </Modal>

      <Modal isOpen={sheetModal} onClose={() => setSheetModal(false)} title={currentSheet ? 'Editar Ficha de Aula' : 'Nova Ficha de Aula'} size="lg"
        footer={<><Button variant="ghost" onClick={() => setSheetModal(false)}>Cancelar</Button><Button isLoading={savingSheet} onClick={handleSaveSheet}>Salvar</Button></>}>
        <form onSubmit={handleSaveSheet} className="modal-form" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input label="Título da Aula / Tema" placeholder="Ex: Frações Equivalentes e Operações Básicas" value={sheetTitle} onChange={e => setSheetTitle(e.target.value)} required />
          
          <div className="rich-editor-container" style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
            {/* Barra de Ferramentas */}
            <div className="rich-editor-toolbar" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', padding: '8px', background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
              <button type="button" className="toolbar-btn" onClick={() => document.execCommand('bold', false)} title="Negrito" style={{ padding: '6px', fontSize: '18px', background: 'none', border: 'none', color: 'var(--text-primary)', borderRadius: '4px', cursor: 'pointer', display: 'flex' }}>
                <MdFormatBold />
              </button>
              <button type="button" className="toolbar-btn" onClick={() => document.execCommand('italic', false)} title="Itálico" style={{ padding: '6px', fontSize: '18px', background: 'none', border: 'none', color: 'var(--text-primary)', borderRadius: '4px', cursor: 'pointer', display: 'flex' }}>
                <MdFormatItalic />
              </button>
              <button type="button" className="toolbar-btn" onClick={() => document.execCommand('underline', false)} title="Sublinhado" style={{ padding: '6px', fontSize: '18px', background: 'none', border: 'none', color: 'var(--text-primary)', borderRadius: '4px', cursor: 'pointer', display: 'flex' }}>
                <MdFormatUnderlined />
              </button>
              
              <div style={{ width: '1px', height: '20px', background: 'var(--border-color)' }} />
              
              {/* Dropdown de tamanho da fonte */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Fonte:</span>
                <select className="input-field" style={{ padding: '2px 4px', fontSize: '12px', height: '28px', width: '110px' }} onChange={(e) => document.execCommand('fontSize', false, e.target.value)} defaultValue="3" title="Tamanho da fonte">
                  <option value="1">Muito Pequeno</option>
                  <option value="2">Pequeno</option>
                  <option value="3">Normal</option>
                  <option value="4">Médio</option>
                  <option value="5">Grande</option>
                  <option value="6">Muito Grande</option>
                  <option value="7">Gigante</option>
                </select>
              </div>

              <div style={{ width: '1px', height: '20px', background: 'var(--border-color)' }} />
              
              {/* Cor do Texto */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', position: 'relative' }}>
                <MdFormatColorText style={{ fontSize: '18px', color: 'var(--text-primary)' }} />
                <input type="color" onChange={(e) => document.execCommand('foreColor', false, e.target.value)} style={{ width: '28px', height: '28px', padding: '0', border: 'none', background: 'none', cursor: 'pointer' }} title="Cor do texto" />
              </div>

              <div style={{ width: '1px', height: '20px', background: 'var(--border-color)' }} />

              {/* Menu de Ícones/Emojis */}
              <div style={{ position: 'relative' }}>
                <button type="button" className="toolbar-btn" onClick={() => setShowEmojiMenu(!showEmojiMenu)} title="Inserir Ícone/Emoji" style={{ padding: '6px', fontSize: '18px', background: showEmojiMenu ? 'var(--accent-primary-light)' : 'none', border: 'none', color: showEmojiMenu ? 'var(--accent-primary)' : 'var(--text-primary)', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MdInsertEmoticon />
                  <span style={{ fontSize: '11px', fontWeight: 500 }}>Ícone</span>
                </button>
                {showEmojiMenu && (
                  <div className="emoji-popover animate-scaleIn" style={{ position: 'absolute', top: '100%', left: '0', zIndex: 100, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '10px', width: '240px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', boxShadow: 'var(--shadow-lg)', marginTop: '8px' }}>
                    {EMOJI_LIST.map((emoji, idx) => (
                      <button key={idx} type="button" onClick={() => insertEmoji(emoji)} style={{ fontSize: '20px', padding: '6px', background: 'none', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all var(--transition-fast)' }} className="emoji-btn-item">
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Área do Editor */}
            <div id="sheet-rich-editor" contentEditable={true} style={{ minHeight: '300px', maxHeight: '450px', overflowY: 'auto', padding: '16px', outline: 'none', color: 'var(--text-primary)', lineHeight: '1.6', fontSize: '14px', background: 'var(--bg-secondary)' }} data-placeholder="Escreva a ficha de aula aqui..." />
          </div>
        </form>
      </Modal>
    </div>
  );
}
