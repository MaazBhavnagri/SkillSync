from flask import current_app
from flask_mail import Mail, Message
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

logger = logging.getLogger(__name__)

def send_analysis_email(user_email, user_name, analysis_result):
    """Send analysis results via email"""
    try:
        # Check if email is configured
        if not current_app.config.get('MAIL_USERNAME') or not current_app.config.get('MAIL_PASSWORD'):
            logger.warning("Email not configured, skipping email notification")
            return False
        
        # Create email content
        subject = f"Skill Analysis Results - {analysis_result.get('form_status', 'Complete')}"
        
        # HTML email template
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }}
                .container {{ max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
                .header {{ background-color: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ padding: 20px; }}
                .result-box {{ background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 10px 0; }}
                .accuracy {{ font-size: 24px; font-weight: bold; color: #4f46e5; }}
                .status {{ font-size: 18px; font-weight: bold; }}
                .status.good {{ color: #10b981; }}
                .status.fair {{ color: #f59e0b; }}
                .status.poor {{ color: #ef4444; }}
                .corrections {{ background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 10px 0; }}
                .corrections ul {{ margin: 10px 0; padding-left: 20px; }}
                .footer {{ text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎯 Skill Analysis Results</h1>
                    <p>Your exercise analysis is complete!</p>
                </div>
                
                <div class="content">
                    <p>Hello {user_name},</p>
                    
                    <p>Great job on completing your exercise! Here are your analysis results:</p>
                    
                    <div class="result-box">
                        <h3>📊 Overall Score</h3>
                        <div class="accuracy">{analysis_result.get('accuracy', 0):.1f}%</div>
                        <div class="status {analysis_result.get('form_status', 'poor').lower()}">{analysis_result.get('form_status', 'Poor')} Form</div>
                    </div>
                    
                    <div class="result-box">
                        <h3>💬 Feedback</h3>
                        <p>{analysis_result.get('feedback', 'Keep practicing!')}</p>
                    </div>
                    
                    {_generate_corrections_html(analysis_result.get('corrections', []))}
                    
                    <div class="result-box">
                        <h3>🏃‍♂️ Exercise Type</h3>
                        <p>{analysis_result.get('exercise_type', 'General').title()}</p>
                    </div>
                    
                    <p>Keep up the great work and continue improving your form!</p>
                </div>
                
                <div class="footer">
                    <p>📧 This email was sent automatically by Skill Analysis Platform</p>
                    <p>Analysis completed on {datetime.now().strftime('%B %d, %Y at %I:%M %p')}</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Plain text version
        text_body = f"""
        Skill Analysis Results
        
        Hello {user_name},
        
        Your exercise analysis is complete!
        
        Overall Score: {analysis_result.get('accuracy', 0):.1f}%
        Form Status: {analysis_result.get('form_status', 'Poor')}
        Exercise Type: {analysis_result.get('exercise_type', 'General').title()}
        
        Feedback: {analysis_result.get('feedback', 'Keep practicing!')}
        
        Corrections:
        {_generate_corrections_text(analysis_result.get('corrections', []))}
        
        Keep up the great work!
        
        ---
        Skill Analysis Platform
        Analysis completed on {datetime.now().strftime('%B %d, %Y at %I:%M %p')}
        """
        
        # Send email using SMTP
        return _send_smtp_email(user_email, subject, html_body, text_body)
    
    except Exception as e:
        logger.error(f"Email sending error: {str(e)}")
        return False

def _generate_corrections_html(corrections):
    """Generate HTML for corrections"""
    if not corrections:
        return ""
    
    corrections_html = '<div class="corrections"><h3>💡 Suggestions for Improvement</h3><ul>'
    for correction in corrections:
        corrections_html += f'<li>{correction}</li>'
    corrections_html += '</ul></div>'
    
    return corrections_html

def _generate_corrections_text(corrections):
    """Generate plain text for corrections"""
    if not corrections:
        return "No specific corrections needed."
    
    text = ""
    for i, correction in enumerate(corrections, 1):
        text += f"{i}. {correction}\n"
    
    return text

def _send_smtp_email(to_email, subject, html_body, text_body):
    """Send email using SMTP"""
    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = current_app.config['MAIL_USERNAME']
        msg['To'] = to_email
        
        # Attach both plain text and HTML versions
        part1 = MIMEText(text_body, 'plain')
        part2 = MIMEText(html_body, 'html')
        
        msg.attach(part1)
        msg.attach(part2)
        
        # Send email
        server = smtplib.SMTP(current_app.config['MAIL_SERVER'], current_app.config['MAIL_PORT'])
        server.starttls()
        server.login(current_app.config['MAIL_USERNAME'], current_app.config['MAIL_PASSWORD'])
        server.send_message(msg)
        server.quit()
        
        logger.info(f"Email sent successfully to {to_email}")
        return True
        
    except Exception as e:
        logger.error(f"SMTP email error: {str(e)}")
        return False

def send_welcome_email(user_email, user_name):
    """Send welcome email to new users"""
    try:
        subject = "Welcome to Skill Analysis Platform! 🎯"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }}
                .container {{ max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
                .header {{ background-color: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ padding: 20px; }}
                .footer {{ text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎯 Welcome to Skill Analysis!</h1>
                    <p>Your journey to better form starts here</p>
                </div>
                
                <div class="content">
                    <p>Hello {user_name},</p>
                    
                    <p>Welcome to Skill Analysis Platform! We're excited to help you improve your exercise form and technique.</p>
                    
                    <p>Here's what you can do:</p>
                    <ul>
                        <li>🎥 Upload exercise videos or images</li>
                        <li>📊 Get AI-powered form analysis</li>
                        <li>💡 Receive personalized feedback</li>
                        <li>📈 Track your progress over time</li>
                    </ul>
                    
                    <p>Ready to get started? Log in to your account and upload your first exercise!</p>
                </div>
                
                <div class="footer">
                    <p>Happy training!</p>
                    <p>The Skill Analysis Team</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_body = f"""
        Welcome to Skill Analysis Platform!
        
        Hello {user_name},
        
        Welcome to Skill Analysis Platform! We're excited to help you improve your exercise form and technique.
        
        Here's what you can do:
        - Upload exercise videos or images
        - Get AI-powered form analysis
        - Receive personalized feedback
        - Track your progress over time
        
        Ready to get started? Log in to your account and upload your first exercise!
        
        Happy training!
        The Skill Analysis Team
        """
        
        return _send_smtp_email(user_email, subject, html_body, text_body)
        
    except Exception as e:
        logger.error(f"Welcome email error: {str(e)}")
        return False