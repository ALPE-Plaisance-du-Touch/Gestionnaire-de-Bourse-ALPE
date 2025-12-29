# TODO - Finalisation US-001 : Invitation et Activation de compte

**Branche :** `feature/us-001-invitation-activation`
**Objectif :** Permettre l'envoi d'invitations par email et l'activation de compte par les déposants

---

## État actuel

### Backend - Implémenté ✅
- [x] Endpoint `POST /api/v1/auth/activate` - Activation de compte avec token
- [x] Endpoint `GET /api/v1/auth/validate-token/{token}` - Validation du token
- [x] Endpoint `GET /api/v1/invitations` - Lister les invitations en attente (nouveau)
- [x] Endpoint `POST /api/v1/invitations` - Création d'invitation + envoi email
- [x] Endpoint `POST /api/v1/invitations/bulk` - Création en masse + envoi emails
- [x] Endpoint `POST /api/v1/invitations/{id}/resend` - Renvoi d'invitation + email
- [x] Endpoint `POST /api/v1/auth/password/reset-request` - Demande reset + email
- [x] Endpoint `POST /api/v1/auth/password/reset` - Reset mot de passe
- [x] Endpoint `GET /api/v1/config/public` - Configuration publique (support email)
- [x] Service invitation (génération token, expiration 7 jours, listing)
- [x] Service auth (activation compte, reset password, validation token)
- [x] **Service email** (SMTP async avec aiosmtplib)
- [x] **Templates email** (invitation + reset password, HTML + texte, support email configurable)
- [x] Tests unitaires et intégration

### Frontend - Implémenté ✅
- [x] Page de connexion (`/login`)
- [x] Page d'activation (`/activate?token=xxx`)
- [x] **Validation du token au chargement**
- [x] **Pages d'erreur dédiées** : token invalide, expiré, compte déjà activé
- [x] **Pré-remplissage du formulaire** avec email et nom
- [x] Validation mot de passe (8 chars, lettre, chiffre, symbole)
- [x] Gestion des erreurs (token invalide, expiré)
- [x] Acceptation CGU
- [x] **Hook useConfig** pour email de support configurable (nouveau)
- [x] **Email de support dynamique** sur les pages d'erreur (nouveau)

---

## Tâches finalisées

### 1. Service Email (Backend) ✅
**Fichier créé :** `backend/app/services/email.py`

- [x] Créer `EmailService` avec SMTP async (aiosmtplib)
- [x] Template email d'invitation (HTML + texte)
- [x] Template email reset password (HTML + texte)
- [x] Connecter EmailService aux endpoints

### 2. Configuration ✅
- [x] Ajout `FRONTEND_URL` dans config.py
- [x] Ajout `SMTP_USE_TLS=false` pour MailHog
- [x] MailHog démarre automatiquement avec `make dev`
- [x] **Ajout `SUPPORT_EMAIL` configurable** (défaut: `noreply@example.com`)
- [x] **Endpoint config publique** pour exposer les paramètres au frontend

### 3. Dépendances ✅
- [x] `aiosmtplib` (déjà présent)
- [x] `jinja2` ajouté

### 4. Tests ✅
- [x] Tests unitaires du service email

### 5. Validation Token ✅
- [x] Endpoint `GET /api/v1/auth/validate-token/{token}`
- [x] Schéma `TokenValidationResponse`
- [x] Méthode `validate_invitation_token()` dans AuthService
- [x] Frontend : validation au chargement de la page
- [x] Pages d'erreur dédiées (invalide, expiré, déjà activé)

### 6. Gestion des invitations ✅
- [x] Endpoint `GET /api/v1/invitations` - Liste invitations en attente
- [x] Filtre par statut (`?status=pending` ou `?status=expired`)
- [x] Méthode `list_pending_invitations()` dans InvitationService

### 7. Configuration publique ✅
- [x] Endpoint `GET /api/v1/config/public` - Expose l'email de support
- [x] Hook `useConfig` dans le frontend
- [x] Email de support dynamique dans les templates et pages d'erreur

---

## Test manuel

1. Redémarrer les containers : `make down && make dev`
2. Se connecter admin : `admin@example.com` / `Admin123!`
3. Via Swagger (`http://localhost:8000/api/docs`) :
   - Authentifier avec login
   - Appeler `POST /api/v1/invitations` avec `{"email":"test@example.com"}`
4. Vérifier email dans MailHog : http://localhost:8025
5. Copier le lien d'activation et tester `/activate?token=xxx`
6. Vérifier que :
   - Le formulaire s'affiche avec l'email pré-affiché
   - Les erreurs de validation n'invalident pas le token
   - Un token invalide affiche la page d'erreur appropriée

---

## Critères d'acceptation (US-001) ✅

- [x] Email d'invitation envoyé avec lien unique
- [x] Lien valide 7 jours
- [x] Page d'activation accessible via le lien
- [x] Formulaire : mot de passe, confirmation, nom, prénom, téléphone, CGU
- [x] Validation mot de passe (8 chars, lettre, chiffre, symbole)
- [x] Compte activé après soumission
- [x] Redirection vers login avec message de succès
- [x] **Token reste valide en cas d'erreur de validation** (tolérance aux erreurs)
- [x] **Page d'erreur si token invalide/expiré** (pas de formulaire affiché)

---

## Pages Reset Password (Frontend) ✅

- [x] Page "Mot de passe oublié" (`/forgot-password`)
- [x] Page "Nouveau mot de passe" (`/reset-password?token=xxx`)
- [x] Lien "Mot de passe oublié" sur la page de login
- [x] Validation mot de passe (mêmes critères que l'activation)
- [x] Gestion des erreurs (token invalide, expiré)
- [x] Email de support dynamique via `useConfig`
