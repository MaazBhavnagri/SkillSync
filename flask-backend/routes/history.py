from flask import Blueprint, request, jsonify, send_file
from flask_login import current_user
from decorators import login_required_api
from models import Upload, LiveSession, db
import os
import logging
from io import BytesIO

try:
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import letter
except ImportError:
    canvas = None
    letter = None

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


@history_bp.route('/live-sessions', methods=['GET'])
@login_required_api
def get_live_sessions():
    """Return all live sessions for the current user (no pagination for now)."""
    try:
        sessions = (
            LiveSession.query
            .filter_by(user_id=current_user.id)
            .order_by(LiveSession.created_at.desc())
            .all()
        )
        return jsonify({
            'success': True,
            'sessions': [s.to_dict() for s in sessions],
        }), 200
    except Exception as e:
        logger.error(f"Live sessions fetch error: {str(e)}")
        return jsonify({'error': 'Failed to fetch live sessions'}), 500


@history_bp.route('/live-sessions', methods=['POST'])
@login_required_api
def create_live_session():
    """Persist a live session summary created on the frontend."""
    try:
        data = request.get_json() or {}
        pose_type = (data.get('poseType') or 'Unknown pose')[:100]
        session_type = (data.get('sessionType') or 'video')[:50]  # 'photo' or 'video'
        duration_seconds = int(data.get('durationSeconds') or data.get('duration_seconds') or 0)
        overall_score = float(data.get('overallScore') or data.get('overall_score') or 0.0)
        stability = float(data.get('stability') or 0.0)
        main_issue_type = (data.get('mainIssueType') or data.get('main_issue_type') or None)
        severity_level = (data.get('severityLevel') or data.get('severity_level') or None)
        suggestion = data.get('suggestion') or ""

        live_session = LiveSession(
            user_id=current_user.id,
            pose_type=pose_type,
            session_type=session_type,
            duration_seconds=max(0, duration_seconds),
            overall_score=overall_score,
            stability=stability,
            main_issue_type=main_issue_type,
            severity_level=severity_level,
            suggestion=suggestion,
        )
        db.session.add(live_session)
        db.session.commit()

        return jsonify({
            'success': True,
            'session': live_session.to_dict(),
        }), 201
    except Exception as e:
        logger.error(f"Create live session error: {str(e)}", exc_info=True)
        db.session.rollback()
        return jsonify({'error': 'Failed to save live session'}), 500


@history_bp.route('/live-session/<int:session_id>/generate-report', methods=['POST'])
@login_required_api
def generate_live_session_report(session_id):
    """Generate a PDF report for a single live session."""
    if canvas is None or letter is None:
        return jsonify({'error': 'PDF generation is not available on this server.'}), 500

    session = LiveSession.query.filter_by(id=session_id, user_id=current_user.id).first()
    if not session:
        return jsonify({'error': 'Live session not found'}), 404

    try:
        buffer = BytesIO()
        c = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter

        y = height - 72

        # Header
        c.setFont("Helvetica-Bold", 20)
        c.drawString(72, y, "SkillSync Live Session Report")
        y -= 36

        c.setFont("Helvetica", 12)
        c.drawString(72, y, f"User: {current_user.name}")
        y -= 18

        c.drawString(72, y, f"Pose type: {session.pose_type}")
        y -= 18

        c.drawString(72, y, f"Session duration: {session.duration_seconds} seconds")
        y -= 18

        c.drawString(72, y, f"Overall score: {round(session.overall_score)}%")
        y -= 18

        c.drawString(72, y, f"Stability: {round(session.stability)}%")
        y -= 18

        if session.main_issue_type:
            c.drawString(72, y, f"Main issue: {session.main_issue_type}")
            y -= 18

        if session.severity_level:
            c.drawString(72, y, f"Severity level: {session.severity_level}")
            y -= 18

        if session.suggestion:
            y -= 12
            c.setFont("Helvetica-Bold", 12)
            c.drawString(72, y, "Suggested correction:")
            y -= 18
            c.setFont("Helvetica", 12)
            text = c.beginText(72, y)
            text.textLines(session.suggestion)
            c.drawText(text)
            y = text.getY() - 12

        created_str = session.created_at.strftime("%b %d, %Y %H:%M") if session.created_at else ""
        c.setFont("Helvetica-Oblique", 10)
        c.drawString(72, 72, f"Date: {created_str}")

        c.showPage()
        c.save()

        buffer.seek(0)
        filename = f"live-session-{session_id}.pdf"
        return send_file(
            buffer,
            mimetype="application/pdf",
            as_attachment=True,
            download_name=filename,
        )
    except Exception as e:
        logger.error(f"Live session PDF generation error: {str(e)}", exc_info=True)
        return jsonify({'error': 'Failed to generate PDF report'}), 500