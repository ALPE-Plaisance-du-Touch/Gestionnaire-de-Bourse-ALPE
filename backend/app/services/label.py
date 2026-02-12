"""Label generation service for item lists with QR codes."""

import base64
from datetime import datetime
from decimal import Decimal
from io import BytesIO
from itertools import groupby
from operator import attrgetter
from typing import TYPE_CHECKING

import qrcode
from qrcode.constants import ERROR_CORRECT_M
from weasyprint import HTML

if TYPE_CHECKING:
    from app.models import Edition, ItemList

# Category labels in French
CATEGORY_LABELS = {
    "clothing": "Vetements",
    "shoes": "Chaussures",
    "nursery": "Puericulture",
    "toys": "Jouets",
    "games": "Jeux",
    "books": "Livres",
    "accessories": "Accessoires",
    "stroller": "Poussette",
    "car_seat": "Siege auto",
    "other": "Autres",
}

# Label color name to hex CSS mapping
LABEL_COLOR_HEX = {
    "sky_blue": "#87CEEB",
    "yellow": "#FFD700",
    "fuchsia": "#FF69B4",
    "lilac": "#C8A2C8",
    "mint_green": "#98FF98",
    "orange": "#FF8C00",
    "white": "#FFFFFF",
    "pink": "#FFB6C1",
}

# Text color for readability on colored backgrounds
LABEL_TEXT_COLOR = {
    "sky_blue": "#000",
    "yellow": "#000",
    "fuchsia": "#000",
    "lilac": "#000",
    "mint_green": "#000",
    "orange": "#000",
    "white": "#000",
    "pink": "#000",
}


def generate_label_code(edition_id: str, list_number: int, line_number: int) -> str:
    """Generate unique label code for an article.

    Format: EDI-{edition_id first 8 chars}-L{list_number}-A{line_number:02d}
    Example: EDI-a1b2c3d4-L245-A03
    """
    return f"EDI-{edition_id[:8]}-L{list_number}-A{line_number:02d}"


def generate_qr_code(code: str) -> str:
    """Generate a QR code as base64-encoded PNG.

    Args:
        code: The text to encode in the QR code

    Returns:
        Base64-encoded PNG string for use in HTML img src
    """
    qr = qrcode.QRCode(
        version=3,
        error_correction=ERROR_CORRECT_M,
        box_size=8,
        border=2,
    )
    qr.add_data(code)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)

    return base64.b64encode(buffer.getvalue()).decode("utf-8")


def get_label_color_hex(label_color: str | None) -> str:
    """Get hex color from label color name."""
    if not label_color:
        return "#FFFFFF"
    return LABEL_COLOR_HEX.get(label_color, "#FFFFFF")


def format_price(price: Decimal) -> str:
    """Format price in euros."""
    return f"{price:.2f}\u00a0\u20ac"


def _truncate(text: str, max_length: int = 50) -> str:
    """Truncate text to max_length characters."""
    if len(text) <= max_length:
        return text
    return text[: max_length - 3] + "..."


def _format_slot_label(slot) -> str:
    """Format a deposit slot as readable label."""
    if not slot:
        return "Non attribue"
    start = slot.start_datetime
    end = slot.end_datetime
    days = {
        0: "Lundi",
        1: "Mardi",
        2: "Mercredi",
        3: "Jeudi",
        4: "Vendredi",
        5: "Samedi",
        6: "Dimanche",
    }
    day_name = days.get(start.weekday(), "")
    return f"{day_name} {start.strftime('%Hh%M')}-{end.strftime('%Hh%M')}"


