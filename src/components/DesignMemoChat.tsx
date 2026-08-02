import { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, Send, Loader2, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Card from './Card';
import type { SiteAnalysisData } from '../types';
import {
  loadChatHistory,
  saveChatHistory,
  type ProjectChatMessage,
} from '../storage';
import { sendDesignMemoMessage } from '../lib/designMemoChatApi';

interface DesignMemoChatProps {
  projectId: string;
  analysis: SiteAnalysisData;
  designNote: string;
  className?: string;
}

const PLACEHOLDER_EXAMPLES = [
  '설계 의도를 검토해줘',
  '이 메모 기준으로 리스크는?',
  '변경 사항을 정리해줘',
];

const ANSWER_FIELDS = ['output', 'answer', 'response', 'text', 'message', 'content'] as const;

function extractChatAnswer(data: unknown): string | null {
  if (data == null) return null;
  if (typeof data === 'string') {
    const trimmed = data.trim();
    return trimmed || null;
  }

  if (Array.isArray(data)) {
    for (const item of data) {
      const answer = extractChatAnswer(item);
      if (answer) return answer;
    }
    return null;
  }

  if (typeof data !== 'object') return null;

  const obj = data as Record<string, unknown>;

  if ('json' in obj && obj.json != null) {
    const nested = extractChatAnswer(obj.json);
    if (nested) return nested;
  }

  for (const field of ANSWER_FIELDS) {
    const value = obj[field];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }

  for (const key of ['data', 'body', 'result']) {
    if (key in obj) {
      const nested = extractChatAnswer(obj[key]);
      if (nested) return nested;
    }
  }

  return null;
}

function parseChatResponseBody(responseText: string): string | null {
  const trimmed = responseText.trim();
  if (!trimmed) return null;

  try {
    return extractChatAnswer(JSON.parse(trimmed));
  } catch {
    return trimmed;
  }
}

function getDesignMemoHistoryKey(projectId: string): string {
  return `${projectId}_design_memo`;
}

export default function DesignMemoChat({
  projectId,
  analysis,
  designNote,
  className = '',
}: DesignMemoChatProps) {
  const historyKey = getDesignMemoHistoryKey(projectId);

  const [messages, setMessages] = useState<ProjectChatMessage[]>(() =>
    loadChatHistory(historyKey),
  );
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const historyKeyRef = useRef(historyKey);
  historyKeyRef.current = historyKey;

  useEffect(() => {
    setMessages(loadChatHistory(historyKey));
  }, [historyKey]);

  useEffect(() => {
    saveChatHistory(historyKeyRef.current, messages);
  }, [messages]);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  const sendMessage = useCallback(
    async (messageText?: string) => {
      const text = (messageText ?? input).trim();
      console.log('[DesignMemoChat] sendMessage called', { text, loading, projectId });

      if (!text) {
        console.warn('[DesignMemoChat] aborted: empty message');
        return;
      }
      if (loading) {
        console.warn('[DesignMemoChat] aborted: already loading');
        return;
      }

      const userMsg: ProjectChatMessage = { role: 'user', content: text };
      setMessages((prev) => [...prev, userMsg]);
      if (messageText === undefined) {
        setInput('');
      }
      setLoading(true);

      const fallbackAnswer = '죄송합니다. 응답을 받지 못했습니다.';

      try {
        console.log('[DesignMemoChat] analysis field count:', Object.keys(analysis).length);
        const payload = {
          projectId,
          message: text,
          designNote,
          analysis,
        };

        console.log('[DesignMemoChat] calling fetch via sendDesignMemoMessage');
        const response = await sendDesignMemoMessage(payload);
        const responseText = await response.text();

        console.log('[DesignMemoChat] response status:', response.status);
        console.log('[DesignMemoChat] response body:', responseText);

        let answer = fallbackAnswer;

        if (response.ok) {
          answer = parseChatResponseBody(responseText) ?? fallbackAnswer;
        } else {
          answer = parseChatResponseBody(responseText) ?? `요청 실패 (${response.status})`;
        }

        setMessages((prev) => [...prev, { role: 'assistant', content: answer }]);
      } catch (err) {
        console.error('[DesignMemoChat] fetch error:', err);
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
    },
    [input, loading, projectId, designNote, analysis],
  );

  function handleSend() {
    console.log('[DesignMemoChat] handleSend (button click)');
    void sendMessage();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.nativeEvent.isComposing || e.key !== 'Enter' || e.shiftKey) return;
    e.preventDefault();
    console.log('[DesignMemoChat] handleKeyDown (Enter)');
    void sendMessage();
  }

  return (
    <Card className={`p-6 lg:p-8 shadow-soft-lg flex flex-col h-full ${className}`.trim()}>
      <div className="flex items-center gap-3 mb-1">
        <div className="w-9 h-9 rounded-xl bg-gray-900 flex items-center justify-center flex-shrink-0">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">AI 건축 코파일럿</h2>
          <p className="text-[13px] text-gray-400">
            설계 메모를 기반으로 궁금한 내용을 질문해보세요.
          </p>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 min-h-[320px] max-h-[520px] overflow-y-auto mt-5 space-y-4 pr-1"
      >
        {messages.length === 0 && !loading && (
          <div className="h-full flex flex-col items-center justify-center text-center py-10">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
              <Bot className="w-7 h-7 text-gray-300" strokeWidth={1.8} />
            </div>
            <p className="text-[14px] font-medium text-gray-400 mb-1">
              설계 메모 코파일럿과 대화를 시작해보세요
            </p>
            <p className="text-[12px] text-gray-300">
              작성한 설계 메모를 바탕으로 답변해드릴게요
            </p>
            <div className="mt-5 flex flex-col gap-2 w-full max-w-xs">
              {PLACEHOLDER_EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => {
                    console.log('[DesignMemoChat] placeholder click:', ex);
                    void sendMessage(ex);
                  }}
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
                isUser ? 'flex-row-reverse' : 'w-full'
              }`}
            >
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                  isUser ? 'bg-brand-100' : 'bg-gray-900'
                }`}
              >
                {isUser ? (
                  <User className="w-4 h-4 text-brand-600" />
                ) : (
                  <Bot className="w-4 h-4 text-white" />
                )}
              </div>
              <div
                className={`px-4 py-3 leading-relaxed ${
                  isUser
                    ? 'max-w-[72%] text-[14px] bg-brand-600 text-white rounded-2xl rounded-tr-md'
                    : 'flex-1 min-w-0 text-[15px] bg-gray-50 text-gray-800 rounded-2xl rounded-tl-md border border-gray-100'
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
          <div className="flex items-start gap-2.5 animate-fade-in-up w-full">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0 px-4 py-3 bg-gray-50 rounded-2xl rounded-tl-md border border-gray-100">
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

      <div className="mt-5 relative">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          placeholder="예) 설계 의도를 검토해줘"
          className="w-full pl-4 pr-14 py-3.5 rounded-2xl border border-gray-200 text-[14px] text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all resize-none leading-relaxed"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!input.trim() || loading}
          className="absolute right-3 bottom-3 z-10 w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
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
