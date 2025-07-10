import joblib
import os
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score
import joblib

# Load your dataset
df = pd.read_csv("data/pushups_combined.csv")

# Convert 'phase' and 'label' to dummies
df = pd.get_dummies(df, columns=['phase', 'label'], drop_first=True)

# Separate features and target
X = df.drop(columns=['form'])  # form is your label
y = df['form']


# Train-test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Model training
clf = RandomForestClassifier(n_estimators=100, random_state=42)
clf.fit(X_train, y_train)

# Evaluation
y_pred = clf.predict(X_test)
print("Accuracy:", accuracy_score(y_test, y_pred))
print(classification_report(y_test, y_pred))

# Save the model
# Save the model

os.makedirs("models", exist_ok=True)  # ensure the 'models' folder exists
joblib.dump(clf, "models/pushup_form_classifier.pkl")
print("Model saved to models/pushup_form_classifier.pkl")

