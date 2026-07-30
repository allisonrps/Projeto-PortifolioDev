import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MdAssignment, MdAssignmentTurnedIn } from 'react-icons/md';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { activityService } from '../../services/activityService';
import type { StudentActivity } from '../../types';
import toast from 'react-hot-toast';
import './PublicQuiz.css';

export default function PublicQuiz() {
  const { activityId } = useParams<{ activityId: string }>();
  const [activity, setActivity] = useState<StudentActivity | null>(null);
  const [answers, setAnswers] = useState<{ [questionId: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittedActivity, setSubmittedActivity] = useState<StudentActivity | null>(null);

  useEffect(() => {
    if (activityId) {
      loadActivity(activityId);
    }
  }, [activityId]);

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
      [questionId]: option
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activity || !activityId) return;

    // Check if all questions are answered
    if (Object.keys(answers).length < activity.answers.length) {
      if (!confirm('Você deixou perguntas sem responder. Tem certeza que deseja enviar a atividade assim mesmo?')) {
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = Object.entries(answers).map(([qId, opt]) => ({
        questionId: qId,
        selectedOption: opt
      }));

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
    return (
      <div className="public-quiz-submit-screen">
        <Card variant="elevated" className="result-card animate-scaleIn">
          <span className="success-check-icon">🎉</span>
          <h2>Atividade Concluída!</h2>
          <p className="subtext">Suas respostas foram enviadas e a sua nota foi gerada.</p>
          
          <div className="grade-box">
            <span className="grade-label">Nota Final</span>
            <span className="grade-value">{submittedActivity.grade?.toFixed(1) ?? '10.0'} / {submittedActivity.maxGrade.toFixed(1)}</span>
          </div>

          <div style={{ marginTop: '24px', fontSize: '13px', color: 'var(--text-muted)' }}>
            Parabéns pelo esforço! O seu professor já recebeu o seu resultado. 🚀
          </div>
        </Card>
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
          <span className="quiz-length">{activity.answers.length} questões</span>
        </div>
      </Card>

      <form onSubmit={handleSubmit} className="quiz-questions-form">
        {activity.answers.map((q, idx) => (
          <Card key={q.id} variant="elevated" className="question-card animate-slideUp" style={{ animationDelay: `${(idx + 1) * 0.05}s` }}>
            <h4 className="question-number">Questão {idx + 1}</h4>
            <p className="question-text">{q.questionText}</p>

            <div className="quiz-options-list">
              {[
                { label: 'A', text: q.optionA },
                { label: 'B', text: q.optionB },
                { label: 'C', text: q.optionC },
                { label: 'D', text: q.optionD }
              ].map(opt => {
                const isSelected = answers[q.id] === opt.label;
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
          </Card>
        ))}

        <div className="form-submit-row">
          <Button type="submit" size="lg" isLoading={submitting} fullWidth>
            Finalizar e Enviar Atividade
          </Button>
        </div>
      </form>
    </div>
  );
}
