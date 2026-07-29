(function(){
const { Button, SectionTitle, EventCard, StatTile, Card, SchoolChip, Tabs, Swoosh, Badge } = window.ALPEDesignSystem_2d31df;

const ALPE_SCHOOLS = [
  { name: 'Le Blé en Herbe', level: 'maternelle' }, { name: 'La Rivière', level: 'maternelle' },
  { name: 'Marcel Pagnol', level: 'maternelle' }, { name: 'Pauline Kergomard', level: 'maternelle' },
  { name: 'Trois Pommes', level: 'maternelle' }, { name: 'Alphonse Daudet', level: 'elementaire' },
  { name: 'Jacques Prévert', level: 'elementaire' }, { name: 'La Rivière', level: 'elementaire' },
  { name: 'Marcel Pagnol', level: 'elementaire' }, { name: 'Jules Verne', level: 'college' },
  { name: 'Galilée', level: 'college', city: 'La Salvetat' }, { name: 'Dissart-Françoise', level: 'lycee', city: 'Tournefeuille' },
];

function Hero({ go }) {
  const { Container } = window;
  return (
    <section style={{ position: 'relative', background: 'var(--surface-page)', overflow: 'hidden' }}>
      <Container style={{ padding: 'var(--space-20) var(--gutter) var(--space-16)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 'var(--space-16)', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
              <Badge tone="orange">Locale</Badge><Badge tone="blue">Indépendante</Badge><Badge tone="yellow">Apolitique</Badge>
            </div>
            <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 'var(--weight-extrabold)', fontSize: 'var(--text-5xl)', lineHeight: 'var(--leading-tight)', color: 'var(--text-heading)', textWrap: 'pretty', position: 'relative' }}>
              <span style={{ position: 'relative', zIndex: 1 }}>Le bien-être de l'élève,</span><br />
              <span style={{ position: 'relative', zIndex: 1, color: 'var(--brand-secondary)' }}>depuis 1987</span>
              <span aria-hidden="true" style={{ position: 'absolute', left: 0, width: '58%', bottom: 6, height: 12, background: 'var(--brand-accent)', borderRadius: 'var(--radius-pill)', zIndex: 0 }} />
            </h1>
            <p style={{ marginTop: 'var(--space-5)', fontSize: 'var(--text-lg)', lineHeight: 'var(--leading-normal)', maxWidth: 540 }}>
              Nous sommes une association de parents d'élèves de Plaisance du Touch, présente dans les douze établissements du territoire, de la petite section à la terminale.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-8)' }}>
              <Button variant="secondary" size="lg" onClick={() => go('adhesion')}>Adhérez</Button>
              <Button variant="outline" size="lg" onClick={() => go('association')}>Qui sommes-nous ?</Button>
            </div>
          </div>
          <div style={{ position: 'relative', background: 'var(--surface-brand-soft)', borderRadius: 'var(--radius-2xl)', aspectRatio: '4 / 3', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 'var(--space-8)' }}>
            <div>
              <img src="../../assets/logo-v2-mark.svg" alt="" style={{ width: 190, opacity: 0.9 }} />
              <div style={{ marginTop: 'var(--space-4)', fontSize: 'var(--text-2xs)', fontWeight: 700, letterSpacing: 'var(--tracking-wide)', textTransform: 'uppercase', color: 'var(--blue-400)' }}>
                Emplacement photo — bourse ou forum
              </div>
              <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)', marginTop: 6 }}>Aucune photothèque fournie</div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function StatBand() {
  const { Container } = window;
  return (
    <Container>
      <div style={{ background: 'var(--surface-inverse)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-10) var(--space-12)', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-8)', alignItems: 'start' }}>
        <StatTile tone="inverse" value="170" label="familles adhérentes" />
        <StatTile tone="inverse" value="12" label="établissements couverts" sublabel="de la PS à la terminale" />
        <StatTile tone="inverse" value="60" label="bénévoles mobilisés" sublabel="sur les deux bourses" />
        <StatTile tone="inverse" value="10 €" label="de cotisation" sublabel="par famille et par an" />
      </div>
    </Container>
  );
}

function Actions({ go }) {
  const { Container } = window;
  const actions = [
    { t: 'Bourse aux vêtements', d: "Deux fois par an à l'espace Monestié, environ 10 000 articles déposés par les familles.", i: 'fa-solid fa-shirt', a: 'orange', go: 'bourse' },
    { t: 'Forum des métiers', d: '35ᵉ édition les 18 & 19 février 2026 : plus de 90 exposants pour environ 1 100 collégiens.', i: 'fa-solid fa-compass', a: 'blue' },
    { t: 'Représentation des parents', d: 'Des têtes de liste dans chaque établissement, présentes en conseil d\'école et d\'administration.', i: 'fa-solid fa-people-group', a: 'blue' },
    { t: 'Commission cantine', d: 'Nous suivons les menus et la qualité du service de restauration scolaire.', i: 'fa-solid fa-utensils', a: 'orange' },
    { t: 'Actions éco-citoyennes', d: 'Sensibilisation au tri, aux mobilités douces et au gaspillage alimentaire.', i: 'fa-solid fa-leaf', a: 'blue' },
  ];
  return (
    <section style={{ padding: 'var(--section-y) 0' }}>
      <Container>
        <SectionTitle eyebrow="Nos actions" title="Ce que nous faisons, concrètement" lead="Représenter les parents, faire vivre l'association par ses événements, et peser sur le quotidien scolaire." />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-5)', marginTop: 'var(--space-10)' }}>
          {actions.map((a) => (
            <Card key={a.t} accent={a.a} interactive onClick={() => a.go && go(a.go)}>
              <i className={a.i} aria-hidden="true" style={{ fontSize: 22, color: a.a === 'orange' ? 'var(--brand-secondary)' : 'var(--brand-primary)' }} />
              <h3 style={{ margin: 'var(--space-4) 0 0', fontSize: 'var(--text-xl)' }}>{a.t}</h3>
              <p style={{ margin: 'var(--space-2) 0 0', fontSize: 'var(--text-sm)' }}>{a.d}</p>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}

function Agenda({ go }) {
  const { Container } = window;
  return (
    <section style={{ background: 'var(--surface-muted)', padding: 'var(--section-y) 0' }}>
      <Container>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 'var(--space-8)' }}>
          <SectionTitle eyebrow="Prochains rendez-vous" title="L'agenda de l'association" />
          <Button variant="ghost" iconRight="fa-solid fa-arrow-right">Tous les événements</Button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-5)', marginTop: 'var(--space-8)' }}>
          <EventCard title="Bourse Printemps 2026" dateLabel="18 & 19 avril" timeLabel="Sam. 9h–18h · Dim. 9h–13h" place="Espace Monestié" badge="Créneaux complets" badgeTone="warning" excerpt="Vêtements adultes et enfants, jouets, livres, matériel et articles de sport." href="#" cta="La bourse" />
          <EventCard title="35ᵉ Forum des métiers et des formations" dateLabel="18 & 19 février 2026" timeLabel="Nocturne le 18 dès 18h" place="Plaisance du Touch" excerpt="Plus de 90 exposants pour environ 1 100 collégiens issus de huit établissements." href="#" cta="Le programme" />
          <EventCard title="Assemblée générale" dateLabel="24 septembre 2026" timeLabel="20h30" place="Salle des associations" excerpt="Bilan de l'année, vote du budget et renouvellement du conseil d'administration." href="#" cta="En savoir plus" />
        </div>
      </Container>
    </section>
  );
}

function Schools() {
  const { Container } = window;
  const [level, setLevel] = React.useState('Tous');
  const map = { Maternelles: 'maternelle', Élémentaires: 'elementaire', Collèges: 'college', Lycée: 'lycee' };
  const shown = level === 'Tous' ? ALPE_SCHOOLS : ALPE_SCHOOLS.filter((s) => s.level === map[level]);
  return (
    <section style={{ padding: 'var(--section-y) 0' }}>
      <Container>
        <SectionTitle eyebrow="Les établissements" title="Présents partout, de la maternelle au lycée" lead="Douze établissements couverts, ce qui est rare pour une association de parents non fédérée." />
        <div style={{ marginTop: 'var(--space-8)' }}>
          <Tabs items={['Tous', 'Maternelles', 'Élémentaires', 'Collèges', 'Lycée']} value={level} onChange={setLevel} />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
          {shown.map((s, i) => <SchoolChip key={s.name + i} name={s.name} level={s.level} city={s.city} href="#" />)}
        </div>
      </Container>
    </section>
  );
}

function JoinBand({ go }) {
  const { Container } = window;
  return (
    <Container>
      <div style={{ position: 'relative', background: 'var(--surface-brand)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-16) var(--space-12)', overflow: 'hidden', textAlign: 'center' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: -10, opacity: 0.5 }}><Swoosh height={120} thickness={12} /></div>
        <div style={{ position: 'relative' }}>
          <SectionTitle inverse align="center" title="10 € par famille, et vous comptez dans les décisions" lead="La cotisation et les bourses sont nos seules ressources : aucune subvention, aucune fédération, aucune consigne venue d'ailleurs." style={{ margin: '0 auto' }} />
          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', marginTop: 'var(--space-8)' }}>
            <Button variant="inverse" size="lg" onClick={() => go('adhesion')}>Adhérez</Button>
            <Button variant="ghost" size="lg" style={{ color: '#fff', border: '2px solid rgba(255,255,255,.5)' }}>Devenir bénévole</Button>
          </div>
        </div>
      </div>
    </Container>
  );
}

function HomeScreen({ go }) {
  return (<main><Hero go={go} /><StatBand /><Actions go={go} /><Agenda go={go} /><Schools /><JoinBand go={go} /></main>);
}

Object.assign(window, { HomeScreen, ALPE_SCHOOLS });

})();
