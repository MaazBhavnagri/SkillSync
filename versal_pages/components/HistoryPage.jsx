"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Calendar, TrendingUp, Award, ChevronDown, ChevronRight, Filter } from "lucide-react"

export default function HistoryPage() {
  const [expandedItem, setExpandedItem] = useState(null)
  const [filterType, setFilterType] = useState("all")

  const historyData = [
    {
      id: 1,
      date: "2024-01-15",
      time: "14:30",
      exercise: "Push-ups",
      score: 87,
      reps: 15,
      duration: "45s",
      improvements: ["Better elbow positioning", "Improved range of motion"],
      issues: ["Slight form inconsistency in last 3 reps"],
    },
    {
      id: 2,
      date: "2024-01-12",
      time: "09:15",
      exercise: "Squats",
      score: 91,
      reps: 20,
      duration: "1m 20s",
      improvements: ["Perfect depth achieved", "Excellent knee tracking"],
      issues: [],
    },
    {
      id: 3,
      date: "2024-01-10",
      time: "16:45",
      exercise: "Push-ups",
      score: 82,
      reps: 12,
      duration: "40s",
      improvements: ["Good core engagement"],
      issues: ["Elbows flaring too wide", "Inconsistent tempo"],
    },
    {
      id: 4,
      date: "2024-01-08",
      time: "11:20",
      exercise: "Lunges",
      score: 85,
      reps: 16,
      duration: "1m 10s",
      improvements: ["Good balance throughout", "Proper knee alignment"],
      issues: ["Could go deeper on some reps"],
    },
    {
      id: 5,
      date: "2024-01-05",
      time: "08:30",
      exercise: "Planks",
      score: 94,
      reps: 1,
      duration: "2m 15s",
      improvements: ["Excellent form maintained", "Strong core engagement"],
      issues: [],
    },
  ]

  const exerciseTypes = ["all", "Push-ups", "Squats", "Lunges", "Planks"]

  const filteredData = filterType === "all" ? historyData : historyData.filter((item) => item.exercise === filterType)

  const getScoreColor = (score) => {
    if (score >= 90) return "text-green-500 bg-green-100 dark:bg-green-900/20"
    if (score >= 70) return "text-yellow-500 bg-yellow-100 dark:bg-yellow-900/20"
    return "text-red-500 bg-red-100 dark:bg-red-900/20"
  }

  const toggleExpanded = (id) => {
    setExpandedItem(expandedItem === id ? null : id)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">Exercise History</h1>
        <p className="text-gray-600 dark:text-gray-300">Track your progress and improvements over time</p>
      </motion.div>

      {/* Stats Overview */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
      >
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/20 text-center">
          <Calendar className="w-8 h-8 text-blue-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-800 dark:text-white">{historyData.length}</p>
          <p className="text-gray-600 dark:text-gray-400">Total Sessions</p>
        </div>
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/20 text-center">
          <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-800 dark:text-white">
            {Math.round(historyData.reduce((acc, item) => acc + item.score, 0) / historyData.length)}%
          </p>
          <p className="text-gray-600 dark:text-gray-400">Average Score</p>
        </div>
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/20 text-center">
          <Award className="w-8 h-8 text-purple-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-800 dark:text-white">
            {Math.max(...historyData.map((item) => item.score))}%
          </p>
          <p className="text-gray-600 dark:text-gray-400">Best Score</p>
        </div>
      </motion.div>

      {/* Filter */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <div className="flex items-center gap-4 bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-4 shadow-lg border border-white/20">
          <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-transparent border-none outline-none text-gray-800 dark:text-white font-medium"
          >
            {exerciseTypes.map((type) => (
              <option key={type} value={type} className="bg-white dark:bg-gray-800">
                {type === "all" ? "All Exercises" : type}
              </option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Timeline */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        {filteredData.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 overflow-hidden"
          >
            <div
              className="p-6 cursor-pointer hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors"
              onClick={() => toggleExpanded(item.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${getScoreColor(item.score)}`}
                    >
                      {item.score}%
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{item.exercise}</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {item.date} at {item.time}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {item.reps} reps • {item.duration}
                    </p>
                  </div>
                  <motion.div animate={{ rotate: expandedItem === item.id ? 90 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </motion.div>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {expandedItem === item.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border-t border-gray-200 dark:border-gray-700"
                >
                  <div className="p-6 space-y-4">
                    {/* Performance Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <p className="text-lg font-bold text-gray-800 dark:text-white">{item.score}%</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Score</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <p className="text-lg font-bold text-gray-800 dark:text-white">{item.reps}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Reps</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <p className="text-lg font-bold text-gray-800 dark:text-white">{item.duration}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Duration</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <p className="text-lg font-bold text-gray-800 dark:text-white">
                          {item.improvements.length + item.issues.length}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Feedback</p>
                      </div>
                    </div>

                    {/* Improvements */}
                    {item.improvements.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2 flex items-center gap-2">
                          <Award className="w-4 h-4" />
                          Improvements
                        </h4>
                        <ul className="space-y-1">
                          {item.improvements.map((improvement, idx) => (
                            <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                              {improvement}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Issues */}
                    {item.issues.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
                          <ChevronDown className="w-4 h-4" />
                          Areas for Improvement
                        </h4>
                        <ul className="space-y-1">
                          {item.issues.map((issue, idx) => (
                            <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                              <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                              {issue}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </motion.div>

      {filteredData.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">No exercises found</h3>
          <p className="text-gray-500 dark:text-gray-500">
            Try adjusting your filter or upload your first exercise video!
          </p>
        </motion.div>
      )}
    </motion.div>
  )
}
