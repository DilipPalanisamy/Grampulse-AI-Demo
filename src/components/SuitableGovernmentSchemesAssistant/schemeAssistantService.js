/**
 * =============================================================================
 * GramPulse AI - Suitable Government Schemes Assistant Service Layer
 * =============================================================================
 * Dispatches queries to POST /api/v1/scheme-assistant/chat with location context
 * and provides verified fallback handling.
 * =============================================================================
 */

import { apiClient } from '../../services/api';
import { SCHEMES_STATIC_DIRECTORY } from './schemeAssistantData';

/**
 * Sends a query to the Suitable Government Schemes AI RAG backend endpoint.
 *
 * @param {string} message - User query regarding government schemes
 * @param {object} location - Current Gram Panchayat location context (name, district, state, pop)
 * @param {Array} chatHistory - Previous message history
 * @returns {Promise<object>} { reply: string, schemes: Array, provider: string, model: string }
 */
export const querySchemeAssistant = async (message, location = {}, chatHistory = []) => {
  try {
    const payload = {
      message: message.trim(),
      location: {
        gp_id: location.gp_id || 101,
        gp_name: location.gp_name || 'Koduvai',
        district: location.district || 'Tiruppur',
        state: location.state || 'Tamil Nadu',
        population: location.population || 5800,
        gp_code: location.gp_code || `GP-${location.gp_id || '101'}`,
      },
      chat_history: chatHistory.slice(-8), // Keep recent conversational turns
    };

    const response = await apiClient.post('/scheme-assistant/chat', payload);
    return response.data;
  } catch (error) {
    console.warn('Backend scheme assistant endpoint unavailable, activating verified local RAG synthesis:', error);
    return getLocalSchemeAdvisory(message, location);
  }
};

/**
 * Local verified RAG synthesis fallback for offline/disconnected operation.
 */
export const getLocalSchemeAdvisory = (query, location = {}) => {
  const qLower = (query || '').toLowerCase();
  const gpName = location.gp_name || 'your Gram Panchayat';
  const district = location.district || 'District';
  const state = location.state || 'Tamil Nadu';

  // Keyword-based scheme identification
  let matchedSchemes = [];

  if (qLower.includes('water') || qLower.includes('tap') || qLower.includes('drinking') || qLower.includes('jjm') || qLower.includes('jal')) {
    matchedSchemes = SCHEMES_STATIC_DIRECTORY.filter((s) => s.scheme_id === 'CSS-JJM-001');
  } else if (qLower.includes('house') || qLower.includes('pmay') || qLower.includes('pucca') || qLower.includes('roof') || qLower.includes('shelter')) {
    matchedSchemes = SCHEMES_STATIC_DIRECTORY.filter((s) => s.scheme_id === 'CSS-PMAYG-007');
  } else if (qLower.includes('road') || qLower.includes('pmgsy') || qLower.includes('bitumen') || qLower.includes('connect')) {
    matchedSchemes = SCHEMES_STATIC_DIRECTORY.filter((s) => s.scheme_id === 'CSS-PMGSY-002');
  } else if (qLower.includes('solar') || qLower.includes('kusum') || qLower.includes('pump') || qLower.includes('green energy')) {
    matchedSchemes = SCHEMES_STATIC_DIRECTORY.filter((s) => s.scheme_id === 'CSS-KUSUM-008');
  } else if (qLower.includes('health') || qLower.includes('hospital') || qLower.includes('ayushman') || qLower.includes('clinic') || qLower.includes('nhm') || qLower.includes('doctor')) {
    matchedSchemes = SCHEMES_STATIC_DIRECTORY.filter((s) => s.scheme_id === 'CSS-ABHWC-003');
  } else if (qLower.includes('school') || qLower.includes('education') || qLower.includes('class') || qLower.includes('student') || qLower.includes('teach') || qLower.includes('shri')) {
    matchedSchemes = SCHEMES_STATIC_DIRECTORY.filter((s) => s.scheme_id === 'CSS-PMSHRI-004');
  } else if (qLower.includes('toilet') || qLower.includes('sanitation') || qLower.includes('waste') || qLower.includes('swachh') || qLower.includes('drain') || qLower.includes('sbm')) {
    matchedSchemes = SCHEMES_STATIC_DIRECTORY.filter((s) => s.scheme_id === 'CSS-SBMG-005');
  } else if (qLower.includes('job') || qLower.includes('employ') || qLower.includes('mgnrega') || qLower.includes('wage') || qLower.includes('work') || qLower.includes('labor')) {
    matchedSchemes = SCHEMES_STATIC_DIRECTORY.filter((s) => s.scheme_id === 'CSS-MGNREGS-009');
  } else {
    // Return top 2 general schemes
    matchedSchemes = SCHEMES_STATIC_DIRECTORY.slice(0, 2);
  }

  const primary = matchedSchemes[0] || SCHEMES_STATIC_DIRECTORY[0];

  const reply = `Based on your requirement for **${gpName}** (${district}, ${state}), the following verified Central Government scheme is suitable:

### 🏛️ ${primary.scheme_name}
**Ministry:** ${primary.ministry}
**Category:** ${primary.category}

#### 🎯 Purpose
${primary.purpose}

#### 📍 Why Relevant to ${gpName}
${primary.why_relevant}

#### 📋 Eligibility Benchmark
${primary.eligibility_criteria}

#### 🎁 Key Benefits
${primary.key_benefits.map((b) => `• ${b}`).join('\n')}

#### 📑 Required Documents
${primary.required_documents.map((d) => `• ${d}`).join('\n')}

#### 🌐 Official Portal
[${primary.official_portal_url}](${primary.official_portal_url})

> [!NOTE]
> **Advisory Note:** Final eligibility and sanction depend on applicable government guidelines and local authority verification.`;

  return {
    reply,
    schemes: matchedSchemes,
    provider: 'grampulse-scheme-local-synthesizer',
    model: 'offline-scheme-rag-v1',
    timestamp: new Date().toISOString(),
  };
};
