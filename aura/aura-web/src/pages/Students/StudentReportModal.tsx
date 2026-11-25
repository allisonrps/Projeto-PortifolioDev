import { useState, useMemo, useRef } from 'react';
import {
  MdDownload, MdPictureAsPdf, MdEditNote, MdFilterAlt
} from 'react-icons/md';
import { format, parseISO, isValid, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { getAbsoluteAvatarUrl } from '../../components/ui/Avatar';
import type { StudentDetail, StudentActivity, ClassSheet, Certificate } from '../../types';
import './StudentReportModal.css';

interface StudentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentDetail;
  studentActivities?: StudentActivity[];
  releasedSheets?: ClassSheet[];
  certificates?: Certificate[];
}

type PeriodType = 'month' | 'year' | 'all' | 'custom';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function StudentReportModal({
  isOpen,
  onClose,
  student,
  studentActivities = [],
  releasedSheets = [],
  certificates = []
}: StudentReportModalProps) {
  const now = new Date();
  const [periodType, setPeriodType] = useState<PeriodType>('month');
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1); // 1 - 12
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [customStartDate, setCustomStartDate] = useState<string>(format(startOfMonth(now), 'yyyy-MM-dd'));
  const [customEndDate, setCustomEndDate] = useState<string>(format(endOfMonth(now), 'yyyy-MM-dd'));
  const [teacherObservations, setTeacherObservations] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const reportContainerRef = useRef<HTMLDivElement>(null);

  // Calcula lista de anos disponíveis (baseado nas aulas e pagamentos do aluno)
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>([now.getFullYear()]);
    if (student.lessons) {
      student.lessons.forEach(l => {
        try {
          const d = parseISO(l.scheduledAt);
          if (isValid(d)) yearsSet.add(d.getFullYear());
        } catch {}
      });
    }
    if (student.payments) {
      student.payments.forEach(p => {
        if (p.year) yearsSet.add(p.year);
      });
    }
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [student, now]);

  // Intervalo de datas calculado
  const { startDate, endDate, periodLabel } = useMemo(() => {
    if (periodType === 'month') {
      const start = new Date(selectedYear, selectedMonth - 1, 1, 0, 0, 0, 0);
      const end = new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999);
      return {
        startDate: start,
        endDate: end,
        periodLabel: `${MONTH_NAMES[selectedMonth - 1]} de ${selectedYear}`
      };
    }

    if (periodType === 'year') {
      const start = new Date(selectedYear, 0, 1, 0, 0, 0, 0);
      const end = new Date(selectedYear, 11, 31, 23, 59, 59, 999);
      return {
        startDate: start,
        endDate: end,
        periodLabel: `Ano de ${selectedYear}`
      };
    }

    if (periodType === 'custom') {
      const s = customStartDate ? parseISO(customStartDate + 'T00:00:00') : new Date(2000, 0, 1);
      const e = customEndDate ? parseISO(customEndDate + 'T23:59:59') : new Date(2099, 11, 31);
      return {
        startDate: isValid(s) ? s : new Date(2000, 0, 1),
        endDate: isValid(e) ? e : new Date(2099, 11, 31),
        periodLabel: `${isValid(s) ? format(s, 'dd/MM/yyyy') : 'Início'} até ${isValid(e) ? format(e, 'dd/MM/yyyy') : 'Fim'}`
      };
    }

    // 'all'
    return {
      startDate: new Date(2000, 0, 1),
      endDate: new Date(2099, 11, 31),
      periodLabel: 'Histórico Completo (Todo o Período)'
    };
  }, [periodType, selectedMonth, selectedYear, customStartDate, customEndDate]);

  // Aulas filtradas no período
  const filteredLessons = useMemo(() => {
    if (!student.lessons) return [];
    return student.lessons
      .filter(l => {
        try {
          const d = parseISO(l.scheduledAt);
          return isValid(d) && d >= startDate && d <= endDate;
        } catch {
          return false;
        }
      })
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  }, [student.lessons, startDate, endDate]);

  // Estatísticas de Aulas e Presença
  const lessonStats = useMemo(() => {
    let completed = 0;
    let cancelled = 0;
    let scheduled = 0;
    let holiday = 0;
    let completedMinutes = 0;

    filteredLessons.forEach(l => {
      const status = (l.status || 'scheduled').toLowerCase();
      if (status === 'completed') {
        completed++;
        completedMinutes += l.durationMinutes || 60;
      } else if (status === 'cancelled') {
        cancelled++;
      } else if (status === 'holiday') {
        holiday++;
      } else {
        scheduled++;
      }
    });

    const evaluatedTotal = completed + cancelled;
    const attendanceRate = evaluatedTotal > 0 ? Math.round((completed / evaluatedTotal) * 100) : 100;
    const hours = (completedMinutes / 60).toFixed(1).replace('.0', '');

    return {
      total: filteredLessons.length,
      completed,
      cancelled,
      scheduled,
      holiday,
      attendanceRate,
      completedHours: hours,
      evaluatedTotal
    };
  }, [filteredLessons]);

  // Atividades e Avaliações no período
  const filteredActivities = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      type: 'exam' | 'exercise';
      date: string;
      grade?: number | null;
      maxGrade: number;
      normalizedGrade?: number | null;
      notes?: string;
    }> = [];

    // studentActivities
    if (studentActivities && studentActivities.length > 0) {
      studentActivities.forEach(a => {
        const dateStr = a.completedAt || a.scheduledAt;
        try {
          const d = parseISO(dateStr);
          if (isValid(d) && d >= startDate && d <= endDate) {
            const norm = a.grade != null && a.maxGrade > 0 ? (a.grade / a.maxGrade) * 10 : null;
            list.push({
              id: a.id,
              title: a.title,
              type: a.type,
              date: dateStr,
              grade: a.grade,
              maxGrade: a.maxGrade || 10,
              normalizedGrade: norm,
              notes: undefined
            });
          }
        } catch {}
      });
    }

    // student.exams (se não incluídos)
    if (student.exams && student.exams.length > 0) {
      student.exams.forEach(ex => {
        try {
          const d = parseISO(ex.scheduledAt);
          if (isValid(d) && d >= startDate && d <= endDate) {
            // Evita duplicata se já está na lista
            if (!list.some(item => item.title === ex.title && item.date === ex.scheduledAt)) {
              const norm = ex.grade != null && ex.maxGrade > 0 ? (ex.grade / ex.maxGrade) * 10 : null;
              list.push({
                id: ex.id,
                title: ex.title,
                type: 'exam',
                date: ex.scheduledAt,
                grade: ex.grade,
                maxGrade: ex.maxGrade || 10,
                normalizedGrade: norm,
                notes: ex.notes
              });
            }
          }
        } catch {}
      });
    }

    // student.exercises
    if (student.exercises && student.exercises.length > 0) {
      student.exercises.forEach(ex => {
        try {
          const d = parseISO(ex.scheduledAt);
          if (isValid(d) && d >= startDate && d <= endDate) {
            if (!list.some(item => item.title === ex.title && item.date === ex.scheduledAt)) {
              const norm = ex.grade != null && ex.maxGrade > 0 ? (ex.grade / ex.maxGrade) * 10 : null;
              list.push({
                id: ex.id,
                title: ex.title,
                type: 'exercise',
                date: ex.scheduledAt,
                grade: ex.grade,
                maxGrade: ex.maxGrade || 10,
                normalizedGrade: norm,
                notes: ex.notes
              });
            }
          }
        } catch {}
      });
    }

    return list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [studentActivities, student.exams, student.exercises, startDate, endDate]);

  // Média de notas no período
  const averageGrade = useMemo(() => {
    const grades = filteredActivities
      .filter(a => a.normalizedGrade != null)
      .map(a => a.normalizedGrade as number);
    if (grades.length === 0) return null;
    const sum = grades.reduce((acc, curr) => acc + curr, 0);
    return (sum / grades.length).toFixed(1);
  }, [filteredActivities]);

  // Mensalidades no período
  const filteredPayments = useMemo(() => {
    if (!student.payments) return [];
    return student.payments.filter(p => {
      if (periodType === 'month') {
        return p.month === selectedMonth && p.year === selectedYear;
      }
      if (periodType === 'year') {
        return p.year === selectedYear;
      }
      if (periodType === 'custom') {
        const paymentDate = new Date(p.year, p.month - 1, 15);
        return paymentDate >= startDate && paymentDate <= endDate;
      }
      return true;
    }).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
  }, [student.payments, periodType, selectedMonth, selectedYear, startDate, endDate]);

  // Certificados no período
  const filteredCertificates = useMemo(() => {
    if (!certificates || certificates.length === 0) return [];
    return certificates.filter(c => {
      try {
        const d = parseISO(c.issueDate);
        return isValid(d) && d >= startDate && d <= endDate;
      } catch {
        return false;
      }
    });
  }, [certificates, startDate, endDate]);

  // Idade calculada
  const studentAge = useMemo(() => {
    if (!student.birthDate) return null;
    try {
      const birth = parseISO(student.birthDate);
      if (!isValid(birth)) return null;
      let age = now.getFullYear() - birth.getFullYear();
      const m = now.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
      return age;
    } catch {
      return null;
    }
  }, [student.birthDate, now]);

  // Data de emissão
  const emissionTimestamp = format(now, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

  // Status de presença badge text e class
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return { label: 'Presença (Concluída)', color: '#16a34a', bg: '#dcfce7' };
      case 'cancelled':
        return { label: 'Falta / Cancelada', color: '#dc2626', bg: '#fee2e2' };
      case 'holiday':
        return { label: 'Feriado', color: '#d97706', bg: '#fef3c7' };
      default:
        return { label: 'Agendada', color: '#4f46e5', bg: '#e0e7ff' };
    }
  };

  // Gerador de Exportação PDF via Print Dialog limpa
  const handleExportPdf = () => {
    setIsExporting(true);

    const printContent = document.getElementById('student-printable-report');
    if (!printContent) {
      setIsExporting(false);
      return;
    }

    const printWindow = window.open('', '_blank', 'width=900,height=800');
    if (!printWindow) {
      // Fallback: imprime direto se popup bloqueada
      window.print();
      setIsExporting(false);
      return;
    }

    const studentPhotoHtml = student.photoUrl
      ? `<img src="${getAbsoluteAvatarUrl(student.photoUrl)}" alt="${student.name}" style="width: 76px; height: 76px; border-radius: 50%; object-fit: cover; border: 2px solid #6366f1;" />`
      : `<div style="width: 76px; height: 76px; border-radius: 50%; background: #e0e7ff; color: #4338ca; display: flex; align-items: center; justify-content: center; font-size: 26px; font-weight: bold; border: 2px solid #c7d2fe;">${student.name.charAt(0).toUpperCase()}</div>`;

    const docHtml = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="utf-8">
        <title>Relatório - ${student.name} - ${periodLabel}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm 14mm;
          }
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #1e293b;
            background: #fff;
            margin: 0;
            padding: 10px;
            font-size: 13px;
            line-height: 1.45;
          }
          .report-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2px solid #4f46e5;
            padding-bottom: 12px;
            margin-bottom: 16px;
          }
          .report-logo-text {
            font-size: 22px;
            font-weight: 800;
            color: #4f46e5;
            letter-spacing: -0.5px;
          }
          .report-sub {
            font-size: 11px;
            color: #64748b;
            margin-top: 2px;
          }
          .report-meta-right {
            text-align: right;
            font-size: 11px;
            color: #475569;
          }
          .student-card {
            display: flex;
            gap: 16px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 14px;
            margin-bottom: 16px;
          }
          .student-details {
            flex: 1;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px 14px;
          }
          .student-field-label {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            color: #64748b;
          }
          .student-field-value {
            font-size: 13px;
            font-weight: 600;
            color: #0f172a;
          }
          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-bottom: 18px;
          }
          .metric-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 10px 12px;
            text-align: center;
          }
          .metric-val {
            font-size: 20px;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 2px;
          }
          .metric-lbl {
            font-size: 11px;
            font-weight: 600;
            color: #64748b;
          }
          h3.section-title {
            font-size: 14px;
            font-weight: 700;
            color: #1e293b;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 6px;
            margin: 18px 0 10px 0;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11.5px;
            margin-bottom: 14px;
          }
          th {
            background: #f1f5f9;
            color: #334155;
            font-weight: 700;
            text-align: left;
            padding: 8px 10px;
            border: 1px solid #cbd5e1;
          }
          td {
            padding: 7px 10px;
            border: 1px solid #e2e8f0;
            color: #1e293b;
          }
          tr:nth-child(even) {
            background: #f8fafc;
          }
          .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 700;
          }
          .obs-box {
            background: #fffbeb;
            border: 1px solid #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 10px 14px;
            border-radius: 6px;
            font-size: 12px;
            margin-bottom: 20px;
            white-space: pre-wrap;
          }
          .signature-section {
            margin-top: 36px;
            display: flex;
            justify-content: space-between;
            page-break-inside: avoid;
          }
          .signature-line {
            width: 240px;
            border-top: 1px solid #475569;
            text-align: center;
            padding-top: 6px;
            font-size: 11px;
            color: #475569;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="report-header">
          <div>
            <div class="report-logo-text">AURA • GESTÃO PEDAGÓGICA</div>
            <div class="report-sub">Relatório de Frequência e Desempenho do Aluno</div>
          </div>
          <div class="report-meta-right">
            <div><strong>Período:</strong> ${periodLabel}</div>
            <div><strong>Emissão:</strong> ${emissionTimestamp}</div>
          </div>
        </div>

        <div class="student-card">
          <div>
            ${studentPhotoHtml}
          </div>
          <div class="student-details">
            <div>
              <div class="student-field-label">Aluno</div>
              <div class="student-field-value" style="font-size: 15px;">${student.name}</div>
            </div>
            <div>
              <div class="student-field-label">Disciplina / Nível</div>
              <div class="student-field-value">${student.subjectName || 'Geral'}${student.levelName ? ` • ${student.levelName}` : ''}</div>
            </div>
            <div>
              <div class="student-field-label">Situação Cadastral</div>
              <div class="student-field-value">${student.isActive ? 'Ativo' : 'Arquivado'}</div>
            </div>
            <div>
              <div class="student-field-label">Telefone / WhatsApp</div>
              <div class="student-field-value">${student.phone || 'Não informado'}</div>
            </div>
            <div>
              <div class="student-field-label">Idade / Nasc.</div>
              <div class="student-field-value">${studentAge != null ? `${studentAge} anos` : 'Não informada'}${student.birthDate ? ` (${format(parseISO(student.birthDate), 'dd/MM/yyyy')})` : ''}</div>
            </div>
            <div>
              <div class="student-field-label">Responsável</div>
              <div class="student-field-value">${student.guardianName ? `${student.guardianName}${student.guardianPhone ? ` (${student.guardianPhone})` : ''}` : 'Próprio aluno'}</div>
            </div>
          </div>
        </div>

        <div class="metrics-grid">
          <div class="metric-box">
            <div class="metric-val" style="color: #16a34a;">${lessonStats.attendanceRate}%</div>
            <div class="metric-lbl">Taxa de Presença</div>
          </div>
          <div class="metric-box">
            <div class="metric-val" style="color: #4f46e5;">${lessonStats.completed} / ${lessonStats.evaluatedTotal || lessonStats.total}</div>
            <div class="metric-lbl">Aulas Concluídas</div>
          </div>
          <div class="metric-box">
            <div class="metric-val" style="color: #0284c7;">${lessonStats.completedHours}h</div>
            <div class="metric-lbl">Carga Horária Ministrada</div>
          </div>
          <div class="metric-box">
            <div class="metric-val" style="color: #d97706;">${averageGrade != null ? `${averageGrade} / 10` : '—'}</div>
            <div class="metric-lbl">Média de Avaliações</div>
          </div>
        </div>

        <h3 class="section-title">
          <span>Histórico de Aulas no Período (${filteredLessons.length})</span>
        </h3>
        ${filteredLessons.length > 0 ? `
          <table>
            <thead>
              <tr>
                <th style="width: 110px;">Data & Hora</th>
                <th style="width: 70px;">Duração</th>
                <th>Conteúdo Abordado / Observações</th>
                <th style="width: 140px; text-align: center;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredLessons.map(l => {
                const badge = getStatusBadge(l.status);
                const d = parseISO(l.scheduledAt);
                const dateFmt = isValid(d) ? format(d, 'dd/MM/yyyy • HH:mm') : l.scheduledAt;
                return `
                  <tr>
                    <td><strong>${dateFmt}</strong></td>
                    <td>${l.durationMinutes || 60} min</td>
                    <td>${l.notes || l.title || '<span style="color:#94a3b8; font-style: italic;">Aula realizada</span>'}</td>
                    <td style="text-align: center;">
                      <span class="badge" style="color: ${badge.color}; background: ${badge.bg};">
                        ${badge.label}
                      </span>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        ` : `
          <p style="color: #64748b; font-style: italic; margin-bottom: 16px;">Nenhuma aula registrada neste período.</p>
        `}

        ${filteredActivities.length > 0 ? `
          <h3 class="section-title">
            <span>Avaliações & Exercícios no Período (${filteredActivities.length})</span>
          </h3>
          <table>
            <thead>
              <tr>
                <th>Título da Atividade</th>
                <th style="width: 90px; text-align: center;">Tipo</th>
                <th style="width: 110px;">Data</th>
                <th style="width: 90px; text-align: center;">Nota</th>
                <th style="width: 90px; text-align: center;">Aprov. (%)</th>
              </tr>
            </thead>
            <tbody>
              ${filteredActivities.map(a => {
                const d = parseISO(a.date);
                const dateFmt = isValid(d) ? format(d, 'dd/MM/yyyy') : a.date;
                const perc = a.grade != null && a.maxGrade > 0 ? Math.round((a.grade / a.maxGrade) * 100) : null;
                return `
                  <tr>
                    <td><strong>${a.title}</strong>${a.notes ? `<div style="font-size: 10.5px; color: #64748b;">${a.notes}</div>` : ''}</td>
                    <td style="text-align: center; text-transform: capitalize;">${a.type === 'exam' ? 'Prova' : 'Exercício'}</td>
                    <td>${dateFmt}</td>
                    <td style="text-align: center; font-weight: 700; color: #1e293b;">${a.grade != null ? `${a.grade} / ${a.maxGrade}` : 'Pendente'}</td>
                    <td style="text-align: center; font-weight: 700; color: ${perc != null && perc >= 70 ? '#16a34a' : '#ea580c'};">${perc != null ? `${perc}%` : '—'}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        ` : ''}

        ${filteredPayments.length > 0 ? `
          <h3 class="section-title">
            <span>Mensalidades no Período (${filteredPayments.length})</span>
          </h3>
          <table>
            <thead>
              <tr>
                <th>Referência</th>
                <th style="width: 110px;">Valor</th>
                <th style="width: 120px; text-align: center;">Situação</th>
                <th style="width: 130px;">Data de Pagamento</th>
              </tr>
            </thead>
            <tbody>
              ${filteredPayments.map(p => {
                const paidDateFmt = p.paidAt ? format(parseISO(p.paidAt), 'dd/MM/yyyy') : '—';
                return `
                  <tr>
                    <td><strong>${MONTH_NAMES[p.month - 1]} / ${p.year}</strong></td>
                    <td>R$ ${p.amount.toFixed(2)}</td>
                    <td style="text-align: center;">
                      <span class="badge" style="color: ${p.isPaid ? '#16a34a' : '#dc2626'}; background: ${p.isPaid ? '#dcfce7' : '#fee2e2'};">
                        ${p.isPaid ? 'Pago' : 'Pendente'}
                      </span>
                    </td>
                    <td>${paidDateFmt}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        ` : ''}

        ${filteredCertificates.length > 0 ? `
          <h3 class="section-title">
            <span>Certificados Emitidos no Período (${filteredCertificates.length})</span>
          </h3>
          <table>
            <thead>
              <tr>
                <th>Título do Certificado</th>
                <th style="width: 140px;">Data de Emissão</th>
                <th>Descrição / Conquista</th>
              </tr>
            </thead>
            <tbody>
              ${filteredCertificates.map(c => `
                <tr>
                  <td><strong>${c.title}</strong></td>
                  <td>${format(parseISO(c.issueDate), 'dd/MM/yyyy')}</td>
                  <td>${c.description || 'Conclusão de módulo pedagógico'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        ${releasedSheets.length > 0 ? `
          <h3 class="section-title">
            <span>Fichas Pedagógicas e Materiais Didáticos (${releasedSheets.length})</span>
          </h3>
          <table>
            <thead>
              <tr>
                <th>Título do Material / Ficha</th>
                <th style="width: 160px;">Nível / Categoria</th>
              </tr>
            </thead>
            <tbody>
              ${releasedSheets.map(s => `
                <tr>
                  <td><strong>${s.title}</strong></td>
                  <td>${s.levelName || student.levelName || 'Geral'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        ${teacherObservations.trim() ? `
          <h3 class="section-title">Parecer Pedagógico do Professor</h3>
          <div class="obs-box">
            ${teacherObservations}
          </div>
        ` : ''}

        <div class="signature-section">
          <div class="signature-line">
            <strong>Professor(a) Responsável</strong><br />
            Aura Gestão Pedagógica
          </div>
          <div class="signature-line">
            <strong>Responsável / Aluno</strong><br />
            Data: _____/_____/_________
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(docHtml);
    printWindow.document.close();
    setIsExporting(false);
  };

  // Gerador de Exportação DOC (.doc) compatível com Word e LibreOffice
  const handleExportDoc = () => {
    setIsExporting(true);

    const docContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Relatório - ${student.name}</title>
        <style>
          body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #1e293b; }
          h1 { color: #4338ca; font-size: 18pt; margin-bottom: 2pt; }
          h2 { color: #1e293b; font-size: 14pt; margin-top: 14pt; border-bottom: 1.5pt solid #cbd5e1; padding-bottom: 3pt; }
          .meta { color: #64748b; font-size: 10pt; margin-bottom: 12pt; }
          table { width: 100%; border-collapse: collapse; margin-top: 8pt; margin-bottom: 14pt; font-size: 10pt; }
          th { background-color: #f1f5f9; color: #334155; font-weight: bold; border: 1pt solid #94a3b8; padding: 6pt; text-align: left; }
          td { border: 1pt solid #cbd5e1; padding: 5pt; }
          .metric-cell { text-align: center; background-color: #f8fafc; font-weight: bold; }
          .footer-sig { margin-top: 35pt; font-size: 10pt; }
        </style>
      </head>
      <body>
        <h1>AURA • GESTÃO PEDAGÓGICA</h1>
        <div class='meta'>
          <strong>Relatório de Frequência e Desempenho do Aluno</strong><br/>
          <strong>Período:</strong> ${periodLabel} | <strong>Emitido em:</strong> ${emissionTimestamp}
        </div>

        <h2>DADOS DO ALUNO</h2>
        <table>
          <tr>
            <td style='width: 25%; font-weight: bold; background: #f8fafc;'>Nome do Aluno:</td>
            <td style='width: 75%; font-weight: bold;'>${student.name}</td>
          </tr>
          <tr>
            <td style='font-weight: bold; background: #f8fafc;'>Disciplina / Nível:</td>
            <td>${student.subjectName || 'Geral'}${student.levelName ? ` • ${student.levelName}` : ''}</td>
          </tr>
          <tr>
            <td style='font-weight: bold; background: #f8fafc;'>Telefone / WhatsApp:</td>
            <td>${student.phone || 'Não informado'}</td>
          </tr>
          <tr>
            <td style='font-weight: bold; background: #f8fafc;'>Idade / Nascimento:</td>
            <td>${studentAge != null ? `${studentAge} anos` : 'Não informada'}${student.birthDate ? ` (${format(parseISO(student.birthDate), 'dd/MM/yyyy')})` : ''}</td>
          </tr>
          <tr>
            <td style='font-weight: bold; background: #f8fafc;'>Responsável:</td>
            <td>${student.guardianName ? `${student.guardianName}${student.guardianPhone ? ` (${student.guardianPhone})` : ''}` : 'Próprio aluno'}</td>
          </tr>
          <tr>
            <td style='font-weight: bold; background: #f8fafc;'>Situação Cadastral:</td>
            <td>${student.isActive ? 'Ativo' : 'Arquivado'}</td>
          </tr>
        </table>

        <h2>RESUMO DE INDICADORES NO PERÍODO</h2>
        <table>
          <tr>
            <th>Taxa de Presença</th>
            <th>Aulas Concluídas</th>
            <th>Carga Horária Ministrada</th>
            <th>Média de Avaliações</th>
          </tr>
          <tr>
            <td class='metric-cell' style='color: #16a34a; font-size: 13pt;'>${lessonStats.attendanceRate}%</td>
            <td class='metric-cell' style='font-size: 13pt;'>${lessonStats.completed} / ${lessonStats.evaluatedTotal || lessonStats.total}</td>
            <td class='metric-cell' style='font-size: 13pt;'>${lessonStats.completedHours}h</td>
            <td class='metric-cell' style='color: #d97706; font-size: 13pt;'>${averageGrade != null ? `${averageGrade} / 10` : '—'}</td>
          </tr>
        </table>

        <h2>AULAS MINISTRADAS NO PERÍODO (${filteredLessons.length})</h2>
        ${filteredLessons.length > 0 ? `
          <table>
            <thead>
              <tr>
                <th style='width: 110pt;'>Data / Horário</th>
                <th style='width: 60pt;'>Duração</th>
                <th>Conteúdo / Anotações Pedagógicas</th>
                <th style='width: 90pt;'>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredLessons.map(l => {
                const badge = getStatusBadge(l.status);
                const d = parseISO(l.scheduledAt);
                const dateFmt = isValid(d) ? format(d, 'dd/MM/yyyy HH:mm') : l.scheduledAt;
                return `
                  <tr>
                    <td><strong>${dateFmt}</strong></td>
                    <td>${l.durationMinutes || 60} min</td>
                    <td>${l.notes || l.title || 'Aula realizada'}</td>
                    <td>${badge.label}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        ` : `<p>Nenhuma aula registrada neste intervalo.</p>`}

        ${filteredActivities.length > 0 ? `
          <h2>AVALIAÇÕES & EXERCÍCIOS NO PERÍODO (${filteredActivities.length})</h2>
          <table>
            <thead>
              <tr>
                <th>Título</th>
                <th style='width: 80pt;'>Tipo</th>
                <th style='width: 90pt;'>Data</th>
                <th style='width: 70pt;'>Nota</th>
                <th style='width: 70pt;'>Aproveitamento</th>
              </tr>
            </thead>
            <tbody>
              ${filteredActivities.map(a => {
                const d = parseISO(a.date);
                const dateFmt = isValid(d) ? format(d, 'dd/MM/yyyy') : a.date;
                const perc = a.grade != null && a.maxGrade > 0 ? Math.round((a.grade / a.maxGrade) * 100) : null;
                return `
                  <tr>
                    <td><strong>${a.title}</strong></td>
                    <td>${a.type === 'exam' ? 'Prova' : 'Exercício'}</td>
                    <td>${dateFmt}</td>
                    <td>${a.grade != null ? `${a.grade} / ${a.maxGrade}` : '—'}</td>
                    <td>${perc != null ? `${perc}%` : '—'}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        ` : ''}

        ${filteredPayments.length > 0 ? `
          <h2>MENSALIDADES NO PERÍODO (${filteredPayments.length})</h2>
          <table>
            <thead>
              <tr>
                <th>Mês / Ano</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Data Pagamento</th>
              </tr>
            </thead>
            <tbody>
              ${filteredPayments.map(p => `
                <tr>
                  <td>${MONTH_NAMES[p.month - 1]} / ${p.year}</td>
                  <td>R$ ${p.amount.toFixed(2)}</td>
                  <td>${p.isPaid ? 'Pago' : 'Pendente'}</td>
                  <td>${p.paidAt ? format(parseISO(p.paidAt), 'dd/MM/yyyy') : '—'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        ${filteredCertificates.length > 0 ? `
          <h2>CERTIFICADOS EMITIDOS NO PERÍODO (${filteredCertificates.length})</h2>
          <table>
            <thead>
              <tr>
                <th>Título do Certificado</th>
                <th>Data de Emissão</th>
                <th>Descrição / Conquista</th>
              </tr>
            </thead>
            <tbody>
              ${filteredCertificates.map(c => `
                <tr>
                  <td><strong>${c.title}</strong></td>
                  <td>${format(parseISO(c.issueDate), 'dd/MM/yyyy')}</td>
                  <td>${c.description || 'Conclusão de módulo pedagógico'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        ${releasedSheets.length > 0 ? `
          <h2>FICHAS PEDAGÓGICAS E MATERIAIS (${releasedSheets.length})</h2>
          <table>
            <thead>
              <tr>
                <th>Título do Material / Ficha</th>
                <th>Nível / Categoria</th>
              </tr>
            </thead>
            <tbody>
              ${releasedSheets.map(s => `
                <tr>
                  <td><strong>${s.title}</strong></td>
                  <td>${s.levelName || student.levelName || 'Geral'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        ${teacherObservations.trim() ? `
          <h2>PARECER PEDAGÓGICO DO PROFESSOR</h2>
          <div style='background: #fffbeb; border: 1pt solid #fde68a; padding: 10pt; font-size: 10pt;'>
            ${teacherObservations.replace(/\n/g, '<br/>')}
          </div>
        ` : ''}

        <br/><br/>
        <table style='width: 100%; border: none; margin-top: 30pt;'>
          <tr>
            <td style='border: none; text-align: center; width: 45%;'>
              ___________________________________________<br/>
              <strong>Professor(a) Responsável</strong><br/>
              Aura Gestão Pedagógica
            </td>
            <td style='border: none; width: 10%;'></td>
            <td style='border: none; text-align: center; width: 45%;'>
              ___________________________________________<br/>
              <strong>Responsável / Aluno</strong><br/>
              Data: _____/_____/_________
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([docContent], { type: 'application/msword;charset=utf-8' });
    const sanitizedStudentName = student.name.replace(/[^a-zA-Z0-9]/g, '_');
    const sanitizedPeriod = periodLabel.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `Relatorio_${sanitizedStudentName}_${sanitizedPeriod}.doc`;

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setIsExporting(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Relatório de Frequência e Desempenho do Aluno"
      size="xl"
    >
      <div className="report-modal-wrapper">
        {/* Barra superior de controles e filtros */}
        <div className="report-controls-panel">
          <div className="report-period-selector">
            <span className="control-label"><MdFilterAlt /> Período do Relatório:</span>
            <div className="period-pills-row">
              <button
                type="button"
                className={`period-pill ${periodType === 'month' ? 'active' : ''}`}
                onClick={() => setPeriodType('month')}
              >
                Mês Específico
              </button>
              <button
                type="button"
                className={`period-pill ${periodType === 'year' ? 'active' : ''}`}
                onClick={() => setPeriodType('year')}
              >
                Ano Todo
              </button>
              <button
                type="button"
                className={`period-pill ${periodType === 'all' ? 'active' : ''}`}
                onClick={() => setPeriodType('all')}
              >
                Todo o Histórico
              </button>
              <button
                type="button"
                className={`period-pill ${periodType === 'custom' ? 'active' : ''}`}
                onClick={() => setPeriodType('custom')}
              >
                Personalizado
              </button>
            </div>
          </div>

          {/* Sub-controles dependendo do período */}
          <div className="period-subcontrols-row">
            {periodType === 'month' && (
              <>
                <div className="select-group">
                  <label>Mês:</label>
                  <select
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(Number(e.target.value))}
                    className="report-select"
                  >
                    {MONTH_NAMES.map((name, idx) => (
                      <option key={idx} value={idx + 1}>{name}</option>
                    ))}
                  </select>
                </div>
                <div className="select-group">
                  <label>Ano:</label>
                  <select
                    value={selectedYear}
                    onChange={e => setSelectedYear(Number(e.target.value))}
                    className="report-select"
                  >
                    {availableYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {periodType === 'year' && (
              <div className="select-group">
                <label>Ano:</label>
                <select
                  value={selectedYear}
                  onChange={e => setSelectedYear(Number(e.target.value))}
                  className="report-select"
                >
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            )}

            {periodType === 'custom' && (
              <>
                <div className="select-group">
                  <label>Data Início:</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={e => setCustomStartDate(e.target.value)}
                    className="report-date-input"
                  />
                </div>
                <div className="select-group">
                  <label>Data Fim:</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={e => setCustomEndDate(e.target.value)}
                    className="report-date-input"
                  />
                </div>
              </>
            )}

            {/* Ações de exportação rápidas com 1 clique */}
            <div className="report-action-buttons">
              <Button
                variant="primary"
                onClick={handleExportPdf}
                disabled={isExporting}
                className="btn-export-pdf"
              >
                <MdPictureAsPdf style={{ marginRight: '6px', fontSize: '18px' }} />
                Exportar PDF
              </Button>
              <Button
                variant="secondary"
                onClick={handleExportDoc}
                disabled={isExporting}
                className="btn-export-doc"
              >
                <MdDownload style={{ marginRight: '6px', fontSize: '18px' }} />
                Exportar Word (.doc)
              </Button>
            </div>
          </div>
        </div>

        {/* Campo opcional para o professor adicionar parecer/observação antes de exportar */}
        <div className="report-teacher-notes-accordion">
          <label className="teacher-notes-label">
            <MdEditNote style={{ fontSize: '18px', marginRight: '4px' }} />
            Parecer Pedagógico / Observações do Professor (opcional):
          </label>
          <textarea
            value={teacherObservations}
            onChange={e => setTeacherObservations(e.target.value)}
            placeholder="Digite considerações sobre o desenvolvimento, evolução técnica, pontualidade ou metas para o próximo período..."
            rows={2}
            className="teacher-notes-textarea"
          />
        </div>

        {/* Visualização Prévia do Relatório em Folha Estilo Documento */}
        <div className="report-preview-container">
          <div className="report-preview-badge">
            <span>Pré-visualização do Documento (A4)</span>
          </div>

          <div id="student-printable-report" ref={reportContainerRef} className="report-document-sheet">
            {/* Cabeçalho Oficial */}
            <div className="doc-header">
              <div className="doc-brand">
                <span className="doc-brand-title">AURA • GESTÃO PEDAGÓGICA</span>
                <span className="doc-brand-sub">Relatório de Frequência e Desempenho do Aluno</span>
              </div>
              <div className="doc-meta-info">
                <div className="doc-meta-item">
                  <span className="doc-meta-label">Período de Apuração:</span>
                  <span className="doc-meta-val">{periodLabel}</span>
                </div>
                <div className="doc-meta-item">
                  <span className="doc-meta-label">Data de Emissão:</span>
                  <span className="doc-meta-val">{emissionTimestamp}</span>
                </div>
              </div>
            </div>

            {/* Cartão de Identificação do Aluno */}
            <div className="doc-student-profile">
              <div className="doc-student-avatar-wrap">
                {student.photoUrl ? (
                  <img
                    src={getAbsoluteAvatarUrl(student.photoUrl)}
                    alt={student.name}
                    className="doc-student-photo"
                  />
                ) : (
                  <div className="doc-student-photo-placeholder">
                    {student.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="doc-student-data-grid">
                <div className="doc-field">
                  <span className="doc-field-label">Aluno</span>
                  <span className="doc-field-value student-highlight-name">{student.name}</span>
                </div>
                <div className="doc-field">
                  <span className="doc-field-label">Matéria / Nível</span>
                  <span className="doc-field-value">
                    {student.subjectName || 'Geral'}{student.levelName ? ` • ${student.levelName}` : ''}
                  </span>
                </div>
                <div className="doc-field">
                  <span className="doc-field-label">Situação</span>
                  <span className="doc-field-value">
                    <span className={`doc-status-pill ${student.isActive ? 'active' : 'inactive'}`}>
                      {student.isActive ? 'Matrícula Ativa' : 'Arquivado'}
                    </span>
                  </span>
                </div>
                <div className="doc-field">
                  <span className="doc-field-label">Telefone / WhatsApp</span>
                  <span className="doc-field-value">{student.phone || 'Não informado'}</span>
                </div>
                <div className="doc-field">
                  <span className="doc-field-label">Idade / Nasc.</span>
                  <span className="doc-field-value">
                    {studentAge != null ? `${studentAge} anos` : 'Não informada'}
                    {student.birthDate ? ` (${format(parseISO(student.birthDate), 'dd/MM/yyyy')})` : ''}
                  </span>
                </div>
                <div className="doc-field">
                  <span className="doc-field-label">Responsável</span>
                  <span className="doc-field-value">
                    {student.guardianName ? `${student.guardianName}${student.guardianPhone ? ` (${student.guardianPhone})` : ''}` : 'Próprio aluno'}
                  </span>
                </div>
              </div>
            </div>

            {/* Indicadores Chave no Período */}
            <div className="doc-metrics-row">
              <div className="doc-metric-card att-rate">
                <span className="metric-number">{lessonStats.attendanceRate}%</span>
                <span className="metric-text">Taxa de Presença</span>
                <span className="metric-sub">{lessonStats.completed} presenças de {lessonStats.evaluatedTotal || lessonStats.total} aulas</span>
              </div>
              <div className="doc-metric-card hours">
                <span className="metric-number">{lessonStats.completedHours}h</span>
                <span className="metric-text">Carga Horária</span>
                <span className="metric-sub">Total de aulas ministradas</span>
              </div>
              <div className="doc-metric-card absences">
                <span className="metric-number">{lessonStats.cancelled}</span>
                <span className="metric-text">Faltas / Canceladas</span>
                <span className="metric-sub">{lessonStats.holiday} feriados no período</span>
              </div>
              <div className="doc-metric-card grade">
                <span className="metric-number">{averageGrade != null ? averageGrade : '—'}</span>
                <span className="metric-text">Média de Avaliações</span>
                <span className="metric-sub">{filteredActivities.length} atividades avaliadas</span>
              </div>
            </div>

            {/* Seção 1: Resumo Pedagógico das Aulas */}
            <div className="doc-section">
              <h4 className="doc-section-title">
                <span>Histórico de Aulas Ministradas ({filteredLessons.length})</span>
              </h4>
              {filteredLessons.length > 0 ? (
                <table className="doc-table">
                  <thead>
                    <tr>
                      <th style={{ width: '130px' }}>Data & Horário</th>
                      <th style={{ width: '70px' }}>Duração</th>
                      <th>Conteúdo Abordado / Observações</th>
                      <th style={{ width: '130px', textAlign: 'center' }}>Situação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLessons.map(l => {
                      const badge = getStatusBadge(l.status);
                      const d = parseISO(l.scheduledAt);
                      const dateFmt = isValid(d) ? format(d, 'dd/MM/yyyy • HH:mm') : l.scheduledAt;
                      return (
                        <tr key={l.id}>
                          <td><strong>{dateFmt}</strong></td>
                          <td>{l.durationMinutes || 60} min</td>
                          <td>{l.notes || l.title || <span className="doc-empty-cell">Aula ministrada normalmente</span>}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span
                              className="doc-table-badge"
                              style={{ color: badge.color, backgroundColor: badge.bg }}
                            >
                              {badge.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="doc-empty-box">Nenhuma aula registrada neste período.</div>
              )}
            </div>

            {/* Seção 2: Avaliações e Exercícios */}
            {filteredActivities.length > 0 && (
              <div className="doc-section">
                <h4 className="doc-section-title">
                  <span>Avaliações & Exercícios no Período ({filteredActivities.length})</span>
                </h4>
                <table className="doc-table">
                  <thead>
                    <tr>
                      <th>Título da Atividade</th>
                      <th style={{ width: '90px', textAlign: 'center' }}>Tipo</th>
                      <th style={{ width: '110px' }}>Data</th>
                      <th style={{ width: '90px', textAlign: 'center' }}>Nota</th>
                      <th style={{ width: '90px', textAlign: 'center' }}>Aproveitamento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredActivities.map(a => {
                      const d = parseISO(a.date);
                      const dateFmt = isValid(d) ? format(d, 'dd/MM/yyyy') : a.date;
                      const perc = a.grade != null && a.maxGrade > 0 ? Math.round((a.grade / a.maxGrade) * 100) : null;
                      return (
                        <tr key={a.id}>
                          <td>
                            <strong>{a.title}</strong>
                            {a.notes && <div className="doc-table-notes">{a.notes}</div>}
                          </td>
                          <td style={{ textAlign: 'center', textTransform: 'capitalize' }}>
                            {a.type === 'exam' ? 'Prova' : 'Exercício'}
                          </td>
                          <td>{dateFmt}</td>
                          <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                            {a.grade != null ? `${a.grade} / ${a.maxGrade}` : '—'}
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 'bold', color: perc != null && perc >= 70 ? '#16a34a' : '#ea580c' }}>
                            {perc != null ? `${perc}%` : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Seção 3: Situação Financeira no Período */}
            {filteredPayments.length > 0 && (
              <div className="doc-section">
                <h4 className="doc-section-title">
                  <span>Mensalidades no Período ({filteredPayments.length})</span>
                </h4>
                <table className="doc-table">
                  <thead>
                    <tr>
                      <th>Referência</th>
                      <th style={{ width: '120px' }}>Valor</th>
                      <th style={{ width: '120px', textAlign: 'center' }}>Situação</th>
                      <th style={{ width: '130px' }}>Data de Pagamento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map(p => {
                      const paidDateFmt = p.paidAt ? format(parseISO(p.paidAt), 'dd/MM/yyyy') : '—';
                      return (
                        <tr key={p.id}>
                          <td><strong>{MONTH_NAMES[p.month - 1]} de {p.year}</strong></td>
                          <td>R$ {p.amount.toFixed(2)}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span
                              className="doc-table-badge"
                              style={{
                                color: p.isPaid ? '#16a34a' : '#dc2626',
                                backgroundColor: p.isPaid ? '#dcfce7' : '#fee2e2'
                              }}
                            >
                              {p.isPaid ? 'Pago' : 'Pendente'}
                            </span>
                          </td>
                          <td>{paidDateFmt}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Seção 4: Certificados Emitidos */}
            {filteredCertificates.length > 0 && (
              <div className="doc-section">
                <h4 className="doc-section-title">
                  <span>Certificados Emitidos no Período ({filteredCertificates.length})</span>
                </h4>
                <table className="doc-table">
                  <thead>
                    <tr>
                      <th>Título do Certificado</th>
                      <th style={{ width: '140px' }}>Data de Emissão</th>
                      <th>Descrição / Conquista</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCertificates.map(c => (
                      <tr key={c.id}>
                        <td><strong>{c.title}</strong></td>
                        <td>{format(parseISO(c.issueDate), 'dd/MM/yyyy')}</td>
                        <td>{c.description || 'Conclusão de módulo pedagógico'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Seção 5: Fichas Pedagógicas e Materiais Liberados */}
            {releasedSheets.length > 0 && (
              <div className="doc-section">
                <h4 className="doc-section-title">
                  <span>Fichas Pedagógicas e Materiais Didáticos ({releasedSheets.length})</span>
                </h4>
                <table className="doc-table">
                  <thead>
                    <tr>
                      <th>Título do Material / Ficha</th>
                      <th style={{ width: '160px' }}>Nível / Categoria</th>
                    </tr>
                  </thead>
                  <tbody>
                    {releasedSheets.map(s => (
                      <tr key={s.id}>
                        <td><strong>{s.title}</strong></td>
                        <td>{s.levelName || student.levelName || 'Geral'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Parecer do Professor */}
            {teacherObservations.trim() && (
              <div className="doc-section">
                <h4 className="doc-section-title">Parecer Pedagógico do Professor</h4>
                <div className="doc-teacher-notes-view">
                  {teacherObservations}
                </div>
              </div>
            )}

            {/* Assinaturas */}
            <div className="doc-signatures-row">
              <div className="doc-signature-block">
                <div className="doc-signature-line" />
                <span className="doc-signer-title">Professor(a) Responsável</span>
                <span className="doc-signer-sub">Aura Gestão Pedagógica</span>
              </div>
              <div className="doc-signature-block">
                <div className="doc-signature-line" />
                <span className="doc-signer-title">Responsável / Aluno</span>
                <span className="doc-signer-sub">Data: _____ / _____ / _________</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
