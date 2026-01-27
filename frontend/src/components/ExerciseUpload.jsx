import React, { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

// Upload + analysis UI used on the ExerciseDetail page.
// Implements a minimal flow that posts to /api/uploads and polls for results.
const ExerciseUpload = ({ exerciseId }) => {
  const { refreshUser } = useAuth()
  const [file, setFile] = useState(null)
  const [error, setError] = useState(null)
  const [status, setStatus] = useState("idle") // idle | uploading | analyzing | done
  const [uploadId, setUploadId] = useState(null)
  const [results, setResults] = useState(null)
  const [pollError, setPollError] = useState(null)
  const [xpEarned, setXpEarned] = useState(null)
  const [levelUp, setLevelUp] = useState(false)

  const pollTimerRef = useRef(null)
  const pollStartRef = useRef(null)

  const MAX_SIZE_BYTES = 200 * 1024 * 1024 // ~200MB

  const API_BASE = (
    import.meta?.env?.VITE_API_BASE_URL || "http://localhost:5000/api"
  ).replace(/\/$/, "")

  // Clear any active polling timer on unmount.
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current)
      }
    }
  }, [])

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return
    setError(null)
    setPollError(null)
    setResults(null)
    setUploadId(null)

    if (!selectedFile.type.startsWith("video/")) {
      setError("Please select a video file (mp4, webm, etc.).")
      return
    }

    if (selectedFile.size > MAX_SIZE_BYTES) {
      setError("File is too large. Maximum size is 200MB.")
      return
    }

    setFile(selectedFile)
  }

  const onDrop = (event) => {
    event.preventDefault()
    event.stopPropagation()
    const dropped = event.dataTransfer?.files?.[0]
    if (dropped) {
      handleFileSelect(dropped)
    }
  }

  const onDragOver = (event) => {
    event.preventDefault()
    event.stopPropagation()
  }

  const startPolling = (id) => {
    if (!id) return
    setStatus("analyzing")
    setPollError(null)
    pollStartRef.current = Date.now()

    // Poll results until ready or timeout.
    pollTimerRef.current = setInterval(async () => {
      const elapsedMs = Date.now() - pollStartRef.current
      if (elapsedMs > 2 * 60 * 1000) {
        // 2-minute timeout
        clearInterval(pollTimerRef.current)
        pollTimerRef.current = null
        setPollError("Analysis timed out. Please try again.")
        setStatus("idle")
        return
      }

      try {
        const res = await fetch(`${API_BASE}/uploads/${id}/results`, {
          method: "GET",
          credentials: "include",
        })

        if (!res.ok) {
          // Treat non-OK as "still processing" unless it's a clear error.
          if (res.status >= 400 && res.status < 500) {
            const data = await res.json().catch(() => ({}))
            console.warn("Upload results error:", data)
          }
          return
        }

        const data = await res.json()
        const isDone =
          data?.status === "done" || data?.results || data?.result

        if (isDone) {
          clearInterval(pollTimerRef.current)
          pollTimerRef.current = null
          setResults(data.results || data.result || data)
          setStatus("done")
          
          // Update XP info if available in results
          if (data.xp_earned !== undefined && xpEarned === null) {
            setXpEarned(data.xp_earned)
            // Refresh user data to get updated XP and level
            await refreshUser()
          }
        }
      } catch (err) {
        console.error("Error while polling upload results:", err)
        setPollError("Failed to fetch analysis results. You can retry below.")
      }
    }, 1500)
  }

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a video file to upload.")
      return
    }

    if (!exerciseId) {
      setError("Exercise ID is missing. Please navigate from Skill Lab.")
      return
    }

    setStatus("uploading")
    setError(null)
    setPollError(null)
    setResults(null)
    setUploadId(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("exercise_id", exerciseId)
      formData.append("type", "attempt")

      const res = await fetch(`${API_BASE}/uploads`, {
        method: "POST",
        body: formData,
        credentials: "include",
      })

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error(
            "Upload service not available — please try again later."
          )
        }
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to upload video.")
      }

      const data = await res.json()
      console.log("Upload response:", data) // Debug log
      
      const id = data.upload_id || data.id
      if (!id) {
        throw new Error("Upload response missing ID.")
      }

      // Store XP earned info for display (from upload response)
      if (data.xp_earned !== undefined) {
        console.log("XP earned from upload:", data.xp_earned) // Debug log
        setXpEarned(data.xp_earned)
        if (data.level_up) {
          setLevelUp(true)
          console.log("Level up! New level:", data.new_level) // Debug log
        }
        // Refresh user data from backend to get updated XP and level
        await refreshUser()
      } else {
        console.log("No XP info in upload response, will check results endpoint")
      }

      setUploadId(id)
      startPolling(id)
    } catch (err) {
      console.error("Upload error:", err)
      setStatus("idle")
      setError(err.message || "Upload failed. Please try again.")
    }
  }

  const cancelAnalysis = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current)
      pollTimerRef.current = null
    }
    setStatus("idle")
  }

  const retry = () => {
    setPollError(null)
    setResults(null)
    if (uploadId) {
      startPolling(uploadId)
    }
  }

  const displayScore = (() => {
    if (!results) return null
    const raw =
      results.overallScore ??
      results.score ??
      results.aggregate_score ??
      results.accuracy
    if (raw == null) return null
    const value = raw <= 1 ? raw * 100 : raw
    return `${Math.round(value)}%`
  })()

  const corrections =
    results?.corrections || results?.top_corrections || []

  return (
    <div className="space-y-4">
      {/* Drag & drop / file input area */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        className="relative border-2 border-dashed rounded-2xl px-4 py-6 text-center transition-colors bg-white/70 dark:bg-gray-900/70 border-gray-300 dark:border-gray-700 hover:border-blue-500"
      >
        <input
          id="exercise-upload-input"
          type="file"
          accept="video/*"
          className="absolute inset-0 opacity-0 cursor-pointer"
          onChange={(e) => handleFileSelect(e.target.files?.[0])}
        />
        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
          Drag & drop a video here, or click to browse
        </p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Supported: MP4, WEBM (max 200MB)
        </p>
        {file && (
          <p className="mt-2 text-xs text-gray-600 dark:text-gray-300 truncate">
            Selected: <span className="font-semibold">{file.name}</span>
          </p>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {/* Upload / analyze controls */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleUpload}
          disabled={status === "uploading" || status === "analyzing"}
          className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white shadow hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {status === "uploading"
            ? "Uploading…"
            : status === "analyzing"
            ? "Analyzing…"
            : "Upload & Analyze"}
        </button>

        {status === "analyzing" && (
          <button
            type="button"
            onClick={cancelAnalysis}
            className="text-sm text-gray-600 dark:text-gray-300 underline"
          >
            Cancel
          </button>
        )}
      </div>

      {status === "analyzing" && (
        <div className="flex items-center space-x-3 text-sm text-gray-700 dark:text-gray-300">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          <span>Analyzing your upload — this may take a moment.</span>
        </div>
      )}

      {pollError && (
        <div className="flex items-center justify-between text-sm text-yellow-800 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
          <span>{pollError}</span>
          <button
            type="button"
            onClick={retry}
            className="ml-2 text-xs font-semibold text-yellow-900 underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* XP Earned Notification */}
      {xpEarned !== null && (
        <div className={`rounded-xl px-4 py-3 border ${
          levelUp 
            ? "bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-300 dark:border-yellow-700" 
            : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {levelUp ? "🎉 Level Up!" : "XP Earned"}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {levelUp 
                  ? "Congratulations! You've reached a new level!" 
                  : `You earned ${xpEarned} XP for this upload`}
              </p>
            </div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              +{xpEarned} XP
            </div>
          </div>
        </div>
      )}

      {/* Results summary */}
      {status === "done" && results && (
        <div className="mt-2 space-y-3">
          {displayScore && (
            <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Aggregate score
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {displayScore}
                </p>
              </div>
            </div>
          )}

          {Array.isArray(corrections) && corrections.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 space-y-2">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Top corrections
              </p>
              <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                {corrections.slice(0, 5).map((c, idx) => (
                  <li key={idx}>
                    <span className="font-mono text-xs text-gray-500 mr-2">
                      {c.time || c.timestamp || ""}
                    </span>
                    {c.message || c.text || c.description || "Correction"}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {uploadId && (
            <div className="text-sm">
              <Link
                to={`/results/${uploadId}`}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                View full analysis
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ExerciseUpload


