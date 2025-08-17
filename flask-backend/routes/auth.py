from flask import Blueprint, request, jsonify, session, current_app
from flask_login import login_user, logout_user, current_user, login_required
from models import User, db, Settings
from decorators import login_required_api
from email_validator import validate_email, EmailNotValidError
from werkzeug.utils import secure_filename
import os
import logging
from datetime import datetime

auth_bp = Blueprint('auth', __name__)
logger = logging.getLogger(__name__)

def allowed_avatar_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in {'png', 'jpg', 'jpeg', 'gif'}

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Invalid JSON data'}), 400
        
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        try:
            validate_email(email)
        except EmailNotValidError:
            return jsonify({'error': 'Invalid email format'}), 400
        
        user = User.query.filter_by(email=email).first()
        
        if user and user.check_password(password) and user.is_active:
            login_user(user)  # Flask-Login handles session creation
            session['user_id'] = user.id  # Additional session data if needed
            
            logger.info(f"User {email} logged in successfully")
            
            return jsonify({
                'success': True,
                'message': 'Login successful',
                'user': user.to_dict()
            }), 200
        else:
            logger.warning(f"Failed login attempt for {email}")
            return jsonify({'error': 'Invalid email or password'}), 401
    
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({'error': 'Login failed'}), 500

@auth_bp.route('/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Invalid JSON data'}), 400
        
        name = data.get('name', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        # Validation checks
        if not name or not email or not password:
            return jsonify({'error': 'Name, email, and password are required'}), 400
        
        if len(password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters long'}), 400
        
        try:
            validate_email(email)
        except EmailNotValidError:
            return jsonify({'error': 'Invalid email format'}), 400
        
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already registered'}), 409
        
        # Create user with settings in one operation
        user = User(
            name=name,
            email=email,
            settings=Settings()  # This automatically links the settings to the user
        )
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()  # Single commit for both user and settings
        
        login_user(user)
        
        logger.info(f"New user registered: {email}")
        
        return jsonify({
            'success': True,
            'message': 'Account created successfully',
            'user': user.to_dict(),
            'settings': user.settings.to_dict() if user.settings else None
        }), 201
    
    except Exception as e:
        logger.error(f"Signup error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Account creation failed'}), 500

@auth_bp.route('/upload-avatar', methods=['POST'])
@login_required_api
def upload_avatar():
    try:
        if 'avatar' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['avatar']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_avatar_file(file.filename):
            return jsonify({'error': 'Invalid file type. Only PNG, JPG, JPEG, and GIF are allowed'}), 400
        
        # Generate unique filename
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"avatar_{current_user.id}_{timestamp}_{filename}"
        
        # Create avatars directory if it doesn't exist
        avatars_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], 'avatars')
        os.makedirs(avatars_dir, exist_ok=True)
        
        file_path = os.path.join(avatars_dir, filename)
        
        # Save file
        file.save(file_path)
        
        # Update user's avatar_url
        avatar_url = f"/uploads/avatars/{filename}"
        current_user.avatar_url = avatar_url
        db.session.commit()
        
        logger.info(f"Avatar uploaded for user {current_user.id}: {filename}")
        
        return jsonify({
            'success': True,
            'message': 'Avatar uploaded successfully',
            'avatar_url': avatar_url
        }), 200
    
    except Exception as e:
        logger.error(f"Avatar upload error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to upload avatar'}), 500

@auth_bp.route('/change-password', methods=['POST'])
@login_required_api
def change_password():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Invalid JSON data'}), 400
        
        current_password = data.get('current_password', '')
        new_password = data.get('new_password', '')
        
        if not current_password or not new_password:
            return jsonify({'error': 'Current password and new password are required'}), 400
        
        if len(new_password) < 6:
            return jsonify({'error': 'New password must be at least 6 characters long'}), 400
        
        # Verify current password
        if not current_user.check_password(current_password):
            return jsonify({'error': 'Current password is incorrect'}), 401
        
        # Update password
        current_user.set_password(new_password)
        db.session.commit()
        
        logger.info(f"Password changed for user {current_user.email}")
        
        return jsonify({
            'success': True,
            'message': 'Password changed successfully'
        }), 200
    
    except Exception as e:
        logger.error(f"Password change error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to change password'}), 500

@auth_bp.route('/logout', methods=['POST'])
@login_required_api
def logout():
    try:
        logout_user()
        session.clear()  # Clear all session data
        return jsonify({
            'success': True,
            'message': 'Logged out successfully'
        }), 200
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        return jsonify({'error': 'Logout failed'}), 500

@auth_bp.route('/verify-session', methods=['GET'])
@login_required_api
def verify_session():
    try:
        return jsonify({
            'success': True,
            'user': current_user.to_dict()
        }), 200
    except Exception as e:
        logger.error(f"Session verification error: {str(e)}")
        return jsonify({'error': 'Session verification failed'}), 500