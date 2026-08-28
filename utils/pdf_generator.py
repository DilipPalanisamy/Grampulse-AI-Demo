"""
=============================================================================
GramPulse AI - PDF Document Engine (ReportLab)
=============================================================================
Compiles official Gram Panchayat Development Plan (GPDP) analytics reports,
predictive infrastructure gap projections, and AI-matched welfare schemes.

Refactored for:
- Canvas state isolation (saveState/restoreState in NumberedCanvas)
- Strict table text auto-wrapping in Paragraph flowables
- Explicit column widths on all Table flowables
- OS-agnostic path-safe asset and resource resolution
- Robust data fallback and null safety guards
=============================================================================
"""

import os
import io
from datetime import datetime
from typing import Dict, List, Any, Optional

try:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import (
        SimpleDocTemplate,
        Paragraph,
        Spacer,
        Table,
        TableStyle,
        KeepTogether,
        HRFlowable,
        Image,
    )
    from reportlab.lib.units import inch, cm
    from reportlab.pdfgen import canvas
except ImportError:
    raise ImportError(
        "ReportLab is required to generate PDF reports. "
        "Please install it using: pip install reportlab"
    )

# ---------------------------------------------------------------------------
# Path-Safe Asset & Resource Resolution
# ---------------------------------------------------------------------------
CURRENT_DIR = os.path.abspath(os.path.dirname(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
ASSETS_DIR = os.path.abspath(os.path.join(CURRENT_DIR, "assets"))


def get_asset_path(relative_path: str) -> str:
    """
    Returns an absolute, OS-agnostic path for any asset relative to the utils directory.
    Guarantees cross-platform execution on Windows, Linux, and macOS.
    """
    return os.path.abspath(os.path.join(CURRENT_DIR, relative_path))


# ---------------------------------------------------------------------------
# Color Palette Constants (GovTech & Emerald Theme)
# ---------------------------------------------------------------------------
PRIMARY_DARK = colors.HexColor("#065F46")      # Dark Emerald Green (#065F46)
PRIMARY_ACCENT = colors.HexColor("#059669")    # Medium Emerald
PRIMARY_LIGHT = colors.HexColor("#ECFDF5")     # Mint Tint
SLATE_DARK = colors.HexColor("#0F172A")        # Slate 900
SLATE_MUTED = colors.HexColor("#475569")       # Slate 600
SLATE_BORDER = colors.HexColor("#CBD5E1")      # Slate 300 (Grid lines)
SLATE_ROW_ALT = colors.HexColor("#F8FAFC")     # Slate 50
TEXT_LIGHT = colors.white
ALERT_RED = colors.HexColor("#DC2626")
ALERT_AMBER = colors.HexColor("#D97706")
ALERT_GREEN = colors.HexColor("#16A34A")


class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas to dynamically compute and render total page count
    and clean header/footer running lines with strict canvas state isolation.
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_number(self, page_count: int):
        """Alias for draw_page_decorations with state isolation."""
        self.draw_page_decorations(page_count)

    def draw_page_decorations(self, page_count: int):
        """
        Renders running header and footer lines.
        Uses canvas.saveState() and canvas.restoreState() to prevent styling
        properties from spilling into the primary document flowables.
        """
        self.saveState()
        try:
            self.setFont("Helvetica", 8)
            self.setFillColor(SLATE_MUTED)

            page_width, page_height = A4
            margin = 36  # 0.5 inch

            # Running Footer Separator Line
            self.setStrokeColor(SLATE_BORDER)
            self.setLineWidth(0.5)
            self.line(margin, 40, page_width - margin, 40)

            # Footer Left: Platform branding
            self.drawString(
                margin,
                26,
                "GramPulse AI • Ministry of Panchayati Raj Analytics & AI Advisory",
            )

            # Footer Center: Document classification
            self.drawCentredString(
                page_width / 2.0,
                26,
                "Official Gram Panchayat Development Plan (GPDP)",
            )

            # Footer Right: Dynamic Total Page Numbering
            page_str = f"Page {self._pageNumber} of {page_count}"
            self.drawRightString(page_width - margin, 26, page_str)

        finally:
            self.restoreState()


def _build_styles() -> Dict[str, ParagraphStyle]:
    """Generates custom, clean typographic styles for all document paragraphs."""
    base_styles = getSampleStyleSheet()

    styles = {
        "BannerTitle": ParagraphStyle(
            name="BannerTitle",
            fontName="Helvetica-Bold",
            fontSize=17,
            leading=21,
            textColor=TEXT_LIGHT,
            spaceAfter=4,
        ),
        "BannerSubtitle": ParagraphStyle(
            name="BannerSubtitle",
            fontName="Helvetica",
            fontSize=9.5,
            leading=13.5,
            textColor=colors.HexColor("#D1FAE5"),
        ),
        "BannerBadge": ParagraphStyle(
            name="BannerBadge",
            fontName="Helvetica-Bold",
            fontSize=10.5,
            leading=14,
            alignment=2,  # Right aligned
            textColor=TEXT_LIGHT,
        ),
        "SectionHeading": ParagraphStyle(
            name="SectionHeading",
            fontName="Helvetica-Bold",
            fontSize=12.5,
            leading=16,
            textColor=PRIMARY_DARK,
            spaceBefore=6,
            spaceAfter=5,
        ),
        "SubSectionText": ParagraphStyle(
            name="SubSectionText",
            fontName="Helvetica",
            fontSize=8.5,
            leading=12.5,
            textColor=SLATE_MUTED,
            spaceAfter=7,
        ),
        "TableHeader": ParagraphStyle(
            name="TableHeader",
            fontName="Helvetica-Bold",
            fontSize=8.5,
            leading=11.5,
            textColor=TEXT_LIGHT,
            alignment=1,  # Centered
        ),
        "TableCell": ParagraphStyle(
            name="TableCell",
            fontName="Helvetica",
            fontSize=8,
            leading=11,
            textColor=SLATE_DARK,
        ),
        "TableCellBold": ParagraphStyle(
            name="TableCellBold",
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=11,
            textColor=SLATE_DARK,
        ),
        "TableCellCenter": ParagraphStyle(
            name="TableCellCenter",
            fontName="Helvetica",
            fontSize=8,
            leading=11,
            alignment=1,
            textColor=SLATE_DARK,
        ),
        "ScoreBadge": ParagraphStyle(
            name="ScoreBadge",
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=11,
            alignment=1,
            textColor=PRIMARY_DARK,
        ),
        "DeficitHighlight": ParagraphStyle(
            name="DeficitHighlight",
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=11,
            alignment=1,
            textColor=ALERT_RED,
        ),
        "NoticeText": ParagraphStyle(
            name="NoticeText",
            fontName="Helvetica-Oblique",
            fontSize=7.5,
            leading=10.5,
            textColor=SLATE_MUTED,
        ),
    }

    return styles


# ---------------------------------------------------------------------------
# Formatting & Fallback Guard Helpers
# ---------------------------------------------------------------------------
def _format_numeric_val(val: Any, default: str = "N/A") -> str:
    """Safely formats an integer or float with thousand commas."""
    if val is None or val == "":
        return default
    try:
        num = float(str(val).replace(",", "").strip())
        return f"{int(num):,}" if num.is_integer() else f"{num:,.2f}"
    except (ValueError, TypeError):
        return str(val)


def _format_deficit_val(val: Any, unit: str = "") -> str:
    """Safely formats gap values, prepending minus sign if positive deficit."""
    if val is None or val == "":
        return "No Deficit"
    try:
        clean_str = str(val).replace(",", "").replace("+", "").strip()
        num = float(clean_str)
        if num > 0:
            formatted_num = f"{int(num):,}" if num.is_integer() else f"{num:,.2f}"
            return f"-{formatted_num} {unit}".strip()
        return "No Deficit"
    except (ValueError, TypeError):
        return f"{val} {unit}".strip()


def _format_currency_val(val: Any, default: str = "As per DPR") -> str:
    """Safely formats INR currency values with ₹ prefix."""
    if val is None or val == "":
        return default
    if isinstance(val, (int, float)):
        return f"₹ {val:,.2f} Lakhs"
    val_str = str(val).strip()
    if not val_str.startswith("₹") and any(c.isdigit() for c in val_str):
        return f"₹ {val_str}"
    return val_str


# ---------------------------------------------------------------------------
# Primary PDF Generator Function
# ---------------------------------------------------------------------------
def generate_gpdp_pdf(
    gp_name: str,
    predictions: Optional[Dict[str, Any]] = None,
    schemes: Optional[List[Dict[str, Any]]] = None,
) -> bytes:
    """
    Compiles an official Gram Panchayat Development Plan (GPDP) PDF report
    with predictive infrastructure gap analyses and AI-matched welfare schemes.

    :param gp_name: Name of the Gram Panchayat (e.g. 'Hiware Bazar', 'Punsari').
    :param predictions: Dictionary containing infrastructure projections:
        - target_year (int/str, default: 2028)
        - population_current (int/str)
        - population_projected (int/str)
        - water_supply_current_lpd (float/str)
        - water_demand_projected_lpd (float/str)
        - water_deficit_lpd (float/str)
        - classrooms_current (int/str)
        - classrooms_required (int/str)
        - classroom_gap (int/str)
        - road_coverage_km (float/str)
        - road_gap_km (float/str, optional)
    :param schemes: List of matched government scheme dictionaries:
        - scheme_name / name (str)
        - match_score / match_score_percent (float/int/str)
        - budget_estimate / estimated_budget (str/float/int)
        - ministry / category (str, optional)
    :return: Raw PDF document compiled as bytes (suitable for FastAPI streaming / file response).
    """
    predictions = predictions or {}
    schemes = schemes or []

    buffer = io.BytesIO()

    # Document geometry: A4 (595.27 x 841.89 points) with 0.5 inch (36pt) margins
    margin = 36
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=margin,
        rightMargin=margin,
        topMargin=margin,
        bottomMargin=margin + 18,
    )

    styles = _build_styles()
    elements = []

    usable_width = A4[0] - (2 * margin)  # ~523.27 points
    target_year = predictions.get("target_year", 2028)
    generated_date = datetime.now().strftime("%d %B %Y, %I:%M %p")
    safe_gp_name = (gp_name or "Gram Panchayat").strip()

    # =========================================================================
    # 1. Header Banner (Dark Green #065F46 with Explicit Column Widths)
    # =========================================================================
    banner_left_cells = [
        Paragraph("GRAM PANCHAYAT DEVELOPMENT PLAN (GPDP)", styles["BannerTitle"]),
        Paragraph(
            f"<b>Panchayat:</b> {safe_gp_name.upper()} &nbsp;|&nbsp; <b>Generated:</b> {generated_date}",
            styles["BannerSubtitle"],
        ),
    ]

    banner_right_cells = [
        Paragraph(
            f"PLAN HORIZON<br/><font size=15><b>{target_year}</b></font>",
            styles["BannerBadge"],
        ),
    ]

    header_table_data = [[banner_left_cells, banner_right_cells]]
    col_widths_header = [usable_width * 0.72, usable_width * 0.28]

    header_table = Table(
        header_table_data,
        colWidths=col_widths_header,
    )
    header_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), PRIMARY_DARK),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 12),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
            ("LEFTPADDING", (0, 0), (-1, -1), 14),
            ("RIGHTPADDING", (0, 0), (-1, -1), 14),
            ("ROUNDEDCORNERS", [4, 4, 4, 4]),
        ])
    )
    elements.append(header_table)
    elements.append(Spacer(1, 12))

    # =========================================================================
    # 2. Section 1: Predicted Infrastructure Deficits (Auto-Wrapped Cells)
    # =========================================================================
    elements.append(
        Paragraph("1. Predicted Infrastructure Deficits & Demographics", styles["SectionHeading"])
    )
    elements.append(
        Paragraph(
            f"Predictive infrastructure demand models projected for target planning horizon <b>{target_year}</b>:",
            styles["SubSectionText"],
        )
    )

    # Safe extraction of prediction indicators
    pop_curr = predictions.get("population_current", predictions.get("population", "N/A"))
    pop_proj = predictions.get("population_projected", predictions.get("projected_population", "N/A"))

    water_curr = predictions.get("water_supply_current_lpd", predictions.get("daily_water_supply", "N/A"))
    water_proj = predictions.get("water_demand_projected_lpd", predictions.get("projected_water_demand", "N/A"))
    water_def = predictions.get("water_deficit_lpd", predictions.get("water_deficit", "0"))

    class_curr = predictions.get("classrooms_current", predictions.get("school_classrooms_count", "N/A"))
    class_req = predictions.get("classrooms_required", predictions.get("required_classrooms", "N/A"))
    class_gap = predictions.get("classroom_gap", predictions.get("classrooms_gap", "0"))

    road_curr = predictions.get("road_coverage_km", predictions.get("road_coverage", "N/A"))
    road_gap = predictions.get("road_gap_km", predictions.get("road_deficit_km", "0.0"))

    # Population growth display
    try:
        pop_diff = float(str(pop_proj).replace(",", "")) - float(str(pop_curr).replace(",", ""))
        growth_str = f"+{int(pop_diff):,}" if pop_diff >= 0 else f"{int(pop_diff):,}"
    except (ValueError, TypeError):
        growth_str = "Projected"

    # Road projected display
    try:
        road_proj = float(str(road_curr).replace(",", "")) + float(str(road_gap).replace(",", ""))
        road_proj_str = f"{road_proj:,.2f} km"
    except (ValueError, TypeError):
        road_proj_str = "As per DPR"

    deficit_table_data = [
        [
            Paragraph("Infrastructure Indicator", styles["TableHeader"]),
            Paragraph("Current Baseline", styles["TableHeader"]),
            Paragraph(f"Projected ({target_year})", styles["TableHeader"]),
            Paragraph("Net Deficit / Gap", styles["TableHeader"]),
            Paragraph("Priority Level", styles["TableHeader"]),
        ],
        [
            Paragraph("<b>Total Population</b>", styles["TableCellBold"]),
            Paragraph(f"{_format_numeric_val(pop_curr)} citizens", styles["TableCellCenter"]),
            Paragraph(f"{_format_numeric_val(pop_proj)} citizens", styles["TableCellCenter"]),
            Paragraph(growth_str, styles["TableCellCenter"]),
            Paragraph("<font color='#059669'><b>MONITOR</b></font>", styles["TableCellCenter"]),
        ],
        [
            Paragraph("<b>Daily Potable Water Supply</b>", styles["TableCellBold"]),
            Paragraph(f"{_format_numeric_val(water_curr)} LPD", styles["TableCellCenter"]),
            Paragraph(f"{_format_numeric_val(water_proj)} LPD", styles["TableCellCenter"]),
            Paragraph(f"<b>{_format_deficit_val(water_def, 'LPD')}</b>", styles["DeficitHighlight"]),
            Paragraph("<font color='#DC2626'><b>HIGH</b></font>", styles["TableCellCenter"]),
        ],
        [
            Paragraph("<b>School Classrooms</b>", styles["TableCellBold"]),
            Paragraph(f"{_format_numeric_val(class_curr)} rooms", styles["TableCellCenter"]),
            Paragraph(f"{_format_numeric_val(class_req)} rooms", styles["TableCellCenter"]),
            Paragraph(f"<b>{_format_deficit_val(class_gap, 'rooms')}</b>", styles["DeficitHighlight"]),
            Paragraph("<font color='#D97706'><b>MEDIUM</b></font>", styles["TableCellCenter"]),
        ],
        [
            Paragraph("<b>Paved Road Connectivity</b>", styles["TableCellBold"]),
            Paragraph(f"{_format_numeric_val(road_curr)} km", styles["TableCellCenter"]),
            Paragraph(road_proj_str, styles["TableCellCenter"]),
            Paragraph(
                f"<b>{_format_deficit_val(road_gap, 'km')}</b>",
                styles["DeficitHighlight"] if str(road_gap).replace(".", "").isdigit() and float(str(road_gap)) > 0 else styles["TableCellCenter"],
            ),
            Paragraph("<font color='#D97706'><b>MEDIUM</b></font>", styles["TableCellCenter"]),
        ],
    ]

    col_widths_def = [
        usable_width * 0.32,
        usable_width * 0.17,
        usable_width * 0.17,
        usable_width * 0.19,
        usable_width * 0.15,
    ]

    deficit_table = Table(deficit_table_data, colWidths=col_widths_def, repeatRows=1)
    deficit_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), PRIMARY_DARK),
            ("TEXTCOLOR", (0, 0), (-1, 0), TEXT_LIGHT),
            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 5.5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5.5),
            ("LEFTPADDING", (0, 0), (-1, -1), 7),
            ("RIGHTPADDING", (0, 0), (-1, -1), 7),
            ("GRID", (0, 0), (-1, -1), 0.5, SLATE_BORDER),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, SLATE_ROW_ALT]),
        ])
    )
    elements.append(deficit_table)
    elements.append(Spacer(1, 14))

    # =========================================================================
    # 3. Section 2: Matched Government Welfare Schemes (Auto-Wrapped Cells)
    # =========================================================================
    elements.append(
        Paragraph("2. Matched Government Welfare & Development Schemes", styles["SectionHeading"])
    )
    elements.append(
        Paragraph(
            "AI-powered vector and rule-based matching correlating infrastructure gaps with active Central & State Centrally Sponsored Schemes (CSS):",
            styles["SubSectionText"],
        )
    )

    scheme_table_data = [
        [
            Paragraph("#", styles["TableHeader"]),
            Paragraph("Scheme Name & Sponsoring Ministry", styles["TableHeader"]),
            Paragraph("Relevance Category", styles["TableHeader"]),
            Paragraph("Match Score", styles["TableHeader"]),
            Paragraph("Estimated Budget Allocation", styles["TableHeader"]),
        ]
    ]

    if not schemes:
        scheme_table_data.append([
            Paragraph("—", styles["TableCellCenter"]),
            Paragraph("No targeted welfare schemes matched for the given criteria.", styles["TableCell"]),
            Paragraph("—", styles["TableCellCenter"]),
            Paragraph("—", styles["TableCellCenter"]),
            Paragraph("—", styles["TableCellCenter"]),
        ])
    else:
        for idx, scheme in enumerate(schemes, start=1):
            s_name = scheme.get("scheme_name", scheme.get("name", "Target Scheme"))
            ministry = scheme.get("ministry", scheme.get("department", "Ministry of Panchayati Raj"))
            cat = scheme.get("category", scheme.get("sector", "Infrastructure"))

            # Match Score formatting
            raw_score = scheme.get("match_score", scheme.get("match_score_percent", scheme.get("score", 85)))
            try:
                score_num = float(raw_score)
                score_display = f"{score_num:.1f}%" if score_num <= 100 else f"{score_num}%"
            except (ValueError, TypeError):
                score_display = str(raw_score)

            # Budget formatting
            raw_budget = scheme.get("estimated_budget", scheme.get("budget_estimate", scheme.get("budget", "As per DPR")))
            budget_str = _format_currency_val(raw_budget)

            scheme_title_p = Paragraph(
                f"<b>{s_name}</b><br/><font size=7 color='#475569'>{ministry}</font>",
                styles["TableCell"],
            )

            scheme_table_data.append([
                Paragraph(str(idx), styles["TableCellCenter"]),
                scheme_title_p,
                Paragraph(f"<font color='#065F46'><b>{cat}</b></font>", styles["TableCell"]),
                Paragraph(f"<b>{score_display}</b>", styles["ScoreBadge"]),
                Paragraph(f"<b>{budget_str}</b>", styles["TableCellCenter"]),
            ])

    col_widths_schemes = [
        usable_width * 0.06,
        usable_width * 0.40,
        usable_width * 0.20,
        usable_width * 0.14,
        usable_width * 0.20,
    ]

    schemes_table = Table(scheme_table_data, colWidths=col_widths_schemes, repeatRows=1)
    schemes_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), PRIMARY_DARK),
            ("TEXTCOLOR", (0, 0), (-1, 0), TEXT_LIGHT),
            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 5.5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5.5),
            ("LEFTPADDING", (0, 0), (-1, -1), 7),
            ("RIGHTPADDING", (0, 0), (-1, -1), 7),
            ("GRID", (0, 0), (-1, -1), 0.5, SLATE_BORDER),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, SLATE_ROW_ALT]),
        ])
    )
    elements.append(schemes_table)
    elements.append(Spacer(1, 14))

    # =========================================================================
    # 4. Sign-off & Adoption Block (Gram Sabha Verification)
    # =========================================================================
    sign_block = [
        Paragraph(
            "<b>Plan Adoption & Authorization:</b> This Gram Panchayat Development Plan has been compiled using AI predictive infrastructure models and validated against public grievance telemetry for presentation to the Gram Sabha.",
            styles["NoticeText"],
        ),
        Spacer(1, 14),
        Table(
            [
                [
                    Paragraph("____________________________<br/><b>Gram Pradhan / Sarpanch</b>", styles["TableCellCenter"]),
                    Paragraph("____________________________<br/><b>Panchayat Secretary (VDO)</b>", styles["TableCellCenter"]),
                    Paragraph("____________________________<br/><b>District Planning Officer</b>", styles["TableCellCenter"]),
                ]
            ],
            colWidths=[usable_width / 3.0] * 3,
        ),
    ]

    elements.append(KeepTogether(sign_block))

    # Build Document using NumberedCanvas
    doc.build(elements, canvasmaker=NumberedCanvas)

    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes


