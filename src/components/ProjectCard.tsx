import { MapPin, Calendar } from 'lucide-react';
import type { Project } from '../types';
import Card from './Card';

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
}

export default function ProjectCard({ project, onClick }: ProjectCardProps) {
  return (
    <Card hover onClick={onClick} className="overflow-hidden group">
      {/* Thumbnail */}
      <div className="relative h-40 bg-gradient-to-br from-brand-50 via-blue-50 to-sky-50 overflow-hidden">
        {project.thumbnail ? (
          <img
            src={project.thumbnail}
            alt={project.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-white/60 backdrop-blur-sm flex items-center justify-center">
              <MapPin className="w-7 h-7 text-brand-400" strokeWidth={1.8} />
            </div>
          </div>
        )}
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-white/80 backdrop-blur-sm text-[11px] font-medium text-gray-600">
          프로젝트
        </div>
      </div>

      {/* Info */}
      <div className="p-5">
        <h3 className="text-[15px] font-semibold text-gray-900 mb-2 truncate">{project.name}</h3>
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[13px] text-gray-500">
            <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="truncate">{project.address}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[13px] text-gray-400">
            <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{project.date}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