def _build_cover_page_html(
    edition: "Edition",
    lists: list["ItemList"],
    slot_label: str | None,
) -> str:
    """Build the cover page HTML with depositor summary."""
    # Group lists by depositor
    depositors = {}
    for item_list in lists:
        dep = item_list.depositor
        dep_key = dep.id
        if dep_key not in depositors:
            depositors[dep_key] = {
                "name": f"{dep.first_name} {dep.last_name}",
                "lists": [],
                "total_articles": 0,
            }
        depositors[dep_key]["lists"].append(item_list.number)
        depositors[dep_key]["total_articles"] += len(item_list.articles)

    total_labels = sum(len(il.articles) for il in lists)

    depositor_rows = ""
    for i, (_, dep_info) in enumerate(sorted(depositors.items(), key=lambda x: x[1]["name"]), 1):
        list_nums = ", ".join(str(n) for n in dep_info["lists"])
        depositor_rows += f"""
        <tr>
            <td style="text-align:center">{i}</td>
            <td>{dep_info['name']}</td>
            <td style="text-align:center">{list_nums}</td>
            <td style="text-align:center">{dep_info['total_articles']}</td>
        </tr>
        """

    slot_info = f"<p class='slot-info'>Creneau : {slot_label}</p>" if slot_label else ""

    return f"""
    <div class="cover-page">
        <h1>Bourse aux Vetements ALPE</h1>
        <h2>{edition.name}</h2>
        {slot_info}
        <div class="cover-stats">
            <div class="cover-stat">
                <span class="cover-stat-value">{len(depositors)}</span>
                <span class="cover-stat-label">Deposants</span>
            </div>
            <div class="cover-stat">
                <span class="cover-stat-value">{len(lists)}</span>
                <span class="cover-stat-label">Listes</span>
            </div>
            <div class="cover-stat">
                <span class="cover-stat-value">{total_labels}</span>
                <span class="cover-stat-label">Etiquettes</span>
            </div>
        </div>
        <table class="cover-table">
            <thead>
                <tr>
                    <th style="width:40px">#</th>
                    <th>Deposant</th>
                    <th style="width:120px">Liste(s)</th>
                    <th style="width:80px">Articles</th>
                </tr>
            </thead>
            <tbody>
                {depositor_rows}
            </tbody>
        </table>
        <p class="cover-footer">
            Document genere le {datetime.now().strftime('%d/%m/%Y a %H:%M')}
        </p>
    </div>
    """


def _build_separator_page_html(
    depositor_name: str,
    lists: list["ItemList"],
    slot_label: str | None,
) -> str:
    """Build a separator page for a depositor."""
    total_articles = sum(len(il.articles) for il in lists)
    total_clothing = sum(
        sum(1 for a in il.articles if a.is_clothing) for il in lists
    )
    list_numbers = ", ".join(f"Liste {il.number}" for il in lists)

    slot_info = f"<p><strong>Creneau de depot :</strong> {slot_label}</p>" if slot_label else ""

    return f"""
    <div class="separator-page">
        <h1 class="separator-name">{depositor_name}</h1>
        <p class="separator-lists">{list_numbers}</p>
        {slot_info}
        <p class="separator-count">
            {total_articles} articles (dont {total_clothing} vetements)
        </p>
        <div class="separator-instructions">
            <p class="instructions-title">Pochette transparente a remettre au deposant contenant :</p>
            <ol>
                <li>Cette liste d'articles imprimee</li>
                <li>Les etiquettes decoupees ci-apres</li>
                <li>Diriger vers la table d'enregistrement</li>
            </ol>
        </div>
        <div class="separator-checkbox">
            <span class="checkbox-box"></span>
            Pochette preparee par : __________________ le ____/____/________
        </div>
    </div>
    """


def _build_article_list_html(item_list: "ItemList") -> str:
    """Build printable article list for a list."""
    articles = sorted(item_list.articles, key=lambda a: a.line_number)
    total_value = sum(a.price for a in articles)

    rows = ""
    for article in articles:
        cat_label = CATEGORY_LABELS.get(article.category, article.category)
        size_info = article.size or ""
        lot_info = f" (lot de {article.lot_quantity})" if article.is_lot else ""

        rows += f"""
        <tr>
            <td style="text-align:center">{article.line_number}</td>
            <td>{cat_label}</td>
            <td>{article.description}{lot_info}</td>
            <td>{size_info}</td>
            <td style="text-align:right">{format_price(article.price)}</td>
        </tr>
        """

    depositor = item_list.depositor
    depositor_name = f"{depositor.first_name} {depositor.last_name}"

    return f"""
    <div class="article-list-page">
        <h2>Liste des articles - {depositor_name} - Liste {item_list.number}</h2>
        <table class="article-table">
            <thead>
                <tr>
                    <th style="width:40px">N</th>
                    <th style="width:100px">Categorie</th>
                    <th>Description</th>
                    <th style="width:60px">Taille</th>
                    <th style="width:70px;text-align:right">Prix</th>
                </tr>
            </thead>
            <tbody>
                {rows}
                <tr class="total-row">
                    <td colspan="4" style="text-align:right"><strong>Total : {len(articles)} articles</strong></td>
                    <td style="text-align:right"><strong>{format_price(total_value)}</strong></td>
                </tr>
            </tbody>
        </table>
        <p class="article-list-note">A remettre au deposant dans la pochette transparente</p>
    </div>
    """


