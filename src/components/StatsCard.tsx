import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: 'blue' | 'red' | 'orange' | 'green' | 'purple';
}

const colorVariants = {
  blue: {
    bg: 'from-blue-500 to-blue-600',
    text: 'text-blue-600',
    bgLight: 'bg-blue-50',
  },
  red: {
    bg: 'from-red-500 to-pink-600',
    text: 'text-red-600', 
    bgLight: 'bg-red-50',
  },
  orange: {
    bg: 'from-orange-500 to-amber-600',
    text: 'text-orange-600',
    bgLight: 'bg-orange-50',
  },
  green: {
    bg: 'from-green-500 to-emerald-600',
    text: 'text-green-600',
    bgLight: 'bg-green-50',
  },
  purple: {
    bg: 'from-purple-500 to-purple-600',
    text: 'text-purple-600',
    bgLight: 'bg-purple-50',
  },
};

export default function StatsCard({ title, value, icon: Icon, color }: StatsCardProps) {
  const colors = colorVariants[color];

  return (
    <div className="bg-white rounded-lg p-2 sm:p-4 shadow-sm border border-gray-100 min-w-[110px] flex flex-col items-center justify-center">
      <div className="flex flex-col items-center">
        <div className={`p-2 rounded-lg bg-gradient-to-r ${colors.bg} mb-1`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <p className="text-xs font-medium text-gray-600 mb-0.5 text-center">{title}</p>
        <p className="text-xl font-bold text-gray-900 text-center">{value}</p>
      </div>
    </div>
  );
} 