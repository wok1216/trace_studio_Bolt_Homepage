import { useState, useRef, useEffect, useCallback } from 'react';
import { MapPin, Search, Loader2, X, Building, Home } from 'lucide-react';

interface AddressSuggestion {
  id: string;
  label: string;
  roadAddress: string;
  jibunAddress: string;
  type: 'road' | 'jibun';
}

interface AddressAutocompleteProps {
  onSelect: (address: string) => void;
  selectedAddress: string | null;
  onClear: () => void;
}

const KAKAO_API_URL = 'https://dapi.kakao.com/v2/local/search/address.json';
const KAKAO_REST_API_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY || '';

export default function AddressAutocomplete({
  onSelect,
  selectedAddress,
  onClear,
}: AddressAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const searchAddress = useCallback(async (keyword: string) => {
    if (!keyword.trim() || keyword.length < 2) {
      setSuggestions([]);
      return;
    }
    if (!KAKAO_REST_API_KEY) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${KAKAO_API_URL}?query=${encodeURIComponent(keyword)}&size=10`,
        {
          method: 'GET',
          headers: {
            Authorization: `KakaoAK ${KAKAO_REST_API_KEY}`,
          },
        },
      );

      if (!response.ok) {
        setSuggestions([]);
        return;
      }

      const data = await response.json();
      const docs: Array<Record<string, unknown>> = data.documents || [];
      const results: AddressSuggestion[] = [];

      for (const doc of docs) {
        const roadAddr = (doc.road_address as { address_name?: string })?.address_name || '';
        const roadBuilding = (doc.road_address as any)?.main_building_no;
        const jibunMain = (doc.address as any)?.main_address_no;
        const jibunAddr = (doc.address as { address_name?: string })?.address_name || '';
        const id = `${roadAddr || jibunAddr}-${doc.address_type || ''}`;

        if (roadAddr && roadBuilding) {
          results.push({
            id: `${id}-road`,
            label: roadAddr,
            roadAddress: roadAddr,
            jibunAddress: jibunAddr,
            type: 'road',
          });
        }
        if (jibunAddr && jibunMain) {
          results.push({
            id: `${id}-jibun`,
            label: jibunAddr,
            roadAddress: roadAddr,
            jibunAddress: jibunAddr,
            type: 'jibun',
          });
        }
      }

      // Deduplicate by label
      const seen = new Set<string>();
      const deduped = results.filter((r) => {
        const key = `${r.type}-${r.label}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setSuggestions(deduped);
      setShowDropdown(true);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);
    setActiveIndex(-1);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (value.trim().length >= 2) {
      debounceRef.current = setTimeout(() => {
        searchAddress(value);
      }, 300);
    } else {
      setSuggestions([]);
      setShowDropdown(false);
    }
  };

  const handleSelect = (suggestion: AddressSuggestion) => {
    onSelect(suggestion.label);
    setQuery(suggestion.label);
    setShowDropdown(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      {/* Selected address chip */}
     
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-300" />
            <input
              type="text"
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (suggestions.length > 0) setShowDropdown(true);
              }}
              placeholder="주소를 입력하세요 (예: 강남구 테헤란로 123)"
              className="w-full pl-11 pr-10 py-3.5 rounded-xl border border-gray-200 text-[15px] text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
            />
            {loading && (
              <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-500 animate-spin" />
            )}
          </div>

          {/* Dropdown suggestions */}
          {showDropdown && suggestions.length > 0 && (
            <div className="absolute z-50 mt-2 w-full bg-white rounded-2xl border border-gray-100 shadow-soft-lg overflow-hidden animate-fade-in-down max-h-80 overflow-y-auto">
              {suggestions.map((s, i) => {
                const Icon = s.type === 'road' ? Building : Home;
                return (
                  <button
                    key={s.id}
                    onClick={() => handleSelect(s)}
                    onMouseEnter={() => setActiveIndex(i)}
                    className={`
                      w-full flex items-start gap-3 px-4 py-3 text-left transition-colors
                      ${i === activeIndex ? 'bg-brand-50' : 'hover:bg-gray-50'}
                      ${i > 0 ? 'border-t border-gray-50' : ''}
                    `}
                  >
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5 ${
                        s.type === 'road' ? 'bg-blue-50' : 'bg-amber-50'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 ${s.type === 'road' ? 'text-blue-500' : 'text-amber-600'}`}
                        strokeWidth={2}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-500">
                          {s.type === 'road' ? '도로명' : '지번'}
                        </span>
                        <p className="text-[14px] font-medium text-gray-900 truncate">
                          {s.label}
                        </p>
                      </div>
                      {s.type === 'road' && s.jibunAddress && (
                        <p className="text-[12px] text-gray-400 truncate">
                          지번: {s.jibunAddress}
                        </p>
                      )}
                      {s.type === 'jibun' && s.roadAddress && (
                        <p className="text-[12px] text-gray-400 truncate">
                          도로명: {s.roadAddress}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {showDropdown && !loading && suggestions.length === 0 && query.length >= 2 && (
            <div className="absolute z-50 mt-2 w-full bg-white rounded-2xl border border-gray-100 shadow-soft-lg p-6 text-center animate-fade-in-down">
              <p className="text-[14px] text-gray-400">검색 결과가 없습니다</p>
              <p className="text-[12px] text-gray-300 mt-1">다른 주소로 검색해보세요</p>
            </div>
          )}

          {!KAKAO_REST_API_KEY && query.length >= 2 && (
            <div className="absolute z-50 mt-2 w-full bg-white rounded-2xl border border-gray-100 shadow-soft-lg p-6 text-center animate-fade-in-down">
              <p className="text-[13px] text-gray-400">
                카카오 API 키가 설정되지 않았습니다
              </p>
              <p className="text-[11px] text-gray-300 mt-1">
                .env 파일에 VITE_KAKAO_REST_API_KEY를 추가하세요
              </p>
            </div>
          )}
      )}
    </div>
  );
}
