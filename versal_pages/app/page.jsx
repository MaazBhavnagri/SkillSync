"use client"

import { useState } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { AnimatePresence } from "framer-motion"
import AuthPage from "./components/AuthPage"
import Dashboard from "./components/Dashboard"
import UploadPage from "./components/UploadPage"
import ResultsPage from "./components/ResultsPage"
import HistoryPage from "./components/HistoryPage"
import SettingsPage from "./components/SettingsPage"
import Navbar from "./components/Navbar"

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [user, setUser] = useState({
    name: "Alex Johnson",
    email: "alex@example.com",
    level: 12,
    xp: 2450,
    avatar: "/placeholder.svg?height=80&width=80",
  })

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  if (!isAuthenticated) {
    return (
      <div className={darkMode ? "dark" : ""}>
        <AuthPage onLogin={() => setIsAuthenticated(true)} />
      </div>
    )
  }

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 transition-colors duration-500">
        <Router>
          <Navbar user={user} onLogout={() => setIsAuthenticated(false)} />
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Dashboard user={user} />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/results" element={<ResultsPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route
                path="/settings"
                element={
                  <SettingsPage user={user} setUser={setUser} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
                }
              />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </AnimatePresence>
        </Router>
      </div>
    </div>
  )
}
