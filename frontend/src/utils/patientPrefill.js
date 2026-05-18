/** Parse walk-in name from referral (often "Last, First Middle") into form fields. */
export function parseWalkinName(walkinName) {
    if (!walkinName?.trim()) {
        return { last_name: '', first_name: '', middle_name: '' };
    }
    const trimmed = walkinName.trim();
    if (trimmed.includes(',')) {
        const [last, rest] = trimmed.split(',').map((s) => s.trim());
        const nameParts = (rest || '').split(/\s+/).filter(Boolean);
        return {
            last_name: last || '',
            first_name: nameParts[0] || '',
            middle_name: nameParts.slice(1).join(' '),
        };
    }
    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2) {
        return {
            last_name: parts[parts.length - 1],
            first_name: parts[0],
            middle_name: parts.slice(1, -1).join(' '),
        };
    }
    return { last_name: '', first_name: trimmed, middle_name: '' };
}

export function buildPatientFormFromWalkinPrefill(prefill) {
    if (!prefill) return null;
    const names = parseWalkinName(prefill.walkin_name);
    return {
        ...names,
        address: prefill.walkin_address || '',
        barangay: prefill.barangay || 'Poblacion 1',
    };
}

/** Extract referral code from raw QR text (plain code or JSON payload). */
export function parseReferralCodeFromQr(decodedText) {
    const raw = decodedText?.trim() || '';
    if (!raw) return '';

    try {
        const parsed = JSON.parse(raw);
        if (parsed.referral_code) return String(parsed.referral_code).trim();
        if (parsed.code) return String(parsed.code).trim();
    } catch {
        // plain text QR — expected format from print slip
    }

    const match = raw.match(/REF-[\w-]+/i);
    return match ? match[0] : raw;
}
