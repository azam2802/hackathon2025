from django.db import models
from django.dispatch import receiver
from django.db.models.signals import post_save, pre_save
from firebase_admin import firestore
from .email_service import send_status_update_email
import logging

logger = logging.getLogger(__name__)


class Complaint(models.Model):
    """Django model for managing complaints through admin interface"""
    
    STATUS_CHOICES = [
        ('pending', 'В процессе'),
        ('resolved', 'Решено'),
        ('cancelled', 'Отклонено'),
        ('new', 'Новое'),
    ]
    
    IMPORTANCE_CHOICES = [
        ('critical', 'Критический'),
        ('high', 'Высокий'),
        ('medium', 'Средний'),
        ('low', 'Низкий'),
    ]
    
    SUBMISSION_SOURCE_CHOICES = [
        ('website', 'Веб-сайт'),
        ('telegram_bot', 'Telegram бот'),
    ]
    
    # Firestore document ID
    firestore_id = models.CharField(max_length=255, unique=True, help_text="ID документа в Firestore")
    
    # Basic information
    report_type = models.CharField(max_length=50, default="Жалоба")
    region = models.CharField(max_length=100)
    city = models.CharField(max_length=100)
    report_text = models.TextField(verbose_name="Текст обращения")
    contact_info = models.CharField(max_length=255, verbose_name="Контактная информация")
    email = models.EmailField(blank=True, null=True, verbose_name="Email")
    
    # Status and processing
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new', verbose_name="Статус")
    importance = models.CharField(max_length=20, choices=IMPORTANCE_CHOICES, default='medium', verbose_name="Приоритет")
    notes = models.TextField(blank=True, null=True, verbose_name="Заметки администратора")
    
    # Service and agency
    service = models.CharField(max_length=255, blank=True, null=True, verbose_name="Услуга")
    agency = models.CharField(max_length=255, blank=True, null=True, verbose_name="Ведомство")
    
    # Submission details
    submission_source = models.CharField(max_length=20, choices=SUBMISSION_SOURCE_CHOICES, default='website', verbose_name="Источник подачи")
    language = models.CharField(max_length=10, default='ru', verbose_name="Язык")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Дата обновления")
    
    class Meta:
        verbose_name = "Обращение"
        verbose_name_plural = "Обращения"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"#{self.firestore_id[:8]} - {self.report_text[:50]}..."
    
    def save(self, *args, **kwargs):
        """Override save to sync with Firestore"""
        # Check if this is an update (not a new instance)
        is_update = self.pk is not None
        old_status = None
        
        if is_update:
            try:
                old_instance = Complaint.objects.get(pk=self.pk)
                old_status = old_instance.status
            except Complaint.DoesNotExist:
                pass
        
        # Save to Django database
        super().save(*args, **kwargs)
        
        # Sync with Firestore
        try:
            self.sync_to_firestore()
            
            # Send email notification if status changed
            if is_update and old_status and old_status != self.status and self.submission_source == 'website':
                self.send_status_update_email()
                
        except Exception as e:
            logger.error(f"Error syncing complaint {self.firestore_id} to Firestore: {e}")
    
    def sync_to_firestore(self):
        """Sync this complaint data to Firestore"""
        try:
            db = firestore.client()
            doc_ref = db.collection('reports').document(self.firestore_id)
            
            # Prepare data for Firestore
            firestore_data = {
                'report_type': self.report_type,
                'region': self.region,
                'city': self.city,
                'report_text': self.report_text,
                'contact_info': self.contact_info,
                'email': self.email or '',
                'status': self.status,
                'importance': self.importance,
                'notes': self.notes or '',
                'service': self.service or '',
                'agency': self.agency or '',
                'submission_source': self.submission_source,
                'language': self.language,
                'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            }
            
            # Remove None values
            firestore_data = {k: v for k, v in firestore_data.items() if v is not None}
            
            # Update Firestore document
            doc_ref.update(firestore_data)
            logger.info(f"Successfully synced complaint {self.firestore_id} to Firestore")
            
        except Exception as e:
            logger.error(f"Error syncing to Firestore: {e}")
            raise
    
    def send_status_update_email(self):
        """Send email notification for status update"""
        try:
            # Prepare complaint data for email service
            complaint_data = {
                'id': self.firestore_id,
                'report_text': self.report_text,
                'contact_info': self.contact_info,
                'email': self.email,
                'service': self.service,
                'agency': self.agency,
                'region': self.region,
                'city': self.city,
                'created_at': self.created_at.isoformat() if self.created_at else None,
                'notes': self.notes,
                'submission_source': self.submission_source,
            }
            
            # Send email
            email_sent = send_status_update_email(complaint_data, self.status, self.language)
            
            if email_sent:
                logger.info(f"Email notification sent for complaint {self.firestore_id}")
            else:
                logger.warning(f"Failed to send email notification for complaint {self.firestore_id}")
                
        except Exception as e:
            logger.error(f"Error sending email notification for complaint {self.firestore_id}: {e}")

    @classmethod
    def sync_from_firestore(cls, firestore_id):
        """Create or update Django model from Firestore document"""
        try:
            db = firestore.client()
            doc_ref = db.collection('reports').document(firestore_id)
            doc = doc_ref.get()
            
            if not doc.exists:
                logger.warning(f"Firestore document {firestore_id} does not exist")
                return None
            
            data = doc.to_dict()
            
            # Get or create complaint
            complaint, created = cls.objects.get_or_create(
                firestore_id=firestore_id,
                defaults={
                    'report_type': data.get('report_type', 'Жалоба'),
                    'region': data.get('region', ''),
                    'city': data.get('city', ''),
                    'report_text': data.get('report_text', ''),
                    'contact_info': data.get('contact_info', ''),
                    'email': data.get('email', ''),
                    'status': data.get('status', 'new'),
                    'importance': data.get('importance', 'medium'),
                    'notes': data.get('notes', ''),
                    'service': data.get('service', ''),
                    'agency': data.get('agency', ''),
                    'submission_source': data.get('submission_source', 'website'),
                    'language': data.get('language', 'ru'),
                }
            )
            
            # Update existing complaint
            if not created:
                complaint.report_type = data.get('report_type', complaint.report_type)
                complaint.region = data.get('region', complaint.region)
                complaint.city = data.get('city', complaint.city)
                complaint.report_text = data.get('report_text', complaint.report_text)
                complaint.contact_info = data.get('contact_info', complaint.contact_info)
                complaint.email = data.get('email', complaint.email)
                complaint.status = data.get('status', complaint.status)
                complaint.importance = data.get('importance', complaint.importance)
                complaint.notes = data.get('notes', complaint.notes)
                complaint.service = data.get('service', complaint.service)
                complaint.agency = data.get('agency', complaint.agency)
                complaint.submission_source = data.get('submission_source', complaint.submission_source)
                complaint.language = data.get('language', complaint.language)
                complaint.save()
            
            logger.info(f"{'Created' if created else 'Updated'} complaint {firestore_id} from Firestore")
            return complaint
            
        except Exception as e:
            logger.error(f"Error syncing from Firestore: {e}")
            return None
