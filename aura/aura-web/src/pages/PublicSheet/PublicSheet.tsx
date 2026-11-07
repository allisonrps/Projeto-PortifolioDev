import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { classSheetService } from '../../services/dataServices';
import type { ClassSheet } from '../../types';
import Card from '../../components/ui/Card';
import Logo from '../../components/ui/Logo';
import { sanitizeHtml } from '../../utils/sanitizeHtml';
import toast from 'react-hot-toast';
import './PublicSheet.css';

export default function PublicSheetPage() {
  const { id } = useParams<{ id: string }>();
  const [sheet, setSheet] = useState<ClassSheet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    classSheetService.getPublic(id)
      .then(res => {
        setSheet(res.data);
      })
      .catch(() => {
        toast.error('Não foi possível carregar esta ficha de aula.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="public-sheet-container">
        <div className="loading-spinner" />
        <p style={{ marginTop: 12, color: 'var(--text-muted)' }}>Carregando ficha pedagógica...</p>
      </div>
    );
  }

  if (!sheet) {
    return (
      <div className="public-sheet-container">
        <Card className="public-sheet-error">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <Logo />
          </div>
          <h2>Ficha não encontrada</h2>
          <p>Esta ficha de aula pode ter sido removida ou o link é inválido.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="public-sheet-container">
      <Card variant="elevated" className="public-sheet-card animate-scaleIn">
        <header className="public-sheet-header">
          <h1 className="public-sheet-title">{sheet.title}</h1>
          <div className="public-sheet-meta">
            <span>Ficha de Aula</span>
            <span className="meta-separator">•</span>
            <span>Atualizada em {new Date(sheet.updatedAt).toLocaleDateString('pt-BR')}</span>
          </div>
        </header>

        <hr style={{ border: 'none', height: '1px', background: 'var(--border-color)', margin: '20px 0' }} />

        {/* Conteúdo Rico Renderizado e Sanitizado contra XSS */}
        <div 
          className="public-sheet-content" 
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(sheet.content) }} 
          style={{ lineHeight: '1.7', color: 'var(--text-primary)', fontSize: '15px' }}
        />
      </Card>

      <footer className="public-sheet-footer" style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', marginTop: '24px' }}>
        Aura - Gestão de Alunos • Desenvolvido por <strong style={{ color: 'var(--accent-primary)' }}>Allison Rodrigues</strong>
      </footer>
    </div>
  );
}
