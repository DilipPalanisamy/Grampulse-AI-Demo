import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Format helper for numbers
 */
function formatNum(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '0';
  }
  return Number(value).toLocaleString('en-IN');
}

/**
 * Format helper for percentages
 */
function formatPct(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '0%';
  }
  return `${Number(value).toFixed(1)}%`;
}

/**
 * Generates a colorful, high-fidelity PDF forecast report for GramPulse AI Future Prediction.
 *
 * @param {Object} options
 * @param {Object} options.predictionData - The full prediction payload from futurePredictorApi
 * @param {string|number} [options.targetYear='all'] - 'all' or a specific year (e.g. 2027)
 * @param {string} [options.villageName] - Village / GP Name fallback
 * @param {string} [options.district] - District fallback
 * @param {string} [options.state] - State fallback
 */
export function generatePredictionPdf({
  predictionData,
  targetYear = 'all',
  villageName = '',
  district = '',
  state = '',
}) {
  if (!predictionData) {
    console.error('generatePredictionPdf: predictionData is required');
    return;
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182 mm

  // Extract core prediction metrics
  const gpName =
    predictionData.village ||
    villageName ||
    predictionData?.predictions?.village_name ||
    'Gram Panchayat';
  const dist = predictionData.district || district || 'District';
  const st = predictionData.state || state || 'India';

  const summary = predictionData?.predictions?.summary || {};
  const years = predictionData?.predictions?.years || [];
  const baseYear = summary.base_year || 2026;
  const basePop = summary.base_population || years[0]?.population || 5800;

  const isSpecificYear = targetYear !== 'all' && targetYear !== null && targetYear !== undefined;
  const selectedYearNum = isSpecificYear ? Number(targetYear) : null;
  const activeYearData = isSpecificYear
    ? years.find((y) => Number(y.year) === selectedYearNum) || years[0]
    : years[years.length - 1] || {};

  const currentUdise = predictionData?.current_udise || {};
  const reportDateStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const reportTimeStr = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  let currentY = 0;

  // =========================================================================
  // 1. TOP HEADER BANNER (Deep Emerald-Teal with Gold Accent)
  // =========================================================================
  doc.setFillColor(13, 78, 64); // Dark Teal
  doc.rect(0, 0, pageWidth, 26, 'F');

  // Gold accent bar
  doc.setFillColor(234, 179, 8); // Amber/Gold
  doc.rect(0, 26, pageWidth, 1.5, 'F');

  // Branding top line
  doc.setTextColor(167, 243, 208); // Light emerald
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('GRAMPULSE AI  •  MINISTRY OF PANCHAYATI RAJ & UDISE+ CALIBRATED', margin, 9);

  // Main Report Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14.5);
  doc.text(
    isSpecificYear
      ? `YEAR ${selectedYearNum} FUTURE PREDICTION & DEFICIT FORECAST`
      : '5-YEAR VILLAGE DEVELOPMENT & DEFICIT FORECAST REPORT',
    margin,
    18
  );

  // Subtitle / Horizon Badge on Right
  doc.setTextColor(220, 252, 231);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(
    isSpecificYear
      ? `Target Year: ${selectedYearNum} (Base: ${baseYear})`
      : `Planning Horizon: ${baseYear + 1} – ${baseYear + 5} (5-Year Model)`,
    pageWidth - margin,
    18,
    { align: 'right' }
  );

  currentY = 33;

  // =========================================================================
  // 2. HABITATION TELEMETRY CARD (Soft Gray/Green with Border)
  // =========================================================================
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(203, 213, 225); // Slate 300
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, currentY, contentWidth, 23, 2.5, 2.5, 'FD');

  // Left side: Village and Location
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`${gpName} Gram Panchayat`, margin + 4, currentY + 7);

  doc.setTextColor(71, 85, 105); // Slate 600
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`${dist} District, ${st}  |  Official Habitation Telemetry`, margin + 4, currentY + 13);
  doc.text(
    `Base Year: ${baseYear} (${formatNum(basePop)} residents)  •  UDISE+ Benchmarked`,
    margin + 4,
    currentY + 18.5
  );

  // Right side: Report metadata badge
  doc.setFillColor(16, 185, 129, 0.12);
  doc.setDrawColor(16, 185, 129);
  doc.roundedRect(pageWidth - margin - 58, currentY + 3.5, 54, 16, 2, 2, 'FD');

  doc.setTextColor(5, 150, 105);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('OFFICIAL GPDP TELEMETRY', pageWidth - margin - 31, currentY + 8.5, { align: 'center' });

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`Generated: ${reportDateStr} • ${reportTimeStr}`, pageWidth - margin - 31, currentY + 14, {
    align: 'center',
  });

  currentY += 28;

  // =========================================================================
  // 3. EXECUTIVE COLOR KPI CARDS (4 Color-Coded Metrics)
  // =========================================================================
  const cardW = (contentWidth - 9) / 4; // 4 cards with 3mm gaps
  const cardH = 22;

  const targetPopVal = isSpecificYear ? activeYearData.population : summary.final_population || activeYearData.population;
  const growthPctVal = isSpecificYear
    ? (((targetPopVal - basePop) / basePop) * 100).toFixed(1)
    : summary.population_change_percent || 10.7;
  const devScoreVal = activeYearData?.development?.development_score ?? 84.5;
  const waterDemandVal = activeYearData?.water?.daily_demand_liters || 0;
  const schoolsVal = activeYearData?.education?.required_schools || 1;
  const classroomsVal =
    activeYearData?.real_udise_education?.future_need?.required_classrooms ||
    activeYearData?.real_udise_education?.future_need?.additional_classrooms_needed ||
    4;

  const kpis = [
    {
      title: 'PROJECTED POPULATION',
      val: formatNum(targetPopVal),
      sub: `+${growthPctVal}% vs Base`,
      bg: [236, 253, 245], // Emerald-50
      border: [16, 185, 129], // Emerald-500
      text: [6, 95, 70],
    },
    {
      title: 'GRAM DEV. INDEX (GDI)',
      val: `${formatPct(devScoreVal)}`,
      sub: devScoreVal >= 80 ? 'Optimal Growth' : 'Advancing Level',
      bg: [236, 254, 255], // Cyan-50
      border: [6, 182, 212], // Cyan-500
      text: [14, 116, 144],
    },
    {
      title: 'DAILY WATER DEMAND',
      val: `${formatNum(waterDemandVal)} L`,
      sub: `${formatPct(activeYearData?.water?.coverage_percent || 80)} Coverage`,
      bg: [239, 246, 255], // Blue-50
      border: [59, 130, 246], // Blue-500
      text: [29, 78, 216],
    },
    {
      title: 'REQUIRED EDUCATION',
      val: `${schoolsVal} Sch / ${classroomsVal} Clr`,
      sub: `${formatNum(activeYearData?.education?.school_students || 0)} Students`,
      bg: [254, 243, 199], // Amber-50
      border: [245, 158, 11], // Amber-500
      text: [180, 83, 9],
    },
  ];

  kpis.forEach((kpi, idx) => {
    const cardX = margin + idx * (cardW + 3);

    doc.setFillColor(kpi.bg[0], kpi.bg[1], kpi.bg[2]);
    doc.setDrawColor(kpi.border[0], kpi.border[1], kpi.border[2]);
    doc.setLineWidth(0.4);
    doc.roundedRect(cardX, currentY, cardW, cardH, 2, 2, 'FD');

    // Title
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.text(kpi.title, cardX + cardW / 2, currentY + 5.5, { align: 'center' });

    // Value
    doc.setTextColor(kpi.text[0], kpi.text[1], kpi.text[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text(kpi.val, cardX + cardW / 2, currentY + 12.5, { align: 'center' });

    // Subtext
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.text(kpi.sub, cardX + cardW / 2, currentY + 18, { align: 'center' });
  });

  currentY += cardH + 6;

  // =========================================================================
  // 4. TIMELINE PROJECTION TABLE (Full 5-Year Matrix with Color Rows)
  // =========================================================================
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('5-Year Multi-Sectoral Forecasting Matrix', margin, currentY);

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(
    'Comparative demographic growth, basic utility saturation, and infrastructure gap trajectory:',
    margin,
    currentY + 4
  );

  currentY += 6;

  const tableHead = [
    [
      'Year',
      'Population',
      'Households',
      'GDI Score',
      'Water Demand',
      'Water Saturation',
      'Students',
      'Classrooms',
      'Road Risk',
      'Grid Cov.',
    ],
  ];

  const tableBody = years.map((y) => {
    const isThisSelected = isSpecificYear && Number(y.year) === selectedYearNum;
    return [
      isThisSelected ? `>> ${y.year} (Yr ${y.year_number})` : `${y.year} (Yr ${y.year_number})`,
      formatNum(y.population),
      formatNum(y.households),
      formatPct(y?.development?.development_score),
      `${formatNum(y?.water?.daily_demand_liters)} L`,
      formatPct(y?.water?.coverage_percent),
      formatNum(y?.education?.school_students),
      `${y?.real_udise_education?.future_need?.required_classrooms || y?.education?.required_schools * 8 || 16}`,
      y?.road?.risk || 'Low',
      formatPct(y?.service_coverage?.electricity || 96),
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: tableHead,
    body: tableBody,
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: {
      fillColor: [15, 118, 110], // Emerald Teal
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center',
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 7.2,
      textColor: [30, 41, 59],
      cellPadding: 2,
      halign: 'center',
    },
    alternateRowStyles: {
      fillColor: [240, 253, 250], // Mint 50
    },
    didParseCell: (data) => {
      // Highlight the selected year row with bright mint/gold
      if (isSpecificYear && data.section === 'body') {
        const rowYear = years[data.row.index]?.year;
        if (Number(rowYear) === selectedYearNum) {
          data.cell.styles.fillColor = [254, 240, 138]; // Amber/Yellow highlight
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.textColor = [15, 23, 42];
        }
      }
    },
  });

  currentY = doc.lastAutoTable.finalY + 6;

  // =========================================================================
  // 5. DETAILED SECTORAL ANALYSIS CARDS (Water, Schools, Roads, Utilities)
  // =========================================================================
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(
    isSpecificYear
      ? `Deep-Dive Sector Deficit Breakdown (Year ${selectedYearNum})`
      : 'Key Infrastructure Deficit Pillars (Target Forecast Horizon)',
    margin,
    currentY
  );

  currentY += 4.5;

  const halfW = (contentWidth - 4) / 2;
  const pillarCardH = 34;

  // Row 1: Water & Education
  const waterData = activeYearData?.water || {};
  const eduData = activeYearData?.education || {};
  const futureEdu = activeYearData?.real_udise_education?.future_need || {};

  // Card 1: Water Security
  doc.setFillColor(240, 249, 255); // Sky 50
  doc.setDrawColor(56, 189, 248); // Sky 400
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, currentY, halfW, pillarCardH, 2, 2, 'FD');

  doc.setTextColor(3, 105, 161);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('POTABLE DRINKING WATER & JAL JEEVAN MISSION', margin + 3.5, currentY + 6);

  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(
    `• Daily Potable Water Demand: ${formatNum(waterData.daily_demand_liters || 0)} Liters/day`,
    margin + 3.5,
    currentY + 12
  );
  doc.text(
    `• Saturation Level: ${formatPct(waterData.coverage_percent || 0)} (${formatNum(waterData.covered_population || 0)} residents covered)`,
    margin + 3.5,
    currentY + 17
  );
  doc.text(
    `• Unserved Deficit Gap: ${formatPct(waterData.coverage_gap_percent || 0)} (${formatNum(waterData.uncovered_population || 0)} unserved)`,
    margin + 3.5,
    currentY + 22
  );
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(180, 83, 9);
  doc.text('• Sanction: JJM household tap connection extension & 1,00,000L OHT.', margin + 3.5, currentY + 28);

  // Card 2: Education & UDISE+
  const eduX = margin + halfW + 4;
  doc.setFillColor(240, 253, 244); // Green 50
  doc.setDrawColor(74, 222, 128); // Green 400
  doc.roundedRect(eduX, currentY, halfW, pillarCardH, 2, 2, 'FD');

  doc.setTextColor(21, 128, 61);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('EDUCATION INFRASTRUCTURE & UDISE+ BENCHMARKS', eduX + 3.5, currentY + 6);

  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(
    `• Student Cohort Enrollment: ${formatNum(eduData.school_students || 0)} children (Ages 6-14)`,
    eduX + 3.5,
    currentY + 12
  );
  doc.text(
    `• Required Schools (MoE Norms): ${eduData.required_schools || 1} Primary / Upper Primary`,
    eduX + 3.5,
    currentY + 17
  );
  doc.text(
    `• Total Functional Classrooms Required: ${futureEdu.required_classrooms || 16} Rooms`,
    eduX + 3.5,
    currentY + 22
  );
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 150, 105);
  doc.text(
    `• Deficit Sanction Needed: +${futureEdu.additional_classrooms_needed || 4} smart classrooms under PM SHRI.`,
    eduX + 3.5,
    currentY + 28
  );

  currentY += pillarCardH + 4;

  // Row 2: Road & Health/Grid
  const roadData = activeYearData?.road || {};
  const healthData = activeYearData?.healthcare || {};
  const serviceData = activeYearData?.service_coverage || {};

  // Card 3: Road Infrastructure
  doc.setFillColor(254, 242, 242); // Rose 50
  doc.setDrawColor(248, 113, 113); // Rose 400
  doc.roundedRect(margin, currentY, halfW, pillarCardH, 2, 2, 'FD');

  doc.setTextColor(190, 18, 60);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('ROAD NETWORK & PMGSY ALL-WEATHER STATUS', margin + 3.5, currentY + 6);

  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(
    `• Total Village Road Network: ${roadData.current_road_km || 25} km (Bitumen / Concrete)`,
    margin + 3.5,
    currentY + 12
  );
  doc.text(
    `• Time Since Major Repair: ${roadData.years_since_repair || 3} Years  |  Condition: ${roadData.condition || 'Average'}`,
    margin + 3.5,
    currentY + 17
  );
  doc.text(`• Road Deterioration Risk: ${roadData.risk || 'Low'} Priority Tier`, margin + 3.5, currentY + 22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(190, 18, 60);
  doc.text('• Action: Prioritize recarpeting and flood culverts under PMGSY Phase IV.', margin + 3.5, currentY + 28);

  // Card 4: Healthcare & Electricity Grid
  doc.setFillColor(250, 245, 255); // Purple 50
  doc.setDrawColor(192, 132, 252); // Purple 400
  doc.roundedRect(eduX, currentY, halfW, pillarCardH, 2, 2, 'FD');

  doc.setTextColor(126, 34, 206);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('HEALTHCARE & ENERGY GRID SATURATION', eduX + 3.5, currentY + 6);

  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(
    `• Projected Outpatient Load: ${formatNum(healthData.daily_hospital_demand || 110)} patient visits / day`,
    eduX + 3.5,
    currentY + 12
  );
  doc.text(
    `• Primary Health Infrastructure: ${healthData.primary_health_centers_needed || 1} PHC / Sub-Center`,
    eduX + 3.5,
    currentY + 17
  );
  doc.text(
    `• Grid Electricity: ${formatPct(serviceData.electricity || 96)}  |  Internet: ${formatPct(serviceData.internet || 55)}`,
    eduX + 3.5,
    currentY + 22
  );
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(107, 33, 168);
  doc.text('• Action: Upgrade Ayushman Arogya Mandir & PM-Surya Ghar rooftop solar.', eduX + 3.5, currentY + 28);

  currentY += pillarCardH + 6;

  // =========================================================================
  // 6. POLICY & GPDP ACTION PLAN (Government Scheme Recommendations)
  // =========================================================================
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Recommended GPDP Scheme Allocations', margin, currentY);

  currentY += 4.5;

  const schemeHead = [['Priority', 'Sector', 'Central / State Government Scheme', 'Key Action & Norm']];
  const schemeBody = [
    [
      'P1 (Critical)',
      'Drinking Water',
      'Jal Jeevan Mission (Har Ghar Jal)',
      'FHTC saturation pipelines, purification plant, and secondary overhead tank.',
    ],
    [
      'P1 (Critical)',
      'Education',
      'PM SHRI Schools Infrastructure',
      'Sanction additional classrooms, smart digital boards, and child-friendly toilets.',
    ],
    [
      'P2 (Moderate)',
      'Roads',
      'PM Gram Sadak Yojana (PMGSY)',
      'All-weather concrete road recarpeting for agricultural transport and market access.',
    ],
    [
      'P2 (Moderate)',
      'Green Energy',
      'PM-Surya Ghar & PM-KUSUM Solar',
      'Solar-powered irrigation pump sets and rooftop panels on Gram Panchayat Bhavan.',
    ],
    [
      'P3 (Growth)',
      'Sanitation',
      'Swachh Bharat Mission - Gramin',
      'Solid and liquid waste management (ODF Plus Model) and community compost pits.',
    ],
  ];

  autoTable(doc, {
    startY: currentY,
    head: schemeHead,
    body: schemeBody,
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59], // Slate 800
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'left',
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 7.2,
      textColor: [30, 41, 59],
      cellPadding: 2,
      halign: 'left',
    },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [180, 83, 9], cellWidth: 26 },
      1: { fontStyle: 'bold', cellWidth: 28 },
      2: { fontStyle: 'bold', textColor: [15, 118, 110], cellWidth: 54 },
      3: { cellWidth: 74 },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  // =========================================================================
  // 7. MULTI-PAGE FOOTER STAMP & NUMBERING
  // =========================================================================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Decorative footer divider
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 11, pageWidth - margin, pageHeight - 11);

    // Footer text
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(
      'GramPulse AI Governance Platform  •  MoPR Predictive Telemetry & Census/UDISE+ Engine',
      margin,
      pageHeight - 6.5
    );

    doc.text(
      `Page ${i} of ${totalPages}  |  Official Confidential GPDP Planning Document`,
      pageWidth - margin,
      pageHeight - 6.5,
      { align: 'right' }
    );
  }

  // =========================================================================
  // 8. SAVE FILE WITH INTUITIVE NAME
  // =========================================================================
  const sanitizedGp = gpName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileSuffix = isSpecificYear ? `Year_${selectedYearNum}` : '5Year_Forecast';
  const fileName = `GramPulse_${sanitizedGp}_${fileSuffix}_Report.pdf`;

  doc.save(fileName);
  return fileName;
}
