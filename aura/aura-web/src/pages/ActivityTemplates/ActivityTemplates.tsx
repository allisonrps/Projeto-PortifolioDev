import React, { useState, useEffect } from 'react';
import { MdAdd as MdAddIcon, MdDelete as MdDeleteIcon, MdAssignment as MdAssignmentIcon, MdAssignmentTurnedIn as MdAssignmentTurnedInIcon, MdEdit as MdEditIcon, MdFilterList as MdFilterListIcon, MdFileDownload as MdDownloadIcon, MdHelpOutline as MdHelpIcon } from 'react-icons/md';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import { activityService } from '../../services/activityService';
import { subjectService } from '../../services/dataServices';
import type { TemplateActivity, Subject, Level } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import toast from 'react-hot-toast';
import { escapeHtml } from '../../utils/sanitizeHtml';
import './ActivityTemplates.css';

interface NewQuestion {
  questionText: string;
  questionType: 'multiple_choice' | 'writing' | 'text_block';
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: 'A' | 'B' | 'C' | 'D';
  showOptionC: boolean;
  showOptionD: boolean;
  weight: number;
}

export default function ActivityTemplates() {
  const { primaryColor } = useTheme();
  const [templates, setTemplates] = useState<TemplateActivity[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [filterSubjectId, setFilterSubjectId] = useState('');
  const [filterLevelId, setFilterLevelId] = useState('');
  const [filterLevels, setFilterLevels] = useState<Level[]>([]);

  // Form states
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateActivity | null>(null);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'exam' | 'exercise'>('exercise');
  const [subjectId, setSubjectId] = useState('');
  const [levelId, setLevelId] = useState('');
  const [maxGrade, setMaxGrade] = useState<number>(10);
  const [questions, setQuestions] = useState<NewQuestion[]>([
    { questionText: '', questionType: 'multiple_choice', optionA: '', optionB: '', optionC: '', optionD: '', correctOption: 'A', showOptionC: true, showOptionD: true, weight: 1 }
  ]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // Update levels options when subject changes in form
  useEffect(() => {
    if (subjectId) {
      const selected = subjects.find(s => s.id === subjectId);
      setLevels(selected?.levels || []);
      // If we are editing, only clear if the selected subject is different from the template's original subject
      if (!selectedTemplate || subjectId !== selectedTemplate.subjectId) {
        setLevelId('');
      }
    } else {
      setLevels([]);
      setLevelId('');
    }
  }, [subjectId, subjects, selectedTemplate]);

  // Update levels options for filtering
  useEffect(() => {
    if (filterSubjectId) {
      const selected = subjects.find(s => s.id === filterSubjectId);
      setFilterLevels(selected?.levels || []);
      setFilterLevelId('');
    } else {
      setFilterLevels([]);
      setFilterLevelId('');
    }
  }, [filterSubjectId, subjects]);

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
    setQuestions([...questions, { questionText: '', questionType: 'multiple_choice', optionA: '', optionB: '', optionC: '', optionD: '', correctOption: 'A', showOptionC: true, showOptionD: true, weight: 1 }]);
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length === 1) return;
    setQuestions(questions.filter((_, idx) => idx !== index));
  };

  const handleQuestionChange = (index: number, field: keyof NewQuestion, value: any) => {
    setQuestions(
      questions.map((q, idx) => (idx === index ? { ...q, [field]: value } : q))
    );
  };

  const handleQuestionMultipleFieldsChange = (index: number, changes: Partial<NewQuestion>) => {
    setQuestions(
      questions.map((q, idx) => (idx === index ? { ...q, ...changes } : q))
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

  const handleEditTemplate = (template: TemplateActivity, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTemplate(template);
    setTitle(template.title);
    setType(template.type);
    setSubjectId(template.subjectId);
    setMaxGrade(template.maxGrade !== undefined ? template.maxGrade : 10);
    
    const selected = subjects.find(s => s.id === template.subjectId);
    setLevels(selected?.levels || []);
    setLevelId(template.levelId);

    setQuestions(template.questions.map(q => {
      const hasC = !!q.optionC;
      const hasD = !!q.optionD;
      return {
        questionText: q.questionText,
        questionType: q.questionType || 'multiple_choice',
        optionA: q.optionA || '',
        optionB: q.optionB || '',
        optionC: q.optionC || '',
        optionD: q.optionD || '',
        correctOption: (q.correctOption as any) || 'A',
        showOptionC: hasC,
        showOptionD: hasD,
        weight: q.weight !== undefined ? q.weight : 1
      };
    }));
    setIsCreating(true);
  };

  const handleCancel = () => {
    setIsCreating(false);
    setSelectedTemplate(null);
    setTitle('');
    setType('exercise');
    setSubjectId('');
    setLevelId('');
    setMaxGrade(10);
    setQuestions([{ questionText: '', questionType: 'multiple_choice', optionA: '', optionB: '', optionC: '', optionD: '', correctOption: 'A', showOptionC: true, showOptionD: true, weight: 1 }]);
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
      if (!q.questionText) {
        toast.error(`Preencha o enunciado da questão ${i + 1}.`);
        return;
      }
      if (q.questionType === 'multiple_choice') {
        if (!q.optionA || !q.optionB) {
          toast.error(`Preencha as opções A e B da questão ${i + 1}.`);
          return;
        }
        if (q.showOptionC && !q.optionC) {
          toast.error(`Preencha a opção C da questão ${i + 1}.`);
          return;
        }
        if (q.showOptionD && !q.optionD) {
          toast.error(`Preencha a opção D da questão ${i + 1}.`);
          return;
        }
      }
    }

    setSaving(true);
    try {
      const formattedQuestions = questions.map(q => {
        if (q.questionType === 'text_block') {
          return {
            questionText: q.questionText,
            questionType: 'text_block',
            optionA: null,
            optionB: null,
            optionC: null,
            optionD: null,
            correctOption: null,
            weight: 0
          };
        } else if (q.questionType === 'writing') {
          return {
            questionText: q.questionText,
            questionType: 'writing',
            optionA: null,
            optionB: null,
            optionC: null,
            optionD: null,
            correctOption: null,
            weight: q.weight
          };
        } else {
          return {
            questionText: q.questionText,
            questionType: 'multiple_choice',
            optionA: q.optionA,
            optionB: q.optionB,
            optionC: q.showOptionC ? q.optionC : null,
            optionD: q.showOptionD ? q.optionD : null,
            correctOption: q.correctOption,
            weight: q.weight
          };
        }
      });

      const body = {
        title,
        type,
        subjectId,
        levelId,
        maxGrade,
        questions: formattedQuestions
      };

      if (selectedTemplate) {
        await activityService.updateTemplate(selectedTemplate.id, body);
        toast.success('Modelo de atividade atualizado!');
      } else {
        await activityService.createTemplate(body);
        toast.success('Modelo de atividade criado!');
      }
      
      handleCancel();
      loadData();
    } catch (err: any) {
      const apiError = err.response?.data?.error || err.response?.data?.message || 'Erro ao salvar modelo de atividade.';
      toast.error(apiError);
    }
    setSaving(false);
  };

  const exportToPdf = (template: TemplateActivity) => {
    const totalWeight = template.questions.filter(x => x.questionType !== 'text_block').reduce((sum, q) => sum + (q.weight || 0), 0);
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Por favor, permita pop-ups para exportar a prova.');
      return;
    }

    let questionsHtml = '';
    let questionNumber = 0;
    template.questions.forEach((q) => {
      const isTextBlock = q.questionType === 'text_block';
      if (!isTextBlock) questionNumber++;

      if (isTextBlock) {
        questionsHtml += `
          <div class="text-block-print">
            <strong>📖 Texto de Leitura / Apoio:</strong><br/>
            ${escapeHtml(q.questionText).replace(/\n/g, '<br/>')}
          </div>
        `;
      } else {
        const val = totalWeight > 0 ? (((q.weight || 1) / totalWeight) * (template.maxGrade || 10)) : 0;
        questionsHtml += `
          <div class="question-card-print">
            <div class="question-header-print">
              <span class="question-num-print">Questão ${questionNumber}</span>
              <span class="question-badge-print">Vale ${val.toFixed(1)} pts</span>
            </div>
            <div class="question-body-print">
              <div class="question-text-print">${escapeHtml(q.questionText).replace(/\n/g, '<br/>')}</div>
        `;

        if (q.questionType === 'multiple_choice') {
          questionsHtml += '<div class="options-list">';
          if (q.optionA) questionsHtml += `<div class="option"><span class="checkbox">( &nbsp; )</span> A) ${escapeHtml(q.optionA)}</div>`;
          if (q.optionB) questionsHtml += `<div class="option"><span class="checkbox">( &nbsp; )</span> B) ${escapeHtml(q.optionB)}</div>`;
          if (q.optionC) questionsHtml += `<div class="option"><span class="checkbox">( &nbsp; )</span> C) ${escapeHtml(q.optionC)}</div>`;
          if (q.optionD) questionsHtml += `<div class="option"><span class="checkbox">( &nbsp; )</span> D) ${escapeHtml(q.optionD)}</div>`;
          questionsHtml += '</div>';
        } else {
          questionsHtml += `
            <div class="writing-lines">
              <div class="line"></div>
              <div class="line"></div>
              <div class="line"></div>
              <div class="line"></div>
              <div class="line"></div>
            </div>
          `;
        }
        questionsHtml += `</div></div>`;
      }
    });

    printWindow.document.write(`
      <html>
      <head>
        <title>${escapeHtml(template.title)}</title>
        <style>
          @page { size: A4; margin: 15mm; }
          body { font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #111; background: #fff; padding: 0; margin: 0; font-size: 10pt; }
          
          /* Modern Minimalist Header */
          .exam-header {
            width: 100%;
            margin-bottom: 25px;
            border-bottom: 2px solid ${primaryColor};
            padding-bottom: 15px;
          }
          .header-row-1 {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 9pt;
            color: #666;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .header-row-student {
            width: 100%;
            margin-bottom: 12px;
            font-size: 10.5pt;
            font-weight: bold;
            display: flex;
            align-items: center;
          }
          .header-row-student span {
            flex-shrink: 0;
            margin-right: 6px;
          }
          .header-row-student .line-fill {
            flex-grow: 1;
            border-bottom: 1.5px solid #000;
            height: 18px;
          }
          .header-row-3 {
            display: flex;
            justify-content: space-between;
            font-size: 9.5pt;
            color: #222;
          }
          .header-row-3 span strong {
            color: #000;
          }
          
          .title { text-align: center; font-size: 14pt; font-weight: 800; margin: 20px 0; text-transform: uppercase; letter-spacing: 0.5px; color: ${primaryColor}; }
          
          /* Question Boxed Styling */
          .question-card-print {
            border: 1.2px solid ${primaryColor};
            border-radius: 8px;
            margin-bottom: 20px;
            page-break-inside: avoid;
            overflow: hidden;
            background: #fff;
          }
          .question-header-print {
            background-color: color-mix(in srgb, ${primaryColor} 7%, transparent);
            padding: 8px 14px;
            border-bottom: 1.2px solid ${primaryColor};
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .question-num-print {
            font-weight: 800;
            font-size: 9.5pt;
            color: ${primaryColor};
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .question-badge-print {
            font-size: 8.5pt;
            font-weight: 700;
            color: ${primaryColor};
            background: #fff;
            border: 1px solid ${primaryColor};
            padding: 2px 8px;
            border-radius: 4px;
          }
          .question-body-print {
            padding: 14px;
          }
          .question-text-print {
            font-size: 10pt;
            color: #111;
            margin-bottom: 12px;
            line-height: 1.5;
          }
          .options-list { display: flex; flex-direction: column; gap: 8px; }
          .option { display: flex; align-items: flex-start; gap: 10px; font-size: 9.5pt; }
          .checkbox { font-weight: bold; color: ${primaryColor}; font-size: 9.5pt; flex-shrink: 0; }
          .writing-lines { margin-top: 10px; }
          .writing-lines .line { border-bottom: 1px solid #ddd; height: 26px; width: 100%; }
          .text-block-print { background-color: #fafafa; border-left: 4px solid ${primaryColor}; padding: 14px 18px; margin-bottom: 20px; font-style: italic; border-radius: 4px; border-top: 1px solid #eee; border-right: 1px solid #eee; border-bottom: 1px solid #eee; page-break-inside: avoid; font-size: 9.5pt; }
          
          /* Footer Styling */
          .exam-footer {
            margin-top: 30px;
            border-top: 1px solid #eee;
            padding-top: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 8.5pt;
            color: #888;
            page-break-inside: avoid;
          }
          .exam-footer-logo {
            display: flex;
            align-items: center;
            gap: 5px;
            font-weight: 800;
            color: ${primaryColor};
            letter-spacing: 0.5px;
          }
        </style>
      </head>
      <body>
        <div class="exam-header">
          <div class="header-row-1">
            <span>Aura Avaliações</span>
            <span>DATA: ____/____/______</span>
          </div>
          <div class="header-row-student">
            <span>ALUNO(A):</span>
            <div class="line-fill"></div>
          </div>
          <div class="header-row-3">
            <span><strong>Disciplina:</strong> ${escapeHtml(template.subjectName)}</span>
            <span><strong>Etapa/Nível:</strong> ${escapeHtml(template.levelName)}</span>
            <span><strong>Nota máxima:</strong> ${(template.maxGrade || 10).toFixed(1)}</span>
          </div>
        </div>

        <div class="title">${escapeHtml(template.title)}</div>
        
        ${questionsHtml}
        
        <div class="exam-footer">
          <span>Documento gerado para avaliação pedagógica do aluno.</span>
          <div class="exam-footer-logo">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>
            AURA
          </div>
        </div>
        
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const exportToWord = (template: TemplateActivity) => {
    const totalWeight = template.questions.filter(x => x.questionType !== 'text_block').reduce((sum, q) => sum + (q.weight || 0), 0);
    let html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>${escapeHtml(template.title)}</title>
        <style>
          body { font-family: 'Arial', sans-serif; line-height: 1.5; padding: 20px; }
          .exam-header { width: 100%; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 25px; }
          .header-table { width: 100%; border-collapse: collapse; }
          .header-table td { padding: 4px 0; border: none; font-size: 11pt; }
          .title { text-align: center; font-size: 16pt; font-weight: bold; margin-top: 25px; margin-bottom: 25px; text-transform: uppercase; }
          .question { margin-bottom: 25px; }
          .question-text { font-weight: bold; font-size: 11pt; margin-bottom: 10px; }
          .question-badge { font-weight: normal; font-size: 9pt; color: #444; background: #e8e8e8; border: 1px solid #ccc; padding: 2px 6px; }
          .option { margin-left: 20px; margin-bottom: 6px; font-size: 11pt; }
          .text-block { background-color: #f9f9f9; padding: 15px; border-left: 4px solid #555; margin-bottom: 20px; font-style: italic; }
        </style>
      </head>
      <body>
        <div class="exam-header">
          <table class="header-table">
            <tr>
              <td width="50%"><b>Aura Avaliações</b></td>
              <td width="50%" align="right"><b>DATA:</b> ____/____/______</td>
            </tr>
            <tr>
              <td colspan="2"><b>ALUNO(A):</b> __________________________________________________________________________________</td>
            </tr>
            <tr>
              <td width="50%"><b>Disciplina:</b> ${escapeHtml(template.subjectName)} &nbsp;|&nbsp; <b>Etapa:</b> ${escapeHtml(template.levelName)}</td>
              <td width="50%" align="right"><b>Nota Máxima:</b> ${(template.maxGrade || 10).toFixed(1)}</td>
            </tr>
          </table>
        </div>
        
        <div class="title">${escapeHtml(template.title)}</div>
    `;

    let questionNumber = 0;
    template.questions.forEach((q) => {
      const isTextBlock = q.questionType === 'text_block';
      if (!isTextBlock) questionNumber++;

      if (isTextBlock) {
        html += `
          <div class="text-block">
            <b>📖 Texto de Leitura / Apoio:</b><br/>
            ${escapeHtml(q.questionText).replace(/\n/g, '<br/>')}
          </div>
        `;
      } else {
        const val = totalWeight > 0 ? (((q.weight || 1) / totalWeight) * (template.maxGrade || 10)) : 0;
        html += `
          <div class="question">
            <div class="question-text">
              Questão ${questionNumber}. ${q.questionText} &nbsp;&nbsp;<span class="question-badge">[Vale ${val.toFixed(1)} pts]</span>
            </div>
        `;

        if (q.questionType === 'multiple_choice') {
          if (q.optionA) html += `<div class="option">( &nbsp; ) A) ${escapeHtml(q.optionA)}</div>`;
          if (q.optionB) html += `<div class="option">( &nbsp; ) B) ${escapeHtml(q.optionB)}</div>`;
          if (q.optionC) html += `<div class="option">( &nbsp; ) C) ${escapeHtml(q.optionC)}</div>`;
          if (q.optionD) html += `<div class="option">( &nbsp; ) D) ${escapeHtml(q.optionD)}</div>`;
        } else {
          html += `
            <div style="margin-top: 15px; color: #aaa; letter-spacing: 1px;">
              _________________________________________________________________________________<br/><br/>
              _________________________________________________________________________________<br/><br/>
              _________________________________________________________________________________<br/><br/>
              _________________________________________________________________________________<br/><br/>
              _________________________________________________________________________________
            </div>
          `;
        }
        html += `</div>`;
      }
    });

    html += `</body></html>`;

    const blob = new Blob(['\ufeff' + html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.title.replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportTemplate = (template: TemplateActivity) => {
    const formatPref = localStorage.getItem('aura_export_format') || 'pdf';
    if (formatPref === 'doc') {
      exportToWord(template);
    } else {
      exportToPdf(template);
    }
  };

  const filteredTemplates = templates.filter(t => {
    const matchesSubject = !filterSubjectId || t.subjectId === filterSubjectId;
    const matchesLevel = !filterLevelId || t.levelId === filterLevelId;
    return matchesSubject && matchesLevel;
  });

  if (loading && templates.length === 0) {
    return <div className="page-loading"><span className="loading-spinner" /></div>;
  }

  return (
    <div className="activity-templates">
      <div className="section-header">
        <h2>Provas & Exercícios</h2>
        {!isCreating && (
          <Button icon={<MdAddIcon />} onClick={() => setIsCreating(true)}>
            Criar
          </Button>
        )}
      </div>

      {/* Filter bar displayed at top of the listing page */}
      {!isCreating && (
        <Card variant="outlined" className="filter-card" style={{ marginBottom: 'var(--space-lg)', padding: '12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MdFilterListIcon /> Filtrar por:
            </span>
            <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '240px', flexWrap: 'wrap' }}>
              <select 
                className="select-field" 
                style={{ height: '36px', fontSize: '13px', padding: '0 8px', flex: 1 }}
                value={filterSubjectId} 
                onChange={e => setFilterSubjectId(e.target.value)}
              >
                <option value="">Todas as Matérias</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <select 
                className="select-field" 
                style={{ height: '36px', fontSize: '13px', padding: '0 8px', flex: 1 }}
                value={filterLevelId} 
                onChange={e => setFilterLevelId(e.target.value)}
                disabled={!filterSubjectId}
              >
                <option value="">Todos os Níveis</option>
                {filterLevels.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
              {(filterSubjectId || filterLevelId) && (
                <Button variant="ghost" size="sm" onClick={() => { setFilterSubjectId(''); setFilterLevelId(''); }}>
                  Limpar
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {isCreating ? (
        <Card variant="elevated" className="form-card animate-slideUp">
          <form onSubmit={handleSave} className="template-form">
            <h3 className="form-subtitle">
              {selectedTemplate ? 'Editar Modelo de Atividade' : 'Novo Modelo de Questões'}
            </h3>

            <div className="form-row-top">
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
              <div className="input-group">
                <label className="input-label">Nota Máxima</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="100"
                  className="select-field"
                  value={maxGrade}
                  onChange={e => setMaxGrade(parseFloat(e.target.value) || 10)}
                  required
                  style={{ height: '42px', padding: '0 12px', boxSizing: 'border-box' }}
                />
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
              <h4 className="questions-header-title">Questões de Provas/Exercícios</h4>
              {(() => {
                const totalWeight = questions.filter(x => x.questionType !== 'text_block').reduce((sum, x) => sum + (x.weight || 0), 0);
                return questions.map((q, idx) => (
                  <div key={idx} className="question-builder-item">
                    <div className="question-builder-header">
                      <div className="question-header-left">
                        <div className="question-title-wrap">
                          {/* Weight Selector Button (hidden for text blocks) */}
                          {q.questionType !== 'text_block' && (
                            <button
                              type="button"
                              title="Clique para alterar o peso desta questão"
                              onClick={() => {
                                const current = q.weight !== undefined ? q.weight : 1;
                                let next = 1;
                                if (current === 5) {
                                  next = 0.5;
                                } else if (current === 0.5) {
                                  next = 1;
                                } else {
                                  next = current + 0.5;
                                }
                                handleQuestionChange(idx, 'weight', next);
                              }}
                              className="question-weight-btn"
                            >
                              {q.weight !== undefined ? q.weight : 1}x
                            </button>
                          )}
                          <h5 style={{ margin: 0, fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>{q.questionType === 'text_block' ? 'Texto de Apoio' : `Questão ${idx + 1}`}</span>
                            {q.questionType !== 'text_block' && totalWeight > 0 && (
                              <span style={{ display: 'inline-flex', fontSize: '10px' }}>
                                <Badge variant="primary">
                                  Vale {(((q.weight || 1) / totalWeight) * maxGrade).toFixed(1)} pts
                                </Badge>
                              </span>
                            )}
                          </h5>
                        </div>
                      
                      {/* Question Type Toggle */}
                      <div className="type-toggle-bar">
                        <button
                          type="button"
                          className={`type-toggle-btn ${q.questionType === 'multiple_choice' ? 'active' : ''}`}
                          onClick={() => handleQuestionChange(idx, 'questionType', 'multiple_choice')}
                        >
                          Múltipla Escolha
                        </button>
                        <button
                          type="button"
                          className={`type-toggle-btn ${q.questionType === 'writing' ? 'active' : ''}`}
                          onClick={() => handleQuestionChange(idx, 'questionType', 'writing')}
                        >
                          Aberta
                        </button>
                        <button
                          type="button"
                          className={`type-toggle-btn ${q.questionType === 'text_block' ? 'active' : ''}`}
                          onClick={() => {
                            handleQuestionMultipleFieldsChange(idx, {
                              questionType: 'text_block',
                              weight: 0
                            });
                          }}
                        >
                          Texto
                        </button>
                      </div>
                    </div>

                    {questions.length > 1 && (
                      <button type="button" className="remove-question-btn" onClick={() => handleRemoveQuestion(idx)}>
                        <MdDeleteIcon /> Remover
                      </button>
                    )}
                  </div>

                  {/* Question Statement Field */}
                  <div className="input-group">
                    <label className="input-label">
                      {q.questionType === 'text_block' ? 'Texto / Conteúdo de Apoio' : 'Pergunta / Enunciado'}
                    </label>
                    <textarea
                      className="select-field"
                      placeholder={q.questionType === 'text_block' ? 'Digite o texto de apoio ou leitura contextualizada aqui...' : `Digite a pergunta da questão ${idx + 1}...`}
                      value={q.questionText}
                      onChange={e => handleQuestionChange(idx, 'questionText', e.target.value)}
                      rows={q.questionType === 'text_block' ? 5 : 3}
                      required
                      style={{
                        padding: '10px 12px',
                        height: 'auto',
                        minHeight: q.questionType === 'text_block' ? '120px' : '80px',
                        fontFamily: 'inherit',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  {/* Multiple Choice specific inputs */}
                  {q.questionType === 'multiple_choice' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                      <label className="input-label" style={{ marginBottom: '2px' }}>Alternativas</label>
                      <div className="options-list-editor" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        
                        {/* Option A */}
                        <div className="option-edit-row" style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
                          <input 
                            type="radio" 
                            name={`correct-${idx}`} 
                            checked={q.correctOption === 'A'} 
                            onChange={() => handleQuestionChange(idx, 'correctOption', 'A')}
                            title="Marcar como correta"
                            style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
                          />
                          <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-secondary)', minWidth: '18px' }}>A.</span>
                          <input
                            type="text"
                            className="select-field"
                            placeholder="Digite a alternativa A"
                            value={q.optionA}
                            onChange={e => handleQuestionChange(idx, 'optionA', e.target.value)}
                            required
                            style={{ flex: 1, height: '38px', padding: '0 12px', fontSize: '13px', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}
                          />
                          <div style={{ width: '28px' }} />
                        </div>

                        {/* Option B */}
                        <div className="option-edit-row" style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
                          <input 
                            type="radio" 
                            name={`correct-${idx}`} 
                            checked={q.correctOption === 'B'} 
                            onChange={() => handleQuestionChange(idx, 'correctOption', 'B')}
                            title="Marcar como correta"
                            style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
                          />
                          <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-secondary)', minWidth: '18px' }}>B.</span>
                          <input
                            type="text"
                            className="select-field"
                            placeholder="Digite a alternativa B"
                            value={q.optionB}
                            onChange={e => handleQuestionChange(idx, 'optionB', e.target.value)}
                            required
                            style={{ flex: 1, height: '38px', padding: '0 12px', fontSize: '13px', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}
                          />
                          <div style={{ width: '28px' }} />
                        </div>

                        {/* Option C */}
                        {q.showOptionC ? (
                          <div className="option-edit-row" style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
                            <input 
                              type="radio" 
                              name={`correct-${idx}`} 
                              checked={q.correctOption === 'C'} 
                              onChange={() => handleQuestionChange(idx, 'correctOption', 'C')}
                              title="Marcar como correta"
                              style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
                            />
                            <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-secondary)', minWidth: '18px' }}>C.</span>
                            <input
                              type="text"
                              className="select-field"
                              placeholder="Digite a alternativa C"
                              value={q.optionC}
                              onChange={e => handleQuestionChange(idx, 'optionC', e.target.value)}
                              required
                              style={{ flex: 1, height: '38px', padding: '0 12px', fontSize: '13px', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                handleQuestionMultipleFieldsChange(idx, {
                                  showOptionC: false,
                                  optionC: '',
                                  showOptionD: false,
                                  optionD: '',
                                  correctOption: (q.correctOption === 'C' || q.correctOption === 'D') ? 'A' : q.correctOption
                                });
                              }}
                              style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              title="Excluir opção C"
                            >
                              <MdDeleteIcon />
                            </button>
                          </div>
                        ) : (
                          <div style={{ paddingLeft: '28px' }}>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              icon={<MdAddIcon />}
                              onClick={() => handleQuestionChange(idx, 'showOptionC', true)}
                              style={{ height: '32px', padding: '0 10px', fontSize: '12px' }}
                            >
                              Adicionar Opção C
                            </Button>
                          </div>
                        )}

                        {/* Option D */}
                        {q.showOptionC && (
                          q.showOptionD ? (
                            <div className="option-edit-row" style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
                              <input 
                                type="radio" 
                                name={`correct-${idx}`} 
                                checked={q.correctOption === 'D'} 
                                onChange={() => handleQuestionChange(idx, 'correctOption', 'D')}
                                title="Marcar como correta"
                                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
                              />
                              <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-secondary)', minWidth: '18px' }}>D.</span>
                              <input
                                type="text"
                                className="select-field"
                                placeholder="Digite a alternativa D"
                                value={q.optionD}
                                onChange={e => handleQuestionChange(idx, 'optionD', e.target.value)}
                                required
                                style={{ flex: 1, height: '38px', padding: '0 12px', fontSize: '13px', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  handleQuestionMultipleFieldsChange(idx, {
                                    showOptionD: false,
                                    optionD: '',
                                    correctOption: q.correctOption === 'D' ? 'A' : q.correctOption
                                  });
                                }}
                                style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                title="Excluir opção D"
                              >
                                <MdDeleteIcon />
                              </button>
                            </div>
                          ) : (
                            <div style={{ paddingLeft: '28px' }}>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                icon={<MdAddIcon />}
                                onClick={() => handleQuestionChange(idx, 'showOptionD', true)}
                                style={{ height: '32px', padding: '0 10px', fontSize: '12px' }}
                              >
                                Adicionar Opção D
                              </Button>
                            </div>
                          )
                        )}
                      </div>
                      <span className="builder-helper-text" style={{ marginTop: '4px' }}>Marque o círculo correspondente à alternativa correta.</span>
                    </div>
                  )}

                  {q.questionType === 'writing' && (
                    <div style={{ padding: '8px 12px', background: 'rgba(var(--accent-primary-rgb), 0.05)', borderLeft: '3px solid var(--accent-primary)', borderRadius: 'var(--radius-sm)', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                      📝 <strong>Questão Aberta:</strong> O estudante terá uma caixa de digitação para responder esta pergunta por escrito. Você corrigirá e dará a menção de nota posteriormente.
                    </div>
                  )}

                  {q.questionType === 'text_block' && (
                    <div style={{ padding: '8px 12px', background: 'rgba(var(--accent-secondary-rgb), 0.05)', borderLeft: '3px solid var(--accent-secondary)', borderRadius: 'var(--radius-sm)', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                      📖 <strong>Texto de Apoio / Leitura:</strong> Este bloco exibe apenas texto de leitura para interpretação e não possui peso ou opções de resposta. Ideal para contextualizar questões sequenciais.
                    </div>
                  )}
                  </div>
                ));
              })()}

              <Button type="button" variant="outline" icon={<MdAddIcon />} onClick={handleAddQuestion} style={{ marginTop: 'var(--space-md)' }}>
                Adicionar Nova Questão
              </Button>
            </div>

            <div className="form-footer-buttons">
              <Button type="button" variant="ghost" onClick={handleCancel}>Cancelar</Button>
              <Button type="submit" isLoading={saving}>
                {selectedTemplate ? 'Salvar Alterações' : 'Salvar Modelo'}
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <div className="templates-grid">
          {filteredTemplates.length === 0 ? (
            <Card variant="outlined" className="empty-card">
              <p>Nenhum modelo de prova ou exercício encontrado para o filtro atual.</p>
              {templates.length === 0 && (
                <Button icon={<MdAddIcon />} onClick={() => setIsCreating(true)} style={{ marginTop: '16px' }}>
                  Começar a Criar
                </Button>
              )}
            </Card>
          ) : (
            filteredTemplates.map(t => (
              <Card key={t.id} variant="elevated" className="template-card animate-fadeIn">
                <div className="template-card-header-part">
                  <div className="template-icon-wrap" style={{ background: t.type === 'exam' ? 'var(--danger-light)' : 'var(--success-light)', color: t.type === 'exam' ? 'var(--danger)' : 'var(--success)' }}>
                    {t.type === 'exam' ? <MdAssignmentTurnedInIcon /> : <MdAssignmentIcon />}
                  </div>
                  <div className="template-meta">
                    <h4 className="template-title">{t.title}</h4>
                  </div>
                </div>
                <div className="template-card-details-part">
                  <div className="template-tags-group">
                    {t.subjectName && <Badge variant="primary">{t.subjectName}</Badge>}
                    {t.levelName && <Badge variant="secondary">{t.levelName}</Badge>}
                    <Badge variant={t.type === 'exam' ? 'danger' : 'success'}>
                      {t.type === 'exam' ? 'Prova' : 'Exercício'}
                    </Badge>
                    <span className="questions-count" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }} title={`${t.questions.length} questões`}>
                      <MdHelpIcon style={{ fontSize: '14px', color: 'var(--text-muted)' }} />
                      {t.questions.length}
                    </span>
                  </div>
                  <div className="template-card-actions">
                    <button className="delete-btn" onClick={(e) => { e.stopPropagation(); handleExportTemplate(t); }} title="Exportar modelo (PDF/DOC)" style={{ color: 'var(--text-secondary)' }}>
                      <MdDownloadIcon />
                    </button>
                    <button className="delete-btn" onClick={(e) => handleEditTemplate(t, e)} title="Editar modelo" style={{ color: 'var(--text-secondary)' }}>
                      <MdEditIcon />
                    </button>
                    <button className="delete-btn" onClick={(e) => handleDeleteTemplate(t.id, e)} title="Excluir modelo">
                      <MdDeleteIcon />
                    </button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