def _build_labels_html(item_list: "ItemList", edition_id: str) -> str:
    """Build label pages for a list (12 labels per page, 3x4 grid)."""
    articles = sorted(item_list.articles, key=lambda a: a.line_number)
    total_articles = len(articles)
    bg_color = get_label_color_hex(item_list.label_color)

    labels_html = ""
    for i, article in enumerate(articles):
        label_code = generate_label_code(edition_id, item_list.number, article.line_number)
        qr_base64 = generate_qr_code(label_code)
        cat_label = CATEGORY_LABELS.get(article.category, article.category)
        desc = _truncate(article.description, 50)

        # Start a new grid every 12 labels
        if i % 12 == 0:
            if i > 0:
                labels_html += "</div>"  # close previous grid
            labels_html += '<div class="label-grid">'

        labels_html += f"""
        <div class="label" style="background-color: {bg_color};">
            <div class="label-top">
                <img class="label-qr" src="data:image/png;base64,{qr_base64}" alt="{label_code}">
                <div class="label-top-right">
                    <div class="label-list-number">Liste {item_list.number}</div>
                    <div class="label-article-num">Article {article.line_number}/{total_articles}</div>
                </div>
            </div>
            <div class="label-price">{format_price(article.price)}</div>
            <div class="label-desc">{desc}</div>
            <div class="label-bottom">
                <span class="label-category">{cat_label}</span>
                <span class="label-code">{label_code}</span>
            </div>
        </div>
        """

    if articles:
        labels_html += "</div>"  # close last grid

    return labels_html


