import { Menu } from 'lucide-react';

interface TopBarProps {
  onMenuClick: () => void;
  title?: string;
}

export default function TopBar({ onMenuClick, title }: TopBarProps) {
  return (
    <header className="sticky top-0 z-20 glass border-b border-gray-100">
      <div className="flex items-center justify-between px-5 lg:px-10 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          {title && (
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-[13px] font-semibold shadow-sm">
            W
          </div>
        </div>
      </div>
    </header>
  );
}
