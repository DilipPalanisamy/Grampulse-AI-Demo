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
  {
    id: 'women',
    label: 'Women Welfare',
    icon: 'Award',
    color: '#f43f5e',
    bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20',
    query: 'What schemes support women heads of households, including Kalaignar Magalir Urimai Thogai?',
  },
  {
    id: 'students',
    label: 'College Students',
    icon: 'GraduationCap',
    color: '#a855f7',
    bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30 hover:bg-purple-500/20',
    query: 'What higher education grants exist for government school students like Pudhumai Penn or Tamil Pudhalvan?',
  },
  {
    id: 'pension',
    label: 'Senior Pension',
    icon: 'ShieldCheck',
    color: '#0ea5e9',
    bg: 'bg-sky-500/10 text-sky-400 border-sky-500/30 hover:bg-sky-500/20',
    query: 'Which schemes provide monthly pensions for senior citizens, destitute widows, and persons with disabilities?',
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
    government_level: 'CENTRAL',
    scheme_scope: 'VILLAGE_INFRASTRUCTURE',
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
    government_level: 'CENTRAL',
    scheme_scope: 'INDIVIDUAL_BENEFICIARY',
    official_portal_url: 'https://www.myscheme.gov.in/schemes/pmay-g',
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
    government_level: 'CENTRAL',
    scheme_scope: 'VILLAGE_INFRASTRUCTURE',
    official_portal_url: 'https://www.myscheme.gov.in/schemes/pmgsy',
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
    government_level: 'CENTRAL',
    scheme_scope: 'INDIVIDUAL_BENEFICIARY',
    official_portal_url: 'https://www.myscheme.gov.in/schemes/pm-kusum',
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
    government_level: 'CENTRAL',
    scheme_scope: 'VILLAGE_INFRASTRUCTURE',
    official_portal_url: 'https://www.myscheme.gov.in/schemes/ab-pmjay',
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
    government_level: 'CENTRAL',
    scheme_scope: 'VILLAGE_INFRASTRUCTURE',
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
    government_level: 'CENTRAL',
    scheme_scope: 'VILLAGE_INFRASTRUCTURE',
    official_portal_url: 'https://www.myscheme.gov.in/schemes/sbm-g',
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
    government_level: 'CENTRAL',
    scheme_scope: 'VILLAGE_INFRASTRUCTURE',
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
  },
  {
    scheme_id: 'CSS-PMKISAN-010',
    scheme_name: 'PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)',
    ministry: 'Ministry of Agriculture and Farmers Welfare',
    category: 'Agriculture & Farmers',
    government_level: 'CENTRAL',
    scheme_scope: 'INDIVIDUAL_BENEFICIARY',
    official_portal_url: 'https://pmkisan.gov.in/',
    purpose: 'Provides direct income support of ₹6,000 per year to small and marginal farmer families.',
    why_relevant: 'Provides cash flow for purchasing certified seeds, organic fertilizers, and preparing land.',
    eligibility_criteria: 'All landholding farmer families with cultivable land in their names (subject to exclusion criteria).',
    key_benefits: [
      '₹6,000 annual income support in 3 equal installments of ₹2,000',
      '100% centrally funded Direct Benefit Transfer (DBT)',
      'Direct link with Kisan Credit Card (KCC) for 4% crop loans'
    ],
    required_documents: ['Aadhaar Card with e-KYC', 'Land Patta / Chitta', 'Aadhaar-seeded bank account'],
    application_process: 'Apply online on pmkisan.gov.in or visit Village Common Services Center (CSC).'
  },
  {
    scheme_id: 'TN-KMUT-012',
    scheme_name: 'Kalaignar Magalir Urimai Thogai Thittam (KMUT)',
    ministry: 'Special Programme Implementation Department, Government of Tamil Nadu',
    category: 'Women Welfare & Basic Income',
    government_level: 'STATE_TN',
    scheme_scope: 'INDIVIDUAL_BENEFICIARY',
    official_portal_url: 'https://tnesevai.tn.gov.in/',
    purpose: 'Universal basic income rights grant of ₹1,000/month for women heads of families in Tamil Nadu.',
    why_relevant: 'Recognizes domestic care labor and provides guaranteed monthly economic support for rural women.',
    eligibility_criteria: 'Women heads of households aged 21+, annual family income < ₹2.5 Lakhs, wetland < 5 acres / dryland < 10 acres, electricity < 3,600 units/yr.',
    key_benefits: [
      '₹1,000 per month (₹12,000/year) directly credited via DBT on 15th of each month',
      'SMS alerts on phone upon monthly credit',
      'Special grievance camps at Taluk offices for excluded applicants'
    ],
    required_documents: ['Smart Family Ration Card', 'Aadhaar Card', 'Electricity Consumer Card', 'Bank Passbook'],
    application_process: 'Enroll at special village ration shop camps or Taluk e-Sevai centres.'
  },
  {
    scheme_id: 'TN-PP-013',
    scheme_name: 'Pudhumai Penn Thittam (Higher Education Assurance)',
    ministry: 'Social Welfare Department, Government of Tamil Nadu',
    category: 'Education & Women Empowerment',
    government_level: 'STATE_TN',
    scheme_scope: 'INDIVIDUAL_BENEFICIARY',
    official_portal_url: 'https://pudhumaipenn.tn.gov.in/',
    purpose: 'Provides ₹1,000 per month to female students from Tamil Nadu government schools pursuing higher education.',
    why_relevant: 'Prevents rural female dropout after school and enables girls to complete college degrees.',
    eligibility_criteria: 'Girl students who studied Classes 6 to 12 in Tamil Nadu Government schools enrolled in degree/diploma/ITI.',
    key_benefits: [
      '₹1,000 monthly allowance throughout degree or diploma course',
      'Eligible alongside other merit scholarships',
      'Covers books, travel, and college fees'
    ],
    required_documents: ['Class 10 & 12 Marksheets', 'Classes 6–12 Government School TC', 'College Bonafide Certificate', 'Bank Passbook'],
    application_process: 'College nodal officer registers student via pudhumaipenn.tn.gov.in with EMIS validation.'
  },
  {
    scheme_id: 'TN-TP-014',
    scheme_name: 'Tamil Pudhalvan Thittam',
    ministry: 'Higher Education Department, Government of Tamil Nadu',
    category: 'Education & Youth',
    government_level: 'STATE_TN',
    scheme_scope: 'INDIVIDUAL_BENEFICIARY',
    official_portal_url: 'https://tamilpudhalvan.tn.gov.in/',
    purpose: 'Provides ₹1,000 monthly grant to male students from Tamil Nadu government schools studying in college.',
    why_relevant: 'Supports boys from underprivileged farming and rural families in pursuing polytechnics and degree courses.',
    eligibility_criteria: 'Male students who studied Classes 6 to 12 in Tamil Nadu Government schools enrolled in UG degrees/diplomas.',
    key_benefits: [
      '₹1,000 per month paid directly into student bank account',
      'Facilitates textbooks, stationery, and travel costs',
      'Covers arts, science, engineering, and ITI disciplines'
    ],
    required_documents: ['School EMIS Certificate', 'College Bonafide', 'Aadhaar Card', 'Bank Passbook'],
    application_process: 'Applied through college portal desk on tamilpudhalvan.tn.gov.in.'
  },
  {
    scheme_id: 'TN-CMCHIS-015',
    scheme_name: 'Chief Minister\'s Comprehensive Health Insurance Scheme (CMCHIS)',
    ministry: 'Health & Family Welfare Department, Government of Tamil Nadu',
    category: 'Healthcare',
    government_level: 'STATE_TN',
    scheme_scope: 'INDIVIDUAL_BENEFICIARY',
    official_portal_url: 'https://www.cmchistn.com/',
    purpose: 'Cashless hospital treatment up to ₹5.00 Lakhs per family per year in empanelled hospitals.',
    why_relevant: 'Prevents catastrophic healthcare spending for rural families during major medical emergencies.',
    eligibility_criteria: 'Families resident in Tamil Nadu with annual income up to ₹1,20,000 (listed in Smart Ration Card).',
    key_benefits: [
      'Cashless hospital care up to ₹5 Lakhs/year for 1,090+ procedures',
      'Network includes all Government medical colleges & 800+ private hospitals',
      '24/7 dedicated helpline (1800 425 3993)'
    ],
    required_documents: ['Smart Family Ration Card', 'Aadhaar Card of all family members', 'VAO Income Certificate (if needed)'],
    application_process: 'Get CMCHIS Smart Card made at District Collectorate or Taluk Hospital kiosk.'
  },
  {
    scheme_id: 'TN-KAVIADP-016',
    scheme_name: 'Kalaignarin All Village Integrated Agriculture Development Programme (KAVIADP)',
    ministry: 'Agriculture & Farmers Welfare Department, Government of Tamil Nadu',
    category: 'Agriculture & Rural Development',
    government_level: 'STATE_TN',
    scheme_scope: 'VILLAGE_INFRASTRUCTURE',
    official_portal_url: 'https://agritech.tnau.ac.in/',
    purpose: 'Transforms selected Gram Panchayats into self-sufficient farming villages through inter-departmental convergence.',
    why_relevant: 'Brings fallow lands into cultivation and builds community farm ponds and solar drying yards.',
    eligibility_criteria: 'All farm habitations in selected Tamil Nadu Gram Panchayats under rotation.',
    key_benefits: [
      'Reclamation and cultivation of fallow village lands',
      'Community farm ponds, check dams, and micro-irrigation systems',
      'Solar drying yards and custom hiring centres for farm implements'
    ],
    required_documents: ['Gram Sabha Resolution', 'Farmer Patta / Chitta', 'Aadhaar Card'],
    application_process: 'Identified by Gram Sabha and sanctioned by Assistant Director of Agriculture via Uzhavan App.'
  },
  {
    scheme_id: 'TN-OAP-017',
    scheme_name: 'Tamil Nadu Social Security Pension Scheme (OAP & Destitute Pension)',
    ministry: 'Revenue & Disaster Management Department, Government of Tamil Nadu',
    category: 'Social Security & Pension',
    government_level: 'STATE_TN',
    scheme_scope: 'INDIVIDUAL_BENEFICIARY',
    official_portal_url: 'https://tnesevai.tn.gov.in/',
    purpose: 'Provides monthly subsistence pension of ₹1,000–₹1,500 to senior citizens, destitute widows, and disabled persons.',
    why_relevant: 'Vital social safety net for elderly and destitute village residents without family support.',
    eligibility_criteria: 'Destitute elderly persons aged 60+, destitute widows, and differently-abled individuals (40%+ disability).',
    key_benefits: [
      '₹1,000 to ₹1,500 monthly pension via bank DBT or doorstep postal delivery',
      '20 kg free rice monthly through PDS ration shop',
      'Free clothing twice a year during Pongal and Deepavali'
    ],
    required_documents: ['Aadhaar Card & age proof', 'Smart Ration Card', 'VAO Destitute Certificate', 'Medical Disability Card (if applicable)'],
    application_process: 'Apply at village e-Sevai centre; field inquiry conducted by Revenue Inspector.'
  },
  {
    scheme_id: 'CSS-PMFBY-018',
    scheme_name: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
    ministry: 'Ministry of Agriculture and Farmers Welfare',
    category: 'Crop Insurance',
    government_level: 'CENTRAL',
    scheme_scope: 'INDIVIDUAL_BENEFICIARY',
    official_portal_url: 'https://pmfby.gov.in/',
    purpose: 'Comprehensive insurance coverage against crop failure due to droughts, floods, and pests.',
    why_relevant: 'Safeguards farmers against erratic monsoons, drought, and post-harvest cyclone damage.',
    eligibility_criteria: 'All farmers cultivating notified food crops and oilseeds in notified revenue areas.',
    key_benefits: [
      'Low farmer premium: 2% for Kharif, 1.5% for Rabi, and 5% for horticultural crops',
      'Covers prevented sowing, mid-season damage, and post-harvest localized losses',
      'Claims assessed via satellite data & Crop Cutting Experiments (CCE)'
    ],
    required_documents: ['Land Patta / Chitta', 'Sowing Certificate from VAO', 'Aadhaar Card', 'Bank Passbook'],
    application_process: 'Enroll through PACCS, bank branch, or pmfby.gov.in portal before seasonal cutoff.'
  },
  {
    scheme_id: 'CSS-SURYAGHAR-019',
    scheme_name: 'PM Surya Ghar: Muft Bijli Yojana',
    ministry: 'Ministry of New and Renewable Energy',
    category: 'Clean Energy & Power',
    government_level: 'CENTRAL',
    scheme_scope: 'INDIVIDUAL_BENEFICIARY',
    official_portal_url: 'https://pmsuryaghar.gov.in/',
    purpose: 'Installs rooftop solar panels for households, providing up to 300 free units of electricity each month.',
    why_relevant: 'Eliminates household electricity bills and supplies clean energy back into the village grid.',
    eligibility_criteria: 'Domestic electricity consumers having a valid connection with DISCOM (TANGEDCO) and roof space.',
    key_benefits: [
      'Central subsidy up to ₹78,000 (₹30,000 for 1 kW, ₹60,000 for 2 kW, ₹78,000 for 3 kW+)',
      'Up to 300 units free solar power monthly',
      'Surplus export income via net meter'
    ],
    required_documents: ['Electricity Consumer Bill', 'Aadhaar Card', 'Cancelled Cheque', 'Roof photo'],
    application_process: 'Apply online on pmsuryaghar.gov.in; DISCOM inspects and installs net meter.'
  },
  {
    scheme_id: 'CSS-XVIFC-020',
    scheme_name: '15th Finance Commission Grants for Rural Local Bodies',
    ministry: 'Ministry of Panchayati Raj & Ministry of Finance',
    category: 'Village Infrastructure & Governance',
    government_level: 'CENTRAL',
    scheme_scope: 'VILLAGE_INFRASTRUCTURE',
    official_portal_url: 'https://egramswaraj.gov.in/',
    purpose: 'Provides direct constitutional untied and tied funding to Gram Panchayats for civic infrastructure.',
    why_relevant: 'Enables the Panchayat to repair street lights, maintain drinking water pipelines, and manage solid waste.',
    eligibility_criteria: 'Gram Panchayats with an approved GPDP uploaded and audited on eGramSwaraj.',
    key_benefits: [
      '40% Untied Grants for local public works (streetlights, road repair)',
      '60% Tied Grants strictly for drinking water and sanitation management',
      'Direct PFMS fund transfer into Panchayat bank account'
    ],
    required_documents: ['GPDP approved by Gram Sabha', 'eGramSwaraj Action Plan Resolution'],
    application_process: 'Prepared in GPDP and executed through eGramSwaraj-PFMS system.'
  }
];
