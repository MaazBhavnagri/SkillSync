import cv2
import mediapipe as mp
import pandas as pd
import os
from utils.angle_utils import calculate_angle  # Ensure this is defined

mp_pose = mp.solutions.pose
pose = mp_pose.Pose()
mp_drawing = mp.solutions.drawing_utils

def get_phase_from_angle(angle, prev_angle):
    if angle > 160:
        return "start"
    elif angle <= 90:
        return "bottom"
    elif angle < prev_angle:
        return "down"
    elif angle > prev_angle:
        return "up"
    return "unknown"

def extract_pose_angles(video_path, label):
    cap = cv2.VideoCapture(video_path)
    frame_data = []
    frame_num = 0
    prev_elbow_angle = None

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        frame_num += 1
        image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        result = pose.process(image)

        if result.pose_landmarks:
            lm = result.pose_landmarks.landmark

            # Points
            r_shoulder = [lm[12].x, lm[12].y]
            r_elbow    = [lm[14].x, lm[14].y]
            r_wrist    = [lm[16].x, lm[16].y]

            l_shoulder = [lm[11].x, lm[11].y]
            l_elbow    = [lm[13].x, lm[13].y]
            l_wrist    = [lm[15].x, lm[15].y]

            r_hip      = [lm[24].x, lm[24].y]
            r_knee     = [lm[26].x, lm[26].y]
            r_ankle    = [lm[28].x, lm[28].y]

            l_hip      = [lm[23].x, lm[23].y]
            l_knee     = [lm[25].x, lm[25].y]
            l_ankle    = [lm[27].x, lm[27].y]

            # Angles
            right_elbow_angle = calculate_angle(r_shoulder, r_elbow, r_wrist)
            left_elbow_angle  = calculate_angle(l_shoulder, l_elbow, l_wrist)
            right_shoulder_angle = calculate_angle(r_hip, r_shoulder, r_elbow)
            left_shoulder_angle  = calculate_angle(l_hip, l_shoulder, l_elbow)
            hip_angle = calculate_angle(r_shoulder, r_hip, r_knee)
            knee_angle = calculate_angle(r_hip, r_knee, r_ankle)

            # Determine phase based on elbow
            if prev_elbow_angle is None:
                phase = "start"
            else:
                phase = get_phase_from_angle(right_elbow_angle, prev_elbow_angle)
            prev_elbow_angle = right_elbow_angle

            frame_data.append({
                "frame": frame_num,
                "right_elbow_angle": right_elbow_angle,
                "left_elbow_angle": left_elbow_angle,
                "right_shoulder_angle": right_shoulder_angle,
                "left_shoulder_angle": left_shoulder_angle,
                "hip_angle": hip_angle,
                "knee_angle": knee_angle,
                "phase": phase,
                "label": label
            })

    cap.release()
    return frame_data

# Save CSV
def save_to_csv(data, out_csv):
    df = pd.DataFrame(data)
    df.to_csv(out_csv, index=False)
    print(f"✅ Saved to {out_csv}")

# Run
if __name__ == "__main__":
    exercise = "pushups"
    form = "bad"
    path = os.path.join("videos", 'push_bad')
    all_data = []
    for video_file in os.listdir(path):
        if not video_file.endswith(".mp4"):
            continue
        full_path = os.path.join(path, video_file)
        print(f"🎥 Processing: {full_path}")
        data = extract_pose_angles(full_path, label=exercise)
        # Add 'form' to each record here:
        for frame in data:
            frame["form"] = form
        all_data.extend(data)
    save_to_csv(all_data, f"data/pushups_angles_bad.csv")
