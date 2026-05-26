from .models import AuditChainState, AuditLog


def _failure_message(issue, fallback_latest_log_id=None):
    issue_type = issue.get('type')
    log_id = issue.get('log_id')

    if issue_type == 'record_hash_mismatch':
        return f'Record hash mismatch at Log #{log_id}'
    if issue_type == 'previous_hash_mismatch':
        return f'Previous hash mismatch detected at Log #{log_id}'
    if issue_type in {'latest_log_mismatch', 'latest_hash_mismatch', 'log_count_mismatch'}:
        anchor = fallback_latest_log_id or log_id
        if anchor:
            return f'Chain integrity broken after Log #{anchor}'
        return 'Chain integrity checkpoint mismatch'
    if issue_type == 'chain_anchor_missing':
        return 'Audit chain checkpoint is missing'
    return issue.get('detail') or 'Audit chain integrity issue detected'


def verify_audit_chain(limit_issues=25):
    logs = list(AuditLog.objects.select_related('user').order_by('id'))
    issues = []
    previous_hash = ''
    latest_log = logs[-1] if logs else None

    for log in logs:
        if log.previous_hash != previous_hash:
            issues.append({
                'log_id': log.id,
                'type': 'previous_hash_mismatch',
                'detail': 'Previous hash does not match the prior audit log.',
            })

        expected_hash = log.calculate_hash()
        if log.record_hash != expected_hash:
            issues.append({
                'log_id': log.id,
                'type': 'record_hash_mismatch',
                'detail': 'Stored hash does not match the recalculated hash.',
            })

        previous_hash = log.record_hash or ''

        if len(issues) >= limit_issues:
            break

    state = AuditChainState.objects.filter(pk=1).first()
    if not state:
        issues.append({
            'log_id': None,
            'type': 'chain_anchor_missing',
            'detail': 'Audit chain checkpoint is missing.',
        })
    else:
        expected_latest_id = latest_log.id if latest_log else None
        expected_latest_hash = latest_log.record_hash if latest_log else ''
        if state.total_logs != len(logs):
            issues.append({
                'log_id': latest_log.id if latest_log else None,
                'type': 'log_count_mismatch',
                'detail': 'Audit chain checkpoint count does not match stored logs.',
            })
        if state.latest_log_id != expected_latest_id:
            issues.append({
                'log_id': state.latest_log_id,
                'type': 'latest_log_mismatch',
                'detail': 'Audit chain checkpoint points to a missing or different latest log.',
            })
        if state.latest_hash != expected_latest_hash:
            issues.append({
                'log_id': expected_latest_id,
                'type': 'latest_hash_mismatch',
                'detail': 'Audit chain checkpoint hash does not match the latest log.',
            })

    first_issue = issues[0] if issues else None
    failure_message = _failure_message(first_issue, latest_log.id if latest_log else None) if first_issue else ''

    return {
        'verified': len(issues) == 0,
        'valid': len(issues) == 0,
        'checked_count': len(logs),
        'issue_count': len(issues),
        'issues': issues[:limit_issues],
        'failed_log': first_issue.get('log_id') if first_issue else None,
        'reason': first_issue.get('detail') if first_issue else '',
        'mismatch_type': first_issue.get('type') if first_issue else '',
        'failure_message': failure_message,
        'latest_log_id': latest_log.id if latest_log else None,
        'latest_hash_short': f'{latest_log.record_hash[:16]}...' if latest_log and latest_log.record_hash else '',
    }
