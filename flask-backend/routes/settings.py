from flask import Blueprint, request, jsonify
from flask_login import current_user
from decorators import login_required_api
from models import User, Settings, db
import json
import logging

settings_bp = Blueprint('settings', __name__)
logger = logging.getLogger(__name__)

@settings_bp.route('/settings', methods=['GET'])
@login_required_api
def get_settings():
    try:
        # Get or create settings
        settings = Settings.query.filter_by(user_id=current_user.id).first()
        if not settings:
            settings = Settings(user_id=current_user.id)
            db.session.add(settings)
            db.session.commit()
        
        return jsonify({
            'success': True,
            'user': current_user.to_dict(),
            'settings': settings.to_dict()
        }), 200
    
    except Exception as e:
        logger.error(f"Settings fetch error: {str(e)}")
        return jsonify({'error': 'Failed to fetch settings'}), 500

@settings_bp.route('/settings', methods=['POST'])
@login_required_api
def update_settings():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Invalid JSON data'}), 400
        
        # Update user fields
        if 'name' in data:
            current_user.name = data['name'].strip()
        if 'email' in data:
            email = data['email'].strip().lower()
            # Check if email is already taken by another user
            existing_user = User.query.filter_by(email=email).first()
            if existing_user and existing_user.id != current_user.id:
                return jsonify({'error': 'Email already taken'}), 409
            current_user.email = email
        if 'dark_mode' in data:
            current_user.dark_mode = bool(data['dark_mode'])
        if 'avatar_url' in data:
            current_user.avatar_url = data['avatar_url']
        
        # Get or create settings
        settings = Settings.query.filter_by(user_id=current_user.id).first()
        if not settings:
            settings = Settings(user_id=current_user.id)
            db.session.add(settings)
            db.session.commit()
        
        # Update settings fields
        if 'email_notifications' in data:
            settings.email_notifications = bool(data['email_notifications'])
        if 'workout_reminders' in data:
            settings.workout_reminders = bool(data['workout_reminders'])
        if 'preferences' in data:
            settings.preferences_json = json.dumps(data['preferences'])
        
        db.session.commit()
        
        logger.info(f"Settings updated for user {current_user.id}")
        
        return jsonify({
            'success': True,
            'message': 'Settings updated successfully',
            'user': current_user.to_dict(),
            'settings': settings.to_dict()
        }), 200
    
    except Exception as e:
        logger.error(f"Settings update error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to update settings'}), 500