import { type LucideIcon } from 'lucide-react';
import Button from '../components/Button';
import type { PageKey } from '../types';

interface PlaceholderPageProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  desc: string;
  actionLabel?: string;
  onAction?: () => void;
  onNavigate?: (page: PageKey) => void;
}

export default function PlaceholderPage({
  icon: Icon,
  title,
  subtitle,
  desc,
  actionLabel = '시작하기',
  onAction,
}: PlaceholderPageProps) {
  return (
    <div className="animate-fade-in px-5 lg:px-10 py-12 lg:py-20">
      <div className="max-w-2xl mx-auto text-center">
        <div className="inline-flex w-16 h-16 rounded-3xl bg-gradient-to-br from-brand-50 to-blue-50 items-center justify-center mb-6 shadow-soft">
          <Icon className="w-8 h-8 text-brand-600" strokeWidth={1.8} />
        </div>
        <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight mb-2">
          {title}
        </h2>
        <p className="text-[15px] text-brand-500 font-medium mb-3">{subtitle}</p>
        <p className="text-[14px] text-gray-400 leading-relaxed mb-8 max-w-md mx-auto">
          {desc}
        </p>
        <Button
          size="lg"
          icon={<Icon className="w-5 h-5" />}
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      </div>
    </div>
  );
}
