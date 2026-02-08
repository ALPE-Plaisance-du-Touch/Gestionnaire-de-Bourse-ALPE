"""PDF generation service for payout receipts (bordereaux de reversement)."""

from datetime import datetime
from decimal import Decimal
from io import BytesIO
from typing import TYPE_CHECKING

from weasyprint import HTML

if TYPE_CHECKING:
    from app.models import Edition
    from app.models.payout import Payout

CATEGORY_LABELS = {
    "clothing": "Vetements",
    "shoes": "Chaussures",
    "nursery": "Puericulture",
    "toys": "Jouets",
    "books": "Livres",
    "accessories": "Accessoires",
    "other": "Autres",
}

LIST_TYPE_LABELS = {
    "standard": "Standard",
    "list_1000": "Liste 1000 (Adherent ALPE)",
    "list_2000": "Liste 2000 (Famille/Amis)",
}


def format_price(price: Decimal) -> str:
    return f"{price:.2f} EUR"


def _generate_receipt_html(payout: "Payout", edition: "Edition") -> str:
    item_list = payout.item_list
    depositor = payout.depositor
    depositor_name = f"{depositor.first_name} {depositor.last_name}"
    list_type_label = LIST_TYPE_LABELS.get(item_list.list_type, item_list.list_type)
    generated_date = datetime.now().strftime("%d/%m/%Y a %H:%M")
    edition_name = edition.name if hasattr(edition, "name") else "Edition"

    articles = sorted(item_list.articles, key=lambda a: a.line_number)
    sold_articles = [a for a in articles if a.status == "sold"]
    unsold_articles = [a for a in articles if a.status != "sold"]

    # Build sold articles rows
    sold_rows = ""
    for article in sold_articles:
        cat = CATEGORY_LABELS.get(article.category, article.category)
        sold_rows += f"""
        <tr>
            <td class="line-num">{article.line_number}</td>
            <td>{article.description}</td>
            <td>{cat}</td>
            <td class="price">{format_price(article.price)}</td>
        </tr>"""

    # Build unsold articles rows
    unsold_rows = ""
    for article in unsold_articles:
        cat = CATEGORY_LABELS.get(article.category, article.category)
        unsold_rows += f"""
        <tr>
            <td class="line-num">{article.line_number}</td>
            <td>{article.description}</td>
            <td>{cat}</td>
            <td class="price">{format_price(article.price)}</td>
        </tr>"""

    # Zero sales message
    zero_sales_msg = ""
    if payout.sold_articles == 0:
        zero_sales_msg = """
        <div class="info-message">
            Aucun article vendu. Seuls les invendus sont a recuperer.
        </div>"""

    # All sold message
    all_sold_msg = ""
    if payout.sold_articles == payout.total_articles and payout.total_articles > 0:
        all_sold_msg = """
        <div class="success-message">
            Felicitations, tous vos articles ont trouve preneur !
        </div>"""

    # Sold articles table
    sold_table = ""
    if sold_articles:
        sold_table = f"""
        <h2>Articles vendus ({len(sold_articles)})</h2>
        <table>
            <thead>
                <tr>
                    <th>N</th>
                    <th>Description</th>
                    <th>Categorie</th>
                    <th style="text-align: right">Prix de vente</th>
                </tr>
            </thead>
            <tbody>
                {sold_rows}
                <tr class="total-row">
                    <td colspan="3" style="text-align: right">Total ventes</td>
                    <td class="price">{format_price(payout.gross_amount)}</td>
                </tr>
            </tbody>
        </table>"""

    # Unsold articles table
    unsold_table = ""
    if unsold_articles:
        unsold_value = sum(a.price for a in unsold_articles)
        unsold_table = f"""
        <h2>Articles invendus ({len(unsold_articles)})</h2>
        <table>
            <thead>
                <tr>
                    <th>N</th>
                    <th>Description</th>
                    <th>Categorie</th>
                    <th style="text-align: right">Prix demande</th>
                </tr>
            </thead>
            <tbody>
                {unsold_rows}
                <tr class="total-row">
                    <td colspan="3" style="text-align: right">Valeur invendus</td>
                    <td class="price">{format_price(unsold_value)}</td>
                </tr>
            </tbody>
        </table>"""

    # Fee label
    fee_label = ""
    if payout.list_fees > 0:
        fee_label = f"""
            <tr>
                <td>Frais de liste ({list_type_label})</td>
                <td class="price">- {format_price(payout.list_fees)}</td>
            </tr>"""

    html = f"""
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <title>Bordereau de reversement - Liste {item_list.number}</title>
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
                text-align: center;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 3px solid #1e40af;
            }}
            .header h1 {{
                font-size: 16pt;
                color: #1e40af;
                margin: 0 0 5px 0;
            }}
            .header .edition {{
                font-size: 12pt;
                color: #475569;
            }}
            .header .date {{
                font-size: 9pt;
                color: #94a3b8;
                margin-top: 5px;
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
            h2 {{
                font-size: 12pt;
                color: #1e40af;
                margin: 20px 0 10px 0;
                padding-bottom: 5px;
                border-bottom: 1px solid #bfdbfe;
            }}
            table {{
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 15px;
            }}
            th {{
                background: #1e40af;
                color: white;
                padding: 8px 6px;
                text-align: left;
                font-size: 9pt;
                text-transform: uppercase;
            }}
            td {{
                padding: 6px;
                border-bottom: 1px solid #e2e8f0;
                font-size: 9pt;
            }}
            tr:nth-child(even) {{
                background: #f8fafc;
            }}
            .line-num {{
                width: 30px;
                text-align: center;
                font-weight: 600;
                color: #64748b;
            }}
            .price {{
                width: 80px;
                text-align: right;
                font-weight: 600;
            }}
            .total-row {{
                background: #f0fdf4 !important;
                font-weight: bold;
            }}
            .total-row td {{
                border-top: 2px solid #22c55e;
                padding-top: 10px;
            }}
            .calculation-box {{
                background: #eff6ff;
                border: 2px solid #2563eb;
                border-radius: 8px;
                padding: 15px;
                margin: 20px 0;
            }}
            .calculation-box h2 {{
                margin-top: 0;
                border: none;
            }}
            .calc-table {{
                width: 100%;
                border-collapse: collapse;
            }}
            .calc-table td {{
                padding: 8px 6px;
                border: none;
                font-size: 10pt;
            }}
            .calc-table .net-row td {{
                border-top: 2px solid #2563eb;
                font-size: 14pt;
                font-weight: bold;
                color: #1e40af;
                padding-top: 12px;
            }}
            .payment-section {{
                border: 1px solid #e2e8f0;
                border-radius: 6px;
                padding: 15px;
                margin-top: 20px;
            }}
            .payment-section h2 {{
                margin-top: 0;
                border: none;
            }}
            .checkbox-line {{
                margin: 8px 0;
                font-size: 10pt;
            }}
            .signature-line {{
                margin: 15px 0;
                display: flex;
                justify-content: space-between;
            }}
            .signature-box {{
                width: 45%;
            }}
            .signature-box .label {{
                font-size: 9pt;
                color: #64748b;
                margin-bottom: 25px;
            }}
            .signature-box .line {{
                border-bottom: 1px solid #333;
            }}
            .legal-notice {{
                margin-top: 15px;
                font-size: 8pt;
                color: #64748b;
                font-style: italic;
            }}
            .info-message {{
                background: #eff6ff;
                border: 1px solid #bfdbfe;
                border-radius: 6px;
                padding: 12px;
                color: #1e40af;
                margin: 15px 0;
                font-size: 10pt;
            }}
            .success-message {{
                background: #f0fdf4;
                border: 1px solid #bbf7d0;
                border-radius: 6px;
                padding: 12px;
                color: #166534;
                margin: 15px 0;
                font-size: 10pt;
            }}
            .footer {{
                margin-top: 30px;
                padding-top: 10px;
                border-top: 1px solid #e2e8f0;
                font-size: 8pt;
                color: #94a3b8;
                text-align: center;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>BORDEREAU DE REVERSEMENT</h1>
            <div class="edition">{edition_name}</div>
            <div class="date">Genere le {generated_date}</div>
        </div>

        <div class="info-grid">
            <div class="info-box">
                <div class="info-label">Deposant</div>
                <div class="info-value">{depositor_name}</div>
            </div>
            <div class="info-box">
                <div class="info-label">Liste N</div>
                <div class="info-value">{item_list.number} ({list_type_label})</div>
            </div>
            <div class="info-box">
                <div class="info-label">Articles deposes</div>
                <div class="info-value">{payout.total_articles}</div>
            </div>
            <div class="info-box">
                <div class="info-label">Articles vendus / invendus</div>
                <div class="info-value">{payout.sold_articles} / {payout.unsold_articles}</div>
            </div>
        </div>

        {zero_sales_msg}
        {all_sold_msg}

        {sold_table}
        {unsold_table}

        <div class="calculation-box">
            <h2>Calcul du reversement</h2>
            <table class="calc-table">
                <tr>
                    <td>Total des ventes</td>
                    <td class="price">{format_price(payout.gross_amount)}</td>
                </tr>
                <tr>
                    <td>Commission ALPE (20%)</td>
                    <td class="price">- {format_price(payout.commission_amount)}</td>
                </tr>
                {fee_label}
                <tr class="net-row">
                    <td>Montant a reverser</td>
                    <td class="price">{format_price(payout.net_amount)}</td>
                </tr>
            </table>
        </div>

        <div class="payment-section">
            <h2>Paiement et retrait</h2>
            <div class="checkbox-line">
                Mode de paiement : &#9744; Especes &nbsp;&nbsp; &#9744; Cheque &nbsp;&nbsp; &#9744; Virement
            </div>
            <div class="checkbox-line">
                Date du paiement : _____ / _____ / __________
            </div>
            <div class="checkbox-line">
                &#9744; Invendus recuperes
            </div>

            <div class="signature-line">
                <div class="signature-box">
                    <div class="label">Signature du benevole</div>
                    <div class="line">&nbsp;</div>
                </div>
                <div class="signature-box">
                    <div class="label">Signature du deposant</div>
                    <div class="line">&nbsp;</div>
                </div>
            </div>

            <div class="legal-notice">
                Je soussigne(e) reconnais avoir recu la somme de {format_price(payout.net_amount)}
                et recupere mes articles invendus.
            </div>
        </div>

        <div class="footer">
            ALPE Plaisance du Touch &mdash; {edition_name} &mdash; Bordereau genere le {generated_date}
        </div>
    </body>
    </html>
    """
    return html