# ---------------------------------------------------------------------------
# Self-Test / Verification Routine
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    sample_predictions = {
        "target_year": 2028,
        "population_current": 5800,
        "population_projected": 6450,
        "water_supply_current_lpd": 320000.0,
        "water_demand_projected_lpd": 387000.0,
        "water_deficit_lpd": 67000.0,
        "classrooms_current": 28,
        "classrooms_required": 34,
        "classroom_gap": 6,
        "road_coverage_km": 26.0,
        "road_gap_km": 4.5,
    }

    sample_schemes = [
        {
            "scheme_name": "Jal Jeevan Mission (JJM)",
            "ministry": "Ministry of Jal Shakti",
            "category": "Water Supply",
            "match_score": 96.4,
            "estimated_budget": "45.00 Lakhs",
        },
        {
            "scheme_name": "PM SHRI Schools Scheme",
            "ministry": "Ministry of Education",
            "category": "Education",
            "match_score": 91.8,
            "estimated_budget": "28.50 Lakhs",
        },
        {
            "scheme_name": "Pradhan Mantri Gram Sadak Yojana (PMGSY)",
            "ministry": "Ministry of Rural Development",
            "category": "Roads & Connectivity",
            "match_score": 88.2,
            "estimated_budget": "54.00 Lakhs",
        },
        {
            "scheme_name": "Swachh Bharat Mission (Grameen) Phase-II",
            "ministry": "Ministry of Jal Shakti",
            "category": "Sanitation",
            "match_score": 84.0,
            "estimated_budget": "15.00 Lakhs",
        },
    ]

    pdf_out = generate_gpdp_pdf(
        gp_name="Punsari",
        predictions=sample_predictions,
        schemes=sample_schemes,
    )

    output_filename = "test_gpdp_plan.pdf"
    with open(output_filename, "wb") as f:
        f.write(pdf_out)
    print(f"[SUCCESS] Test GPDP PDF compiled successfully ({len(pdf_out):,} bytes) -> {output_filename}")
