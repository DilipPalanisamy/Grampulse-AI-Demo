import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker using official CDN matching installed version
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  } catch (err) {
    console.warn('PDF.js worker initialization warning:', err);
  }
}

/**
 * Clean numeric string by removing commas, percentage signs, units
 */
const cleanNumber = (val) => {
  if (val === undefined || val === null) return null;
  const cleaned = String(val).replace(/,/g, '').replace(/%/g, '').trim();
  const num = Number(cleaned);
  return isNaN(num) ? null : num;
};

/**
 * Intelligent regex and heuristic extractor from plain text
 */
export function extractVillageTelemetry(rawText, fileName = '') {
  if (!rawText || typeof rawText !== 'string') {
    return { extracted: {}, count: 0, fieldsFound: [] };
  }

  const text = rawText.replace(/\r\n/g, '\n');
  const extracted = {};
  const fieldsFound = [];

  // Helper matcher
  const matchPattern = (patterns) => {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return null;
  };

  // 1. Village / Gram Panchayat Name
  const villageMatch = matchPattern([
    /(?:Village(?:\s*Name)?|Gram\s*Panchayat(?:\s*Name)?|GP(?:\s*Name)?|Panchayat\s*Name)\s*[:=\-–|]\s*([A-Za-z0-9\s.'’\-]+?)(?=\n|$|,|\(|\))/i,
    /(?:Name\s*of\s*the\s*(?:Village|Gram\s*Panchayat|GP))\s*[:=\-–|]\s*([A-Za-z0-9\s.'’\-]+?)(?=\n|$|,|\(|\))/i,
    /Gram\s*Panchayat\s+([A-Za-z0-9\s.'’\-]+?)(?=\s+(?:Block|District|Taluk|State|\n|$))/i,
  ]);
  if (villageMatch && villageMatch.length > 2) {
    extracted.village_name = villageMatch.replace(/^(the|a)\s+/i, '').trim();
    fieldsFound.push('Village Name');
  } else if (fileName) {
    // Attempt fallback from filename e.g. "Arasur_Panchayat_Report.pdf" -> "Arasur"
    const cleanedFile = fileName.replace(/\.[^/.]+$/, '').replace(/[_\-+]/g, ' ');
    const parts = cleanedFile.split(/\s+/);
    if (parts.length > 0 && parts[0].length > 2 && !/^(report|data|doc|document|census|test|file|predict)$/i.test(parts[0])) {
      const candidate = parts.slice(0, Math.min(parts.length, 3)).join(' ');
      if (candidate.length > 2 && candidate.length < 35) {
        extracted.village_name = candidate;
        fieldsFound.push('Village Name (from filename)');
      }
    }
  }

  // 2. District
  const districtMatch = matchPattern([
    /(?:District(?:\s*Name)?|Dist\.?)\s*[:=\-–|]\s*([A-Za-z\s]+?)(?=\n|$|,|\(|\))/i,
    /(?:District)\s*[:=\-–|]\s*([A-Za-z\s]+)/i,
  ]);
  if (districtMatch && districtMatch.length > 2) {
    extracted.district = districtMatch.trim();
    fieldsFound.push('District');
  }

  // 3. State
  const stateMatch = matchPattern([
    /(?:State(?:\s*Name)?|Province)\s*[:=\-–|]\s*([A-Za-z\s]+?)(?=\n|$|,|\(|\))/i,
  ]);
  if (stateMatch && stateMatch.length > 2) {
    extracted.state = stateMatch.trim();
    fieldsFound.push('State');
  }

  // 4. Base / Current Year
  const yearMatch = matchPattern([
    /(?:Base\s*Year|Current\s*Year|Survey\s*Year|Census\s*Year|Report\s*Year|Year)\s*[:=\-–|]\s*(20[123]\d)/i,
    /\b(202[0-9])\s*(?:Census|Survey|GPDP|Plan|Data)\b/i,
  ]);
  if (yearMatch) {
    const yr = cleanNumber(yearMatch);
    if (yr && yr >= 2015 && yr <= 2035) {
      extracted.current_year = yr;
      fieldsFound.push('Base Year');
    }
  }

  // 5. Population
  const popMatch = matchPattern([
    /(?:Total\s*)?(?:Population|Inhabitants|Citizens|Census\s*Population)\s*[:=\-–|]\s*([0-9,]+)/i,
    /(?:Total\s*Persons?|Residents?)\s*[:=\-–|]\s*([0-9,]+)/i,
    /Population\s+([0-9,]{3,})/i,
  ]);
  if (popMatch) {
    const pop = cleanNumber(popMatch);
    if (pop && pop > 50) {
      extracted.population = pop;
      fieldsFound.push('Population');
    }
  }

  // 6. Households
  const hhMatch = matchPattern([
    /(?:Total\s*)?(?:Households|Families|Dwellings|HHs?)\s*[:=\-–|]\s*([0-9,]+)/i,
    /(?:Number\s*of\s*Households)\s*[:=\-–|]\s*([0-9,]+)/i,
  ]);
  if (hhMatch) {
    const hh = cleanNumber(hhMatch);
    if (hh && hh > 10) {
      extracted.households = hh;
      fieldsFound.push('Households');
    }
  } else if (extracted.population) {
    // If households not explicitly mentioned, estimate ~ population / 4
    extracted.households = Math.round(extracted.population / 4);
    fieldsFound.push('Households (inferred)');
  }

  // 7. Birth Rate
  const birthMatch = matchPattern([
    /(?:Crude\s*)?Birth\s*Rate(?:\s*\(?‰\)?|\s*\(?per\s*1000\)?)?\s*[:=\-–|]\s*([0-9.]+)/i,
    /CBR\s*[:=\-–|]\s*([0-9.]+)/i,
  ]);
  if (birthMatch) {
    const br = cleanNumber(birthMatch);
    if (br !== null && br >= 0 && br <= 60) {
      extracted.birth_rate = br;
      fieldsFound.push('Birth Rate');
    }
  }

  // 8. Death Rate
  const deathMatch = matchPattern([
    /(?:Crude\s*)?Death\s*Rate(?:\s*\(?‰\)?|\s*\(?per\s*1000\)?)?\s*[:=\-–|]\s*([0-9.]+)/i,
    /CDR\s*[:=\-–|]\s*([0-9.]+)/i,
  ]);
  if (deathMatch) {
    const dr = cleanNumber(deathMatch);
    if (dr !== null && dr >= 0 && dr <= 40) {
      extracted.death_rate = dr;
      fieldsFound.push('Death Rate');
    }
  }

  // 9. Migration Rate
  const migMatch = matchPattern([
    /(?:Net\s*)?Migration(?:\s*Rate)?(?:\s*\(?‰\)?|\s*\(?per\s*1000\)?)?\s*[:=\-–|]\s*([0-9.\-]+)/i,
  ]);
  if (migMatch) {
    const mr = cleanNumber(migMatch);
    if (mr !== null && mr >= -20 && mr <= 20) {
      extracted.migration_rate = mr;
      fieldsFound.push('Migration Rate');
    }
  }

  // 10. Schools
  const schoolsMatch = matchPattern([
    /(?:Existing\s*|Total\s*|Available\s*)?(?:Schools|Govt\s*Schools|Educational\s*Institutions)\s*[:=\-–|]\s*([0-9]+)/i,
    /(?:Primary\s*Schools?)\s*[:=\-–|]\s*([0-9]+)/i,
  ]);
  if (schoolsMatch) {
    const sch = cleanNumber(schoolsMatch);
    if (sch !== null && sch >= 0 && sch <= 50) {
      extracted.schools = sch;
      fieldsFound.push('Schools');
    }
  }

  // 11. School Students
  const studentsMatch = matchPattern([
    /(?:School\s*)?(?:Students|Enrolment|Total\s*Students|Pupils)\s*[:=\-–|]\s*([0-9,]+)/i,
    /(?:Enrolled\s*Children|School\s*Going\s*Children)\s*[:=\-–|]\s*([0-9,]+)/i,
  ]);
  if (studentsMatch) {
    const st = cleanNumber(studentsMatch);
    if (st && st >= 0) {
      extracted.school_students = st;
      fieldsFound.push('School Students');
    }
  } else if (extracted.population) {
    extracted.school_students = Math.round(extracted.population * 0.16);
    fieldsFound.push('School Students (UDISE+ benchmark)');
  }

  // 12. Classrooms
  const classroomsMatch = matchPattern([
    /(?:Available\s*|Total\s*)?(?:Classrooms|Class\s*Rooms|Rooms)\s*[:=\-–|]\s*([0-9]+)/i,
  ]);
  if (classroomsMatch) {
    const cl = cleanNumber(classroomsMatch);
    if (cl !== null && cl >= 0 && cl <= 200) {
      extracted.classrooms = cl;
      fieldsFound.push('Classrooms');
    }
  } else if (extracted.schools) {
    extracted.classrooms = Math.max(4, extracted.schools * 8);
    fieldsFound.push('Classrooms (estimated)');
  }

  // 13. Colleges
  const collegesMatch = matchPattern([
    /(?:Colleges|Higher\s*Education|Degree\s*Colleges|Technical\s*Institutes)\s*[:=\-–|]\s*([0-9]+)/i,
  ]);
  if (collegesMatch) {
    const col = cleanNumber(collegesMatch);
    if (col !== null && col >= 0 && col <= 20) {
      extracted.colleges = col;
      fieldsFound.push('Colleges');
    }
  }

  // 14. Hospitals / PHCs
  const hospMatch = matchPattern([
    /(?:Hospitals|PHCs?|Primary\s*Health\s*Centres?|Health\s*Sub\s*Centres?|Clinics|Health\s*Facilities)\s*[:=\-–|]\s*([0-9]+)/i,
  ]);
  if (hospMatch) {
    const hp = cleanNumber(hospMatch);
    if (hp !== null && hp >= 0 && hp <= 20) {
      extracted.hospitals = hp;
      fieldsFound.push('Hospitals/PHCs');
    }
  }

  // 15. Road Length (km)
  const roadMatch = matchPattern([
    /(?:Road(?:\s*Length|\s*Network|\s*Coverage)?|Total\s*Roads?)\s*[:=\-–|]\s*([0-9.]+)\s*(?:km|kms|kilometers)?/i,
    /(?:Paved\s*Roads?|Bitumen\s*Roads?)\s*[:=\-–|]\s*([0-9.]+)\s*(?:km|kms)?/i,
  ]);
  if (roadMatch) {
    const rd = cleanNumber(roadMatch);
    if (rd !== null && rd >= 0 && rd <= 500) {
      extracted.road_length_km = rd;
      fieldsFound.push('Road Length (km)');
    }
  }

  // 16. Road Condition
  const roadCondMatch = matchPattern([
    /(?:Road\s*Condition|Pavement\s*Condition|Surface\s*Quality)\s*[:=\-–|]\s*(Good|Average|Poor|Fair|Paved|Unpaved|Damaged|Critical)/i,
  ]);
  if (roadCondMatch) {
    const cond = roadCondMatch.toLowerCase();
    if (cond.includes('good') || cond.includes('paved')) {
      extracted.road_condition = 'Good';
    } else if (cond.includes('poor') || cond.includes('unpaved') || cond.includes('damaged') || cond.includes('critical')) {
      extracted.road_condition = 'Poor';
    } else {
      extracted.road_condition = 'Average';
    }
    fieldsFound.push('Road Condition');
  }

  // 17. Road Built Year
  const roadBuiltMatch = matchPattern([
    /(?:Road\s*)?(?:Built|Constructed|Commissioned)\s*(?:Year)?\s*[:=\-–|]\s*(19\d\d|20\d\d)/i,
    /(?:Year\s*of\s*Construction)\s*[:=\-–|]\s*(19\d\d|20\d\d)/i,
  ]);
  if (roadBuiltMatch) {
    const by = cleanNumber(roadBuiltMatch);
    if (by && by >= 1970 && by <= 2026) {
      extracted.road_built_year = by;
      fieldsFound.push('Road Built Year');
    }
  }

  // 18. Last Repair Year
  const roadRepairMatch = matchPattern([
    /(?:Last\s*(?:Major\s*)?Repair\s*Year|Last\s*Resurfaced\s*Year|Last\s*Maintained|Maintenance\s*Year)\s*[:=\-–|]\s*(19\d\d|20\d\d)/i,
  ]);
  if (roadRepairMatch) {
    const ry = cleanNumber(roadRepairMatch);
    if (ry && ry >= 1980 && ry <= 2026) {
      extracted.last_repair_year = ry;
      fieldsFound.push('Last Repair Year');
    }
  }

  // 19. Water Coverage (%)
  const waterMatch = matchPattern([
    /(?:Tap\s*)?Water\s*(?:Coverage|Supply|Access|Connection|Saturation)?\s*[:=\-–|]\s*([0-9.]+)\s*%?/i,
    /JJM\s*(?:Coverage|Progress)?\s*[:=\-–|]\s*([0-9.]+)\s*%?/i,
  ]);
  if (waterMatch) {
    const wc = cleanNumber(waterMatch);
    if (wc !== null && wc >= 0 && wc <= 100) {
      extracted.water_coverage = wc;
      fieldsFound.push('Tap Water Coverage (%)');
    }
  }

  // 20. Electricity Coverage (%)
  const powerMatch = matchPattern([
    /(?:Electricity|Power|Grid)\s*(?:Coverage|Electrification|Access|Connection)?\s*[:=\-–|]\s*([0-9.]+)\s*%?/i,
  ]);
  if (powerMatch) {
    const ec = cleanNumber(powerMatch);
    if (ec !== null && ec >= 0 && ec <= 100) {
      extracted.electricity_coverage = ec;
      fieldsFound.push('Electricity Coverage (%)');
    }
  }

  // 21. Internet / Broadband Coverage (%)
  const netMatch = matchPattern([
    /(?:Broadband|Internet|Fiber|Digital|BharatNet)\s*(?:Coverage|Access|Penetration)?\s*[:=\-–|]\s*([0-9.]+)\s*%?/i,
  ]);
  if (netMatch) {
    const ic = cleanNumber(netMatch);
    if (ic !== null && ic >= 0 && ic <= 100) {
      extracted.internet_coverage = ic;
      fieldsFound.push('Internet Coverage (%)');
    }
  }

  // 22. Employment Rate (%)
  const empMatch = matchPattern([
    /(?:Employment|Workforce|Labour\s*Participation)\s*(?:Rate|Percentage|Ratio)?\s*[:=\-–|]\s*([0-9.]+)\s*%?/i,
  ]);
  if (empMatch) {
    const em = cleanNumber(empMatch);
    if (em !== null && em >= 0 && em <= 100) {
      extracted.employment_rate = em;
      fieldsFound.push('Employment Rate (%)');
    }
  }

  return {
    extracted,
    count: Object.keys(extracted).length,
    fieldsFound,
  };
}

/**
 * Parses JSON structured file
 */
function parseJsonTelemetry(jsonObj) {
  const extracted = {};
  const fieldsFound = [];

  const keyMap = {
    village_name: ['village_name', 'village', 'gp_name', 'panchayat_name', 'name'],
    district: ['district', 'district_name'],
    state: ['state', 'state_name'],
    current_year: ['current_year', 'base_year', 'year'],
    population: ['population', 'total_population', 'inhabitants'],
    households: ['households', 'total_households', 'families'],
    birth_rate: ['birth_rate', 'cbr'],
    death_rate: ['death_rate', 'cdr'],
    migration_rate: ['migration_rate', 'net_migration'],
    schools: ['schools', 'total_schools', 'govt_schools'],
    school_students: ['school_students', 'students', 'enrolment'],
    classrooms: ['classrooms', 'school_classrooms_count', 'rooms'],
    colleges: ['colleges', 'higher_education'],
    hospitals: ['hospitals', 'phcs', 'health_centers'],
    road_length_km: ['road_length_km', 'road_length', 'road_coverage_km'],
    road_condition: ['road_condition'],
    road_built_year: ['road_built_year', 'built_year'],
    last_repair_year: ['last_repair_year', 'repair_year'],
    water_coverage: ['water_coverage', 'tap_water'],
    electricity_coverage: ['electricity_coverage', 'electricity'],
    internet_coverage: ['internet_coverage', 'internet', 'broadband'],
    employment_rate: ['employment_rate', 'employment'],
  };

  const findVal = (keys) => {
    for (const k of keys) {
      if (jsonObj[k] !== undefined && jsonObj[k] !== null && jsonObj[k] !== '') {
        return jsonObj[k];
      }
      // Also check lowercased
      for (const objKey of Object.keys(jsonObj)) {
        if (objKey.toLowerCase() === k.toLowerCase()) {
          return jsonObj[objKey];
        }
      }
    }
    return undefined;
  };

  for (const [targetKey, aliases] of Object.entries(keyMap)) {
    const rawVal = findVal(aliases);
    if (rawVal !== undefined) {
      if (typeof rawVal === 'number') {
        extracted[targetKey] = rawVal;
        fieldsFound.push(targetKey);
      } else if (typeof rawVal === 'string' && rawVal.trim()) {
        const num = cleanNumber(rawVal);
        if (num !== null && targetKey !== 'village_name' && targetKey !== 'district' && targetKey !== 'state' && targetKey !== 'road_condition') {
          extracted[targetKey] = num;
        } else {
          extracted[targetKey] = rawVal.trim();
        }
        fieldsFound.push(targetKey);
      }
    }
  }

  return {
    extracted,
    count: Object.keys(extracted).length,
    fieldsFound,
  };
}

/**
 * Universal Document File Parser (PDF, TXT, JSON, CSV, MD)
 * Returns { success: boolean, extracted: object, count: number, fieldsFound: string[], rawSnippet: string }
 */
export async function parseDocumentFile(file) {
  if (!file) {
    throw new Error('No file provided for parsing.');
  }

  const fileName = file.name || 'document';
  const extension = fileName.split('.').pop().toLowerCase();

  // 1. JSON file handler
  if (extension === 'json') {
    const text = await file.text();
    try {
      const parsedJson = JSON.parse(text);
      if (typeof parsedJson === 'object' && parsedJson !== null) {
        // If wrapped in data or features, inspect
        const target = parsedJson.data || (Array.isArray(parsedJson) ? parsedJson[0] : parsedJson);
        const result = parseJsonTelemetry(target);
        return {
          success: true,
          fileName,
          extension,
          extracted: result.extracted,
          count: result.count,
          fieldsFound: result.fieldsFound,
          rawSnippet: text.slice(0, 300),
        };
      }
    } catch (err) {
      console.warn('Direct JSON parse failed, falling back to regex text extraction:', err);
    }
  }

  // 2. Plain Text / Markdown / CSV handler
  if (['txt', 'csv', 'md', 'tsv', 'log'].includes(extension)) {
    const text = await file.text();
    const result = extractVillageTelemetry(text, fileName);
    return {
      success: true,
      fileName,
      extension,
      extracted: result.extracted,
      count: result.count,
      fieldsFound: result.fieldsFound,
      rawSnippet: text.slice(0, 300),
    };
  }

  // 3. PDF handler
  if (extension === 'pdf') {
    let fullText = '';
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(arrayBuffer),
        useSystemFonts: true,
      });

      const pdf = await loadingTask.promise;
      const numPages = Math.min(pdf.numPages, 20); // read up to 20 pages

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item) => (typeof item.str === 'string' ? item.str : ''))
          .join(' ');
        fullText += `\n--- Page ${pageNum} ---\n` + pageText;
      }
    } catch (pdfErr) {
      console.warn('PDF.js renderer encountered error, attempting fallback raw buffer decoding:', pdfErr);
      // Fallback: decode text strings directly from arrayBuffer
      try {
        const arrayBuffer = await file.arrayBuffer();
        const decoder = new TextDecoder('utf-8', { fatal: false });
        const rawDecoded = decoder.decode(arrayBuffer);
        // Extract visible characters
        const cleanChars = rawDecoded.replace(/[^\x20-\x7E\t\r\n]/g, ' ');
        fullText = cleanChars;
      } catch (fallbackErr) {
        throw new Error(`Failed to extract text from PDF: ${pdfErr.message || 'Corrupted or password-protected PDF'}`);
      }
    }

    if (!fullText.trim()) {
      throw new Error('PDF was parsed but contained no readable text (it might be a scanned image without OCR).');
    }

    const result = extractVillageTelemetry(fullText, fileName);
    return {
      success: true,
      fileName,
      extension,
      extracted: result.extracted,
      count: result.count,
      fieldsFound: result.fieldsFound,
      rawSnippet: fullText.replace(/\s+/g, ' ').slice(0, 300),
    };
  }

  // 4. Default: Try reading as text
  try {
    const text = await file.text();
    const result = extractVillageTelemetry(text, fileName);
    return {
      success: true,
      fileName,
      extension,
      extracted: result.extracted,
      count: result.count,
      fieldsFound: result.fieldsFound,
      rawSnippet: text.slice(0, 300),
    };
  } catch (err) {
    throw new Error(`Unsupported document type .${extension}. Please upload a PDF, TXT, CSV, or JSON file.`);
  }
}