def generate_single_receipt_pdf(payout: "Payout", edition: "Edition") -> bytes:
    html_content = _generate_receipt_html(payout, edition)
    html = HTML(string=html_content)
    pdf_buffer = BytesIO()
    html.write_pdf(pdf_buffer)
    return pdf_buffer.getvalue()


def generate_bulk_receipts_pdf(payouts: list["Payout"], edition: "Edition") -> bytes:
    if not payouts:
        return b""

    # Concatenate all HTML with page breaks
    all_html_parts = []
    for i, payout in enumerate(payouts):
        part = _generate_receipt_html(payout, edition)
        if i > 0:
            # Extract body content and add page break
            body_start = part.find("<body>")
            body_end = part.find("</body>")
            if body_start > -1 and body_end > -1:
                body_content = part[body_start + 6:body_end]
                all_html_parts.append(
                    f'<div style="page-break-before: always;">{body_content}</div>'
                )
        else:
            all_html_parts.append(part)

    # For first PDF: wrap additional pages inside the first document
    first_html = all_html_parts[0]
    if len(all_html_parts) > 1:
        # Insert additional pages before </body>
        insert_point = first_html.rfind("</body>")
        extra_pages = "\n".join(all_html_parts[1:])
        first_html = first_html[:insert_point] + extra_pages + first_html[insert_point:]

    html = HTML(string=first_html)
    pdf_buffer = BytesIO()
    html.write_pdf(pdf_buffer)
    return pdf_buffer.getvalue()
