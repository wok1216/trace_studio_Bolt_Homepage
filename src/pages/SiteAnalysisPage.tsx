import { useState } from 'react';
import { MapPin, Loader2, AlertCircle, ArrowLeft, Building2, Check } from 'lucide-react';
import type { PageKey, SiteAnalysisData } from '../types';
import Card from '../components/Card';
import Button from '../components/Button';
import AddressAutocomplete from '../components/AddressAutocomplete';

interface SiteAnalysisPageProps {
  onNavigate: (page: PageKey) => void;
  onAnalysisComplete: (address: string, data: SiteAnalysisData, projectName: string) => void;
}

const WEBHOOK_URL = 'https://n8n-production-bdb83.up.railway.app/webhook/trace_studio';

export default function SiteAnalysisPage({
  onNavigate,
  onAnalysisComplete,
}: SiteAnalysisPageProps) {
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStartAnalysis(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedAddress) {
      setError('주소를 선택해주세요');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: selectedAddress }),
      });

      let data: SiteAnalysisData | null = null;
      try {
        data = (await response.json()) as SiteAnalysisData;
      } catch {
        // response body is not JSON
      }

      if (!response.ok) {
        if (data && typeof data === 'object' && 'error' in data) {
          throw new Error(String((data as Record<string, unknown>).error));
        } else if (data && typeof data === 'object' && 'message' in data) {
          throw new Error(String((data as Record<string, unknown>).message));
        } else {
          throw new Error(`요청 실패 (${response.status})`);
        }
      }

      if (!data) {
        throw new Error('응답을 받지 못했습니다');
      }

      onAnalysisComplete(selectedAddress, data, projectName.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : '분석 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] animate-fade-in">
        <Card className="p-10 lg:p-16 max-w-md w-full mx-4 text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-brand-50 animate-pulse-soft" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-brand-600 animate-spin" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            AI가 대지를 분석하고 있습니다
          </h3>
          <p className="text-sm text-gray-400">
            잠시만 기다려주세요. 주소를 기반으로 대지 정보를 분석하고 있습니다.
          </p>
          <div className="mt-6 flex justify-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse-soft" />
            <span
              className="w-2 h-2 rounded-full bg-brand-400 animate-pulse-soft"
              style={{ animationDelay: '0.2s' }}
            />
            <span
              className="w-2 h-2 rounded-full bg-brand-400 animate-pulse-soft"
              style={{ animationDelay: '0.4s' }}
            />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-in px-5 lg:px-10 py-8 lg:py-12 max-w-2xl">
      <button
        onClick={() => onNavigate('home')}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        뒤로
      </button>

      <div className="mb-8">
        <div className="inline-flex w-12 h-12 rounded-2xl bg-brand-500 items-center justify-center mb-5 shadow-sm">
          <Building2 className="w-6 h-6 text-white" strokeWidth={2} />
        </div>
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight mb-3">
          대지 분석
        </h1>
        <p className="text-[15px] text-gray-400 leading-relaxed">
          주소를 검색하고 선택하면 AI가 대지를 분석합니다
        </p>
      </div>

      <Card className="p-7 lg:p-8">
        <form onSubmit={handleStartAnalysis} className="space-y-6">
          {/* Project Name (local only) */}
          <div>
            <label className="block text-[14px] font-semibold text-gray-700 mb-2">
              프로젝트명
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="프로젝트 이름을 입력하세요 (선택)"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[15px] text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
            />
            <p className="mt-2 text-[12px] text-gray-300">
              프로젝트명은 로컬에만 저장되며 분석에 사용되지 않습니다
            </p>
          </div>

          {/* Address Search */}
          <div>
            <label className="block text-[14px] font-semibold text-gray-700 mb-2">
              주소 <span className="text-brand-500">*</span>
            </label>
            <AddressAutocomplete
              onSelect={(addr) => setSelectedAddress(addr)}
              selectedAddress={selectedAddress}
              onClear={() => setSelectedAddress(null)}
            />
            {selectedAddress && (
              <div className="mt-2 flex items-center gap-1.5 text-[12px] text-green-600 animate-fade-in">
                <Check className="w-3.5 h-3.5" />
                주소가 선택되었습니다
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-100 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-[13px] text-red-600 font-medium">{error}</p>
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            size="lg"
            fullWidth
            disabled={!selectedAddress}
            icon={<MapPin className="w-5 h-5" />}
          >
            대지 분석 시작
          </Button>
        </form>
      </Card>
    </div>
  );
}
