from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin
import json

db = SQLAlchemy()

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    dark_mode = db.Column(db.Boolean, default=False)
    avatar_url = db.Column(db.String(255), default='')
    xp = db.Column(db.Integer, default=0)  # Experience points
    level = db.Column(db.Integer, default=1)  # User level
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    
    # Relationships
    uploads = db.relationship('Upload', backref='user', lazy=True, cascade='all, delete-orphan')
    live_sessions = db.relationship('LiveSession', backref='user', lazy=True, cascade='all, delete-orphan')
    settings = db.relationship('Settings', backref='user', uselist=False, cascade='all, delete-orphan')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def get_id(self):
        return str(self.id)
    
    def add_xp(self, amount):
        """Add XP and update level if needed"""
        self.xp += amount
        # Calculate new level (every 200 XP = 1 level)
        new_level = (self.xp // 200) + 1
        if new_level > self.level:
            self.level = new_level
        return self.level
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'dark_mode': self.dark_mode,
            'avatar_url': self.avatar_url,
            'xp': self.xp,
            'level': self.level,
            'created_at': self.created_at.isoformat(),
            'is_active': self.is_active
        }

class Upload(db.Model):
    __tablename__ = 'uploads'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    file_name = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    file_type = db.Column(db.String(50), nullable=False)  # 'image' or 'video'
    file_size = db.Column(db.Integer, nullable=False)  # in bytes
    exercise_type = db.Column(db.String(100), nullable=False)  # 'pushup', 'squat', etc.
    
    # Analysis results
    accuracy = db.Column(db.Float, nullable=False, default=0.0)
    form_status = db.Column(db.String(50), nullable=False, default='Pending')  # 'Good', 'Fair', 'Poor'
    corrections = db.Column(db.Text)  # JSON string of corrections
    feedback = db.Column(db.Text)  # General feedback text
    result_json = db.Column(db.Text)  # Complete analysis result as JSON
    
    # Processing status
    processing_status = db.Column(db.String(50), default='pending')  # 'pending', 'processing', 'completed', 'failed'
    processing_started_at = db.Column(db.DateTime)
    processing_completed_at = db.Column(db.DateTime)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'file_name': self.file_name,
            'file_type': self.file_type,
            'file_size': self.file_size,
            'exercise_type': self.exercise_type,
            'accuracy': self.accuracy,
            'form_status': self.form_status,
            'corrections': json.loads(self.corrections) if self.corrections else [],
            'feedback': self.feedback,
            'result_json': json.loads(self.result_json) if self.result_json else {},
            'processing_status': self.processing_status,
            'processing_started_at': self.processing_started_at.isoformat() if self.processing_started_at else None,
            'processing_completed_at': self.processing_completed_at.isoformat() if self.processing_completed_at else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }


class LiveSession(db.Model):
    __tablename__ = 'live_sessions'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    pose_type = db.Column(db.String(100), nullable=False)
    session_type = db.Column(db.String(50), nullable=False)  # 'photo' or 'video'
    duration_seconds = db.Column(db.Integer, nullable=False)
    overall_score = db.Column(db.Float, nullable=False, default=0.0)
    stability = db.Column(db.Float, nullable=False, default=0.0)
    main_issue_type = db.Column(db.String(100))
    severity_level = db.Column(db.String(20))
    suggestion = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'pose_type': self.pose_type,
            'session_type': self.session_type,
            'duration_seconds': self.duration_seconds,
            'overall_score': float(self.overall_score or 0.0),
            'stability': float(self.stability or 0.0),
            'main_issue_type': self.main_issue_type,
            'severity_level': self.severity_level,
            'suggestion': self.suggestion,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

class Settings(db.Model):
    __tablename__ = 'settings'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    preferences_json = db.Column(db.Text, default='{}')  # JSON preferences
    email_notifications = db.Column(db.Boolean, default=True)
    workout_reminders = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'preferences': json.loads(self.preferences_json) if self.preferences_json else {},
            'email_notifications': self.email_notifications,
            'workout_reminders': self.workout_reminders,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }