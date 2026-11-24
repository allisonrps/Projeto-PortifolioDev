import { useState, useRef, useEffect } from 'react';
import { MdSend, MdDone, MdDoneAll, MdForum, MdDeleteOutline } from 'react-icons/md';
import { format, isToday, isYesterday } from 'date-fns';
import type { ChatMessage } from '../../types';
import './Chat.css';

interface ChatWindowProps {
  messages: ChatMessage[];
  currentSenderType: 'professor' | 'student';
  otherPartyName: string;
  otherPartyAvatarUrl?: string | null;
  otherPartySubtitle?: string;
  onSendMessage: (text: string) => Promise<void>;
  onDeleteMessage?: (messageId: string) => Promise<void>;
  loading?: boolean;
}

export default function ChatWindow({
  messages,
  currentSenderType,
  otherPartyName,
  otherPartyAvatarUrl,
  otherPartySubtitle = 'Mensagens sincronizadas em tempo real',
  onSendMessage,
  onDeleteMessage,
  loading = false,
}: ChatWindowProps) {
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll para o final da conversa quando mensagens mudam
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || sending) return;

    setSending(true);
    try {
      await onSendMessage(text);
      setInputText('');
      setTimeout(() => {
        inputRef.current?.focus();
        scrollToBottom();
      }, 50);
    } catch {
      // O erro já é tratado no callback pai com toast
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (messageId: string) => {
    if (!onDeleteMessage || deletingId) return;
    if (!confirm('Deseja realmente apagar esta mensagem?')) return;

    setDeletingId(messageId);
    try {
      await onDeleteMessage(messageId);
    } finally {
      setDeletingId(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const parseMessageDate = (dateStr: string): Date => {
    if (!dateStr) return new Date();
    try {
      const normalized = dateStr.endsWith('Z') || /[+-]\d{2}(:\d{2})?$/.test(dateStr)
        ? dateStr
        : `${dateStr}Z`;
      const d = new Date(normalized);
      return isNaN(d.getTime()) ? new Date(dateStr) : d;
    } catch {
      return new Date();
    }
  };

  const formatMessageTime = (dateStr: string) => {
    try {
      const d = parseMessageDate(dateStr);
      if (isNaN(d.getTime())) return '';
      if (isToday(d)) {
        return format(d, 'HH:mm');
      }
      if (isYesterday(d)) {
        return `Ontem ${format(d, 'HH:mm')}`;
      }
      return format(d, 'dd/MM HH:mm');
    } catch {
      return dateStr;
    }
  };

  const formatFullTooltip = (dateStr: string) => {
    try {
      const d = parseMessageDate(dateStr);
      if (isNaN(d.getTime())) return '';
      return format(d, "dd/MM/yyyy 'às' HH:mm:ss");
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="chat-container">
      {/* Header do Chat */}
      <div className="chat-header">
        <div className="chat-header-user">
          <div className="chat-header-avatar">
            {otherPartyAvatarUrl ? (
              <img
                src={otherPartyAvatarUrl}
                alt={otherPartyName}
                onError={(e: any) => { e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <span>{otherPartyName.slice(0, 2).toUpperCase()}</span>
            )}
          </div>
          <div className="chat-header-info">
            <h4 className="chat-header-title">{otherPartyName}</h4>
            <span className="chat-header-status">
              <span className="chat-header-status-dot" />
              {otherPartySubtitle}
            </span>
          </div>
        </div>
      </div>

      {/* Área de Mensagens */}
      <div className="chat-messages-area">
        {loading && messages.length === 0 ? (
          <div className="chat-empty-state">
            <div className="chat-empty-icon animate-pulse">
              <MdForum />
            </div>
            <div className="chat-empty-title">Carregando mensagens...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="chat-empty-state">
            <div className="chat-empty-icon">
              <MdForum />
            </div>
            <div className="chat-empty-title">Nenhuma mensagem ainda</div>
          </div>
        ) : (
          messages.map((msg) => {
            const isOutgoing = msg.senderType === currentSenderType;
            const isProfessor = msg.senderType === 'professor';
            const isRead = currentSenderType === 'professor' ? msg.isReadByStudent : msg.isReadByProfessor;
            const canDelete = isOutgoing || currentSenderType === 'professor';

            return (
              <div
                key={msg.id}
                className={`chat-msg-row ${isOutgoing ? 'outgoing' : 'incoming'} animate-fadeIn`}
              >
                {/* Botão de apagar para mensagens enviadas (à esquerda do balão) */}
                {isOutgoing && canDelete && onDeleteMessage && (
                  <button
                    type="button"
                    className="chat-msg-delete-btn"
                    title="Apagar mensagem"
                    onClick={() => handleDelete(msg.id)}
                    disabled={deletingId === msg.id}
                  >
                    <MdDeleteOutline />
                  </button>
                )}

                <div
                  className={`chat-bubble ${isProfessor ? 'bubble-professor' : 'bubble-student'} ${isOutgoing ? 'outgoing' : 'incoming'}`}
                >
                  <div className="chat-bubble-line">
                    <span className="chat-bubble-time" title={formatFullTooltip(msg.createdAt)}>
                      {formatMessageTime(msg.createdAt)}
                      {isOutgoing && (
                        <span
                          className="chat-read-badge"
                          title={isRead ? 'Visualizada' : 'Enviada'}
                        >
                          {isRead ? <MdDoneAll /> : <MdDone />}
                        </span>
                      )}
                    </span>
                    <span className="chat-bubble-text">{msg.content}</span>
                  </div>
                </div>

                {/* Botão de apagar para professor moderar mensagens recebidas (à direita do balão) */}
                {!isOutgoing && canDelete && onDeleteMessage && (
                  <button
                    type="button"
                    className="chat-msg-delete-btn"
                    title="Apagar mensagem"
                    onClick={() => handleDelete(msg.id)}
                    disabled={deletingId === msg.id}
                  >
                    <MdDeleteOutline />
                  </button>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Barra de Entrada / Digitação */}
      <form className="chat-input-bar" onSubmit={handleSend}>
        <input
          ref={inputRef}
          type="text"
          className="chat-input-field"
          placeholder="Digite sua mensagem aqui..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={sending}
          maxLength={4000}
        />
        <button
          type="submit"
          className="chat-send-btn"
          disabled={!inputText.trim() || sending}
          title="Enviar mensagem"
        >
          <MdSend />
        </button>
      </form>
    </div>
  );
}
