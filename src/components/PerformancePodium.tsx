import { useState } from 'react';
import { Trophy, Medal, Award, ChevronDown, ChevronUp, ArrowUpDown } from 'lucide-react';
import clsx from 'clsx';

interface Performer {
  id: string;
  name: string;
  value: number;
  percentage: number;
  color?: string;
}

interface PerformancePodiumProps {
  performers: Performer[];
  title?: string;
  valueLabel?: string;
  className?: string;
}

const formatNumber = (n: number) => n.toLocaleString();
const formatPercentage = (n: number) => `${n.toFixed(1)}%`;

const getPercentageColor = (percentage: number) => {
  if (percentage >= 90) return 'text-green-600';
  if (percentage >= 70) return 'text-blue-600';
  return 'text-red-600';
};

const getFairnessIcon = (performer: Performer, allPerformers: Performer[]) => {
  const highestSales = Math.max(...allPerformers.map(p => p.value));
  const isHighestSales = performer.value === highestSales;
  
  if (isHighestSales) {
    return { icon: '✅', label: 'الأعلى مبيعًا', color: 'text-green-600' };
  } else if (performer.percentage > 100) {
    return { icon: '✔️', label: 'تجاوز الهدف', color: 'text-green-600' };
  } else if (performer.percentage >= 80) {
    return { icon: '🔵', label: 'أداء جيد', color: 'text-blue-600' };
  } else {
    return { icon: '🔴', label: 'يحتاج تطوير', color: 'text-red-600' };
  }
};

export const PerformancePodium: React.FC<PerformancePodiumProps> = ({ 
  performers, 
  title = 'منصة الأداء', 
  valueLabel = 'المبيعات', 
  className = '' 
}) => {
  const [showFairRanking, setShowFairRanking] = useState(false);

  // Calculate balanced performance ranking for all representatives
  const fairRanking = [...performers]
    .filter(p => p.value > 0)
    .map(performer => ({
      ...performer,
      // Balanced score: 70% sales volume + 30% achievement percentage
      fairScore: (performer.value * 0.7) + (performer.percentage * 0.3),
      // Calculate target based on sales and achievement percentage
      target: performer.value / (performer.percentage / 100)
    }))
    .sort((a, b) => b.fairScore - a.fairScore);

  // Get top 3 by sales value for the podium
  const top3ByAchievement = [...performers]
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);
    
  while (top3ByAchievement.length < 3) top3ByAchievement.push({ id: `empty-${top3ByAchievement.length}`, name: '', value: 0, percentage: 0 });
  const [second, first, third] = [top3ByAchievement[1], top3ByAchievement[0], top3ByAchievement[2]];
  const maxValue = Math.max(...top3ByAchievement.map(p => p.value || 1));
  const getHeight = (val: number) => `${Math.max((val / maxValue) * 100, 20)}%`;

  return (
    <div dir="rtl" className={`bg-gradient-to-b from-blue-50 to-white rounded-xl p-6 shadow-xl ${className}`}>
      {title && <h2 className="text-xl font-bold text-center mb-6">{title}</h2>}
      <div className="flex items-end justify-center gap-6 flex-wrap md:flex-nowrap">
        <div className="flex flex-col items-center w-24">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-600 to-amber-800 rounded-full flex items-center justify-center text-white text-lg font-bold shadow" title={third.name}>
            {third.name?.charAt(0) || '-'}
          </div>
          <p className="truncate text-sm mt-1 font-medium text-center w-full" title={third.name}>{third.name || '-'}</p>
          <p className="text-xs text-gray-500">{formatNumber(third.value)}</p>
          <p className={clsx('text-xs font-medium', getPercentageColor(third.percentage))}>{formatPercentage(third.percentage)}</p>
          <div className="bg-amber-700 w-full text-white font-bold text-sm text-center rounded-t mt-1 shadow h-5 flex items-center justify-center">
            <Award className="w-4 h-4 ml-1" />3
          </div>
          <div className="w-full bg-amber-300 rounded-t shadow" style={{ height: getHeight(third.value) }} />
        </div>

        <div className="flex flex-col items-center w-28 scale-110">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-white text-xl font-bold shadow border-2 border-white" title={first.name}>
            {first.name?.charAt(0) || '-'}
          </div>
          <p className="truncate text-sm mt-1 font-medium text-center w-full" title={first.name}>{first.name || '-'}</p>
          <p className="text-xs text-gray-500">{formatNumber(first.value)}</p>
          <p className={clsx('text-xs font-bold', getPercentageColor(first.percentage))}>{formatPercentage(first.percentage)}</p>
          <div className="bg-yellow-500 w-full text-white font-bold text-sm text-center rounded-t mt-1 shadow h-6 flex items-center justify-center">
            <Trophy className="w-5 h-5 ml-1" />1
          </div>
          <div className="w-full bg-yellow-300 rounded-t shadow-lg" style={{ height: getHeight(first.value) }} />
        </div>

        <div className="flex flex-col items-center w-24">
          <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white text-lg font-bold shadow" title={second.name}>
            {second.name?.charAt(0) || '-'}
          </div>
          <p className="truncate text-sm mt-1 font-medium text-center w-full" title={second.name}>{second.name || '-'}</p>
          <p className="text-xs text-gray-500">{formatNumber(second.value)}</p>
          <p className={clsx('text-xs font-medium', getPercentageColor(second.percentage))}>{formatPercentage(second.percentage)}</p>
          <div className="bg-gray-500 w-full text-white font-bold text-sm text-center rounded-t mt-1 shadow h-5 flex items-center justify-center">
            <Medal className="w-4 h-4 ml-1" />2
          </div>
          <div className="w-full bg-gray-300 rounded-t shadow" style={{ height: getHeight(second.value) }} />
        </div>
      </div>

      <div className="text-center text-xs text-gray-500 mt-4 mb-2">{valueLabel}</div>

      <div className="mt-4 border-t border-gray-200 pt-4">
        <button 
          onClick={() => setShowFairRanking(!showFairRanking)}
          className="flex items-center justify-between w-full text-right text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          <span className="flex items-center">
            {showFairRanking ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
            تصنيف الأداء المتوازن
          </span>
          <span className="text-xs text-gray-500">مقياس متوازن للمبيعات والأهداف</span>
        </button>

        {showFairRanking && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-right font-medium text-gray-700">الترتيب</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700">اسم المندوب</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700">
                    <div className="flex items-center justify-end">
                      <ArrowUpDown className="w-3 h-3 ml-1" />
                      المبيعات
                    </div>
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700">الهدف</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700">نسبة التحقق</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700">مقياس الأداء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {fairRanking.map((performer, index) => {
                  const fairnessInfo = getFairnessIcon(performer, performers);
                  return (
                    <tr key={performer.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-center font-bold">{index + 1}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ml-2 ${
                            index === 0 ? 'bg-yellow-500' : 
                            index === 1 ? 'bg-gray-400' : 
                            index === 2 ? 'bg-amber-600' : 'bg-blue-500'
                          }`}>
                            {performer.name.charAt(0)}
                          </div>
                          <span className="truncate max-w-[120px]" title={performer.name}>{performer.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-medium tabular-nums">{formatNumber(performer.value)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatNumber(performer.target)}</td>
                      <td className={`px-3 py-2 text-right font-medium tabular-nums ${getPercentageColor(performer.percentage)}`}>{formatPercentage(performer.percentage)}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center">
                          <span className={`ml-1 ${fairnessInfo.color}`}>{fairnessInfo.icon}</span>
                          <span className="text-xs">{fairnessInfo.label}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};