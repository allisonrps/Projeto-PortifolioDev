import { useEffect, useState, type FormEvent } from 'react';
import { MdAdd, MdDelete, MdEdit, MdExpandMore, MdExpandLess } from 'react-icons/md';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { subjectService, levelService } from '../../services/dataServices';
import type { Subject, Level } from '../../types';
import toast from 'react-hot-toast';
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

  const load = () => { subjectService.getAll().then(r => setSubjects(r.data)).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

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
                <div className="subject-info"><h3>{subject.name}</h3><Badge variant="primary">{subject.studentCount} alunos</Badge></div>
                <div className="subject-actions" onClick={e => e.stopPropagation()}>
                  <button className="icon-btn" onClick={() => { setEditSubject(subject); setSubjectName(subject.name); setSubjectModal(true); }}><MdEdit /></button>
                  <button className="icon-btn icon-btn-danger" onClick={() => deleteSubject(subject.id)}><MdDelete /></button>
                  {expanded === subject.id ? <MdExpandLess className="expand-icon" /> : <MdExpandMore className="expand-icon" />}
                </div>
              </div>
              {expanded === subject.id && (
                <div className="levels-section animate-slideDown">
                  <div className="levels-header"><h4>Níveis</h4>
                    <Button size="sm" variant="outline" icon={<MdAdd />} onClick={() => { setEditLevel(null); setLevelName(''); setLevelSubjectId(subject.id); setLevelModal(true); }}>Nível</Button>
                  </div>
                  {subject.levels.length === 0 ? <p className="empty-text">Nenhum nível</p> :
                    subject.levels.map(level => (
                      <div key={level.id} className="level-item">
                        <span>{level.name}</span><Badge variant="secondary">{level.studentCount} alunos</Badge>
                        <div className="level-actions">
                          <button className="icon-btn" onClick={() => { setEditLevel(level); setLevelName(level.name); setLevelSubjectId(level.subjectId); setLevelModal(true); }}><MdEdit /></button>
                          <button className="icon-btn icon-btn-danger" onClick={() => deleteLevel(level.id)}><MdDelete /></button>
                        </div>
                      </div>
                    ))
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
    </div>
  );
}
