"""
=============================================================================
GramPulse AI - Dedicated Government Schemes AI Assistant Engine (RAG)
=============================================================================
Provides intelligent, RAG-grounded discovery, explanation, eligibility analysis,
and official source retrieval for Indian Central and State Government schemes.
Strictly grounded in verified knowledge base with zero hallucination.
=============================================================================
"""

import os
import re
import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass
logger = logging.getLogger("GramPulse-SchemeAssistant")

# Import the existing scheme knowledge base & RAG engine
from backend.services.scheme_rag_engine import (
    OFFICIAL_GOVERNMENT_SCHEMES,
    scheme_rag_engine,
    _compute_dense_vector,
    _cosine_similarity,
)

# Comprehensive Detailed Scheme Knowledge Base with ground truth fields
DETAILED_SCHEME_KNOWLEDGE: Dict[str, Dict[str, Any]] = {
    "CSS-JJM-001": {
        "scheme_id": "CSS-JJM-001",
        "scheme_name": "Jal Jeevan Mission (JJM) - Har Ghar Jal",
        "ministry": "Ministry of Jal Shakti (Department of Drinking Water and Sanitation)",
        "category": "Water Supply",
        "official_portal_url": "https://ejalshakti.gov.in/",
        "nodal_agency": "State Water and Sanitation Mission (SWSM) & Gram Panchayat Village Water & Sanitation Committee (VWSC)",
        "purpose": "Provide Functional Household Tap Connection (FHTC) to every rural household with potable water at service level of 55 LPD on long-term basis.",
        "why_relevant_template": "Applicable for rural habitations experiencing potable water deficit, low tap connection coverage, or relying on unpurified groundwater.",
        "eligibility_criteria": "All rural habitations, marginalized settlements (SC/ST majority), schools, Anganwadi centres, and health wellness centres lacking 100% functional tap water connections.",
        "key_benefits": [
            "Guaranteed 55 Litres Per Capita per Day (LPD) of potable tap water.",
            "In-village water supply infrastructure including overhead tanks (OHT) and solar pumps.",
            "Water quality surveillance through field test kits (FTK) distributed to 5 women per Gram Panchayat.",
            "Community operation and maintenance funded via 15th Finance Commission untied grants."
        ],
        "required_documents": [
            "Village Action Plan (VAP) approved by Gram Sabha",
            "Household enumeration list for FHTC sanction",
            "Panchayat resolution for water source sustainability",
            "VWSC committee registration certificate"
        ],
        "application_process": "1. Village Water and Sanitation Committee (VWSC) prepares Village Action Plan (VAP). 2. Gram Sabha reviews and approves VAP. 3. Submitted to District Water and Sanitation Mission (DWSM). 4. Technical sanction and fund transfer through Public Financial Management System (PFMS).",
        "keywords": ["water", "drinking", "tap", "jjm", "jal", "fhtc", "pipe", "borewell", "tank", "potable", "shortage", "har ghar jal", "water supply"]
    },
    "CSS-PMGSY-002": {
        "scheme_id": "CSS-PMGSY-002",
        "scheme_name": "Pradhan Mantri Gram Sadak Yojana (PMGSY - Phase III)",
        "ministry": "Ministry of Rural Development",
        "category": "Roads & Infrastructure",
        "official_portal_url": "https://pmgsygov.dord.gov.in/",
        "nodal_agency": "National Rural Infrastructure Development Agency (NRIDA) & State Rural Roads Development Agency (SRRDA)",
        "purpose": "Provide all-weather single asphalt/bitumen road connectivity to eligible unconnected rural habitations and consolidate existing rural road network.",
        "why_relevant_template": "Essential for villages with unpaved mud tracks, seasonal monsoon cutoff, or deficit against the 1.25 km/1,000 population benchmark.",
        "eligibility_criteria": "Habitations with population 500+ in plain areas (250+ in North-East, desert, tribal, and hill states). Phase III also covers major rural links connecting Gram Panchayats to Agricultural Markets (GrAMs), hospitals, and higher secondary schools.",
        "key_benefits": [
            "100% centrally sponsored blacktopped all-weather bitumen road infrastructure.",
            "Reinforced concrete cross-drainage culverts and bridge structures.",
            "5-year mandatory maintenance contract included in Detailed Project Report (DPR).",
            "Geo-tagged road inspection via OMMAS and Meri Sadak mobile portal."
        ],
        "required_documents": [
            "District Rural Road Plan (DRRP) alignment map",
            "Gram Panchayat resolution requesting road sanction",
            "Land availability / NOC certificate from local landholders (no land acquisition needed)",
            "Habitation population census verification certificate"
        ],
        "application_process": "1. Block/Panchayat identifies road in Comprehensive New Connectivity Priority List (CNCPL). 2. Executive Engineer prepares DPR. 3. State Technical Agency (STA) vets proposal. 4. Ministry of Rural Development sanctions funds via Central Road Fund.",
        "keywords": ["road", "pmgsy", "bitumen", "paved", "transport", "connectivity", "bridge", "culvert", "asphalt", "unpaved", "mud road", "highway", "commute"]
    },
    "CSS-ABHWC-003": {
        "scheme_id": "CSS-ABHWC-003",
        "scheme_name": "Ayushman Bharat - Health & Wellness Centres (NHM / AB-HWC)",
        "ministry": "Ministry of Health and Family Welfare",
        "category": "Healthcare",
        "official_portal_url": "https://nhm.gov.in/",
        "nodal_agency": "National Health Mission (NHM) & State Health Society",
        "purpose": "Deliver Comprehensive Primary Health Care (CPHC) closer to rural homes by transforming sub-health centres and primary health centres into modern Health & Wellness Centres.",
        "why_relevant_template": "Critical for villages lacking primary diagnostics, maternal care, or facing long distances to nearest Community Health Centre (CHC).",
        "eligibility_criteria": "Rural habitations under IPHS standard (1 Sub-Centre per 5,000 population in plains / 3,000 in hills; 1 PHC per 30,000 population). Ayushman card coverage is open to SECC eligible families and elderly citizens aged 70+.",
        "key_benefits": [
            "Free essential drugs (172+ formulations) and free diagnostic tests (63+ pathology/biochemistry tests).",
            "Tele-consultation via eSanjeevani portal connecting rural patients to specialist doctors.",
            "Maternal, neonatal, and child health care and universal immunization.",
            "Cashless secondary and tertiary hospitalization cover up to ₹5 Lakhs/family/year under PM-JAY."
        ],
        "required_documents": [
            "Aadhaar Card of family members",
            "Ration Card / SECC 2011 status verification",
            "Gram Panchayat baseline health infrastructure report",
            "Mobile number linked with Aadhaar for PM-JAY card generation"
        ],
        "application_process": "1. Visit nearest Gram Panchayat AB-HWC or Common Service Centre (CSC). 2. E-KYC verification using Aadhaar/Ration card. 3. Instant generation of Ayushman PVC Health Card. 4. Free services available at all empaneled public and private hospitals.",
        "keywords": ["health", "hospital", "phc", "doctor", "clinic", "ayushman", "nhm", "medicine", "wellness", "medical", "treatment", "maternal", "disease", "healthcare"]
    },
    "CSS-PMSHRI-004": {
        "scheme_id": "CSS-PMSHRI-004",
        "scheme_name": "PM SHRI Scheme & Samagra Shiksha Abhiyan",
        "ministry": "Ministry of Education",
        "category": "Education",
        "official_portal_url": "https://education.gov.in/",
        "nodal_agency": "Department of School Education and Literacy & State Project Directorate (SSA)",
        "purpose": "Upgrade existing elementary and secondary schools into model institutions with smart classrooms, STEM labs, eco-friendly infrastructure, and NEP 2020 pedagogy.",
        "why_relevant_template": "Suited for rural schools requiring classroom expansion to meet the 1:30 pupil-teacher ratio, smart boards, drinking water, or separate sanitation units.",
        "eligibility_criteria": "Existing government and local body schools (Elementary, Secondary, Higher Secondary) meeting minimum enrollment and land benchmarks under RTE Act.",
        "key_benefits": [
            "Construction of modern digital classrooms, science laboratories, and ICT computer labs.",
            "Solar power backup panels and rainwater harvesting structures on school premises.",
            "Free uniforms, textbooks, and midday meals (PM POSHAN) for enrolled pupils.",
            "Special coaching, vocational training, and inclusive facilities for Children with Special Needs (CwSN)."
        ],
        "required_documents": [
            "UDISE+ School Code and verified student enrollment data",
            "School Management Committee (SMC) resolution",
            "Infrastructure gap appraisal signed by Block Education Officer (BEO)",
            "Panchayat land possession / building safety certificate"
        ],
        "application_process": "1. School Management Committee applies through PM SHRI online national portal. 2. Challenge-based selection assessed by State Committee. 3. Direct benefit grant transferred to School Development Fund.",
        "keywords": ["school", "education", "classroom", "student", "teacher", "pupil", "pm shri", "samagra shiksha", "smart class", "books", "laboratory", "rte", "study"]
    },
    "CSS-SBMG-005": {
        "scheme_id": "CSS-SBMG-005",
        "scheme_name": "Swachh Bharat Mission - Gramin (SBM-G Phase II)",
        "ministry": "Ministry of Jal Shakti (Department of Drinking Water and Sanitation)",
        "category": "Sanitation",
        "official_portal_url": "https://sbm.gov.in/",
        "nodal_agency": "District Swachhata Mission & Gram Panchayat",
        "purpose": "Sustain Open Defecation Free (ODF) status and achieve ODF Plus Model Village status through universal Solid and Liquid Waste Management (SLWM).",
        "why_relevant_template": "Essential for villages facing open drain overflows, plastic litter, lack of community toilets, or needing greywater soak pits and biogas plants.",
        "eligibility_criteria": "All Gram Panchayats and rural habitations. Individual Household Latrine (IHHL) incentive available for BPL and identified APL rural households.",
        "key_benefits": [
            "Individual Household Latrine (IHHL) financial incentive of ₹12,000 per eligible household.",
            "Construction of Community Sanitary Complexes (CSC) funded up to ₹3.00 Lakhs per Gram Panchayat.",
            "Solid and Liquid Waste Management (SLWM) funding up to ₹16-20 Lakhs based on GP population.",
            "GOBAR-dhan (Galvanizing Organic Bio-Agro Resources Dhan) community biogas plants."
        ],
        "required_documents": [
            "Aadhaar Card and Bank Passbook of beneficiary (for IHHL incentive)",
            "Gram Sabha resolution for SLWM Detailed Project Report",
            "Land identification certificate for Community Waste Processing Unit / Soak Pits",
            "ODF verification declaration by Panchayat Secretary"
        ],
        "application_process": "1. For IHHL: Apply online at sbm.gov.in or through Gram Panchayat VDO. 2. Geo-tagged photo of completed toilet uploaded. 3. Direct Benefit Transfer (DBT) of ₹12,000 credited to bank account. 4. For GP SLWM: DPR submitted by Panchayat to District Collector.",
        "keywords": ["sanitation", "toilet", "waste", "garbage", "drainage", "soak pit", "odf", "swachh bharat", "sbm", "cleaning", "latrine", "ihhl", "plastic", "gobar"]
    },
    "CSS-AMRIT-006": {
        "scheme_id": "CSS-AMRIT-006",
        "scheme_name": "Mission Amrit Sarovar & DISHA Water Rejuvenation",
        "ministry": "Ministry of Jal Shakti & Ministry of Rural Development",
        "category": "Water Resources",
        "official_portal_url": "https://disha.gov.in/",
        "nodal_agency": "District Collectorate & MGNREGA / Jal Shakti Implementation Cell",
        "purpose": "Develop and rejuvenate at least 75 water bodies (Amrit Sarovars) in each rural district to harvest rainwater, recharge groundwater aquifers, and create community assets.",
        "why_relevant_template": "Ideal for Gram Panchayats with dried ponds, falling groundwater tables, silted village lakes (oorani), or recurring summer droughts.",
        "eligibility_criteria": "Every rural district in India with identified water bodies having minimum pond area of 1 acre (approx 0.4 hectare) and water holding capacity of 10,000 cubic meters.",
        "key_benefits": [
            "Comprehensive desilting, deepening, and bund reinforcement of traditional village water tanks.",
            "Construction of inlet/outlet siltation chambers, walking tracks, and neem/peepal tree plantations.",
            "Recharges surrounding agricultural borewells and guarantees livestock drinking water.",
            "Integrated funding convergence with MGNREGA, 15th FC Grants, and CSR partnerships."
        ],
        "required_documents": [
            "Revenue record / survey number of water body",
            "Gram Sabha approval for pond site rejuvenation",
            "Technical estimate prepared by Block Assistant Engineer (MGNREGA)",
            "GIS Geo-tagging demarcation map"
        ],
        "application_process": "1. Panchayat identifies silted pond and passes Gram Sabha resolution. 2. Site surveyed and added to Amrit Sarovar portal. 3. Work executed through MGNREGA muster rolls and machinery support. 4. Flag hoisting and community ownership on national holidays.",
        "keywords": ["pond", "lake", "amrit sarovar", "water body", "desilting", "groundwater", "recharge", "check dam", "rainwater", "harvesting", "oorani", "drought"]
    },
    "CSS-PMAYG-007": {
        "scheme_id": "CSS-PMAYG-007",
        "scheme_name": "Pradhan Mantri Awaas Yojana - Gramin (PMAY-G)",
        "ministry": "Ministry of Rural Development",
        "category": "Housing & Infrastructure",
        "official_portal_url": "https://pmayg.nic.in/",
        "nodal_agency": "State Rural Housing Mission & District Rural Development Agency (DRDA)",
        "purpose": "Provide pucca disaster-resilient houses with basic amenities (potable water, hygienic toilet, electricity, LPG) to all houseless and dilapidated kutcha house dwellers in rural areas.",
        "why_relevant_template": "Directly targets rural families living in kutcha thatch/mud houses, vulnerable to monsoons, storms, and lack of secure shelter.",
        "eligibility_criteria": "Houseless families and households living in zero, one, or two-room houses with kutcha wall and kutcha roof, selected strictly through SECC 2011 list and Awaas+ survey validated by Gram Sabha.",
        "key_benefits": [
            "Financial grant of ₹1.20 Lakhs (plain areas) / ₹1.30 Lakhs (hilly, difficult, tribal, and IAP areas) in 3 installments.",
            "90 to 95 days of unskilled wage labor support (~₹24,000) under MGNREGA.",
            "Additional ₹12,000 assistance for toilet construction via Swachh Bharat Mission (SBM-G).",
            "Electricity connection via Saubhagya, LPG connection via PM Ujjwala, and tap water via JJM."
        ],
        "required_documents": [
            "Aadhaar Card of applicant and spouse",
            "Bank Passbook linked with Aadhaar (DBT enabled)",
            "Awaas+ / SECC 2011 registration number",
            "Land ownership patta or Panchayat land possession certificate",
            "Affidavit declaring not owning any pucca house in India"
        ],
        "application_process": "1. Beneficiary name verified on Gram Panchayat Awaas+ priority list. 2. Panchayat Secretary / VDO inspects site and uploads geo-tagged photo of existing kutcha house via AwaasApp. 3. Administrative sanction issued by BDO. 4. Installments credited directly into beneficiary bank account at plinth, lintel, and roof stages.",
        "keywords": ["housing", "house", "pmay", "pmay-g", "pucca", "shelter", "home", "kutcha", "roof", "accommodation", "homeless", "awaas", "dwelling"]
    },
    "CSS-KUSUM-008": {
        "scheme_id": "CSS-KUSUM-008",
        "scheme_name": "PM-KUSUM (Pradhan Mantri Kisan Urja Suraksha evam Utthaan Mahabhiyan)",
        "ministry": "Ministry of New and Renewable Energy (MNRE)",
        "category": "Renewable Energy & Agriculture",
        "official_portal_url": "https://pmkusum.mnre.gov.in/",
        "nodal_agency": "State Renewable Energy Development Agency (SREDA) & DISCOM",
        "purpose": "Provide energy security and financial independence to rural farmers by installing standalone solar irrigation pumps and solarizing existing grid-connected agriculture pumps.",
        "why_relevant_template": "Ideal for farming areas with frequent electricity load shedding, high diesel pump fuel expenses, or farmlands located off the electrical grid.",
        "eligibility_criteria": "Individual farmers, groups of farmers, Water User Associations (WUAs), Primary Agriculture Credit Societies (PACS), and Farmer Producer Organizations (FPOs).",
        "key_benefits": [
            "Up to 60% total subsidy (30% Central Government + 30% State Government) on solar water pumps.",
            "Farmer contributes only 10% upfront; remaining 30% available via low-interest bank loan.",
            "Daytime reliable solar power for uninterrupted crop irrigation without diesel expenses.",
            "Option to sell surplus solar power back to the electricity DISCOM grid for extra farm income."
        ],
        "required_documents": [
            "Aadhaar card of farmer applicant",
            "Land revenue records (7/12 extract, Khasra/Khatauni, or Patta)",
            "Bank account passbook with IFSC code",
            "Certificate of existing borewell / water source availability"
        ],
        "application_process": "1. Register on the official State Renewable Energy Development Agency (e.g., TEDA, MSEDCL, UPNEDA) PM-KUSUM portal. 2. Select pump horsepower (HP) capacity (3 HP, 5 HP, 7.5 HP). 3. Deposit 10% farmer share. 4. Vendor installs solar panels and pump within 45 days with 5-year warranty.",
        "keywords": ["solar", "pump", "kusum", "energy", "irrigation", "electricity", "diesel", "green energy", "renewable", "feeder", "farmer", "agriculture power"]
    },
    "CSS-MGNREGS-009": {
        "scheme_id": "CSS-MGNREGS-009",
        "scheme_name": "Mahatma Gandhi National Rural Employment Guarantee Scheme (MGNREGS)",
        "ministry": "Ministry of Rural Development",
        "category": "Rural Employment & Assets",
        "official_portal_url": "https://nrega.nic.in/",
        "nodal_agency": "Gram Panchayat & Block Development Office (Programme Officer)",
        "purpose": "Enhance livelihood security in rural areas by providing at least 100 days of guaranteed wage employment in a financial year to every household whose adult members volunteer to do unskilled manual work.",
        "why_relevant_template": "Critical for unorganized rural laborers, landless families, small farmers needing soil/water conservation works, or during agricultural off-seasons.",
        "eligibility_criteria": "All rural citizens aged 18 years and above residing in the Gram Panchayat area who volunteer for unskilled manual labor.",
        "key_benefits": [
            "Guaranteed 100 days of paid wage employment per household per financial year (up to 150 days in drought areas).",
            "Direct Benefit Transfer (DBT) statutory daily wage credited within 15 days via Aadhaar-Based Payment System (ABPS).",
            "Unemployment allowance payable if work is not allotted within 15 days of demand.",
            "Permissible individual asset works: cattle sheds, goat shelters, farm ponds, and horticulture on SC/ST/marginal farmer land."
        ],
        "required_documents": [
            "Aadhaar Card of adult household members",
            "Passport size photographs",
            "Bank / Post Office savings account passbook",
            "Job Card application form submitted to Gram Panchayat"
        ],
        "application_process": "1. Submit Job Card application to Gram Panchayat office. 2. Free Job Card issued within 15 days. 3. Submit work demand slip (Form 4). 4. Work allocated on local public asset projects within 5 km radius. 5. Wages credited directly to bank account weekly/bi-weekly.",
        "keywords": ["employment", "job", "mgnrega", "nrega", "wage", "labor", "unskilled", "job card", "work", "livelihood", "laborer", "asset creation", "cattle shed"]
    },
    "CSS-PMKISAN-010": {
        "scheme_id": "CSS-PMKISAN-010",
        "scheme_name": "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
        "ministry": "Ministry of Agriculture and Farmers Welfare",
        "category": "Agriculture & Farmer Welfare",
        "official_portal_url": "https://pmkisan.gov.in/",
        "nodal_agency": "Department of Agriculture & State Revenue Department",
        "purpose": "Provide income support to all landholding farmer families across the country to enable them to take care of expenses related to agriculture and domestic needs.",
        "why_relevant_template": "Directly supports small, marginal, and tenant farmers requiring upfront capital for seeds, fertilizers, tractor tilling, and harvest expenses.",
        "eligibility_criteria": "All landholding farmer families with cultivable landholding in their names. (Exclusions apply to institutional landholders, income-tax payers, and constitutional post holders).",
        "key_benefits": [
            "Direct financial benefit of ₹6,000 per year transferred in three equal 4-monthly installments of ₹2,000 each.",
            "100% centrally funded Direct Benefit Transfer (DBT) directly into farmer's bank account.",
            "Automatic integration with Kisan Credit Card (KCC) for concessional 4% interest crop loans.",
            "Linked with Pradhan Mantri Fasal Bima Yojana (PMFBY) for comprehensive crop loss protection."
        ],
        "required_documents": [
            "Aadhaar Card (e-KYC mandatory via OTP or biometric face authentication)",
            "Land ownership documents (RoR / Khasra-Khatauni / Patta)",
            "Active DBT-enabled bank account number with IFSC",
            "Self-declaration of non-exclusion criteria"
        ],
        "application_process": "1. Self-register on pmkisan.gov.in (Farmers Corner -> New Farmer Registration) or visit CSC. 2. Complete Aadhaar OTP / Biometric e-KYC. 3. State Agriculture Department verifies land records. 4. DBT installments transferred automatically every 4 months.",
        "keywords": ["farmer", "agriculture", "kisan", "pm kisan", "crop", "fertilizer", "seed", "cultivation", "income", "subsidy", "farm", "kcc", "farming"]
    },
    "CSS-DAYNRLM-011": {
        "scheme_id": "CSS-DAYNRLM-011",
        "scheme_name": "Deendayal Antyodaya Yojana - National Rural Livelihoods Mission (DAY-NRLM / Aajeevika)",
        "ministry": "Ministry of Rural Development",
        "category": "Livelihoods & Women Empowerment",
        "official_portal_url": "https://nrlm.gov.in/",
        "nodal_agency": "State Rural Livelihoods Mission (SRLM) & District Mission Management Unit",
        "purpose": "Alleviate rural poverty by promoting Self Help Groups (SHGs) of rural women, providing revolving funds, capital subsidies, micro-enterprise training, and bank linkage.",
        "why_relevant_template": "Ideal for rural women seeking group entrepreneurship, micro-credit loans without collateral, dairy, poultry, handicraft, or small village enterprises.",
        "eligibility_criteria": "Rural women from vulnerable households (SC, ST, single women, disabled, landless laborers) organized into Self Help Groups of 10-20 members.",
        "key_benefits": [
            "Revolving Fund (RF) of ₹20,000 to ₹30,000 per eligible SHG.",
            "Community Investment Fund (CIF) up to ₹1.50 Lakhs for group enterprise startup.",
            "Collateral-free bank loans up to ₹10-20 Lakhs with interest subvention down to 7% per annum.",
            "Skill training under RSETI and market linkage through SARAS Melas and Lakhpati Didi initiative."
        ],
        "required_documents": [
            "SHG formation resolution & register of members",
            "Aadhaar cards and bank passbooks of all SHG members",
            "SHG savings bank account passbook",
            "Panchayat / VDO certification of SHG functioning"
        ],
        "application_process": "1. Form a village SHG of 10-20 women with help of Community Resource Person (CRP). 2. Open group bank account. 3. Follow Panchasutra principles (regular meetings, savings, internal lending, timely repayment, book-keeping). 4. Apply for Revolving Fund & Bank Credit Linkage via SRLM block office.",
        "keywords": ["women", "shg", "self help group", "nrlm", "livelihood", "loan", "entrepreneur", "handicraft", "dairy", "poultry", "micro finance", "lakhpati didi", "business"]
    }
}


