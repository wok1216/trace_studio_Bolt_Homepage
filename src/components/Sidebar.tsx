import {
  Home,
  MapPin,
  Images,
  PenTool,
  ClipboardCheck,
  FolderKanban,
  Building2,
  type LucideIcon,
} from 'lucide-react';
import type { PageKey } from '../types';

interface SidebarProps {
  current: PageKey;
  onNavigate: (page: PageKey) => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

interface NavItem {
  key: PageKey;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { key: 'home', label: '홈', icon: Home },
  { key: 'site-analysis', label: '대지 분석', icon: MapPin },
  { key: 'reference', label: '레퍼런스', icon: Images },
  { key: 'design', label: '시안 생성', icon: PenTool },
  { key: 'review', label: '설계 검토', icon: ClipboardCheck },
  { key: 'projects', label: '프로젝트', icon: FolderKanban },
];

export default function Sidebar({ current, onNavigate, mobileOpen, onMobileClose }: SidebarProps) {
  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={onMobileClose}
        />
      )}
      <aside
        className={`
          fixed lg:sticky top-0 z-40
          h-screen w-64 flex-shrink-0
          glass border-r border-gray-100
          flex flex-col
          transition-transform duration-300 ease-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="px-6 pt-7 pb-8">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center shadow-sm">
              <Building2 className="w-5 h-5 text-white" strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-[15px] font-bold text-gray-900 leading-tight">Arch Assistant</p>
              <p className="text-[11px] text-gray-400 font-medium">AI Workspace</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = current === item.key;
            return (
              <button
                key={item.key}
                onClick={() => {
                  onNavigate(item.key);
                  onMobileClose();
                }}
                className={`
                  w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl
                  text-[14px] font-medium
                  transition-all duration-200 ease-out
                  ${active
                    ? 'bg-brand-50 text-brand-600'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <Icon
                  className={`w-[18px] h-[18px] ${active ? 'text-brand-600' : 'text-gray-400'}`}
                  strokeWidth={2}
                />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4">
          <div className="rounded-2xl bg-gradient-to-br from-brand-50 to-blue-50 border border-brand-100/60 p-4">
            <p className="text-[12px] font-semibold text-gray-700 mb-1">Pro 업그레이드</p>
            <p className="text-[11px] text-gray-400 leading-relaxed mb-3">
              무제한 분석 및 고급 기능
            </p>
            <button className="w-full py-2 rounded-xl bg-brand-600 text-white text-[12px] font-medium hover:bg-brand-700 transition-colors">
              살펴보기
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
