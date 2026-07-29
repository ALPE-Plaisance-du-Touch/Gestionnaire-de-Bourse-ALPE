(function(){
const { SectionTitle, Card, StatTile, Callout, Badge, Button } = window.ALPEDesignSystem_2d31df;

const ALPE_VALUES = [
  { k: 'LOCALE', d: "Nous revendiquons notre ancrage et notre implantation plaisançoise.", i: 'fa-solid fa-location-dot', c: 'var(--brand-primary)' },
  { k: 'INDÉPENDANTE', d: "Aucun lien avec un regroupement national, donc aucune directive imposée. Pas de subvention municipale hors prêt de salles.", i: 'fa-solid fa-compass', c: 'var(--brand-secondary)' },
  { k: 'APOLITIQUE', d: "Aucun parti politique : nos statuts interdisent tout engagement politique aux membres du bureau.", i: 'fa-solid fa-scale-balanced', c: 'var(--brand-primary)' },
];

function AssociationScreen() {
  const { Container, PageHero } = window;
  return (
    <main>
      <PageHero title="L'association" breadcrumb={[{ label: 'Accueil', href: '#' }, "L'association"]} />
      <Container narrow style={{ padding: 'var(--section-y) var(--gutter) 0' }}>
        <p style={{ fontSize: 'var(--text-lg)', lineHeight: 'var(--leading-normal)', color: 'var(--text-strong)' }}>
          Bienvenue sur le site de l'association locale des parents d'élèves (A.L.P.E.) de Plaisance du Touch.
        </p>
        <h2 style={{ marginTop: 'var(--space-10)', fontSize: 'var(--text-2xl)' }}>L'association en quelques mots</h2>
        <p style={{ marginTop: 'var(--space-4)', fontSize: 'var(--text-md)' }}>
          ALPE a été créée en <strong>1987</strong> par une dizaine de familles plaisançoises qui désiraient participer à la vie scolaire et extra-scolaire de leurs enfants, et qui ne se reconnaissaient pas toujours dans les orientations des fédérations nationales. Nos statuts n'ont que très peu changé depuis.
        </p>
        <p style={{ fontSize: 'var(--text-md)' }}>
          <strong>« Le bien-être de l'élève »</strong>, voilà la conviction qui anime aujourd'hui les <strong>170 familles adhérentes</strong>. Toutes les décisions et grandes orientations de ALPE ont été, sont encore et seront toujours prises dans le respect de ce principe.
        </p>
      </Container>
      <Container style={{ padding: 'var(--section-y-tight) var(--gutter)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-5)' }}>
          {ALPE_VALUES.map((v) => (
            <Card key={v.k}>
              <i className={v.i} aria-hidden="true" style={{ fontSize: 22, color: v.c }} />
              <div style={{ marginTop: 'var(--space-4)', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'var(--text-lg)', letterSpacing: 'var(--tracking-caps)', color: v.c }}>{v.k}</div>
              <p style={{ margin: 'var(--space-3) 0 0', fontSize: 'var(--text-sm)' }}>{v.d}</p>
            </Card>
          ))}
        </div>
      </Container>
      <Container narrow style={{ paddingBottom: 'var(--section-y)' }}>
        <Callout tone="info" title="Cotisation annuelle">
          Le montant annuel de la cotisation est de <strong>10 € par famille</strong> (chèque à l'ordre de ALPE).
        </Callout>
        <h2 style={{ marginTop: 'var(--space-12)', fontSize: 'var(--text-2xl)' }}>L'équipe</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-6)', marginTop: 'var(--space-6)' }}>
          <StatTile value="21" label="membres au conseil d'administration" />
          <StatTile tone="orange" value="60" label="bénévoles sur les bourses" />
          <StatTile value="12" label="têtes de liste" sublabel="une par établissement" />
          <StatTile tone="orange" value="1987" label="année de dépôt des statuts" />
        </div>
        <Card muted style={{ marginTop: 'var(--space-8)', display: 'flex', gap: 'var(--space-5)', alignItems: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--surface-brand-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue-300)', fontSize: 10, fontWeight: 700, textAlign: 'center', flex: '0 0 auto' }}>PHOTO</div>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'var(--text-lg)', color: 'var(--text-heading)' }}>Charlotte Watier</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Présidente du conseil d'administration</div>
            <div style={{ marginTop: 'var(--space-3)' }}><Badge tone="neutral">Portrait à fournir</Badge></div>
          </div>
        </Card>
      </Container>
    </main>
  );
}
Object.assign(window, { AssociationScreen });

})();
