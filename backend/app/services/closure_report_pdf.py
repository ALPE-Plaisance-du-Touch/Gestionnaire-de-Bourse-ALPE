"""PDF generation service for edition closure reports."""

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from weasyprint import HTML

if TYPE_CHECKING:
    from app.models import Edition
    from app.models.payout import Payout

STATUS_LABELS = {
    "pending": "En attente",
    "ready": "Pret",
    "paid": "Paye",
    "cancelled": "Annule",
}

PAYMENT_LABELS = {
    "cash": "Especes",
    "check": "Cheque",
    "transfer": "Virement",
}


def format_price(price: Decimal) -> str:
    return f"{price:.2f} EUR"


def generate_closure_report_pdf(
    edition: "Edition",
    stats: dict,
    payouts: list["Payout"],
    closed_by: str | None = None,
) -> bytes:
    """Generate a closure report PDF for an edition."""
    html = _generate_report_html(edition, stats, payouts, closed_by)
    return HTML(string=html).write_pdf()


def _generate_report_html(edition, stats, payouts, closed_by) -> str:
    generated_date = datetime.now().strftime("%d/%m/%Y a %H:%M")
    edition_name = edition.name if hasattr(edition, "name") else "Edition"

    # Build depositor summary rows
    depositor_rows = ""
    for p in sorted(payouts, key=lambda x: x.item_list.number):
        depositor = p.depositor
        name = f"{depositor.first_name} {depositor.last_name}"
        status = STATUS_LABELS.get(p.status, p.status)
        payment = PAYMENT_LABELS.get(p.payment_method, "") if p.payment_method else ""

        depositor_rows += f"""
        <tr>
            <td style="text-align:center">{p.item_list.number}</td>
            <td>{name}</td>
            <td style="text-align:center">{p.total_articles}</td>
            <td style="text-align:center">{p.sold_articles}</td>
            <td style="text-align:right">{format_price(p.gross_amount)}</td>
            <td style="text-align:right">{format_price(p.net_amount)}</td>
            <td style="text-align:center">{status}</td>
            <td style="text-align:center">{payment}</td>
        </tr>"""

    total_sales = stats.get("total_sales", Decimal("0.00"))
    total_commission = stats.get("total_commission", Decimal("0.00"))
    total_net = stats.get("total_net", Decimal("0.00"))
    total_articles = stats.get("total_articles", 0)
    sold_articles = stats.get("sold_articles", 0)
    unsold_articles = stats.get("unsold_articles", 0)
    total_payouts = stats.get("total_payouts", 0)
    payouts_paid = stats.get("payouts_paid", 0)

    sell_through = (sold_articles / total_articles * 100) if total_articles > 0 else 0

    # Unique depositors
    depositor_ids = set()
    for p in payouts:
        depositor_ids.add(p.depositor_id)
    nb_depositors = len(depositor_ids)

    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
    @page {{ size: A4; margin: 15mm 12mm; }}
    body {{ font-family: Arial, sans-serif; font-size: 10pt; color: #333; }}
    h1 {{ text-align: center; color: #1e40af; font-size: 18pt; margin-bottom: 5px; }}
    h2 {{ color: #1e40af; font-size: 13pt; border-bottom: 2px solid #1e40af; padding-bottom: 4px; margin-top: 20px; }}
    .subtitle {{ text-align: center; color: #6b7280; margin-top: 0; }}
    .info-grid {{ display: flex; gap: 20px; margin: 15px 0; }}
    .info-box {{ flex: 1; background: #f0f9ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 12px; text-align: center; }}
    .info-box .value {{ font-size: 20pt; font-weight: bold; color: #1e40af; }}
    .info-box .label {{ font-size: 8pt; color: #6b7280; margin-top: 4px; }}
    .summary-table {{ width: 100%; border-collapse: collapse; margin: 10px 0; }}
    .summary-table td {{ padding: 6px 10px; border-bottom: 1px solid #e5e7eb; }}
    .summary-table td:first-child {{ font-weight: bold; width: 60%; }}
    .summary-table td:last-child {{ text-align: right; }}
    table.data {{ width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 9pt; }}
    table.data th {{ background: #1e40af; color: white; padding: 6px 4px; text-align: center; font-size: 8pt; }}
    table.data td {{ padding: 5px 4px; border-bottom: 1px solid #e5e7eb; }}
    table.data tr:nth-child(even) {{ background: #f9fafb; }}
    .footer {{ margin-top: 30px; padding-top: 15px; border-top: 2px solid #1e40af; font-size: 9pt; color: #6b7280; }}
    .highlight {{ background: #ecfdf5; border: 1px solid #10b981; border-radius: 6px; padding: 10px; text-align: center; margin: 15px 0; }}
    .highlight .amount {{ font-size: 16pt; font-weight: bold; color: #065f46; }}
</style>
</head>
<body>

<h1>RAPPORT DE CLOTURE</h1>
<p class="subtitle">{edition_name} - Genere le {generated_date}</p>

<h2>Informations edition</h2>
<table class="summary-table">
    <tr><td>Nom</td><td>{edition_name}</td></tr>
    <tr><td>Lieu</td><td>{getattr(edition, 'location', '') or ''}</td></tr>
    <tr><td>Nombre de deposants</td><td>{nb_depositors}</td></tr>
    <tr><td>Nombre de listes</td><td>{total_payouts}</td></tr>
</table>

<h2>Statistiques generales</h2>
<div class="info-grid">
    <div class="info-box">
        <div class="value">{total_articles}</div>
        <div class="label">Articles deposes</div>
    </div>
    <div class="info-box">
        <div class="value">{sold_articles}</div>
        <div class="label">Vendus ({sell_through:.0f}%)</div>
    </div>
    <div class="info-box">
        <div class="value">{unsold_articles}</div>
        <div class="label">Invendus</div>
    </div>
</div>

<h2>Resume financier</h2>
<table class="summary-table">
    <tr><td>Total des ventes</td><td>{format_price(total_sales)}</td></tr>
    <tr><td>Commission ALPE</td><td>{format_price(total_commission)}</td></tr>
    <tr><td>Frais de liste</td><td>{format_price(stats.get('total_list_fees', Decimal('0.00')))}</td></tr>
    <tr><td><strong>Total reversements</strong></td><td><strong>{format_price(total_net)}</strong></td></tr>
</table>

<div class="highlight">
    <div>Reversements effectues : <span class="amount">{payouts_paid} / {total_payouts}</span></div>
</div>

<h2>Recapitulatif par deposant</h2>
<table class="data">
    <thead>
        <tr>
            <th>N liste</th>
            <th>Deposant</th>
            <th>Articles</th>
            <th>Vendus</th>
            <th>Ventes</th>
            <th>Net</th>
            <th>Statut</th>
            <th>Paiement</th>
        </tr>
    </thead>
    <tbody>
        {depositor_rows}
    </tbody>
</table>

<div class="footer">
    <p><strong>ALPE Plaisance du Touch</strong></p>
    <p>Rapport genere le {generated_date}{f' par {closed_by}' if closed_by else ''}</p>
    <p>Ce document est un recapitulatif interne a usage des gestionnaires de la bourse.</p>
</div>

</body>
</html>"""
