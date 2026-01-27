import React, { useEffect, useRef, useState } from "react"
import { Link, useParams } from "react-router-dom"
import ExerciseUpload from "../components/ExerciseUpload"
import { safeFetchJson } from "../utils/safeFetchJson"

// Local exercise list matching Upload page dropdown (same as SkillLab fallback)
const LOCAL_EXERCISES = [
  {
    id: "pushup",
    name: "Push-up",
    thumbnail_url: "/placeholder.jpg",
    tier: "A",
    muscle_groups: ["chest", "triceps"],
    reference_video_url: "/pushup.mp4",
  },
  {
    id: "squat",
    name: "Squat",
    thumbnail_url: "/placeholder.jpg",
    tier: "S",
    muscle_groups: ["legs", "glutes"],
    reference_video_url: "/squat.mp4",
  },
  {
    id: "pullup",
    name: "Pull-up",
    thumbnail_url: "/placeholder.jpg",
    tier: "A",
    muscle_groups: ["back", "biceps"],
    reference_video_url: "/pullup.mp4",
  },
  {
    id: "benchpress",
    name: "Bench Press",
    thumbnail_url: "/placeholder.jpg",
    tier: "S",
    muscle_groups: ["chest", "shoulders", "triceps"],
    reference_video_url: "/benchpress.mp4",
  },
  {
    id: "shoulderpress",
    name: "Shoulder Press",
    thumbnail_url: "/placeholder.jpg",
    tier: "B",
    muscle_groups: ["shoulders", "triceps"],
    reference_video_url: "/shoulderpress.mp4",
  },
]

// Small helper to display the tier as a pill.
const TierPill = ({ tier }) => {
  const value = tier || "-"
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-600 text-white shadow">
      Tier {value}
    </span>
  )
}

