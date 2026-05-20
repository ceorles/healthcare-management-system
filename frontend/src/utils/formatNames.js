export function formatDoctorName(name) {
    if (!name || name === 'Unassigned') return name;
    if (/^dr\.?\s/i.test(name.trim())) return name;
    return `Dr. ${name}`;
}

export function displayValue(value, fallback = '-----') {
    if (value === null || value === undefined || value === '') return fallback;
    return value;
}

export function formatVisitDateTime(dateString) {
    if (!dateString) return '-----';
    return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function formatDateOnly(dateString) {
    if (!dateString) return '-----';
    return new Date(`${dateString}T12:00:00`).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

export function formatAppointmentType(type) {
    if (!type) return 'Consultation';
    return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
