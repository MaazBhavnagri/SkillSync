"use client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Calendar,
  Play,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Award,
  Target,
  Clock,
} from "lucide-react";
import { useState, useEffect } from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { useNavigate } from "react-router-dom";

function History() {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedItem, setExpandedItem] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [exerciseType, setExerciseType] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const navigate = useNavigate();

  // Fetch uploads from backend
  useEffect(() => {
    async function fetchUploads() {
      setLoading(true);
      try {
        const API_BASE = (
          import.meta?.env?.VITE_API_BASE_URL || "http://localhost:5000/api"
        ).replace(/\/$/, "");
        const params = new URLSearchParams({
          exercise_type: exerciseType,
          page: String(page),
          per_page: String(perPage),
          sort: sortBy === "score" ? "accuracy" : "date",
          order: sortBy === "title" ? "asc" : "desc",
          _: String(Date.now()),
        });
        const res = await fetch(`${API_BASE}/history?${params.toString()}`, {
          credentials: "include",
        });

        if (!res.ok) throw new Error("Failed to fetch history");
        const { uploads } = await res.json();
        setUploads(uploads);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchUploads();
  }, [exerciseType, page, perPage, sortBy]);

  const exerciseTypes = [
    ...new Set(uploads.map((upload) => upload.exercise_type)),
  ];
  const activeFilterCount = exerciseType
    ? uploads.filter((u) => u.exercise_type === exerciseType).length
    : uploads.length;

  const filters = [
    { value: "", label: "All", count: uploads.length },
    ...exerciseTypes.map((type) => ({
      value: type,
      label: type.charAt(0).toUpperCase() + type.slice(1),
      count: uploads.filter((u) => u.exercise_type === type).length,
    })),
  ];

  const filteredData = uploads.filter(
    (upload) =>
      // Filter by search term (optional)
      upload.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      upload.exercise_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedData = [...filteredData].sort((a, b) => {
    switch (sortBy) {
      case "date":
        return new Date(b.created_at) - new Date(a.created_at);
      case "score":
        return b.accuracy - a.accuracy;
      case "title":
        return a.file_name.localeCompare(b.file_name);
      default:
        return 0;
    }
  });

  const getScoreColor = (score) => {
    if (score >= 85) return "text-green-600 dark:text-green-400";
    if (score >= 70) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case "down":
        return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />;
      default:
        return <Target className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <div className="animate-pulse space-y-8">
          <div className="bg-white/80 dark:bg-gray-900/80 rounded-2xl p-6 h-32"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white/80 dark:bg-gray-900/80 rounded-xl p-6 h-32"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">
            <Search className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Error loading history
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {error}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Practice History
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track your progress and review past performances
        </p>
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
                onClick={() => setExerciseType(filter.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  exerciseType === filter.value
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <AnimatePresence>
          {sortedData.map((upload, index) => (
            <motion.div
              key={upload.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20"
            >
              <div className="p-6">
                <div className="flex items-center space-x-4">
                  {/* Thumbnail */}
                  <div className="relative flex-shrink-0">
                    <video
                      controls
                      muted
                      width="220"
                      height="125"
                      className="rounded-lg"
                    >
                      <source
                        src={`http://localhost:5000/uploads/${upload.file_name}`}
                        type="video/mp4"
                      />
                    </video>

                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg"></div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                          {upload.exercise_type}: {upload.file_name}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {formatDistanceToNow(parseISO(upload.created_at))}{" "}
                              ago
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        {/* Accuracy */}
                        <div className="text-right">
                          <div
                            className={`text-2xl font-bold ${getScoreColor(
                              upload.accuracy
                            )}`}
                          >
                            {Math.round(upload.accuracy)}%
                          </div>
                          <div className="flex items-center space-x-1">
                            {getTrendIcon(upload.trend)}{" "}
                            {/* You may not have trend—can derive or skip */}
                          </div>
                        </div>
                        {/* Expand Button */}
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() =>
                            setExpandedItem(
                              expandedItem === upload.id ? null : upload.id
                            )
                          }
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                        >
                          {expandedItem === upload.id ? (
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
                  {expandedItem === upload.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Form Status */}
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                            Form Status
                          </h4>
                          <span className="text-sm">{upload.form_status}</span>
                        </div>
                        {/* Feedback */}
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                            Feedback
                          </h4>
                          <span className="text-sm">{upload.feedback || "No feedback available"}</span>
                        </div>
                        {/* Corrections (Improvements) */}
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                            Areas for Improvement
                          </h4>
                          {(() => {
                            const allCorrections = upload.corrections
                              ? Object.values(upload.corrections).flat()
                              : [];
                            return allCorrections.length > 0 ? (
                              <div className="space-y-2">
                                {allCorrections.map((item, idx) => (
                                  <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="flex items-center space-x-2"
                                  >
                                    <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                      {item}
                                    </span>
                                  </motion.div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">
                                No corrections needed!
                              </span>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-3 mt-6">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => navigate(`/results/${upload.id}`)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                        >
                          View Details
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => navigate("/upload")}
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
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No results found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your search or filter criteria
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

export default History;