class SchemeAssistantEngine:
    """
    Dedicated AI Conversational & RAG Retrieval Engine for Government Schemes.
    Combines semantic vector matching, keyword intent classification, village location grounding,
    and LLM synthesis with strict anti-hallucination rules.
    """

    def __init__(self):
        self.gemini_api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        self.schemes_catalog = DETAILED_SCHEME_KNOWLEDGE

    def _classify_intent_and_retrieve_schemes(
        self,
        query: str,
        location: Optional[Dict[str, Any]] = None,
        top_k: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Retrieves matching official government schemes based on query semantics, keywords,
        and location deficits.
        """
        query_lower = query.lower()
        query_vec = _compute_dense_vector(query_lower)

        scored_schemes = []

        for scheme_id, scheme in self.schemes_catalog.items():
            # 1. Semantic vector similarity
            scheme_text = (
                f"{scheme['scheme_name']} {scheme['category']} {scheme['ministry']} "
                f"{scheme['purpose']} {scheme['eligibility_criteria']} "
                f"{' '.join(scheme.get('keywords', []))}"
            )
            scheme_vec = _compute_dense_vector(scheme_text)
            sim = _cosine_similarity(query_vec, scheme_vec)

            # 2. Keyword trigger scoring
            kw_matches = sum(1 for kw in scheme.get("keywords", []) if kw in query_lower)
            kw_boost = min(0.35, kw_matches * 0.08)

            # 3. Direct scheme acronym match
            if scheme_id.lower() in query_lower or any(part.lower() in query_lower for part in scheme["scheme_name"].split() if len(part) >= 3):
                kw_boost += 0.25

            total_score = min(0.99, max(0.40, sim + kw_boost))

            scored_schemes.append({
                "scheme": scheme,
                "score": total_score,
                "kw_matches": kw_matches,
            })

        # Sort by total score descending
        scored_schemes.sort(key=lambda x: (x["kw_matches"] > 0, x["score"]), reverse=True)

        results = []
        for item in scored_schemes[:top_k]:
            s = item["scheme"].copy()
            s["match_score"] = round(item["score"], 3)
            s["match_percentage"] = round(item["score"] * 100, 1)
            results.append(s)

        return results

    def _build_grounded_system_prompt(
        self,
        retrieved_schemes: List[Dict[str, Any]],
        location: Dict[str, Any],
        user_message: str,
    ) -> str:
        """Constructs a strict grounding system prompt with exact retrieved scheme facts."""
        gp_name = location.get("gp_name", "your Gram Panchayat")
        district = location.get("district", "District")
        state = location.get("state", "State")
        pop = location.get("population", 5000)

        schemes_context = ""
        for idx, s in enumerate(retrieved_schemes, start=1):
            benefits_str = "\n".join(f"    - {b}" for b in s.get("key_benefits", []))
            docs_str = "\n".join(f"    - {d}" for d in s.get("required_documents", []))
            schemes_context += f"""
[RETRIEVED SCHEME #{idx}]
Scheme Name: {s.get('scheme_name')}
Scheme ID: {s.get('scheme_id')}
Ministry: {s.get('ministry')}
Category: {s.get('category')}
Official Portal: {s.get('official_portal_url')}
Nodal Agency: {s.get('nodal_agency')}
Purpose: {s.get('purpose')}
Eligibility Benchmark: {s.get('eligibility_criteria')}
Key Benefits:
{benefits_str}
Required Documents:
{docs_str}
Application Process: {s.get('application_process')}
"""

        prompt = f"""You are the official "Suitable Government Schemes" AI Assistant for GramPulse AI, under the Ministry of Panchayati Raj, Government of India.
Your mission is to help Indian citizens, Sarpanches, and Panchayat Secretaries discover, understand, and apply for verified Government of India welfare schemes.

ACTIVE LOCATION PROFILE:
- Gram Panchayat: {gp_name}
- District: {district}
- State: {state}
- Population: {pop:,}

STRICT GROUNDING & BEHAVIORAL RULES:
1. Base your answer ONLY on the retrieved government scheme information provided below.
2. DO NOT invent, hallucinate, or assume any fake scheme, eligibility condition, or financial subsidy.
3. If the user asks about a topic covered by a scheme below, explain the specific scheme clearly with:
   - Scheme Name & Implementing Ministry
   - Purpose & Why it is relevant to {gp_name}
   - Eligibility Criteria
   - Benefits
   - Required Documents & How to Apply
   - Official Government Portal URL
4. Always clearly distinguish "potentially suitable based on requirements" from "confirmed eligible by authorities".
5. End with the official disclaimer: "Note: Final eligibility and approval depend on applicable government guidelines and local authority verification."
6. Use clean Markdown formatting with clear bullet points, emojis, and bold headers.

RETRIEVED OFFICIAL GOVERNMENT SCHEMES KNOWLEDGE:
{schemes_context}
"""
        return prompt

    async def generate_scheme_advisory(
        self,
        user_message: str,
        location: Optional[Dict[str, Any]] = None,
        chat_history: Optional[List[Dict[str, str]]] = None,
    ) -> Dict[str, Any]:
        """
        Executes scheme retrieval and synthesis, delivering grounded scheme recommendations.
        """
        loc = location or {}
        retrieved = self._classify_intent_and_retrieve_schemes(user_message, location=loc, top_k=3)

        # 1. Attempt LLM generation if Gemini API key is configured
        if self.gemini_api_key:
            try:
                from google import genai
                client = genai.Client(api_key=self.gemini_api_key)
                system_prompt = self._build_grounded_system_prompt(retrieved, loc, user_message)

                contents = f"{system_prompt}\n\nUser Question: {user_message}"
                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=contents,
                )
                if response and response.text:
                    return {
                        "reply": response.text,
                        "schemes": retrieved,
                        "provider": "google-gemini",
                        "model": "gemini-2.5-flash",
                        "timestamp": datetime.now().isoformat(),
                    }
            except Exception as e:
                logger.warning(f"Gemini scheme assistant call failed: {e}; using deterministic synthesizer.")

        # 2. Context-Aware Grounded Synthesizer Fallback
        reply = self._synthesize_grounded_scheme_reply(user_message, loc, retrieved)
        return {
            "reply": reply,
            "schemes": retrieved,
            "provider": "grampulse-scheme-rag-synthesizer",
            "model": "scheme-rag-v2",
            "timestamp": datetime.now().isoformat(),
        }

    def _synthesize_grounded_scheme_reply(
        self,
        user_message: str,
        location: Dict[str, Any],
        schemes: List[Dict[str, Any]],
    ) -> str:
        """
        Generates a rich, highly structured, verified Markdown answer from retrieved schemes.
        """
        gp_name = location.get("gp_name", "your Gram Panchayat")
        district = location.get("district", "District")
        state = location.get("state", "State")

        if not schemes:
            return (
                f"Namaste! 🙏 I searched the official Indian Government scheme repository for **{gp_name}** ({district}, {state}), "
                f"but could not find an exact scheme match for your specific query: *\"{user_message}\"*.\n\n"
                f"**Available Central & State Scheme Domains:**\n"
                f"• 💧 **Drinking Water:** Jal Jeevan Mission (JJM)\n"
                f"• 🏠 **Housing:** Pradhan Mantri Awaas Yojana - Gramin (PMAY-G)\n"
                f"• 🌾 **Agriculture:** PM-KISAN & PM-KUSUM Solar Pumps\n"
                f"• 🛣️ **Roads:** Pradhan Mantri Gram Sadak Yojana (PMGSY)\n"
                f"• 🏥 **Healthcare:** Ayushman Bharat / National Health Mission\n"
                f"• 🎓 **Education:** PM SHRI & Samagra Shiksha\n"
                f"• ♻️ **Sanitation:** Swachh Bharat Mission - Gramin (SBM-G)\n"
                f"• 💼 **Rural Employment:** MGNREGS & DAY-NRLM\n\n"
                f"Please select one of the quick categories or ask about any of these programs!"
            )

        primary = schemes[0]
        category = primary.get("category", "Government Welfare")
        name = primary.get("scheme_name", "Government Scheme")
        ministry = primary.get("ministry", "Government of India")
        url = primary.get("official_portal_url", "https://rural.gov.in/")

        # Identify category icon
        icons = {
            "Water Supply": "💧",
            "Water Resources": "🌊",
            "Roads & Infrastructure": "🛣️",
            "Healthcare": "🏥",
            "Education": "🎓",
            "Sanitation": "♻️",
            "Housing & Infrastructure": "🏠",
            "Renewable Energy & Agriculture": "☀️",
            "Renewable Energy": "☀️",
            "Rural Employment & Assets": "💼",
            "Agriculture & Farmer Welfare": "🌾",
            "Livelihoods & Women Empowerment": "👩‍🌾",
        }
        icon = icons.get(category, "🏛️")

        benefits_text = "\n".join(f"• {b}" for b in primary.get("key_benefits", [])[:4])
        docs_text = "\n".join(f"• {d}" for d in primary.get("required_documents", [])[:4])

        sections = []
        sections.append(
            f"Based on your query regarding **{category.lower()}** for **{gp_name}** ({district}, {state}), "
            f"the following official scheme is suitable:\n\n"
            f"### {icon} {name}\n"
            f"**Implementing Ministry:** {ministry}\n"
            f"**Nodal Agency:** {primary.get('nodal_agency', 'District & Panchayat Administration')}\n\n"
            f"#### 🎯 Purpose\n{primary.get('purpose')}\n\n"
            f"#### 📍 Why it is Relevant to {gp_name}\n"
            f"{primary.get('why_relevant_template', 'Meets the infrastructure requirement and development priorities of the village.')}\n\n"
            f"#### 📋 Eligibility & Benchmark Conditions\n{primary.get('eligibility_criteria')}\n\n"
            f"#### 🎁 Key Benefits\n{benefits_text}\n\n"
            f"#### 📑 Required Documents\n{docs_text}\n\n"
            f"#### 🚀 How to Apply\n{primary.get('application_process')}\n\n"
            f"#### 🌐 Official Government Portal\n[{url}]({url})\n\n"
            f"> [!NOTE]\n"
            f"> **Advisory Note:** Final eligibility, sanction, and subsidy disbursement depend on verified enrollment in the official state/central portal and approval by the competent local authority / Gram Sabha."
        )

        # If there is a secondary scheme that is also relevant, add a brief mention
        if len(schemes) > 1 and schemes[1].get("match_percentage", 0) >= 60:
            sec = schemes[1]
            sec_icon = icons.get(sec.get("category", ""), "📌")
            sections.append(
                f"\n\n---\n### 💡 Also Relevant: {sec_icon} {sec.get('scheme_name')}\n"
                f"**Category:** {sec.get('category')} | **Ministry:** {sec.get('ministry')}\n"
                f"{sec.get('purpose')}\n"
                f"🔗 **Official Link:** [{sec.get('official_portal_url')}]({sec.get('official_portal_url')})"
            )

        return "".join(sections)


# Singleton instance
scheme_assistant_engine = SchemeAssistantEngine()
