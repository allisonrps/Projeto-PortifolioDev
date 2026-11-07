import Modal from '../ui/Modal';
import Button from '../ui/Button';

export type LegalDocType = 'terms' | 'privacy' | null;

interface LegalModalProps {
  docType: LegalDocType;
  onClose: () => void;
  onSwitchDoc?: (type: 'terms' | 'privacy') => void;
}

export default function LegalModal({ docType, onClose, onSwitchDoc }: LegalModalProps) {
  if (!docType) return null;

  const isTerms = docType === 'terms';

  return (
    <Modal
      isOpen={Boolean(docType)}
      onClose={onClose}
      title={isTerms ? 'Termos e Condições de Uso — Plataforma Aura' : 'Política de Privacidade e Proteção de Dados (LGPD)'}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {onSwitchDoc && (
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
            <button
              type="button"
              onClick={() => onSwitchDoc('terms')}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: isTerms ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                color: isTerms ? '#fff' : 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Termos de Uso
            </button>
            <button
              type="button"
              onClick={() => onSwitchDoc('privacy')}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: !isTerms ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                color: !isTerms ? '#fff' : 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Política de Privacidade (LGPD)
            </button>
          </div>
        )}

        <div
          style={{
            maxHeight: '58vh',
            overflowY: 'auto',
            paddingRight: '8px',
            fontSize: '13px',
            lineHeight: 1.65,
            color: 'var(--text-secondary)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {isTerms ? (
            <>
              <p style={{ margin: 0 }}>
                <strong>Última atualização:</strong> Novembro de 2026 • <strong>Responsável:</strong> Vector Software (Allison Rodrigues)
              </p>

              <div>
                <h4 style={{ color: 'var(--text-primary)', margin: '0 0 4px 0', fontSize: '14px' }}>1. Objeto e Aceitação</h4>
                <p style={{ margin: 0 }}>
                  A plataforma <strong>Aura</strong> é um software como serviço (SaaS) voltado à gestão pedagógica, agenda de aulas, controle financeiro e aplicação de atividades para professores particulares e educadores independentes. Ao criar uma conta, o usuário declara ter lido, compreendido e aceitado integralmente estes Termos de Uso.
                </p>
              </div>

              <div>
                <h4 style={{ color: 'var(--text-primary)', margin: '0 0 4px 0', fontSize: '14px' }}>2. Período de Teste Gratuito (Free Trial)</h4>
                <p style={{ margin: 0 }}>
                  Todo novo professor cadastrado recebe <strong>14 (quatorze) dias corridos de acesso gratuito</strong> com todas as funcionalidades liberadas, sem necessidade de informar cartão de crédito no ato do cadastro.
                </p>
              </div>

              <div>
                <h4 style={{ color: 'var(--text-primary)', margin: '0 0 4px 0', fontSize: '14px' }}>3. Planos, Assinaturas e Modo Somente Leitura</h4>
                <p style={{ margin: 0 }}>
                  Para manter a criação e edição de registros após o período de teste, o usuário poderá optar pelo <strong>Plano Aura Pro Mensal (R$ 29,90 / 30 dias)</strong> ou pelo <strong>Plano Aura Pro Anual (R$ 299,00 / 365 dias)</strong>, processados de forma segura via instituição de pagamento homologada pelo Banco Central (Asaas). Caso a assinatura expire, os dados do professor <strong>não são apagados</strong>: a conta entra em modo de visualização (somente leitura) até que uma nova licença seja ativada.
                </p>
              </div>

              <div>
                <h4 style={{ color: 'var(--text-primary)', margin: '0 0 4px 0', fontSize: '14px' }}>4. Propriedade Intelectual e Conteúdo do Professor</h4>
                <p style={{ margin: 0 }}>
                  Todas as fichas de aula, questões, provas, cadastros de alunos e anotações pedagógicas inseridas pelo professor permanecem de titularidade exclusiva do próprio professor. O código-fonte, marca, logotipo e interface da plataforma Aura pertencem exclusivamente à Vector Software.
                </p>
              </div>

              <div>
                <h4 style={{ color: 'var(--text-primary)', margin: '0 0 4px 0', fontSize: '14px' }}>5. Segurança da Conta e Backups</h4>
                <p style={{ margin: 0 }}>
                  O usuário é responsável por manter o sigilo de sua senha de acesso. A plataforma disponibiliza na aba <em>Opções → Backup e Restauração</em> ferramenta gratuita para exportação integral dos dados em formato JSON a qualquer momento.
                </p>
              </div>

              <div>
                <h4 style={{ color: 'var(--text-primary)', margin: '0 0 4px 0', fontSize: '14px' }}>6. Cancelamento e Suporte</h4>
                <p style={{ margin: 0 }}>
                  Por operar no modelo pré-pago por período (30 ou 365 dias), não há fidelidade contratual ou multa de cancelamento. Em caso de dúvidas ou solicitações de suporte técnico, entre em contato pelo canal oficial: <strong>allisonrps.dev@gmail.com</strong>.
                </p>
              </div>
            </>
          ) : (
            <>
              <p style={{ margin: 0 }}>
                <strong>Conformidade com a LGPD (Lei nº 13.709/2018)</strong> • <strong>Controladora/Operadora:</strong> Vector Software
              </p>

              <div>
                <h4 style={{ color: 'var(--text-primary)', margin: '0 0 4px 0', fontSize: '14px' }}>1. Coleta e Finalidade dos Dados</h4>
                <p style={{ margin: 0 }}>
                  Coletamos apenas as informações estritamente necessárias para o funcionamento da plataforma: nome, e-mail, telefone opcional e CPF/CNPJ (exclusivamente quando o professor gera uma cobrança de assinatura junto ao gateway de pagamento Asaas).
                </p>
              </div>

              <div>
                <h4 style={{ color: 'var(--text-primary)', margin: '0 0 4px 0', fontSize: '14px' }}>2. Dados de Alunos Cadastrados pelo Professor</h4>
                <p style={{ margin: 0 }}>
                  Em relação aos dados cadastrais e notas dos alunos inseridos pelo professor na plataforma, o <strong>Professor</strong> atua como Controlador dos dados para fins de execução de seu serviço educacional, e a plataforma <strong>Aura</strong> atua como Operadora tecnológica, mantendo isolamento estrito entre contas de diferentes professores.
                </p>
              </div>

              <div>
                <h4 style={{ color: 'var(--text-primary)', margin: '0 0 4px 0', fontSize: '14px' }}>3. Segurança e Criptografia</h4>
                <p style={{ margin: 0 }}>
                  As senhas de acesso são armazenadas utilizando hash criptográfico irreversível (BCrypt). Toda a comunicação entre o navegador e os servidores ocorre sob protocolo criptografado HTTPS/TLS, e os pagamentos são processados diretamente pelo Asaas Gestão Financeira Instituição de Pagamento S.A., sem armazenamento de dados de cartão de crédito nos servidores do Aura.
                </p>
              </div>

              <div>
                <h4 style={{ color: 'var(--text-primary)', margin: '0 0 4px 0', fontSize: '14px' }}>4. Não Compartilhamento com Terceiros</h4>
                <p style={{ margin: 0 }}>
                  A Vector Software <strong>jamais vende, aluga ou compartilha</strong> listas de alunos, telefones, e-mails ou materiais didáticos dos professores com terceiros ou empresas de publicidade.
                </p>
              </div>

              <div>
                <h4 style={{ color: 'var(--text-primary)', margin: '0 0 4px 0', fontSize: '14px' }}>5. Direitos do Titular (Portabilidade e Exclusão)</h4>
                <p style={{ margin: 0 }}>
                  O professor pode exportar todos os seus dados a qualquer momento na aba <em>Opções → Backup</em>, bem como solicitar a atualização ou exclusão definitiva de sua conta entrando em contato pelo canal de privacidade e suporte: <strong>allisonrps.dev@gmail.com</strong>.
                </p>
              </div>
            </>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
          <Button type="button" variant="primary" onClick={onClose}>
            Entendi e Fechar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
