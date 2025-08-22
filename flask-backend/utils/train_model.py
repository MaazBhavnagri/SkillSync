import os
import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score


FEATURE_COLUMNS = [
    'right_elbow_angle', 'left_elbow_angle',
    'right_shoulder_angle', 'left_shoulder_angle',
    'right_hip_angle', 'left_hip_angle',
    'right_knee_angle', 'left_knee_angle',
    'right_ankle_angle', 'left_ankle_angle',
    'back_angle', 'neck_angle',
    'symmetry_diff', 'stance_width',
    # Phase will be numeric encoded below
]


def _encode_phase(series):
    mapping = {'start': 0, 'mid': 1, 'end': 2}
    return series.map(mapping).fillna(1).astype(int), mapping


def train_and_save(dataset_csv: str = None, model_out: str = None):
    here = os.path.dirname(__file__)
    if dataset_csv is None:
        dataset_csv = os.path.join(here, 'dataset', 'exercise_dataset.csv')
    if model_out is None:
        model_out = os.path.join(here, 'models', 'exercise_model.pkl')

    df = pd.read_csv(dataset_csv)
    if df.empty:
        raise RuntimeError('Dataset is empty. Build the dataset first.')

    # Encode phase
    df['phase_idx'], phase_mapping = _encode_phase(df['phase'])

    # Features
    X = df[FEATURE_COLUMNS + ['phase_idx']].fillna(0.0)

    # Targets
    y_type = df['exc_type']
    y_form = df['form']

    X_train, X_test, y_type_train, y_type_test, y_form_train, y_form_test = train_test_split(
        X, y_type, y_form, test_size=0.2, random_state=42, stratify=y_type
    )

    type_model = RandomForestClassifier(n_estimators=300, random_state=42)
    form_model = RandomForestClassifier(n_estimators=300, random_state=42)

    type_model.fit(X_train, y_type_train)
    form_model.fit(X_train, y_form_train)

    type_acc = accuracy_score(y_type_test, type_model.predict(X_test))
    form_acc = accuracy_score(y_form_test, form_model.predict(X_test))

    os.makedirs(os.path.dirname(model_out), exist_ok=True)
    bundle = {
        'type_model': type_model,
        'form_model': form_model,
        'feature_columns': FEATURE_COLUMNS + ['phase_idx'],
        'phase_mapping': phase_mapping,
        'type_accuracy': float(type_acc),
        'form_accuracy': float(form_acc),
    }
    joblib.dump(bundle, model_out)
    return model_out, type_acc, form_acc


if __name__ == '__main__':
    path, t_acc, f_acc = train_and_save()
    print(f"Saved model to: {path}\nType acc: {t_acc:.3f}\nForm acc: {f_acc:.3f}")


