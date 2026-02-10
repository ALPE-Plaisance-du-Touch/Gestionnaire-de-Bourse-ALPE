# Testing Strategy - Gestionnaire de Bourse ALPE

E2E test campaign designed for execution via Claude Code + Chrome DevTools MCP.

**Application URL**: `http://localhost:5173` (frontend) / `http://localhost:8000` (backend API)

---

## 1. User Profile Map

### 1.1 Roles & Permissions

| Role | Code | Permissions | Restrictions |
|------|------|-------------|--------------|
| **Visitor** | (none) | View privacy policy | No access to any protected or auth route |
| **Depositor** | `depositor` | Login, activate account, reset password + declare articles, validate lists, download PDF labels, view sales results, edit profile, export/delete personal data (GDPR) | Cannot access admin pages, cannot scan/sell, cannot manage editions |
| **Volunteer** | `volunteer` | All depositor permissions + scan articles, register sales, cancel sales (within 5 min), view live stats, offline sales sync | Cannot configure editions, cannot manage invitations/payouts |
| **Manager** | `manager` | All volunteer permissions + configure editions, import Billetweb CSV, manage invitations, generate labels, calculate/record payouts, manage sales (cancel without time limit) | Cannot create/close/archive editions, cannot view audit logs |
| **Administrator** | `administrator` | Full access: all manager permissions + create editions, close editions, archive editions, view audit logs, manage user roles | None |

### 1.2 Test User Accounts

| Profile | Email | Password | Role | State |
|---------|-------|----------|------|-------|
| Admin | `admin@alpe-bourse.fr` | `Admin123!` | administrator | Active |
| Manager | `manager@alpe-bourse.fr` | `Manager123!` | manager | Active |
| Volunteer | `volunteer@alpe-bourse.fr` | `Volunteer123!` | volunteer | Active |
| Depositor (standard) | `deposant@example.com` | `Deposant123!` | depositor | Active |
| Depositor (list 1000) | `adherent@alpe-bourse.fr` | `Adherent123!` | depositor | Active, local resident |
| Depositor (list 2000) | `ami-adherent@example.com` | `Ami12345!` | depositor | Active |
| Inactive user | `inactif@example.com` | (none) | depositor | Inactive, pending invitation |
| Expired invitation | `expire@example.com` | (none) | depositor | Inactive, expired token |

---

## 2. Journey Map per Profile

### 2.1 Visitor (Unauthenticated, no account)

#### Happy Paths
| ID | Journey | Entry | Steps | Exit |
|----|---------|-------|-------|------|
| V-01 | View privacy policy | `/privacy` | Navigate, read content | Static page displayed |

#### Error Paths
| ID | Journey | Trigger | Expected |
|----|---------|---------|----------|
| V-E01 | Access protected route | Navigate to `/editions` | Redirect to `/login` |
| V-E02 | Access login page | Navigate to `/login` | Login form displayed (public auth page) |
| V-E03 | Access admin page | Navigate to `/admin/invitations` | Redirect to `/login` |
| V-E04 | Access depositor page | Navigate to `/lists` | Redirect to `/login` |

---

### 2.2 Authentication (all roles, pre-login / account management)

#### Happy Paths
| ID | Journey | Entry | Steps | Exit |
|----|---------|-------|-------|------|
| AUTH-01 | Login with valid credentials | `/login` | Fill email + password, submit | Redirect to `/` |
| AUTH-02 | Activate account via invitation link | `/activate?token=xxx` | Token validated, fill form, submit | Redirect to `/login` with success |
| AUTH-03 | Request password reset | `/forgot-password` | Fill email, submit | Success message shown |
| AUTH-04 | Reset password with valid token | `/reset-password?token=xxx` | Fill new password + confirm, submit | Redirect to `/login` |
| AUTH-05 | Logout | Any authenticated page | Click "Deconnexion" | Redirect to `/login` |

