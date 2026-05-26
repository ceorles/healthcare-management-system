const FIXED_DISEASE_COLORS = {
    Dengue: '#3b82f6',
    Neurological: '#22c55e',
    'Tuberculosis (TB)': '#8b5cf6',
    Electrocardiogram: '#06b6d4',
    'Neurological Examination': '#84cc16',
    Spirometry: '#f59e0b',
};

const FALLBACK_COLORS = [
    '#3b82f6',
    '#2d6a4f',
    '#7c3aed',
    '#ec4899',
    '#f59e0b',
    '#06b6d4',
    '#84cc16',
    '#6366f1',
    '#14b8a6',
    '#ef4444',
];

function hashString(value) {
    return String(value || '').split('').reduce((hash, char) => (
        ((hash << 5) - hash) + char.charCodeAt(0)
    ), 0);
}

export function getDiseaseColor(name) {
    if (FIXED_DISEASE_COLORS[name]) return FIXED_DISEASE_COLORS[name];

    const index = Math.abs(hashString(name)) % FALLBACK_COLORS.length;
    return FALLBACK_COLORS[index];
}

export function getTopDiseaseLegendPayload(diseases) {
    return [...diseases]
        .sort((a, b) => b.value - a.value || String(a.name).localeCompare(String(b.name)))
        .slice(0, 5)
        .map((entry) => ({
            value: entry.name,
            type: 'square',
            color: getDiseaseColor(entry.name),
        }));
}
