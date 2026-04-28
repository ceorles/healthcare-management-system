import { Link } from 'react-router-dom'

export default function PageBanner({ title, subtitle }) {
    return (
    <div className="page-banner">
        <div className="breadcrumb">
            <Link to="/">Home</Link> / {title}
        </div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
    </div>
    )
}