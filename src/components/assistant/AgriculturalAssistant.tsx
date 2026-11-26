import React, { useState, useRef, useEffect } from 'react';
import {
  MessageCircle,
  Send,
  User,
  RefreshCw,
  X,
} from 'lucide-react';
import { ChatMessage } from '../../types';

interface AgriculturalAssistantProps {
  initialContext?: {
    crop: string;
    part?: string;
    suspectedDisease?: string;
    symptoms?: string[];
    confidenceLevel?: string;
  } | null;
  onClearContext?: () => void;
}

export const AgriculturalAssistant: React.FC<AgriculturalAssistantProps> = ({
  initialContext,
  onClearContext,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      content:
        'Chào bác! Bác đang thấy cây Cam, Lúa hay Lạc có dấu hiệu gì lạ cứ nhắn hỏi ở đây nhé. Tôi sẽ giải thích thật dễ hiểu và chỉ cách chăm sóc an toàn cho vườn nhà mình.',
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [activeContext, setActiveContext] = useState(initialContext);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (initialContext) {
      setActiveContext(initialContext);
    }
  }, [initialContext]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const quickQuestions = [
    'Lúa bị đạo ôn thì chữa thế nào?',
    'Cây cam bị vàng lá làm sao cứu?',
    'Cách phòng bệnh đốm lá cây lạc?',
    'Chụp ảnh lá cây sao cho rõ nét?',
  ];

  const handleSend = async (questionText?: string) => {
    const textToSend = questionText || input.trim();
    if (!textToSend || loading) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      contextDiagnosis: activeContext
        ? {
            crop: activeContext.crop,
            suspectedDisease: activeContext.suspectedDisease || '',
          }
        : undefined,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!questionText) setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: messages.slice(-6),
          diagnosisContext: activeContext,
        }),
      });

      if (!response.ok) {
        throw new Error('Không kết nối được với máy chủ.');
      }

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          id: `bot_${Date.now()}`,
          sender: 'assistant',
          content: data.reply || 'Bác hỏi rõ hơn một chút để tôi trả lời chính xác nhé.',
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot_err_${Date.now()}`,
          sender: 'assistant',
          content: 'Mạng đang hơi chập chờn, bác bấm gửi lại giúp tôi nhé.',
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-stone-900">
          Hỏi Bác Sĩ Cây Trồng
        </h1>
        <p className="text-base text-stone-600 mt-1">
          Nhắn câu hỏi bằng tiếng Việt hoặc bấm chọn câu hỏi gợi ý bên dưới.
        </p>
      </div>

      {activeContext && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-3">
          <div className="text-base text-stone-800">
            <span className="font-bold text-emerald-950">Đang hỏi về lần khám vừa rồi: </span>
            <span>{activeContext.crop}</span>
            {activeContext.suspectedDisease && (
              <span> — <strong>{activeContext.suspectedDisease}</strong></span>
            )}
          </div>
          <button
            onClick={() => {
              setActiveContext(undefined);
              if (onClearContext) onClearContext();
            }}
            className="p-2 text-stone-500 hover:text-stone-800 rounded-xl hover:bg-emerald-100 min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-stone-200 flex flex-col h-[560px] overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => {
            const isBot = msg.sender === 'assistant';
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isBot ? 'justify-start' : 'justify-end'}`}
              >
                {isBot && (
                  <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 text-base leading-relaxed ${
                    isBot
                      ? 'bg-stone-50 border border-stone-200 text-stone-900 whitespace-pre-wrap'
                      : 'bg-emerald-700 text-white font-medium'
                  }`}
                >
                  <div>{msg.content}</div>
                  <div className={`mt-2 text-xs text-right ${isBot ? 'text-stone-500' : 'text-emerald-100'}`}>
                    {msg.timestamp}
                  </div>
                </div>

                {!isBot && (
                  <div className="w-9 h-9 rounded-xl bg-stone-200 text-stone-700 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex items-start gap-3 justify-start">
              <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div className="bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3 text-base text-stone-600 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-700" />
                <span>Đang tìm câu trả lời cho bác...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Simple Quick Questions */}
        <div className="px-4 py-3 border-t border-stone-100 bg-stone-50 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-stone-600">Hỏi nhanh:</span>
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="px-3.5 py-2 rounded-xl text-sm font-semibold bg-white hover:bg-emerald-50 text-stone-800 border border-stone-300 transition-colors cursor-pointer min-h-[40px]"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Big Input Row */}
        <div className="p-3 sm:p-4 border-t border-stone-200 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2.5"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Gõ câu hỏi của bác vào đây..."
              className="flex-1 min-h-[48px] px-4 py-2.5 rounded-xl border border-stone-300 text-base focus:outline-none focus:border-emerald-700 bg-stone-50/50"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className={`min-h-[48px] px-5 py-2.5 rounded-xl text-white font-bold text-base flex items-center gap-2 transition-colors cursor-pointer ${
                !input.trim() || loading
                  ? 'bg-stone-300 cursor-not-allowed'
                  : 'bg-emerald-700 hover:bg-emerald-800'
              }`}
            >
              <span>Gửi</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
