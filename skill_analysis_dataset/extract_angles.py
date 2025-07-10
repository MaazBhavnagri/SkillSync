import cv2
import mediapipe as mp
import pandas as pd
import os
from utils.angle_utils import calculate_angle

mp_pose = mp.solutions.pose
pose = mp_pose.Pose()
mp_drawing = mp.solutions.drawing_utils

def extract_pose_angles(video_path, label):
    cap = cv2.VideoCapture(video_path)
    frame_data = []

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        # Convert color
        image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        result = pose.process(image)

        if result.pose_landmarks:
            landmarks = result.pose_landmarks.landmark

            # Example points: shoulder, elbow, wrist (right arm)
            shoulder = [landmarks[12].x, landmarks[12].y]
            elbow = [landmarks[14].x, landmarks[14].y]
            wrist = [landmarks[16].x, landmarks[16].y]

            angle = calculate_angle(shoulder, elbow, wrist)

            frame_data.append({
                "right_elbow_angle": angle,
                "label": label
            })

    cap.release()
    return frame_data

# Save dataset
def save_to_csv(data, out_csv):
    df = pd.DataFrame(data)
    df.to_csv(out_csv, index=False)
    print(f"Saved to {out_csv}")

# Loop through video folders
if __name__ == "__main__":
    exercises = ["pushups", "squats"]
    for exercise in exercises:
        path = os.path.join("videos", exercise)
        all_data = []
        for video_file in os.listdir(path):
            full_path = os.path.join(path, video_file)
            print(f"Processing: {full_path}")
            data = extract_pose_angles(full_path, label=exercise)
            all_data.extend(data)
        save_to_csv(data, f"data/pushups_angles_bad.csv")