import os
import cv2
import math
import random
import pandas as pd
import numpy as np
import mediapipe as mp


def _angle_between(a, b, c):
    try:
        a = np.array(a, dtype=float)
        b = np.array(b, dtype=float)
        c = np.array(c, dtype=float)
        ab = a - b
        cb = c - b
        dot = np.dot(ab, cb)
        denom = np.linalg.norm(ab) * np.linalg.norm(cb)
        if denom == 0:
            return 0.0
        angle = np.degrees(np.arccos(np.clip(dot / denom, -1.0, 1.0)))
        if angle > 180.0:
            angle = 360.0 - angle
        return float(angle)
    except Exception:
        return 0.0


def _angle_to_vertical(p_from, p_to):
    try:
        v = np.array([p_to[0] - p_from[0], p_to[1] - p_from[1]], dtype=float)
        vertical = np.array([0.0, 1.0], dtype=float)
        dot = float(np.dot(v, vertical))
        denom = float(np.linalg.norm(v) * np.linalg.norm(vertical))
        if denom == 0:
            return 0.0
        angle = np.degrees(np.arccos(np.clip(dot / denom, -1.0, 1.0)))
        return float(angle)
    except Exception:
        return 0.0


def _euclidean_distance(p1, p2):
    try:
        return float(np.linalg.norm(np.array(p1, dtype=float) - np.array(p2, dtype=float)))
    except Exception:
        return 0.0


def _evenly_spaced_indices(start_frame: int, end_frame: int, desired: int):
    if desired <= 0:
        return []
    if end_frame <= start_frame:
        return [int(start_frame)] * desired
    pts = np.linspace(start_frame, end_frame, num=desired)
    return [int(round(p)) for p in pts]


def _select_motion_window_indices(cap, total_frames: int, fps: float, window_seconds: float = 5.0, desired: int = 12):
    if fps is None or fps <= 0:
        fps = 30.0
    if total_frames <= 0:
        return []

    window_frames = int(max(1, round(window_seconds * fps)))
    if total_frames <= window_frames:
        # Whole video shorter than window: sample evenly across all frames
        return _evenly_spaced_indices(0, max(0, total_frames - 1), desired)

    # Coarse sampling at 1 fps to estimate motion
    coarse_step = max(1, int(round(fps)))
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

    # Motion per coarse step (sum abs diff)
    motion = [0.0] * len(coarse_frames_gray)
    for i in range(1, len(coarse_frames_gray)):
        a = coarse_frames_gray[i - 1]
        b = coarse_frames_gray[i]
        if a is None or b is None:
            motion[i] = 0.0
        else:
            diff = cv2.absdiff(a, b)
            motion[i] = float(np.sum(diff))

    # Sliding window over coarse timeline for ~window_seconds (≈ window_steps steps)
    window_steps = max(1, int(round(window_seconds)))  # since coarse is ~1 step per second
    best_sum = -1.0
    best_start_step = 0
    prefix = np.cumsum([0.0] + motion)
    for start in range(0, max(1, len(motion) - window_steps + 1)):
        end = start + window_steps
        s = prefix[end] - prefix[start]
        if s > best_sum:
            best_sum = s
            best_start_step = start

    # Map coarse start step to frame index
    start_frame = coarse_indices[min(best_start_step, len(coarse_indices) - 1)]
    end_frame = min(total_frames - 1, start_frame + window_frames - 1)

    return _evenly_spaced_indices(start_frame, end_frame, desired)


def _phase_from_index(idx: int, total: int):
    # Map frames into thirds: start, mid, end
    if total <= 0:
        return "start"
    one_third = total // 3 if total >= 3 else 1
    if idx < one_third:
        return "start"
    elif idx < 2 * one_third:
        return "mid"
    return "end"


