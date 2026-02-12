"use client";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { motion, AnimatePresence } from "framer-motion";
import React from "react";
import {
  Page,
  Document,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";
import {
  Play,
  Pause,
  RotateCcw,
  Download,
  Star,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Target,
  Award,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// Define styles
const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: "Helvetica" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  section: { marginBottom: 10 },
  subtitle: { fontSize: 16, fontWeight: "bold", marginBottom: 5 },
  text: { fontSize: 12, marginBottom: 3 },
});

const Results = () => {
  const { uploadId } = useParams(); // this gets the /:uploadId from the URL
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [score, setScore] = useState(0);
  const [expandedSuggestion, setExpandedSuggestion] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("This is =" + uploadId);
        const API_BASE = (
          import.meta?.env?.VITE_API_BASE_URL ||
          "http://localhost:5000/api"
        ).replace(/\/$/, "");
        const endpoint = uploadId
          ? `${API_BASE}/results/${uploadId}`
          : `${API_BASE}/results/latest`;

        const res = await fetch(endpoint, {
          method: "GET",
          credentials: "include",
        });

        console.log("Fetch response status:", res.status);

        const data = await res.json();
        console.log("Fetched result data:", data);

        if (res.ok && data.success) {
          setAnalysisData(data.result);

          // Animate score from 0 to result.overallScore
          let target = Math.round(data.result.overallScore || 0);
          let counter = 0;

          const interval = setInterval(() => {
            counter += 2;
            if (counter >= target) {
              setScore(target);
              clearInterval(interval);
            } else {
              setScore(counter);
            }
          }, 50);
        } else {
          // Handle specific error cases
          if (res.status === 404) {
            throw new Error("No analysis data found. Please upload a video first.");
          } else {
            throw new Error(data.error || "Failed to load result");
          }
        }
      } catch (err) {
        console.error("Error fetching analysis data:", err);
        setError(err.message || "Failed to load analysis data.");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  const PdfReport = ({ data }) => (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.title}>Video Analysis Report</Text>
          <Text style={styles.text}>Uploaded on: {data.uploadDate}</Text>
          <Text style={styles.text}>Title: {data.title}</Text>
          <Text style={styles.text}>Duration: {data.duration}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.subtitle}>Overall Score</Text>
          <Text style={styles.text}>{data.overallScore}%</Text>
          {data.confidenceLevel && (
            <Text style={styles.text}>Confidence: {data.confidenceLevel}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.subtitle}>Performance Breakdown</Text>
          {Object.entries(data.breakdown).map(([key, value]) => (
            <Text key={key} style={styles.text}>
              {key}: {value}%
            </Text>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.subtitle}>Feedback</Text>
          <Text style={styles.text}>{data.feedback}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.subtitle}>Suggestions</Text>
          {data.suggestions.map((suggestion) => (
            <Text key={suggestion.id} style={styles.text}>
              • {suggestion.title}: {suggestion.description}
            </Text>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.subtitle}>Key Moments</Text>
          {data.keyMoments.map((moment, index) => (
            <Text key={index} style={styles.text}>
              - {moment.time}s: {moment.label}
            </Text>
          ))}
        </View>
      </Page>
    </Document>
  );

  const generatePdf = async () => {
    const blob = await pdf(<PdfReport data={analysisData} />).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "video-analysis-report.pdf";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading)
    return (
      <div className="text-center py-10 text-gray-500">Loading analysis...</div>
    );
  
  if (error) {
    const isNoDataError = error.includes("No analysis data found");
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-16">
          <div className="mb-6">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {isNoDataError ? "No Analysis Data" : "Error Loading Results"}
            </h2>
            <p className={`text-lg ${isNoDataError ? 'text-gray-600 dark:text-gray-400' : 'text-red-500'}`}>
              {error}
            </p>
          </div>
          
          {isNoDataError && (
            <div className="space-y-4">
              <p className="text-gray-500 dark:text-gray-400">
                Upload a video to get started with your skill analysis
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/upload')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
              >
                Upload Video
              </motion.button>
            </div>
          )}
          
          {!isNoDataError && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.reload()}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
            >
              Try Again
            </motion.button>
          )}
        </div>
      </div>
    );
  }
  
  if (!analysisData) return null; // fallback

  const ScoreRing = ({
    value,
    max = 100,
    size = 120,
    strokeWidth = 8,
    color = "blue",
  }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / max) * circumference;

    const colorClasses = {
      blue: "stroke-blue-500",
      green: "stroke-green-500",
      yellow: "stroke-yellow-500",
      red: "stroke-red-500",
    };

    return (
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-gray-200 dark:text-gray-700"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={circumference}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className={colorClasses[color]}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
            className="text-2xl font-bold text-gray-900 dark:text-white"
          >
            {value}%
          </motion.span>
        </div>
      </div>
    );
  };

  const getSuggestionIcon = (type) => {
    switch (type) {
      case "improvement":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case "strength":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <Target className="w-5 h-5 text-blue-500" />;
    }
  };

  const getSuggestionColor = (priority) => {
    switch (priority) {
      case "high":
        return "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20";
      case "medium":
        return "border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20";
      case "positive":
        return "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20";
      default:
        return "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800";
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Analysis Results
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          AI-powered feedback for your skill performance
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Video Player */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20 dark:border-gray-700/20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {analysisData.title}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Uploaded {analysisData.uploadDate} • {analysisData.duration}
                </p>
              </div>
            </div>

            {/* Video Container */}
            <div className="relative bg-gray-900 rounded-xl overflow-hidden mb-4">
              <div className="grid grid-cols-2 gap-4">
                {/* User video */}
                <div className="video-container">
                  <video controls muted autoPlay>
                    <source
                      src={`http://localhost:5000/${analysisData.videoUrl}`}
                      type="video/mp4"
                    />
                  </video>
                </div>
                {/* Reference video */}
                <div className="reference-container">
                  <video 
                    src={`/${analysisData.title.split(' ')[0].toLowerCase()}.mp4`} 
                    controls 
                    autoPlay 
                    muted 
                    onError={(e) => {
                      e.target.src = '/pushup.mp4';
                    }}
                  />
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    Reference: {analysisData.title.split(' ')[0]} demonstration
                  </p>
                </div>
              </div>
            </div>

            {/* Video Controls */}
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <RotateCcw className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </motion.button>

              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(currentTime / 15) * 100}%` }}
                  className="bg-blue-600 h-2 rounded-full"
                />
              </div>

              <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                00:{String(Math.floor(currentTime)).padStart(2, "0")} / 00:15
              </span>
            </div>
          </div>
        </motion.div>

        {/* Score Card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          {/* Overall Score */}
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20 dark:border-gray-700/20 text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Overall Score
            </h3>
            <ScoreRing value={score} color="blue" />
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5 }}
              className="mt-4"
            >
              <div className="flex items-center justify-center space-x-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 1.7 + i * 0.1 }}
                  >
                    <Star
                      className={`w-5 h-5 ${
                        i < Math.floor(score / 20)
                          ? "text-yellow-400 fill-current"
                          : "text-gray-300 dark:text-gray-600"
                      }`}
                    />
                  </motion.div>
                ))}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {score >= 90
                  ? "Excellent!"
                  : score >= 80
                  ? "Great job!"
                  : score >= 70
                  ? "Good work!"
                  : "Keep practicing!"}
              </p>
            </motion.div>

            {analysisData.confidenceLevel && (
              <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                Confidence:{" "}
                <span className="font-medium text-gray-700 dark:text-gray-200">
                  {analysisData.confidenceLevel}
                </span>
              </div>
            )}
          </div>

          {/* Breakdown Scores */}
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20 dark:border-gray-700/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Performance Breakdown
            </h3>
            {(() => {
              const clamp = (n) => Math.max(0, Math.min(100, Number.isFinite(n) ? n : 0));
              const base = Number(analysisData?.overallScore ?? 0);
              const correctionsCount = Array.isArray(analysisData?.suggestions) ? analysisData.suggestions.length : 0;
              const form = clamp(base - correctionsCount * 1.5);
              const timing = clamp(base - Math.min(12, correctionsCount * 2.0));
              const accuracy = clamp(base);
              const consistency = clamp(0.6 * base + 0.4 * (100 - correctionsCount * 5));
              const breakdown = {
                form,
                timing,
                accuracy,
                consistency,
              };
              return (
                <div className="space-y-4">
                  {Object.entries(breakdown).map(([key, rawValue], index) => {
                    const value = clamp(rawValue);
                    const valueText = value.toFixed(2);
                    return (
                      <motion.div
                        key={key}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                          {key}
                        </span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${valueText}%` }}
                              transition={{ delay: 0.7 + index * 0.1, duration: 0.8 }}
                              className={`h-2 rounded-full ${
                                value >= 85 ? "bg-green-500" : value >= 70 ? "bg-yellow-500" : "bg-red-500"
                              }`}
                            />
                          </div>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white w-12 text-right">
                            {valueText}%
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </motion.div>
      </div>

      {/* Suggestions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-white/20 dark:border-gray-700/20"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            AI Recommendations
          </h2>
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <TrendingUp className="w-4 h-4" />
            <span>Personalized feedback</span>
          </div>
        </div>

        <div className="space-y-6">
          {/* Feedback Section */}
          {analysisData.feedback && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 p-5 shadow-sm"
            >
              <h2 className="text-lg font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2">
                💡 Overall Feedback
              </h2>
              <p className="mt-2 text-gray-700 dark:text-gray-300 leading-relaxed">
                {analysisData.feedback}
              </p>
            </motion.div>
          )}

          {/* Suggestions Section */}
          <div className="space-y-4">
            {analysisData.suggestions.map((suggestion, index) => (
              <motion.div
                key={suggestion.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className={`rounded-2xl border p-5 shadow-sm transition-all duration-200 hover:shadow-md ${getSuggestionColor(
                  suggestion.priority
                )}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="flex-shrink-0 mt-1">
                      {getSuggestionIcon(suggestion.type)}
                    </div>

                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1 text-base">
                        {suggestion.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 leading-relaxed">
                        {suggestion.description}
                      </p>

                      <AnimatePresence>
                        {expandedSuggestion === suggestion.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="text-sm text-gray-700 dark:text-gray-300 mt-2 pt-3 border-t border-gray-200 dark:border-gray-600 leading-relaxed"
                          >
                            {suggestion.expanded}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() =>
                      setExpandedSuggestion(
                        expandedSuggestion === suggestion.id
                          ? null
                          : suggestion.id
                      )
                    }
                    className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    {expandedSuggestion === suggestion.id ? (
                      <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    )}
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            onClick={() => navigate('/upload')}
          >
            <div className="flex items-center justify-center space-x-2">
              <Award className="w-5 h-5" />
              <span>Practice Again</span>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white py-3 px-6 rounded-xl font-semibold border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
            onClick={generatePdf}
          >
            <div className="flex items-center justify-center space-x-2">
              <Download className="w-5 h-5" />
              <span>Save Results</span>
            </div>
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Results;
