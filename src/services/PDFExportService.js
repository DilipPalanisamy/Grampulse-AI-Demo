/**
 * =============================================================================
 * GramPulse AI - PDF Export Service
 * =============================================================================
 * Service layer coordinating live village state, spatial dataset counts,
 * Scikit-learn predictive deficits, and AI-matched government schemes to
 * generate and trigger the executive GPDP PDF report download.
 * =============================================================================
 */

import { generateVillageAssessmentPDF } from '../utils/pdfGenerator';

/**
 * Export full executive GPDP report for the active Gram Panchayat.
 */
export const exportVillagePDFReport = async ({
  location = {},
  analytics = null,
  infrastructure = { counts: {} },
  schemes = [],
  planningHorizon = 5,
}) => {
  try {
    const filename = generateVillageAssessmentPDF({
      location,
      analytics,
      infrastructure,
      schemes: schemes.length > 0 ? schemes : (analytics?.matched_schemes || []),
      planningHorizon,
    });
    return { success: true, filename };
  } catch (error) {
    console.error('Error generating Village Assessment PDF report:', error);
    throw error;
  }
};

export default {
  exportVillagePDFReport,
  generateVillageAssessmentPDF,
};
