export function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-bark mb-6">Politique de confidentialité</h1>

      <div className="prose prose-gray max-w-none space-y-6">
        <section>
          <h2 className="text-lg font-semibold text-bark">1. Responsable du traitement</h2>
          <p className="text-sm text-bark-light">
            L'association ALPE Plaisance du Touch, organisatrice de la bourse aux vêtements et jouets
            d'occasion, est responsable du traitement de vos données personnelles dans le cadre de cette
            application.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-bark">2. Données collectées</h2>
          <p className="text-sm text-bark-light">Nous collectons les données suivantes :</p>
          <ul className="text-sm text-bark-light list-disc pl-5 space-y-1">
            <li><strong>Identité :</strong> nom, prénom, adresse email</li>
            <li><strong>Contact :</strong> numéro de téléphone, adresse postale</li>
            <li><strong>Transactions :</strong> articles déposés, ventes réalisées, reversements</li>
            <li><strong>Technique :</strong> adresse IP, données de connexion (à des fins de sécurité)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-bark">3. Finalités du traitement</h2>
          <p className="text-sm text-bark-light">Vos données sont traitées pour :</p>
          <ul className="text-sm text-bark-light list-disc pl-5 space-y-1">
            <li>La gestion de votre compte et de vos inscriptions aux bourses</li>
            <li>Le suivi de vos articles déposés et de leurs ventes</li>
            <li>Le calcul et le versement de vos reversements</li>
            <li>L'envoi de notifications liées aux bourses (inscription, ventes, reversements)</li>
            <li>La sécurité et la prévention des fraudes</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-bark">4. Base légale</h2>
          <p className="text-sm text-bark-light">
            Le traitement est fondé sur l'exécution du contrat (votre participation à la bourse)
            et l'intérêt légitime de l'association (gestion administrative, sécurité).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-bark">5. Durée de conservation</h2>
          <p className="text-sm text-bark-light">
            Vos données personnelles sont conservées pendant la durée de votre participation active.
            Après suppression de votre compte, vos données sont anonymisées. Les données de transactions
            sont conservées à des fins comptables conformément aux obligations légales.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-bark">6. Vos droits (RGPD)</h2>
          <p className="text-sm text-bark-light">Conformément au Règlement Général sur la Protection des Données, vous disposez des droits suivants :</p>
          <ul className="text-sm text-bark-light list-disc pl-5 space-y-1">
            <li><strong>Droit d'accès :</strong> obtenir une copie de vos données personnelles</li>
            <li><strong>Droit de rectification :</strong> modifier vos informations depuis votre profil</li>
            <li><strong>Droit à l'effacement :</strong> supprimer votre compte et anonymiser vos données</li>
            <li><strong>Droit à la portabilité :</strong> exporter vos données au format JSON</li>
          </ul>
          <p className="text-sm text-bark-light mt-2">
            Ces droits sont exercables directement depuis la page{' '}
            <a href="/profile" className="text-primary-strong hover:text-primary-strong underline">Mon profil</a>.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-bark">7. Sécurité</h2>
          <p className="text-sm text-bark-light">
            Nous mettons en œuvre des mesures techniques et organisationnelles pour protéger vos données :
            chiffrement des mots de passe, communications sécurisées (HTTPS), contrôle d'accès par rôles.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-bark">8. Contact</h2>
          <p className="text-sm text-bark-light">
            Pour toute question relative à la protection de vos données, contactez-nous à l'adresse
            indiquée sur le site de l'association ALPE Plaisance du Touch.
          </p>
        </section>
      </div>
    </div>
  );
}
