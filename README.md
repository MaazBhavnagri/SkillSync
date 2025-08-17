# Skill Analysis Platform

A comprehensive web application for analyzing and improving physical skills through AI-powered video analysis.

## Features

### Dashboard
- **User Profile Display**: Shows user avatar, name, and level information
- **Real-time Stats**: Total uploads, average score, skills improved, and achievements
- **Recent Uploads**: Displays the latest 3 uploads with thumbnails and scores
- **XP System**: Gamified experience with levels and progress tracking

### History
- **Upload Management**: View all past uploads with filtering and search
- **Video Playback**: Watch uploaded videos directly in the browser
- **Detailed Analysis**: Expand uploads to see form status, feedback, and corrections
- **Sorting Options**: Sort by date, score, or title

### Settings
- **Profile Management**: Update name and email
- **Password Security**: Change password with current password verification
- **Notification Preferences**: Control email and push notifications
- **Theme Toggle**: Switch between light and dark modes

### Upload & Analysis
- **Video Upload**: Support for MP4, AVI, MOV, WMV formats
- **AI Analysis**: Real-time form analysis with accuracy scoring
- **XP Rewards**: Earn experience points based on performance
- **Email Notifications**: Get notified when analysis is complete

## Tech Stack

### Frontend
- **React** with Vite
- **Framer Motion** for animations
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Context API** for state management

### Backend
- **Flask** Python web framework
- **SQLAlchemy** ORM
- **SQLite** database
- **Flask-Login** for authentication
- **Flask-Session** for session management
- **Flask-CORS** for cross-origin requests

### AI/ML
- **OpenCV** for video processing
- **MediaPipe** for pose detection
- **Scikit-learn** for machine learning models
- **Custom ML models** for exercise analysis

## Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or pnpm

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd flask-backend
   ```

2. **Create virtual environment**:
   ```bash
   python -m venv venv
   ```

3. **Activate virtual environment**:
   ```bash
   # Windows
   venv\Scripts\activate
   
   # macOS/Linux
   source venv/bin/activate
   ```

4. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

5. **Initialize database**:
   ```bash
   python db_init.py
   ```

6. **Run database migration** (if needed):
   ```bash
   python db_migration.py
   ```

7. **Start the backend server**:
   ```bash
   python app.py
   ```

The backend will be available at `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

The frontend will be available at `http://localhost:5173`

## Environment Variables

### Backend (.env file in flask-backend/)
```env
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///instance/skill_analysis.db
UPLOAD_FOLDER=uploads
ALLOWED_EXTENSIONS=mp4,avi,mov,wmv,jpg,jpeg,png
```

### Frontend (.env file in frontend/)
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## API Endpoints

### Authentication
- `POST /api/login` - User login
- `POST /api/signup` - User registration
- `POST /api/logout` - User logout
- `GET /api/verify-session` - Verify user session
- `POST /api/change-password` - Change user password

### Uploads
- `POST /api/upload` - Upload video for analysis
- `GET /api/results/latest` - Get latest analysis results

### History
- `GET /api/history` - Get user upload history
- `DELETE /api/history/<id>` - Delete specific upload

### Settings
- `GET /api/settings` - Get user settings
- `POST /api/settings` - Update user settings

## Database Schema

### Users Table
- `id` - Primary key
- `name` - User's full name
- `email` - Unique email address
- `password_hash` - Hashed password
- `avatar_url` - Profile picture URL
- `xp` - Experience points
- `level` - User level
- `dark_mode` - Theme preference
- `created_at` - Account creation date
- `is_active` - Account status

### Uploads Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `file_name` - Original filename
- `file_path` - Server file path
- `file_type` - Video or image
- `file_size` - File size in bytes
- `exercise_type` - Type of exercise
- `accuracy` - Analysis accuracy score
- `form_status` - Form quality assessment
- `corrections` - JSON array of corrections
- `feedback` - General feedback text
- `processing_status` - Analysis status
- `created_at` - Upload timestamp

### Settings Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `email_notifications` - Email notification preference
- `workout_reminders` - Workout reminder preference
- `preferences_json` - Additional preferences

## Testing

### Backend Testing
```bash
cd flask-backend
python test_backend.py
```

### Frontend Testing
```bash
cd frontend
npm run test
```

## Deployment

### Backend Deployment
1. Set up a production server (e.g., Ubuntu with Nginx)
2. Install Python and required packages
3. Set up environment variables
4. Use Gunicorn or uWSGI as WSGI server
5. Configure Nginx as reverse proxy

### Frontend Deployment
1. Build the production version:
   ```bash
   npm run build
   ```
2. Deploy the `dist` folder to a web server
3. Configure environment variables for production

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue on GitHub or contact the development team.
