from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import Complaint
import logging

logger = logging.getLogger(__name__)


@admin.register(Complaint)
class ComplaintAdmin(admin.ModelAdmin):
    """Django admin configuration for Complaint model"""
    
    list_display = [
        'complaint_id_display', 
        'report_text_short', 
        'status_display', 
        'importance_display',
        'submission_source',
        'service',
        'agency',
        'created_at',
        'updated_at'
    ]
    
    list_filter = [
        'status',
        'importance',
        'submission_source',
        'agency',
        'region',
        'created_at',
        'updated_at'
    ]
    
    search_fields = [
        'firestore_id',
        'report_text',
        'contact_info',
        'email',
        'service',
        'agency',
        'region',
        'city'
    ]
    
    readonly_fields = [
        'firestore_id',
        'created_at',
        'updated_at',
        'submission_source',
        'language',
        'firestore_link'
    ]
    
    fields = [
        'firestore_id',
        'firestore_link',
        ('status', 'importance'),
        'report_text',
        'contact_info',
        'email',
        'notes',
        ('service', 'agency'),
        ('region', 'city'),
        ('submission_source', 'language'),
        ('created_at', 'updated_at'),
    ]
    
    actions = [
        'mark_as_pending',
        'mark_as_resolved', 
        'mark_as_cancelled',
        'sync_from_firestore',
        'send_email_notifications'
    ]
    
    list_per_page = 25
    date_hierarchy = 'created_at'
    
    def complaint_id_display(self, obj):
        """Display shortened complaint ID"""
        return f"#{obj.firestore_id[:8]}..."
    complaint_id_display.short_description = 'ID'
    
    def report_text_short(self, obj):
        """Display shortened report text"""
        text = obj.report_text[:60]
        if len(obj.report_text) > 60:
            text += "..."
        return text
    report_text_short.short_description = 'Текст обращения'
    
    def status_display(self, obj):
        """Display status with color coding"""
        colors = {
            'new': '#007cba',
            'pending': '#f0ad4e', 
            'resolved': '#5cb85c',
            'cancelled': '#d9534f'
        }
        color = colors.get(obj.status, '#777')
        status_text = dict(obj.STATUS_CHOICES).get(obj.status, obj.status)
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color,
            status_text
        )
    status_display.short_description = 'Статус'
    
    def importance_display(self, obj):
        """Display importance with color coding"""
        colors = {
            'critical': '#d9534f',
            'high': '#f0ad4e',
            'medium': '#5bc0de',
            'low': '#5cb85c'
        }
        color = colors.get(obj.importance, '#777')
        importance_text = dict(obj.IMPORTANCE_CHOICES).get(obj.importance, obj.importance)
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color,
            importance_text
        )
    importance_display.short_description = 'Приоритет'
    
    def firestore_link(self, obj):
        """Display link to Firestore document (informational)"""
        if obj.firestore_id:
            return format_html(
                '<code>{}</code><br><small>Firestore ID для справки</small>',
                obj.firestore_id
            )
        return "Не указан"
    firestore_link.short_description = 'Firestore ID'
    
    def save_model(self, request, obj, form, change):
        """Override save to log admin actions"""
        if change:
            # Get the old instance to check what changed
            try:
                old_obj = Complaint.objects.get(pk=obj.pk)
                changes = []
                
                if old_obj.status != obj.status:
                    old_status_text = dict(obj.STATUS_CHOICES).get(old_obj.status, old_obj.status)
                    new_status_text = dict(obj.STATUS_CHOICES).get(obj.status, obj.status)
                    changes.append(f"статус: {old_status_text} → {new_status_text}")
                
                if old_obj.importance != obj.importance:
                    old_importance_text = dict(obj.IMPORTANCE_CHOICES).get(old_obj.importance, old_obj.importance)
                    new_importance_text = dict(obj.IMPORTANCE_CHOICES).get(obj.importance, obj.importance)
                    changes.append(f"приоритет: {old_importance_text} → {new_importance_text}")
                
                if old_obj.notes != obj.notes:
                    changes.append("заметки обновлены")
                
                if changes:
                    logger.info(f"Admin {request.user.email} updated complaint {obj.firestore_id}: {', '.join(changes)}")
                    
                    # Add admin action to notes if status changed
                    if old_obj.status != obj.status:
                        admin_note = f"\n\n[{request.user.email}] Статус изменен с '{old_status_text}' на '{new_status_text}'"
                        if obj.notes:
                            obj.notes += admin_note
                        else:
                            obj.notes = admin_note.strip()
            
            except Complaint.DoesNotExist:
                pass
        
        super().save_model(request, obj, form, change)
    
    # Admin actions
    def mark_as_pending(self, request, queryset):
        """Mark selected complaints as pending"""
        updated = 0
        for complaint in queryset:
            if complaint.status != 'pending':
                complaint.status = 'pending'
                complaint.save()
                updated += 1
        
        self.message_user(request, f'{updated} обращений помечены как "В процессе"')
    mark_as_pending.short_description = 'Пометить как "В процессе"'
    
    def mark_as_resolved(self, request, queryset):
        """Mark selected complaints as resolved"""
        updated = 0
        for complaint in queryset:
            if complaint.status != 'resolved':
                complaint.status = 'resolved'
                complaint.save()
                updated += 1
        
        self.message_user(request, f'{updated} обращений помечены как "Решено"')
    mark_as_resolved.short_description = 'Пометить как "Решено"'
    
    def mark_as_cancelled(self, request, queryset):
        """Mark selected complaints as cancelled"""
        updated = 0
        for complaint in queryset:
            if complaint.status != 'cancelled':
                complaint.status = 'cancelled'
                complaint.save()
                updated += 1
        
        self.message_user(request, f'{updated} обращений помечены как "Отклонено"')
    mark_as_cancelled.short_description = 'Пометить как "Отклонено"'
    
    def sync_from_firestore(self, request, queryset):
        """Sync selected complaints from Firestore"""
        synced = 0
        for complaint in queryset:
            try:
                Complaint.sync_from_firestore(complaint.firestore_id)
                synced += 1
            except Exception as e:
                logger.error(f"Error syncing complaint {complaint.firestore_id}: {e}")
        
        self.message_user(request, f'{synced} обращений синхронизированы с Firestore')
    sync_from_firestore.short_description = 'Синхронизировать с Firestore'
    
    def send_email_notifications(self, request, queryset):
        """Send email notifications for selected complaints"""
        sent = 0
        for complaint in queryset:
            if complaint.submission_source == 'website' and complaint.email:
                try:
                    complaint.send_status_update_email()
                    sent += 1
                except Exception as e:
                    logger.error(f"Error sending email for complaint {complaint.firestore_id}: {e}")
        
        self.message_user(request, f'Email уведомления отправлены для {sent} обращений')
    send_email_notifications.short_description = 'Отправить email уведомления'


# Admin site customization
admin.site.site_header = "PublicPulse Админ панель"
admin.site.site_title = "PublicPulse Админ"
admin.site.index_title = "Управление обращениями граждан"
