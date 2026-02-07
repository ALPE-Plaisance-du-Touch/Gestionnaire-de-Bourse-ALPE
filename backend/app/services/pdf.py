"""PDF generation service for item lists."""

from datetime import datetime
from decimal import Decimal
from io import BytesIO
from typing import TYPE_CHECKING

from weasyprint import HTML

if TYPE_CHECKING:
    from app.models import ItemList

# Category labels in French
CATEGORY_LABELS = {
    "clothing": "Vêtements",
    "shoes": "Chaussures",
    "nursery": "Puériculture",
    "toys": "Jouets",
    "books": "Livres",
    "accessories": "Accessoires",
    "other": "Autres",
}

# List type labels
LIST_TYPE_LABELS = {
    "standard": "Standard",
    "list_1000": "Liste 1000 (Adhérent ALPE)",
    "list_2000": "Liste 2000 (Famille/Amis)",
}


def format_price(price: Decimal) -> str:
    """Format price in euros."""
    return f"{price:.2f} €"


def generate_list_pdf(item_list: "ItemList", depositor_name: str) -> bytes:
    """Generate a PDF for an item list.

    Args:
        item_list: The item list with articles loaded
        depositor_name: Name of the depositor

    Returns:
        PDF content as bytes
    """
    # Sort articles by line number
    articles = sorted(item_list.articles, key=lambda a: a.line_number)

    # Calculate totals
    total_value = sum(a.price for a in articles)
    clothing_count = sum(1 for a in articles if a.category == "clothing")

    # Build articles table rows
    article_rows = ""
    for article in articles:
        category_label = CATEGORY_LABELS.get(article.category, article.category)
        lot_info = f" (lot de {article.lot_quantity})" if article.is_lot else ""
        size_info = f" - {article.size}" if article.size else ""

        article_rows += f"""
        <tr>
            <td class="line-num">{article.line_number}</td>
            <td class="category">{category_label}</td>
            <td class="description">{article.description}{lot_info}{size_info}</td>
            <td class="price">{format_price(article.price)}</td>
        </tr>
        """

    # Status label
    status_labels = {
        "draft": "Brouillon",
        "validated": "Validée",
        "checked_in": "Déposée",
        "retrieved": "Récupérée",
    }
    status_label = status_labels.get(item_list.status, item_list.status)

    # List type label
    list_type_label = LIST_TYPE_LABELS.get(item_list.list_type, item_list.list_type)

    # Format dates
    created_date = item_list.created_at.strftime("%d/%m/%Y") if item_list.created_at else "-"
    validated_date = item_list.validated_at.strftime("%d/%m/%Y à %H:%M") if item_list.validated_at else "-"
    generated_date = datetime.now().strftime("%d/%m/%Y à %H:%M")

    # Build HTML
    html_content = f"""
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <title>Liste n°{item_list.number}</title>
        <style>
            @page {{
                size: A4;
                margin: 1.5cm;
            }}
            body {{
                font-family: Arial, Helvetica, sans-serif;
                font-size: 10pt;
                line-height: 1.4;
                color: #333;
            }}
            .header {{
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 2px solid #2563eb;
            }}
            .title {{
                font-size: 18pt;
                font-weight: bold;
                color: #1e40af;
                margin: 0;
            }}
            .subtitle {{
                font-size: 11pt;
                color: #666;
                margin-top: 5px;
            }}
            .list-number {{
                font-size: 24pt;
                font-weight: bold;
                color: #2563eb;
                text-align: right;
            }}
            .info-grid {{
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
                margin-bottom: 20px;
            }}
            .info-box {{
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 6px;
                padding: 12px;
            }}
            .info-label {{
                font-size: 9pt;
                color: #64748b;
                text-transform: uppercase;
                margin-bottom: 4px;
            }}
            .info-value {{
                font-size: 11pt;
                font-weight: 600;
                color: #1e293b;
            }}
            .stats-row {{
                display: flex;
                gap: 20px;
                margin-bottom: 20px;
            }}
            .stat-box {{
                flex: 1;
                background: #eff6ff;
                border: 1px solid #bfdbfe;
                border-radius: 6px;
                padding: 10px;
                text-align: center;
            }}
            .stat-value {{
                font-size: 16pt;
                font-weight: bold;
                color: #2563eb;
            }}
            .stat-label {{
                font-size: 9pt;
                color: #64748b;
            }}
            table {{
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
            }}
            th {{
                background: #1e40af;
                color: white;
                padding: 10px 8px;
                text-align: left;
                font-size: 9pt;
                text-transform: uppercase;
            }}
            td {{
                padding: 8px;
                border-bottom: 1px solid #e2e8f0;
                font-size: 10pt;
            }}
            tr:nth-child(even) {{
                background: #f8fafc;
            }}
            .line-num {{
                width: 40px;
                text-align: center;
                font-weight: 600;
                color: #64748b;
            }}
            .category {{
                width: 100px;
                color: #475569;
            }}
            .description {{
                color: #1e293b;
            }}
            .price {{
                width: 70px;
                text-align: right;
                font-weight: 600;
                color: #059669;
            }}
            .footer {{
                margin-top: 30px;
                padding-top: 15px;
                border-top: 1px solid #e2e8f0;
                font-size: 8pt;
                color: #94a3b8;
                text-align: center;
            }}
            .status-badge {{
                display: inline-block;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 9pt;
                font-weight: 600;
            }}
            .status-validated {{
                background: #dcfce7;
                color: #166534;
            }}
            .status-draft {{
                background: #fef3c7;
                color: #92400e;
            }}
            .total-row {{
                background: #f0fdf4 !important;
                font-weight: bold;
            }}
            .total-row td {{
                border-top: 2px solid #22c55e;
                padding-top: 12px;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <div>
                <h1 class="title">Bourse aux Vêtements ALPE</h1>
                <p class="subtitle">Plaisance du Touch</p>
            </div>
            <div class="list-number">
                Liste n°{item_list.number}
            </div>
        </div>

        <div class="info-grid">
            <div class="info-box">
                <div class="info-label">Déposant</div>
                <div class="info-value">{depositor_name}</div>
            </div>
            <div class="info-box">
                <div class="info-label">Type de liste</div>
                <div class="info-value">{list_type_label}</div>
            </div>
            <div class="info-box">
                <div class="info-label">Statut</div>
                <div class="info-value">
                    <span class="status-badge status-{'validated' if item_list.status == 'validated' else 'draft'}">
                        {status_label}
                    </span>
                </div>
            </div>
            <div class="info-box">
                <div class="info-label">Date de validation</div>
                <div class="info-value">{validated_date}</div>
            </div>
        </div>

        <div class="stats-row">
            <div class="stat-box">
                <div class="stat-value">{len(articles)}</div>
                <div class="stat-label">Articles</div>
            </div>
            <div class="stat-box">
                <div class="stat-value">{clothing_count}</div>
                <div class="stat-label">Vêtements</div>
            </div>
            <div class="stat-box">
                <div class="stat-value">{format_price(total_value)}</div>
                <div class="stat-label">Valeur totale</div>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>N°</th>
                    <th>Catégorie</th>
                    <th>Description</th>
                    <th style="text-align: right">Prix</th>
                </tr>
            </thead>
            <tbody>
                {article_rows}
                <tr class="total-row">
                    <td colspan="3" style="text-align: right">Total</td>
                    <td class="price">{format_price(total_value)}</td>
                </tr>
            </tbody>
        </table>

        <div class="footer">
            Document généré le {generated_date} — Liste créée le {created_date}<br>
            Ce document est un récapitulatif de votre liste d'articles.
            Conservez-le précieusement pour le jour du dépôt.
        </div>
    </body>
    </html>
    """

    # Generate PDF
    html = HTML(string=html_content)
    pdf_buffer = BytesIO()
    html.write_pdf(pdf_buffer)

    return pdf_buffer.getvalue()
