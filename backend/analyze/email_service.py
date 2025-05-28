import os
import logging
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from firebase_admin import firestore

logger = logging.getLogger(__name__)


def get_email_template_content(status, language='ru'):
    """Get email template content based on status and language"""
    
    if language == 'ky':
        templates = {
            'pending': {
                'subject': 'Арызыңыз каралууда - PublicPulse',
                'title': 'Арызыңыз каралууда',
                'message': 'Урматтуу жарандар! Сиздин арызыңыз биздин тарабыбызга келип жетти жана азыр каралууда.'
            },
            'resolved': {
                'subject': 'Арызыңыз чечилди - PublicPulse',
                'title': 'Арызыңыз ийгиликтүү чечилди',
                'message': 'Урматтуу жарандар! Сиздин арызыңыз ийгиликтүү каралып, тийиштүү чаралар көрүлдү.'
            },
            'cancelled': {
                'subject': 'Арызыңыз четке кагылды - PublicPulse',
                'title': 'Арызыңыз четке кагылды',
                'message': 'Урматтуу жарандар! Тилекке каршы, сиздин арызыңыз четке кагылды.'
            }
        }
    else:  # default Russian
        templates = {
            'pending': {
                'subject': 'Ваше обращение обрабатывается - PublicPulse',
                'title': 'Ваше обращение принято в обработку',
                'message': 'Уважаемый гражданин! Ваше обращение поступило к нам и находится в процессе рассмотрения.'
            },
            'resolved': {
                'subject': 'Ваше обращение решено - PublicPulse',
                'title': 'Ваше обращение успешно решено',
                'message': 'Уважаемый гражданин! Ваше обращение было успешно рассмотрено и по нему приняты соответствующие меры.'
            },
            'cancelled': {
                'subject': 'Ваше обращение отклонено - PublicPulse',
                'title': 'Ваше обращение отклонено',
                'message': 'Уважаемый гражданин! К сожалению, ваше обращение было отклонено.'
            }
        }
    
    return templates.get(status, templates['pending'])


