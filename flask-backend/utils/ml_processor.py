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
        """Load the pre-trained ML model"""
        model_path = os.path.join(os.path.dirname(__file__), 'model', 'updated_exercise_rf_model.pkl')
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
    
    
    def process_video(self, video_path):
        """Process a video file and extract 100 features (10 angles X 10 frames)"""
        try:
            cap = cv2.VideoCapture(video_path)
            if not cap.isOpened():
                raise ValueError("Could not open video")

            angle_features = []
            frame_count = 0
            max_frames = 10  # We want exactly 10 frames

            while frame_count < max_frames:
                ret, frame = cap.read()
                if not ret:
                    break

                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                results = self.pose.process(frame_rgb)

                if results.pose_landmarks:
                    angles = self.extract_model_angles(results.pose_landmarks.landmark)
                    angle_features.append(angles)
                    frame_count += 1

            cap.release()

            if len(angle_features) < 10:
                # Pad with zeros if fewer than 10 valid frames
                for _ in range(10 - len(angle_features)):
                    angle_features.append([0.0] * 10)

            angle_features_np = np.array(angle_features).T  # shape: (10 angles, 10 frames)
            flat_features = angle_features_np.flatten()     # shape: (100,)

            return flat_features

        except Exception as e:
            logger.error(f"Video processing error: {str(e)}")
            return np.zeros(100)

    
    

    genai.configure(api_key="AIzaSyBJH4lnx4kjusFrMdqpmbOkEl_xXCEX6WU")

    def get_gemini_feedback(self, exercise_type, confidence, all_angles_dict):
        logger.info(f"Taking Feedback from gemini")

        # Enhanced prompt with clear requirements
        prompt = f"""
    You are a world-class physical therapist and biomechanics expert analyzing a single exercise performance.

    Please carefully review the following information:
    - Exercise type: {exercise_type}
    - AI model confidence: {confidence:.2f}%

    CRITICAL CONTEXT:
    - The video footage is filmed from the person's SIDE (Right or Left).
    - Focus feedback only on SIDE-SPECIFIC JOINTS visible from this angle.

    JOINT ANGLE DATA (per frame, in degrees):
    {json.dumps(all_angles_dict, indent=2)}

    YOUR TASK (strictly follow these rules):
    1. **DO NOT provide feedback unless a joint is clearly outside the expected range.** Empty if all good.
    2. **For each problematic joint (only if out of range), list 1–2 specific, actionable corrections.** If not, omit it.
    3. **Do NOT compare left/right joints here**—this is a side view; only visible joints are relevant.
    4. **Always add a single, motivational, but honest summary** (3–4 sentences). Call out what was done well and what to focus on.
    5. **Return ONLY a valid JSON object with NO extra text, NO markdown, NO backticks, NO explanations.**
    6. **If no joint is out of range, corrections object should be empty.**

    REQUIRED JSON FORMAT:
    {{
        "corrections": {{}},
        "summary": "Your performance analysis here"
    }}

    EXAMPLE (do not copy content, only structure):
    {{
        "corrections": {{
            "Shoulder": ["Keep shoulder blade stable"],
            "Elbow": ["Do not lock elbow at top"]
        }},
        "summary": "Good overall form with minor adjustments needed for elbow positioning."
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
        """Main processing function with improved error handling"""
        try:
            logger.info(f"Processing {file_type} file: {file_path}")
            
            if file_type == 'video':
                features = self.process_video(file_path)
            else:
                features = self.process_image(file_path)
            
            # Make prediction
            features_reshaped = features.reshape(1, -1)
            proba = self.model.predict_proba(features_reshaped)[0]
            prediction = int(np.argmax(proba))
            confidence = float(np.max(proba) * 100)

            # Reshape features into (frames, 10 angles)
            num_frames = len(features) // 10
            all_angles = features.reshape(num_frames, 10)

            # Create joint name → list of angles per frame
            angle_names = [
                "Right Elbow", "Left Elbow", "Right Shoulder", "Left Shoulder",
                "Right Hip", "Left Hip", "Right Knee", "Left Knee",
                "Right Ankle", "Left Ankle"
            ]
            all_angles_dict = {
                name: [round(float(all_angles[f][i]), 2) for f in range(num_frames)]
                for i, name in enumerate(angle_names)
            }

            # Get Gemini feedback
            gemini_feedback = self.get_gemini_feedback(exercise_type, confidence, all_angles_dict)

            # Ensure corrections is a dictionary (not a list) for frontend compatibility
            corrections = gemini_feedback.get("corrections", {})
            if isinstance(corrections, list):
                # Convert list to empty dict if it's somehow a list
                corrections = {}
            
            result = {
                'accuracy': confidence,
                'form_status': 'Good' if confidence > 80 else 'Average' if confidence > 60 else 'Poor',
                'corrections': corrections,  # Always a dictionary
                'feedback': gemini_feedback.get("summary", "Analysis completed."),
                'prediction': prediction,
                'exercise_type': exercise_type
            }
            
            logger.info(f"Processing complete. Prediction: {prediction}, Accuracy: {confidence:.2f}%")
            logger.info(f"Result corrections type: {type(result['corrections'])}")
            return result

        except Exception as e:
            logger.error(f"File processing error: {str(e)}")
            return {
                'accuracy': 0.0,
                'form_status': 'Error',
                'corrections': {},  # Always a dictionary, never a list
                'feedback': 'Unable to analyze the file. Please ensure it contains clear body movement.',
                'prediction': 0,
                'exercise_type': exercise_type
            }

    # def process_image(self, image_path):
    #     """Process a single image"""
    #     try:
    #         image = cv2.imread(image_path)
    #         if image is None:
    #             raise ValueError("Could not load image")
            
    #         image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    #         results = self.pose.process(image_rgb)
            
    #         if results.pose_landmarks:
    #             features = self.extract_pose_features(results.pose_landmarks.landmark)
    #             return features
    #         else:
    #             return np.zeros(20)
    #     except Exception as e:
    #         logger.error(f"Image processing error: {str(e)}")
    #         return np.zeros(20)
    
    
    # def generate_feedback(self, prediction, exercise_type, features):
    #     """Generate feedback based on prediction and exercise type"""
    #     feedback_map = {
    #         0: "Poor",
    #         1: "Fair", 
    #         2: "Good"
    #     }
        
    #     form_status = feedback_map.get(prediction, "Poor")
        
    #     # Generate corrections based on exercise type and prediction
    #     corrections = []
    #     feedback = ""
        
    #     if exercise_type.lower() == 'pushup':
    #         if prediction == 0:  # Poor
    #             corrections = [
    #                 "Keep your back straight and aligned",
    #                 "Lower your chest closer to the ground",
    #                 "Push up with full arm extension"
    #             ]
    #             feedback = "Focus on maintaining proper form. Your pushup technique needs improvement."
    #         elif prediction == 1:  # Fair
    #             corrections = [
    #                 "Maintain consistent tempo",
    #                 "Keep core engaged throughout the movement"
    #             ]
    #             feedback = "Good effort! Small adjustments will perfect your form."
    #         else:  # Good
    #             corrections = []
    #             feedback = "Excellent pushup form! Keep up the great work."
        
    #     elif exercise_type.lower() == 'squat':
    #         if prediction == 0:  # Poor
    #             corrections = [
    #                 "Keep your knees aligned with your toes",
    #                 "Lower down until thighs are parallel to floor",
    #                 "Keep your chest up and back straight"
    #             ]
    #             feedback = "Work on your squat depth and knee alignment."
    #         elif prediction == 1:  # Fair
    #             corrections = [
    #                 "Try to go deeper in your squat",
    #                 "Keep weight on your heels"
    #             ]
    #             feedback = "Good squat! Focus on depth and balance."
    #         else:  # Good
    #             corrections = []
    #             feedback = "Perfect squat form! Excellent technique."
        
    #     else:  # General exercise
    #         if prediction == 0:  # Poor
    #             corrections = [
    #                 "Focus on proper body alignment",
    #                 "Control your movement speed",
    #                 "Maintain consistent form"
    #             ]
    #             feedback = "Keep practicing to improve your form."
    #         elif prediction == 1:  # Fair
    #             corrections = [
    #                 "Fine-tune your technique",
    #                 "Maintain focus throughout the movement"
    #             ]
    #             feedback = "Good form! Small improvements will make it perfect."
    #         else:  # Good
    #             corrections = []
    #             feedback = "Excellent form! Keep up the great work."
        
    #     # Calculate accuracy based on prediction
    #     accuracy_map = {0: 45.0, 1: 75.0, 2: 95.0}
    #     accuracy = accuracy_map.get(prediction, 50.0)
        
    #     return {
    #         'accuracy': accuracy,
    #         'form_status': form_status,
    #         'corrections': corrections,
    #         'feedback': feedback,
    #         'prediction': int(prediction),
    #         'exercise_type': exercise_type
    #     }