#### Error Paths
| ID | Journey | Trigger | Expected |
|----|---------|---------|----------|
| AUTH-E01 | Login with wrong password | Invalid password | Error message "Identifiants invalides" |
| AUTH-E02 | Login with unknown email | Unknown email | Error message "Identifiants invalides" (no enumeration) |
| AUTH-E03 | Login with empty fields | Submit empty form | Validation messages |
| AUTH-E04 | Activate with expired token | Token > 7 days old | Error "Lien expire" |
| AUTH-E05 | Activate with invalid token | Garbage token | Error "Lien invalide" |
| AUTH-E06 | Activate with already-used token | Re-visit activation link | Redirect to login |
| AUTH-E07 | Activate with weak password | "123" | Validation error, strength indicator red |
| AUTH-E08 | Activate without accepting terms | Checkbox unchecked | Submit blocked |
| AUTH-E09 | Activate with mismatched passwords | pw != confirm | Validation error |
| AUTH-E10 | Reset password with expired token | Expired reset token | Error message |
| AUTH-E11 | Login with inactive account | Account not yet activated | Error message |

#### Edge Cases
| ID | Journey | Scenario | Expected |
|----|---------|----------|----------|
| AUTH-EC01 | Double-submit login | Click submit rapidly twice | No duplicate request, single redirect |
| AUTH-EC02 | Password with special chars | Password: `P@$$w0rd!#%^` | Accepted |
| AUTH-EC03 | Email case sensitivity | Login with `Admin@ALPE-bourse.FR` | Works (case-insensitive) |
| AUTH-EC04 | XSS in login fields | `<script>alert(1)</script>` in email | Sanitized, no XSS |
| AUTH-EC05 | SQL injection in login | `' OR 1=1 --` | Rejected, no injection |
| AUTH-EC06 | Very long email | 256-char email | Validation error |
| AUTH-EC07 | Session expired during use | JWT token expires mid-session | Redirect to `/login` |
| AUTH-EC08 | Re-activate already active account | Visit activate URL of active user | Error or redirect |

---

### 2.3 Depositor

#### Happy Paths
| ID | Journey | Entry | Steps | Exit |
|----|---------|-------|-------|------|
| D-01 | View my editions | `/lists` | Login, see list of editions | Editions with active registration shown |
| D-02 | Create a new list | `/depositor/editions/:id/lists` | Click "Nouvelle liste" | List created, redirect to list detail |
| D-03 | Add article to list | `/depositor/lists/:id` | Fill category, description, price, certify, submit | Article added, counters updated |
| D-04 | Add clothing article | `/depositor/lists/:id` | Category=clothing, fill size/brand/gender | Clothing counter incremented |
| D-05 | Add lot article | `/depositor/lists/:id` | Check "lot", select body/pajama, quantity=3 | Lot created, counts as 1 article |
| D-06 | Edit article | `/depositor/lists/:id` | Click edit, modify price, save | Article updated |
| D-07 | Delete article | `/depositor/lists/:id` | Click delete, confirm | Article removed, counters decremented |
| D-08 | Validate list | `/depositor/lists/:id` | All articles certified, click "Valider", accept checkbox | List validated, articles locked |
| D-09 | Download list PDF | `/depositor/lists/:id` | Click "Telecharger PDF" | PDF downloaded with labels |
| D-10 | Edit profile | `/profile` | Edit name/phone/address, save | Profile updated |
| D-11 | Export personal data (GDPR) | `/profile` | Click "Exporter mes donnees" | JSON file downloaded |
| D-12 | Delete account (GDPR) | `/profile` | Click delete, confirm | Account anonymized |
| D-13 | Create second list | `/depositor/editions/:id/lists` | Click "Nouvelle liste" again | Second list created (max 2) |

