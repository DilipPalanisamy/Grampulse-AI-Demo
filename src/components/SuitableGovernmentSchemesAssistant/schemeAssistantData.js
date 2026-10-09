/**
 * =============================================================================
 * GramPulse AI - Suitable Government Schemes Assistant Knowledge & Presets
 * =============================================================================
 * Quick questions, domain triggers, and grounded verified government scheme facts.
 * Linked directly with Ministry of Panchayati Raj, Jal Shakti, MoRD, MoHFW, etc.
 * =============================================================================
 */

export const QUICK_QUESTIONS = [
  {
    id: 'water',
    label: 'Water Supply',
    icon: 'Droplets',
    color: '#06b6d4',
    bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/20',
    query: 'Which government schemes are suitable for improving drinking water supply and piped tap connections?',
  },
  {
    id: 'housing',
    label: 'Housing',
    icon: 'Home',
    color: '#f59e0b',
    bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20',
    query: 'Which government schemes support rural housing and pucca shelter construction?',
  },
  {
    id: 'agriculture',
    label: 'Agriculture',
    icon: 'Wheat',
    color: '#10b981',
    bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20',
    query: 'Which government schemes can support farmers, crop income, and agricultural development?',
  },
  {
    id: 'roads',
    label: 'Roads',
    icon: 'Route',
    color: '#f97316',
    bg: 'bg-orange-500/10 text-orange-400 border-orange-500/30 hover:bg-orange-500/20',
    query: 'What government scheme is suitable for all-weather rural road development and connectivity?',
  },
  {
    id: 'healthcare',
    label: 'Healthcare',
    icon: 'HeartPulse',
    color: '#ec4899',
    bg: 'bg-pink-500/10 text-pink-400 border-pink-500/30 hover:bg-pink-500/20',
    query: 'What schemes are available for rural healthcare, primary health clinics, and health insurance?',
  },
  {
    id: 'education',
    label: 'Education',
    icon: 'GraduationCap',
    color: '#8b5cf6',
    bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30 hover:bg-purple-500/20',
    query: 'Which scheme supports school education, classroom infrastructure, and digital learning?',
  },
  {
    id: 'sanitation',
    label: 'Sanitation',
    icon: 'Trash2',
    color: '#14b8a6',
    bg: 'bg-teal-500/10 text-teal-400 border-teal-500/30 hover:bg-teal-500/20',
    query: 'Is there a government scheme for rural sanitation, household toilets, and solid waste management?',
  },
  {
    id: 'solar',
    label: 'Solar Energy',
    icon: 'Sun',
    color: '#eab308',
    bg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/20',
    query: 'Are there government schemes for solar irrigation pumps and decentralized green energy?',
  },
  {
    id: 'employment',
    label: 'Employment',
    icon: 'Briefcase',
    color: '#3b82f6',
    bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20',
    query: 'Which scheme can help unemployed rural people and provide guaranteed wage employment?',
  },
];

