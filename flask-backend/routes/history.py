from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Upload, db
import os
import logging

history_bp = Blueprint('history', __name__)
logger = logging.getLogger(__name__)

@history_bp.route('/history', methods=['GET'])
@jwt_required()
def get_history():
    try:
        current_user_id = get_jwt_identity()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        exercise_type = request.args.get('exercise_type', '')
        
        query = Upload.query.filter_by(user_id=current_user_id)
        
        if exercise_type:
            query = query.filter_by(exercise_type=exercise_type)
        
        uploads = query.order_by(Upload.created_at.desc())\
                      .paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'success': True,
            'uploads': [upload.to_dict() for upload in uploads.items],
            'pagination': {
                'total': uploads.total,
                'pages': uploads.pages,
                'current_page': page,
                'per_page': per_page,
                'has_next': uploads.has_next,
                'has_prev': uploads.has_prev
            }
        }), 200
    
    except Exception as e:
        logger.error(f"History fetch error: {str(e)}")
        return jsonify({'error': 'Failed to fetch history'}), 500

@history_bp.route('/history/<int:upload_id>', methods=['DELETE'])
@jwt_required()
def delete_upload(upload_id):
    try:
        current_user_id = get_jwt_identity()
        
        upload = Upload.query.filter_by(id=upload_id, user_id=current_user_id).first()
        
        if not upload:
            return jsonify({'error': 'Upload not found'}), 404
        
        # Delete the file
        try:
            if os.path.exists(upload.file_path):
                os.remove(upload.file_path)
        except OSError as e:
            logger.warning(f"Failed to delete file {upload.file_path}: {str(e)}")
        
        # Delete from database
        db.session.delete(upload)
        db.session.commit()
        
        logger.info(f"Upload {upload_id} deleted by user {current_user_id}")
        
        return jsonify({
            'success': True,
            'message': 'Upload deleted successfully'
        }), 200
    
    except Exception as e:
        logger.error(f"Delete upload error: {str(e)}")
        return jsonify({'error': 'Failed to delete upload'}), 500