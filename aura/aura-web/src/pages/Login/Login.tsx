import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdEmail, MdLock, MdPerson } from 'react-icons/md';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Logo from '../../components/ui/Logo';
import LegalModal, { type LegalDocType } from '../../components/legal/LegalModal';
import toast from 'react-hot-toast';
import './Login.css';

export default function LoginPage() {
  const { login, register, professor } = useAuth();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [legalDoc, setLegalDoc] = useState<LegalDocType>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });

  useEffect(() => {
    if (professor) {
      navigate('/dashboard');
    }
  }, [professor, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('register') === 'true') {
      setIsRegister(true);
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isRegister && !acceptedTerms) {
      toast.error('Para criar sua conta, aceite os Termos de Uso e a Política de Privacidade.');
      return;
    }
    setIsLoading(true);
    try {
      if (isRegister) {
        await register(form.name, form.email, form.password, form.confirmPassword);
        toast.success('Cadastro realizado com sucesso!');
      } else {
        await login(form.email, form.password);
        toast.success('Bem-vindo de volta!');
      }
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao processar a solicitação.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-orb login-orb-1" />
        <div className="login-orb login-orb-2" />
        <div className="login-orb login-orb-3" />
      </div>
      <div className="login-container animate-scaleIn">
        <div className="login-header">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
            <Logo size="lg" href="https://aura-teacher.vercel.app" />
          </div>
          <p className="login-subtitle">{isRegister ? 'Crie sua conta' : 'Gestão de Alunos'}</p>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          {isRegister && (
            <Input label="Nome" placeholder="Seu nome completo" icon={<MdPerson />}
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          )}
          <Input label="Email" type="email" placeholder="seu@email.com" icon={<MdEmail />}
            value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          <Input label="Senha" type="password" placeholder="••••••••" icon={<MdLock />}
            value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
          {isRegister && (
            <>
              <Input label="Confirmar Senha" type="password" placeholder="••••••••" icon={<MdLock />}
                value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} required />

              <label className="login-terms-consent">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={e => setAcceptedTerms(e.target.checked)}
                />
                <span>
                  Li e concordo com os{' '}
                  <button
                    type="button"
                    className="login-legal-link"
                    onClick={e => {
                      e.preventDefault();
                      setLegalDoc('terms');
                    }}
                  >
                    Termos de Uso
                  </button>{' '}
                  e a{' '}
                  <button
                    type="button"
                    className="login-legal-link"
                    onClick={e => {
                      e.preventDefault();
                      setLegalDoc('privacy');
                    }}
                  >
                    Política de Privacidade (LGPD)
                  </button>
                  .
                </span>
              </label>
            </>
          )}
          <Button type="submit" fullWidth isLoading={isLoading} size="lg">
            {isRegister ? 'Criar Conta Grátis (14 dias)' : 'Entrar'}
          </Button>
        </form>
        <div className="login-footer">
          <p style={{ marginBottom: '12px' }}>
            {isRegister ? 'Já tem uma conta? ' : 'Não tem conta? '}
            <button type="button" className="login-toggle" onClick={() => setIsRegister(!isRegister)}>
              {isRegister ? 'Fazer login' : 'Cadastre-se'}
            </button>
          </p>
          <div className="login-legal-footer-links">
            <button type="button" className="login-legal-link subtle" onClick={() => setLegalDoc('terms')}>
              Termos de Uso
            </button>
            <span>•</span>
            <button type="button" className="login-legal-link subtle" onClick={() => setLegalDoc('privacy')}>
              Política de Privacidade
            </button>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '10px', opacity: 0.8 }}>
            Desenvolvido por <strong style={{ color: 'var(--accent-primary)' }}>Vector Software • Allison Rodrigues</strong>
          </div>
        </div>
      </div>

      <LegalModal
        docType={legalDoc}
        onClose={() => setLegalDoc(null)}
        onSwitchDoc={type => setLegalDoc(type)}
      />
    </div>
  );
}
