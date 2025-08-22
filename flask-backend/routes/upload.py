from flask import Blueprint, request, jsonify, current_app
from flask_login import current_user  # Add this import
# from flask import send_from_directory
from decorators import login_required_api
from werkzeug.utils import secure_filename
from models import User, Upload, db
from utils.ml_processor import MLProcessor
from utils.email_service import send_analysis_email
import os,re
import json
import logging
from datetime import datetime

upload_bp = Blueprint('upload', __name__)
logger = logging.getLogger(__name__)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']

@upload_bp.route('/upload', methods=['POST'])
@login_required_api
def upload_file():
    try:
        user = current_user  # Flask-Login provides this
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        exercise_type = request.form.get('exercise_type', 'general')
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'File type not allowed'}), 400
        
        # Generate unique filename (using current_user.id)
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{user.id}_{timestamp}_{filename}"
        file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
        file_extension = filename.rsplit('.', 1)[1].lower()
        file_type = 'video' if file_extension in ['mp4', 'avi', 'mov', 'wmv'] else 'image'
        # Save file and create upload record
        file.save(file_path)
        file_size = os.path.getsize(file_path)
        
        def normalize_exercise_name(name):    
            name = name.lower()
            name = re.sub(r'[\s_\-]', '', name)
            return name

        normalized_exercise = normalize_exercise_name(exercise_type)
        normalized_filename = normalize_exercise_name(filename)
        
        if normalized_exercise.lower() not in normalized_filename.lower():
            return jsonify({
                'success': False,
                'error': 'video mismatch',
                'message': f"The selected exercise type '{exercise_type}' is not suitable for this video. " + \
                        f"Please upload a video that matches the exercise type."
            }), 400
        
        upload = Upload(
            user_id=user.id,
            file_name=filename,
            file_path=file_path,
            file_type=file_type,  # Using the variable
            file_size=file_size,
            exercise_type=exercise_type,
            processing_status='pending'
        )
        db.session.add(upload)
        db.session.commit()
        
        #  Process file with ML model
        try:
            upload.processing_status = 'processing'
            upload.processing_started_at = datetime.utcnow()
            db.session.commit()
            
            ml_processor = MLProcessor()
            result = ml_processor.process_file(file_path, file_type, exercise_type)
            
            # Update upload with results
            upload.accuracy = result.get('accuracy', 0.0)
            upload.form_status = result.get('form_status', 'Poor')
            upload.corrections = json.dumps(result.get('corrections', []))
            upload.feedback = result.get('feedback', '')
            upload.result_json = json.dumps(result)
            upload.processing_status = 'completed'
            upload.processing_completed_at = datetime.utcnow()
            
            # Award XP based on accuracy
            xp_earned = 0
            if upload.accuracy >= 90:
                xp_earned = 50  # Excellent form
            elif upload.accuracy >= 80:
                xp_earned = 30  # Good form
            elif upload.accuracy >= 70:
                xp_earned = 20  # Fair form
            else:
                xp_earned = 10  # Poor form, but still practicing
            
            # Add XP to user
            old_level = user.level
            new_level = user.add_xp(xp_earned)
            level_up = new_level > old_level
            
            db.session.commit()
            
            # Send email notification if enabled
            if user.settings and user.settings.email_notifications:
                send_analysis_email(user.email, user.name, result)
            
            logger.info(f"File processed successfully for user {current_user}: {filename}")
            
            return jsonify({
                'success': True,
                'message': 'File uploaded and processed successfully',
                'upload_id': upload.id,
                'result': upload.to_dict(),
                'xp_earned': xp_earned,
                'level_up': level_up,
                'new_level': new_level
            }), 200
            
        except Exception as e:
            logger.error(f"ML processing error: {str(e)}")
            upload.processing_status = 'failed'
            upload.processing_completed_at = datetime.utcnow()
            db.session.commit()
            
            return jsonify({
                'error': 'File processing failed',
                'upload_id': upload.id
            }), 500
    
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        return jsonify({'error': 'File upload failed'}), 500

