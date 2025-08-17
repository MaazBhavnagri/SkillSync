from flask import Blueprint, request, jsonify
from flask_login import current_user
from decorators import login_required_api
from models import Upload, db
import os
import logging

history_bp = Blueprint('history', __name__)
logger = logging.getLogger(__name__)

@history_bp.route('/history', methods=['GET'])
@login_required_api
def get_history():
    try:
        # Parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        exercise_type = request.args.get('exercise_type', '', type=str)
        sort = request.args.get('sort', 'date', type=str)  # 'date' or 'accuracy'
        order = request.args.get('order', 'desc', type=str)  # 'asc' or 'desc'

        # Base query
        query = Upload.query.filter_by(user_id=current_user.id)

        # Optional filter by exercise type
        if exercise_type:
            query = query.filter_by(exercise_type=exercise_type)

        # Sorting
        order_column = Upload.accuracy if sort == 'accuracy' else Upload.created_at
        query = query.order_by(order_column.asc() if order == 'asc' else order_column.desc())

        # Pagination
        paginated = query.paginate(page=page, per_page=per_page, error_out=False)

        return jsonify({
            'success': True,
            'uploads': [upload.to_dict() for upload in paginated.items],
            'pagination': {
                'total': paginated.total,
                'pages': paginated.pages,
                'current_page': page,
                'per_page': per_page,
                'has_next': paginated.has_next,
                'has_prev': paginated.has_prev
            }
        }), 200

    except Exception as e:
        logger.error(f"History fetch error: {str(e)}")
        return jsonify({'error': 'Failed to fetch history'}), 500

@history_bp.route('/history/<int:upload_id>', methods=['DELETE'])
@login_required_api
def delete_upload(upload_id):
    try:
        upload = Upload.query.filter_by(id=upload_id, user_id=current_user.id).first()

        if not upload:
            return jsonify({'error': 'Upload not found'}), 404

        # Delete the file from disk if present
        try:
            if os.path.exists(upload.file_path):
                os.remove(upload.file_path)
        except OSError as e:
            logger.warning(f"Failed to delete file {upload.file_path}: {str(e)}")

        # Delete from database
        db.session.delete(upload)
        db.session.commit()

        logger.info(f"Upload {upload_id} deleted by user {current_user.id}")

        return jsonify({'success': True, 'message': 'Upload deleted successfully'}), 200

    except Exception as e:
        logger.error(f"Delete upload error: {str(e)}")
        return jsonify({'error': 'Failed to delete upload'}), 500