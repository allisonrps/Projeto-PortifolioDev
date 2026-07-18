import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdEmail, MdLock, MdPerson } from 'react-icons/md';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';
import './Login.css';

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
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
          <h1 className="login-logo">Aura</h1>
          <p className="login-subtitle">{isRegister ? 'Crie sua conta' : 'Bem-vindo de volta'}</p>
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
            <Input label="Confirmar Senha" type="password" placeholder="••••••••" icon={<MdLock />}
              value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} required />
          )}
          <Button type="submit" fullWidth isLoading={isLoading} size="lg">
            {isRegister ? 'Criar Conta' : 'Entrar'}
          </Button>
        </form>
        <div className="login-footer">
          <p>
            {isRegister ? 'Já tem uma conta? ' : 'Não tem conta? '}
            <button type="button" className="login-toggle" onClick={() => setIsRegister(!isRegister)}>
              {isRegister ? 'Fazer login' : 'Cadastre-se'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
