# from flask import Flask, request, jsonify
# from flask_cors import CORS
# import os
# import sys
# import cv2
# import numpy as np
# import mediapipe as mp
# import joblib
# sys.path.append(os.path.abspath("../skill_analysis_dataset"))
# from utils.pose_utils import calculate_angle

# app = Flask(__name__)
# CORS(app)

# # Load model once
# model_path = os.path.abspath("../skill_analysis_dataset/models/pushup_form_classifier.pkl")
# model = joblib.load(model_path)
# pose = mp.solutions.pose.Pose()

# @app.route('/api/predict/', methods=['POST'])
# def predict():
#     video = request.files.get('video')
#     if not video:
#         return jsonify({'error': 'No file uploaded'}), 400

#     filepath = os.path.join("temp", video.filename)
#     video.save(filepath)

#     result = analyze_video(filepath)

#     os.remove(filepath)
#     return jsonify(result)


# def analyze_video(video_path):
#     cap = cv2.VideoCapture(video_path)
#     predictions = []

#     while cap.isOpened():
#         ret, frame = cap.read()
#         if not ret:
#             break

#         img = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
#         results = pose.process(img)

#         if results.pose_landmarks:
#             lm = results.pose_landmarks.landmark
#             try:
#                 features = [
#                     calculate_angle([lm[12].x, lm[12].y], [lm[14].x, lm[14].y], [lm[16].x, lm[16].y]),  # R elbow
#                     calculate_angle([lm[11].x, lm[11].y], [lm[13].x, lm[13].y], [lm[15].x, lm[15].y]),  # L elbow
#                     calculate_angle([lm[14].x, lm[14].y], [lm[12].x, lm[12].y], [lm[24].x, lm[24].y]),  # R shoulder
#                     calculate_angle([lm[13].x, lm[13].y], [lm[11].x, lm[11].y], [lm[23].x, lm[23].y]),  # L shoulder
#                     calculate_angle([lm[12].x, lm[12].y], [lm[24].x, lm[24].y], [lm[26].x, lm[26].y]),  # hip
#                     calculate_angle([lm[24].x, lm[24].y], [lm[26].x, lm[26].y], [lm[28].x, lm[28].y]),  # knee
#                     1,  # phase_start → assuming phase == 'start'
#                     0,  # phase_mid → dropped during one-hot encoding if drop_first=True
#                     1,  # label_pushups → assuming label == 'pushups'
#                     0   # label_others → dropped if drop_first=True
#                 ]
#                 prediction = model.predict([features])[0]
#                 predictions.append(prediction)
#             except Exception as e:
#                 print("Error:",e)
#                 continue

#     cap.release()

#     if not predictions:
#         return {'error': 'No pose detected'}

#     final_result = max(set(predictions), key=predictions.count)
#     return {
#         'total_frames': len(predictions),
#         'final_prediction': final_result,
#         'accuracy': f"{(predictions.count(final_result) / len(predictions)) * 100:.2f}%"
#     }


# if __name__ == '__main__':
#     os.makedirs('temp', exist_ok=True)
#     app.run(debug=True)



from flask import Flask, jsonify, request,session
from flask_cors import CORS
from flask_session import Session  # Add this import
from decorators import login_required_api
# from functools import wraps
# from flask_jwt_extended import JWTManager
from flask_login import LoginManager
from config import Config
from models import db, User
import os
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Initialize extensions
    db.init_app(app)
    # jwt = JWTManager(app)
    login_manager = LoginManager(app)
    login_manager.login_view = 'auth.login'
    
    app.config['SESSION_TYPE'] = 'filesystem'  # Or 'redis' for production
    app.config['SESSION_COOKIE_SECURE'] = True  # For HTTPS
    app.config['SESSION_COOKIE_HTTPONLY'] = True
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'  # CSRF protection
    Session(app)  # Initialize Flask-Session

    # Configure CORS
    CORS(app, 
         origins=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173"],
         supports_credentials=True,
         allow_headers=["Content-Type", "Authorization"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
    
    # Create necessary directories
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    os.makedirs('ml_models', exist_ok=True)
    
    # def login_required(f):
    #     @wraps(f)
    #     def decorated_function(*args, **kwargs):
    #         if 'user_id' not in session:
    #             return jsonify({"error": "Unauthorized"}), 401
    #         return f(*args, **kwargs)
    #     return decorated_function

    # User loader for Flask-Login
    @login_manager.user_loader
    def load_user(user_id):
        user = User.query.get(int(user_id))
        if user and user.is_active:  # ← Check if user exists AND is active
            return user
        return None  # Will cause 401 if user not found
    
    # JWT token handlers
    # @jwt.expired_token_loader
    @login_required_api
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({'error': 'Token has expired'}), 401
    
    # @jwt.invalid_token_loader
    @login_required_api
    def invalid_token_callback(error):
        return jsonify({'error': 'Invalid token'}), 401
    
    # @jwt.unauthorized_loader
    @login_required_api
    def missing_token_callback(error):
        return jsonify({'error': 'Authorization token is required'}), 401
    
    # Register blueprints
    from routes.auth import auth_bp
    from routes.upload import upload_bp
    from routes.history import history_bp
    from routes.settings import settings_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/')
    app.register_blueprint(upload_bp, url_prefix='/api')
    app.register_blueprint(history_bp, url_prefix='/api')
    app.register_blueprint(settings_bp, url_prefix='/api')
    
    app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SECURE=False,  # True in production
    SESSION_COOKIE_SAMESITE='Lax',
    SECRET_KEY='your-secret-key'  # Must be set!
    )
    
    # Health check endpoint
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'message': 'Skill Analysis API is running',
            'timestamp': datetime.now().isoformat()
        })
    
    # Global error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Endpoint not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        logger.error(f"Internal server error: {str(error)}")
        return jsonify({'error': 'Internal server error'}), 500
    
    @app.errorhandler(413)
    def file_too_large(error):
        return jsonify({'error': 'File too large. Maximum size is 100MB'}), 413
    
    # Initialize database
    with app.app_context():
        db.create_all()
        
        # Create default admin user if none exists
        if not User.query.first():
            admin_user = User(
                name='Admin User',
                email='admin@skillanalysis.com',
                dark_mode=False
            )
            admin_user.set_password('admin123')
            db.session.add(admin_user)
            
            # Create demo user
            demo_user = User(
                name='Demo User',
                email='demo@skillanalysis.com',
                dark_mode=False
            )
            demo_user.set_password('demo123')
            db.session.add(demo_user)
            
            db.session.commit()
            logger.info("Default users created")
    
    return app
    

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)