@upload_bp.route('/results/latest', methods=['GET'])
@login_required_api
def get_latest_result():
    try:
        latest_upload = Upload.query.filter_by(user_id=current_user.id)\
                                  .order_by(Upload.created_at.desc())\
                                  .first()

        if not latest_upload:
            return jsonify({'error': 'No uploads found'}), 404

        # Parse stored JSON result (which includes accuracy, form_status, corrections, etc.)
        result_json = json.loads(latest_upload.result_json) if latest_upload.result_json else {}
        corrections_dict = result_json.get('corrections', {})
        corrections_list = []

        for joint, issues in corrections_dict.items():
            for issue in issues:
                corrections_list.append(f"{joint}: {issue}")


        # Format the response to match frontend expectations
        formatted_result = {
            'title': f"{latest_upload.exercise_type.capitalize()} Analysis",
            'uploadDate': latest_upload.created_at.strftime('%b %d, %Y') if latest_upload.created_at else "Recently",
            'duration': "00:15",  # Placeholder, can extract from metadata
            'videoUrl': latest_upload.file_path,
            'overallScore': result_json.get('accuracy', 0.0)-2,
            'feedback':latest_upload.feedback,
            'breakdown': {
                'form': result_json.get('accuracy', 0.0)-4,
                'timing': result_json.get('accuracy', 0.0)-3,
                'accuracy': result_json.get('accuracy', 0.0)-1,
                'consistency': result_json.get('accuracy', 0.0)
            },
            'keyMoments': [
                {
                    'time': 2,
                    'label': "Initial Position",
                    'score': result_json.get('accuracy', 0.0)
                },
                {
                    'time': 5,
                    'label': "Mid-Motion",
                    'score': result_json.get('accuracy', 0.0)
                },
                {
                    'time': 8,
                    'label': "Follow Through",
                    'score': result_json.get('accuracy', 0.0)
                }
            ],
            'suggestions': [
                {
                    'id': idx + 1,
                    'type': "improvement",
                    'title': f"Improvement {idx + 1}",
                    'description': correction if isinstance(correction, str) else correction.get('message', ''),
                    'priority': 'medium',
                    'expanded': ''
                } 
                for idx, correction in enumerate(corrections_list)
            ]
        }

        return jsonify({
            'success': True,
            'result': formatted_result
        }), 200

    except Exception as e:
        logger.error(f"Latest result fetch error: {str(e)}")
        return jsonify({'error': 'Failed to fetch latest result'}), 500

# @upload_bp.route('/uploads/<filename>')
# def serve_file(filename):
#     return send_from_directory('uploads', filename)


@upload_bp.route('/results/<int:upload_id>', methods=['GET'])
@login_required_api
def get_result(upload_id):
    try:
        upload = Upload.query.filter_by(id=upload_id, user_id=current_user.id).first()

        if not upload:
            return jsonify({'error': 'Result not found'}), 404

        result_json = json.loads(upload.result_json) if upload.result_json else {}
        corrections = result_json.get('corrections', [])

        formatted_result = {
            'title': f"{upload.exercise_type.capitalize()} Analysis",
            'uploadDate': upload.created_at.strftime('%b %d, %Y') if upload.created_at else "Recently",
            'duration': "00:15",
            'videoUrl': '../'+upload.file_path,
            'overallScore': result_json.get('accuracy', 0.0)-2,
            'breakdown': {
                'form': result_json.get('accuracy', 0.0)-4,
                'timing': result_json.get('accuracy', 0.0)-3,
                'accuracy': result_json.get('accuracy', 0.0)-1,
                'consistency': result_json.get('accuracy', 0.0)
            },
            'keyMoments': [
                {
                    'time': 2,
                    'label': "Initial Position",
                    'score': result_json.get('accuracy', 0.0)
                },
                {
                    'time': 5,
                    'label': "Mid-Motion",
                    'score': result_json.get('accuracy', 0.0)
                },
                {
                    'time': 8,
                    'label': "Follow Through",
                    'score': result_json.get('accuracy', 0.0)
                }
            ],
            'suggestions': [
                {
                    'id': idx + 1,
                    'type': "improvement",
                    'title': f"Improvement {idx + 1}",
                    'description': correction if isinstance(correction, str) else correction.get('message', ''),
                    'priority': 'medium',
                    'expanded': ''
                } 
                for idx, correction in enumerate(corrections)
            ]
        }

        return jsonify({
            'success': True,
            'result': formatted_result
        }), 200

    except Exception as e:
        logger.error(f"Result fetch error: {str(e)}")
        return jsonify({'error': 'Failed to fetch result'}), 500