def generate_labels_pdf(
    lists: list["ItemList"],
    edition: "Edition",
    slot_label: str | None = None,
) -> bytes:
    """Generate a complete labels PDF for the given lists.

    The PDF contains:
    1. Cover page with depositor summary
    2. For each depositor:
       a. Separator page with instructions
       b. Printable article list per list
       c. Label pages (12 per page, 3x4 grid)

    Args:
        lists: Validated item lists with articles and depositors loaded
        edition: The edition
        slot_label: Optional slot description for the cover page

    Returns:
        PDF content as bytes
    """
    if not lists:
        return b""

    # Build cover page
    body_html = _build_cover_page_html(edition, lists, slot_label)

    # Group lists by depositor, sorted by depositor name
    sorted_lists = sorted(lists, key=lambda il: (il.depositor.last_name, il.depositor.first_name, il.number))

    for dep_id, dep_lists_iter in groupby(sorted_lists, key=attrgetter("depositor_id")):
        dep_lists = list(dep_lists_iter)
        depositor = dep_lists[0].depositor
        depositor_name = f"{depositor.first_name} {depositor.last_name}"

        # Separator page
        body_html += _build_separator_page_html(depositor_name, dep_lists, slot_label)

        # Article list + labels for each list
        for item_list in dep_lists:
            body_html += _build_article_list_html(item_list)
            body_html += _build_labels_html(item_list, edition.id)

    html_content = f"""
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <title>Etiquettes - {edition.name}</title>
        <style>
            @page {{
                size: A4 portrait;
                margin: 10mm;
            }}

            body {{
                font-family: Arial, Helvetica, sans-serif;
                font-size: 10pt;
                color: #333;
                margin: 0;
                padding: 0;
            }}

            /* ===== COVER PAGE ===== */
            .cover-page {{
                page-break-after: always;
                text-align: center;
                padding-top: 30mm;
            }}
            .cover-page h1 {{
                font-size: 24pt;
                color: #1e40af;
                margin-bottom: 5mm;
            }}
            .cover-page h2 {{
                font-size: 16pt;
                color: #475569;
                margin-bottom: 10mm;
            }}
            .slot-info {{
                font-size: 14pt;
                color: #2563eb;
                margin-bottom: 10mm;
            }}
            .cover-stats {{
                display: flex;
                justify-content: center;
                gap: 15mm;
                margin-bottom: 15mm;
            }}
            .cover-stat {{
                text-align: center;
            }}
            .cover-stat-value {{
                display: block;
                font-size: 28pt;
                font-weight: bold;
                color: #2563eb;
            }}
            .cover-stat-label {{
                font-size: 10pt;
                color: #64748b;
            }}
            .cover-table {{
                width: 80%;
                margin: 0 auto;
                border-collapse: collapse;
                text-align: left;
            }}
            .cover-table th {{
                background: #1e40af;
                color: white;
                padding: 6px 10px;
                font-size: 9pt;
                text-transform: uppercase;
            }}
            .cover-table td {{
                padding: 5px 10px;
                border-bottom: 1px solid #e2e8f0;
                font-size: 9pt;
            }}
            .cover-table tr:nth-child(even) {{
                background: #f8fafc;
            }}
            .cover-footer {{
                margin-top: 15mm;
                font-size: 8pt;
                color: #94a3b8;
            }}

            /* ===== SEPARATOR PAGE ===== */
            .separator-page {{
                page-break-before: always;
                page-break-after: always;
                text-align: center;
                padding-top: 50mm;
            }}
            .separator-name {{
                font-size: 28pt;
                color: #1e293b;
                margin-bottom: 10mm;
            }}
            .separator-lists {{
                font-size: 16pt;
                color: #2563eb;
                margin-bottom: 5mm;
            }}
            .separator-count {{
                font-size: 14pt;
                color: #475569;
                margin-bottom: 15mm;
            }}
            .separator-instructions {{
                background: #f0f9ff;
                border: 1px solid #bae6fd;
                border-radius: 6px;
                padding: 15px 25px;
                text-align: left;
                max-width: 120mm;
                margin: 0 auto 15mm auto;
            }}
            .instructions-title {{
                font-weight: bold;
                margin-bottom: 5px;
            }}
            .separator-instructions ol {{
                margin: 5px 0;
                padding-left: 20px;
            }}
            .separator-instructions li {{
                margin-bottom: 4px;
            }}
            .separator-checkbox {{
                font-size: 11pt;
                margin-top: 15mm;
            }}
            .checkbox-box {{
                display: inline-block;
                width: 14px;
                height: 14px;
                border: 2px solid #333;
                margin-right: 8px;
                vertical-align: middle;
            }}

            /* ===== ARTICLE LIST ===== */
            .article-list-page {{
                page-break-before: always;
                page-break-after: always;
            }}
            .article-list-page h2 {{
                font-size: 13pt;
                color: #1e40af;
                margin-bottom: 8mm;
                border-bottom: 2px solid #2563eb;
                padding-bottom: 3mm;
            }}
            .article-table {{
                width: 100%;
                border-collapse: collapse;
            }}
            .article-table th {{
                background: #1e40af;
                color: white;
                padding: 6px 8px;
                font-size: 9pt;
                text-transform: uppercase;
                text-align: left;
            }}
            .article-table td {{
                padding: 5px 8px;
                border-bottom: 1px solid #e2e8f0;
                font-size: 9pt;
            }}
            .article-table tr:nth-child(even) {{
                background: #f8fafc;
            }}
            .total-row {{
                background: #f0fdf4 !important;
            }}
            .total-row td {{
                border-top: 2px solid #22c55e;
                padding-top: 8px;
            }}
            .article-list-note {{
                margin-top: 8mm;
                font-size: 8pt;
                color: #64748b;
                font-style: italic;
                text-align: center;
            }}

            /* ===== LABEL GRID ===== */
            .label-grid {{
                page-break-before: always;
                display: grid;
                grid-template-columns: repeat(3, 70mm);
                grid-template-rows: repeat(4, 74mm);
                gap: 0;
                width: 210mm;
                justify-content: center;
            }}

            .label {{
                width: 70mm;
                height: 74mm;
                border: 1px dashed #999;
                box-sizing: border-box;
                padding: 3mm;
                overflow: hidden;
                page-break-inside: avoid;
            }}

            .label-top {{
                display: flex;
                gap: 3mm;
                margin-bottom: 2mm;
                height: 27mm;
            }}

            .label-qr {{
                width: 25mm;
                height: 25mm;
            }}

            .label-top-right {{
                flex: 1;
            }}

            .label-list-number {{
                font-size: 14pt;
                font-weight: bold;
                color: #1e293b;
                margin-bottom: 2mm;
            }}

            .label-article-num {{
                font-size: 9pt;
                color: #475569;
            }}

            .label-price {{
                font-size: 18pt;
                font-weight: bold;
                text-align: center;
                margin-bottom: 2mm;
                color: #1e293b;
            }}

            .label-desc {{
                font-size: 8pt;
                color: #334155;
                text-align: center;
                margin-bottom: 2mm;
                line-height: 1.2;
                height: 10mm;
                overflow: hidden;
            }}

            .label-bottom {{
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
                font-size: 7pt;
            }}

            .label-category {{
                color: #475569;
                font-weight: 600;
            }}

            .label-code {{
                color: #94a3b8;
                font-family: monospace;
                font-size: 6pt;
            }}
        </style>
    </head>
    <body>
        {body_html}
    </body>
    </html>
    """

    html = HTML(string=html_content)
    pdf_buffer = BytesIO()
    html.write_pdf(pdf_buffer)

    return pdf_buffer.getvalue()
