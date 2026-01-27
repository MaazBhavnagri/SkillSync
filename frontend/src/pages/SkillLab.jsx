import React, { useEffect, useState } from "react"
import ExerciseGrid from "../components/ExerciseGrid"
import { safeFetchJson } from "../utils/safeFetchJson"

// All exercises from Upload page dropdown menu
const FALLBACK_EXERCISES = [
  {
    id: "pushup",
    name: "Push-up",
    thumbnail_url: "/pushup.png",
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

const SkillLab = () => {
  const [exercises, setExercises] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [apiWarning, setApiWarning] = useState(false)

  useEffect(() => {
    let cancelled = false

    const loadExercises = async () => {
      setLoading(true)
      setError(null)
      setApiWarning(false)

      try {
        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Request timeout")), 10000)
        )

        const result = await Promise.race([
          safeFetchJson("/api/exercises"),
          timeoutPromise,
        ]).catch((err) => ({
          ok: false,
          error: err.message || "Network error",
        }))

        if (cancelled) return

        if (result.ok && Array.isArray(result.data)) {
          setExercises(result.data)
          setLoading(false)
          return
        }

        console.warn("Failed to fetch /api/exercises — using fallback sample.", {
          error: result.error,
          rawTextSnippet:
            result.rawText && result.rawText.length > 200
              ? `${result.rawText.slice(0, 200)}…`
              : result.rawText,
        })

        setExercises(FALLBACK_EXERCISES)
        setError(result.error || "Failed to load exercises")

        if (result.rawText) {
          setApiWarning(true)
        }
      } catch (err) {
        console.error("Error loading exercises:", err)
        if (!cancelled) {
          setExercises(FALLBACK_EXERCISES)
          setError(err.message || "Failed to load exercises")
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadExercises()

    return () => {
      cancelled = true
    }
  }, [])

  const hasExercises = Array.isArray(exercises) && exercises.length > 0

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Skill Lab
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Choose a skill or exercise to begin your practice and analysis.
        </p>
      </div>

      {loading && (
        <div className="mt-6 flex items-center space-x-3 text-gray-600 dark:text-gray-300">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          <span>Loading exercises…</span>
        </div>
      )}

      {!loading && apiWarning && (
        <div className="mt-4 text-sm text-yellow-900 bg-yellow-50 border border-yellow-300 rounded-lg px-4 py-3">
          <p className="font-semibold">
            Warning: exercises API returned unexpected response. Showing
            fallback sample. Check backend /api/exercises or dev server proxy.
          </p>
          {error && (
            <p className="mt-1 text-xs opacity-80">Details: {error}</p>
          )}
        </div>
      )}

      {!loading && !apiWarning && error && (
        <div className="mt-4 text-sm text-yellow-800 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
          Warning: failed to load exercises from backend. Showing local sample. (
          {error})
        </div>
      )}

      {!loading && !hasExercises && !error && (
        <div className="mt-6 text-gray-500 dark:text-gray-400">
          No exercises found. Ask admin to add exercises or check backend.
        </div>
      )}

      {!loading && hasExercises && (
        <section
          aria-label="Skill lab exercises"
          className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
        >
          <ExerciseGrid exercises={exercises} />
        </section>
      )}
    </div>
  )
}

export default SkillLab