#### Error Paths
| ID | Journey | Trigger | Expected |
|----|---------|---------|----------|
| D-E01 | Add article below min price | Price = 0.50 | Error "Prix minimum 1.00 EUR" |
| D-E02 | Add stroller above max price | Stroller at 200 EUR | Error "Prix maximum 150.00 EUR" |
| D-E03 | Add 25th article | List already has 24 articles | Error "Maximum 24 articles" |
| D-E04 | Add 13th clothing item | 12 clothing already | Error "Maximum 12 vetements" |
| D-E05 | Add blacklisted item | Category = car_seat | Error "Article interdit" |
| D-E06 | Add 2nd coat | Already 1 coat | Error "Maximum 1 manteau" |
| D-E07 | Add lot with wrong subcategory | Lot of t-shirts | Error "Lots uniquement pour bodys/pyjamas" |
| D-E08 | Validate without certification | Article not certified | Validation button disabled |
| D-E09 | Create 3rd list | Already has 2 lists | Button disabled/hidden |
| D-E10 | Add article after deadline | Declaration deadline passed | Error banner, form disabled |
| D-E11 | Edit validated list | List status = validated | Edit buttons hidden |
| D-E12 | Access another depositor's list | Modify URL with foreign list ID | 403 Forbidden |
| D-E13 | Delete non-empty list | List has articles | Delete button hidden |

#### Edge Cases
| ID | Journey | Scenario | Expected |
|----|---------|----------|----------|
| D-EC01 | Article description max length | 100-char description | Accepted |
| D-EC02 | Article description 101 chars | Truncated/error |
| D-EC03 | Price with 3 decimals | 5.999 | Rounded to 6.00 or rejected |
| D-EC04 | Empty description | "" | Validation error |
| D-EC05 | Lot quantity = 0 | lot_quantity=0 | Validation error |
| D-EC06 | Special characters in description | "T-shirt bebe 'Zara' (3 mois)" | Accepted |
| D-EC07 | Concurrent list validation | Submit twice rapidly | Only one validation succeeds |
| D-EC08 | Navigate away during save | Close tab while saving | No partial data saved |

---

### 2.4 Volunteer

#### Happy Paths
| ID | Journey | Entry | Steps | Exit |
|----|---------|-------|-------|------|
| B-01 | Scan article QR code | `/editions/:id/sales` | Scan barcode with camera | Article details displayed |
| B-02 | Register cash sale | `/editions/:id/sales` | Scan, select "Especes", confirm | Sale recorded, recent sales updated |
| B-03 | Register card sale | `/editions/:id/sales` | Scan, select "CB", confirm | Sale recorded |
| B-04 | Register check sale | `/editions/:id/sales` | Scan, select "Cheque", confirm | Sale recorded |
| B-05 | Cancel recent sale | `/editions/:id/sales` | Click cancel on recent sale (< 5 min) | Sale cancelled, article back on sale |
| B-06 | Manual barcode input | `/editions/:id/sales` | Type barcode in text field | Article found and displayed |
| B-07 | View live statistics | `/editions/:id/stats` | Navigate to stats page | Real-time stats with auto-refresh |
| B-08 | Private sale detection | `/editions/:id/sales` | Sale on Friday 17-18h | Sale marked as private |

#### Error Paths
| ID | Journey | Trigger | Expected |
|----|---------|---------|----------|
| B-E01 | Scan unknown barcode | Invalid barcode | Error "Article non trouve" |
| B-E02 | Scan already-sold article | Article status = sold | Error "Article deja vendu" |
| B-E03 | Cancel sale after 5 min | Sale > 5 min old | Cancel button hidden/disabled |
| B-E04 | Scan without edition open | Edition not in_progress | Error message |
| B-E05 | Invalid barcode format | "ABC" instead of "012305" | Warning "Format invalide" |

#### Edge Cases
| ID | Journey | Scenario | Expected |
|----|---------|----------|----------|
| B-EC01 | Rapid consecutive scans | Scan 5 articles in 10 seconds | All processed sequentially |
| B-EC02 | Offline sale | Network disconnected | Sale queued locally, synced later |
| B-EC03 | Offline sync conflict | Offline sale for already-sold article | Conflict reported in sync |
| B-EC04 | Camera permission denied | QR scanner denied | Manual input fallback shown |
| B-EC05 | Register number assignment | Multiple registers | Each sale tagged with register # |

---

### 2.5 Manager

