import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { Upload, History, TrendingUp, Award, Target, Zap, Play, Star, Calendar, BarChart3, Camera } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"

const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [xpProgress, setXpProgress] = useState(0)
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [recentUploads, setRecentUploads] = useState([])
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(true)

  const currentLevelXP = user?.level * 200 || 0
  const nextLevelXP = ((user?.level || 0) + 1) * 200
  const progressPercentage = ((user?.xp || 0) % 200) / 200 * 100

  useEffect(() => {
    // Animate XP bar on load
    const timer = setTimeout(() => {
      setXpProgress(progressPercentage)
    }, 500)

    return () => clearTimeout(timer)
  }, [progressPercentage])

  // Fetch recent uploads and stats
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const API_BASE = (import.meta?.env?.VITE_API_BASE_URL || "http://localhost:5000/api").replace(/\/$/, "")
        
        // Fetch recent uploads
        const uploadsRes = await fetch(`${API_BASE}/history?page=1&per_page=3&sort=date&order=desc`, {
          credentials: "include",
        })
        
        if (uploadsRes.ok) {
          const uploadsData = await uploadsRes.json()
          setRecentUploads(uploadsData.uploads || [])
        }

        // Calculate stats from uploads
        const allUploadsRes = await fetch(`${API_BASE}/history?per_page=1000`, {
          credentials: "include",
        })
        
        if (allUploadsRes.ok) {
          const allUploadsData = await allUploadsRes.json()
          const uploads = allUploadsData.uploads || []

          const totalUploads = uploads.length
          const last5 = uploads.slice(-5)
          const avgRaw = last5.length
            ? last5.reduce((sum, u) => sum + (Number(u.accuracy) || 0), 0) / last5.length
            : 0
          const averageScore = Number(avgRaw.toFixed(2))

          const skillsImproved = new Set(uploads.map(u => (u.exercise_type || '').toLowerCase())).size
          const achievements = Math.floor(totalUploads / 5)

          setStats([
            { label: "Total Uploads", value: totalUploads.toString(), icon: Upload, color: "blue" },
            { label: "Average Score", value: `${averageScore.toFixed(2)}%`, icon: Target, color: "green" },
            { label: "Skills Improved", value: skillsImproved.toString(), icon: TrendingUp, color: "purple" },
            { label: "Achievements", value: achievements.toString(), icon: Award, color: "yellow" },
          ])
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        // Set default stats if API fails
        setStats([
          { label: "Total Uploads", value: "0", icon: Upload, color: "blue" },
          { label: "Average Score", value: "0%", icon: Target, color: "green" },
          { label: "Skills Improved", value: "0", icon: TrendingUp, color: "purple" },
          { label: "Achievements", value: "0", icon: Award, color: "yellow" },
        ])
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchDashboardData()
    }
  }, [user])

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
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 20,
      },
    },
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours} hours ago`
    if (diffInHours < 48) return "1 day ago"
    return `${Math.floor(diffInHours / 24)} days ago`
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse space-y-8">
          <div className="bg-white/80 dark:bg-gray-900/80 rounded-2xl p-8 h-32"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white/80 dark:bg-gray-900/80 rounded-xl p-6 h-24"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto p-6 space-y-8"
    >
      {/* Welcome Section */}
      <motion.div
        variants={itemVariants}
        className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-white/20 dark:border-gray-700/20"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
          <div className="flex items-center space-x-4 mb-6 md:mb-0">
            <motion.div whileHover={{ scale: 1.1, rotate: 5 }} className="relative">
              <img
                src={user?.avatar_url ? `http://localhost:5000${user.avatar_url}` : "/placeholder-user.jpg"}
                alt="Avatar"
                className="w-16 h-16 rounded-full border-4 border-blue-500 shadow-lg object-cover"
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"
              />
            </motion.div>
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-bold text-gray-900 dark:text-white"
              >
                Welcome back, {user?.name}!
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-gray-600 dark:text-gray-400 mt-1"
              >
                Ready to improve your skills today?
              </motion.p>
            </div>
          </div>

          {/* Level & XP */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-4 text-white min-w-[200px]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm opacity-90">Level {user?.level || 1}</span>
              <Zap className="w-5 h-5" />
            </div>
            <div className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span>{user?.xp || 0} XP</span>
                <span>{nextLevelXP} XP</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${xpProgress}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="bg-white rounded-full h-2 relative overflow-hidden"
                >
                  <motion.div
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  />
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          const colorClasses = {
            blue: "from-blue-500 to-blue-600",
            green: "from-green-500 to-green-600",
            purple: "from-purple-500 to-purple-600",
            yellow: "from-yellow-500 to-yellow-600",
          }

          return (
            <motion.div
              key={stat.label}
              variants={itemVariants}
              whileHover={{
                scale: 1.05,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              }}
              className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl p-6 shadow-lg border border-white/20 dark:border-gray-700/20 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.label}</p>
                  <motion.p
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 + 0.5, type: "spring" }}
                    className="text-2xl font-bold text-gray-900 dark:text-white"
                  >
                    {stat.value}
                  </motion.p>
                </div>
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                  className={`p-3 rounded-lg bg-gradient-to-r ${colorClasses[stat.color]} text-white`}
                >
                  <Icon className="w-6 h-6" />
                </motion.div>
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.button
          whileHover={{ scale: 1.02, y: -5 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/upload")}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-left"
        >
          <Upload className="w-8 h-8 mb-4" />
          <h3 className="text-xl font-bold mb-2">Upload Now</h3>
          <p className="text-white/80">Upload a new skill video or image for AI analysis</p>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02, y: -5 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/video-comparison")}
          className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-left"
        >
          <Camera className="w-8 h-8 mb-4" />
          <h3 className="text-xl font-bold mb-2">Live Comparison Analysis</h3>
          <p className="text-white/80">Side-by-side live feedback with a reference</p>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02, y: -5 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/history")}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/20 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-left"
        >
          <History className="w-8 h-8 mb-4 text-gray-700 dark:text-gray-300" />
          <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">View History</h3>
          <p className="text-gray-600 dark:text-gray-400">Review your past uploads and progress</p>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02, y: -5 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/results")}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/20 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-left"
        >
          <BarChart3 className="w-8 h-8 mb-4 text-gray-700 dark:text-gray-300" />
          <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Latest Results</h3>
          <p className="text-gray-600 dark:text-gray-400">Check your most recent AI feedback</p>
        </motion.button>
      </motion.div>

      {/* Recent Uploads */}
      <motion.div
        variants={itemVariants}
        className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-white/20 dark:border-gray-700/20"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recent Uploads</h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/history")}
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            View All
          </motion.button>
        </div>

        <div className="space-y-4">
          {recentUploads.length > 0 ? (
            recentUploads.map((upload, index) => (
              <motion.div
                key={upload.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 + 0.8 }}
                whileHover={{ scale: 1.02, x: 10 }}
                className="flex items-center space-x-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 cursor-pointer"
                onClick={() => navigate(`/results/${upload.id}`)}
              >
                <div className="relative">
                  <video
                    src={`http://localhost:5000/uploads/${upload.file_name}`}
                    className="w-16 h-12 rounded-lg object-cover"
                    muted
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                    <Play className="w-4 h-4 text-white" />
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {upload.exercise_type}: {upload.file_name}
                  </h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(upload.created_at)}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {Math.round(upload.accuracy)}%
                    </span>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <div className="text-gray-400 dark:text-gray-600 mb-4">
                <Upload className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No uploads yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Start by uploading your first skill video
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/upload")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
              >
                Upload Now
              </motion.button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default Dashboard
