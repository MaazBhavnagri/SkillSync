import React from "react"
import ExerciseCard from "./ExerciseCard"

// Simple wrapper that maps an exercises array to ExerciseCard components.
const ExerciseGrid = ({ exercises }) => {
  if (!Array.isArray(exercises)) {
    return null
  }

  return (
    <>
      {exercises.map((exercise) => (
        <ExerciseCard key={exercise.id || exercise.name} exercise={exercise} />
      ))}
    </>
  )
}

export default ExerciseGrid


