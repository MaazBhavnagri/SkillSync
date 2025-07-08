"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UploadIcon,
  X,
  Play,
  Pause,
  FileVideo,
  FileImage,
  Check,
  AlertCircle,
  Zap,
} from "lucide-react";
// import {
//   DropdownMenu,
//   DropdownMenuTrigger,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuSeparator
// } from "../components/ui/dropdown-menu";
// import { MoreVertical } from "lucide-react";

const exerciseTypes = [
  "pushup",
  "pullup",
  "squat",
  "deadlift",
  "bench press",
  "overhead press",
  "bicep curl",
  "tricep extension",
  "lunge",
  "plank"
];

const Upload = () => {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(exerciseTypes[0]); // Default to first exercise
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleFiles = (newFiles) => {
    const validFiles = newFiles.filter(
      (file) => file.type.startsWith("video/") || file.type.startsWith("image/")
    );

    const fileObjects = validFiles.map((file) => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type.startsWith("video/") ? "video" : "image",
      url: URL.createObjectURL(file),
      playing: false,
    }));

    setFiles((prev) => [...prev, ...fileObjects]);
  };

  const removeFile = (id) => {
    setFiles((prev) => prev.filter((file) => file.id !== id));
  };

  const togglePlay = (id) => {
    setFiles((prev) =>
      prev.map((file) =>
        file.id === id ? { ...file, playing: !file.playing } : file
      )
    );
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    const formData = new FormData();
    formData.append("file", files[0].file);
    formData.append("exercise_type", selectedExercise); // Use the selected exercise

    setUploading(true);
    try {
      console.log("Request payload:", {
        file: files[0].file.name,
        exercise_type: selectedExercise
      });

      const res = await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        credentials: 'include',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Upload failed");
      }

      const data = await res.json();
      setUploadProgress(100);
      setUploadComplete(true);
      return data;
    } catch (err) {
      console.error("Upload error:", err);
      alert(err.message || "Upload failed. Check console for details.");
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{
            duration: 2,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
          className="inline-block mb-4"
        >
          <Zap className="w-12 h-12 text-blue-600 dark:text-blue-400" />
        </motion.div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Upload Your Skill
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Upload a video or image of yourself performing a skill for AI analysis
        </p>
      </motion.div>

      {/* Exercise Type Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex justify-center"
      >
        <div className="w-full max-w-md">
          <label htmlFor="exercise-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Select Exercise Type
          </label>
          <select
            id="exercise-type"
            value={selectedExercise}
            onChange={(e) => setSelectedExercise(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
          >
            {exerciseTypes.map((exercise) => (
              <option key={exercise} value={exercise}>
                {exercise.charAt(0).toUpperCase() + exercise.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Upload Zone */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="relative"
      >
        <motion.div
          animate={
            dragActive
              ? {
                  scale: 1.02,
                  borderColor: "#3B82F6",
                }
              : {}
          }
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
            dragActive
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : "border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-900/50"
          } backdrop-blur-xl`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="video/*,image/*"
            onChange={(e) => handleFiles(Array.from(e.target.files))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          <motion.div
            animate={dragActive ? { scale: 1.1 } : { scale: 1 }}
            className="space-y-4"
          >
            <motion.div
              animate={{
                y: [0, -10, 0],
                rotate: dragActive ? [0, 5, -5, 0] : 0,
              }}
              transition={{
                y: {
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                },
                rotate: { duration: 0.5 },
              }}
              className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${
                dragActive
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
              } transition-all duration-300`}
            >
              <UploadIcon className="w-8 h-8" />
            </motion.div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {dragActive ? "Drop your files here" : "Drag & drop your files"}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                or click to browse your device
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
              >
                Choose Files
              </motion.button>
            </div>

            <div className="text-sm text-gray-500 dark:text-gray-400">
              <p>Supported formats: MP4, MOV, AVI, JPG, PNG, GIF</p>
              <p>Maximum file size: 100MB</p>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Rest of your component remains the same */}
      {/* File Preview */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Selected Files ({files.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {files.map((file, index) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl p-4 shadow-lg border border-white/20 dark:border-gray-700/20"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {file.type === "video" ? (
                        <FileVideo className="w-5 h-5 text-blue-600" />
                      ) : (
                        <FileImage className="w-5 h-5 text-green-600" />
                      )}
                      <span className="font-medium text-gray-900 dark:text-white truncate">
                        {file.name}
                      </span>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => removeFile(file.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors duration-200"
                    >
                      <X className="w-4 h-4" />
                    </motion.button>
                  </div>

                  <div className="relative mb-3 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                    {file.type === "video" ? (
                      <div className="relative">
                        <video
                          src={file.url}
                          className="w-full h-32 object-cover"
                          muted
                        />
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => togglePlay(file.id)}
                          className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors duration-200"
                        >
                          {file.playing ? (
                            <Pause className="w-8 h-8 text-white" />
                          ) : (
                            <Play className="w-8 h-8 text-white" />
                          )}
                        </motion.button>
                      </div>
                    ) : (
                      <img
                        src={file.url || "/placeholder.svg"}
                        alt={file.name}
                        className="w-full h-32 object-cover"
                      />
                    )}
                  </div>

                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Size: {formatFileSize(file.size)}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
        
      {/* Upload Button */}
      <AnimatePresence>
        {files.length > 0 && !uploadComplete && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center"
          >
            <motion.button
              whileHover={{ scale: uploading ? 1 : 1.05 }}
              whileTap={{ scale: uploading ? 1 : 0.95 }}
              onClick={handleUpload}
              disabled={uploading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px]"
            >
              <AnimatePresence mode="wait">
                {uploading ? (
                  <motion.div
                    key="uploading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "linear",
                      }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full mr-2"
                    />
                    Analyzing...
                  </motion.div>
                ) : (
                  <motion.div
                    key="upload"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center"
                  >
                    <UploadIcon className="w-5 h-5 mr-2" />
                    Start Analysis
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            {uploading && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-4 max-w-md mx-auto"
              >
                <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 h-full rounded-full relative"
                  >
                    <motion.div
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{
                        duration: 1,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "linear",
                      }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    />
                  </motion.div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {Math.round(uploadProgress)}% complete
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Success */}
      <AnimatePresence>
        {uploadComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 10 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-green-500 text-white rounded-full mb-4"
            >
              <Check className="w-8 h-8" />
            </motion.div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Upload Successful!
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Your files have been analyzed. Check the results page for
              feedback.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800"
      >
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Tips for Better Analysis
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Ensure good lighting and clear visibility</li>
              <li>• Keep the camera steady and at an appropriate distance</li>
              <li>• Perform the skill slowly and clearly</li>
              <li>• Include the full range of motion in the frame</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Upload;