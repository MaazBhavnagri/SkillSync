from flask import Flask, jsonify, request,session
from flask_cors import CORS
from flask_session import Session  # Add this import
from decorators import login_required_api
from flask_login import LoginManager
from config import Config
from models import db, User
import os
import logging
from datetime import datetime
from flask import send_from_directory

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Initialize extensions
    db.init_app(app)
    login_manager = LoginManager(app)
    login_manager.login_view = 'auth.login'
    
    app.config['SESSION_TYPE'] = 'filesystem'  # Or 'redis' for production
    app.config['SESSION_COOKIE_SECURE'] = True  # For HTTPS
    app.config['SESSION_COOKIE_HTTPONLY'] = True
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'  # CSRF protection
    Session(app)  # Initialize Flask-Session

    # Configure CORS
    CORS(app,
     origins=[
         "https://skillsync-ruby.vercel.app",
         "http://localhost:3000",
         "http://localhost:5173",
         "http://127.0.0.1:5173"
     ],
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
    
    # Create necessary directories
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    os.makedirs('ml_models', exist_ok=True)

    # User loader for Flask-Login
    @login_manager.user_loader
    def load_user(user_id):
        user = User.query.get(int(user_id))
        if user and user.is_active:  # ← Check if user exists AND is active
            return user
        return None  # Will cause 401 if user not found
    
    @login_required_api
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({'error': 'Token has expired'}), 401
    
    @login_required_api
    def invalid_token_callback(error):
        return jsonify({'error': 'Invalid token'}), 401
    
    @login_required_api
    def missing_token_callback(error):
        return jsonify({'error': 'Authorization token is required'}), 401
    
    # Register blueprints
    from routes.auth import auth_bp
    from routes.upload import upload_bp
    from routes.history import history_bp
    from routes.settings import settings_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api')
    app.register_blueprint(upload_bp, url_prefix='/api')
    app.register_blueprint(history_bp, url_prefix='/api')
    app.register_blueprint(settings_bp, url_prefix='/api')
    
    app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SECURE=False,  # True in production
    SESSION_COOKIE_SAMESITE='Lax',
    SECRET_KEY='your-secret-key'  # Must be set!
    )
    
    @app.route('/uploads/<filename>')
    def uploaded_file(filename):
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)
        
    @app.route('/uploads/avatars/<filename>')
    def uploaded_avatar(filename):
        return send_from_directory(os.path.join(app.config['UPLOAD_FOLDER'], 'avatars'), filename)
        
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