#### Happy Paths
| ID | Journey | Entry | Steps | Exit |
|----|---------|-------|-------|------|
| G-01 | View editions list | `/editions` | Login as manager | Editions table displayed |
| G-02 | Configure edition dates | `/editions/:id` | Edit operational dates, commission, save | Edition configured, status = configured |
| G-03 | Create deposit slots | `/editions/:id` | Add slots with capacity/times | Slots listed |
| G-04 | Import Billetweb CSV | `/editions/:id` | Upload CSV, preview, confirm import | Depositors imported, invitations sent |
| G-05 | View edition depositors | `/editions/:id/depositors` | Navigate from edition detail | Depositor list with filters |
| G-06 | Create single invitation | `/admin/invitations` | Click "Nouvelle invitation", fill form | Invitation created, email sent |
| G-07 | Bulk create invitations | `/admin/invitations` | Click "En masse", upload CSV | Multiple invitations created |
| G-08 | Resend invitation | `/admin/invitations` | Click "Relancer" on pending invitation | New token generated, email resent |
| G-09 | Bulk resend invitations | `/admin/invitations` | Select multiple, click "Relancer la selection" | All resent |
| G-10 | Delete invitation | `/admin/invitations` | Click delete, confirm | Invitation removed |
| G-11 | Bulk delete invitations | `/admin/invitations` | Select multiple, click "Supprimer la selection" | All deleted |
| G-12 | Export invitations Excel | `/admin/invitations/stats` | Click "Exporter Excel" | Excel file downloaded |
| G-13 | Generate labels (by slot) | `/editions/:id/labels` | Select slot mode, choose slot, generate | PDF downloaded |
| G-14 | Generate labels (all) | `/editions/:id/labels` | Select complete mode, generate | PDF downloaded |
| G-15 | Generate labels (selection) | `/editions/:id/labels` | Select depositors, generate | PDF downloaded |
| G-16 | Calculate payouts | `/editions/:id/payouts` | Click "Calculer les reversements" | Payouts calculated for all depositors |
| G-17 | Record payment (cash) | `/editions/:id/payouts` | Click "Payer" on payout, select cash | Payout marked as paid |
| G-18 | Record payment (check) | `/editions/:id/payouts` | Click "Payer", select cheque, enter reference | Payment recorded with reference |
| G-19 | Download payout receipt | `/editions/:id/payouts` | Click PDF icon on payout row | Receipt PDF downloaded |
| G-20 | Download all receipts | `/editions/:id/payouts` | Click "Tous les bordereaux" | Bulk PDF downloaded |
| G-21 | Export payouts Excel | `/editions/:id/payouts` | Click "Exporter Excel" | Excel downloaded |
| G-22 | Send payout reminder | `/editions/:id/payouts` | Click reminder on absent depositor | Email sent |
| G-23 | Bulk send reminders | `/editions/:id/payouts` | Click "Relancer tous les absents" | Emails queued |
| G-24 | View payout dashboard | `/editions/:id/payouts/dashboard` | Navigate from payouts page | Charts and statistics displayed |
| G-25 | View invitation stats | `/admin/invitations/stats` | Navigate from invitations page | Stats page with charts |
| G-26 | Cancel sale (manager override) | `/editions/:id/sales/manage` | Click "Annuler" on any sale (no time limit) | Sale cancelled |
| G-27 | Filter invitations by status | `/admin/invitations` | Select "Expirees" filter | Only expired invitations shown |
| G-28 | Filter payouts by status | `/editions/:id/payouts` | Select "Paye" filter | Only paid payouts shown |
| G-29 | Search payouts by name | `/editions/:id/payouts` | Type depositor name in search | Filtered results |
| G-30 | Send deadline reminder | `/editions/:id` | Click "Envoyer un rappel" | Emails queued to depositors |

