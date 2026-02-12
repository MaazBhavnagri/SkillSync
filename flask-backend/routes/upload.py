from flask import Blueprint, request, jsonify, current_app
from flask_login import current_user
from decorators import login_required_api
from werkzeug.utils import secure_filename
from models import User, Upload, db
from utils.ml_processor import MLProcessor
from utils.email_service import send_analysis_email
import os, re, json, logging
from datetime import datetime

upload_bp = Blueprint('upload', __name__)
logger = logging.getLogger(__name__)

# -----------------------
# Helpers
# -----------------------

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']

def normalize_exercise_name(name):
    name = name.lower()
    name = re.sub(r'[\s_\-]', '', name)
    return name

# -----------------------
# Upload + Analysis
# -----------------------

@upload_bp.route('/upload', methods=['POST'])
@upload_bp.route('/uploads', methods=['POST'])
@login_required_api
def upload_file():
    try:
        user = current_user
        if not user:
            return jsonify({'error': 'User not found'}), 404

        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400

        file = request.files['file']
        exercise_type = request.form.get('exercise_id') or request.form.get('exercise_type', 'general')

        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        if not allowed_file(file.filename):
            return jsonify({'error': 'File type not allowed'}), 400

        # Save file
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{user.id}_{timestamp}_{filename}"
        file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)

        file.save(file_path)
        file_size = os.path.getsize(file_path)

        file_extension = filename.rsplit('.', 1)[1].lower()
        file_type = 'video' if file_extension in ['mp4', 'avi', 'mov', 'wmv'] else 'image'

        # Validate exercise vs filename
        if normalize_exercise_name(exercise_type) not in normalize_exercise_name(filename):
            return jsonify({
                'success': False,
                'error': 'video mismatch',
                'message': f"The selected exercise type '{exercise_type}' does not match this video."
            }), 400

        upload = Upload(
            user_id=user.id,
            file_name=filename,
            file_path=file_path,
            file_type=file_type,
            file_size=file_size,
            exercise_type=exercise_type,
            processing_status='pending'
        )
        db.session.add(upload)
        db.session.commit()

        # -----------------------
        # ML Processing
        # -----------------------
        try:
            upload.processing_status = 'processing'
            upload.processing_started_at = datetime.utcnow()
            db.session.commit()

            # === HYBRID PUSH-UP MODEL ===
            if exercise_type.lower() in ['pushup', 'push-up', 'push_up']:
                from ml.hybrid_pushup_evaluator import get_evaluator
                evaluator = get_evaluator()
                result = evaluator.evaluate(file_path)

                # 🔑 CRITICAL FIX:
                # form_score is the ONLY user-visible score
                form_score = float(result.get('form_score', result.get('score', 0.0)))

                # Enforce bounds
                form_score = max(0.0, min(100.0, form_score))

                result['form_score'] = form_score

                # Legacy DB compatibility ONLY
                result['accuracy'] = form_score

                result['corrections'] = result.get('failures', [])
                result['form_status'] = result.get('status', 'NEEDS_IMPROVEMENT')

            else:
                # OLD MLProcessor (non-pushup exercises)
                ml_processor = MLProcessor()
                result = ml_processor.process_file(file_path, file_type, exercise_type)

                form_score = float(result.get('accuracy', 0.0))
                result['form_score'] = form_score
                result['accuracy'] = form_score

            # -----------------------
            # Save Results
            # -----------------------
            upload.accuracy = form_score                # legacy column
            upload.form_status = result.get('form_status', 'NEEDS_IMPROVEMENT')
            upload.corrections = json.dumps(result.get('corrections', []))
            upload.feedback = result.get('feedback', '')
            upload.result_json = json.dumps(result)
            upload.processing_status = 'completed'
            upload.processing_completed_at = datetime.utcnow()

            # -----------------------
            # XP Logic (USES form_score)
            # -----------------------
            if form_score >= 90:
                xp_earned = 50
            elif form_score >= 80:
                xp_earned = 30
            elif form_score >= 70:
                xp_earned = 20
            else:
                xp_earned = 10

            old_level = user.level
            new_level = user.add_xp(xp_earned)
            level_up = new_level > old_level

            db.session.commit()

            if user.settings and user.settings.email_notifications:
                send_analysis_email(user.email, user.name, result)

            return jsonify({
                'success': True,
                'upload_id': upload.id,
                'result': upload.to_dict(),
                'xp_earned': xp_earned,
                'level_up': level_up,
                'new_level': new_level
            }), 200

        except Exception as e:
            logger.error(f"ML processing error: {e}", exc_info=True)
            upload.processing_status = 'failed'
            upload.processing_completed_at = datetime.utcnow()
            db.session.commit()
            return jsonify({'error': 'Processing failed'}), 500

    except Exception as e:
        logger.error(f"Upload error: {e}", exc_info=True)
        return jsonify({'error': 'Upload failed'}), 500


