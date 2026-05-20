"""Rule-based Smart Clinical Decision Support (no paid AI API required)."""


def _to_float(value):
    try:
        if value in (None, ''):
            return None
        return float(value)
    except (TypeError, ValueError):
        return None


def _to_int(value):
    try:
        if value in (None, ''):
            return None
        return int(float(value))
    except (TypeError, ValueError):
        return None


def analyze_clinical_data(symptoms='', vitals=None):
    """
    Lightweight rule-based CDS from symptoms + vitals.
    Not a diagnosis — guidance only.
    """
    vitals = vitals or {}
    symptoms_lower = (symptoms or '').lower().strip()

    possible_conditions = []
    recommended_tests = []
    risk_indicators = []
    recommendations = []
    insights = []

    temp = _to_float(vitals.get('temperature'))
    hr = _to_int(vitals.get('heart_rate'))
    rr = _to_int(vitals.get('respiratory_rate'))
    bp_sys = _to_int(vitals.get('blood_pressure_systolic'))
    bp_dia = _to_int(vitals.get('blood_pressure_diastolic'))
    spo2 = _to_float(vitals.get('oxygen_saturation'))

    if not symptoms_lower:
        return {
            'possible_conditions': [],
            'recommended_tests': [],
            'risk_indicators': [],
            'recommendations': [],
            'insights': ['Enter symptoms to activate clinical decision support.'],
            'disclaimer': 'AI-generated clinical support only. Final diagnosis must come from medical professionals.',
        }

    symptom_rules = [
        (('fever', 'lagnat', 'init'), 'Possible febrile illness', 'Monitor temperature trend and hydration status'),
        (('cough', 'ubo', 'sipon'), 'Possible respiratory tract involvement', 'Assess breathing effort and oxygen saturation'),
        (('chest pain', 'pananakit ng dibdib'), 'Chest discomfort reported — requires clinician evaluation', 'Consider ECG if clinically indicated'),
        (('headache', 'sakit ng ulo'), 'Possible headache syndrome', 'Screen for associated neurologic red flags'),
        (('abdominal pain', 'tiyan', 'sakit ng tiyan'), 'Possible abdominal complaint', 'Assess for guarding, rebound, and hydration'),
        (('dizziness', 'nahihilo', 'hilo'), 'Possible vestibular or circulatory concern', 'Check blood pressure and hydration'),
        (('vomiting', 'suwa', 'pagsusuka'), 'Possible GI upset or dehydration risk', 'Monitor fluid intake and electrolytes if persistent'),
        (('diarrhea', 'tatae', 'loose stool'), 'Possible gastroenteritis', 'Assess dehydration signs'),
    ]

    for keywords, condition, recommendation in symptom_rules:
        if any(keyword in symptoms_lower for keyword in keywords):
            possible_conditions.append(condition)
            recommendations.append(recommendation)

    if temp is not None:
        if temp >= 38.0:
            risk_indicators.append(f'Elevated temperature ({temp}°C)')
            recommended_tests.append('Repeat temperature monitoring; consider CBC if fever persists')
            insights.append('Fever pattern may suggest infection — correlate with other vitals.')
        elif temp <= 35.5:
            risk_indicators.append(f'Low temperature ({temp}°C)')
            recommendations.append('Assess for hypothermia risk and warming measures')

    if bp_sys is not None and bp_dia is not None:
        if bp_sys >= 140 or bp_dia >= 90:
            risk_indicators.append(f'Blood pressure in hypertensive range ({bp_sys}/{bp_dia})')
            recommendations.append('Recheck blood pressure and review cardiovascular history')
        elif bp_sys < 90 or bp_dia < 60:
            risk_indicators.append(f'Blood pressure in hypotensive range ({bp_sys}/{bp_dia})')
            recommendations.append('Assess for dizziness, dehydration, or bleeding')

    if hr is not None:
        if hr > 100:
            risk_indicators.append(f'Tachycardia noted ({hr} bpm)')
        elif hr < 60:
            risk_indicators.append(f'Bradycardia noted ({hr} bpm)')

    if rr is not None and rr > 20:
        risk_indicators.append(f'Increased respiratory rate ({rr}/min)')
        recommendations.append('Evaluate for respiratory distress')

    if spo2 is not None and spo2 < 95:
        risk_indicators.append(f'Low oxygen saturation ({spo2}%)')
        recommended_tests.append('Pulse oximetry recheck; assess need for supplemental oxygen')

    if not possible_conditions:
        possible_conditions.append('Non-specific symptom pattern — continue full clinical assessment')

    if not recommended_tests:
        recommended_tests.append('Basic vital signs recheck during observation')

    # Deduplicate while preserving order
    def dedupe(items):
        seen = set()
        result = []
        for item in items:
            if item not in seen:
                seen.add(item)
                result.append(item)
        return result

    return {
        'possible_conditions': dedupe(possible_conditions),
        'recommended_tests': dedupe(recommended_tests),
        'risk_indicators': dedupe(risk_indicators),
        'recommendations': dedupe(recommendations),
        'insights': dedupe(insights),
        'disclaimer': 'AI-generated clinical support only. Final diagnosis must come from medical professionals.',
    }
