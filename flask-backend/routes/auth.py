from flask import Blueprint, request, jsonify, session
from flask_login import login_user, logout_user, current_user, login_required
from models import User, db, Settings
from decorators import login_required_api
from email_validator import validate_email, EmailNotValidError
import logging

auth_bp = Blueprint('auth', __name__)
logger = logging.getLogger(__name__)

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