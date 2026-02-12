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
import AccuracyGraph from "../components/AccuracyGraph";

function History() {
  const [uploads, setUploads] = useState([]);
  const [liveSessions, setLiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedItem, setExpandedItem] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [exerciseType, setExerciseType] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [historyFilter, setHistoryFilter] = useState("all"); // 'all' | 'uploads' | 'live'
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

  // Fetch live sessions (separate from uploads)
  useEffect(() => {
    async function fetchLiveSessions() {
      try {
        const API_BASE = (
          import.meta?.env?.VITE_API_BASE_URL || "http://localhost:5000/api"
        ).replace(/\/$/, "");
        const res = await fetch(`${API_BASE}/live-sessions`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch live sessions");
        const data = await res.json();
        setLiveSessions(data.sessions || []);
      } catch (err) {
        console.error("Live sessions fetch error:", err);
      }
    }
    fetchLiveSessions();
  }, []);

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

  const filteredUploadsSection =
    historyFilter === "live"
      ? []
      : sortedData;

  const filteredLiveSessionsSection =
    historyFilter === "uploads"
      ? []
      : liveSessions;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Practice History
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Track your progress, analyze your performance, and review past exercises
          </p>
        </motion.div>

        {/* Accuracy Graph Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <AccuracyGraph uploads={uploads} />
        </motion.div>

        {/* Controls Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20 dark:border-gray-700/20"
        >
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Search */}
            <div className="flex-1 w-full relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search exercises or files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 shadow-sm"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
              {filters.map((filter) => (
                <motion.button
                  key={filter.value}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setExerciseType(filter.value)}
                  className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 text-sm ${
                    exerciseType === filter.value
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/50"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
                  }`}
                >
                  {filter.label} <span className="opacity-75">({filter.count})</span>
                </motion.button>
              ))}
            </div>

            {/* Sort */}
            <div className="relative w-full lg:w-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 pr-10 w-full lg:w-auto text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
              >
                <option value="date">Sort by Date</option>
                <option value="score">Sort by Score</option>
                <option value="title">Sort by Title</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
            </div>
          </div>
        </motion.div>

        {/* History List Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {/* Filter toggle for uploads vs live sessions */}
          <div className="flex flex-wrap items-center justify-between mb-4 gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Clock className="w-6 h-6 text-blue-500" />
                Exercise History
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {[
                { value: "all", label: "All" },
                { value: "uploads", label: "Upload Analysis" },
                { value: "live", label: "Live Sessions" },
              ].map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setHistoryFilter(f.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    historyFilter === f.value
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Upload analyses */}
          <AnimatePresence>
            {filteredUploadsSection.map((upload, index) => (
              <motion.div
                key={upload.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.03 }}
                className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-lg hover:shadow-xl border border-white/20 dark:border-gray-700/20 transition-all duration-300 overflow-hidden group"
              >
                <div className="p-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                    {/* Thumbnail */}
                    <div className="relative flex-shrink-0 w-full md:w-64 h-40 md:h-36 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                      <video
                        controls
                        muted
                        className="w-full h-full object-cover"
                        poster=""
                      >
                        <source
                          src={`http://localhost:5000/uploads/${upload.file_name}`}
                          type="video/mp4"
                        />
                      </video>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 w-full">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-semibold uppercase">
                              {upload.exercise_type || 'Exercise'}
                            </span>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 truncate">
                            {upload.file_name}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {formatDistanceToNow(parseISO(upload.created_at))} ago
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-4 h-4" />
                              <span>{formatDate(upload.created_at)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {/* Accuracy Score */}
                          <div className="text-center md:text-right">
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">
                              Accuracy
                            </div>
                            <div
                              className={`text-3xl font-bold ${getScoreColor(
                                upload.accuracy
                              )}`}
                            >
                              {Math.round(upload.accuracy)}%
                            </div>
                            <div className="flex items-center justify-center md:justify-end gap-1 mt-1">
                              {getTrendIcon(upload.trend)}
                            </div>
                          </div>
                          {/* Expand Button */}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() =>
                              setExpandedItem(
                                expandedItem === upload.id ? null : upload.id
                              )
                            }
                            className="p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 border border-gray-200 dark:border-gray-700"
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
                          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                              <Target className="w-4 h-4 text-blue-500" />
                              Form Status
                            </h4>
                            <p className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 px-3 py-2 rounded-lg">
                              {upload.form_status || "Not available"}
                            </p>
                          </div>
                          
                          {/* Feedback */}
                          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                              <Award className="w-4 h-4 text-green-500" />
                              Feedback
                            </h4>
                            <p className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 px-3 py-2 rounded-lg">
                              {upload.feedback || "No feedback available"}
                            </p>
                          </div>
                          
                          {/* Corrections (Improvements) */}
                          <div className="md:col-span-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-yellow-500" />
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
                                      transition={{ delay: idx * 0.05 }}
                                      className="flex items-start gap-3 bg-white dark:bg-gray-900 px-3 py-2 rounded-lg"
                                    >
                                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                                      <span className="text-sm text-gray-700 dark:text-gray-300">
                                        {item}
                                      </span>
                                    </motion.div>
                                  ))}
                                </div>
                              ) : (
                                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-3">
                                  <span className="text-sm text-green-700 dark:text-green-300 font-medium">
                                    ✓ No corrections needed! Great job!
                                  </span>
                                </div>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-3 mt-6">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate(`/results/${upload.id}`)}
                            className="flex-1 md:flex-none bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg shadow-blue-500/50 flex items-center justify-center gap-2"
                          >
                            <Play className="w-4 h-4" />
                            View Details
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate("/upload")}
                            className="flex-1 md:flex-none bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-xl font-medium transition-all duration-200 border border-gray-200 dark:border-gray-700"
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

          {filteredUploadsSection.length === 0 && historyFilter !== "live" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20"
            >
              <div className="text-gray-400 dark:text-gray-600 mb-4">
                <Search className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No upload analyses found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                Try adjusting your search or filter criteria to find what you're looking for
              </p>
            </motion.div>
          )}

          {/* Live sessions section */}
          {filteredLiveSessionsSection.length > 0 && (
            <div className="mt-10 space-y-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Live Sessions
              </h3>
              <AnimatePresence>
                {filteredLiveSessionsSection.map((session) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-lg hover:shadow-xl border border-white/20 dark:border-gray-700/20 transition-all duration-300 overflow-hidden group"
                  >
                    <div className="p-6 flex flex-col md:flex-row items-start md:items-center gap-4">
                      <div className="flex-1 min-w-0 w-full">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-semibold uppercase">
                                Live Session
                              </span>
                              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium">
                                {session.pose_type}
                              </span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 truncate">
                              {session.pose_type} • {Math.round(session.overall_score)}%
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4" />
                                <span>{formatDate(session.created_at)}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4" />
                                <span>{session.duration_seconds}s</span>
                              </div>
                            </div>
                            {session.main_issue_type && (
                              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                                Main issue:{" "}
                                <span className="font-medium">
                                  {session.main_issue_type.replace(/_/g, " ")}
                                </span>
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-center md:text-right">
                              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">
                                Score
                              </div>
                              <div
                                className={`text-3xl font-bold ${getScoreColor(
                                  session.overall_score
                                )}`}
                              >
                                {Math.round(session.overall_score)}%
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Stability {Math.round(session.stability)}%
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-3">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={async () => {
                              try {
                                const API_BASE = (
                                  import.meta?.env?.VITE_API_BASE_URL ||
                                  "http://localhost:5000/api"
                                ).replace(/\/$/, "");
                                const res = await fetch(
                                  `${API_BASE}/live-session/${session.id}/generate-report`,
                                  {
                                    method: "POST",
                                    credentials: "include",
                                  }
                                );
                                if (!res.ok) {
                                  return;
                                }
                                const blob = await res.blob();
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = `live-session-${session.id}.pdf`;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                URL.revokeObjectURL(url);
                              } catch (err) {
                                console.error("Live session PDF download error:", err);
                              }
                            }}
                            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                          >
                            Download PDF
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default History;
