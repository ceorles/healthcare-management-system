import { Link } from 'react-router-dom'

export default function CtaBanner({
    title,
    subtitle,
    primaryTo,
    primaryText,
    secondaryTo,
    secondaryText,
}) {
    return (
    <div className="cta-banner">
        <h2>{title}</h2>
        <p>{subtitle}</p>
        <div className="cta-btns">
            {primaryTo && (
                <Link to={primaryTo} className="btn-white">{primaryText}</Link>
            )}
            {secondaryTo && (
                <Link to={secondaryTo} className="btn-outline-white">{secondaryText}</Link>
            )}
        </div>
    </div>
    )
}