#### Error Paths
| ID | Journey | Trigger | Expected |
|----|---------|---------|----------|
| G-E01 | Import invalid CSV | Malformed CSV file | Preview shows errors, import blocked |
| G-E02 | Import CSV with unpaid entries | Billetweb entries without payment | Entries skipped, count shown |
| G-E03 | Create duplicate invitation | Same email as existing invitation | Error "Email deja invite" |
| G-E04 | Configure invalid dates | End date before start date | Validation error |
| G-E05 | Create overlapping slots | Same time range as existing | Error "Creneaux se chevauchent" |
| G-E06 | Record payment twice | Click pay on already-paid payout | Button disabled/hidden |
| G-E07 | Manager tries to create edition | Navigate to create edition | Button hidden (admin only) |
| G-E08 | Manager tries to close edition | No close button visible | Button hidden (admin only) |
| G-E09 | Manager tries to view audit logs | Navigate to `/admin/audit-logs` | 403 or route not shown |

#### Edge Cases
| ID | Journey | Scenario | Expected |
|----|---------|----------|----------|
| G-EC01 | Import 500-row CSV | Large Billetweb export | All processed, progress shown |
| G-EC02 | Commission rate 0% | Set commission to 0 | Net = Gross for all payouts |
| G-EC03 | Commission rate 100% | Set commission to 1 | Net = 0 for all payouts |
| G-EC04 | Recalculate after sale cancel | Payout calculated, then sale cancelled | Recalculate shows lower amount |
| G-EC05 | Labels for depositor with no validated lists | Select depositor, generate | Skip or error |
| G-EC06 | Bulk resend with mix of statuses | Select activated + pending | Only pending/expired resent, activated skipped |

---

### 2.6 Administrator

#### Happy Paths
| ID | Journey | Entry | Steps | Exit |
|----|---------|-------|-------|------|
| A-01 | Create new edition | `/editions` | Click "Nouvelle edition", fill name/dates, submit | Edition created, status = draft |
| A-02 | Delete draft edition | `/editions` | Click delete on draft edition, confirm | Edition deleted |
| A-03 | Close edition | `/editions/:id` | Check closure prerequisites, click "Cloturer", confirm | Edition closed, payouts finalized |
| A-04 | Archive edition | `/editions` | Click "Archiver" on closed edition, confirm | Edition archived |
| A-05 | View audit logs | `/admin/audit-logs` | Navigate to audit logs | Full audit trail displayed |
| A-06 | Filter audit logs | `/admin/audit-logs` | Filter by action/user/date | Filtered results |
| A-07 | Download closure report | `/editions/:id` | Click "Rapport de cloture" on closed edition | PDF report downloaded |

#### Error Paths
| ID | Journey | Trigger | Expected |
|----|---------|---------|----------|
| A-E01 | Close edition without payouts | Missing prerequisite | Closure check fails, reasons listed |
| A-E02 | Delete non-draft edition | Edition in_progress | Delete button hidden |
| A-E03 | Create duplicate edition name | Same name as existing | Error "Nom deja utilise" |
| A-E04 | Archive non-closed edition | Edition in_progress | Archive button hidden |
| A-E05 | Close with unpaid payouts | Payouts not all paid | Warning in closure check |

#### Edge Cases
| ID | Journey | Scenario | Expected |
|----|---------|----------|----------|
| A-EC01 | Archive edition closed > 1 year | Old closed edition | "A archiver" badge shown |
| A-EC02 | View archived edition details | Filter by "Archive" | Edition visible, read-only |
| A-EC03 | Closure with 0 sales | Edition with no sales | Closure allowed (0 payouts) |

---

## 3. Multi-Step Workflow Journeys

### W-01: Complete Depositor Lifecycle
```
Admin creates edition → Manager configures dates → Manager imports Billetweb →
Depositor activates account → Depositor creates list → Depositor adds articles →
Depositor validates list → Manager generates labels → Volunteer scans/sells →
Manager calculates payouts → Manager records payment → Admin closes edition
```

### W-02: Invitation → Activation → Declaration
```
Manager creates invitation → Email sent → Depositor clicks link →
Token validated → Account activated → Login → View editions →
Create list → Add articles → Validate list → Download PDF
```

### W-03: Sale → Cancel → Resale
```
Volunteer scans article → Registers sale (cash) → Cancels within 5 min →
Article back on sale → Volunteer re-scans → Registers new sale (card)
```

