(function(){
const { SectionTitle, Card, Callout, Button, EventCard, Badge, StatTile, Tabs } = window.ALPEDesignSystem_2d31df;

function BourseScreen() {
  const { Container, PageHero } = window;
  const [tab, setTab] = React.useState('Déposer');
  return (
    <main>
      <PageHero title="Bourse aux vêtements" breadcrumb={[{ label: 'Accueil', href: '#' }, { label: 'Nos actions', href: '#' }, 'Bourse aux vêtements']} />
      <Container style={{ padding: 'var(--section-y) var(--gutter) 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 0.65fr', gap: 'var(--space-12)', alignItems: 'start' }}>
          <div>
            <SectionTitle eyebrow="Depuis 1987" title="La bourse aux vêtements et aux jouets" lead="Une de nos manifestations préférée !!!" />
            <p style={{ marginTop: 'var(--space-6)', fontSize: 'var(--text-md)' }}>
              Créée aux débuts de l'association en 1987 pour <strong>faire vivre celle-ci</strong>, elle perdure depuis, grâce à de fidèles déposants et aux nombreux bénévoles qui s'y investissent.
            </p>
            <ul style={{ paddingLeft: 22, fontSize: 'var(--text-md)', lineHeight: 'var(--leading-relaxed)' }}>
              <li>Environ <strong>10 000 articles sont proposés à la vente</strong> (vêtements adultes et enfants, jouets, livres, matériels et articles de sport…)</li>
              <li>Plus de 50 % d'articles vendus, <strong>permettant à ALPE de fonctionner</strong> avec les 20 % prélevés sur la totalité de ces ventes.</li>
            </ul>
            <p style={{ fontSize: 'var(--text-md)' }}>
              La bourse permet aux enseignants de Plaisance de renouveler à bas prix les jouets et les livres de leur école. Une <strong>partie de la recette est reversée aux coopératives scolaires</strong> qui mettent en place des projets de classes vertes.
            </p>
            <div style={{ marginTop: 'var(--space-8)' }}>
              <Tabs items={['Déposer', 'Acheter', 'Devenir bénévole']} value={tab} onChange={setTab} />
              <Card style={{ marginTop: 'var(--space-5)' }}>
                {tab === 'Déposer' ? (<div><h4 style={{ margin: 0 }}>Déposer vos articles</h4><p style={{ margin: 'var(--space-3) 0 0', fontSize: 'var(--text-sm)' }}>Le dépôt se fait sur créneau, la semaine précédant la vente. Chaque déposant remplit une liste numérotée ; ALPE retient 20 % du montant des ventes.</p></div>)
                  : tab === 'Acheter' ? (<div><h4 style={{ margin: 0 }}>Venir acheter</h4><p style={{ margin: 'var(--space-3) 0 0', fontSize: 'var(--text-sm)' }}>Entrée libre à l'espace Monestié, samedi de 9h à 18h et dimanche de 9h à 13h. Paiement en espèces ou par chèque.</p></div>)
                  : (<div><h4 style={{ margin: 0 }}>Donner un coup de main</h4><p style={{ margin: 'var(--space-3) 0 0', fontSize: 'var(--text-sm)' }}>Une soixantaine de bénévoles font tourner la bourse : tri, mise en rayon, caisse, restitution. Comptez environ 4 h sur le week-end.</p></div>)}
              </Card>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <Card accent="orange">
              <Badge tone="orange">Bourse Printemps 2026</Badge>
              <h3 style={{ margin: 'var(--space-4) 0 0', fontSize: 'var(--text-xl)' }}>Espace Monestié, Plaisance du Touch</h3>
              <div style={{ marginTop: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                <div><i className="fa-solid fa-calendar-day" aria-hidden="true" style={{ color: 'var(--brand-secondary)', marginRight: 8 }} /><strong>Samedi 18 avril de 9h à 18h</strong></div>
                <div><i className="fa-solid fa-calendar-day" aria-hidden="true" style={{ color: 'var(--brand-secondary)', marginRight: 8 }} /><strong>Dimanche 19 avril de 9h à 13h</strong></div>
              </div>
              <div style={{ marginTop: 'var(--space-5)' }}><Button variant="secondary" fullWidth disabled>Créneaux de dépôt complets</Button></div>
            </Card>
            <Callout tone="warning">Tous nos créneaux déposants sont maintenant complets, nous vous remercions pour votre participation ! À très vite ! <em>L'Équipe Bourse ALPE</em></Callout>
            <Card muted>
              <div style={{ display: 'grid', gap: 'var(--space-5)' }}>
                <StatTile value="10 000" label="articles en vente" />
                <StatTile tone="orange" value="20 %" label="prélevés sur les ventes" sublabel="notre principale ressource" />
              </div>
            </Card>
          </div>
        </div>
      </Container>
      <Container style={{ padding: 'var(--section-y) var(--gutter) 0' }}>
        <SectionTitle eyebrow="Actualités" title="Les éditions précédentes" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-5)', marginTop: 'var(--space-8)' }}>
          <EventCard title="Bourse Automne 2025" dateLabel="8 & 9 novembre 2025" place="Espace Monestié" excerpt="Samedi 8 novembre de 9h à 18h, dimanche 9 novembre de 9h à 13h." href="#" />
          <EventCard title="Bourse Printemps / Été 2025" dateLabel="12 & 13 avril 2025" place="Espace Monestié" excerpt="Les créneaux pour déposer lors de la bourse sont complets !" href="#" />
          <EventCard title="Bourse Automne 2024" dateLabel="9 & 10 novembre 2024" place="Espace Monestié" excerpt="Merci aux soixante bénévoles mobilisés sur ce week-end." href="#" />
        </div>
      </Container>
    </main>
  );
}
Object.assign(window, { BourseScreen });

})();