def create_email_html_content(complaint_data, status, language='ru'):
    """Create HTML email content"""
    
    template_content = get_email_template_content(status, language)
    
    # Get status text in the appropriate language
    status_texts = {
        'pending': 'В процессе' if language == 'ru' else 'Каралууда',
        'resolved': 'Решено' if language == 'ru' else 'Чечилди', 
        'cancelled': 'Отклонено' if language == 'ru' else 'Четке кагылды'
    }
    
    status_text = status_texts.get(status, status_texts['pending'])
    
    # Status color mapping
    status_colors = {
        'pending': '#fbbf24',  # amber
        'resolved': '#10b981',  # green
        'cancelled': '#ef4444'  # red
    }
    
    html_content = f"""
    <!DOCTYPE html>
    <html lang="{language}">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{template_content['subject']}</title>
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f8fafc;
            }}
            .email-container {{
                background: white;
                border-radius: 12px;
                padding: 30px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }}
            .header {{
                text-align: center;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 2px solid #e5e7eb;
            }}
            .logo {{
                font-size: 24px;
                font-weight: bold;
                color: #667eea;
                margin-bottom: 10px;
            }}
            .title {{
                font-size: 20px;
                font-weight: 600;
                margin-bottom: 15px;
                color: #1f2937;
            }}
            .status-badge {{
                display: inline-block;
                padding: 8px 16px;
                border-radius: 50px;
                color: white;
                font-weight: 500;
                font-size: 14px;
                background-color: {status_colors.get(status, '#6b7280')};
                margin-bottom: 20px;
            }}
            .message {{
                margin-bottom: 25px;
                font-size: 16px;
                line-height: 1.6;
            }}
            .complaint-details {{
                background: #f9fafb;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
            }}
            .detail-row {{
                display: flex;
                margin-bottom: 10px;
                border-bottom: 1px solid #e5e7eb;
                padding-bottom: 8px;
            }}
            .detail-row:last-child {{
                border-bottom: none;
                margin-bottom: 0;
            }}
            .detail-label {{
                font-weight: 600;
                min-width: 120px;
                color: #374151;
            }}
            .detail-value {{
                color: #6b7280;
                flex: 1;
            }}
            .complaint-text {{
                background: white;
                border-left: 4px solid #667eea;
                padding: 15px;
                margin: 15px 0;
                font-style: italic;
            }}
            .footer {{
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                text-align: center;
                color: #6b7280;
                font-size: 14px;
            }}
            .footer a {{
                color: #667eea;
                text-decoration: none;
            }}
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <div class="logo">🏛️ PublicPulse</div>
                <div class="title">{template_content['title']}</div>
                <div class="status-badge">{'Статус' if language == 'ru' else 'Абал'}: {status_text}</div>
            </div>
            
            <div class="message">
                {template_content['message']}
            </div>
            
            <div class="complaint-details">
                <h3 style="margin-top: 0; color: #374151;">{'Детали обращения' if language == 'ru' else 'Арыздын чоо-жайы'}:</h3>
                
                <div class="detail-row">
                    <div class="detail-label">ID:</div>
                    <div class="detail-value">#{complaint_data.get('id', 'N/A')}</div>
                </div>
                
                <div class="detail-row">
                    <div class="detail-label">{'Дата подачи' if language == 'ru' else 'Берилген күнү'}:</div>
                    <div class="detail-value">{complaint_data.get('created_at', 'N/A')}</div>
                </div>
                
                <div class="detail-row">
                    <div class="detail-label">{'Тип обращения' if language == 'ru' else 'Арыздын түрү'}:</div>
                    <div class="detail-value">{complaint_data.get('report_type', 'N/A')}</div>
                </div>
                
                <div class="detail-row">
                    <div class="detail-label">{'Регион' if language == 'ru' else 'Аймак'}:</div>
                    <div class="detail-value">{complaint_data.get('region', 'N/A')}</div>
                </div>
                
                <div class="detail-row">
                    <div class="detail-label">{'Город' if language == 'ru' else 'Шаар'}:</div>
                    <div class="detail-value">{complaint_data.get('city', 'N/A')}</div>
                </div>
                
                {f'''<div class="detail-row">
                    <div class="detail-label">{'Услуга' if language == 'ru' else 'Кызмат'}:</div>
                    <div class="detail-value">{complaint_data.get('service', 'N/A')}</div>
                </div>''' if complaint_data.get('service') else ''}
                
                {f'''<div class="detail-row">
                    <div class="detail-label">{'Ведомство' if language == 'ru' else 'Мекеме'}:</div>
                    <div class="detail-value">{complaint_data.get('agency', 'N/A')}</div>
                </div>''' if complaint_data.get('agency') else ''}
            </div>
            
            <div class="complaint-text">
                <strong>{'Текст обращения' if language == 'ru' else 'Арыздын тексти'}:</strong><br>
                {complaint_data.get('report_text', 'N/A')}
            </div>
            
            {f'''<div style="margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <strong>{'Примечания' if language == 'ru' else 'Эскертүүлөр'}:</strong><br>
                {complaint_data.get('notes', '')}
            </div>''' if complaint_data.get('notes') else ''}
            
            <div class="footer">
                <p>{'С уважением' if language == 'ru' else 'Сый менен'},<br>
                {'Команда PublicPulse' if language == 'ru' else 'PublicPulse командасы'}</p>
                
                <p style="margin-top: 15px;">
                    {'Это автоматическое уведомление. Не отвечайте на данное письмо.' if language == 'ru' else 'Бул автоматтык билдирүү. Бул катка жооп бербеңиз.'}
                </p>
                
                <p style="margin-top: 10px;">
                    <a href="https://publicpulse-front-739844766362.asia-southeast2.run.app/">{'Перейти на сайт' if language == 'ru' else 'Сайтка өтүү'}</a>
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return html_content


def send_status_update_email(complaint_data, new_status, language='ru'):
    """Send email notification when complaint status is updated"""
    
    try:
        email = None
        
        # First, try to get email from the dedicated email field
        email = complaint_data.get('email')
        
        # If no email in the dedicated field, try to extract from contact_info as fallback
        if not email:
            contact_info = complaint_data.get('contact_info', '')
            import re
            email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
            email_matches = re.findall(email_pattern, contact_info)
            
            if email_matches:
                email = email_matches[0]
        
        if not email:
            logger.warning(f"No email found for complaint {complaint_data.get('id')}")
            return False
        
        # Get template content
        template_content = get_email_template_content(new_status, language)
        
        # Create HTML content
        html_content = create_email_html_content(complaint_data, new_status, language)
        
        # Create plain text version
        plain_text = strip_tags(html_content)
        
        # Send email
        sent = send_mail(
            subject=template_content['subject'],
            message=plain_text,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            html_message=html_content,
            fail_silently=False
        )
        
        if sent:
            logger.info(f"Status update email sent successfully to {email} for complaint {complaint_data.get('id')}")
            return True
        else:
            logger.error(f"Failed to send status update email to {email} for complaint {complaint_data.get('id')}")
            return False
            
    except Exception as e:
        logger.error(f"Error sending status update email: {str(e)}")
        return False


def send_complaint_received_email(complaint_data, language='ru'):
    """Send confirmation email when complaint is first received"""
    
    # For new complaints, we send a "pending" status email
    return send_status_update_email(complaint_data, 'pending', language)