### W-04: Payout Calculation → Payment
```
Manager calculates payouts → Reviews dashboard → Records cash payment →
Marks absent depositor → Sends reminder email → Depositor returns →
Records check payment → All payouts paid → Admin closes edition
```

### W-05: Billetweb Import → Labels → Sales
```
Manager uploads CSV → Preview validates → Import confirmed →
Depositors invited → Depositors activate + declare →
Manager generates labels (by slot) → Event day → Volunteer scans/sells
```

### W-06: Offline Sales Workflow
```
Network disconnected → Volunteer records offline sales →
Network restored → Sales synced → Conflicts resolved →
Stats updated in real-time
```

### W-07: GDPR Full Cycle
```
Depositor logs in → Edits profile → Exports all data (JSON download) →
Decides to delete → Confirms deletion → Account anonymized →
Login no longer works → Data removed from active listings
```

---

## 4. Coverage Matrix

### 4.1 Features x Roles

| Feature | Visitor | Auth | Depositor | Volunteer | Manager | Admin |
|---------|---------|------|-----------|-----------|---------|-------|
| View privacy policy | V-01 | - | - | - | - | - |
| Login | - | AUTH-01 | - | - | - | - |
| Activate account | - | AUTH-02 | - | - | - | - |
| Reset password | - | AUTH-03, AUTH-04 | - | - | - | - |
| Logout | - | AUTH-05 | - | - | - | - |
| View my editions | - | - | D-01 | - | - | - |
| Create list | - | - | D-02, D-13 | - | - | - |
| Add article | - | - | D-03 to D-06 | - | - | - |
| Validate list | - | - | D-08 | - | - | - |
| Download PDF | - | - | D-09 | - | - | - |
| Edit profile | - | - | D-10 | - | - | - |
| GDPR export | - | - | D-11 | - | - | - |
| GDPR delete | - | - | D-12 | - | - | - |
| Scan article | - | - | - | B-01, B-06 | - | - |
| Register sale | - | - | - | B-02 to B-04 | - | - |
| Cancel sale (5 min) | - | - | - | B-05 | - | - |
| View live stats | - | - | - | B-07 | - | - |
| View editions list | - | - | - | - | G-01 | G-01 |
| Configure edition | - | - | - | - | G-02, G-03 | G-02 |
| Import Billetweb | - | - | - | - | G-04 | G-04 |
| Manage invitations | - | - | - | - | G-06 to G-12 | G-06 |
| Generate labels | - | - | - | - | G-13 to G-15 | G-13 |
| Calculate payouts | - | - | - | - | G-16 | G-16 |
| Record payment | - | - | - | - | G-17, G-18 | G-17 |
| Payout receipts | - | - | - | - | G-19 to G-21 | G-19 |
| Payout reminders | - | - | - | - | G-22, G-23 | G-22 |
| Cancel sale (manager) | - | - | - | - | G-26 | G-26 |
| Create edition | - | - | - | - | - | A-01 |
| Delete edition | - | - | - | - | - | A-02 |
| Close edition | - | - | - | - | - | A-03 |
| Archive edition | - | - | - | - | - | A-04 |
| View audit logs | - | - | - | - | - | A-05, A-06 |
| Closure report | - | - | - | - | - | A-07 |

### 4.2 Test Type Coverage

| Test Type | IDs | Count |
|-----------|-----|-------|
| Happy paths | V-01, AUTH-01 to AUTH-05, D-01 to A-07 | 68 |
| Error paths | V-E01 to V-E04, AUTH-E01 to AUTH-E11, D-E01 to A-E05 | 47 |
| Edge cases | AUTH-EC01 to AUTH-EC08, D-EC01 to A-EC03 | 30 |
| Workflows | W-01 to W-07 | 7 |
| **Total** | | **152** |

### 4.3 Page Coverage

