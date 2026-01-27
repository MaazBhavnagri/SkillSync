from flask import Blueprint, jsonify, request
import logging

exercises_bp = Blueprint('exercises', __name__)
logger = logging.getLogger(__name__)

# Exercise data matching frontend expectations
EXERCISES_DATA = [
    {
        "id": "pushup",
        "name": "Push-up",
        "thumbnail_url": "/pushup.png",
        "tier": "A",
        "muscle_groups": ["chest", "triceps"],
        "reference_video_url": "/pushup.mp4",
        "description": "A classic upper body exercise targeting chest, shoulders, and triceps."
    },
    {
        "id": "squat",
        "name": "Squat",
        "thumbnail_url": "/squat.png",
        "tier": "S",
        "muscle_groups": ["legs", "glutes"],
        "reference_video_url": "/squat.mp4",
        "description": "Fundamental lower body exercise for legs and glutes."
    },
    {
        "id": "pullup",
        "name": "Pull-up",
        "thumbnail_url": "/pullup.png",
        "tier": "A",
        "muscle_groups": ["back", "biceps"],
        "reference_video_url": "/pullup.mp4",
        "description": "Upper body pulling exercise targeting back and biceps."
    },
    {
        "id": "benchpress",
        "name": "Bench Press",
        "thumbnail_url": "/benchpress.png",
        "tier": "S",
        "muscle_groups": ["chest", "shoulders", "triceps"],
        "reference_video_url": "/benchpress.mp4",
        "description": "Compound upper body exercise for chest, shoulders, and triceps."
    },
    {
        "id": "shoulderpress",
        "name": "Shoulder Press",
        "thumbnail_url": "/shoulderpress.png",
        "tier": "B",
        "muscle_groups": ["shoulders", "triceps"],
        "reference_video_url": "/shoulderpress.mp4",
        "description": "Overhead pressing movement for shoulder and tricep development."
    },
]


@exercises_bp.route('/exercises', methods=['GET'])
def get_exercises():
    """
    Get all available exercises.
    Returns a list of all exercises with their metadata.
    """
    try:
        logger.info("Fetching all exercises")
        return jsonify(EXERCISES_DATA), 200
    except Exception as e:
        logger.error(f"Error fetching exercises: {str(e)}")
        return jsonify({'error': 'Failed to fetch exercises'}), 500


@exercises_bp.route('/exercises/<exercise_id>', methods=['GET'])
def get_exercise(exercise_id):
    """
    Get a single exercise by ID.
    
    Args:
        exercise_id: The ID of the exercise (e.g., 'pushup', 'squat')
    
    Returns:
        JSON object with exercise details or 404 if not found
    """
    try:
        logger.info(f"Fetching exercise: {exercise_id}")
        
        # Find exercise by ID (case-insensitive)
        exercise = next(
            (ex for ex in EXERCISES_DATA if ex['id'].lower() == exercise_id.lower()),
            None
        )
        
        if not exercise:
            logger.warning(f"Exercise not found: {exercise_id}")
            return jsonify({'error': f'Exercise "{exercise_id}" not found'}), 404
        
        return jsonify(exercise), 200
    except Exception as e:
        logger.error(f"Error fetching exercise {exercise_id}: {str(e)}")
        return jsonify({'error': 'Failed to fetch exercise'}), 500

