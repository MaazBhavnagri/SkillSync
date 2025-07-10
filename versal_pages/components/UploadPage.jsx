"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, Video, ImageIcon, CheckCircle, X, Play } from "lucide-react"
import { useNavigate } from "react-router-dom"

export default function UploadPage() {
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState(null)
  const [exerciseType, setExerciseType] = useState("")
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef(null)
  const navigate = useNavigate()

  const exerciseTypes = ["Push-ups", "Squats", "Lunges", "Planks", "Burpees", "Pull-ups", "Deadlifts", "Bicep Curls"]

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFile = (selectedFile) => {
    if (selectedFile && (selectedFile.type.startsWith("video/") || selectedFile.type.startsWith("image/"))) {
      setFile(selectedFile)
    }
  }

  const handleSubmit = async () => {
    if (!file || !exerciseType) return

    setUploading(true)
    setUploadProgress(0)

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            navigate("/results")
          }, 500)
          return 100
        }
        return prev + Math.random() * 15
      })
    }, 200)
  }

  const removeFile = () => {
    setFile(null)
    setUploadProgress(0)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto px-4 py-8">
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">Upload Your Exercise Video</h1>
        <p className="text-gray-600 dark:text-gray-300 text-lg">Get AI-powered feedback to improve your form</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {/* File Upload */}
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/20">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Select File</h3>

            <div
              className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
                dragActive
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-300 dark:border-gray-600 hover:border-blue-400"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*,image/*"
                onChange={(e) => handleFile(e.target.files[0])}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />

              <AnimatePresence>
                {!file ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">Drop your file here</p>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">or click to browse</p>
                    <p className="text-sm text-gray-400">Supports: MP4, MOV, JPG, PNG (Max 50MB)</p>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative"
                  >
                    <div className="flex items-center justify-center gap-4 mb-4">
                      {file.type.startsWith("video/") ? (
                        <Video className="w-12 h-12 text-blue-500" />
                      ) : (
                        <ImageIcon className="w-12 h-12 text-green-500" />
                      )}
                      <div className="text-left">
                        <p className="font-medium text-gray-800 dark:text-white">{file.name}</p>
                        <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>

                    <button
                      onClick={removeFile}
                      className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    {file.type.startsWith("video/") && (
                      <div className="mt-4 relative">
                        <video src={URL.createObjectURL(file)} className="w-full h-32 object-cover rounded-lg" muted />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Play className="w-8 h-8 text-white bg-black/50 rounded-full p-1" />
                        </div>
                      </div>
                    )}

                    {file.type.startsWith("image/") && (
                      <img
                        src={URL.createObjectURL(file) || "/placeholder.svg"}
                        alt="Preview"
                        className="mt-4 w-full h-32 object-cover rounded-lg"
                      />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Exercise Type Selection */}
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/20">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Exercise Type</h3>
            <select
              value={exerciseType}
              onChange={(e) => setExerciseType(e.target.value)}
              className="w-full p-4 bg-white/50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            >
              <option value="">Select exercise type...</option>
              {exerciseTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* Preview & Submit */}
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-6"
        >
          {/* Analysis Preview */}
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/20">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">What You'll Get</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-gray-700 dark:text-gray-300">Form analysis with pose detection</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-gray-700 dark:text-gray-300">Personalized improvement suggestions</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-gray-700 dark:text-gray-300">Overall performance score</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-gray-700 dark:text-gray-300">Progress tracking over time</span>
              </div>
            </div>
          </div>

          {/* Upload Progress */}
          <AnimatePresence>
            {uploading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/20"
              >
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Analyzing Your Form...</h3>
                <div className="space-y-4">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full"
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <p className="text-center text-gray-600 dark:text-gray-400">{Math.round(uploadProgress)}% Complete</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: file && exerciseType && !uploading ? 1.02 : 1 }}
            whileTap={{ scale: file && exerciseType && !uploading ? 0.98 : 1 }}
            onClick={handleSubmit}
            disabled={!file || !exerciseType || uploading}
            className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all duration-300 ${
              file && exerciseType && !uploading
                ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl"
                : "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
            }`}
          >
            {uploading ? "Analyzing..." : "Submit for Analysis"}
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  )
}
