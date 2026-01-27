"""
Hybrid Push-up Evaluator - Production Inference Wrapper
Integrates the trained hybrid model into the website backend
Author: Backend Integration Team
"""

import cv2
import numpy as np
import mediapipe as mp
from pathlib import Path
import json
import joblib
import logging
from typing import Dict, Tuple
import sys

logger = logging.getLogger(__name__)

# Import from model-training (hybrid evaluator components)
MODEL_TRAINING_PATH = Path(__file__).parent.parent.parent / 'model-training' / 'pushup'
sys.path.insert(0, str(MODEL_TRAINING_PATH))

# Force reload to pick up any changes to rule_engine.py
import importlib
try:
    import rule_engine
    importlib.reload(rule_engine)
    from rule_engine import PushupRuleEngine
    
    import train_lstm
    importlib.reload(train_lstm)
    from train_lstm import LSTMTemporalValidator
    logger.info("[HYBRID] Successfully loaded rule_engine and train_lstm modules")
except ImportError as e:
    logger.error(f"Failed to import model-training modules: {e}")
    # Fallback to local implementation if needed


class HybridPushupEvaluator:
    """
    Production wrapper for hybrid push-up evaluation
    Singleton pattern for efficient model loading
    """
    
    _instance = None
    _models_loaded = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        """Initialize evaluator (models loaded lazily on first use)"""
        self.models_dir = Path(__file__).parent.parent / 'models'
        self.mp_pose = mp.solutions.pose
        self.pose = None
        self.rule_engine = None
        self.lstm = None
        
        if not self._models_loaded:
            self._load_models()
    
    def _load_models(self):
        """Load models once (singleton pattern)"""
        try:
            logger.info("Loading hybrid push-up models...")
            
            # Load rule engine
            rules_path = self.models_dir / 'pushup_rules.json'
            if rules_path.exists():
                self.rule_engine = PushupRuleEngine(str(rules_path))
                logger.info(f"✓ Loaded rules from {rules_path}")
            else:
                logger.warning(f"Rules file not found: {rules_path}")
                self.rule_engine = None
            
            # Load LSTM model
            lstm_path = self.models_dir / 'pushup_lstm.pkl'
            if lstm_path.exists():
                try:
                    self.lstm = LSTMTemporalValidator()
                    self.lstm.load(str(lstm_path))
                    logger.info(f"✓ Loaded LSTM from {lstm_path}")
                except Exception as e:
                    logger.error(f"Failed to load LSTM model: {e}")
                    logger.warning("Continuing with rules-only evaluation (no temporal validation)")
                    self.lstm = None
            else:
                logger.warning(f"LSTM model not found: {lstm_path}")
                self.lstm = None
            
            # Initialize MediaPipe Pose
            self.pose = self.mp_pose.Pose(
                static_image_mode=False,
                model_complexity=1,
                enable_segmentation=False,
                min_detection_confidence=0.3,
                min_tracking_confidence=0.5
            )
            logger.info("✓ Initialized MediaPipe Pose")
            
            self.__class__._models_loaded = True
            logger.info("✓ All models loaded successfully")
            
        except Exception as e:
            logger.error(f"Error loading models: {e}")
            raise
    
    def extract_pose_from_video(self, video_path: str, target_fps: int = 10) -> Tuple[np.ndarray, Dict]:
        """
        Extract pose landmarks from video
        
        Returns:
            landmarks_array: (num_frames, 33, 4) array
            metadata: Dict with extraction info
        """
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Cannot open video: {video_path}")
        
        original_fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        frame_interval = max(1, int(original_fps / target_fps))
        
        landmarks_list = []
        frame_count = 0
        extracted_count = 0
        
        logger.info(f"Processing video: {Path(video_path).name}")
        logger.info(f"  FPS: {original_fps:.1f}, Target: {target_fps}, Interval: {frame_interval}")
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            if frame_count % frame_interval == 0:
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                results = self.pose.process(frame_rgb)
                
                if results.pose_landmarks:
                    landmarks = np.array([
                        [lm.x, lm.y, lm.z, lm.visibility]
                        for lm in results.pose_landmarks.landmark
                    ])
                    
                    avg_visibility = landmarks[:, 3].mean()
                    if avg_visibility >= 0.3:
                        landmarks_list.append(landmarks)
                        extracted_count += 1
            
            frame_count += 1
        
        cap.release()
        
        if not landmarks_list:
            raise ValueError("No valid pose landmarks detected in video")
        
        landmarks_array = np.array(landmarks_list)
        avg_visibility = landmarks_array[:, :, 3].mean()
        
        metadata = {
            'extracted_frames': extracted_count,
            'avg_visibility': float(avg_visibility),
            'original_fps': original_fps
        }
        
        logger.info(f"  Extracted {extracted_count} frames, avg visibility: {avg_visibility:.3f}")
        
        return landmarks_array, metadata
    
    def compute_angles(self, landmarks_array: np.ndarray) -> np.ndarray:
        """
        Compute biomechanical angles from landmarks
        
        Args:
            landmarks_array: (num_frames, 33, 4) landmarks
            
        Returns:
            angles_array: (num_frames, 10) angles
        """
        LANDMARK_INDICES = {
            'nose': 0, 'left_shoulder': 11, 'right_shoulder': 12,
            'left_elbow': 13, 'right_elbow': 14, 'left_wrist': 15,
            'right_wrist': 16, 'left_hip': 23, 'right_hip': 24,
            'left_knee': 25, 'right_knee': 26
        }
        
        def calculate_angle(a, b, c):
            ba = a - b
            bc = c - b
            cosine_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc) + 1e-8)
            cosine_angle = np.clip(cosine_angle, -1.0, 1.0)
            return np.degrees(np.arccos(cosine_angle))
        
        all_angles = []
        
        for frame_landmarks in landmarks_array:
            def get_point(name):
                idx = LANDMARK_INDICES[name]
                return frame_landmarks[idx, :3]
            
            angles = {}
            
            # Elbow angles
            angles['left_elbow'] = calculate_angle(
                get_point('left_shoulder'), get_point('left_elbow'), get_point('left_wrist')
            )
            angles['right_elbow'] = calculate_angle(
                get_point('right_shoulder'), get_point('right_elbow'), get_point('right_wrist')
            )
            
            # Shoulder angles
            angles['left_shoulder'] = calculate_angle(
                get_point('left_elbow'), get_point('left_shoulder'), get_point('left_hip')
            )
            angles['right_shoulder'] = calculate_angle(
                get_point('right_elbow'), get_point('right_shoulder'), get_point('right_hip')
            )
            
            # Hip angles
            angles['left_hip'] = calculate_angle(
                get_point('left_shoulder'), get_point('left_hip'), get_point('left_knee')
            )
            angles['right_hip'] = calculate_angle(
                get_point('right_shoulder'), get_point('right_hip'), get_point('right_knee')
            )
            angles['hip'] = (angles['left_hip'] + angles['right_hip']) / 2
            
            # Trunk inclination
            left_shoulder = get_point('left_shoulder')
            right_shoulder = get_point('right_shoulder')
            left_hip = get_point('left_hip')
            right_hip = get_point('right_hip')
            mid_shoulder = (left_shoulder + right_shoulder) / 2
            mid_hip = (left_hip + right_hip) / 2
            trunk_vector = mid_shoulder - mid_hip
            vertical = np.array([0, -1, 0])
            cosine = np.dot(trunk_vector, vertical) / (np.linalg.norm(trunk_vector) + 1e-8)
            angles['trunk'] = np.degrees(np.arccos(np.clip(cosine, -1.0, 1.0)))
            
            # Head-hip alignment
            nose = get_point('nose')
            head_hip_vector = mid_hip - nose
            vertical_down = np.array([0, 1, 0])
            cosine = np.dot(head_hip_vector, vertical_down) / (np.linalg.norm(head_hip_vector) + 1e-8)
            angles['head_hip'] = np.degrees(np.arccos(np.clip(cosine, -1.0, 1.0)))
            
            # Symmetry
            angles['symmetry'] = abs(angles['left_elbow'] - angles['right_elbow'])
            
            # Ordered array
            angle_array = [
                angles['left_elbow'], angles['right_elbow'],
                angles['left_shoulder'], angles['right_shoulder'],
                angles['left_hip'], angles['right_hip'], angles['hip'],
                angles['trunk'], angles['head_hip'], angles['symmetry']
            ]
            all_angles.append(angle_array)
        
        return np.array(all_angles)
    
    def normalize_sequence(self, angles_array: np.ndarray, target_frames: int = 40) -> np.ndarray:
        """
        Normalize temporal sequence to target frames
        
        Args:
            angles_array: (original_frames, 10) angles
            target_frames: Target number of frames (default: 40)
            
        Returns:
            normalized: (target_frames, 10) angles
        """
        from scipy.interpolate import interp1d
        
        original_frames, num_features = angles_array.shape
        
        if original_frames == target_frames:
            return angles_array
        
        original_time = np.linspace(0, 1, original_frames)
        target_time = np.linspace(0, 1, target_frames)
        
        normalized = np.zeros((target_frames, num_features))
        
        for i in range(num_features):
            interp_func = interp1d(original_time, angles_array[:, i], kind='linear')
            normalized[:, i] = interp_func(target_time)
        
        return normalized
    
    def evaluate(self, video_path: str) -> Dict:
        """
        Full evaluation pipeline
        
        Args:
            video_path: Path to push-up video
            
        Returns:
            Dict with evaluation results matching backend response format
        """
        try:
            # 1. Extract pose
            landmarks, metadata = self.extract_pose_from_video(video_path)
            
            # Check visibility
            if metadata['avg_visibility'] < 0.3:
                return {
                    'exercise': 'pushup',
                    'status': 'INVALID',
                    'score': 0.0,
                    'confidence': 0.0,
                    'feedback': 'Pose detection confidence too low. Please record in better lighting with clear visibility.',
                    'rule_breakdown': {},
                    'failures': ['Low visibility']
                }
            
            # 2. Compute angles
            angles = self.compute_angles(landmarks)
            
            # 3. Normalize to 40 frames
            sequence = self.normalize_sequence(angles, target_frames=40)
            
            # 4. LSTM temporal validation
            lstm_valid = True
            lstm_confidence = 0.5
            
            if self.lstm is not None:
                try:
                    lstm_valid, lstm_confidence = self.lstm.predict(sequence)
                    
                    if not lstm_valid or lstm_confidence < 0.4:
                        return {
                            'exercise': 'pushup',
                            'status': 'INVALID',
                            'score': 0.0,
                            'confidence': float(lstm_confidence),
                            'feedback': 'Temporal motion pattern invalid - possible reversed or incomplete push-up. Please perform a complete, controlled repetition.',
                            'rule_breakdown': {},
                            'failures': ['Invalid temporal pattern detected']
                        }
                except Exception as e:
                    logger.warning(f"LSTM prediction failed: {e}")
                    lstm_confidence = 0.5
            
            # 5. Rule-based evaluation
            if self.rule_engine is not None:
                rule_result = self.rule_engine.evaluate(sequence)
                
                if not rule_result['valid_motion']:
                    return {
                        'exercise': 'pushup',
                        'status': 'INVALID',
                        'score': 0.0,
                        'confidence': float(lstm_confidence),
                        'feedback': 'Push-up motion structure invalid. Ensure you perform complete descent and ascent.',
                        'rule_breakdown': rule_result.get('component_scores', {}),
                        'failures': rule_result.get('failures', [])
                    }
                
                total_penalty = rule_result.get('total_penalty', 0)
                penalties = rule_result.get('penalties', {})
                component_scores = rule_result['component_scores']
                failures = rule_result['failures']
            else:
                total_penalty = 50.0  # High default penalty if no rules
                penalties = {}
                component_scores = {}
                failures = []
            
            # 6. PENALTY-BASED FINAL SCORE (NEW FORMULA)
            # Start with perfect score, deduct penalties
            base_score = 100.0
            
            # Subtract rule violations
            base_score -= total_penalty
            
            # LSTM temporal penalty (fixed amount if invalid)
            # NOTE: lstm_confidence is classifier certainty, NOT form quality
            if not lstm_valid or lstm_confidence < 0.4:
                base_score -= 30.0  # Fixed penalty for invalid temporal pattern
            
            # Clamp to 0-100 range
            final_score = max(0.0, min(100.0, base_score))
            
            # DEBUG: Log scoring calculation
            logger.info(f"[PENALTY SCORING] base=100, penalties={total_penalty:.1f}, lstm_penalty={30.0 if (not lstm_valid or lstm_confidence < 0.4) else 0.0}, final={final_score:.1f}")
            
            # 7. Determine status based on final score
            if final_score >= 80:
                status = 'GOOD'
            elif final_score >= 60:
                status = 'NEEDS_IMPROVEMENT'
            else:
                status = 'BAD'
            
            # 8. Generate feedback
            if not failures:
                feedback = "Great form! Your push-up shows good depth, body alignment, and symmetry. Keep up the excellent work!"
            else:
                feedback_parts = ["Areas for improvement:"]
                for failure in failures[:3]:  # Limit to top 3
                    feedback_parts.append(f"• {failure}")
                
                if component_scores.get('elbow_depth', 1.0) < 0.7:
                    feedback_parts.append("\nTip: Lower your chest closer to the ground.")
                if component_scores.get('body_alignment', 1.0) < 0.7:
                    feedback_parts.append("Tip: Engage your core to keep your body straight.")
                
                feedback = "\n".join(feedback_parts)
            
            # 9. Return formatted result
            return {
                'exercise': 'pushup',
                'status': status,
                'score': float(final_score),  # Already 0-100 range
                'confidence': float(lstm_confidence),
                'feedback': feedback,
                'rule_breakdown': {k: float(v) for k, v in component_scores.items()},
                'penalties': {k: float(v) for k, v in penalties.items()} if penalties else {},
                'total_penalty': float(total_penalty) if 'total_penalty' in locals() else 0.0,
                'failures': failures
            }
            
        except ValueError as e:
            logger.error(f"Evaluation error: {e}")
            return {
                'exercise': 'pushup',
                'status': 'INVALID',
                'score': 0.0,
                'confidence': 0.0,
                'feedback': str(e),
                'rule_breakdown': {},
                'failures': [str(e)]
            }
        except Exception as e:
            logger.error(f"Unexpected error in evaluation: {e}", exc_info=True)
            return {
                'exercise': 'pushup',
                'status': 'INVALID',
                'score': 0.0,
                'confidence': 0.0,
                'feedback': 'An error occurred during analysis. Please try again.',
                'rule_breakdown': {},
                'failures': ['Processing error']
            }


# Singleton instance
_evaluator_instance = None

def get_evaluator() -> HybridPushupEvaluator:
    """Get singleton evaluator instance - reset each time to pick up module changes"""
    global _evaluator_instance
    # Always create new instance to pick up rule_engine changes
    HybridPushupEvaluator._models_loaded = False
    _evaluator_instance = HybridPushupEvaluator()
    return _evaluator_instance
