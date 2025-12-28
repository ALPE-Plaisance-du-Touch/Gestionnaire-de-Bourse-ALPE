# TODO - Finalisation US-001 : Invitation et Activation de compte

**Branche :** `feature/us-001-invitation-activation`
**Objectif :** Permettre l'envoi d'invitations par email et l'activation de compte par les déposants

---

## État actuel

### Backend - Implémenté ✅
- [x] Endpoint `POST /api/v1/auth/activate` - Activation de compte avec token
- [x] Endpoint `POST /api/v1/invitations` - Création d'invitation
- [x] Endpoint `POST /api/v1/invitations/bulk` - Création en masse
- [x] Endpoint `POST /api/v1/invitations/{id}/resend` - Renvoi d'invitation
- [x] Endpoint `POST /api/v1/auth/password/reset-request` - Demande reset mot de passe
- [x] Endpoint `POST /api/v1/auth/password/reset` - Reset mot de passe
- [x] Service invitation (génération token, expiration 7 jours)
- [x] Service auth (activation compte, reset password)
- [x] Tests unitaires et intégration

### Frontend - Implémenté ✅
- [x] Page de connexion (`/login`)
- [x] Page d'activation (`/activate?token=xxx`)
- [x] Validation mot de passe (8 chars, lettre, chiffre, symbole)
- [x] Gestion des erreurs (token invalide, expiré)
- [x] Acceptation CGU

---

## Tâches à finaliser

### 1. Service Email (Backend) - CRITIQUE
**Fichier à créer :** `backend/app/services/email.py`

- [ ] **1.1** Créer `EmailService` avec SMTP async (aiosmtplib)
  - Connexion à MailHog en dev (localhost:1025, sans TLS)
  - Configuration SMTP production ready

- [ ] **1.2** Template email d'invitation
  - Sujet : "Invitation Bourse ALPE - Activez votre compte"
  - Corps : Lien d'activation avec token
  - Format HTML + texte brut

- [ ] **1.3** Template email reset password
  - Sujet : "Bourse ALPE - Réinitialisation de mot de passe"
  - Corps : Lien de reset avec token

- [ ] **1.4** Connecter EmailService aux endpoints
  - `POST /api/v1/invitations` → envoyer email invitation
  - `POST /api/v1/invitations/{id}/resend` → renvoyer email invitation
  - `POST /api/v1/auth/password/reset-request` → envoyer email reset

### 2. Configuration Email (Backend)
**Fichier :** `backend/app/config.py`

- [ ] **2.1** Ajouter variable `FRONTEND_URL` pour les liens dans les emails
- [ ] **2.2** Vérifier config SMTP pour MailHog (port 1025, pas de TLS)

### 3. Dépendances (Backend)
**Fichier :** `backend/requirements.txt`

- [ ] **3.1** Ajouter `aiosmtplib` pour envoi email async
- [ ] **3.2** Ajouter `jinja2` pour templates email (si pas déjà présent)

### 4. Tests Email (Backend)
**Fichier à créer :** `backend/tests/unit/test_email_service.py`

- [ ] **4.1** Test envoi email invitation
- [ ] **4.2** Test envoi email reset password
- [ ] **4.3** Test templates (variables remplacées correctement)

### 5. Page Reset Password (Frontend) - OPTIONNEL pour US-001
**Fichiers à créer :**
- `frontend/src/pages/auth/ForgotPasswordPage.tsx`
- `frontend/src/pages/auth/ResetPasswordPage.tsx`

- [ ] **5.1** Page "Mot de passe oublié" (saisie email)
- [ ] **5.2** Page "Nouveau mot de passe" (avec token URL)
- [ ] **5.3** Ajouter routes dans `routes.tsx`

---

## Ordre de réalisation recommandé

1. **Dépendances** (3.1, 3.2) - 2 min
2. **Config** (2.1, 2.2) - 5 min
3. **EmailService** (1.1, 1.2, 1.3) - 30 min
4. **Connecter aux endpoints** (1.4) - 15 min
5. **Tests** (4.1-4.3) - 20 min
6. **Test manuel via MailHog** - 10 min

**Total estimé :** ~1h30

---

## Test manuel

1. Démarrer les containers : `make dev`
2. Se connecter admin : `admin@example.com` / `Admin123!`
3. Via Swagger (`/api/docs`) ou curl :
   ```bash
   # Login
   curl -X POST http://localhost:8000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@example.com","password":"Admin123!"}'

   # Créer invitation (remplacer TOKEN)
   curl -X POST http://localhost:8000/api/v1/invitations \
     -H "Authorization: Bearer TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com"}'
   ```
4. Vérifier email dans MailHog : http://localhost:8025
5. Copier le lien d'activation et tester `/activate?token=xxx`

---

## Critères d'acceptation (US-001)

- [ ] Email d'invitation envoyé avec lien unique
- [ ] Lien valide 7 jours
- [ ] Page d'activation accessible via le lien
- [ ] Formulaire : mot de passe, confirmation, nom, prénom, téléphone, CGU
- [ ] Validation mot de passe (8 chars, lettre, chiffre, symbole)
- [ ] Compte activé après soumission
- [ ] Redirection vers login avec message de succès
