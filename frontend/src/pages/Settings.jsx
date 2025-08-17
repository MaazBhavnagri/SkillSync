"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import {
  User,
  Mail,
  Lock,
  Bell,
  Moon,
  Sun,
  Camera,
  Save,
  LogOut,
  Shield,
  Eye,
  EyeOff,
} from "lucide-react"
import { useTheme } from "../contexts/ThemeContext"
import { useAuth } from "../contexts/AuthContext"

const Settings = () => {
  const { isDark, toggleTheme } = useTheme()
  const { user, logout, updateUser } = useAuth()
  const [activeTab, setActiveTab] = useState("profile")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })
  const fileInputRef = useRef(null)

  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  // Update profile data when user changes
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "",
        email: user.email || "",
      })
    }
  }, [user])

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Shield },
    { id: "preferences", label: "Preferences", icon: Moon },
  ]

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: "", text: "" }), 5000)
  }

  const handleProfilePictureUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      showMessage("error", "Please select a valid image file (JPEG, PNG, or GIF)")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showMessage("error", "Image size should be less than 5MB")
      return
    }

    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const API_BASE = (import.meta?.env?.VITE_API_BASE_URL || "http://localhost:5000/api").replace(/\/$/, "")
      
      const response = await fetch(`${API_BASE}/upload-avatar`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      const data = await response.json()
      
      if (response.ok) {
        updateUser({ avatar_url: data.avatar_url })
        showMessage("success", "Profile picture updated successfully!")
      } else {
        showMessage("error", data.error || "Failed to upload profile picture")
      }
    } catch (error) {
      console.error("Avatar upload error:", error)
      showMessage("error", "Failed to upload profile picture")
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage({ type: "", text: "" })

    try {
      const API_BASE = (import.meta?.env?.VITE_API_BASE_URL || "http://localhost:5000/api").replace(/\/$/, "")

      if (activeTab === "profile") {
        const res = await fetch(`${API_BASE}/settings`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: profileData.name,
            email: profileData.email,
          }),
        })

        const data = await res.json()
        if (res.ok) {
          updateUser({
            name: profileData.name,
            email: profileData.email,
          })
          showMessage("success", "Profile updated successfully!")
        } else {
          showMessage("error", data.error || "Failed to update profile")
        }
      } else if (activeTab === "security") {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
          showMessage("error", "New passwords don't match")
          setSaving(false)
          return
        }

        if (passwordData.newPassword.length < 6) {
          showMessage("error", "Password must be at least 6 characters long")
          setSaving(false)
          return
        }

        const res = await fetch(`${API_BASE}/change-password`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            current_password: passwordData.currentPassword,
            new_password: passwordData.newPassword,
          }),
        })

        const data = await res.json()
        if (res.ok) {
          showMessage("success", "Password changed successfully!")
          setPasswordData({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          })
        } else {
          showMessage("error", data.error || "Failed to change password")
        }
      }
    } catch (error) {
      console.error("Settings save error:", error)
      showMessage("error", "Failed to save settings. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    logout()
  }

  const TabContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div className="space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center space-x-6">
              <div className="relative">
                <motion.img
                  whileHover={{ scale: 1.05 }}
                  src={user?.avatar_url ? `http://localhost:5000${user.avatar_url}` : "/placeholder-user.jpg"}
                  alt="Profile"
                  className="w-20 h-20 rounded-full border-4 border-blue-500 shadow-lg object-cover"
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  <Camera className="w-4 h-4" />
                </motion.button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureUpload}
                  className="hidden"
                />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Profile Picture</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Click the camera icon to upload a new avatar
                </p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-200"
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case "security":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Change Password</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-200"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case "preferences":
        return (
          <div className="space-y-6">
            {/* Theme Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${isDark ? "bg-gray-700" : "bg-yellow-100"}`}>
                  {isDark ? <Moon className="w-5 h-5 text-gray-300" /> : <Sun className="w-5 h-5 text-yellow-600" />}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{isDark ? "Dark Mode" : "Light Mode"}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Switch between light and dark themes</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleTheme}
                className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600 transition-colors duration-200"
              >
                <motion.span
                  animate={{ x: isDark ? 20 : 4 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="inline-block h-4 w-4 transform rounded-full bg-white shadow-lg"
                />
              </motion.button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your account preferences and settings</p>
      </motion.div>

      {/* Message Display */}
      {message.text && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg ${
            message.type === "success" 
              ? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200" 
              : "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200"
          }`}
        >
          {message.text}
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-1"
        >
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-4 shadow-xl border border-white/20 dark:border-gray-700/20">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <motion.button
                    key={tab.id}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                      activeTab === tab.id
                        ? "bg-blue-600 text-white shadow-md"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </motion.button>
                )
              })}
            </nav>

            {/* Logout Button */}
            <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Sign Out</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-3"
        >
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-white/20 dark:border-gray-700/20">
            <TabContent />

            {/* Save Button */}
            {activeTab !== "preferences" && (
              <div className="flex justify-end mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <motion.button
                  whileHover={{ scale: saving ? 1 : 1.05 }}
                  whileTap={{ scale: saving ? 1 : 0.95 }}
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
                >
                  {saving ? (
                    <div className="flex items-center justify-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full mr-2"
                      />
                      Saving...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Save className="w-5 h-5 mr-2" />
                      Save Changes
                    </div>
                  )}
                </motion.button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Settings
