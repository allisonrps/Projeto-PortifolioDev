import { useEffect, useState, type FormEvent } from 'react';
import { MdAdd, MdSearch, MdDelete, MdEdit, MdSchool, MdLayers, MdPerson, MdVisibility } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input, { TextArea } from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import { studentService } from '../../services/studentService';
import { subjectService, levelService } from '../../services/dataServices';
import type { Student, Subject, Level } from '../../types';
import toast from 'react-hot-toast';
import './Students.css';

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Filtering states
  const [statusFilter, setStatusFilter] = useState<'active' | 'archived' | 'all'>('active');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [formLevels, setFormLevels] = useState<Level[]>([]); // levels in creation form

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', birthDate: '', phone: '', guardianName: '', guardianPhone: '', subjectId: '', levelId: '',
    observation: '', monthlyPrice: '', isActive: 'true', firstClassDate: '', lastClassDate: ''
  });
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      const [s, sub] = await Promise.all([studentService.getAll(), subjectService.getAll()]);
      setStudents(s.data);
      setSubjects(sub.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFormSubjectChange = async (subjectId: string) => {
    setForm({ ...form, subjectId, levelId: '' });
    if (subjectId) {
      const res = await levelService.getBySubject(subjectId);
      setFormLevels(res.data);
    } else setFormLevels([]);
  };

  const calculateAge = (birthDateStr?: string) => {
    if (!birthDateStr) return null;
    const birth = new Date(birthDateStr);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const openCreate = () => {
    setEditingStudent(null);
    setForm({
      name: '', birthDate: '', phone: '', guardianName: '', guardianPhone: '', subjectId: '', levelId: '',
      observation: '', monthlyPrice: '', isActive: 'true', firstClassDate: '', lastClassDate: ''
    });
    setFormLevels([]);
    setIsModalOpen(true);
  };

  const openEdit = async (student: Student) => {
    setEditingStudent(student);
    setForm({
      name: student.name,
      birthDate: student.birthDate?.split('T')[0] || '',
      phone: student.phone || '',
      guardianName: student.guardianName || '',
      guardianPhone: student.guardianPhone || '',
      subjectId: student.subjectId,
      levelId: student.levelId,
      observation: student.observation || '',
      monthlyPrice: String(student.monthlyPrice || 0),
      isActive: String(student.isActive),
      firstClassDate: student.firstClassDate?.split('T')[0] || '',
      lastClassDate: student.lastClassDate?.split('T')[0] || ''
    });
    if (student.subjectId) {
      const res = await levelService.getBySubject(student.subjectId);
      setFormLevels(res.data);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const missingFields: string[] = [];

    if (!form.name || !form.name.trim()) {
      missingFields.push('Nome do Aluno');
    }

    if (subjects.length > 0) {
      if (!form.subjectId) {
        missingFields.push('Matéria');
      }
      if (form.subjectId && formLevels.length > 0 && !form.levelId) {
        missingFields.push('Nível');
      }
    }

    if (isMinor) {
      if (!form.guardianName || !form.guardianName.trim()) {
        missingFields.push('Nome do Responsável');
      }
      if (!form.guardianPhone || !form.guardianPhone.trim()) {
        missingFields.push('Telefone do Responsável');
      }
    }

    if (form.isActive === 'false' && !form.lastClassDate) {
      missingFields.push('Data da Última Aula (para arquivamento)');
    }

    if (missingFields.length > 0) {
      if (missingFields.length === 1) {
        toast.error(`Por favor, preencha o campo "${missingFields[0]}" para concluir o cadastro.`);
      } else {
        toast.error(`Por favor, preencha os seguintes campos para concluir o cadastro: ${missingFields.join(', ')}.`);
      }
      return;
    }

    setSaving(true);
    const body = {
      ...form,
      monthlyPrice: parseFloat(form.monthlyPrice || '0'),
      isActive: form.isActive === 'true',
      firstClassDate: form.firstClassDate ? `${form.firstClassDate}T00:00:00` : undefined,
      lastClassDate: form.isActive === 'false' && form.lastClassDate ? `${form.lastClassDate}T00:00:00` : undefined,
      birthDate: form.birthDate ? `${form.birthDate}T00:00:00` : undefined
    };

    try {
      if (editingStudent) {
        await studentService.update(editingStudent.id, body);
        toast.success('Aluno atualizado com sucesso!');
      } else {
        await studentService.create(body);
        toast.success('Aluno criado com sucesso!');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      const responseData = err.response?.data;
      if (responseData) {
        if (typeof responseData.message === 'string') {
          toast.error(responseData.message);
        } else if (typeof responseData.error === 'string') {
          toast.error(responseData.error);
        } else if (responseData.errors && typeof responseData.errors === 'object') {
          const firstErrList = Object.values(responseData.errors)[0] as string[];
          if (Array.isArray(firstErrList) && firstErrList.length > 0) {
            toast.error(firstErrList[0]);
          } else {
            toast.error('Preencha os campos obrigatórios para concluir o cadastro.');
          }
        } else {
          toast.error('Erro ao salvar os dados do aluno. Verifique as informações preenchidas.');
        }
      } else {
        toast.error('Erro de conexão ao salvar os dados do aluno.');
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este aluno?')) return;
    try {
      await studentService.delete(id);
      toast.success('Aluno excluído!');
      loadData();
    } catch {
      toast.error('Erro ao excluir aluno.');
    }
  };

  // Filter levels options based on selected subject in top filters
  const [filterLevelsOptions, setFilterLevelsOptions] = useState<Level[]>([]);
  useEffect(() => {
    if (subjectFilter !== 'all') {
      levelService.getBySubject(subjectFilter).then(res => {
        setFilterLevelsOptions(res.data);
      });
    } else {
      setFilterLevelsOptions([]);
      setLevelFilter('all');
    }
  }, [subjectFilter]);

  // Apply filters on client side
  const filtered = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());

    let matchesStatus = true;
    if (statusFilter === 'active') matchesStatus = s.isActive === true;
    else if (statusFilter === 'archived') matchesStatus = s.isActive === false;

    const matchesSubject = subjectFilter === 'all' || s.subjectId === subjectFilter;
    const matchesLevel = levelFilter === 'all' || s.levelId === levelFilter;

    return matchesSearch && matchesStatus && matchesSubject && matchesLevel;
  });

  const formAge = calculateAge(form.birthDate);
  const isMinor = formAge !== null && formAge < 18;

  return (
    <div className="students-page animate-fadeIn">
      <div className="page-toolbar">
        <div className="search-wrap">
          <MdSearch className="search-icon" />
          <input className="search-input" placeholder="Buscar aluno..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Button icon={<MdAdd />} onClick={openCreate}>Novo Aluno</Button>
      </div>

      <div className="filters-bar animate-fadeIn">
        <div className="filter-group-status">
          <button className={`filter-btn ${statusFilter === 'active' ? 'active' : ''}`} onClick={() => setStatusFilter('active')}>Ativos</button>
          <button className={`filter-btn ${statusFilter === 'archived' ? 'active' : ''}`} onClick={() => setStatusFilter('archived')}>Arquivados</button>
          <button className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`} onClick={() => setStatusFilter('all')}>Todos</button>
        </div>

        <div className="filters-dropdowns">
          <div className="filter-select-wrap">
            <MdSchool className="select-icon" />
            <select className="filter-select" value={subjectFilter} onChange={e => { setSubjectFilter(e.target.value); setLevelFilter('all'); }}>
              <option value="all">Todas as Matérias</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div className="filter-select-wrap">
            <MdLayers className="select-icon" />
            <select className="filter-select" value={levelFilter} onChange={e => setLevelFilter(e.target.value)} disabled={subjectFilter === 'all'}>
              <option value="all">Todos os Níveis</option>
              {filterLevelsOptions.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="page-loading" style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <span className="loading-spinner" />
        </div>
      ) : filtered.length === 0 ? (
        <Card variant="elevated" className="empty-state">
          <MdPerson className="empty-icon" />
          <p>Nenhum aluno encontrado</p>
          <Button onClick={openCreate} icon={<MdAdd />}>Adicionar Aluno</Button>
        </Card>
      ) : (
        <div className="students-list">
          {filtered.map((student, i) => (
            <Card
              key={student.id}
              variant="elevated"
              hoverable
              className={`student-row-card animate-slideUp stagger-${Math.min(i + 1, 6)} ${!student.isActive ? 'is-archived' : ''}`}
              onClick={() => navigate(`/students/${student.id}`)}
            >
              <div className="student-row-content">
                <Avatar src={student.photoUrl} name={student.name} size="md" shape="square" />
                <div className="student-row-info">
                  <h3 className="student-row-name">{student.name}</h3>
                  <div className="student-tags">
                    {student.subjectName && <Badge variant="primary">{student.subjectName}</Badge>}
                    {student.levelName && <Badge variant="secondary">{student.levelName}</Badge>}
                    <Badge variant={student.isActive ? 'success' : 'danger'}>{student.isActive ? 'Ativo' : 'Arquivado'}</Badge>
                  </div>
                </div>
                <div className="student-row-actions" onClick={e => e.stopPropagation()}>
                  <button className="icon-btn icon-btn-primary" onClick={() => navigate(`/students/${student.id}`)} title="Ver Detalhes do Aluno"><MdVisibility /></button>
                  <button className="icon-btn" onClick={() => openEdit(student)} title="Editar"><MdEdit /></button>
                  <button className="icon-btn icon-btn-danger" onClick={() => handleDelete(student.id)} title="Excluir"><MdDelete /></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStudent ? 'Editar Aluno' : 'Novo Aluno'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button isLoading={saving} onClick={handleSubmit}>{editingStudent ? 'Salvar' : 'Adicionar'}</Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="modal-form">
          <Input label="Nome *" placeholder="Nome completo" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />

          <div className="form-row">
            <Input label="Data da Primeira Aula" type="date" value={form.firstClassDate} onChange={e => setForm({ ...form, firstClassDate: e.target.value })} />
            <Input label="Data de Nascimento" type="date" value={form.birthDate} onChange={e => setForm({ ...form, birthDate: e.target.value })} />
          </div>

          {isMinor && (
            <div className="guardian-fields-wrap animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-primary)' }}>
                👨‍👩‍👧 Aluno menor de 18 anos ({formAge} anos) - Dados do Responsável
              </span>
              <div className="form-row">
                <Input label="Nome do Responsável *" placeholder="Nome do pai, mãe ou tutor" value={form.guardianName} onChange={e => setForm({ ...form, guardianName: e.target.value })} required={isMinor} />
                <Input label="Telefone do Responsável *" placeholder="(11) 99999-9999" value={form.guardianPhone} onChange={e => setForm({ ...form, guardianPhone: e.target.value })} required={isMinor} />
              </div>
            </div>
          )}

          <div className="form-row">
            <Input label="Telefone do Aluno" placeholder="(11) 99999-9999" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            <Input label="Valor da Mensalidade (R$)" type="number" placeholder="Ex: 350.00" value={form.monthlyPrice} onChange={e => setForm({ ...form, monthlyPrice: e.target.value })} />
          </div>

          <div className="form-row">
            <div className="input-group">
              <label className="input-label">Matéria {subjects.length > 0 ? '*' : '(Opcional — será criada Geral)'}</label>
              <select className="input-field" value={form.subjectId} onChange={e => handleFormSubjectChange(e.target.value)} required={subjects.length > 0}>
                <option value="">{subjects.length > 0 ? 'Selecione...' : 'Criar Matéria Geral Automática'}</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Nível {subjects.length > 0 ? '*' : '(Opcional — será criado Geral)'}</label>
              <select className="input-field" value={form.levelId} onChange={e => setForm({ ...form, levelId: e.target.value })} required={subjects.length > 0}>
                <option value="">{formLevels.length > 0 ? 'Selecione...' : 'Criar Nível Geral Automático'}</option>
                {formLevels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Status *</label>
            <select className="input-field" value={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.value })} required>
              <option value="true">Ativo</option>
              <option value="false">Arquivado</option>
            </select>
          </div>

          {form.isActive === 'false' && (
            <div className="animate-fadeIn">
              <Input label="Data da Última Aula *" type="date" value={form.lastClassDate} onChange={e => setForm({ ...form, lastClassDate: e.target.value })} required />
            </div>
          )}

          <TextArea label="Observação" placeholder="Notas sobre o aluno..." value={form.observation} onChange={e => setForm({ ...form, observation: e.target.value })} />
        </form>
      </Modal>
    </div>
  );
}
