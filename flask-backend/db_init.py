from app import create_app
from models import db, User, Settings
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_database():
    """Initialize the database with sample users and settings."""
    app = create_app()

    with app.app_context():
        # Create all tables if they don't exist
        db.create_all()

        if User.query.first():
            logger.info("Database already initialized with users. Skipping.")
            return

        sample_users = [
            {"name": "John Doe", "email": "john@example.com", "password": "password123"},
            {"name": "Jane Smith", "email": "jane@example.com", "password": "password123"},
            {"name": "Test User", "email": "test@example.com", "password": "test123"},
        ]

        for u in sample_users:
            user = User(name=u["name"], email=u["email"])
            user.set_password(u["password"])
            db.session.add(user)
            db.session.flush()  # get user.id before commit

            settings = Settings(user_id=user.id)
            db.session.add(settings)

            logger.info(f"Created user: {user.email}")

        db.session.commit()
        logger.info("Database initialization complete.")

if __name__ == "__main__":
    init_database()
