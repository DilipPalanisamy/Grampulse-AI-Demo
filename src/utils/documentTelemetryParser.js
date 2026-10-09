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
 * Clean textual value by removing noise, colons, prefixes
 */
const cleanText = (val) => {
  if (!val || typeof val !== 'string') return '';
  return val
    .replace(/^[:=\-–|]\s*/, '')
    .replace(/^(?:Name|GP\s*Name|Village\s*Name)[:=\-–|]?\s*/i, '')
    .trim();
};

/**
 * Helper to check if a value is "Not provided", "N/A", "Nil", etc.
 */
const isNotProvided = (val) => {
  if (!val) return true;
  return /^(not\s*provided|not\s*available|n\/?a|nil|none|unknown|-)$/i.test(String(val).trim());
};

/**
 * Reconstruct text with spatial layout from PDF page text content items.
 * Groups tokens on the same horizontal line (similar Y coordinate) and sorts them left-to-right.
 */
export function extractPageTextWithLayout(textContent) {
  if (!textContent || !textContent.items) return '';

  const rawItems = textContent.items.filter(
    (item) => typeof item.str === 'string' && item.str.trim().length > 0
  );
  if (rawItems.length === 0) return '';

  // Sort primarily by Y descending (top to bottom), secondarily by X ascending (left to right)
  const items = [...rawItems].sort((a, b) => {
    const yA = a.transform ? a.transform[5] : 0;
    const yB = b.transform ? b.transform[5] : 0;
    const diffY = yB - yA;
    if (Math.abs(diffY) > 3) {
      return diffY;
    }
    const xA = a.transform ? a.transform[4] : 0;
    const xB = b.transform ? b.transform[4] : 0;
    return xA - xB;
  });

  const lines = [];
  let currentLine = [];
  let currentY = null;

  for (const item of items) {
    const y = item.transform ? item.transform[5] : 0;
    if (currentY === null || Math.abs(currentY - y) <= 4) {
      currentLine.push(item.str);
      if (currentY === null) currentY = y;
    } else {
      if (currentLine.length > 0) {
        // Separate columns on same line with spaces
        lines.push(currentLine.join('   '));
      }
      currentLine = [item.str];
      currentY = y;
    }
  }
  if (currentLine.length > 0) {
    lines.push(currentLine.join('   '));
  }

  return lines.join('\n');
}

/**
 * High-accuracy multi-tiered telemetry extractor from raw text / table lines
 */
