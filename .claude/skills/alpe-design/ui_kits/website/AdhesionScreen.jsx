(function(){
const { SectionTitle, Card, Input, Select, Checkbox, Radio, Button, Callout, Dialog, Toast, StatTile } = window.ALPEDesignSystem_2d31df;

function AdhesionScreen() {
  const { Container, PageHero } = window;
  const [ecole, setEcole] = React.useState('');
  const [rgpd, setRgpd] = React.useState(false);
  const [benevole, setBenevole] = React.useState(false);
  const [paiement, setPaiement] = React.useState('Chèque');
  const [open, setOpen] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  return (
    <main>
      <PageHero title="Adhésion" breadcrumb={[{ label: 'Accueil', href: '#' }, 'Adhésion']} />
      <Container style={{ padding: 'var(--section-y) var(--gutter)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.7fr', gap: 'var(--space-12)', alignItems: 'start' }}>
          <Card padding="var(--space-8)">
            <SectionTitle level={2} title="Rejoignez ALPE pour l'année 2026-2027" lead="Une adhésion par famille, 10 €. Elle vous donne voix au chapitre dans chacun des établissements où nous siégeons." />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-5)', marginTop: 'var(--space-8)' }}>
              <Input label="Nom de famille" placeholder="Dupont" required />
              <Input label="Prénom du ou des parents" placeholder="Camille & Julien" required />
              <Input label="Adresse e-mail" type="email" icon="fa-solid fa-envelope" required hint="Nous ne diffusons jamais votre adresse." />
              <Input label="Téléphone" icon="fa-solid fa-phone" placeholder="06 00 00 00 00" />
              <Select label="Établissement principal" placeholder="Choisissez…" value={ecole} onChange={(e) => setEcole(e.target.value)}
                options={['Le Blé en Herbe', 'La Rivière (maternelle)', 'Marcel Pagnol (maternelle)', 'Pauline Kergomard', 'Trois Pommes', 'Alphonse Daudet', 'Jacques Prévert', 'La Rivière (élémentaire)', 'Marcel Pagnol (élémentaire)', 'Jules Verne', 'Galilée', 'Dissart-Françoise']} />
              <Input label="Nombre d'enfants scolarisés" type="number" defaultValue="2" />
              <div style={{ gridColumn: '1 / -1' }}>
                <Radio name="paiement" legend="Règlement de la cotisation" inline options={['Chèque', 'Espèces', 'Virement']} value={paiement} onChange={setPaiement} />
              </div>
              <Input label="Un mot pour l'équipe (facultatif)" multiline rows={3} style={{ gridColumn: '1 / -1' }} />
              <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <Checkbox label="Je souhaite être bénévole à la bourse aux vêtements" description="Environ 4 h sur un week-end, deux fois par an" checked={benevole} onChange={setBenevole} />
                <Checkbox label="J'accepte que ALPE conserve ces informations pour la durée de l'adhésion" checked={rgpd} onChange={setRgpd} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-8)', alignItems: 'center' }}>
              <Button variant="secondary" size="lg" disabled={!rgpd} onClick={() => setOpen(true)}>Adhérez</Button>
              <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>{rgpd ? '10 € par famille · année scolaire complète' : 'Cochez le consentement pour continuer'}</span>
            </div>
          </Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <Card accent="blue">
              <h4 style={{ margin: 0 }}>Ce que finance votre cotisation</h4>
              <ul style={{ margin: 'var(--space-3) 0 0', paddingLeft: 20, fontSize: 'var(--text-sm)', lineHeight: 'var(--leading-relaxed)' }}>
                <li>La représentation des parents dans les douze établissements</li>
                <li>Le forum des métiers et des formations</li>
                <li>Les actions éco-citoyennes et la commission cantine</li>
              </ul>
            </Card>
            <Callout tone="info" title="Nous restons indépendants">
              Aucune subvention municipale hors prêt de salles et photocopies. Nos ressources : les cotisations et les bourses aux vêtements.
            </Callout>
            <Card muted><StatTile value="10 €" label="par famille et par an" tone="orange" /></Card>
          </div>
        </div>
      </Container>
      <Dialog open={open} title="Confirmer votre adhésion" onClose={() => setOpen(false)}
        footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Annuler</Button><Button variant="secondary" onClick={() => { setOpen(false); setSent(true); }}>Confirmer</Button></>}>
        La cotisation est de <strong>10 € par famille</strong> pour l'année scolaire complète, à régler par {paiement.toLowerCase()} à l'ordre de ALPE. Nous vous recontactons pour finaliser votre inscription.
      </Dialog>
      {sent ? <div style={{ position: 'fixed', right: 24, bottom: 24, zIndex: 200 }}>
        <Toast tone="success" title="Adhésion enregistrée" message="Merci ! Nous vous écrivons sous quelques jours. À très vite !" onClose={() => setSent(false)} />
      </div> : null}
    </main>
  );
}
Object.assign(window, { AdhesionScreen });

})();
