import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MdAssignment, MdAssignmentTurnedIn } from 'react-icons/md';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { activityService } from '../../services/activityService';
import type { StudentActivity } from '../../types';
import toast from 'react-hot-toast';
import { sanitizeHtml } from '../../utils/sanitizeHtml';
import './PublicQuiz.css';

export default function PublicQuiz() {
  const { activityId } = useParams<{ activityId: string }>();
  const [activity, setActivity] = useState<StudentActivity | null>(null);
  const [answers, setAnswers] = useState<{ [questionId: string]: { selectedOption?: string; writtenAnswer?: string } }>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittedActivity, setSubmittedActivity] = useState<StudentActivity | null>(null);

  useEffect(() => {
    if (activityId) {
      loadActivity(activityId);
    }
  }, [activityId]);

  useEffect(() => {
    if (activity) {
      const typeLabel = activity.type === 'exam' ? 'Prova' : 'Exercício';
      const pageTitle = `${activity.title} (${typeLabel}) - Aura`;
      document.title = pageTitle;

      // Update Open Graph tags dynamically in the DOM
      const updateMeta = (attr: string, key: string, content: string) => {
        let el = document.querySelector(`meta[${attr}="${key}"]`);
        if (!el) {
          el = document.createElement('meta');
          el.setAttribute(attr, key);
          document.head.appendChild(el);
        }
        el.setAttribute('content', content);
      };

      updateMeta('property', 'og:title', `${activity.title} - ${typeLabel} | Aura`);
      updateMeta('property', 'og:description', `Atividade para o(a) aluno(a) ${activity.studentName}. Clique para responder online.`);
      updateMeta('name', 'twitter:title', `${activity.title} - ${typeLabel} | Aura`);
      updateMeta('name', 'twitter:description', `Atividade para o(a) aluno(a) ${activity.studentName}. Clique para responder online.`);
    }
  }, [activity]);

  const loadActivity = async (id: string) => {
    setLoading(true);
    try {
      const res = await activityService.getPublicActivity(id);
      setActivity(res.data);
    } catch (err: any) {
      if (err.response?.status === 400 && err.response?.data?.message?.includes('finalizada')) {
        toast.error('Esta atividade já foi respondida e finalizada.');
      } else {
        toast.error('Erro ao carregar atividade. Verifique se o link está correto.');
      }
    }
    setLoading(false);
  };

  const handleSelectOption = (questionId: string, option: string) => {
    setAnswers({
      ...answers,
      [questionId]: {
        selectedOption: option,
        writtenAnswer: undefined
      }
    });
  };

  const handleWriteAnswer = (questionId: string, text: string) => {
    setAnswers({
      ...answers,
      [questionId]: {
        selectedOption: undefined,
        writtenAnswer: text
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activity || !activityId) return;

    // Check if all evaluative questions are answered
    let answeredCount = 0;
    const evaluativeQuestions = activity.answers.filter(q => q.questionType !== 'text_block');
    
    evaluativeQuestions.forEach(q => {
      const ans = answers[q.id];
      if (q.questionType === 'writing') {
        if (ans?.writtenAnswer && ans.writtenAnswer.trim().length > 0) {
          answeredCount++;
        }
      } else {
        if (ans?.selectedOption) {
          answeredCount++;
        }
      }
    });

    if (answeredCount < evaluativeQuestions.length) {
      if (!confirm('Você deixou perguntas sem responder. Tem certeza que deseja enviar a atividade assim mesmo?')) {
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = activity.answers.map(q => {
        const ans = answers[q.id];
        return {
          questionId: q.id,
          selectedOption: q.questionType === 'multiple_choice' ? (ans?.selectedOption || null) : null,
          writtenAnswer: q.questionType === 'writing' ? (ans?.writtenAnswer || null) : null
        };
      });

      const res = await activityService.submitPublicActivity(activityId, payload);
      setSubmittedActivity(res.data);
      toast.success('Atividade enviada com sucesso!');
    } catch {
      toast.error('Erro ao enviar atividade. Tente novamente.');
    }
    setSubmitting(false);
  };

  if (loading) {
    return <div className="page-loading"><span className="loading-spinner" /></div>;
  }

  if (submittedActivity) {
    const isAwaitingCorrection = submittedActivity.status === 'corrigir';

    return (
      <div className="public-quiz-submit-screen">
        <Card variant="elevated" className="result-card animate-scaleIn">
          <span className="success-check-icon">🎉</span>
          
          {isAwaitingCorrection ? (
            <>
              <h2>Respostas Enviadas!</h2>
              <p className="subtext" style={{ marginBottom: '24px' }}>Sua atividade foi entregue e agora está aguardando a correção do professor.</p>
              
              <div style={{ background: 'var(--warning-light)', color: 'var(--warning)', padding: '20px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', margin: '16px 0', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                <span style={{ fontSize: '28px' }}>⏳</span>
                <strong style={{ fontSize: '16px' }}>Status: A Corrigir</strong>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center' }}>
                  O professor corrigirá as questões abertas e atribuirá sua nota final em breve.
                </span>
              </div>
            </>
          ) : (
            <>
              <h2>Atividade Concluída!</h2>
              <p className="subtext">Suas respostas foram enviadas e a sua nota foi gerada.</p>
              
              <div className="grade-box">
                <span className="grade-label">Nota Final</span>
                <span className="grade-value">
                  {submittedActivity.grade?.toFixed(1) ?? '10.0'} / {submittedActivity.maxGrade.toFixed(1)}
                </span>
              </div>
            </>
          )}

          <div style={{ marginTop: '24px', fontSize: '13px', color: 'var(--text-muted)' }}>
            Parabéns pelo esforço! O seu professor já recebeu o seu resultado. 🚀
          </div>
        </Card>
        <div style={{ textAlign: 'center', padding: '24px 0 12px 0', fontSize: '11px', color: 'var(--text-muted)', marginTop: '20px' }}>
          Desenvolvido por <strong style={{ color: 'var(--accent-primary)' }}>Allison Rodrigues</strong>
        </div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="public-quiz-container">
        <Card variant="outlined" className="error-card">
          <h3>Atividade Não Encontrada</h3>
          <p>O link acessado é inválido ou a atividade já foi excluída do sistema.</p>
        </Card>
        <div style={{ textAlign: 'center', padding: '24px 0 12px 0', fontSize: '11px', color: 'var(--text-muted)', marginTop: '20px' }}>
          Desenvolvido por <strong style={{ color: 'var(--accent-primary)' }}>Allison Rodrigues</strong>
        </div>
      </div>
    );
  }

  if (activity.status === 'corrigir' || activity.status === 'completed') {
    const isAwaitingCorrection = activity.status === 'corrigir';
    let questionNumber = 0;
    const totalWeight = activity.answers.filter(x => x.questionType !== 'text_block').reduce((sum, x) => sum + (x.weight || 0), 0);

    return (
      <div className="public-quiz-container animate-fadeIn">
        {/* Cabeçalho do Resultado */}
        <Card variant="elevated" className="quiz-header-card animate-slideDown" style={{ borderLeft: isAwaitingCorrection ? '6px solid var(--warning)' : '6px solid var(--success)' }}>
          <div className="quiz-logo-row">
            <div className="quiz-icon-wrap" style={{ background: isAwaitingCorrection ? 'var(--warning-light)' : 'var(--success-light)', color: isAwaitingCorrection ? 'var(--warning)' : 'var(--success)' }}>
              {isAwaitingCorrection ? <span style={{ fontSize: '24px' }}>⏳</span> : <span style={{ fontSize: '24px' }}>🎉</span>}
            </div>
            <div>
              <h2>Resultado: {activity.title}</h2>
              <p className="quiz-subtext">Aluno(a): <strong>{activity.studentName}</strong></p>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
            <Badge variant={activity.type === 'exam' ? 'danger' : 'success'}>
              {activity.type === 'exam' ? 'Prova' : 'Exercício'}
            </Badge>
            {isAwaitingCorrection ? (
              <Badge variant="warning">Aguardando Correção</Badge>
            ) : (
              <Badge variant="success">Corrigida</Badge>
            )}
            
            {!isAwaitingCorrection && (
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Nota Final:</span>
                <strong style={{ fontSize: '20px', color: 'var(--success)' }}>
                  {activity.grade?.toFixed(1) ?? '10.0'} <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>/ {activity.maxGrade.toFixed(1)}</span>
                </strong>
              </div>
            )}
          </div>
        </Card>

        {/* Caixa explicativa */}
        <Card variant="outlined" style={{ margin: '16px 0', background: 'var(--bg-glass)', display: 'flex', gap: '12px', padding: '14px' }}>
          <span style={{ fontSize: '20px' }}>ℹ️</span>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            {isAwaitingCorrection ? (
              <span>Você já enviou esta atividade! Ela está salva no sistema e o seu professor está corrigindo as questões discursivas. Assim que ele terminar, sua nota final aparecerá aqui neste mesmo link.</span>
            ) : (
              <span>Seu professor corrigiu sua atividade! Veja abaixo a revisão detalhada</span>
            )}
          </div>
        </Card>

        {/* Lista de Questões e Respostas para Revisão do Aluno */}
        <div className="quiz-questions-form" style={{ marginTop: '20px' }}>
          {activity.answers.map((q, idx) => {
            const isTextBlock = q.questionType === 'text_block';
            if (!isTextBlock) {
              questionNumber++;
            }

            return (
              <Card key={q.id} variant="elevated" className={`question-card animate-slideUp ${isTextBlock ? 'text-block-card' : ''}`} style={{ animationDelay: `${(idx + 1) * 0.05}s` }}>
                {isTextBlock ? (
                  <>
                    <h4 className="question-number" style={{ color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                      📖 Texto de Apoio
                    </h4>
                    <p className="question-text" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', margin: '0 0 16px 0', color: 'var(--text-primary)' }}>
                      {q.questionText}
                    </p>
                  </>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1 }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        background: 'var(--accent-primary)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: '13px',
                        flexShrink: 0,
                        boxShadow: '0 2px 4px rgba(var(--accent-primary-rgb), 0.2)'
                      }}>
                        {questionNumber}
                      </div>
                      <p className="question-text" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5', margin: 0, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', flex: 1 }}>
                        <span>{q.questionText}</span>
                        {totalWeight > 0 && (
                          <span style={{ display: 'inline-flex', fontSize: '10px' }}>
                            <Badge variant="primary">
                              Vale {(((q.weight || 1) / totalWeight) * activity.maxGrade).toFixed(1)} pts
                            </Badge>
                          </span>
                        )}
                      </p>
                    </div>

                    {!isAwaitingCorrection && q.questionType === 'multiple_choice' && (
                      <div style={{ flexShrink: 0 }}>
                        <Badge variant={q.selectedOption === q.correctOption ? 'success' : 'danger'}>
                          {q.selectedOption === q.correctOption ? 'Acertou' : 'Errou'}
                        </Badge>
                      </div>
                    )}
                  </div>
                )}

                {isTextBlock ? null : q.questionType === 'multiple_choice' ? (
                  <div className="quiz-options-list">
                    {[
                      { label: 'A', text: q.optionA },
                      { label: 'B', text: q.optionB },
                      { label: 'C', text: q.optionC },
                      { label: 'D', text: q.optionD }
                    ]
                    .filter(opt => !!opt.text)
                    .map(opt => {
                      const wasSelected = q.selectedOption === opt.label;
                      const isCorrect = q.correctOption === opt.label;
                      
                      // Inline styles para garantir visual incrível na revisão
                      let borderStyle = '1px solid var(--border-color)';
                      let backgroundStyle = 'var(--bg-tertiary)';
                      let badgeBg = 'var(--bg-secondary)';
                      let badgeColor = 'var(--text-secondary)';

                      if (!isAwaitingCorrection) {
                        if (isCorrect) {
                          borderStyle = '1px solid #10B981';
                          backgroundStyle = 'rgba(16, 185, 129, 0.08)';
                          badgeBg = '#10B981';
                          badgeColor = '#fff';
                        } else if (wasSelected && !isCorrect) {
                          borderStyle = '1px solid #EF4444';
                          backgroundStyle = 'rgba(239, 68, 68, 0.08)';
                          badgeBg = '#EF4444';
                          badgeColor = '#fff';
                        }
                      } else if (wasSelected) {
                        borderStyle = '1px solid var(--accent-primary)';
                        backgroundStyle = 'var(--accent-primary-light)';
                        badgeBg = 'var(--accent-primary)';
                        badgeColor = '#fff';
                      }

                      return (
                        <div
                          key={opt.label}
                          className="quiz-option-btn-view"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            width: '100%',
                            padding: '12px 16px',
                            background: backgroundStyle,
                            border: borderStyle,
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--text-primary)',
                            fontSize: '14px',
                            marginBottom: '8px'
                          }}
                        >
                          <span
                            className="option-badge"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              background: badgeBg,
                              color: badgeColor,
                              fontWeight: 'bold',
                              fontSize: '13px',
                              flexShrink: 0
                            }}
                          >
                            {opt.label}
                          </span>
                          <span className="option-text" style={{ flexGrow: 1, textAlign: 'left', lineHeight: '1.4' }}>
                            {opt.text}
                          </span>
                          {!isAwaitingCorrection && isCorrect && (
                            <span style={{ fontSize: '12px', color: '#10B981', fontWeight: 600 }}>Gabarito</span>
                          )}
                          {!isAwaitingCorrection && wasSelected && !isCorrect && (
                            <span style={{ fontSize: '12px', color: '#EF4444', fontWeight: 600 }}>Sua resposta</span>
                          )}
                          {!isAwaitingCorrection && wasSelected && isCorrect && (
                            <span style={{ fontSize: '12px', color: '#10B981', fontWeight: 600 }}>Sua resposta (Correta)</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  // Questão Discursiva (Writing)
                  <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', fontSize: '13px', color: 'var(--text-primary)', minHeight: '80px', whiteSpace: 'pre-wrap' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Sua resposta escrita:</span>
                      {q.writtenAnswer || <em style={{ color: 'var(--text-muted)' }}>(Sem resposta enviada)</em>}
                    </div>

                    {isAwaitingCorrection ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--warning)', background: 'var(--warning-light)', padding: '8px 12px', borderRadius: '6px', width: 'fit-content' }}>
                        <span>⏳</span>
                        <strong>Aguardando correção do professor.</strong>
                      </div>
                    ) : (
                      q.evaluationNotes && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                          <div>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Observações do Professor:</span>
                            <div
                              style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}
                              dangerouslySetInnerHTML={{ __html: sanitizeHtml(q.evaluationNotes) }}
                            />
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
        <div style={{ textAlign: 'center', padding: '24px 0 12px 0', fontSize: '11px', color: 'var(--text-muted)', marginTop: '20px' }}>
          Desenvolvido por <strong style={{ color: 'var(--accent-primary)' }}>Allison Rodrigues</strong>
        </div>
      </div>
    );
  }

  return (
    <div className="public-quiz-container">
      <Card variant="elevated" className="quiz-header-card animate-slideDown">
        <div className="quiz-logo-row">
          <div className="quiz-icon-wrap" style={{ background: activity.type === 'exam' ? 'var(--danger-light)' : 'var(--success-light)', color: activity.type === 'exam' ? 'var(--danger)' : 'var(--success)' }}>
            {activity.type === 'exam' ? <MdAssignmentTurnedIn /> : <MdAssignment />}
          </div>
          <div>
            <h2>{activity.title}</h2>
            <p className="quiz-subtext">Aluno: <strong>{activity.studentName}</strong></p>
          </div>
        </div>
        <div className="quiz-header-footer">
          <Badge variant={activity.type === 'exam' ? 'danger' : 'success'}>
            {activity.type === 'exam' ? 'Prova' : 'Exercício'}
          </Badge>
          <span className="quiz-length">
            {activity.answers.filter(q => q.questionType !== 'text_block').length} questões
          </span>
        </div>
      </Card>

      <form onSubmit={handleSubmit} className="quiz-questions-form">
        {(() => {
          let questionNumber = 0;
          const totalWeight = activity.answers.filter(x => x.questionType !== 'text_block').reduce((sum, x) => sum + (x.weight || 0), 0);
          return activity.answers.map((q, idx) => {
            const isTextBlock = q.questionType === 'text_block';
            if (!isTextBlock) {
              questionNumber++;
            }

            return (
              <Card key={q.id} variant="elevated" className={`question-card animate-slideUp ${isTextBlock ? 'text-block-card' : ''}`} style={{ animationDelay: `${(idx + 1) * 0.05}s` }}>
                {isTextBlock ? (
                  <h4 className="question-number" style={{ color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    📖 Texto de Apoio
                  </h4>
                ) : (
                  <h4 className="question-number">Questão {questionNumber}</h4>
                )}
                
                <p className="question-text" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <span>{q.questionText}</span>
                  {!isTextBlock && totalWeight > 0 && (
                    <span style={{ flexShrink: 0, display: 'inline-flex', fontSize: '11px' }}>
                      <Badge variant="primary">
                        Vale {(((q.weight || 1) / totalWeight) * activity.maxGrade).toFixed(1)} pts
                      </Badge>
                    </span>
                  )}
                </p>

                {isTextBlock ? null : q.questionType === 'multiple_choice' ? (
                  <div className="quiz-options-list">
                    {[
                      { label: 'A', text: q.optionA },
                      { label: 'B', text: q.optionB },
                      { label: 'C', text: q.optionC },
                      { label: 'D', text: q.optionD }
                    ]
                    .filter(opt => !!opt.text)
                    .map(opt => {
                      const isSelected = answers[q.id]?.selectedOption === opt.label;
                      return (
                        <button
                          key={opt.label}
                          type="button"
                          className={`quiz-option-btn ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleSelectOption(q.id, opt.label)}
                        >
                          <span className="option-badge">{opt.label}</span>
                          <span className="option-text">{opt.text}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ marginTop: '12px' }}>
                    <textarea
                      className="select-field"
                      placeholder="Escreva sua resposta discursiva aqui..."
                      value={answers[q.id]?.writtenAnswer || ''}
                      onChange={e => handleWriteAnswer(q.id, e.target.value)}
                      rows={5}
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-tertiary)',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'all var(--transition-fast)',
                        resize: 'vertical',
                        fontFamily: 'inherit',
                        height: 'auto',
                        minHeight: '120px'
                      }}
                    />
                  </div>
                )}
              </Card>
            );
          });
        })()}

        <div className="form-submit-row">
          <Button type="submit" size="lg" isLoading={submitting} fullWidth>
            Finalizar e Enviar Atividade
          </Button>
        </div>
      </form>
      <div style={{ textAlign: 'center', padding: '24px 0 12px 0', fontSize: '11px', color: 'var(--text-muted)', marginTop: '20px' }}>
        Desenvolvido por <strong style={{ color: 'var(--accent-primary)' }}>Allison Rodrigues</strong>
      </div>
    </div>
  );
}
