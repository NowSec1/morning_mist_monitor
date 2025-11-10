import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';

interface WeatherAlertProps {
  fogProbability: number;
  location: string;
}

export default function WeatherAlert({ fogProbability, location }: WeatherAlertProps) {
  const [isVisible, setIsVisible] = useState(true);

  // 只有当晨雾概率超过80%时才显示预警
  if (fogProbability < 80 || !isVisible) {
    return null;
  }

  const getAlertConfig = () => {
    if (fogProbability >= 90) {
      return {
        title: '🚨 极高晨雾概率预警',
        description: `${location} 明天早晨晨雾概率达 ${fogProbability.toFixed(0)}%，极有可能出现浓雾。建议提前出发，准备防雾措施。`,
        bgColor: 'bg-red-50 dark:bg-red-950',
        borderColor: 'border-red-300 dark:border-red-700',
        textColor: 'text-red-800 dark:text-red-200',
        iconColor: 'text-red-600 dark:text-red-400',
      };
    } else if (fogProbability >= 85) {
      return {
        title: '⚠️ 高晨雾概率预警',
        description: `${location} 明天早晨晨雾概率达 ${fogProbability.toFixed(0)}%，很可能出现晨雾。建议提前规划行程。`,
        bgColor: 'bg-orange-50 dark:bg-orange-950',
        borderColor: 'border-orange-300 dark:border-orange-700',
        textColor: 'text-orange-800 dark:text-orange-200',
        iconColor: 'text-orange-600 dark:text-orange-400',
      };
    } else {
      return {
        title: '⚠️ 晨雾概率预警',
        description: `${location} 明天早晨晨雾概率达 ${fogProbability.toFixed(0)}%，可能出现晨雾。建议关注天气变化。`,
        bgColor: 'bg-yellow-50 dark:bg-yellow-950',
        borderColor: 'border-yellow-300 dark:border-yellow-700',
        textColor: 'text-yellow-800 dark:text-yellow-200',
        iconColor: 'text-yellow-600 dark:text-yellow-400',
      };
    }
  };

  const config = getAlertConfig();

  return (
    <div
      className={`${config.bgColor} border-l-4 ${config.borderColor} p-4 mb-6 rounded-r-lg shadow-md`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <AlertTriangle className={`${config.iconColor} flex-shrink-0 w-6 h-6 mt-0.5`} />
          <div>
            <h3 className={`${config.textColor} font-bold text-lg mb-1`}>
              {config.title}
            </h3>
            <p className={`${config.textColor} text-sm leading-relaxed`}>
              {config.description}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className={`${config.textColor} hover:opacity-70 flex-shrink-0 ml-4`}
          aria-label="关闭预警"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

