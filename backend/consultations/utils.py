def format_user_display_name(user, with_dr_title=False):
    if not user:
        return None
    name = (getattr(user, 'fullname', None) or getattr(user, 'username', None) or '').strip()
    if not name:
        return None
    if with_dr_title and getattr(user, 'role', None) == 'DOCTOR':
        lower = name.lower()
        if not lower.startswith('dr.') and not lower.startswith('dr '):
            return f'Dr. {name}'
    return name
