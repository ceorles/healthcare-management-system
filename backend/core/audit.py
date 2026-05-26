from .models import AuditLog

def get_client_ip(request):
    if not request:
        return None
    forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if forwarded:
        return forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def audit_log(request, action, target_type, description, target_id='', user=None, metadata=None):
    actor = user or getattr(request, 'user', None)
    if not actor or not actor.is_authenticated:
        return None

    return AuditLog.objects.create(
        user=actor,
        action=action,
        model_name=target_type,
        object_id=str(target_id or ''),
        description=description,
        ip_address=get_client_ip(request),
        metadata=metadata or {},
    )
