export function HelpPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Aide</h1>

      <nav className="mb-8 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Sommaire</h2>
        <ul className="space-y-1 text-sm">
          <li>
            <a href="#cycle-de-vie" className="text-blue-600 hover:text-blue-700 underline">
              Cycle de vie d'une liste
            </a>
          </li>
          <li>
            <a href="#certification" className="text-blue-600 hover:text-blue-700 underline">
              Certification de conformité des articles
            </a>
          </li>
        </ul>
      </nav>

      <div className="prose prose-gray max-w-none space-y-6">
        <section id="cycle-de-vie">
          <h2 className="text-lg font-semibold text-gray-900">Cycle de vie d'une liste</h2>

          <p className="text-sm text-gray-700">
            Chaque liste passe par plusieurs étapes, de sa création jusqu'au paiement final.
            Voici les différentes étapes et ce qu'elles signifient pour vous :
          </p>

          <ol className="text-sm text-gray-700 list-decimal pl-5 space-y-3 mt-4">
            <li>
              <strong className="text-yellow-700">Brouillon</strong> — Votre liste vient d'être créée.
              Vous pouvez ajouter, modifier et supprimer des articles librement.
              C'est la seule étape où vous pouvez modifier le contenu de votre liste.
            </li>
            <li>
              <strong className="text-green-700">Validée</strong> — Vous avez validé votre liste après avoir
              certifié la conformité de vos articles. La liste est prête pour le dépôt.
              Vous pouvez imprimer vos étiquettes.
            </li>
            <li>
              <strong className="text-blue-700">Déposée</strong> — Vos articles ont été déposés et enregistrés
              par les bénévoles lors du créneau de dépôt. Ils sont maintenant en vente.
            </li>
            <li>
              <strong className="text-gray-700">Récupérée</strong> — La bourse est terminée. Vous avez récupéré
              vos articles invendus. Les articles non récupérés pourront être donnés à une association.
            </li>
            <li>
              <strong className="text-orange-700">Paiement en attente</strong> — Le décompte de vos ventes a été
              effectué. Votre paiement est en cours de préparation.
            </li>
            <li>
              <strong className="text-green-700">Paiement effectué</strong> — Vous avez reçu le produit de vos ventes
              (déduction faite de la commission). Le cycle est terminé.
            </li>
          </ol>

          <div className="mt-4 bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-600">
              <strong>Rappel :</strong> une fois votre liste validée, vous ne pouvez plus la modifier.
              Assurez-vous que tous vos articles sont bien saisis et que les prix sont corrects avant de valider.
            </p>
          </div>
        </section>

        <section id="certification">
          <h2 className="text-lg font-semibold text-gray-900">Certification de conformité des articles</h2>

          <h3 className="text-base font-medium text-gray-900 mt-4">Qu'est-ce que la certification de conformité ?</h3>
          <p className="text-sm text-gray-700">
            Avant de valider votre liste d'articles pour la bourse, vous devez certifier que chaque article
            est conforme aux critères de qualité de la bourse. Cette certification garantit que tous les articles
            mis en vente répondent à un standard de qualité minimum pour les acheteurs.
          </p>

          <h3 className="text-base font-medium text-gray-900 mt-4">Critères de conformité</h3>
          <p className="text-sm text-gray-700">Un article conforme doit respecter les critères suivants :</p>
          <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
            <li><strong>Propre :</strong> l'article doit être lavé et ne présenter aucune tache</li>
            <li><strong>En bon état :</strong> pas de trou, déchirure ou usure excessive</li>
            <li><strong>Sans défaut majeur :</strong> boutons présents, fermetures fonctionnelles, pas de pièce manquante</li>
            <li><strong>Prêt à être vendu :</strong> l'article doit être dans un état présentable pour un acheteur</li>
          </ul>

          <h3 className="text-base font-medium text-gray-900 mt-4">Certification lors de la validation</h3>
          <p className="text-sm text-gray-700">
            Lors de la validation de votre liste, vous devez cocher une case certifiant que
            tous vos articles sont propres, en bon état et conformes aux conditions de vente.
            Les articles non conformes découverts lors du dépôt pourront être refusés par les bénévoles.
          </p>
        </section>
      </div>
    </div>
  );
}
