const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

function parseDateInput(value) {
    if (!value) return null;

    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
    }

    const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) {
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    const [, year, month, day] = match;
    const parsed = new Date(Number(year), Number(month) - 1, Number(day));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function getTodayDateInputValue(now = new Date()) {
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function isFutureBirthDate(value, now = new Date()) {
    const birthDate = parseDateInput(value);
    if (!birthDate) return false;

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return birthDate > todayStart;
}

export function formatPatientAge(value, now = new Date()) {
    const birthDate = parseDateInput(value);
    if (!birthDate || isFutureBirthDate(value, now)) return '';

    const diffMs = now.getTime() - birthDate.getTime();
    if (diffMs < DAY_MS) {
        const hours = Math.max(Math.floor(diffMs / HOUR_MS), 1);
        return `${hours}h`;
    }

    const days = Math.floor(diffMs / DAY_MS);
    if (days < 7) return `${days}d`;

    let months = (now.getFullYear() - birthDate.getFullYear()) * 12;
    months += now.getMonth() - birthDate.getMonth();
    if (now.getDate() < birthDate.getDate()) months -= 1;

    if (months < 1) {
        const weeks = Math.max(Math.floor(days / 7), 1);
        return `${weeks}w`;
    }

    if (months < 12) return `${months}m`;

    let years = now.getFullYear() - birthDate.getFullYear();
    const hasBirthdayPassed = (
        now.getMonth() > birthDate.getMonth()
        || (now.getMonth() === birthDate.getMonth() && now.getDate() >= birthDate.getDate())
    );
    if (!hasBirthdayPassed) years -= 1;
    return `${years}y`;
}
