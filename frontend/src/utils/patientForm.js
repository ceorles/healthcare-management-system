export const BLOOD_TYPES = ['N/A', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const PHILHEALTH_PATTERN = /^\d{2}-\d{9}-\d{1}$/;

export function formatPhilHealthNumber(value) {
    const digits = String(value || '').replace(/\D/g, '').slice(0, 12);
    const first = digits.slice(0, 2);
    const second = digits.slice(2, 11);
    const third = digits.slice(11, 12);

    if (digits.length <= 2) return first;
    if (digits.length <= 11) return `${first}-${second}`;
    return `${first}-${second}-${third}`;
}

export function isValidPhilHealthNumber(value) {
    if (!value) return true;
    return PHILHEALTH_PATTERN.test(value);
}

export function normalizeBloodType(value) {
    return BLOOD_TYPES.includes(value) ? value : 'N/A';
}
