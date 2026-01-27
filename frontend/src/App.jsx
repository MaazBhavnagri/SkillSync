"use client"

import { useState, useEffect } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { ThemeProvider } from "./contexts/ThemeContext"
import { AuthProvider, useAuth } from "./contexts/AuthContext"
import Navbar from "./components/Navbar"
import AuthPage from "./pages/AuthPage"
import Dashboard from "./pages/Dashboard"
import Upload from "./pages/Upload"
import Results from "./pages/Results"
import History from "./pages/History"
import Settings from "./pages/Settings"
import SkillLab from "./pages/SkillLab"
import ExerciseDetail from "./pages/ExerciseDetail"
import VideoComparison from "./pages/VideoComparison"
import PoseLibrary from "./pages/PoseLibrary"
import LoadingScreen from "./components/LoadingScreen"
import "./App.css"


function AppContent() {
  const { isAuthenticated, loading } = useAuth()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2000)
    return () => clearTimeout(timer)
  }, [])
  useEffect(() => {
  console.log('isLoading:', isLoading, 'loading:', loading)
}, [isLoading, loading])

  if (isLoading || loading) {
    return <LoadingScreen />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 transition-all duration-500">
      <AnimatePresence mode="wait">
        {!isAuthenticated ? (
          <AuthPage key="auth" />
        ) : (
          <motion.div
            key="app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col min-h-screen"
          >
            <Navbar />
            <main className="flex-1 pt-16">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                {/* Skill Lab replaces the old Upload page route */}
                <Route path="/pose-library" element={<PoseLibrary />} />
                <Route path="/skill-lab" element={<SkillLab />} />
                {/* Exercise detail view for a specific skill */}
                <Route path="/skill-lab/:exerciseId" element={<ExerciseDetail />} />

                <Route path="/results/:uploadId" element={<Results />} />
                <Route path="/results" element={<Results />} />
                <Route path="/history" element={<History />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/video-comparison" element={<VideoComparison />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
