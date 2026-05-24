import { useRef } from 'react';

export default function DownloadOrPrint({ onPrint }) {
    return (
        <button type="button" className="reports-download-btn" onClick={onPrint}>
            Download/Print Report
        </button>
    );
}

export function usePrintReport(reportRef) {
    const handlePrint = () => {
        window.print();
    };
    return { reportRef, handlePrint };
}
