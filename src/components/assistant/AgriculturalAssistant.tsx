import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  HelpCircle, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  BookOpen, 
  Layers, 
  X,
  MapPin
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
      content: `Xin chào! Tôi là Trợ lý Khoa học Nông nghiệp **AgriVision AI**, được huấn luyện chuyên sâu về bệnh học cây trồng vùng Bắc Trung Bộ (Cam chanh Nghệ An/Hà Tĩnh, Lúa nước, Cây Lạc).

Tôi có thể hỗ trợ bạn:
• Giải thích cơ chế bệnh sinh và triệu chứng lâm sàng.
• Hướng dẫn góc chụp ảnh bổ sung để phân biệt các bệnh tương đồng.
• Tư vấn biện pháp Quản lý Dịch hại Tổng hợp (IPM) và phòng ngừa an toàn sinh học.
• Phân biệt các cặp bệnh dễ nhầm lẫn (ví dụ: *Đạo ôn vs Đốm nâu*, *Vàng lá HLB vs Thiếu kẽm*).

Bạn đang băn khoăn về vấn đề gì trên đồng ruộng hôm nay?`,
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
    'Cách phân biệt bệnh Đạo ôn và Bạc lá trên lúa?',
    'Tại sao cây cam bị vàng lá lốm đốm gân xanh?',
    'Nên chụp thêm những góc nào để chẩn đoán chính xác hơn?',
    'Biện pháp sinh học phòng trừ bệnh Thối trắng thân lạc?',
    'Cách theo dõi cây phục hồi sau khi xử lý nấm bệnh?',
  ];

  const handleSend = async (questionText?: string) => {
    const textToSend = questionText || input.trim();
    if (!textToSend || loading) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      contextDiagnosis: activeContext ? {
        crop: activeContext.crop,
        suspectedDisease: activeContext.suspectedDisease || '',
      } : undefined,
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
        throw new Error('Lỗi phản hồi từ máy chủ.');
      }

      const data = await response.json();
      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'assistant',
        content: data.reply || 'Không có câu trả lời phù hợp.',
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot_err_${Date.now()}`,
          sender: 'assistant',
          content: 'Xin lỗi, hiện tại kết nối đến Trợ lý AI đang gián đoạn. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau giây lát.',
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-20">
      {/* Page Title */}
      <div className="border-b border-stone-200 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
            <Bot className="w-6 h-6 text-emerald-700" />
            <span>Trợ lý Khoa học Nông nghiệp AgriVision AI</span>
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Tư vấn bệnh học thực vật có trách nhiệm • Phân biệt rõ thông tin kiểm chứng và suy luận AI
          </p>
        </div>
      </div>

      {/* Active Scan Context Banner if present */}
      {activeContext && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 sm:p-4 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold shrink-0">
              Mẫu
            </span>
            <div className="text-xs text-stone-700">
              <span className="font-semibold text-emerald-950">Ngữ cảnh chẩn đoán đang thảo luận: </span>
              <span>Cây {activeContext.crop} • Bệnh nghi ngờ: <strong>{activeContext.suspectedDisease || 'Chưa rõ'}</strong></span>
              {activeContext.confidenceLevel && (
                <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-sm bg-emerald-100 text-emerald-800">
                  {activeContext.confidenceLevel}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => {
              setActiveContext(undefined);
              if (onClearContext) onClearContext();
            }}
            className="p-1 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-emerald-100/50"
            title="Bỏ ngữ cảnh này"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Chat Window */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm flex flex-col h-[650px] overflow-hidden">
        {/* Chat message history */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => {
            const isBot = msg.sender === 'assistant';
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isBot ? 'justify-start' : 'justify-end'}`}
              >
                {isBot && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-600 to-green-800 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                    isBot
                      ? 'bg-stone-50 border border-stone-200 text-stone-800 shadow-xs whitespace-pre-wrap'
                      : 'bg-emerald-800 text-white font-medium shadow-xs'
                  }`}
                >
                  {/* Context tag on user message */}
                  {msg.contextDiagnosis && (
                    <div className="text-[10px] text-emerald-200 mb-1 border-b border-emerald-700 pb-1 flex items-center gap-1">
                      <span>Mẫu đính kèm: {msg.contextDiagnosis.crop} - {msg.contextDiagnosis.suspectedDisease}</span>
                    </div>
                  )}

                  <div>{msg.content}</div>

                  <div className={`mt-2 text-[10px] text-right ${isBot ? 'text-stone-400' : 'text-emerald-200'}`}>
                    {msg.timestamp}
                  </div>
                </div>

                {!isBot && (
                  <div className="w-8 h-8 rounded-xl bg-stone-200 text-stone-700 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex items-start gap-3 justify-start">
              <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3 text-xs text-stone-500 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-700" />
                <span>Trợ lý đang tra cứu kiến thức bệnh học thực vật...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick prompt pills */}
        <div className="px-4 py-2 border-t border-stone-100 bg-stone-50/70 overflow-x-auto flex items-center gap-2">
          <span className="text-[11px] font-semibold text-stone-400 whitespace-nowrap">Gợi ý câu hỏi:</span>
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white hover:bg-emerald-50 text-stone-700 hover:text-emerald-900 border border-stone-200 whitespace-nowrap transition-colors cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input box */}
        <div className="p-3 sm:p-4 border-t border-stone-200 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập thắc mắc về bệnh cây, triệu chứng hoặc cách phòng ngừa..."
              className="flex-1 px-4 py-3 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-stone-50/50"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className={`p-3 rounded-xl text-white font-bold transition-all ${
                !input.trim() || loading
                  ? 'bg-stone-300 cursor-not-allowed'
                  : 'bg-emerald-800 hover:bg-emerald-900 shadow-sm active:scale-95'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
