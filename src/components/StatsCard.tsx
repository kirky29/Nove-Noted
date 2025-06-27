import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: 'blue' | 'red' | 'orange' | 'green';
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
};

export default function StatsCard({ title, value, icon: Icon, color }: StatsCardProps) {
  const colors = colorVariants[color];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-xl bg-gradient-to-r ${colors.bg}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
} 