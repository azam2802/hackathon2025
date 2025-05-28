from django.core.management.base import BaseCommand
from firebase_admin import firestore
from analyze.models import Complaint
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Sync all complaints from Firestore to Django database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--limit',
            type=int,
            default=None,
            help='Limit number of documents to sync'
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force update existing complaints'
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting Firestore sync...'))
        
        try:
            db = firestore.client()
            reports_ref = db.collection('reports')
            
            # Get all reports query
            query = reports_ref.order_by('created_at', direction=firestore.Query.DESCENDING)
            
            if options['limit']:
                query = query.limit(options['limit'])
                
            docs = query.get()
            
            total_docs = len(docs)
            synced = 0
            updated = 0
            errors = 0
            
            self.stdout.write(f'Found {total_docs} documents in Firestore')
            
            for doc in docs:
                try:
                    doc_id = doc.id
                    data = doc.to_dict()
                    
                    # Check if complaint already exists
                    existing_complaint = None
                    try:
                        existing_complaint = Complaint.objects.get(firestore_id=doc_id)
                    except Complaint.DoesNotExist:
                        pass
                    
                    if existing_complaint and not options['force']:
                        self.stdout.write(f'Skipping existing complaint: {doc_id}')
                        continue
                    
                    # Create or update complaint
                    complaint, created = Complaint.objects.get_or_create(
                        firestore_id=doc_id,
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
                    
                    if not created and options['force']:
                        # Update existing complaint
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
                        updated += 1
                        self.stdout.write(f'Updated complaint: {doc_id}')
                    elif created:
                        synced += 1
                        self.stdout.write(f'Synced complaint: {doc_id}')
                    
                except Exception as e:
                    errors += 1
                    self.stdout.write(
                        self.style.ERROR(f'Error syncing {doc_id}: {str(e)}')
                    )
                    logger.error(f'Error syncing complaint {doc_id}: {e}')
            
            # Summary
            self.stdout.write(
                self.style.SUCCESS(
                    f'\nSync completed!\n'
                    f'Total documents: {total_docs}\n'
                    f'New complaints synced: {synced}\n'
                    f'Existing complaints updated: {updated}\n'
                    f'Errors: {errors}'
                )
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Fatal error during sync: {str(e)}')
            )
            logger.error(f'Fatal error during Firestore sync: {e}')
            raise