# -----------------------
# Results APIs
# -----------------------

@upload_bp.route('/results/latest', methods=['GET'])
@login_required_api
def get_latest_result():
    latest_upload = Upload.query.filter_by(user_id=current_user.id)\
                                .order_by(Upload.created_at.desc())\
                                .first()
    if not latest_upload:
        return jsonify({'error': 'No uploads found'}), 404

    result_json = json.loads(latest_upload.result_json or "{}")
    score = result_json.get('form_score', 0.0)

    scores = result_json.get('breakdown', {})
    
    # Format suggestions from string list to objects
    raw_corrections = result_json.get('corrections', [])
    formatted_suggestions = []
    for i, correction in enumerate(raw_corrections):
        if isinstance(correction, str):
            formatted_suggestions.append({
               'id': i + 1,
               'title': f"Improvement {i+1}",
               'description': correction,
               'type': 'improvement',
               'priority': 'medium',
               'expanded': 'Focus on maintaining proper form throughout the movement.'
            })
        else:
            formatted_suggestions.append(correction)

    formatted_result = {
        'title': f"{latest_upload.exercise_type.capitalize()} Analysis",
        'uploadDate': latest_upload.created_at.strftime('%b %d, %Y'),
        'duration': "00:15",
        'videoUrl': latest_upload.file_path,
        'overallScore': score,
        'feedback': result_json.get('feedback', ''),
        'confidenceLevel': result_json.get('confidenceLevel'),
        'breakdown': {
            'form': score,
            'timing': score,
            'accuracy': score,
            'consistency': score
        },
        'suggestions': formatted_suggestions,
        'keyMoments': [] # Placeholder
    }

    return jsonify({'success': True, 'result': formatted_result}), 200


@upload_bp.route('/results/<int:upload_id>', methods=['GET'])
@upload_bp.route('/uploads/<int:upload_id>/results', methods=['GET'])  # Frontend uses this path
@login_required_api
def get_result(upload_id):
    upload = Upload.query.filter_by(id=upload_id, user_id=current_user.id).first()
    if not upload:
        return jsonify({'error': 'Result not found'}), 404

    result_json = json.loads(upload.result_json or "{}")
    score = result_json.get('form_score', 0.0)

    # Format suggestions from string list to objects
    raw_corrections = result_json.get('corrections', [])
    formatted_suggestions = []
    for i, correction in enumerate(raw_corrections):
        if isinstance(correction, str):
            formatted_suggestions.append({
               'id': i + 1,
               'title': f"Improvement {i+1}",
               'description': correction,
               'type': 'improvement',
               'priority': 'medium',
               'expanded': 'Focus on maintaining proper form throughout the movement.'
            })
        else:
            formatted_suggestions.append(correction)

    return jsonify({
        'success': True,
        'status': 'done',
        'result': {
            'title': f"{upload.exercise_type.capitalize()} Analysis",
            'uploadDate': upload.created_at.strftime('%b %d, %Y'),
            'duration': "00:15",
            'videoUrl': upload.file_path,
            'overallScore': score,
            'formScore': score,
            'status': result_json.get('form_status', 'NEEDS_IMPROVEMENT'),
            'confidenceLevel': result_json.get('confidenceLevel'),
            'feedback': result_json.get('feedback', ''),
            'breakdown': {
                'form': score,
                'timing': score,
                'accuracy': score,
                'consistency': score
            },
            'suggestions': formatted_suggestions,
            'keyMoments': []
        }
    }), 200
