# SkillSync - AI-Powered Exercise Form Analysis 🏋️‍♂️

**SkillSync** is a cutting-edge platform that uses computer vision and AI to help users master exercise form. By analyzing video input in real-time, SkillSync provides instant feedback, comparing your movement against professional references to ensure safety and maximize effectiveness.

---

## 🚀 Key Features

*   **Live Form Comparison**: Mirror a reference video or photo alongside your own camera feed.
*   **Real-time AI Analysis**: Advanced pose estimation (MoveNet/BlazePose) detects key body points instantly.
*   **Instant Feedback**: Visual cues and corrective advice to adjust your posture on the fly.
*   **Video Analysis**: Upload videos for detailed breakdown and scoring.
*   **Progress Tracking**: Save your sessions and track your improvement over time (History & Analytics).
*   **Gamified Experience**: Earn scores, unlock levels, and maintain streaks.

---

## 🛠️ Tech Stack

### Frontend
*   **React + Vite**: Fast, modern UI framework.
*   **Tailwind CSS**: Utility-first styling for a sleek, responsive design.
*   **Framer Motion**: Smooth animations and transitions.
*   **TensorFlow.js**: Client-side ML for low-latency live pose estimation.

### Backend
*   **Flask (Python)**: Robust API server handling data processing and user management.
*   **SQLAlchemy**: ORM for database interactions.
*   **OpenCV + MediaPipe**: Powerful backend video processing pipelines.
*   **Authentication**: Secure user sessions and role management.

---

## 📦 Installation & Setup

### Prerequisites
*   Node.js (v18+)
*   Python (v3.9+)
*   Git

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/skillsync.git
cd skillsync
```

### 2. Backend Setup
Navigate to the backend directory and set up the Python environment.

```bash
cd flask-backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

**Environment Variables (.env)**
Create a `.env` file in `flask-backend/` based on `.env.example`.
```env
FLASK_APP=app.py
FLASK_ENV=development
SECRET_KEY=your_secret_key
DATABASE_URL=sqlite:///site.db
```

**Run the Server**
```bash
python app.py
```
*Server runs at http://localhost:5000*

### 3. Frontend Setup
Open a new terminal and navigate to the frontend directory.

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```
*Client runs at http://localhost:5173*

---

## 🤖 Models & Inference
SkillSync uses a hybrid approach for AI analysis.
*   **Client-side**: For real-time feedback (Camera), we use lightweight TensorFlow.js models loaded directly in the browser.
*   **Server-side**: For detailed video upload analysis, we use robust Python-based models.

*Note: Large model weights are not included in this repository. The system is configured to download necessary weights on first run or use publicly available model hubs.*

---

## 🛡️ Innovation Village Note
This project was developed as a comprehensive solution for automated fitness coaching, demonstrating the potential of accessible AI in personal health and wellness. 

---

## 📄 License
This project is licensed under the MIT License.
