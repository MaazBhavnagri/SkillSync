import pandas as pd
import numpy as np
import os
import warnings
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
from sklearn.preprocessing import LabelEncoder

warnings.filterwarnings('ignore')

# Load and prepare data
def load_and_preprocess(filepath):
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Dataset file not found at {filepath}")

    df = pd.read_csv(filepath)

    required_cols = ['form', 'exc_type'] + [
        'right_elbow_angle', 'left_elbow_angle',
        'right_shoulder_angle', 'left_shoulder_angle',
        'right_hip_angle', 'left_hip_angle',
        'right_knee_angle', 'left_knee_angle',
        'right_ankle_angle', 'left_ankle_angle'
    ]

    missing_cols = [col for col in required_cols if col not in df.columns]
    if missing_cols:
        raise ValueError(f"Missing required columns: {missing_cols}")

    df = df.sort_values(['exc_type'])
    le = LabelEncoder()
    df['form'] = le.fit_transform(df['form'])

    return df, le

# Create windowed time-series features
def create_ts_features(df):
    angle_cols = [
        'right_elbow_angle', 'left_elbow_angle',
        'right_shoulder_angle', 'left_shoulder_angle',
        'right_hip_angle', 'left_hip_angle',
        'right_knee_angle', 'left_knee_angle',
        'right_ankle_angle', 'left_ankle_angle'
    ]

    features = []
    labels = []
    window_size = 10

    for _, exc_group in df.groupby('exc_type'):
        exc_group = exc_group.reset_index(drop=True)
        for i in range(len(exc_group) - window_size + 1):
            window = exc_group.iloc[i:i + window_size]
            angles = window[angle_cols].values.T  # shape: (n_features, timepoints)
            features.append(angles)
            labels.append(window['form'].iloc[-1])

    features_np = np.stack(features)  # shape: (samples, features, timepoints)
    return features_np, np.array(labels)

# Main training pipeline
def main():
    try:
        print("Loading data...")
        data_path = os.path.join('dataset', 'cleaned_and_resampled_exercise_data.csv')
        df, label_encoder = load_and_preprocess(data_path)

        print("Creating time series features...")
        X, y = create_ts_features(df)

        if len(X) == 0:
            raise ValueError("No valid time series windows created - check your window size")

        # Flatten for sklearn compatibility
        X_flat = X.reshape(X.shape[0], -1)

        X_train, X_test, y_train, y_test = train_test_split(
            X_flat, y, test_size=0.2, random_state=42, stratify=y
        )

        print("Training Random Forest...")
        clf = RandomForestClassifier(n_estimators=200, random_state=42)
        clf.fit(X_train, y_train)

        print("Evaluating model...")
        y_pred = clf.predict(X_test)

        print("\nAccuracy:", accuracy_score(y_test, y_pred))
        print("\nClassification Report:\n", classification_report(y_test, y_pred))

        os.makedirs('model', exist_ok=True)
        joblib.dump(clf, 'model/updated_exercise_rf_model.pkl')
        joblib.dump(label_encoder, 'model/updated_label_encoder.pkl')
        print("Model saved successfully!")

    except Exception as e:
        print("\nError occurred:", str(e))


if __name__ == "__main__":
    main()