def _extract_row_from_landmarks(landmarks, mp_pose):
    def gp(name):
        lm = landmarks[mp_pose.PoseLandmark[name].value]
        return [lm.x, lm.y]

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

    # Angles
    right_elbow_angle = _angle_between(right_shoulder, right_elbow, right_wrist)
    left_elbow_angle = _angle_between(left_shoulder, left_elbow, left_wrist)
    right_shoulder_angle = _angle_between(right_elbow, right_shoulder, right_hip)
    left_shoulder_angle = _angle_between(left_elbow, left_shoulder, left_hip)
    right_hip_angle = _angle_between(right_shoulder, right_hip, right_knee)
    left_hip_angle = _angle_between(left_shoulder, left_hip, left_knee)
    right_knee_angle = _angle_between(right_hip, right_knee, right_ankle)
    left_knee_angle = _angle_between(left_hip, left_knee, left_ankle)
    right_ankle_angle = _angle_between(right_knee, right_ankle, right_foot)
    left_ankle_angle = _angle_between(left_knee, left_ankle, left_foot)

    shoulders_mid = [(left_shoulder[0] + right_shoulder[0]) / 2.0, (left_shoulder[1] + right_shoulder[1]) / 2.0]
    hips_mid = [(left_hip[0] + right_hip[0]) / 2.0, (left_hip[1] + right_hip[1]) / 2.0]
    nose = gp('NOSE')

    back_angle = _angle_to_vertical(shoulders_mid, hips_mid)
    neck_angle = _angle_to_vertical(shoulders_mid, nose)

    symmetry_pairs = [
        (left_elbow_angle, right_elbow_angle),
        (left_shoulder_angle, right_shoulder_angle),
        (left_hip_angle, right_hip_angle),
        (left_knee_angle, right_knee_angle),
        (left_ankle_angle, right_ankle_angle),
    ]
    symmetry_diff = float(np.mean([abs(l - r) for l, r in symmetry_pairs]))

    d_shoulders = _euclidean_distance(left_shoulder, right_shoulder)
    d_knees = _euclidean_distance(left_knee, right_knee)
    d_ankles = _euclidean_distance(left_ankle, right_ankle)
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
    return row


def _bad_form_reason_and_label(exc_type: str, row: dict):
    # Default good
    label = 'good'
    reason = 'None'

    if exc_type == 'pushup':
        # Bad if hips sag (back_angle high) or elbows not bending
        if row['back_angle'] > 25 or min(row['left_elbow_angle'], row['right_elbow_angle']) > 150:
            label = 'bad'
            if row['back_angle'] > 25:
                reason = 'lower hips'
            else:
                reason = 'bend elbows more'
    elif exc_type == 'squat':
        # Bad rules: hip/knee >120 (too shallow) or <60 (too deep)
        if row['left_knee_angle'] > 120 or row['right_knee_angle'] > 120:
            label = 'bad'
            reason = 'go deeper'
        elif row['left_knee_angle'] < 60 or row['right_knee_angle'] < 60:
            label = 'bad'
            reason = 'avoid going too deep'
    elif exc_type == 'pullup':
        # Bad if elbows >160 (not pulling)
        if row['left_elbow_angle'] > 160 and row['right_elbow_angle'] > 160:
            label = 'bad'
            reason = 'pull higher'

    return label, reason


