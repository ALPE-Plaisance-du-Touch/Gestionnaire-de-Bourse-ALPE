export function HelpPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Aide</h1>

      <nav className="mb-8 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Sommaire</h2>
        <ul className="space-y-1 text-sm">
          <li>
            <a href="#certification" className="text-blue-600 hover:text-blue-700 underline">
              Certification de conformité des articles
            </a>
          </li>
        </ul>
      </nav>

      <div className="prose prose-gray max-w-none space-y-6">
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
