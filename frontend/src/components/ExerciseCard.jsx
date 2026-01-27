import React from "react"
import { Link } from "react-router-dom"

// Presentational card for a single exercise.
// Shows thumbnail, tier badge, name, muscle groups, and disabled actions.
const ExerciseCard = ({ exercise }) => {
  const {
    name,
    thumbnail_url,
    tier,
    muscle_groups,
  } = exercise || {}

  const displayTier = tier || "-"
  const displayMuscles =
    Array.isArray(muscle_groups) && muscle_groups.length > 0
      ? muscle_groups.join(", ")
      : "Unspecified"

  const imageSrc = thumbnail_url || "/assets/exercise-placeholder.jpg"
  const id = exercise?.id

  return (
    <Link
      to={id ? `/skill-lab/${id}` : "#"}
      aria-label={name ? `Open ${name} details` : "Open exercise details"}
      className="block focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-transparent rounded-2xl"
    >
      <article
        tabIndex={-1}
        className="group bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl shadow-md hover:shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden transition-transform duration-200 hover:-translate-y-1"
      >
        <div className="relative">
          <img
            src={imageSrc}
            alt={name ? `${name} exercise thumbnail` : "Exercise thumbnail"}
            className="w-full h-40 object-cover"
          />
          <span className="absolute top-3 left-3 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-600 text-white shadow-md">
            Tier {displayTier}
          </span>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {name || "Unnamed exercise"}
            </h3>
            <p className="mt-1 text-xs uppercase tracking-wide text-gray-400">
              Muscle groups
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {displayMuscles}
            </p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              disabled
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
            >
              Compare
            </button>
            <button
              type="button"
              disabled
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
            >
              Upload
            </button>
          </div>
        </div>
      </article>
    </Link>
  )
}

export default ExerciseCard


