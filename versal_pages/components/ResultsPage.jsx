"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AlertCircle, CheckCircle, TrendingUp, Download, Share } from "lucide-react"

export default function ResultsPage() {
  const [activeTab, setActiveTab] = useState("current")

  const currentResult = {
    exercise: "Push-ups",
    overallScore: 87,
    date: "2024-01-15",
    errors: [
      { type: "Form Issue", message: "Elbows flaring out too wide", severity: "medium" },
      { type: "Range of Motion", message: "Not going down far enough", severity: "high" },
    ],
    suggestions: [
      { type: "Improvement", message: "Keep elbows closer to your body (45° angle)" },
      { type: "Technique", message: "Lower your chest to within 2 inches of the ground" },
      { type: "Breathing", message: "Exhale on the way up, inhale on the way down" },
    ],
    metrics: {
      reps: 15,
      duration: "45s",
      avgSpeed: "3s per rep",
      consistency: "92%",
    },
  }

  const pastResults = [
    { date: "2024-01-12", exercise: "Push-ups", score: 82 },
    { date: "2024-01-10", exercise: "Squats", score: 91 },
    { date: "2024-01-08", exercise: "Push-ups", score: 78 },
    { date: "2024-01-05", exercise: "Lunges", score: 85 },
  ]

  const ScoreGauge = ({ score }) => {
    const circumference = 2 * Math.PI * 45
    const strokeDasharray = circumference
    const strokeDashoffset = circumference - (score / 100) * circumference

    return (
      <div className="relative w-32 h-32">
        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-gray-200 dark:text-gray-700"
          />
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`${score >= 90 ? "text-green-500" : score >= 70 ? "text-yellow-500" : "text-red-500"}`}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-gray-800 dark:text-white">{score}%</span>
        </div>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">Analysis Results</h1>
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={() => setActiveTab("current")}
            className={`px-6 py-2 rounded-xl font-medium transition-all ${
              activeTab === "current"
                ? "bg-blue-500 text-white shadow-lg"
                : "bg-white/70 dark:bg-gray-800/70 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800"
            }`}
          >
            Current Result
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-6 py-2 rounded-xl font-medium transition-all ${
              activeTab === "history"
                ? "bg-blue-500 text-white shadow-lg"
                : "bg-white/70 dark:bg-gray-800/70 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800"
            }`}
          >
            Compare with History
          </button>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {activeTab === "current" ? (
          <motion.div
            key="current"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* Left Panel - Video/Image with Pose */}
            <div className="space-y-6">
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/20">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Your Form Analysis</h3>
                <div className="relative bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden">
                  <img
                    src="/placeholder.svg?height=300&width=400"
                    alt="Exercise analysis with pose overlay"
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <p className="text-sm font-medium">{currentResult.exercise}</p>
                    <p className="text-xs opacity-80">{currentResult.date}</p>
                  </div>
                </div>
              </div>

              {/* Metrics */}
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/20">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Performance Metrics</h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(currentResult.metrics).map(([key, value]) => (
                    <div key={key} className="text-center">
                      <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Panel - Feedback */}
            <div className="space-y-6">
              {/* Overall Score */}
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/20 text-center">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Overall Score</h3>
                <ScoreGauge score={currentResult.overallScore} />
                <p className="mt-4 text-gray-600 dark:text-gray-400">
                  {currentResult.overallScore >= 90
                    ? "Excellent form!"
                    : currentResult.overallScore >= 70
                      ? "Good form with room for improvement"
                      : "Needs improvement"}
                </p>
              </div>

              {/* Errors */}
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/20">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  Issues Found
                </h3>
                <div className="space-y-3">
                  {currentResult.errors.map((error, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-4 rounded-xl border-l-4 ${
                        error.severity === "high"
                          ? "bg-red-50 dark:bg-red-900/20 border-red-500"
                          : "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500"
                      }`}
                    >
                      <p className="font-medium text-gray-800 dark:text-white">{error.type}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{error.message}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Suggestions */}
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/20">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Improvement Tips
                </h3>
                <div className="space-y-3">
                  {currentResult.suggestions.map((suggestion, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 + 0.3 }}
                      className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border-l-4 border-green-500"
                    >
                      <p className="font-medium text-gray-800 dark:text-white">{suggestion.type}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{suggestion.message}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 bg-blue-500 text-white py-3 px-4 rounded-xl font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Report
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 bg-green-500 text-white py-3 px-4 rounded-xl font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Share className="w-4 h-4" />
                  Share Results
                </motion.button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="history"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/20"
          >
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Progress Over Time
            </h3>

            {/* Progress Chart */}
            <div className="mb-8">
              <div className="flex items-end justify-between h-48 gap-4">
                {pastResults.map((result, index) => (
                  <motion.div
                    key={index}
                    initial={{ height: 0 }}
                    animate={{ height: `${result.score}%` }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    className="flex-1 bg-gradient-to-t from-blue-500 to-purple-500 rounded-t-lg relative"
                  >
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-sm font-medium text-gray-600 dark:text-gray-400">
                      {result.score}%
                    </div>
                    <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 dark:text-gray-400 text-center">
                      <div>
                        {result.date.split("-")[2]}/{result.date.split("-")[1]}
                      </div>
                      <div className="text-xs opacity-75">{result.exercise}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Comparison Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">+5%</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Improvement from last session</p>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">84%</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Average score this month</p>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">12</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Sessions completed</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
