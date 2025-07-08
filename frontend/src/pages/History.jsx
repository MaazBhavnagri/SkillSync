"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Calendar, Play, ChevronDown, ChevronUp, TrendingUp, Award, Target, Clock } from "lucide-react"

const History = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [expandedItem, setExpandedItem] = useState(null)
  const [sortBy, setSortBy] = useState("date")

  const historyData = [
    {
      id: 1,
      title: "Basketball Free Throw",
      date: "2024-01-15",
      time: "14:30",
      score: 85,
      category: "sports",
      thumbnail: "/placeholder.svg?height=80&width=120",
      duration: "00:15",
      type: "video",
      improvements: ["Follow through", "Elbow alignment"],
      strengths: ["Stance", "Balance"],
      trend: "up",
    },
    {
      id: 2,
      title: "Guitar Chord Practice",
      date: "2024-01-14",
      time: "16:45",
      score: 92,
      category: "music",
      thumbnail: "/placeholder.svg?height=80&width=120",
      duration: "00:30",
      type: "video",
      improvements: ["Finger positioning"],
      strengths: ["Rhythm", "Timing", "Chord transitions"],
      trend: "up",
    },
    {
      id: 3,
      title: "Yoga Warrior Pose",
      date: "2024-01-13",
      time: "09:15",
      score: 78,
      category: "fitness",
      thumbnail: "/placeholder.svg?height=80&width=120",
      duration: "00:20",
      type: "image",
      improvements: ["Hip alignment", "Core engagement"],
      strengths: ["Balance"],
      trend: "down",
    },
    {
      id: 4,
      title: "Piano Scales",
      date: "2024-01-12",
      time: "19:20",
      score: 88,
      category: "music",
      thumbnail: "/placeholder.svg?height=80&width=120",
      duration: "00:45",
      type: "video",
      improvements: ["Hand positioning"],
      strengths: ["Tempo", "Accuracy"],
      trend: "up",
    },
    {
      id: 5,
      title: "Tennis Serve",
      date: "2024-01-11",
      time: "11:30",
      score: 73,
      category: "sports",
      thumbnail: "/placeholder.svg?height=80&width=120",
      duration: "00:25",
      type: "video",
      improvements: ["Ball toss", "Follow through", "Footwork"],
      strengths: ["Power"],
      trend: "stable",
    },
  ]

  const filters = [
    { value: "all", label: "All Skills", count: historyData.length },
    { value: "sports", label: "Sports", count: historyData.filter((item) => item.category === "sports").length },
    { value: "music", label: "Music", count: historyData.filter((item) => item.category === "music").length },
    { value: "fitness", label: "Fitness", count: historyData.filter((item) => item.category === "fitness").length },
  ]

  const filteredData = historyData.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = selectedFilter === "all" || item.category === selectedFilter
    return matchesSearch && matchesFilter
  })

  const sortedData = [...filteredData].sort((a, b) => {
    switch (sortBy) {
      case "date":
        return new Date(b.date) - new Date(a.date)
      case "score":
        return b.score - a.score
      case "title":
        return a.title.localeCompare(b.title)
      default:
        return 0
    }
  })

  const getScoreColor = (score) => {
    if (score >= 85) return "text-green-600 dark:text-green-400"
    if (score >= 70) return "text-yellow-600 dark:text-yellow-400"
    return "text-red-600 dark:text-red-400"
  }

  const getTrendIcon = (trend) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-green-500" />
      case "down":
        return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />
      default:
        return <Target className="w-4 h-4 text-gray-500" />
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Practice History</h1>
        <p className="text-gray-600 dark:text-gray-400">Track your progress and review past performances</p>
      </motion.div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20 dark:border-gray-700/20"
      >
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search your skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <motion.button
                key={filter.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedFilter(filter.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  selectedFilter === filter.value
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {filter.label} ({filter.count})
              </motion.button>
            ))}
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 pr-8 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="date">Sort by Date</option>
              <option value="score">Sort by Score</option>
              <option value="title">Sort by Title</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </motion.div>

      {/* History List */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="space-y-4">
        <AnimatePresence>
          {sortedData.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 dark:border-gray-700/20 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center space-x-4">
                  {/* Thumbnail */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={item.thumbnail || "/placeholder.svg"}
                      alt={item.title}
                      className="w-20 h-14 rounded-lg object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                      <Play className="w-4 h-4 text-white" />
                    </div>
                    <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 rounded">
                      {item.duration}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{item.title}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(item.date)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{item.time}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        {/* Score */}
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${getScoreColor(item.score)}`}>{item.score}%</div>
                          <div className="flex items-center space-x-1">
                            {getTrendIcon(item.trend)}
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {item.trend === "up" ? "Improving" : item.trend === "down" ? "Declining" : "Stable"}
                            </span>
                          </div>
                        </div>

                        {/* Expand Button */}
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                        >
                          {expandedItem === item.id ? (
                            <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                          )}
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {expandedItem === item.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Strengths */}
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                            <Award className="w-4 h-4 text-green-500 mr-2" />
                            Strengths
                          </h4>
                          <div className="space-y-2">
                            {item.strengths.map((strength, idx) => (
                              <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="flex items-center space-x-2"
                              >
                                <div className="w-2 h-2 bg-green-500 rounded-full" />
                                <span className="text-sm text-gray-700 dark:text-gray-300">{strength}</span>
                              </motion.div>
                            ))}
                          </div>
                        </div>

                        {/* Areas for Improvement */}
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                            <Target className="w-4 h-4 text-yellow-500 mr-2" />
                            Areas for Improvement
                          </h4>
                          <div className="space-y-2">
                            {item.improvements.map((improvement, idx) => (
                              <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="flex items-center space-x-2"
                              >
                                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                                <span className="text-sm text-gray-700 dark:text-gray-300">{improvement}</span>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-3 mt-6">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                        >
                          View Details
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                        >
                          Practice Again
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {sortedData.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <div className="text-gray-400 dark:text-gray-600 mb-4">
              <Search className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No results found</h3>
            <p className="text-gray-600 dark:text-gray-400">Try adjusting your search or filter criteria</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

export default History
