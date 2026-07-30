import React, { useState, useEffect } from 'react';
import { MdAdd, MdDelete, MdAssignment, MdAssignmentTurnedIn } from 'react-icons/md';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import { activityService } from '../../services/activityService';
import { subjectService } from '../../services/dataServices';
import type { TemplateActivity, Subject, Level } from '../../types';
import toast from 'react-hot-toast';
import './ActivityTemplates.css';

interface NewQuestion {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: 'A' | 'B' | 'C' | 'D';
}

export default function ActivityTemplates() {
  const [templates, setTemplates] = useState<TemplateActivity[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'exam' | 'exercise'>('exercise');
  const [subjectId, setSubjectId] = useState('');
  const [levelId, setLevelId] = useState('');
  const [questions, setQuestions] = useState<NewQuestion[]>([
    { questionText: '', optionA: '', optionB: '', optionC: '', optionD: '', correctOption: 'A' }
  ]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // Update levels options when subject changes
  useEffect(() => {
    if (subjectId) {
      const selected = subjects.find(s => s.id === subjectId);
      setLevels(selected?.levels || []);
      setLevelId('');
    } else {
      setLevels([]);
      setLevelId('');
    }
  }, [subjectId, subjects]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tRes, sRes] = await Promise.all([
        activityService.getTemplates(),
        subjectService.getAll()
      ]);
      setTemplates(tRes.data);
      setSubjects(sRes.data);
    } catch {
      toast.error('Erro ao carregar dados.');
    }
    setLoading(false);
  };

  const handleAddQuestion = () => {
    setQuestions([...questions, { questionText: '', optionA: '', optionB: '', optionC: '', optionD: '', correctOption: 'A' }]);
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length === 1) return;
    setQuestions(questions.filter((_, idx) => idx !== index));
  };

  const handleQuestionChange = (index: number, field: keyof NewQuestion, value: string) => {
    setQuestions(
      questions.map((q, idx) => (idx === index ? { ...q, [field]: value } : q))
    );
  };

  const handleDeleteTemplate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Deseja excluir este modelo de atividade?')) return;
    try {
      await activityService.deleteTemplate(id);
      toast.success('Modelo excluído!');
      setTemplates(templates.filter(t => t.id !== id));
    } catch {
      toast.error('Erro ao excluir modelo.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !subjectId || !levelId) {
      toast.error('Preencha as informações básicas do modelo.');
      return;
    }

    // Validation of questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText || !q.optionA || !q.optionB || !q.optionC || !q.optionD) {
        toast.error(`Preencha todos os campos da questão ${i + 1}.`);
        return;
      }
    }

    setSaving(true);
    try {
      await activityService.createTemplate({
        title,
        type,
        subjectId,
        levelId,
        questions
      });
      toast.success('Modelo de atividade criado com sucesso!');
      setIsCreating(false);
      setTitle('');
      setQuestions([{ questionText: '', optionA: '', optionB: '', optionC: '', optionD: '', correctOption: 'A' }]);
      loadData();
    } catch {
      toast.error('Erro ao salvar modelo de atividade.');
    }
    setSaving(false);
  };

  if (loading && templates.length === 0) {
    return <div className="page-loading"><span className="loading-spinner" /></div>;
  }

  return (
    <div className="activity-templates">
      <div className="section-header">
        <h2>Banco de Provas & Exercícios</h2>
        {!isCreating && (
          <Button icon={<MdAdd />} onClick={() => setIsCreating(true)}>
            Criar Modelo
          </Button>
        )}
      </div>

      {isCreating ? (
        <Card variant="elevated" className="form-card animate-slideUp">
          <form onSubmit={handleSave} className="template-form">
            <h3 className="form-subtitle">Novo Modelo de Questões</h3>

            <div className="form-row">
              <Input
                label="Título da Atividade"
                placeholder="Ex: Prova Trimestral de Física"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
              <div className="input-group">
                <label className="input-label">Tipo de Atividade</label>
                <select className="select-field" value={type} onChange={e => setType(e.target.value as any)}>
                  <option value="exercise">Exercício</option>
                  <option value="exam">Prova</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="input-group">
                <label className="input-label">Matéria</label>
                <select className="select-field" value={subjectId} onChange={e => setSubjectId(e.target.value)} required>
                  <option value="">Selecione...</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Nível</label>
                <select className="select-field" value={levelId} onChange={e => setLevelId(e.target.value)} required disabled={!subjectId}>
                  <option value="">Selecione...</option>
                  {levels.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="questions-section">
              <h4 className="questions-header-title">Questões de Múltipla Escolha</h4>
              {questions.map((q, idx) => (
                <div key={idx} className="question-builder-item">
                  <div className="question-builder-header">
                    <h5>Questão {idx + 1}</h5>
                    {questions.length > 1 && (
                      <button type="button" className="remove-question-btn" onClick={() => handleRemoveQuestion(idx)}>
                        <MdDelete /> Remover
                      </button>
                    )}
                  </div>

                  <Input
                    label="Pergunta / Enunciado"
                    placeholder={`Digite a pergunta da questão ${idx + 1}...`}
                    value={q.questionText}
                    onChange={e => handleQuestionChange(idx, 'questionText', e.target.value)}
                    required
                  />

                  <div className="options-grid">
                    <div className="option-row">
                      <input 
                        type="radio" 
                        name={`correct-${idx}`} 
                        checked={q.correctOption === 'A'} 
                        onChange={() => handleQuestionChange(idx, 'correctOption', 'A')} 
                      />
                      <Input
                        label="Opção A"
                        placeholder="Alternativa A"
                        value={q.optionA}
                        onChange={e => handleQuestionChange(idx, 'optionA', e.target.value)}
                        required
                      />
                    </div>
                    <div className="option-row">
                      <input 
                        type="radio" 
                        name={`correct-${idx}`} 
                        checked={q.correctOption === 'B'} 
                        onChange={() => handleQuestionChange(idx, 'correctOption', 'B')} 
                      />
                      <Input
                        label="Opção B"
                        placeholder="Alternativa B"
                        value={q.optionB}
                        onChange={e => handleQuestionChange(idx, 'optionB', e.target.value)}
                        required
                      />
                    </div>
                    <div className="option-row">
                      <input 
                        type="radio" 
                        name={`correct-${idx}`} 
                        checked={q.correctOption === 'C'} 
                        onChange={() => handleQuestionChange(idx, 'correctOption', 'C')} 
                      />
                      <Input
                        label="Opção C"
                        placeholder="Alternativa C"
                        value={q.optionC}
                        onChange={e => handleQuestionChange(idx, 'optionC', e.target.value)}
                        required
                      />
                    </div>
                    <div className="option-row">
                      <input 
                        type="radio" 
                        name={`correct-${idx}`} 
                        checked={q.correctOption === 'D'} 
                        onChange={() => handleQuestionChange(idx, 'correctOption', 'D')} 
                      />
                      <Input
                        label="Opção D"
                        placeholder="Alternativa D"
                        value={q.optionD}
                        onChange={e => handleQuestionChange(idx, 'optionD', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <span className="builder-helper-text">Marque a bolinha ao lado da alternativa correta.</span>
                </div>
              ))}

              <Button type="button" variant="outline" icon={<MdAdd />} onClick={handleAddQuestion} style={{ marginTop: 'var(--space-md)' }}>
                Adicionar Nova Questão
              </Button>
            </div>

            <div className="form-footer-buttons">
              <Button type="button" variant="ghost" onClick={() => setIsCreating(false)}>Cancelar</Button>
              <Button type="submit" isLoading={saving}>Salvar Modelo</Button>
            </div>
          </form>
        </Card>
      ) : (
        <div className="templates-grid">
          {templates.length === 0 ? (
            <Card variant="outlined" className="empty-card">
              <p>Você não tem nenhum modelo de prova ou exercício criado ainda.</p>
              <Button icon={<MdAdd />} onClick={() => setIsCreating(true)} style={{ marginTop: '16px' }}>
                Começar a Criar
              </Button>
            </Card>
          ) : (
            templates.map(t => (
              <Card key={t.id} variant="elevated" className="template-card animate-fadeIn">
                <div className="template-card-header">
                  <div className="template-icon-wrap" style={{ background: t.type === 'exam' ? 'var(--danger-light)' : 'var(--success-light)', color: t.type === 'exam' ? 'var(--danger)' : 'var(--success)' }}>
                    {t.type === 'exam' ? <MdAssignmentTurnedIn /> : <MdAssignment />}
                  </div>
                  <div className="template-meta">
                    <h4 className="template-title">{t.title}</h4>
                    <span className="template-subtext">
                      {t.subjectName} • {t.levelName}
                    </span>
                  </div>
                  <button className="delete-btn" onClick={(e) => handleDeleteTemplate(t.id, e)} title="Excluir modelo">
                    <MdDelete />
                  </button>
                </div>
                <div className="template-card-footer">
                  <Badge variant={t.type === 'exam' ? 'danger' : 'success'}>
                    {t.type === 'exam' ? 'Prova' : 'Exercício'}
                  </Badge>
                  <span className="questions-count">{t.questions.length} questões</span>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
