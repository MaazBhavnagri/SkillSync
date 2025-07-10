"use client"

import { motion } from "framer-motion"
import { Upload, TrendingUp, Award, Target, Calendar, Star } from "lucide-react"
import { Link } from "react-router-dom"

export default function Dashboard({ user }) {
  const progressData = [
    { date: "Mon", score: 85 },
    { date: "Tue", score: 78 },
    { date: "Wed", score: 92 },
    { date: "Thu", score: 88 },
    { date: "Fri", score: 95 },
  ]

  const badges = [
    { name: "Perfect Form", icon: Star, color: "text-yellow-500" },
    { name: "5 Day Streak", icon: Calendar, color: "text-green-500" },
    { name: "Form Master", icon: Award, color: "text-purple-500" },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-7xl mx-auto px-4 py-8">
      {/* Welcome Section */}
      <motion.div variants={itemVariants} className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">Welcome back, {user.name}! 👋</h1>
        <p className="text-gray-600 dark:text-gray-300">Ready to perfect your form today?</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
          className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Level</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-white">{user.level}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
          className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">XP Points</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-white">{user.xp}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center">
              <Star className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
          className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">This Week</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-white">12</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
          className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Avg Score</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-white">87%</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-xl flex items-center justify-center">
              <Award className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Progress Chart */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-2 bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/20"
        >
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">Weekly Progress</h3>
          <div className="flex items-end justify-between h-48 gap-4">
            {progressData.map((day, index) => (
              <motion.div
                key={day.date}
                initial={{ height: 0 }}
                animate={{ height: `${day.score}%` }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="flex-1 bg-gradient-to-t from-blue-500 to-purple-500 rounded-t-lg relative"
              >
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-sm font-medium text-gray-600 dark:text-gray-400">
                  {day.score}%
                </div>
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-sm text-gray-600 dark:text-gray-400">
                  {day.date}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Profile & Upload */}
        <div className="space-y-6">
          {/* Profile Card */}
          <motion.div
            variants={itemVariants}
            className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/20"
          >
            <div className="text-center">
              <img
                src={user.avatar || "/placeholder.svg"}
                alt={user.name}
                className="w-20 h-20 rounded-full mx-auto mb-4 border-4 border-white shadow-lg"
              />
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{user.name}</h3>
              <p className="text-gray-600 dark:text-gray-400">Level {user.level} Athlete</p>

              {/* XP Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span>{user.xp} XP</span>
                  <span>{(user.level + 1) * 500} XP</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(user.xp % 500) / 5}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                  ></motion.div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Upload CTA */}
          <motion.div variants={itemVariants}>
            <Link to="/upload">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg cursor-pointer"
              >
                <div className="text-center">
                  <Upload className="w-12 h-12 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Upload New Video</h3>
                  <p className="text-blue-100">Get AI feedback on your form</p>
                </div>
              </motion.div>
            </Link>
          </motion.div>

          {/* Badges */}
          <motion.div
            variants={itemVariants}
            className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/20"
          >
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Recent Badges</h3>
            <div className="space-y-3">
              {badges.map((badge, index) => (
                <motion.div
                  key={badge.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <badge.icon className={`w-6 h-6 ${badge.color}`} />
                  <span className="text-gray-700 dark:text-gray-300">{badge.name}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