export function extractVillageTelemetry(rawText, fileName = '') {
  if (!rawText || typeof rawText !== 'string') {
    return { extracted: {}, count: 0, fieldsFound: [] };
  }

  const extracted = {};
  const fieldsFound = [];

  const setField = (key, val, label) => {
    if (val !== undefined && val !== null && val !== '' && extracted[key] === undefined) {
      extracted[key] = val;
      fieldsFound.push(label || key);
    }
  };

  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  // ========================================================
  // TIER 1: LINE-BY-LINE TABULAR EXTRACTION
  // Handles table rows with or without colons: "Label   Value" or "Label: Value"
  // ========================================================
  for (const line of lines) {
    // 1. Village / Gram Panchayat Name
    if (!extracted.village_name) {
      const vMatch = line.match(/^(?:(?:1\.\s*)?Village\s*(?:\/|\band\b)?\s*Gram\s*Panchayat(?:\s*Name)?|Gram\s*Panchayat(?:\s*Name)?|Village\s*Name|Panchayat\s*Name)\s*[:=\-–|]?\s+(.+)$/i);
      if (vMatch) {
        const cleaned = cleanText(vMatch[1]);
        if (cleaned && cleaned.length >= 2 && !isNotProvided(cleaned)) {
          setField('village_name', cleaned, 'Village Name');
        }
      }
    }

    // 2. District
    if (!extracted.district) {
      const dMatch = line.match(/^District(?:\s*Name)?\s*[:=\-–|]?\s+([A-Za-z\s.'’\-]+)$/i);
      if (dMatch) {
        const dist = cleanText(dMatch[1]);
        if (dist && dist.length >= 2 && !isNotProvided(dist)) {
          setField('district', dist, 'District');
        }
      }
    }

    // 3. State
    if (!extracted.state) {
      const sMatch = line.match(/^State(?:\s*Name)?\s*[:=\-–|]?\s+([A-Za-z\s.'’\-]+)$/i);
      if (sMatch) {
        const st = cleanText(sMatch[1]);
        if (st && st.length >= 2 && !isNotProvided(st)) {
          setField('state', st, 'State');
        }
      }
    }

    // 4. Base Year
    if (!extracted.current_year) {
      const yMatch = line.match(/^(?:Base\s*Year|Current\s*Year|Survey\s*Year|Census\s*Year|Year)\s*[:=\-–|]?\s+(20[123]\d)$/i);
      if (yMatch) {
        setField('current_year', cleanNumber(yMatch[1]), 'Base Year');
      }
    }

    // 5. Population
    if (!extracted.population) {
      const pMatch = line.match(/^(?:(?:2\.\s*)?Base\s*Population|Total\s*Population|Population)\s*[:=\-–|]?\s+([0-9,]+)$/i);
      if (pMatch) {
        const pop = cleanNumber(pMatch[1]);
        if (pop && pop > 10) {
          setField('population', pop, 'Population');
        }
      }
    }

    // 6. Households
    if (!extracted.households) {
      const hMatch = line.match(/^(?:Households|Total\s*Households|Number\s*of\s*Households|Families)\s*[:=\-–|]?\s+([0-9,]+)$/i);
      if (hMatch) {
        const hh = cleanNumber(hMatch[1]);
        if (hh && hh > 0) {
          setField('households', hh, 'Households');
        }
      }
    }

    // 7. Birth Rate (‰)
    if (!extracted.birth_rate) {
      const brMatch = line.match(/^(?:Crude\s*)?Birth\s*Rate(?:\s*\(?[‰%]?\)?|\s*\(?per\s*1000\)?)?\s*[:=\-–|]?\s+([0-9.]+)/i);
      if (brMatch) {
        const br = cleanNumber(brMatch[1]);
        if (br !== null && br >= 0 && br <= 70) {
          setField('birth_rate', br, 'Birth Rate');
        }
      }
    }

    // 8. Death Rate (‰)
    if (!extracted.death_rate) {
      const drMatch = line.match(/^(?:Crude\s*)?Death\s*Rate(?:\s*\(?[‰%]?\)?|\s*\(?per\s*1000\)?)?\s*[:=\-–|]?\s+([0-9.]+)/i);
      if (drMatch) {
        const dr = cleanNumber(drMatch[1]);
        if (dr !== null && dr >= 0 && dr <= 50) {
          setField('death_rate', dr, 'Death Rate');
        }
      }
    }

    // 9. Migration Rate (‰)
    if (!extracted.migration_rate) {
      const mrMatch = line.match(/^(?:Net\s*)?Migration(?:\s*Rate)?(?:\s*\(?[‰%]?\)?|\s*\(?per\s*1000\)?)?\s*[:=\-–|]?\s+([0-9.\-]+)/i);
      if (mrMatch) {
        const mr = cleanNumber(mrMatch[1]);
        if (mr !== null && mr >= -30 && mr <= 30) {
          setField('migration_rate', mr, 'Migration Rate');
        }
      }
    }

    // 10. Existing Schools
    if (!extracted.schools) {
      const schMatch = line.match(/^(?:Existing\s*Schools?|Govt\s*Schools?|Total\s*Schools?|Primary\s*Schools?|Schools?)\s*[:=\-–|]?\s+([0-9]+)$/i);
      if (schMatch) {
        setField('schools', cleanNumber(schMatch[1]), 'Schools');
      }
    }

    // 11. Available Classrooms (must not parse "Not provided")
    if (!extracted.classrooms) {
      const clMatch = line.match(/^(?:Available\s*Classrooms?|Classrooms?|Total\s*Classrooms?)\s*[:=\-–|]?\s+([0-9]+)$/i);
      if (clMatch) {
        setField('classrooms', cleanNumber(clMatch[1]), 'Classrooms');
      }
    }

    // 12. School Students
    if (!extracted.school_students) {
      const stMatch = line.match(/^(?:School\s*Students?|Total\s*Students?|Students?\s*Enrolled|Enrolment)\s*[:=\-–|]?\s+([0-9,]+)$/i);
      if (stMatch) {
        setField('school_students', cleanNumber(stMatch[1]), 'School Students');
      }
    }

    // 13. Colleges (must not match "College Students")
    if (!extracted.colleges) {
      const colMatch = line.match(/^(?:Existing\s*|Total\s*)?Colleges?\s*[:=\-–|]?\s+([0-9]+)$/i);
      if (colMatch && !/students/i.test(line)) {
        setField('colleges', cleanNumber(colMatch[1]), 'Colleges');
      }
    }

    // 14. Hospitals / PHCs
    if (!extracted.hospitals) {
      const hspMatch = line.match(/^(?:Hospitals\s*(?:\/|\band\b)?\s*PHCs?|Hospitals?|PHCs?|Primary\s*Health\s*Centres?|Health\s*Centres?)\s*[:=\-–|]?\s+([0-9]+)$/i);
      if (hspMatch) {
        setField('hospitals', cleanNumber(hspMatch[1]), 'Hospitals/PHCs');
      }
    }

    // 15. Road Network
    if (!extracted.road_length_km) {
      const rdMatch = line.match(/^(?:Road\s*Network|Road\s*Length|Road\s*Coverage|Total\s*Roads?)\s*[:=\-–|]?\s+([0-9.]+)\s*(?:km|kms)?$/i);
      if (rdMatch) {
        setField('road_length_km', cleanNumber(rdMatch[1]), 'Road Network (km)');
      }
    }

    // 16. Road Condition
    if (!extracted.road_condition) {
      const rcMatch = line.match(/^(?:Road\s*Condition|Pavement\s*Condition)\s*[:=\-–|]?\s+(Good|Average|Poor|Fair|Paved|Unpaved)$/i);
      if (rcMatch) {
        const cond = rcMatch[1].toLowerCase();
        const finalCond = cond.includes('good') || cond.includes('paved') ? 'Good' : cond.includes('poor') || cond.includes('unpaved') ? 'Poor' : 'Average';
        setField('road_condition', finalCond, 'Road Condition');
      }
    }

    // 17. Year Road Built
    if (!extracted.road_built_year) {
      const rbyMatch = line.match(/^(?:Year\s*(?:Road\s*)?Built|Road\s*Built\s*Year|Built\s*Year|Construction\s*Year)\s*[:=\-–|]?\s+(19\d\d|20\d\d)$/i);
      if (rbyMatch) {
        setField('road_built_year', cleanNumber(rbyMatch[1]), 'Road Built Year');
      }
    }

    // 18. Last Major Repair Year
    if (!extracted.last_repair_year) {
      const lryMatch = line.match(/^(?:Last\s*(?:Major\s*)?Repair\s*Year|Last\s*Repair\s*Year|Last\s*Resurfaced\s*Year|Maintenance\s*Year)\s*[:=\-–|]?\s+(19\d\d|20\d\d)$/i);
      if (lryMatch) {
        setField('last_repair_year', cleanNumber(lryMatch[1]), 'Last Repair Year');
      }
    }

    // 19. Tap Water Supply
    if (!extracted.water_coverage) {
      const twMatch = line.match(/^(?:Tap\s*Water\s*Supply|Tap\s*Water\s*Coverage|Tap\s*Water|Water\s*Coverage|Water\s*Supply)\s*[:=\-–|]?\s+([0-9.]+)\s*%?$/i);
      if (twMatch) {
        setField('water_coverage', cleanNumber(twMatch[1]), 'Tap Water Coverage (%)');
      }
    }

    // 20. Electricity Grid
    if (!extracted.electricity_coverage) {
      const egMatch = line.match(/^(?:Electricity\s*Grid|Electricity\s*Coverage|Electricity|Power\s*Grid)\s*[:=\-–|]?\s+([0-9.]+)\s*%?$/i);
      if (egMatch) {
        setField('electricity_coverage', cleanNumber(egMatch[1]), 'Electricity Coverage (%)');
      }
    }

    // 21. Broadband Internet
    if (!extracted.internet_coverage) {
      const biMatch = line.match(/^(?:Broadband\s*Internet|Broadband\s*Coverage|Broadband|Internet\s*Coverage|Internet)\s*[:=\-–|]?\s+([0-9.]+)\s*%?$/i);
      if (biMatch) {
        setField('internet_coverage', cleanNumber(biMatch[1]), 'Internet Coverage (%)');
      }
    }

    // 22. Employment Rate
    if (!extracted.employment_rate) {
      const erMatch = line.match(/^(?:Employment\s*Rate|Employment|Workforce\s*Rate)\s*[:=\-–|]?\s+([0-9.]+)\s*%?$/i);
      if (erMatch) {
        setField('employment_rate', cleanNumber(erMatch[1]), 'Employment Rate (%)');
      }
    }
  }

  // ========================================================
  // TIER 2: DOCUMENT HEADER FALLBACK FOR VILLAGE NAME
  // e.g. "Sample completed form for Chinniyampalayam | Forecast period: 2027–2031"
  // ========================================================
  if (!extracted.village_name) {
    const headerMatch = rawText.match(/(?:Sample\s+completed\s+form\s+for|Form\s+for|Prediction\s+for|Report\s+for)\s+([A-Za-z0-9\s.'’\-]+?)(?=\s*[|\n,]|\s+Forecast|\s+Base)/i);
    if (headerMatch && headerMatch[1]) {
      const candidate = headerMatch[1].trim();
      if (candidate.length >= 2 && candidate.length < 40) {
        setField('village_name', candidate, 'Village Name (from header)');
      }
    }
  }

  // Fallback from filename if still missing
  if (!extracted.village_name && fileName) {
    const cleanedFile = fileName.replace(/\.[^/.]+$/, '').replace(/[_\-+]/g, ' ');
    const parts = cleanedFile.split(/\s+/);
    if (parts.length > 0 && parts[0].length > 2 && !/^(report|data|doc|document|census|test|file|predict)$/i.test(parts[0])) {
      const candidate = parts.slice(0, Math.min(parts.length, 3)).join(' ');
      if (candidate.length > 2 && candidate.length < 35) {
        setField('village_name', candidate, 'Village Name (from filename)');
      }
    }
  }

  // ========================================================
  // TIER 3: FULL TEXT REGEX FALLBACK (for inline documents)
  // ========================================================
  const matchPattern = (patterns) => {
    for (const pattern of patterns) {
      const match = rawText.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return null;
  };

  if (!extracted.district) {
    const d = matchPattern([/(?:District(?:\s*Name)?|Dist\.?)\s*[:=\-–|]?\s*([A-Za-z\s]+?)(?=\n|$|,|\(|\)|\|)/i]);
    if (d && d.length > 2 && !isNotProvided(d)) setField('district', cleanText(d), 'District');
  }

  if (!extracted.state) {
    const s = matchPattern([/(?:State(?:\s*Name)?|Province)\s*[:=\-–|]?\s*([A-Za-z\s]+?)(?=\n|$|,|\(|\)|\|)/i]);
    if (s && s.length > 2 && !isNotProvided(s)) setField('state', cleanText(s), 'State');
  }

  if (!extracted.population) {
    const p = matchPattern([/(?:Total\s*Population|Base\s*Population|Population)\s*[:=\-–|]?\s*([0-9,]+)/i]);
    if (p) setField('population', cleanNumber(p), 'Population');
  }

  if (!extracted.households) {
    const h = matchPattern([/(?:Total\s*Households|Households|Families)\s*[:=\-–|]?\s*([0-9,]+)/i]);
    if (h) setField('households', cleanNumber(h), 'Households');
  }

  if (!extracted.birth_rate) {
    const b = matchPattern([/(?:Crude\s*)?Birth\s*Rate(?:\s*\(?[‰%]?\)?|\s*\(?per\s*1000\)?)?\s*[:=\-–|]?\s*([0-9.]+)/i]);
    if (b) setField('birth_rate', cleanNumber(b), 'Birth Rate');
  }

  if (!extracted.death_rate) {
    const d = matchPattern([/(?:Crude\s*)?Death\s*Rate(?:\s*\(?[‰%]?\)?|\s*\(?per\s*1000\)?)?\s*[:=\-–|]?\s*([0-9.]+)/i]);
    if (d) setField('death_rate', cleanNumber(d), 'Death Rate');
  }

  if (!extracted.migration_rate) {
    const m = matchPattern([/(?:Net\s*)?Migration(?:\s*Rate)?(?:\s*\(?[‰%]?\)?|\s*\(?per\s*1000\)?)?\s*[:=\-–|]?\s*([0-9.\-]+)/i]);
    if (m) setField('migration_rate', cleanNumber(m), 'Migration Rate');
  }

  if (!extracted.schools) {
    const sc = matchPattern([/(?:Existing\s*Schools?|Govt\s*Schools?|Total\s*Schools?)\s*[:=\-–|]?\s*([0-9]+)/i]);
    if (sc) setField('schools', cleanNumber(sc), 'Schools');
  }

  if (!extracted.school_students) {
    const st = matchPattern([/(?:School\s*Students?|Total\s*Students?|Students?\s*Enrolled)\s*[:=\-–|]?\s*([0-9,]+)/i]);
    if (st) setField('school_students', cleanNumber(st), 'School Students');
  }

  if (!extracted.colleges) {
    const col = matchPattern([/(?:Existing\s*|Total\s*)?Colleges?\s*[:=\-–|]?\s*([0-9]+)(?!\s*students)/i]);
    if (col) setField('colleges', cleanNumber(col), 'Colleges');
  }

  if (!extracted.hospitals) {
    const hp = matchPattern([/(?:Hospitals\s*(?:\/|\band\b)?\s*PHCs?|Hospitals?|PHCs?)\s*[:=\-–|]?\s*([0-9]+)/i]);
    if (hp) setField('hospitals', cleanNumber(hp), 'Hospitals/PHCs');
  }

  if (!extracted.road_length_km) {
    const rd = matchPattern([/(?:Road\s*Network|Road\s*Length|Road\s*Coverage)\s*[:=\-–|]?\s*([0-9.]+)\s*(?:km|kms)?/i]);
    if (rd) setField('road_length_km', cleanNumber(rd), 'Road Network (km)');
  }

  if (!extracted.road_condition) {
    const rc = matchPattern([/(?:Road\s*Condition|Pavement\s*Condition)\s*[:=\-–|]?\s*(Good|Average|Poor|Fair|Paved|Unpaved)/i]);
    if (rc) {
      const cond = rc.toLowerCase();
      const finalCond = cond.includes('good') || cond.includes('paved') ? 'Good' : cond.includes('poor') || cond.includes('unpaved') ? 'Poor' : 'Average';
      setField('road_condition', finalCond, 'Road Condition');
    }
  }

  if (!extracted.water_coverage) {
    const wc = matchPattern([/(?:Tap\s*Water\s*Supply|Tap\s*Water|Water\s*Coverage)\s*[:=\-–|]?\s*([0-9.]+)\s*%?/i]);
    if (wc) setField('water_coverage', cleanNumber(wc), 'Tap Water Coverage (%)');
  }

  if (!extracted.electricity_coverage) {
    const ec = matchPattern([/(?:Electricity\s*Grid|Electricity\s*Coverage|Electricity)\s*[:=\-–|]?\s*([0-9.]+)\s*%?/i]);
    if (ec) setField('electricity_coverage', cleanNumber(ec), 'Electricity Coverage (%)');
  }

  if (!extracted.internet_coverage) {
    const ic = matchPattern([/(?:Broadband\s*Internet|Broadband|Internet\s*Coverage)\s*[:=\-–|]?\s*([0-9.]+)\s*%?/i]);
    if (ic) setField('internet_coverage', cleanNumber(ic), 'Internet Coverage (%)');
  }

  if (!extracted.employment_rate) {
    const em = matchPattern([/(?:Employment\s*Rate|Employment)\s*[:=\-–|]?\s*([0-9.]+)\s*%?/i]);
    if (em) setField('employment_rate', cleanNumber(em), 'Employment Rate (%)');
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
    population: ['population', 'base_population', 'total_population', 'inhabitants'],
    households: ['households', 'total_households', 'families'],
    birth_rate: ['birth_rate', 'cbr'],
    death_rate: ['death_rate', 'cdr'],
    migration_rate: ['migration_rate', 'net_migration'],
    schools: ['schools', 'existing_schools', 'total_schools', 'govt_schools'],
    school_students: ['school_students', 'students', 'enrolment'],
    classrooms: ['classrooms', 'available_classrooms', 'school_classrooms_count', 'rooms'],
    colleges: ['colleges', 'total_colleges', 'higher_education'],
    hospitals: ['hospitals', 'phcs', 'health_centers'],
    road_length_km: ['road_length_km', 'road_network', 'road_length', 'road_coverage_km'],
    road_condition: ['road_condition'],
    road_built_year: ['road_built_year', 'built_year', 'year_road_built'],
    last_repair_year: ['last_repair_year', 'repair_year', 'last_major_repair_year'],
    water_coverage: ['water_coverage', 'tap_water_supply', 'tap_water'],
    electricity_coverage: ['electricity_coverage', 'electricity_grid', 'electricity'],
    internet_coverage: ['internet_coverage', 'broadband_internet', 'broadband', 'internet'],
    employment_rate: ['employment_rate', 'employment'],
  };

  const findVal = (keys) => {
    for (const k of keys) {
      if (jsonObj[k] !== undefined && jsonObj[k] !== null && jsonObj[k] !== '') {
        return jsonObj[k];
      }
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
    if (rawVal !== undefined && !isNotProvided(rawVal)) {
      if (typeof rawVal === 'number') {
        extracted[targetKey] = rawVal;
        fieldsFound.push(targetKey);
      } else if (typeof rawVal === 'string' && rawVal.trim()) {
        const num = cleanNumber(rawVal);
        if (num !== null && targetKey !== 'village_name' && targetKey !== 'district' && targetKey !== 'state' && targetKey !== 'road_condition') {
          extracted[targetKey] = num;
        } else {
          extracted[targetKey] = cleanText(rawVal);
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

  // 3. PDF handler with layout-aware text extraction
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
        
        // Use layout-aware line reconstructor to preserve columns & rows
        const pageText = extractPageTextWithLayout(textContent);
        fullText += `\n--- Page ${pageNum} ---\n` + pageText;
      }
    } catch (pdfErr) {
      console.warn('PDF.js renderer encountered error, attempting fallback raw buffer decoding:', pdfErr);
      try {
        const arrayBuffer = await file.arrayBuffer();
        const decoder = new TextDecoder('utf-8', { fatal: false });
        const rawDecoded = decoder.decode(arrayBuffer);
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

  // 4. Default fallback: Read as text
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