| Page | Happy | Error | Edge | Workflows |
|------|-------|-------|------|-----------|
| `/login` | AUTH-01 | AUTH-E01 to E03, E11 | AUTH-EC01 to EC06 | W-02 |
| `/activate` | AUTH-02 | AUTH-E04 to E09 | AUTH-EC08 | W-02 |
| `/forgot-password` | AUTH-03 | - | - | - |
| `/reset-password` | AUTH-04 | AUTH-E10 | - | - |
| `/privacy` | V-01 | - | - | - |
| `/lists` | D-01 | - | - | W-01, W-02 |
| `/depositor/editions/:id/lists` | D-02, D-13 | D-E09, E10 | - | W-01, W-02 |
| `/depositor/lists/:id` | D-03 to D-09 | D-E01 to E13 | D-EC01 to EC08 | W-01, W-02 |
| `/profile` | D-10 to D-12 | - | - | W-07 |
| `/editions` | G-01 | - | - | W-01 |
| `/editions/:id` | G-02 to G-04, G-30 | G-E04, E05 | - | W-01, W-05 |
| `/editions/:id/depositors` | G-05 | - | - | W-05 |
| `/editions/:id/labels` | G-13 to G-15 | - | G-EC05 | W-05 |
| `/editions/:id/sales` | B-01 to B-08 | B-E01 to E05 | B-EC01 to EC05 | W-03, W-06 |
| `/editions/:id/sales/manage` | G-26 | - | - | - |
| `/editions/:id/stats` | B-07 | - | - | - |
| `/editions/:id/payouts` | G-16 to G-23, G-28, G-29 | G-E06 | G-EC02 to EC04 | W-04 |
| `/editions/:id/payouts/dashboard` | G-24 | - | - | W-04 |
| `/admin/invitations` | G-06 to G-12, G-27 | G-E03 | G-EC06 | W-02 |
| `/admin/invitations/stats` | G-25, G-12 | - | - | - |
| `/admin/audit-logs` | A-05, A-06 | G-E09 | - | - |

---

## 5. Security Tests

| ID | Test | Expected |
|----|------|----------|
| S-01 | XSS in form fields | All inputs sanitized, no script execution |
| S-02 | SQL injection via login | Rejected by parameterized queries |
| S-03 | JWT token tampering | Invalid token → 401 |
| S-04 | Access API without token | 401 Unauthorized |
| S-05 | Access admin API as depositor | 403 Forbidden |
| S-06 | Access other user's data | 403 or 404 |
| S-07 | CORS validation | Only allowed origins accepted |
| S-08 | Expired JWT token | 401, redirect to login |
| S-09 | Replay old invitation token | Token invalidated after use |
| S-10 | Path traversal in file endpoints | Blocked |

---

## 6. Performance & Reliability Tests

| ID | Test | Criteria |
|----|------|----------|
| P-01 | Page load time | < 3 seconds on Fast 3G |
| P-02 | API response time | < 500ms for standard queries |
| P-03 | Large table rendering | 100+ rows in payout table, no lag |
| P-04 | Auto-refresh (live stats) | Updates every 10s without memory leak |
| P-05 | PDF generation (100 labels) | < 10 seconds |
| P-06 | Billetweb CSV (500 rows) | Import completes without timeout |

---

## 7. Accessibility Tests (WCAG 2.1 AA)

| ID | Test | Criteria |
|----|------|----------|
| ACC-01 | Keyboard navigation | All interactive elements reachable via Tab |
| ACC-02 | Skip link | Present and functional on every page |
| ACC-03 | ARIA landmarks | `<nav>`, `<main>`, `<header>` properly labeled |
| ACC-04 | Form labels | All inputs have associated `<label>` or `aria-label` |
| ACC-05 | Color contrast | 4.5:1 minimum for normal text, 3:1 for large text |
| ACC-06 | Focus indicators | Visible focus ring on all interactive elements |
| ACC-07 | Error announcements | Form errors announced to screen readers |
| ACC-08 | Modal focus trap | Focus trapped inside open modals |
| ACC-09 | Table headers | All data tables have `<th>` with `scope` |
| ACC-10 | Admin dropdown keyboard | ArrowUp/Down navigation, Escape to close |