def build_dataset(
    videos_root: str = None,
    output_csv: str = None,
    frames_per_video: int = 12,
):
    here = os.path.dirname(__file__)
    if videos_root is None:
        videos_root = os.path.join(here, 'videos')
    if output_csv is None:
        output_csv = os.path.join(here, 'dataset', 'exercise_dataset.csv')

    os.makedirs(os.path.dirname(output_csv), exist_ok=True)

    mp_pose = mp.solutions.pose
    pose = mp_pose.Pose(
        static_image_mode=False,
        model_complexity=1,
        enable_segmentation=False,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5,
    )

    rows = []

    # Discover videos
    exercise_dirs = {
        'pushup': os.path.join(videos_root, 'pushups'),
        'squat': os.path.join(videos_root, 'squats'),
        'pullup': os.path.join(videos_root, 'pullups'),
        'benchpress': os.path.join(videos_root, 'benchpress'),
        'shoulderpress': os.path.join(videos_root, 'shoulderpress'),
    }

    for exc_type, path in exercise_dirs.items():
        if not os.path.isdir(path):
            continue

        # Pushups might have good/bad subfolders
        candidates = []
        if exc_type == 'pushup':
            for sub in ['good', 'bad']:
                subdir = os.path.join(path, sub)
                if os.path.isdir(subdir):
                    for fn in os.listdir(subdir):
                        if fn.lower().endswith(('.mp4', '.mov', '.avi', '.mkv')):
                            candidates.append((os.path.join(subdir, fn), sub))
        else:
            for fn in os.listdir(path):
                if fn.lower().endswith(('.mp4', '.mov', '.avi', '.mkv')):
                    candidates.append((os.path.join(path, fn), None))

        for video_path, pushup_sub in candidates:
            cap = cv2.VideoCapture(video_path)
            if not cap.isOpened():
                continue
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            fps = float(cap.get(cv2.CAP_PROP_FPS))
            idxs = _select_motion_window_indices(cap, total_frames, fps, window_seconds=5.0, desired=frames_per_video)

            for i, frame_idx in enumerate(idxs):
                cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
                ok, frame = cap.read()
                if not ok or frame is None:
                    continue
                rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                result = pose.process(rgb)
                if not result.pose_landmarks:
                    continue
                row = _extract_row_from_landmarks(result.pose_landmarks.landmark, mp_pose)

                # Metadata
                row['frame'] = int(i + 1)  # 1..12
                row['phase'] = _phase_from_index(i, len(idxs))
                row['exc_type'] = exc_type

                # Form and correction
                if exc_type == 'pushup' and pushup_sub is not None:
                    # Trust folder label for pushups
                    row['form'] = 'good' if pushup_sub == 'good' else 'bad'
                    if row['form'] == 'bad':
                        _, reason = _bad_form_reason_and_label(exc_type, row)
                        row['correction_needed'] = reason
                    else:
                        row['correction_needed'] = 'None'
                else:
                    label, reason = _bad_form_reason_and_label(exc_type, row)
                    row['form'] = label
                    row['correction_needed'] = reason if label == 'bad' else 'None'

                # Accuracy
                if row['form'] == 'good':
                    row['accuracy'] = random.randint(90, 100)
                else:
                    row['accuracy'] = random.randint(50, 70)

                rows.append(row)

            cap.release()

            # Synthetic bad samples for pushups
            if exc_type == 'pushup' and pushup_sub == 'bad':
                synth_count = 4
                for _ in range(synth_count):
                    if not rows:
                        continue
                    base = random.choice([r for r in rows if r['exc_type'] == 'pushup'])
                    synth = base.copy()
                    for k in [
                        'left_elbow_angle', 'right_elbow_angle', 'left_shoulder_angle', 'right_shoulder_angle',
                        'left_hip_angle', 'right_hip_angle', 'left_knee_angle', 'right_knee_angle',
                        'left_ankle_angle', 'right_ankle_angle', 'back_angle', 'neck_angle']:
                        synth[k] = max(0.0, min(180.0, synth[k] + random.uniform(-25, 25)))
                    synth['symmetry_diff'] = synth['symmetry_diff'] + random.uniform(5, 15)
                    synth['stance_width'] = max(0.0, min(2.0, synth['stance_width'] + random.uniform(-0.05, 0.05)))
                    synth['form'] = 'bad'
                    synth['correction_needed'] = random.choice(['lower hips', 'bend elbows more', 'align shoulders'])
                    synth['accuracy'] = random.randint(50, 70)
                    rows.append(synth)

    # Assemble DataFrame with required column order
    cols = [
        'frame',
        'right_elbow_angle', 'left_elbow_angle',
        'right_shoulder_angle', 'left_shoulder_angle',
        'right_hip_angle', 'left_hip_angle',
        'right_knee_angle', 'left_knee_angle',
        'right_ankle_angle', 'left_ankle_angle',
        'back_angle', 'neck_angle',
        'symmetry_diff', 'stance_width',
        'phase', 'exc_type', 'form', 'accuracy', 'correction_needed'
    ]

    df = pd.DataFrame(rows)
    if not df.empty:
        # Ensure all columns exist
        for c in cols:
            if c not in df.columns:
                df[c] = np.nan
        df = df[cols]

    os.makedirs(os.path.dirname(output_csv), exist_ok=True)
    df.to_csv(output_csv, index=False)
    return output_csv, len(df)


if __name__ == '__main__':
    out, n = build_dataset()
    print(f"Saved dataset to: {out} with {n} rows")


