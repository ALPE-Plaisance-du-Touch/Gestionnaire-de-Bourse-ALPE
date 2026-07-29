(function(){
const { Button, IconButton, Badge } = window.ALPEDesignSystem_2d31df;

const ALPE_NAV = [
  { label: "L'association", items: ['Présentation', 'Actualités', 'Événements', "L'équipe ALPE", 'Informations pratiques', 'Contact'] },
  { label: 'Les établissements', items: ['Écoles maternelles', 'Écoles élémentaires', 'Collèges', 'Lycée'] },
  { label: 'Nos actions', items: ['Représentation des parents', 'Actions éco-citoyennes', 'Bourse aux vêtements', 'Forum des métiers et des formations', 'Commission cantine'] },
  { label: 'Adhésion', items: null },
];

function TopBar() {
  return (
    <div style={{ background: 'var(--blue-800)', color: 'rgba(255,255,255,.9)', fontSize: 'var(--text-2xs)' }}>
      <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto', padding: '0 var(--gutter)', height: 38, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          {['fa-brands fa-facebook-f', 'fa-brands fa-instagram', 'fa-brands fa-linkedin-in'].map((i) => (
            <a key={i} href="#" style={{ color: 'inherit', borderBottom: 0 }}><i className={i} aria-hidden="true" /></a>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-5)', alignItems: 'center' }}>
          {['Actualités', 'Événements', 'Contact'].map((l) => <a key={l} href="#" style={{ color: 'inherit', borderBottom: 0, fontWeight: 600 }}>{l}</a>)}
          <span style={{ width: 1, height: 16, background: 'rgba(255,255,255,.25)' }} />
          <a href="#" style={{ color: 'var(--yellow-500)', borderBottom: 0, fontWeight: 700 }}><i className="fa-solid fa-user" aria-hidden="true" style={{ marginRight: 6 }} />Se connecter</a>
        </div>
      </div>
    </div>
  );
}

function SiteHeader({ route, go }) {
  const [open, setOpen] = React.useState(null);
  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 40, background: 'var(--surface-page)', boxShadow: 'var(--shadow-sm)' }}>
      <TopBar />
      <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto', padding: '0 var(--gutter)', height: 92, display: 'flex', alignItems: 'center', gap: 'var(--space-8)' }}>
        <a href="#" onClick={(e) => { e.preventDefault(); go('home'); }} style={{ borderBottom: 0, flex: '0 0 auto' }}>
          <img src="../../assets/logo-alpe-v2-horizontal.png" alt="ALPE — Association Locale de Parents d'Élèves, Plaisance du Touch" style={{ height: 62, display: 'block' }} />
        </a>
        <nav style={{ display: 'flex', gap: 'var(--space-1)', marginLeft: 'auto' }} onMouseLeave={() => setOpen(null)}>
          {ALPE_NAV.map((n) => {
            const active = (route === 'association' && n.label === "L'association") || (route === 'bourse' && n.label === 'Nos actions') || (route === 'adhesion' && n.label === 'Adhésion');
            return (
              <div key={n.label} style={{ position: 'relative' }} onMouseEnter={() => setOpen(n.items ? n.label : null)}>
                <a href="#" onClick={(e) => { e.preventDefault(); if (n.label === 'Adhésion') go('adhesion'); else if (n.label === "L'association") go('association'); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderBottom: 0, borderRadius: 'var(--radius-pill)',
                    fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'var(--text-sm)',
                    color: active ? 'var(--brand-primary)' : 'var(--grey-700)', background: active ? 'var(--surface-brand-soft)' : 'transparent' }}>
                  {n.label}{n.items ? <i className="fa-solid fa-chevron-down" aria-hidden="true" style={{ fontSize: 9, opacity: 0.6 }} /> : null}
                </a>
                {open === n.label && n.items ? (
                  <div style={{ position: 'absolute', top: '100%', left: 0, minWidth: 260, background: 'var(--white)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-subtle)', padding: 'var(--space-2)', display: 'flex', flexDirection: 'column' }}>
                    {n.items.map((it) => (
                      <a key={it} href="#" onClick={(e) => { e.preventDefault(); if (it === 'Bourse aux vêtements') go('bourse'); if (it === 'Présentation') go('association'); setOpen(null); }}
                        style={{ padding: '9px 12px', borderRadius: 'var(--radius-sm)', borderBottom: 0, fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--grey-700)' }}>{it}</a>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
          <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 'var(--space-2)' }}>
            <IconButton icon="fa-solid fa-magnifying-glass" label="Rechercher" size="sm" />
          </div>
        </nav>
      </div>
    </header>
  );
}

function SiteFooter() {
  const col = { display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' };
  const title = { fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'var(--text-xs)', letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase', color: 'var(--yellow-500)', marginBottom: 'var(--space-2)' };
  const link = { color: 'rgba(255,255,255,.82)', borderBottom: 0, fontSize: 'var(--text-sm)' };
  return (
    <footer style={{ background: 'var(--blue-800)', color: 'rgba(255,255,255,.82)', marginTop: 'var(--space-24)' }}>
      <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto', padding: 'var(--space-16) var(--gutter) var(--space-8)', display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1.2fr', gap: 'var(--space-10)' }}>
        <div style={col}>
          <img src="../../assets/logo-alpe-v2-horizontal.png" alt="ALPE" style={{ height: 76, alignSelf: 'flex-start', background: 'var(--white)', borderRadius: 'var(--radius-md)', padding: 10 }} />
          <p style={{ fontSize: 'var(--text-2xs)', lineHeight: 'var(--leading-normal)', margin: 'var(--space-3) 0 0', maxWidth: 260 }}>
            Association locale, indépendante et apolitique de parents d'élèves de Plaisance du Touch. Association loi 1901 depuis 1987.
          </p>
        </div>
        <div style={col}><div style={title}>Accès rapide</div>{['A propos', 'Contact', 'Admin'].map((l) => <a key={l} href="#" style={link}>{l}</a>)}</div>
        <div style={col}><div style={title}>Légal</div>{['Politique de confidentialité', 'Mentions légales'].map((l) => <a key={l} href="#" style={link}>{l}</a>)}</div>
        <div style={col}>
          <div style={title}>Restons en contact</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
            <Button variant="secondary" size="sm">Adhérez</Button>
            <Button variant="inverse" size="sm">Contactez-nous</Button>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
            <IconButton icon="fa-brands fa-facebook-f" label="Facebook" style={{ color: '#fff' }} />
            <IconButton icon="fa-brands fa-instagram" label="Instagram" style={{ color: '#fff' }} />
            <IconButton icon="fa-brands fa-linkedin-in" label="LinkedIn" style={{ color: '#fff' }} />
          </div>
        </div>
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,.14)' }}>
        <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto', padding: 'var(--space-5) var(--gutter)', fontSize: 'var(--text-2xs)' }}>© 2022. Site web par Julien DEL RIO.</div>
      </div>
    </footer>
  );
}

function PageHero({ title, breadcrumb }) {
  const { Breadcrumb } = window.ALPEDesignSystem_2d31df;
  return (
    <div style={{ background: 'var(--surface-muted)', borderBottom: '1px solid var(--border-subtle)' }}>
      <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto', padding: 'var(--space-12) var(--gutter)' }}>
        <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--text-4xl)', color: 'var(--text-heading)' }}>{title}</h1>
        {breadcrumb ? <div style={{ marginTop: 'var(--space-3)' }}><Breadcrumb items={breadcrumb} /></div> : null}
      </div>
    </div>
  );
}

const Container = ({ children, narrow = false, style }) => (
  <div style={{ maxWidth: narrow ? 'var(--container-narrow)' : 'var(--container-max)', margin: '0 auto', padding: '0 var(--gutter)', ...style }}>{children}</div>
);

Object.assign(window, { SiteHeader, SiteFooter, PageHero, Container, ALPE_NAV });

})();
