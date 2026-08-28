import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X, MapPin, Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { submitCitizenIssue } from '../services/api';

const CATEGORIES = [
  'Water Supply',
  'Roads & Infrastructure',
  'Education',
  'Sanitation',
  'Electricity',
  'Healthcare',
  'Agriculture',
  'Other',
];

const IssueReportForm = ({
  isOpen,
  onClose,
  activeGpId = 1,
  defaultCoords = [23.4988, 73.1812],
  onIssueCreated,
}) => {
  const [category, setCategory] = useState('Water Supply');
  const [description, setDescription] = useState('');
  const [lat, setLat] = useState(defaultCoords[0] || 23.4988);
  const [lng, setLng] = useState(defaultCoords[1] || 73.1812);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    if (defaultCoords && defaultCoords.length === 2) {
      setLat(defaultCoords[0]);
      setLng(defaultCoords[1]);
    }
  }, [defaultCoords]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter a description.' });
      return;
    }

    setLoading(true);
    setStatusMessage(null);

    try {
      const payload = {
        gp_id: Number(activeGpId),
        category,
        description: description.trim(),
        lat: Number(lat),
        lng: Number(lng),
      };

      const result = await submitCitizenIssue(payload);
      setStatusMessage({ type: 'success', text: 'Issue registered successfully in PostGIS!' });

      if (onIssueCreated) {
        onIssueCreated(result);
      }

      setTimeout(() => {
        setDescription('');
        setStatusMessage(null);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error submitting grievance:', err);
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to submit grievance. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Report Citizen Grievance</h2>
            <p className="text-xs text-slate-400">
              Submit geotagged civic issue with real-time GPS telemetry
            </p>
          </div>
        </div>

        {/* Status Notification */}
        {statusMessage && (
          <div
            className={`mb-4 p-3 rounded-xl flex items-center gap-2 text-xs font-medium ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Issue Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Grievance Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide specific details regarding the infrastructure failure or public need..."
              rows={3}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
            />
          </div>

          {/* GPS Coordinates (Lat / Lng) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Latitude (N)
              </label>
              <input
                type="number"
                step="0.0001"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Longitude (E)
              </label>
              <input
                type="number"
                step="0.0001"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-900/40 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Grievance</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

IssueReportForm.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  activeGpId: PropTypes.number,
  defaultCoords: PropTypes.arrayOf(PropTypes.number),
  onIssueCreated: PropTypes.func,
};

export default IssueReportForm;
