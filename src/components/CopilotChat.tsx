import { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, Send, Loader2, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Card from './Card';
import type { SiteAnalysisData } from '../types';

interface CopilotChatProps {
  analysis: SiteAnalysisData;
  project: {
    name: string;
    address: string;
    date?: string;
  };
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const CHAT_API_URL =
  'http://localhost:5678/webhook/65e3f769-7555-4ace-a110-c4f114e0cfb3/chat';

const PLACEHOLDER_EXAMPLES = [
  '이 대지의 장단점을 알려줘',
  '일조 문제는 없을까?',
  '어떤 건물이 적합할까?',
];

export default function CopilotChat({ analysis, project }: CopilotChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(CHAT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          analysis,
          project,
        }),
      });

      let answer = '죄송합니다. 응답을 받지 못했습니다.';
      if (response.ok) {
        try {
          const data = await response.json();
          if (typeof data === 'string') {
            answer = data;
          } else if (data && typeof data === 'object') {
            answer =
              (data as Record<string, unknown>).answer?.toString() ||
              (data as Record<string, unknown>).response?.toString() ||
              answer;
          }
        } catch {
          // response body is not JSON
        }
      } else {
        answer = `요청 실패 (${response.status})`;
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: answer }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            err instanceof Error
              ? `오류가 발생했습니다: ${err.message}`
              : '오류가 발생했습니다.',
        },
      ]);
    } finally {
      setLoading(false);
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <Card className="p-6 lg:p-8 shadow-soft-lg flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <div className="w-9 h-9 rounded-xl bg-gray-900 flex items-center justify-center flex-shrink-0">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">AI 건축 코파일럿</h2>
          <p className="text-[13px] text-gray-400">
            대지 분석 결과를 기반으로 궁금한 내용을 질문해보세요.
          </p>
        </div>
      </div>

      {/* Chat history */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-[280px] max-h-[420px] overflow-y-auto mt-5 space-y-4 pr-1"
      >
        {messages.length === 0 && !loading && (
          <div className="h-full flex flex-col items-center justify-center text-center py-10">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
              <Bot className="w-7 h-7 text-gray-300" strokeWidth={1.8} />
            </div>
            <p className="text-[14px] font-medium text-gray-400 mb-1">
              코파일럿과 대화를 시작해보세요
            </p>
            <p className="text-[12px] text-gray-300">
              대지 분석 결과를 바탕으로 답변해드릴게요
            </p>
            <div className="mt-5 flex flex-col gap-2 w-full max-w-xs">
              {PLACEHOLDER_EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => setInput(ex)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-600 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 transition-all text-left"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={i}
              className={`flex items-start gap-2.5 animate-fade-in-up ${
                isUser ? 'flex-row-reverse' : ''
              }`}
            >
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                  isUser
                    ? 'bg-brand-100'
                    : 'bg-gray-900'
                }`}
              >
                {isUser ? (
                  <User className="w-4 h-4 text-brand-600" />
                ) : (
                  <Bot className="w-4 h-4 text-white" />
                )}
              </div>
              <div
                className={`max-w-[80%] px-4 py-3 text-[14px] leading-relaxed ${
                  isUser
                    ? 'bg-brand-600 text-white rounded-2xl rounded-tr-md'
                    : 'bg-gray-50 text-gray-800 rounded-2xl rounded-tl-md border border-gray-100'
                }`}
              >
                {isUser ? (
                  <span className="whitespace-pre-wrap">{msg.content}</span>
                ) : (
                  <div className="copilot-markdown">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-2.5 animate-fade-in-up">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="px-4 py-3 bg-gray-50 rounded-2xl rounded-tl-md border border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-gray-400">분석 중</span>
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse-soft" />
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse-soft"
                    style={{ animationDelay: '0.2s' }}
                  />
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse-soft"
                    style={{ animationDelay: '0.4s' }}
                  />
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="mt-5 relative">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          placeholder="예) 이 대지의 장단점을 알려줘"
          className="w-full pl-4 pr-14 py-3.5 rounded-2xl border border-gray-200 text-[14px] text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all resize-none leading-relaxed"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          className="absolute right-3 bottom-3 w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 text-white animate-spin" />
          ) : (
            <Send className="w-4 h-4 text-white" />
          )}
        </button>
      </div>
      <p className="mt-2 text-[11px] text-gray-300">
        Enter로 전송 · Shift + Enter로 줄바꿈
      </p>
    </Card>
  );
}
