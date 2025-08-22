import cv2
import numpy as np
import mediapipe as mp
import joblib
import os
import logging
from sklearn.ensemble import RandomForestClassifier
import json
from datetime import datetime
import google.generativeai as genai
import json
import numpy as np
import re

logger = logging.getLogger(__name__)

class MLProcessor:
    def __init__(self):
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(
            static_image_mode=False,
            model_complexity=1,
            enable_segmentation=False,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        self.mp_drawing = mp.solutions.drawing_utils
        self.model = self._load_model()
    
    def _load_model(self):
        """Load the bundled exercise model (type + form)."""
        model_path = os.path.join(os.path.dirname(__file__), 'models', 'exercise_model.pkl')
        try:
            if os.path.exists(model_path):
                return joblib.load(model_path)
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            # return self._create_dummy_model()
            return None
    
    def calculate_angle(self, a, b, c):
        """Calculate angle between three points"""
        try:
            a = np.array(a)
            b = np.array(b)
            c = np.array(c)
            
            radians = np.arctan2(c[1] - b[1], c[0] - b[0]) - np.arctan2(a[1] - b[1], a[0] - b[0])
            angle = np.abs(radians * 180.0 / np.pi)
            
            if angle > 180.0:
                angle = 360 - angle
            
            return angle
        except:
            return 0.0
        
    def extract_model_angles(self, landmarks):
        """Extract the same 10 angles used in training"""
        try:
            def get_point(name):
                return [
                    landmarks[self.mp_pose.PoseLandmark[name].value].x,
                    landmarks[self.mp_pose.PoseLandmark[name].value].y
                ]

            right_elbow_angle = self.calculate_angle(get_point('RIGHT_SHOULDER'), get_point('RIGHT_ELBOW'), get_point('RIGHT_WRIST'))
            left_elbow_angle = self.calculate_angle(get_point('LEFT_SHOULDER'), get_point('LEFT_ELBOW'), get_point('LEFT_WRIST'))
            right_shoulder_angle = self.calculate_angle(get_point('RIGHT_ELBOW'), get_point('RIGHT_SHOULDER'), get_point('RIGHT_HIP'))
            left_shoulder_angle = self.calculate_angle(get_point('LEFT_ELBOW'), get_point('LEFT_SHOULDER'), get_point('LEFT_HIP'))
            right_hip_angle = self.calculate_angle(get_point('RIGHT_SHOULDER'), get_point('RIGHT_HIP'), get_point('RIGHT_KNEE'))
            left_hip_angle = self.calculate_angle(get_point('LEFT_SHOULDER'), get_point('LEFT_HIP'), get_point('LEFT_KNEE'))
            right_knee_angle = self.calculate_angle(get_point('RIGHT_HIP'), get_point('RIGHT_KNEE'), get_point('RIGHT_ANKLE'))
            left_knee_angle = self.calculate_angle(get_point('LEFT_HIP'), get_point('LEFT_KNEE'), get_point('LEFT_ANKLE'))
            right_ankle_angle = self.calculate_angle(get_point('RIGHT_KNEE'), get_point('RIGHT_ANKLE'), get_point('RIGHT_FOOT_INDEX'))
            left_ankle_angle = self.calculate_angle(get_point('LEFT_KNEE'), get_point('LEFT_ANKLE'), get_point('LEFT_FOOT_INDEX'))

            return [
                right_elbow_angle, left_elbow_angle,
                right_shoulder_angle, left_shoulder_angle,
                right_hip_angle, left_hip_angle,
                right_knee_angle, left_knee_angle,
                right_ankle_angle, left_ankle_angle
            ]
        except Exception as e:
            logger.error(f"Angle extraction error: {str(e)}")
            return [0.0] * 10

    
    def extract_pose_features(self, landmarks):
        """Extract features from pose landmarks"""
        try:
            if not landmarks:
                return np.zeros(20)
            
            # Get key landmarks
            left_shoulder = [landmarks[self.mp_pose.PoseLandmark.LEFT_SHOULDER.value].x,
                           landmarks[self.mp_pose.PoseLandmark.LEFT_SHOULDER.value].y]
            right_shoulder = [landmarks[self.mp_pose.PoseLandmark.RIGHT_SHOULDER.value].x,
                            landmarks[self.mp_pose.PoseLandmark.RIGHT_SHOULDER.value].y]
            left_elbow = [landmarks[self.mp_pose.PoseLandmark.LEFT_ELBOW.value].x,
                         landmarks[self.mp_pose.PoseLandmark.LEFT_ELBOW.value].y]
            right_elbow = [landmarks[self.mp_pose.PoseLandmark.RIGHT_ELBOW.value].x,
                          landmarks[self.mp_pose.PoseLandmark.RIGHT_ELBOW.value].y]
            left_wrist = [landmarks[self.mp_pose.PoseLandmark.LEFT_WRIST.value].x,
                         landmarks[self.mp_pose.PoseLandmark.LEFT_WRIST.value].y]
            right_wrist = [landmarks[self.mp_pose.PoseLandmark.RIGHT_WRIST.value].x,
                          landmarks[self.mp_pose.PoseLandmark.RIGHT_WRIST.value].y]
            left_hip = [landmarks[self.mp_pose.PoseLandmark.LEFT_HIP.value].x,
                       landmarks[self.mp_pose.PoseLandmark.LEFT_HIP.value].y]
            right_hip = [landmarks[self.mp_pose.PoseLandmark.RIGHT_HIP.value].x,
                        landmarks[self.mp_pose.PoseLandmark.RIGHT_HIP.value].y]
            left_knee = [landmarks[self.mp_pose.PoseLandmark.LEFT_KNEE.value].x,
                        landmarks[self.mp_pose.PoseLandmark.LEFT_KNEE.value].y]
            right_knee = [landmarks[self.mp_pose.PoseLandmark.RIGHT_KNEE.value].x,
                         landmarks[self.mp_pose.PoseLandmark.RIGHT_KNEE.value].y]
            
            # Calculate angles
            left_elbow_angle = self.calculate_angle(left_shoulder, left_elbow, left_wrist)
            right_elbow_angle = self.calculate_angle(right_shoulder, right_elbow, right_wrist)
            left_shoulder_angle = self.calculate_angle(left_elbow, left_shoulder, left_hip)
            right_shoulder_angle = self.calculate_angle(right_elbow, right_shoulder, right_hip)
            left_hip_angle = self.calculate_angle(left_shoulder, left_hip, left_knee)
            right_hip_angle = self.calculate_angle(right_shoulder, right_hip, right_knee)
            
            # Create feature vector
            features = [
                left_elbow_angle, right_elbow_angle,
                left_shoulder_angle, right_shoulder_angle,
                left_hip_angle, right_hip_angle,
                left_shoulder[0], left_shoulder[1],
                right_shoulder[0], right_shoulder[1],
                left_elbow[0], left_elbow[1],
                right_elbow[0], right_elbow[1],
                left_wrist[0], left_wrist[1],
                right_wrist[0], right_wrist[1],
                left_hip[0], left_hip[1]
            ]
            
            return np.array(features)
        except Exception as e:
            logger.error(f"Feature extraction error: {str(e)}")
            return np.zeros(20)
    
    
    def _get_point(self, landmarks, name):
        return [
            landmarks[self.mp_pose.PoseLandmark[name].value].x,
            landmarks[self.mp_pose.PoseLandmark[name].value].y
        ]

    def _angle_between(self, a, b, c):
        try:
            a = np.array(a, dtype=float)
            b = np.array(b, dtype=float)
            c = np.array(c, dtype=float)
            ab = a - b
            cb = c - b
            dot = float(np.dot(ab, cb))
            den = float(np.linalg.norm(ab) * np.linalg.norm(cb))
            if den == 0:
                return 0.0
            ang = np.degrees(np.arccos(np.clip(dot / den, -1.0, 1.0)))
            if ang > 180.0:
                ang = 360.0 - ang
            return float(ang)
        except Exception:
            return 0.0

    def _angle_to_vertical(self, p_from, p_to):
        try:
            v = np.array([p_to[0] - p_from[0], p_to[1] - p_from[1]], dtype=float)
            vertical = np.array([0.0, 1.0], dtype=float)
            dot = float(np.dot(v, vertical))
            den = float(np.linalg.norm(v) * np.linalg.norm(vertical))
            if den == 0:
                return 0.0
            return float(np.degrees(np.arccos(np.clip(dot / den, -1.0, 1.0))))
        except Exception:
            return 0.0

    def _euclidean_distance(self, p1, p2):
        try:
            return float(np.linalg.norm(np.array(p1, dtype=float) - np.array(p2, dtype=float)))
        except Exception:
            return 0.0

    def _phase_from_index(self, idx: int, total: int):
        if total <= 0:
            return 'start'
        third = total // 3 if total >= 3 else 1
        if idx < third:
            return 'start'
        elif idx < 2 * third:
            return 'mid'
        return 'end'

    def _extract_row(self, landmarks):
        def gp(n):
            return self._get_point(landmarks, n)

        left_shoulder = gp('LEFT_SHOULDER')
        right_shoulder = gp('RIGHT_SHOULDER')
        left_elbow = gp('LEFT_ELBOW')
        right_elbow = gp('RIGHT_ELBOW')
        left_wrist = gp('LEFT_WRIST')
        right_wrist = gp('RIGHT_WRIST')
        left_hip = gp('LEFT_HIP')
        right_hip = gp('RIGHT_HIP')
        left_knee = gp('LEFT_KNEE')
        right_knee = gp('RIGHT_KNEE')
        left_ankle = gp('LEFT_ANKLE')
        right_ankle = gp('RIGHT_ANKLE')
        left_foot = gp('LEFT_FOOT_INDEX')
        right_foot = gp('RIGHT_FOOT_INDEX')
        nose = gp('NOSE')

        right_elbow_angle = self._angle_between(right_shoulder, right_elbow, right_wrist)
        left_elbow_angle = self._angle_between(left_shoulder, left_elbow, left_wrist)
        right_shoulder_angle = self._angle_between(right_elbow, right_shoulder, right_hip)
        left_shoulder_angle = self._angle_between(left_elbow, left_shoulder, left_hip)
        right_hip_angle = self._angle_between(right_shoulder, right_hip, right_knee)
        left_hip_angle = self._angle_between(left_shoulder, left_hip, left_knee)
        right_knee_angle = self._angle_between(right_hip, right_knee, right_ankle)
        left_knee_angle = self._angle_between(left_hip, left_knee, left_ankle)
        right_ankle_angle = self._angle_between(right_knee, right_ankle, right_foot)
        left_ankle_angle = self._angle_between(left_knee, left_ankle, left_foot)

        shoulders_mid = [(left_shoulder[0] + right_shoulder[0]) / 2.0, (left_shoulder[1] + right_shoulder[1]) / 2.0]
        hips_mid = [(left_hip[0] + right_hip[0]) / 2.0, (left_hip[1] + right_hip[1]) / 2.0]
        back_angle = self._angle_to_vertical(shoulders_mid, hips_mid)
        neck_angle = self._angle_to_vertical(shoulders_mid, nose)

        symmetry_pairs = [
            (left_elbow_angle, right_elbow_angle),
            (left_shoulder_angle, right_shoulder_angle),
            (left_hip_angle, right_hip_angle),
            (left_knee_angle, right_knee_angle),
            (left_ankle_angle, right_ankle_angle),
        ]
        symmetry_diff = float(np.mean([abs(l - r) for l, r in symmetry_pairs]))

        d_shoulders = self._euclidean_distance(left_shoulder, right_shoulder)
        d_knees = self._euclidean_distance(left_knee, right_knee)
        d_ankles = self._euclidean_distance(left_ankle, right_ankle)
        stance_width = float(np.mean([d_shoulders, d_knees, d_ankles]))

        row = {
            'right_elbow_angle': right_elbow_angle,
            'left_elbow_angle': left_elbow_angle,
            'right_shoulder_angle': right_shoulder_angle,
            'left_shoulder_angle': left_shoulder_angle,
            'right_hip_angle': right_hip_angle,
            'left_hip_angle': left_hip_angle,
            'right_knee_angle': right_knee_angle,
            'left_knee_angle': left_knee_angle,
            'right_ankle_angle': right_ankle_angle,
            'left_ankle_angle': left_ankle_angle,
            'back_angle': back_angle,
            'neck_angle': neck_angle,
            'symmetry_diff': symmetry_diff,
            'stance_width': stance_width,
        }
        angles = [
            right_elbow_angle, left_elbow_angle,
            right_shoulder_angle, left_shoulder_angle,
            right_hip_angle, left_hip_angle,
            right_knee_angle, left_knee_angle,
            right_ankle_angle, left_ankle_angle,
        ]
        return row, angles

    def _bad_reason(self, exc_type: str, row: dict):
        if exc_type == 'pushup':
            if row['back_angle'] > 25:
                return 'lower hips'
            if min(row['left_elbow_angle'], row['right_elbow_angle']) > 150:
                return 'bend elbows more'
        elif exc_type == 'squat':
            if row['left_knee_angle'] > 120 or row['right_knee_angle'] > 120:
                return 'go deeper'
            if row['left_knee_angle'] < 60 or row['right_knee_angle'] < 60:
                return 'avoid going too deep'
        elif exc_type == 'pullup':
            if row['left_elbow_angle'] > 160 and row['right_elbow_angle'] > 160:
                return 'pull higher'
        return 'None'

    def _evenly_spaced_indices(self, start_frame: int, end_frame: int, desired: int):
        if desired <= 0:
            return []
        if end_frame <= start_frame:
            return [int(start_frame)] * desired
        pts = np.linspace(start_frame, end_frame, num=desired)
        return [int(round(p)) for p in pts]

    def _select_motion_window_indices(self, cap, total_frames: int, fps: float, window_seconds: float = 5.0, desired: int = 12):
        if fps is None or fps <= 0:
            fps = 30.0
        if total_frames <= 0:
            return []

        window_frames = int(max(1, round(window_seconds * fps)))
        if total_frames <= window_frames:
            return self._evenly_spaced_indices(0, max(0, total_frames - 1), desired)

        coarse_step = max(1, int(round(fps)))  # ~1 sample per second
        coarse_indices = list(range(0, total_frames, coarse_step))
        coarse_frames_gray = []

        for idx in coarse_indices:
            cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
            ok, frame = cap.read()
            if not ok or frame is None:
                coarse_frames_gray.append(None)
                continue
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            gray = cv2.resize(gray, (160, 90))
            coarse_frames_gray.append(gray)

        motion = [0.0] * len(coarse_frames_gray)
        for i in range(1, len(coarse_frames_gray)):
            a = coarse_frames_gray[i - 1]
            b = coarse_frames_gray[i]
            if a is None or b is None:
                motion[i] = 0.0
            else:
                diff = cv2.absdiff(a, b)
                motion[i] = float(np.sum(diff))

        window_steps = max(1, int(round(window_seconds)))
        best_sum = -1.0
        best_start_step = 0
        prefix = np.cumsum([0.0] + motion)
        for start in range(0, max(1, len(motion) - window_steps + 1)):
            end = start + window_steps
            s = prefix[end] - prefix[start]
            if s > best_sum:
                best_sum = s
                best_start_step = start

        start_frame = coarse_indices[min(best_start_step, len(coarse_indices) - 1)]
        end_frame = min(total_frames - 1, start_frame + window_frames - 1)

        return self._evenly_spaced_indices(start_frame, end_frame, desired)

    def process_video(self, video_path):
        """Extract per-frame features (12 frames) matching training pipeline.

        Returns:
        - X: (num_frames, num_features)
        - angle_names: list of 10 labels
        - angle_matrix: (num_frames, 10)
        - phases: list of str length num_frames
        """
        try:
            cap = cv2.VideoCapture(video_path)
            if not cap.isOpened():
                raise ValueError("Could not open video")

            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            desired = 12
            fps = float(cap.get(cv2.CAP_PROP_FPS))
            indices = self._select_motion_window_indices(cap, total_frames, fps, window_seconds=5.0, desired=desired)

            feature_rows = []
            angle_rows = []
            phases = []

            for i, idx in enumerate(indices):
                cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
                ret, frame = cap.read()
                if not ret or frame is None:
                    continue
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                results = self.pose.process(frame_rgb)
                if not results.pose_landmarks:
                    continue
                row, angles = self._extract_row(results.pose_landmarks.landmark)
                feature_rows.append(row)
                angle_rows.append(angles)
                phases.append(self._phase_from_index(i, len(indices)))

            cap.release()

            if not feature_rows:
                return np.zeros((0, 0)), [], np.zeros((0, 10)), []

            ordered_cols = [
                'right_elbow_angle', 'left_elbow_angle',
                'right_shoulder_angle', 'left_shoulder_angle',
                'right_hip_angle', 'left_hip_angle',
                'right_knee_angle', 'left_knee_angle',
                'right_ankle_angle', 'left_ankle_angle',
                'back_angle', 'neck_angle',
                'symmetry_diff', 'stance_width',
            ]
            X = np.array([[row[c] for c in ordered_cols] for row in feature_rows], dtype=float)
            angle_matrix = np.array(angle_rows, dtype=float)
            angle_names = [
                "Right Elbow", "Left Elbow", "Right Shoulder", "Left Shoulder",
                "Right Hip", "Left Hip", "Right Knee", "Left Knee",
                "Right Ankle", "Left Ankle",
            ]
            return X, angle_names, angle_matrix, phases
        except Exception as e:
            logger.error(f"Video processing error: {str(e)}")
            return np.zeros((0, 0)), [], np.zeros((0, 10)), []

    
    

    genai.configure(api_key="AIzaSyBJH4lnx4kjusFrMdqpmbOkEl_xXCEX6WU")

    def get_gemini_feedback(self, exercise_type, confidence, all_angles_dict):
        logger.info(f"Taking Feedback from gemini")

        # Enhanced prompt with clear requirements and variety
        prompt = f"""
    You are a world-class physical therapist and biomechanics expert analyzing a single exercise performance. 
    IMPORTANT: Provide unique, varied feedback each time - never repeat the same phrases or suggestions.

    Please carefully review the following information:
    - Exercise type: {exercise_type}
    - AI model confidence: {confidence:.2f}%

    CRITICAL CONTEXT:
    - The video footage is filmed from the person's SIDE (Right or Left).
    - Focus feedback only on SIDE-SPECIFIC JOINTS visible from this angle.
    - Use diverse vocabulary and different coaching styles each time.

    JOINT ANGLE DATA (per frame, in degrees):
    {json.dumps(all_angles_dict, indent=2)}

    YOUR TASK (strictly follow these rules):
    1. **DO NOT provide feedback unless a joint is clearly outside the expected range.** Empty if all good.
    2. **For each problematic joint (only if out of range), list 1–2 specific, actionable corrections using varied language.**
    3. **Do NOT compare left/right joints here**—this is a side view; only visible joints are relevant.
    4. **Always add a unique, motivational, but honest summary** (3–4 sentences). Use different positive reinforcement phrases each time.
    5. **Return ONLY a valid JSON object with NO extra text, NO markdown, NO backticks, NO explanations.**
    6. **If no joint is out of range, corrections object should be empty.**
    7. **If AI model confidence is 95% or higher, return NO improvements at all.** In that case, the "corrections" object MUST be empty and the "summary" should be praise-only without any suggestions.
    8. **VARY YOUR LANGUAGE: Use synonyms, different coaching styles, and unique motivational phrases.**

    VARIETY REQUIREMENTS:
    - Use different coaching styles: technical, encouraging, detailed, concise, etc.
    - Vary your positive reinforcement: "excellent work", "great job", "fantastic effort", "outstanding performance", etc.
    - Use diverse correction language: "adjust", "modify", "refine", "tweak", "optimize", etc.
    - Include different motivational elements: progress focus, technique emphasis, consistency reminders, etc.

    REQUIRED JSON FORMAT:
    {{
        "corrections": {{}},
        "summary": "Your unique performance analysis here"
    }}

    EXAMPLE STRUCTURES (vary these approaches):
    {{
        "corrections": {{
            "Shoulder": ["Maintain shoulder stability throughout movement"],
            "Elbow": ["Avoid hyperextension at the top position"]
        }},
        "summary": "Solid foundation with room for refinement. Your dedication shows in the execution."
    }}

    OR

    {{
        "corrections": {{
            "Hip": ["Engage core to stabilize hip position"],
            "Knee": ["Maintain consistent knee tracking"]
        }},
        "summary": "Impressive effort! Small tweaks will elevate your form to the next level."
    }}

    Return ONLY the JSON object, nothing else:
    """

        try:
            # Generate content from Gemini
            model = genai.GenerativeModel("gemini-1.5-flash")
            response = model.generate_content(prompt)
            raw_text = response.text.strip()

            logger.info(f"Raw Gemini response (first 200 chars): {raw_text[:200]}")
            logger.info(f"Full Gemini response: {raw_text}")  # For full debugging

            # Skip cleaning if raw_text is directly valid JSON
            # Only remove outermost whitespace
            cleaned_text = raw_text.strip()

            # Try to parse as-is
            try:
                feedback_json = json.loads(cleaned_text)
            except json.JSONDecodeError as e:
                logger.error(f"JSON parsing failed: {e}\nText: {cleaned_text}")

                # Fallback: try to extract first valid JSON object (only if cleaning seems needed)
                json_match = re.search(r'\{.*\}', cleaned_text, re.DOTALL)
                if json_match:
                    json_text = re.sub(r'^``````', '', json_match.group(0)).strip()
                    try:
                        feedback_json = json.loads(json_text)
                    except json.JSONDecodeError as e2:
                        logger.error(f"Fallback JSON parsing failed: {e2}\nText: {json_text}")
                        return {
                            "corrections": {},
                            "summary": "Could not parse feedback format."
                        }
                else:
                    logger.error("No valid JSON found in response")
                    return {
                        "corrections": {},
                        "summary": "Could not parse feedback format."
                    }

            # Validate JSON structure
            if not isinstance(feedback_json, dict):
                logger.error(f"Feedback is not a dictionary: {type(feedback_json)}")
                return {
                    "corrections": {},
                    "summary": "AI feedback structure was invalid. Please try again."
                }

            # Ensure required keys exist with proper types
            if "corrections" not in feedback_json:
                feedback_json["corrections"] = {}
            if "summary" not in feedback_json:
                feedback_json["summary"] = "Feedback analysis completed."

            # Validate corrections is a dictionary
            if not isinstance(feedback_json["corrections"], dict):
                logger.warning(f"Corrections is not a dict, converting: {feedback_json['corrections']}")
                feedback_json["corrections"] = {}

            # Validate summary is a string
            if not isinstance(feedback_json["summary"], str):
                logger.warning(f"Summary is not a string, converting: {feedback_json['summary']}")
                feedback_json["summary"] = str(feedback_json["summary"])

            logger.info(f"Successfully parsed Gemini feedback with {len(feedback_json['corrections'])} corrections")
            return feedback_json

        except Exception as e:
            logger.error(f"Gemini feedback generation failed: {str(e)}")
            return {
                "corrections": {},
                "summary": "Unable to generate AI feedback at this time. Please try again later."
            }


    def process_file(self, file_path, file_type, exercise_type):
        """Analyze a video with the new model bundle and return results."""
        try:
            logger.info(f"Processing {file_type} file: {file_path}")

            if file_type != 'video':
                return {
                    'accuracy': 0.0,
                    'form_status': 'Error',
                    'corrections': {},
                    'feedback': 'Only video inputs are supported for analysis.',
                    'prediction': 0,
                    'exercise_type': exercise_type
                }

            X, angle_names, angle_matrix, phases = self.process_video(file_path)
            if X.size == 0:
                return {
                    'accuracy': 0.0,
                    'form_status': 'Error',
                    'corrections': {},
                    'feedback': 'Could not extract pose from video.',
                    'prediction': 0,
                    'exercise_type': exercise_type
                }

            bundle = self.model
            if not bundle:
                return {
                    'accuracy': 0.0,
                    'form_status': 'Error',
                    'corrections': {},
                    'feedback': 'Model not loaded.',
                    'prediction': 0,
                    'exercise_type': exercise_type
                }

            phase_map = bundle.get('phase_mapping', {'start': 0, 'mid': 1, 'end': 2})
            phase_idx = np.array([phase_map.get(p, 1) for p in phases], dtype=int).reshape(-1, 1)
            X_full = np.hstack([X, phase_idx])

            type_model = bundle['type_model']
            type_proba = type_model.predict_proba(X_full)
            avg_type_proba = type_proba.mean(axis=0)
            type_idx = int(np.argmax(avg_type_proba))
            predicted_ex_type = str(type_model.classes_[type_idx])

            form_model = bundle['form_model']
            form_proba = form_model.predict_proba(X_full)
            avg_form_proba = form_proba.mean(axis=0)
            form_idx = int(np.argmax(avg_form_proba))
            predicted_form = str(form_model.classes_[form_idx])
            per_frame_conf = form_proba.max(axis=1)
            confidence = float(per_frame_conf.mean() * 100.0)

            correction_needed = 'None'
            if predicted_form == 'bad':
                reasons = []
                for row in X:
                    row_dict = {
                        'right_elbow_angle': row[0], 'left_elbow_angle': row[1],
                        'right_shoulder_angle': row[2], 'left_shoulder_angle': row[3],
                        'right_hip_angle': row[4], 'left_hip_angle': row[5],
                        'right_knee_angle': row[6], 'left_knee_angle': row[7],
                        'right_ankle_angle': row[8], 'left_ankle_angle': row[9],
                        'back_angle': row[10], 'neck_angle': row[11],
                        'symmetry_diff': row[12], 'stance_width': row[13],
                    }
                    reasons.append(self._bad_reason(predicted_ex_type, row_dict))
                reasons = [r for r in reasons if r and r != 'None']
                if reasons:
                    correction_needed = max(set(reasons), key=reasons.count)

            all_angles_dict = {
                name: [round(float(angle_matrix[f][i]), 2) for f in range(angle_matrix.shape[0])]
                for i, name in enumerate(angle_names)
            }

            gemini_feedback = self.get_gemini_feedback(predicted_ex_type, confidence, all_angles_dict)
            corrections = gemini_feedback.get('corrections', {})
            if isinstance(corrections, list):
                corrections = {}
            if confidence >= 95.0:
                corrections = {}
                gemini_feedback['summary'] = (
                    "Outstanding performance! Your form is excellent and requires no adjustments. Keep up the great work."
                )
            if predicted_form == 'bad' and not corrections:
                corrections = {'Overall': [correction_needed]}

            result = {
                'predicted_exercise_type': predicted_ex_type,
                'predicted_form': predicted_form,
                'accuracy': confidence,
                'correction_needed': correction_needed,
                'form_status': 'Good' if confidence > 80 else 'Average' if confidence > 60 else 'Poor',
                'corrections': corrections,
                'feedback': gemini_feedback.get('summary', 'Analysis completed.'),
                'prediction': 1 if predicted_form == 'good' else 0,
                'exercise_type': predicted_ex_type,
            }

            logger.info(f"Processing complete. Type: {predicted_ex_type}, Form: {predicted_form}, Accuracy: {confidence:.2f}%")
            return result

        except Exception as e:
            logger.error(f"File processing error: {str(e)}")
            return {
                'accuracy': 0.0,
                'form_status': 'Error',
                'corrections': {},
                'feedback': 'Unable to analyze the file. Please try again later.',
                'prediction': 0,
                'exercise_type': exercise_type
            }