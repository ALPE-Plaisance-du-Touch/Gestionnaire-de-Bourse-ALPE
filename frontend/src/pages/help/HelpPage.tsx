import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useIsAuthenticated, useUser } from '@/contexts';
import { useConfig } from '@/hooks/useConfig';
import { editionsApi } from '@/api/editions';

export function HelpPage() {
  const isAuthenticated = useIsAuthenticated();
  const user = useUser();
  const { config } = useConfig();

  const { data: activeEditionData } = useQuery({
    queryKey: ['active-edition'],
    queryFn: () => editionsApi.getActiveEdition(),
    enabled: isAuthenticated,
    staleTime: 60000,
  });

  const isVolunteerOrAbove = user && user.role !== 'depositor';
  const isManagerOrAdmin = user && (user.role === 'manager' || user.role === 'administrator');
  const activeEditionId = activeEditionData?.edition?.id ?? activeEditionData?.trainingEdition?.id;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Aide</h1>
      <p className="text-sm text-gray-600 mb-6">
        Retrouvez ici toutes les informations utiles pour participer à la bourse aux vêtements et articles de puériculture organisée par l'association ALPE.
      </p>

      {/* Sommaire (AC-1) */}
      <nav className="mb-8 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Sommaire</h2>
        <ul className="space-y-1 text-sm">
          <li>
            <a href="#comment-ca-marche" className="text-blue-600 hover:text-blue-700 underline">
              Comment ça marche
            </a>
          </li>
          <li>
            <a href="#guide-deposant" className="text-blue-600 hover:text-blue-700 underline">
              Guide du déposant
            </a>
          </li>
          <li>
            <a href="#faq" className="text-blue-600 hover:text-blue-700 underline">
              Questions fréquentes (FAQ)
            </a>
          </li>
          <li>
            <a href="#reglement" className="text-blue-600 hover:text-blue-700 underline">
              Règlement
            </a>
          </li>
          <li>
            <a href="#contact" className="text-blue-600 hover:text-blue-700 underline">
              Contact et assistance
            </a>
          </li>
          {isVolunteerOrAbove && (
            <li>
              <a href="#guide-benevole" className="text-blue-600 hover:text-blue-700 underline">
                Guide bénévole
              </a>
            </li>
          )}
          {isManagerOrAdmin && (
            <li>
              <a href="#guide-gestionnaire" className="text-blue-600 hover:text-blue-700 underline">
                Guide gestionnaire
              </a>
            </li>
          )}
        </ul>
      </nav>

      <div className="space-y-10">
        {/* Comment ça marche (AC-2) */}
        <section id="comment-ca-marche">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Comment ça marche</h2>

          <p className="text-sm text-gray-700 mb-3">
            La bourse ALPE est un événement organisé par l'association ALPE Plaisance du Touch.
            Elle permet aux particuliers de vendre des vêtements, jouets, livres et articles de puériculture
            d'occasion, et aux acheteurs de trouver des articles de qualité à petits prix.
          </p>

          <p className="text-sm text-gray-700 mb-3">
            <strong>Principe :</strong> les déposants déclarent leurs articles en ligne, les déposent le jour de la collecte,
            et les bénévoles se chargent de la vente au public. Après la bourse, les déposants récupèrent
            leurs invendus et reçoivent 80% du montant de leurs ventes. L'association prélève une commission
            de 20% pour financer ses activités.
          </p>

          <h3 className="text-base font-medium text-gray-900 mt-4 mb-2">Les grandes étapes</h3>
          <ol className="text-sm text-gray-700 list-decimal pl-5 space-y-2">
            <li><strong>Inscription</strong> — Les déposants s'inscrivent via la plateforme Billetweb et reçoivent une invitation par email pour activer leur compte.</li>
            <li><strong>Déclaration des articles</strong> — Chaque déposant crée sa liste d'articles en ligne : description, catégorie, prix.</li>
            <li><strong>Dépôt physique</strong> — Le jour de la collecte, les déposants apportent leurs articles avec les étiquettes préparées par l'association.</li>
            <li><strong>Vente au public</strong> — Les bénévoles vendent les articles lors de la bourse. Chaque vente est enregistrée par scan QR.</li>
            <li><strong>Récupération des invendus</strong> — Après la bourse, les déposants récupèrent les articles non vendus.</li>
            <li><strong>Reversement</strong> — Les déposants reçoivent 80% du montant total de leurs ventes.</li>
          </ol>

          <div className="mt-4 bg-blue-50 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              <strong>Volume typique :</strong> environ 250 déposants et 3 000 articles par édition.
            </p>
          </div>
        </section>

        {/* Guide du déposant (AC-3) */}
        <section id="guide-deposant">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Guide du déposant</h2>

          <p className="text-sm text-gray-700 mb-4">
            Voici le parcours complet d'un déposant, de l'inscription au reversement.
          </p>

          <h3 className="text-base font-medium text-gray-900 mt-4 mb-2">1. Inscription et activation du compte</h3>
          <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
            <li>Inscrivez-vous à la bourse via Billetweb (lien communiqué par l'association).</li>
            <li>Vous recevrez un email d'invitation avec un lien pour activer votre compte.</li>
            <li>Cliquez sur le lien et définissez votre mot de passe. Le lien est valide 7 jours.</li>
            <li>Si le lien a expiré, contactez les organisateurs pour obtenir une relance.</li>
          </ul>

          <h3 className="text-base font-medium text-gray-900 mt-4 mb-2">2. Déclaration des articles</h3>
          <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
            <li>Connectez-vous et accédez à «&nbsp;Mes listes&nbsp;» pour créer ou compléter votre liste.</li>
            <li>Chaque liste peut contenir jusqu'à <strong>24 articles</strong> dont <strong>12 vêtements maximum</strong>.</li>
            <li>Vous pouvez avoir jusqu'à <strong>2 listes</strong> par édition.</li>
            <li>Pour chaque article : indiquez la catégorie, une description et le prix souhaité (minimum 1&nbsp;€).</li>
            <li>Consultez la section <a href="#reglement" className="text-blue-600 hover:text-blue-700 underline">Règlement</a> pour les prix indicatifs et les articles acceptés.</li>
          </ul>

          <h3 className="text-base font-medium text-gray-900 mt-4 mb-2">3. Validation de la liste</h3>
          <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
            <li>Une fois tous vos articles saisis, validez votre liste.</li>
            <li>Vous devez certifier que vos articles sont propres, en bon état et conformes aux conditions de vente.</li>
            <li><strong>Attention : la validation est définitive.</strong> Vous ne pourrez plus modifier votre liste après cette étape.</li>
            <li>La date limite de déclaration est fixée à <strong>3 semaines avant la collecte</strong>.</li>
          </ul>

          <h3 className="text-base font-medium text-gray-900 mt-4 mb-2">4. Jour du dépôt</h3>
          <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
            <li>Présentez-vous au créneau de dépôt qui vous a été attribué.</li>
            <li>Apportez vos articles — les étiquettes sont préparées et imprimées par l'association.</li>
            <li>Les bénévoles vérifient chaque article : conformité, état, correspondance avec la déclaration.</li>
            <li>Les articles non conformes pourront être refusés (tachés, abîmés, incomplets).</li>
          </ul>

          <h3 className="text-base font-medium text-gray-900 mt-4 mb-2">5. Après la vente</h3>
          <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
            <li>Récupérez vos articles invendus à la date prévue.</li>
            <li>Les articles non récupérés pourront être donnés à une association.</li>
            <li>Vous recevez <strong>80% du montant total de vos ventes</strong> (la commission de 20% revient à ALPE).</li>
            <li>Le paiement se fait en espèces, par chèque ou par virement selon l'édition.</li>
          </ul>

          <h3 className="text-base font-medium text-gray-900 mt-4 mb-2">Cycle de vie d'une liste</h3>
          <p className="text-sm text-gray-700 mb-2">
            Chaque liste passe par plusieurs étapes, de sa création jusqu'au paiement final :
          </p>
          <ol className="text-sm text-gray-700 list-decimal pl-5 space-y-2">
            <li>
              <strong className="text-yellow-700">Brouillon</strong> — Votre liste vient d'être créée.
              Vous pouvez ajouter, modifier et supprimer des articles librement.
            </li>
            <li>
              <strong className="text-green-700">Validée</strong> — Vous avez validé votre liste.
              Vous pouvez imprimer vos étiquettes. Aucune modification n'est plus possible.
            </li>
            <li>
              <strong className="text-blue-700">Déposée</strong> — Vos articles ont été vérifiés et enregistrés par les bénévoles. Ils sont en vente.
            </li>
            <li>
              <strong className="text-gray-700">Récupérée</strong> — Vous avez récupéré vos articles invendus.
            </li>
            <li>
              <strong className="text-orange-700">Paiement en attente</strong> — Le décompte de vos ventes est effectué. Votre paiement est en préparation.
            </li>
            <li>
              <strong className="text-green-700">Paiement effectué</strong> — Vous avez reçu le produit de vos ventes. Le cycle est terminé.
            </li>
          </ol>
        </section>

        {/* FAQ (AC-4) */}
        <section id="faq">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Questions fréquentes (FAQ)</h2>

          <h3 className="text-base font-medium text-gray-900 mt-4 mb-2">Inscription et compte</h3>
          <dl className="text-sm text-gray-700 space-y-3">
            <div>
              <dt className="font-medium">Comment m'inscrire ?</dt>
              <dd className="pl-4 mt-1">Inscrivez-vous via Billetweb (lien communiqué par l'association), puis activez votre compte en cliquant sur le lien reçu par email.</dd>
            </div>
            <div>
              <dt className="font-medium">Mon lien d'activation a expiré, que faire ?</dt>
              <dd className="pl-4 mt-1">Contactez les organisateurs pour qu'ils vous envoient une nouvelle invitation. Le lien est valide 7 jours.</dd>
            </div>
            <div>
              <dt className="font-medium">J'ai oublié mon mot de passe</dt>
              <dd className="pl-4 mt-1">
                Utilisez la page{' '}
                <Link to="/forgot-password" className="text-blue-600 hover:text-blue-700 underline">
                  Mot de passe oublié
                </Link>
                {' '}pour recevoir un lien de réinitialisation par email.
              </dd>
            </div>
          </dl>

          <h3 className="text-base font-medium text-gray-900 mt-6 mb-2">Articles et listes</h3>
          <dl className="text-sm text-gray-700 space-y-3">
            <div>
              <dt className="font-medium">Combien d'articles puis-je déposer ?</dt>
              <dd className="pl-4 mt-1">Jusqu'à 24 articles par liste (dont 12 vêtements maximum), et 2 listes maximum par édition.</dd>
            </div>
            <div>
              <dt className="font-medium">Quels articles sont refusés ?</dt>
              <dd className="pl-4 mt-1">
                Sièges-autos, biberons, sous-vêtements, maillots de bain, chaussettes dépareillées, articles incomplets ou en mauvais état.
                Consultez la section{' '}
                <a href="#reglement" className="text-blue-600 hover:text-blue-700 underline">Règlement</a>
                {' '}pour la liste complète.
              </dd>
            </div>
            <div>
              <dt className="font-medium">Comment fixer le prix de mes articles ?</dt>
              <dd className="pl-4 mt-1">
                Le prix minimum est de 1&nbsp;€. Consultez la{' '}
                <a href="#reglement" className="text-blue-600 hover:text-blue-700 underline">grille de prix indicatifs</a>
                {' '}dans le règlement pour vous aider.
              </dd>
            </div>
            <div>
              <dt className="font-medium">Puis-je modifier ma liste après validation ?</dt>
              <dd className="pl-4 mt-1">Non, la validation est définitive. Assurez-vous que tous vos articles sont correctement saisis avant de valider.</dd>
            </div>
          </dl>

          <h3 className="text-base font-medium text-gray-900 mt-6 mb-2">Dépôt et vente</h3>
          <dl className="text-sm text-gray-700 space-y-3">
            <div>
              <dt className="font-medium">Que se passe-t-il le jour du dépôt ?</dt>
              <dd className="pl-4 mt-1">Les bénévoles vérifient chaque article : conformité au règlement, état général, correspondance avec votre déclaration. Les articles non conformes peuvent être refusés.</dd>
            </div>
            <div>
              <dt className="font-medium">Un article a été refusé, pourquoi ?</dt>
              <dd className="pl-4 mt-1">L'article n'est pas conforme au règlement : taché, abîmé, incomplet, ou non autorisé à la vente. Les bénévoles peuvent aussi corriger la description ou le prix si nécessaire.</dd>
            </div>
          </dl>

          <h3 className="text-base font-medium text-gray-900 mt-6 mb-2">Paiement et reversement</h3>
          <dl className="text-sm text-gray-700 space-y-3">
            <div>
              <dt className="font-medium">Quand et comment suis-je payé ?</dt>
              <dd className="pl-4 mt-1">Lors de la restitution des invendus, en espèces, par chèque ou par virement selon les modalités de l'édition.</dd>
            </div>
            <div>
              <dt className="font-medium">Comment est calculé mon reversement ?</dt>
              <dd className="pl-4 mt-1">Vous recevez 80% du total de vos ventes. Les 20% restants sont la commission prélevée par l'association ALPE.</dd>
            </div>
          </dl>
        </section>

        {/* Règlement (AC-5) */}
        <section id="reglement">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Règlement</h2>

          <h3 className="text-base font-medium text-gray-900 mt-4 mb-2">Catégories d'articles acceptés</h3>
          <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
            <li>Vêtements enfant et adulte</li>
            <li>Chaussures</li>
            <li>Puériculture (poussettes, lits, chaises hautes...)</li>
            <li>Jouets et jeux</li>
            <li>Livres</li>
            <li>Accessoires (sacs, bijoux fantaisie...)</li>
            <li>Matériel de sport</li>
          </ul>

          <h3 className="text-base font-medium text-gray-900 mt-4 mb-2">Limites par catégorie</h3>
          <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
            <li>12 vêtements maximum par liste</li>
            <li>1 manteau maximum par liste</li>
            <li>1 sac à main maximum par liste</li>
            <li>5 livres adultes maximum par liste</li>
            <li>24 articles au total par liste</li>
          </ul>

          <h3 className="text-base font-medium text-gray-900 mt-4 mb-2">Articles refusés</h3>
          <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
            <li>Sièges-autos et rehausseurs</li>
            <li>Biberons, tétines, sucettes</li>
            <li>Sous-vêtements (adultes et enfants)</li>
            <li>Maillots de bain</li>
            <li>Chaussettes dépareillées</li>
            <li>Articles tachés, troués ou en mauvais état</li>
            <li>Articles incomplets (pièces manquantes, jeux incomplets)</li>
            <li>Articles ne fonctionnant pas (jouets électroniques, etc.)</li>
          </ul>

          <h3 className="text-base font-medium text-gray-900 mt-4 mb-2">Prix indicatifs</h3>
          <p className="text-sm text-gray-700 mb-2">
            Ces prix sont donnés à titre indicatif pour vous aider à fixer un prix juste.
            Le prix minimum est de <strong>1&nbsp;€</strong> par article.
          </p>
          <div className="overflow-x-auto">
            <table className="text-sm text-gray-700 w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 pr-4 font-medium">Catégorie</th>
                  <th className="text-left py-2 font-medium">Prix indicatif</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr><td className="py-1.5 pr-4">T-shirt, body</td><td className="py-1.5">1 – 3 €</td></tr>
                <tr><td className="py-1.5 pr-4">Pull, gilet</td><td className="py-1.5">3 – 8 €</td></tr>
                <tr><td className="py-1.5 pr-4">Pantalon, jupe</td><td className="py-1.5">3 – 10 €</td></tr>
                <tr><td className="py-1.5 pr-4">Robe</td><td className="py-1.5">5 – 15 €</td></tr>
                <tr><td className="py-1.5 pr-4">Manteau, blouson</td><td className="py-1.5">8 – 25 €</td></tr>
                <tr><td className="py-1.5 pr-4">Chaussures</td><td className="py-1.5">3 – 15 €</td></tr>
                <tr><td className="py-1.5 pr-4">Jouet</td><td className="py-1.5">2 – 20 €</td></tr>
                <tr><td className="py-1.5 pr-4">Livre enfant</td><td className="py-1.5">1 – 5 €</td></tr>
                <tr><td className="py-1.5 pr-4">Livre adulte</td><td className="py-1.5">1 – 8 €</td></tr>
                <tr><td className="py-1.5 pr-4">Poussette</td><td className="py-1.5">30 – 150 €</td></tr>
                <tr><td className="py-1.5 pr-4">Lit, chaise haute</td><td className="py-1.5">20 – 80 €</td></tr>
                <tr><td className="py-1.5 pr-4">Matériel de sport</td><td className="py-1.5">5 – 50 €</td></tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-base font-medium text-gray-900 mt-4 mb-2">Critères de conformité</h3>
          <p className="text-sm text-gray-700 mb-2">
            Chaque article mis en vente doit respecter les critères suivants :
          </p>
          <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
            <li><strong>Propre :</strong> l'article doit être lavé et ne présenter aucune tache</li>
            <li><strong>En bon état :</strong> pas de trou, déchirure ou usure excessive</li>
            <li><strong>Complet :</strong> boutons présents, fermetures fonctionnelles, pas de pièce manquante</li>
            <li><strong>Prêt à être vendu :</strong> l'article doit être dans un état présentable pour un acheteur</li>
          </ul>
        </section>

        {/* Contact et assistance (AC-6) */}
        <section id="contact">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Contact et assistance</h2>

          <p className="text-sm text-gray-700 mb-3">
            Vous avez une question ou besoin d'aide ? Contactez l'équipe organisatrice :
          </p>

          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <svg className="w-5 h-5 text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <a href={`mailto:${config.supportEmail}`} className="text-blue-600 hover:text-blue-700 underline">
                {config.supportEmail}
              </a>
            </div>

            {isAuthenticated && activeEditionId && (
              <div className="flex items-center gap-2 text-sm">
                <svg className="w-5 h-5 text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <Link
                  to={`/editions/${activeEditionId}/tickets/new`}
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  Envoyer un message aux organisateurs
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Guide bénévole (AC-7) */}
        {isVolunteerOrAbove && (
          <section id="guide-benevole">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Guide bénévole</h2>
            <p className="text-sm text-gray-500 mb-4">
              Cette section est réservée aux bénévoles, gestionnaires et administrateurs.
            </p>

            <h3 className="text-base font-medium text-gray-900 mt-4 mb-2">Scanner un article</h3>
            <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
              <li>Utilisez le scanner QR intégré pour lire l'étiquette de l'article.</li>
              <li>Si le scan ne fonctionne pas, saisissez le code de l'article manuellement.</li>
              <li>Les informations de l'article (description, prix) s'affichent automatiquement.</li>
            </ul>

            <h3 className="text-base font-medium text-gray-900 mt-4 mb-2">Enregistrer une vente</h3>
            <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
              <li>Scannez l'article → vérifiez les informations → confirmez la vente.</li>
              <li>Choisissez le mode de paiement : espèces, carte bancaire ou chèque.</li>
              <li>Un signal sonore confirme l'enregistrement de la vente.</li>
            </ul>

            <h3 className="text-base font-medium text-gray-900 mt-4 mb-2">Panier multi-articles</h3>
            <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
              <li>Scannez plusieurs articles à la suite pour les regrouper dans un panier.</li>
              <li>Le total s'affiche en temps réel.</li>
              <li>Validez le panier en une seule transaction avec un seul mode de paiement.</li>
            </ul>

            <h3 className="text-base font-medium text-gray-900 mt-4 mb-2">Annuler une vente</h3>
            <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
              <li>Vous pouvez annuler une vente dans les 5 minutes suivant son enregistrement.</li>
              <li>Au-delà de 5 minutes, contactez un gestionnaire pour procéder à l'annulation.</li>
            </ul>

            <h3 className="text-base font-medium text-gray-900 mt-4 mb-2">Revue des listes au dépôt</h3>
            <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
              <li>Lors du dépôt, vérifiez chaque article de la liste du déposant.</li>
              <li>Pour chaque article : <strong>accepter</strong> (conforme), <strong>refuser</strong> (non conforme) ou <strong>corriger</strong> (description ou prix à ajuster).</li>
              <li>Une fois tous les articles vérifiés, finalisez la revue pour valider le dépôt.</li>
            </ul>

            <h3 className="text-base font-medium text-gray-900 mt-4 mb-2">Mode hors ligne</h3>
            <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
              <li>En cas de perte de connexion, l'application continue de fonctionner.</li>
              <li>Les ventes sont enregistrées localement et synchronisées automatiquement au retour du réseau.</li>
              <li>Une bannière orange indique que vous êtes en mode hors ligne.</li>
            </ul>
          </section>
        )}

        {/* Guide gestionnaire (AC-8) */}
        {isManagerOrAdmin && (
          <section id="guide-gestionnaire">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Guide gestionnaire</h2>
            <p className="text-sm text-gray-500 mb-4">
              Cette section est réservée aux gestionnaires et administrateurs.
            </p>

            <h3 className="text-base font-medium text-gray-900 mt-4 mb-2">Créer et configurer une édition</h3>
            <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
              <li>Accédez à <strong>Éditions</strong> et cliquez sur «&nbsp;Nouvelle édition&nbsp;».</li>
              <li>Configurez les dates clés : inscription, dépôt, vente, restitution.</li>
              <li>Définissez les créneaux de dépôt avec leurs capacités.</li>
              <li>Le taux de commission est de 20% par défaut.</li>
            </ul>

            <h3 className="text-base font-medium text-gray-900 mt-4 mb-2">Importer les inscriptions</h3>
            <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
              <li><strong>Import CSV :</strong> téléchargez l'export Billetweb et importez-le dans l'application.</li>
              <li><strong>Synchronisation API :</strong> configurez la connexion Billetweb dans les paramètres pour synchroniser automatiquement.</li>
              <li>Les déposants importés reçoivent une invitation par email pour activer leur compte.</li>
            </ul>

            <h3 className="text-base font-medium text-gray-900 mt-4 mb-2">Gérer les invitations</h3>
            <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
              <li>Création manuelle : ajoutez un déposant avec son email et ses informations.</li>
              <li>Import CSV en masse : importez une liste de déposants depuis un fichier.</li>
              <li>Relance : renvoyez l'email d'invitation aux déposants qui n'ont pas encore activé leur compte.</li>
            </ul>

            <h3 className="text-base font-medium text-gray-900 mt-4 mb-2">Générer les étiquettes</h3>
            <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
              <li>Générez les étiquettes PDF par créneau de dépôt ou pour toute l'édition.</li>
              <li>Chaque étiquette contient un QR code unique pour le scan lors de la vente.</li>
              <li>Imprimez les étiquettes sur des planches A4 standard.</li>
            </ul>

            <h3 className="text-base font-medium text-gray-900 mt-4 mb-2">Suivre les reversements</h3>
            <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
              <li>Le calcul des reversements se fait automatiquement à partir des ventes enregistrées.</li>
              <li>Générez les bordereaux de paiement individuels (PDF).</li>
              <li>Enregistrez les paiements effectués pour chaque déposant.</li>
            </ul>

            <h3 className="text-base font-medium text-gray-900 mt-4 mb-2">Consulter les statistiques</h3>
            <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
              <li>Le tableau de bord affiche les statistiques en temps réel : ventes, articles, montants.</li>
              <li>Exportez les données au format Excel pour une analyse détaillée.</li>
              <li>Suivez l'avancement des inscriptions et des dépôts via les statistiques dédiées.</li>
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
