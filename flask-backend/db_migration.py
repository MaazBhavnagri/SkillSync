#!/usr/bin/env python3
"""
Database migration script to add XP and level fields to existing users
"""

import sqlite3
import os
from datetime import datetime

def migrate_database():
    """Add XP and level columns to users table if they don't exist"""
    
    # Database path
    db_path = 'instance/skill_analysis.db'
    
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return
    
    try:
        # Connect to database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if XP column exists
        cursor.execute("PRAGMA table_info(users)")
        columns = [column[1] for column in cursor.fetchall()]
        
        # Add XP column if it doesn't exist
        if 'xp' not in columns:
            print("Adding XP column to users table...")
            cursor.execute("ALTER TABLE users ADD COLUMN xp INTEGER DEFAULT 0")
            print("✓ XP column added")
        else:
            print("✓ XP column already exists")
        
        # Add level column if it doesn't exist
        if 'level' not in columns:
            print("Adding level column to users table...")
            cursor.execute("ALTER TABLE users ADD COLUMN level INTEGER DEFAULT 1")
            print("✓ Level column added")
        else:
            print("✓ Level column already exists")
        
        # Update existing users with default XP and level
        cursor.execute("UPDATE users SET xp = 0 WHERE xp IS NULL")
        cursor.execute("UPDATE users SET level = 1 WHERE level IS NULL")
        
        # Commit changes
        conn.commit()
        print("✓ Database migration completed successfully")
        
    except Exception as e:
        print(f"Error during migration: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    print("Starting database migration...")
    migrate_database()
    print("Migration completed!")