// Exercise detail page:
// - Fetches exercise metadata and reference video
// - Shows a reference video player with speed + loop controls
// - Renders an upload/analysis section for user attempts
const ExerciseDetail = () => {
  const { exerciseId } = useParams()
  const [exercise, setExercise] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [videoError, setVideoError] = useState(null)
  const [debugRawText, setDebugRawText] = useState(null)

  const [playbackRate, setPlaybackRate] = useState(1)
  const [loop, setLoop] = useState(false)
  const videoRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    const loadExercise = async () => {
      if (!exerciseId) return
      setLoading(true)
      setError(null)
      setVideoError(null)
      setDebugRawText(null)

      // First, try dedicated exercise-detail endpoint.
      const detailResult = await safeFetchJson(`/api/exercises/${exerciseId}`)

      if (cancelled) return

      if (detailResult.ok) {
        setExercise(detailResult.data)
        return setLoading(false)
      }

      console.error("Failed to load exercise detail:", detailResult)

      if (detailResult.rawText) {
        setVideoError(
          "Reference video not available — server returned HTML. Make sure backend route GET /api/exercises/:id exists and your dev proxy is configured."
        )
        setDebugRawText(detailResult.rawText)
      }

      // Fallback: try the list endpoint and search for the exercise.
      const listResult = await safeFetchJson("/api/exercises")

      if (cancelled) return

      if (listResult.ok && Array.isArray(listResult.data)) {
        const fromList = listResult.data.find((e) => e.id === exerciseId)
        if (fromList) {
          setExercise(fromList)
          setLoading(false)
          return
        }
      }

      // Final fallback: use local exercise list (matching Upload page dropdown)
      const fromLocal = LOCAL_EXERCISES.find((e) => e.id === exerciseId)
      if (fromLocal) {
        console.warn(
          `Using local exercise data for ${exerciseId} (API unavailable)`
        )
        setExercise(fromLocal)
        setLoading(false)
        return
      }

      setError(
        detailResult.error ||
          listResult.error ||
          `Exercise "${exerciseId}" not found`
      )
      setLoading(false)
    }

    loadExercise()

    return () => {
      cancelled = true
    }
  }, [exerciseId])

  // Apply playback controls to the video element.
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate
      videoRef.current.loop = loop
    }
  }, [playbackRate, loop])

  const handleSpeedChange = (rate) => {
    setPlaybackRate(rate)
  }

  const toggleLoop = () => {
    setLoop((prev) => !prev)
  }

  const muscles =
    Array.isArray(exercise?.muscle_groups) && exercise.muscle_groups.length > 0
      ? exercise.muscle_groups
      : ["Unspecified"]

  // Get reference video URL - use exercise.reference_video_url if available,
  // otherwise construct from exercise ID (matching Results page pattern)
  const getReferenceVideoUrl = () => {
    if (exercise?.reference_video_url) {
      return exercise.reference_video_url
    }
    if (exercise?.id) {
      // Match Results page pattern: /{exerciseId}.mp4
      return `/${exercise.id}.mp4`
    }
    return null
  }

  const referenceVideoUrl = getReferenceVideoUrl()
  const isDev =
    typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.MODE !== "production"

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Back link */}
      <div className="flex items-center justify-between">
        <Link
          to="/skill-lab"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← Back to Skill Lab
        </Link>
      </div>

      {/* Loading / error states */}
      {loading && (
        <div className="mt-8 flex items-center space-x-3 text-gray-600 dark:text-gray-300">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          <span>Loading exercise details…</span>
        </div>
      )}

      {!loading && error && (
        <div className="mt-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800 dark:border-red-800 dark:bg-red-900/20">
          Failed to load exercise details: {error}
        </div>
      )}

      {!loading && !error && exercise && (
        <div className="space-y-8">
          {/* Header + meta */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {exercise.name || "Exercise"}
              </h1>
              <TierPill tier={exercise.tier} />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {muscles.join(", ")}
            </p>
          </div>

          {/* Reference video player */}
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-5 shadow-xl border border-white/20 dark:border-gray-700/20 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Reference Tutorial
            </h2>

            {isDev && debugRawText && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                <details>
                  <summary className="cursor-pointer font-semibold">
                    Server returned HTML instead of JSON (debug)
                  </summary>
                  <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap">
                    {debugRawText}
                  </pre>
                </details>
              </div>
            )}

            {referenceVideoUrl && !videoError ? (
              <div className="w-full rounded-xl overflow-hidden bg-black">
                <video
                  ref={videoRef}
                  src={referenceVideoUrl}
                  controls
                  playsInline
                  className="w-full h-auto"
                  onError={(e) => {
                    console.error("Video load error:", e)
                    setVideoError("Reference video not available for this exercise.")
                  }}
                />
                <p className="text-sm text-gray-500 mt-2 text-center bg-gray-900 py-2">
                  Reference: {exercise?.name || exerciseId} demonstration
                </p>
              </div>
            ) : (
              <div className="w-full h-56 rounded-xl bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center text-center space-y-2">
                <p className="text-gray-600 dark:text-gray-300">
                  {videoError || "Reference video not available."}
                </p>
                <button
                  type="button"
                  className="mt-2 inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-blue-600 text-white shadow-sm"
                >
                  Request tutorial
                </button>
              </div>
            )}

            {/* Playback controls */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Speed
                </span>
                {[0.5, 1, 1.5, 2].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => handleSpeedChange(rate)}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                      playbackRate === rate
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={toggleLoop}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  loop
                    ? "bg-green-600 text-white border-green-600"
                    : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
                aria-pressed={loop}
              >
                {loop ? "Loop: On" : "Loop: Off"}
              </button>
            </div>
          </div>

          {/* Upload / analysis section */}
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-5 shadow-xl border border-white/20 dark:border-gray-700/20">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Upload Your Attempt
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Upload a recording of your attempt for this exercise to receive
              AI-powered feedback and corrections.
            </p>
            <ExerciseUpload exerciseId={exercise.id} />
          </div>
        </div>
      )}
    </div>
  )
}

export default ExerciseDetail


