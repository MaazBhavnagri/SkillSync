import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { TrendingUp, TrendingDown, Target, Award } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
);

function AccuracyGraph({ uploads }) {
  const sortedUploads = useMemo(() => {
    return [...uploads].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  }, [uploads]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (sortedUploads.length === 0) {
      return {
        average: 0,
        highest: 0,
        lowest: 0,
        trend: 0,
        total: 0,
      };
    }

    const accuracies = sortedUploads.map(u => u.accuracy || 0);
    const average = accuracies.reduce((a, b) => a + b, 0) / accuracies.length;
    const highest = Math.max(...accuracies);
    const lowest = Math.min(...accuracies);
    const total = sortedUploads.length;

    // Calculate trend (compare last 3 vs first 3)
    let trend = 0;
    if (sortedUploads.length >= 6) {
      const recent = accuracies.slice(-3).reduce((a, b) => a + b, 0) / 3;
      const earlier = accuracies.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
      trend = recent - earlier;
    } else if (sortedUploads.length >= 2) {
      const recent = accuracies[accuracies.length - 1];
      const earlier = accuracies[0];
      trend = recent - earlier;
    }

    return {
      average: Math.round(average),
      highest: Math.round(highest),
      lowest: Math.round(lowest),
      trend: Math.round(trend * 10) / 10,
      total,
    };
  }, [sortedUploads]);

  const data = {
    labels: sortedUploads.map(upload => {
      const date = new Date(upload.created_at);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
    datasets: [
      {
        label: 'Accuracy Score',
        data: sortedUploads.map(upload => upload.accuracy || 0),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
          gradient.addColorStop(1, 'rgba(59, 130, 246, 0.05)');
          return gradient;
        },
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverBackgroundColor: 'rgb(37, 99, 235)',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 3,
      }
    ]
  };

  // Detect dark mode
  const isDark = typeof window !== 'undefined' && document.documentElement.classList.contains('dark');

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: isDark ? 'rgba(17, 24, 39, 0.95)' : 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold',
        },
        bodyFont: {
          size: 13,
        },
        titleColor: isDark ? 'rgb(243, 244, 246)' : 'rgb(255, 255, 255)',
        bodyColor: isDark ? 'rgb(209, 213, 219)' : 'rgb(255, 255, 255)',
        borderColor: 'rgba(59, 130, 246, 0.5)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: function(context) {
            return `Accuracy: ${context.parsed.y.toFixed(1)}%`;
          },
          title: function(context) {
            return sortedUploads[context[0].dataIndex]?.exercise_type || 'Exercise';
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
          drawBorder: false,
        },
        ticks: {
          color: isDark ? 'rgb(156, 163, 175)' : 'rgb(107, 114, 128)',
          font: {
            size: 12,
          },
          callback: function(value) {
            return value + '%';
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: isDark ? 'rgb(156, 163, 175)' : 'rgb(107, 114, 128)',
          font: {
            size: 12,
          },
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
  };

  if (sortedUploads.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-white/20 dark:border-gray-700/20"
      >
        <div className="text-center py-12">
          <Target className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Data Available
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Upload some videos to see your progress graph
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-blue-500" />
              Progress Overview
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Track your accuracy improvements over time
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 border-b border-gray-200 dark:border-gray-700">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Average</span>
            <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.average}%</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4 border border-green-200 dark:border-green-800"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-700 dark:text-green-300">Highest</span>
            <Award className="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.highest}%</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Lowest</span>
            <Target className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          </div>
          <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{stats.lowest}%</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className={`bg-gradient-to-br rounded-xl p-4 border ${
            stats.trend >= 0
              ? 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800'
              : 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${
              stats.trend >= 0
                ? 'text-green-700 dark:text-green-300'
                : 'text-red-700 dark:text-red-300'
            }`}>Trend</span>
            {stats.trend >= 0 ? (
              <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
            )}
          </div>
          <p className={`text-2xl font-bold ${
            stats.trend >= 0
              ? 'text-green-900 dark:text-green-100'
              : 'text-red-900 dark:text-red-100'
          }`}>
            {stats.trend >= 0 ? '+' : ''}{stats.trend}%
          </p>
        </motion.div>
      </div>

      {/* Chart */}
      <div className="p-6">
        <div className="h-80 w-full">
          <Line data={data} options={options} />
        </div>
      </div>
    </motion.div>
  );
}

export default AccuracyGraph;