export const INITIAL_GREETING = {
  id: 'scheme-welcome-msg',
  sender: 'bot',
  text: `Namaste! 🙏
I am your **Suitable Government Schemes AI Assistant**.

I can help you discover, evaluate eligibility, and understand benefits of Central & State Government welfare programs tailored for your village.

**Tell me what you need help with, for example:**
• 💧 **Drinking water** (Jal Jeevan Mission)
• 🛣️ **Roads & connectivity** (PMGSY)
• 🏠 **Housing** (PMAY-G)
• 🌾 **Agriculture & farmers** (PM-KISAN / PM-KUSUM)
• 🏥 **Healthcare & clinics** (Ayushman Bharat / NHM)
• 🎓 **Education & schools** (PM SHRI / Samagra Shiksha)
• ♻️ **Sanitation & waste** (Swachh Bharat Mission - Gramin)
• 💼 **Rural employment** (MGNREGA / DAY-NRLM)
• ☀️ **Solar energy & pumps** (PM-KUSUM)

How can I help you today?`,
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

export const SCHEMES_STATIC_DIRECTORY = [
  {
    scheme_id: 'CSS-JJM-001',
    scheme_name: 'Jal Jeevan Mission (JJM) - Har Ghar Jal',
    ministry: 'Ministry of Jal Shakti',
    category: 'Water Supply',
    official_portal_url: 'https://jaljeevanmission.gov.in/',
    purpose: 'Provides universal rural drinking-water supply with functional household tap connections (55 LPD norm).',
    why_relevant: 'Provides piped drinking water infrastructure and overhead storage reservoirs for rural habitations.',
    eligibility_criteria: 'All rural habitations and public institutions (schools, anganwadis, health centres).',
    key_benefits: [
      '55 LPD potable water supply per capita',
      'Overhead storage tank (OHT) and solar pump installations',
      'Regular water quality testing through women self-help groups'
    ],
    required_documents: ['Gram Sabha approved Village Action Plan', 'Beneficiary household list'],
  },
  {
    scheme_id: 'CSS-PMAYG-007',
    scheme_name: 'Pradhan Mantri Awaas Yojana - Gramin (PMAY-G)',
    ministry: 'Ministry of Rural Development',
    category: 'Housing & Infrastructure',
    official_portal_url: 'https://pmayg.gov.in/',
    purpose: 'Provides pucca concrete disaster-resilient houses with basic amenities to houseless rural families.',
    why_relevant: 'Direct financial assistance for rural families living in kutcha dwellings.',
    eligibility_criteria: 'Houseless families and households living in zero, one, or two-room kutcha houses under SECC 2011 / Awaas+ list.',
    key_benefits: [
      'Direct grant of ₹1.20 Lakhs (plain) / ₹1.30 Lakhs (hilly/tribal areas)',
      '90-95 days unskilled wage support under MGNREGA (~₹24,000)',
      '₹12,000 toilet grant under Swachh Bharat Mission'
    ],
    required_documents: ['Aadhaar Card', 'Bank Passbook linked with Aadhaar', 'Awaas+ survey ID', 'Land possession certificate'],
  },
  {
    scheme_id: 'CSS-PMGSY-002',
    scheme_name: 'Pradhan Mantri Gram Sadak Yojana (PMGSY - Phase III)',
    ministry: 'Ministry of Rural Development',
    category: 'Roads & Infrastructure',
    official_portal_url: 'https://www.rural.gov.in/',
    purpose: 'Provides all-weather blacktopped paved road connectivity to unconnected rural habitations.',
    why_relevant: 'Constructs durable bitumen roads connecting villages to highways, markets, and hospitals.',
    eligibility_criteria: 'Habitations with 500+ population in plain areas (250+ in hill and tribal areas).',
    key_benefits: [
      'All-weather bitumen road paving',
      'Concrete cross-drainage culverts and bridge structures',
      '5-year mandatory contractor maintenance included'
    ],
    required_documents: ['District Rural Road Plan alignment', 'Panchayat resolution for road work'],
  },
  {
    scheme_id: 'CSS-KUSUM-008',
    scheme_name: 'PM-KUSUM (Solar Agricultural Pumps)',
    ministry: 'Ministry of New and Renewable Energy',
    category: 'Renewable Energy & Agriculture',
    official_portal_url: 'https://www.mnre.gov.in/',
    purpose: 'Promotes standalone solar agriculture pumps and solarization of grid-connected irrigation feeders.',
    why_relevant: 'Provides daytime solar irrigation without expensive diesel fuels or power cuts.',
    eligibility_criteria: 'Individual farmers, farmer groups, Water User Associations, and FPOs.',
    key_benefits: [
      'Up to 60% subsidy (30% Central + 30% State Govt)',
      'Only 10% farmer upfront contribution required',
      'Uninterrupted solar power for irrigation pumps'
    ],
    required_documents: ['Aadhaar Card', 'Land 7/12 extract / Patta', 'Bank Passbook', 'Borewell certificate'],
  },
  {
    scheme_id: 'CSS-ABHWC-003',
    scheme_name: 'Ayushman Bharat - Health & Wellness Centres (NHM)',
    ministry: 'Ministry of Health and Family Welfare',
    category: 'Healthcare',
    official_portal_url: 'https://nha.gov.in/',
    purpose: 'Comprehensive primary healthcare with free diagnostics, medicines, and tele-consultations.',
    why_relevant: 'Ensures quality healthcare, maternal care, and emergency diagnostics in village centres.',
    eligibility_criteria: 'All rural residents. ₹5 Lakhs cashless hospital cover for SECC/eligible families under PM-JAY.',
    key_benefits: [
      'Free essential medicines and 60+ diagnostic lab tests',
      'eSanjeevani tele-consultation with specialist doctors',
      '₹5 Lakhs/year cashless family hospitalization under PM-JAY'
    ],
    required_documents: ['Aadhaar Card', 'Ration Card / SECC ID'],
  },
  {
    scheme_id: 'CSS-PMSHRI-004',
    scheme_name: 'PM SHRI & Samagra Shiksha Abhiyan',
    ministry: 'Ministry of Education',
    category: 'Education',
    official_portal_url: 'https://pmshrischools.education.gov.in/',
    purpose: 'Upgrades government schools with smart digital classrooms, STEM labs, and RTE compliance.',
    why_relevant: 'Solves pupil-to-classroom shortage and equips village schools with digital learning kits.',
    eligibility_criteria: 'Government and local body schools meeting RTE enrollment standards.',
    key_benefits: [
      'Smart classrooms and computer laboratories',
      'Rooftop solar power and rainwater harvesting units',
      'Free textbooks, uniforms, and PM POSHAN meals'
    ],
    required_documents: ['UDISE+ School Registration Code', 'School Management Committee resolution'],
  },
  {
    scheme_id: 'CSS-SBMG-005',
    scheme_name: 'Swachh Bharat Mission - Gramin (SBM-G Phase II)',
    ministry: 'Ministry of Jal Shakti (DDWS)',
    category: 'Sanitation',
    official_portal_url: 'https://sbm.gov.in/',
    purpose: 'Sustains ODF status and executes village Solid & Liquid Waste Management (SLWM).',
    why_relevant: 'Constructs individual household latrines, community sanitary complexes, and drainage soak pits.',
    eligibility_criteria: 'All rural households and Gram Panchayats.',
    key_benefits: [
      '₹12,000 incentive for Individual Household Latrine (IHHL)',
      'Up to ₹3.00 Lakhs for Community Sanitary Complex',
      'Village-wide solid and greywater waste management units'
    ],
    required_documents: ['Aadhaar Card', 'Bank Passbook with DBT linkage', 'Geo-tagged toilet photograph'],
  },
  {
    scheme_id: 'CSS-MGNREGS-009',
    scheme_name: 'Mahatma Gandhi NREGA (Guaranteed Rural Wage Employment)',
    ministry: 'Ministry of Rural Development',
    category: 'Rural Employment & Assets',
    official_portal_url: 'https://nrega.nic.in/',
    purpose: 'Guarantees at least 100 days of wage employment per financial year for unskilled manual labor.',
    why_relevant: 'Provides guaranteed wage security and builds durable village water bodies and farm assets.',
    eligibility_criteria: 'All rural adult residents (18+ years) volunteering for unskilled work.',
    key_benefits: [
      'Guaranteed 100 days of paid wage employment per household',
      'Statutory daily wage deposited directly into bank account via DBT',
      'Asset creation: farm ponds, check dams, and tree plantations'
    ],
    required_documents: ['Aadhaar Card', 'Passport size photo', 'Bank / Post Office Passbook', 'Job Card application'],
  }
];
