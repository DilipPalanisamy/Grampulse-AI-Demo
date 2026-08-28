import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FileDown, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { downloadGPDPReport } from '../services/api';

const ReportDownloadButton = ({
  gpId,
  gpName = 'Panchayat',
  horizonYears = 5,
  className = '',
}) => {
  const [downloading, setDownloading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState(null); // 'success' | 'error' | null

  const handleDownload = async () => {
    if (downloading || !gpId) return;

    setDownloading(true);
    setDownloadStatus(null);

    try {
      await downloadGPDPReport(gpId, gpName, horizonYears);
      setDownloadStatus('success');
      setTimeout(() => setDownloadStatus(null), 3000);
    } catch (err) {
      console.error('Failed to download GPDP Report:', err);
      setDownloadStatus('error');
      setTimeout(() => setDownloadStatus(null), 4000);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={downloading || !gpId}
      className={`relative inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-medium text-xs sm:text-sm shadow-lg transition-all duration-200 ${
        downloadStatus === 'success'
          ? 'bg-emerald-600 text-white shadow-emerald-900/30'
          : downloadStatus === 'error'
          ? 'bg-rose-600 text-white shadow-rose-900/30'
          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40 hover:shadow-emerald-700/50 active:scale-95'
      } disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      title="Download Official GPDP PDF Plan"
    >
      {downloading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Compiling PDF...</span>
        </>
      ) : downloadStatus === 'success' ? (
        <>
          <CheckCircle className="w-4 h-4 text-white" />
          <span>Downloaded!</span>
        </>
      ) : downloadStatus === 'error' ? (
        <>
          <AlertCircle className="w-4 h-4 text-white" />
          <span>Download Failed</span>
        </>
      ) : (
        <>
          <FileDown className="w-4 h-4 text-emerald-100" />
          <span>Export GPDP PDF</span>
        </>
      )}
    </button>
  );
};

ReportDownloadButton.propTypes = {
  gpId: PropTypes.number.isRequired,
  gpName: PropTypes.string,
  horizonYears: PropTypes.number,
  className: PropTypes.string,
};

export default ReportDownloadButton;
