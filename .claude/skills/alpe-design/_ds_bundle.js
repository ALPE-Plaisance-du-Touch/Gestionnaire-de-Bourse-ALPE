/* @ds-bundle: {"format":4,"namespace":"ALPEDesignSystem_2d31df","components":[{"name":"Button","sourcePath":"components/actions/Button.jsx"},{"name":"IconButton","sourcePath":"components/actions/IconButton.jsx"},{"name":"Badge","sourcePath":"components/display/Badge.jsx"},{"name":"Card","sourcePath":"components/display/Card.jsx"},{"name":"EventCard","sourcePath":"components/display/EventCard.jsx"},{"name":"SchoolChip","sourcePath":"components/display/SchoolChip.jsx"},{"name":"SectionTitle","sourcePath":"components/display/SectionTitle.jsx"},{"name":"StatTile","sourcePath":"components/display/StatTile.jsx"},{"name":"Swoosh","sourcePath":"components/display/Swoosh.jsx"},{"name":"Tag","sourcePath":"components/display/Tag.jsx"},{"name":"Callout","sourcePath":"components/feedback/Callout.jsx"},{"name":"Dialog","sourcePath":"components/feedback/Dialog.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"Tooltip","sourcePath":"components/feedback/Tooltip.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Radio","sourcePath":"components/forms/Radio.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"Breadcrumb","sourcePath":"components/navigation/Breadcrumb.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"}],"sourceHashes":{"components/actions/Button.jsx":"6fd8994e7c1c","components/actions/IconButton.jsx":"c38e7974a791","components/display/Badge.jsx":"1b9ffede237e","components/display/Card.jsx":"c8f3edd3bb2e","components/display/EventCard.jsx":"8f55b3f1efc4","components/display/SchoolChip.jsx":"98bc4d308b65","components/display/SectionTitle.jsx":"6bd6cb188374","components/display/StatTile.jsx":"cdd4cc097054","components/display/Swoosh.jsx":"922b44f41b1d","components/display/Tag.jsx":"ce15d212d905","components/feedback/Callout.jsx":"fd4842b6ecc1","components/feedback/Dialog.jsx":"bd3e02c766d3","components/feedback/Toast.jsx":"22393660ff87","components/feedback/Tooltip.jsx":"de3a4d5984aa","components/forms/Checkbox.jsx":"576978d13aba","components/forms/Input.jsx":"9f63fe6eac83","components/forms/Radio.jsx":"1559013e20c3","components/forms/Select.jsx":"11e1f3f36370","components/forms/Switch.jsx":"aef2546d4745","components/navigation/Breadcrumb.jsx":"900f41d6b0fd","components/navigation/Tabs.jsx":"9563660ccebe","doc-page.js":"371bab66f42d","ui_kits/website/AdhesionScreen.jsx":"989c7b6cfd5b","ui_kits/website/AssociationScreen.jsx":"86faa7a9cc8c","ui_kits/website/BourseScreen.jsx":"022cf003f3f4","ui_kits/website/HomeScreen.jsx":"6d32c4e15226","ui_kits/website/SiteChrome.jsx":"3c2687924ddc"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.ALPEDesignSystem_2d31df = window.ALPEDesignSystem_2d31df || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/actions/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState
} = React;
const alpeButtonPalette = {
  primary: {
    bg: 'var(--brand-primary)',
    hover: 'var(--brand-primary-hover)',
    active: 'var(--brand-primary-active)',
    fg: 'var(--text-on-brand)',
    border: 'transparent'
  },
  secondary: {
    bg: 'var(--brand-secondary)',
    hover: 'var(--brand-secondary-hover)',
    active: 'var(--brand-secondary-active)',
    fg: 'var(--text-on-brand)',
    border: 'transparent'
  },
  outline: {
    bg: 'transparent',
    hover: 'var(--surface-brand-soft)',
    active: 'var(--blue-100)',
    fg: 'var(--blue-600)',
    border: 'var(--brand-primary)'
  },
  ghost: {
    bg: 'transparent',
    hover: 'var(--surface-brand-soft)',
    active: 'var(--blue-100)',
    fg: 'var(--blue-600)',
    border: 'transparent'
  },
  inverse: {
    bg: 'var(--white)',
    hover: 'var(--blue-50)',
    active: 'var(--blue-100)',
    fg: 'var(--blue-700)',
    border: 'transparent'
  }
};
const alpeButtonSizes = {
  sm: {
    height: 'var(--control-height-sm)',
    padding: '0 16px',
    font: 'var(--text-xs)'
  },
  md: {
    height: 'var(--control-height-md)',
    padding: '0 24px',
    font: 'var(--text-sm)'
  },
  lg: {
    height: 'var(--control-height-lg)',
    padding: '0 32px',
    font: 'var(--text-base)'
  }
};

/** Bouton d'action ALPE — pilule, police Nunito 700. */
function Button({
  variant = 'primary',
  size = 'md',
  children,
  icon,
  iconRight,
  disabled = false,
  fullWidth = false,
  href,
  onClick,
  type = 'button',
  style,
  ...rest
}) {
  const [hover, setHover] = useState(false);
  const [press, setPress] = useState(false);
  const p = alpeButtonPalette[variant] || alpeButtonPalette.primary;
  const s = alpeButtonSizes[size] || alpeButtonSizes.md;
  const css = {
    display: fullWidth ? 'flex' : 'inline-flex',
    width: fullWidth ? '100%' : 'auto',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-2)',
    height: s.height,
    padding: s.padding,
    fontSize: s.font,
    fontFamily: 'var(--font-body)',
    fontWeight: 'var(--weight-bold)',
    lineHeight: 1,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    color: p.fg,
    background: disabled ? p.bg : press ? p.active : hover ? p.hover : p.bg,
    border: '2px solid ' + p.border,
    borderRadius: 'var(--control-radius)',
    boxShadow: variant === 'primary' || variant === 'secondary' ? 'var(--shadow-sm)' : 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1,
    transform: press && !disabled ? 'scale(var(--press-scale))' : 'none',
    transition: 'background var(--duration-fast) var(--ease-out), transform var(--duration-instant) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out)',
    ...style
  };
  const handlers = disabled ? {} : {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setPress(false);
    },
    onMouseDown: () => setPress(true),
    onMouseUp: () => setPress(false),
    onClick
  };
  const inner = /*#__PURE__*/React.createElement(React.Fragment, null, icon ? /*#__PURE__*/React.createElement("i", {
    className: icon,
    "aria-hidden": "true"
  }) : null, children, iconRight ? /*#__PURE__*/React.createElement("i", {
    className: iconRight,
    "aria-hidden": "true"
  }) : null);
  if (href && !disabled) return /*#__PURE__*/React.createElement("a", _extends({
    href: href,
    style: css
  }, handlers, rest), inner);
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: disabled,
    style: css
  }, handlers, rest), inner);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/actions/Button.jsx", error: String((e && e.message) || e) }); }

// components/actions/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState
} = React;
const alpeIconButtonSizes = {
  sm: 34,
  md: 42,
  lg: 52
};

/** Bouton icône seule — toujours accompagné d'un label accessible. */
function IconButton({
  icon,
  label,
  variant = 'ghost',
  size = 'md',
  disabled = false,
  onClick,
  style,
  ...rest
}) {
  const [hover, setHover] = useState(false);
  const [press, setPress] = useState(false);
  const d = alpeIconButtonSizes[size] || 42;
  const solid = variant === 'primary' || variant === 'secondary';
  const base = variant === 'secondary' ? 'var(--brand-secondary)' : variant === 'primary' ? 'var(--brand-primary)' : 'transparent';
  const hoverBg = solid ? variant === 'secondary' ? 'var(--brand-secondary-hover)' : 'var(--brand-primary-hover)' : 'var(--surface-brand-soft)';
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    "aria-label": label,
    title: label,
    disabled: disabled,
    onClick: disabled ? undefined : onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setPress(false);
    },
    onMouseDown: () => setPress(true),
    onMouseUp: () => setPress(false),
    style: {
      width: d,
      height: d,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: size === 'sm' ? 14 : size === 'lg' ? 20 : 16,
      color: solid ? 'var(--text-on-brand)' : 'var(--blue-600)',
      background: hover && !disabled ? hoverBg : base,
      border: variant === 'outline' ? '2px solid var(--brand-primary)' : '2px solid transparent',
      borderRadius: 'var(--radius-circle)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.45 : 1,
      transform: press ? 'scale(var(--press-scale))' : 'none',
      transition: 'background var(--duration-fast) var(--ease-out), transform var(--duration-instant) var(--ease-out)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("i", {
    className: icon,
    "aria-hidden": "true"
  }));
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/actions/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/display/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const alpeBadgeTones = {
  blue: {
    bg: 'var(--surface-brand-soft)',
    fg: 'var(--blue-700)'
  },
  orange: {
    bg: 'var(--surface-secondary-soft)',
    fg: 'var(--orange-700)'
  },
  yellow: {
    bg: 'var(--yellow-300)',
    fg: 'var(--grey-800)'
  },
  neutral: {
    bg: 'var(--grey-100)',
    fg: 'var(--grey-700)'
  },
  success: {
    bg: 'var(--success-bg)',
    fg: 'var(--success-fg)'
  },
  warning: {
    bg: 'var(--warning-bg)',
    fg: 'var(--warning-fg)'
  },
  danger: {
    bg: 'var(--danger-bg)',
    fg: 'var(--danger-fg)'
  },
  solid: {
    bg: 'var(--brand-primary)',
    fg: 'var(--text-on-brand)'
  }
};

/** Pastille d'état — statut d'un événement, niveau scolaire, mention « Complet ». */
function Badge({
  children,
  tone = 'blue',
  icon,
  style,
  ...rest
}) {
  const t = alpeBadgeTones[tone] || alpeBadgeTones.blue;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '4px 12px',
      background: t.bg,
      color: t.fg,
      borderRadius: 'var(--radius-pill)',
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-2xs)',
      fontWeight: 'var(--weight-bold)',
      letterSpacing: 'var(--tracking-wide)',
      textTransform: 'uppercase',
      lineHeight: 1.4,
      ...style
    }
  }, rest), icon ? /*#__PURE__*/React.createElement("i", {
    className: icon,
    "aria-hidden": "true"
  }) : null, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Badge.jsx", error: String((e && e.message) || e) }); }

// components/display/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState
} = React;
/** Carte ALPE — blanc, rayon 18px, ombre douce. Filet supérieur coloré pour un temps fort. */
function Card({
  children,
  accent,
  interactive = false,
  padding = 'var(--space-6)',
  muted = false,
  style,
  onClick,
  ...rest
}) {
  const [hover, setHover] = useState(false);
  const accentColor = accent === 'orange' ? 'var(--brand-secondary)' : accent === 'yellow' ? 'var(--brand-accent)' : 'var(--brand-primary)';
  return /*#__PURE__*/React.createElement("div", _extends({
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      background: muted ? 'var(--surface-card-muted)' : 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      borderTop: accent ? '4px solid ' + accentColor : '1px solid var(--border-subtle)',
      borderRadius: 'var(--card-radius)',
      padding,
      overflow: 'hidden',
      boxShadow: interactive && hover ? 'var(--card-shadow-hover)' : 'var(--card-shadow)',
      transform: interactive && hover ? 'translateY(-2px)' : 'none',
      cursor: interactive ? 'pointer' : 'default',
      transition: 'box-shadow var(--duration-base) var(--ease-out), transform var(--duration-base) var(--ease-out)',
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Card.jsx", error: String((e && e.message) || e) }); }

// components/display/EventCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState
} = React;
/** Carte événement — bourse, forum, nocturne. Date en capsule, image en haut, badge d'état. */
function EventCard({
  title,
  dateLabel,
  timeLabel,
  place,
  excerpt,
  image,
  badge,
  badgeTone = 'blue',
  href,
  cta = 'En savoir plus',
  style,
  ...rest
}) {
  const [hover, setHover] = useState(false);
  return /*#__PURE__*/React.createElement("div", _extends({
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--card-radius)',
      overflow: 'hidden',
      boxShadow: hover ? 'var(--card-shadow-hover)' : 'var(--card-shadow)',
      transform: hover ? 'translateY(-2px)' : 'none',
      transition: 'box-shadow var(--duration-base) var(--ease-out), transform var(--duration-base) var(--ease-out)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      height: 168,
      background: image ? 'var(--grey-100) center/cover no-repeat' : 'var(--surface-brand-soft)',
      backgroundImage: image ? 'url(' + image + ')' : undefined
    }
  }, !image ? /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--blue-300)',
      fontSize: 'var(--text-2xs)',
      fontWeight: 700,
      letterSpacing: 'var(--tracking-wide)',
      textTransform: 'uppercase'
    }
  }, "Photo de l'\xE9v\xE9nement") : null, dateLabel ? /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 12,
      left: 12,
      background: 'var(--white)',
      borderRadius: 'var(--radius-md)',
      padding: '6px 12px',
      boxShadow: 'var(--shadow-sm)',
      fontFamily: 'var(--font-heading)',
      fontWeight: 'var(--weight-bold)',
      fontSize: 'var(--text-xs)',
      color: 'var(--brand-secondary)'
    }
  }, dateLabel) : null, badge ? /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 12,
      right: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-block',
      padding: '4px 12px',
      borderRadius: 'var(--radius-pill)',
      background: badgeTone === 'warning' ? 'var(--warning-bg)' : 'var(--white)',
      color: badgeTone === 'warning' ? 'var(--warning-fg)' : 'var(--blue-700)',
      fontSize: 'var(--text-2xs)',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: 'var(--tracking-wide)'
    }
  }, badge)) : null), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--space-5)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-2)',
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("h4", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-heading)',
      fontWeight: 'var(--weight-bold)',
      fontSize: 'var(--text-xl)',
      color: 'var(--text-heading)',
      textWrap: 'pretty'
    }
  }, title), timeLabel || place ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 'var(--space-4)',
      fontSize: 'var(--text-2xs)',
      color: 'var(--text-muted)',
      fontWeight: 600
    }
  }, timeLabel ? /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-clock",
    "aria-hidden": "true",
    style: {
      marginRight: 6,
      color: 'var(--blue-400)'
    }
  }), timeLabel) : null, place ? /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-location-dot",
    "aria-hidden": "true",
    style: {
      marginRight: 6,
      color: 'var(--blue-400)'
    }
  }), place) : null) : null, excerpt ? /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 'var(--text-sm)',
      lineHeight: 'var(--leading-normal)',
      color: 'var(--text-body)'
    }
  }, excerpt) : null, href ? /*#__PURE__*/React.createElement("a", {
    href: href,
    style: {
      marginTop: 'auto',
      paddingTop: 'var(--space-3)',
      fontSize: 'var(--text-sm)',
      fontWeight: 700,
      color: hover ? 'var(--text-link-hover)' : 'var(--text-link)',
      textDecoration: 'none'
    }
  }, cta, " \u2192") : null));
}
Object.assign(__ds_scope, { EventCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/EventCard.jsx", error: String((e && e.message) || e) }); }

// components/display/SchoolChip.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState
} = React;
const alpeSchoolLevels = {
  maternelle: {
    label: 'Maternelle',
    bg: 'var(--surface-secondary-soft)',
    fg: 'var(--orange-700)'
  },
  elementaire: {
    label: 'Élémentaire',
    bg: 'var(--surface-brand-soft)',
    fg: 'var(--blue-700)'
  },
  college: {
    label: 'Collège',
    bg: 'var(--yellow-300)',
    fg: 'var(--grey-800)'
  },
  lycee: {
    label: 'Lycée',
    bg: 'var(--grey-100)',
    fg: 'var(--grey-700)'
  }
};

/** Un des douze établissements couverts par ALPE. */
function SchoolChip({
  name,
  level = 'elementaire',
  city,
  href,
  style,
  ...rest
}) {
  const [hover, setHover] = useState(false);
  const l = alpeSchoolLevels[level] || alpeSchoolLevels.elementaire;
  const Tag = href ? 'a' : 'div';
  return /*#__PURE__*/React.createElement(Tag, _extends({
    href: href,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-3)',
      padding: '10px 16px 10px 12px',
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-pill)',
      textDecoration: 'none',
      boxShadow: hover && href ? 'var(--shadow-md)' : 'var(--shadow-xs)',
      transform: hover && href ? 'translateY(-1px)' : 'none',
      cursor: href ? 'pointer' : 'default',
      transition: 'box-shadow var(--duration-fast) var(--ease-out), transform var(--duration-fast) var(--ease-out)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      padding: '3px 10px',
      borderRadius: 'var(--radius-pill)',
      background: l.bg,
      color: l.fg,
      fontSize: 10,
      fontWeight: 800,
      letterSpacing: 'var(--tracking-wide)',
      textTransform: 'uppercase'
    }
  }, l.label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-heading)',
      fontWeight: 'var(--weight-bold)',
      fontSize: 'var(--text-sm)',
      color: 'var(--text-heading)'
    }
  }, name), city ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-2xs)',
      color: 'var(--text-muted)'
    }
  }, city) : null);
}
Object.assign(__ds_scope, { SchoolChip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/SchoolChip.jsx", error: String((e && e.message) || e) }); }

// components/display/SectionTitle.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Titre de section — sur-titre optionnel, titre, chapeau, et le swoosh jaune en option. */
function SectionTitle({
  eyebrow,
  title,
  lead,
  align = 'left',
  swoosh = false,
  inverse = false,
  level = 2,
  style,
  ...rest
}) {
  const Heading = 'h' + level;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-3)',
      textAlign: align,
      alignItems: align === 'center' ? 'center' : 'flex-start',
      maxWidth: 'var(--container-narrow)',
      ...style
    }
  }, rest), eyebrow ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-heading)',
      fontWeight: 'var(--weight-bold)',
      fontSize: 'var(--text-xs)',
      letterSpacing: 'var(--tracking-caps)',
      textTransform: 'uppercase',
      color: inverse ? 'var(--yellow-500)' : 'var(--brand-secondary)'
    }
  }, eyebrow) : null, /*#__PURE__*/React.createElement(Heading, {
    style: {
      margin: 0,
      fontFamily: 'var(--font-heading)',
      fontWeight: 'var(--weight-bold)',
      fontSize: 'var(--text-3xl)',
      lineHeight: 'var(--leading-snug)',
      color: inverse ? 'var(--white)' : 'var(--text-heading)',
      textWrap: 'pretty',
      position: 'relative',
      display: 'inline-block'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      zIndex: 1
    }
  }, title), swoosh ? /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 4,
      height: 10,
      background: 'var(--brand-accent)',
      borderRadius: 'var(--radius-pill)',
      zIndex: 0
    }
  }) : null), lead ? /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 'var(--text-lg)',
      lineHeight: 'var(--leading-normal)',
      color: inverse ? 'rgba(255,255,255,.86)' : 'var(--text-body)',
      textWrap: 'pretty'
    }
  }, lead) : null);
}
Object.assign(__ds_scope, { SectionTitle });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/SectionTitle.jsx", error: String((e && e.message) || e) }); }

// components/display/StatTile.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Chiffre clé — la preuve d'échelle de l'association. Baloo 2, très grand. */
function StatTile({
  value,
  label,
  sublabel,
  tone = 'blue',
  align = 'left',
  style,
  ...rest
}) {
  const fg = tone === 'orange' ? 'var(--brand-secondary)' : tone === 'inverse' ? 'var(--white)' : 'var(--brand-primary)';
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      textAlign: align,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 'var(--weight-extrabold)',
      fontSize: 'var(--text-4xl)',
      lineHeight: 'var(--leading-tight)',
      color: fg,
      whiteSpace: 'nowrap'
    }
  }, value), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-heading)',
      fontWeight: 'var(--weight-bold)',
      fontSize: 'var(--text-sm)',
      color: tone === 'inverse' ? 'rgba(255,255,255,.92)' : 'var(--text-strong)'
    }
  }, label), sublabel ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-2xs)',
      color: tone === 'inverse' ? 'rgba(255,255,255,.7)' : 'var(--text-muted)'
    }
  }, sublabel) : null);
}
Object.assign(__ds_scope, { StatTile });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/StatTile.jsx", error: String((e && e.message) || e) }); }

// components/display/Swoosh.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Le trait jaune du logo, isolé comme ornement. Une seule occurrence par support. */
function Swoosh({
  color = 'var(--brand-accent)',
  thickness = 9,
  width = '100%',
  height = 90,
  flip = false,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("svg", _extends({
    viewBox: "0 0 620 90",
    preserveAspectRatio: "none",
    "aria-hidden": "true",
    focusable: "false",
    style: {
      width,
      height,
      display: 'block',
      transform: flip ? 'scaleY(-1)' : 'none',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("path", {
    d: "M4 78 C 150 22 420 6 616 12",
    fill: "none",
    stroke: color,
    strokeWidth: thickness,
    strokeLinecap: "round"
  }));
}
Object.assign(__ds_scope, { Swoosh });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Swoosh.jsx", error: String((e && e.message) || e) }); }

// components/display/Tag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Étiquette de catégorie — cliquable ou supprimable, casse normale (≠ Badge). */
function Tag({
  children,
  active = false,
  onClick,
  onRemove,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    onClick: onClick,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      padding: '6px 14px',
      background: active ? 'var(--brand-primary)' : 'var(--white)',
      color: active ? 'var(--text-on-brand)' : 'var(--blue-700)',
      border: '1px solid ' + (active ? 'var(--brand-primary)' : 'var(--border-default)'),
      borderRadius: 'var(--radius-pill)',
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-xs)',
      fontWeight: 'var(--weight-semibold)',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'background var(--duration-fast) var(--ease-out), border-color var(--duration-fast) var(--ease-out)',
      ...style
    }
  }, rest), children, onRemove ? /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-xmark",
    "aria-hidden": "true",
    onClick: e => {
      e.stopPropagation();
      onRemove();
    },
    style: {
      cursor: 'pointer',
      opacity: 0.6,
      fontSize: 11
    }
  }) : null);
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Tag.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Callout.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const alpeCalloutTones = {
  info: {
    bg: 'var(--info-bg)',
    fg: 'var(--info-fg)',
    icon: 'fa-solid fa-circle-info'
  },
  warning: {
    bg: 'var(--warning-bg)',
    fg: 'var(--warning-fg)',
    icon: 'fa-solid fa-triangle-exclamation'
  },
  success: {
    bg: 'var(--success-bg)',
    fg: 'var(--success-fg)',
    icon: 'fa-solid fa-circle-check'
  },
  danger: {
    bg: 'var(--danger-bg)',
    fg: 'var(--danger-fg)',
    icon: 'fa-solid fa-circle-exclamation'
  }
};

/** Encart d'information dans le corps d'une page (créneaux complets, changement de salle). */
function Callout({
  tone = 'info',
  title,
  children,
  style,
  ...rest
}) {
  const t = alpeCalloutTones[tone] || alpeCalloutTones.info;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      gap: 'var(--space-4)',
      padding: 'var(--space-5)',
      background: t.bg,
      borderRadius: 'var(--radius-lg)',
      border: '1px solid ' + t.bg,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("i", {
    className: t.icon,
    "aria-hidden": "true",
    style: {
      color: t.fg,
      fontSize: 18,
      marginTop: 2
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }
  }, title ? /*#__PURE__*/React.createElement("strong", {
    style: {
      fontFamily: 'var(--font-heading)',
      fontSize: 'var(--text-base)',
      color: t.fg
    }
  }, title) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-sm)',
      lineHeight: 'var(--leading-normal)',
      color: 'var(--text-body)'
    }
  }, children)));
}
Object.assign(__ds_scope, { Callout });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Callout.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Dialog.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Modale ALPE — voile bleu profond, carte blanche, ombre xl. Aucun flou d'arrière-plan. */
function Dialog({
  open = true,
  title,
  children,
  footer,
  onClose,
  width = 520,
  style,
  ...rest
}) {
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    role: "presentation",
    onClick: onClose,
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-6)',
      background: 'rgba(3, 59, 83, 0.55)'
    }
  }, /*#__PURE__*/React.createElement("div", _extends({
    role: "dialog",
    "aria-modal": "true",
    "aria-label": title,
    onClick: e => e.stopPropagation(),
    style: {
      width: '100%',
      maxWidth: width,
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-xl)',
      overflow: 'hidden',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 'var(--space-4)',
      padding: 'var(--space-6) var(--space-6) var(--space-3)'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-heading)',
      fontWeight: 'var(--weight-bold)',
      fontSize: 'var(--text-2xl)',
      color: 'var(--text-heading)'
    }
  }, title), onClose ? /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "fa-solid fa-xmark",
    label: "Fermer",
    size: "sm",
    onClick: onClose
  }) : null), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 var(--space-6) var(--space-6)',
      fontSize: 'var(--text-sm)',
      lineHeight: 'var(--leading-normal)',
      color: 'var(--text-body)'
    }
  }, children), footer ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 'var(--space-3)',
      padding: 'var(--space-4) var(--space-6)',
      background: 'var(--surface-muted)',
      borderTop: '1px solid var(--border-subtle)'
    }
  }, footer) : null));
}
Object.assign(__ds_scope, { Dialog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Dialog.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const alpeToastTones = {
  success: {
    fg: 'var(--success-fg)',
    icon: 'fa-solid fa-circle-check'
  },
  info: {
    fg: 'var(--info-fg)',
    icon: 'fa-solid fa-circle-info'
  },
  danger: {
    fg: 'var(--danger-fg)',
    icon: 'fa-solid fa-circle-exclamation'
  }
};

/** Notification brève — carte blanche, filet coloré à gauche, ombre lg. */
function Toast({
  tone = 'success',
  title,
  message,
  onClose,
  style,
  ...rest
}) {
  const t = alpeToastTones[tone] || alpeToastTones.success;
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "status",
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 'var(--space-3)',
      minWidth: 300,
      maxWidth: 420,
      padding: 'var(--space-4)',
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-lg)',
      border: '1px solid var(--border-subtle)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("i", {
    className: t.icon,
    "aria-hidden": "true",
    style: {
      color: t.fg,
      fontSize: 16,
      marginTop: 1
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, title ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-heading)',
      fontWeight: 700,
      fontSize: 'var(--text-sm)',
      color: 'var(--text-strong)'
    }
  }, title) : null, message ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-2xs)',
      color: 'var(--text-muted)',
      marginTop: 2
    }
  }, message) : null), onClose ? /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    "aria-label": "Fermer",
    style: {
      border: 0,
      background: 'transparent',
      cursor: 'pointer',
      color: 'var(--text-subtle)',
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-xmark",
    "aria-hidden": "true"
  })) : null);
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Tooltip.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState
} = React;
/** Infobulle — bleu profond, apparition en fondu. Texte court uniquement. */
function Tooltip({
  label,
  placement = 'top',
  children,
  style,
  ...rest
}) {
  const [show, setShow] = useState(false);
  const pos = placement === 'bottom' ? {
    top: 'calc(100% + 8px)',
    left: '50%',
    transform: 'translateX(-50%)'
  } : {
    bottom: 'calc(100% + 8px)',
    left: '50%',
    transform: 'translateX(-50%)'
  };
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      position: 'relative',
      display: 'inline-flex',
      ...style
    },
    onMouseEnter: () => setShow(true),
    onMouseLeave: () => setShow(false),
    onFocus: () => setShow(true),
    onBlur: () => setShow(false)
  }, rest), children, /*#__PURE__*/React.createElement("span", {
    role: "tooltip",
    style: {
      position: 'absolute',
      ...pos,
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
      padding: '6px 10px',
      background: 'var(--surface-inverse)',
      color: 'var(--white)',
      borderRadius: 'var(--radius-sm)',
      fontSize: 'var(--text-2xs)',
      fontWeight: 600,
      opacity: show ? 1 : 0,
      transition: 'opacity var(--duration-fast) var(--ease-out)',
      zIndex: 10
    }
  }, label));
}
Object.assign(__ds_scope, { Tooltip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Tooltip.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
/** Case à cocher — carré arrondi, coche Font Awesome, remplissage bleu. */
function Checkbox({
  label,
  description,
  checked = false,
  onChange,
  disabled = false,
  id,
  style
}) {
  const fieldId = id || 'alpe-check-' + String(label).replace(/\s+/g, '-').toLowerCase();
  return /*#__PURE__*/React.createElement("label", {
    htmlFor: fieldId,
    style: {
      display: 'flex',
      gap: 'var(--space-3)',
      alignItems: 'flex-start',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.45 : 1,
      ...style
    }
  }, /*#__PURE__*/React.createElement("input", {
    id: fieldId,
    type: "checkbox",
    checked: checked,
    disabled: disabled,
    onChange: e => onChange && onChange(e.target.checked),
    style: {
      position: 'absolute',
      opacity: 0,
      width: 0,
      height: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      flex: '0 0 auto',
      width: 22,
      height: 22,
      marginTop: 1,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: checked ? 'var(--brand-primary)' : 'var(--white)',
      border: '2px solid ' + (checked ? 'var(--brand-primary)' : 'var(--border-strong)'),
      borderRadius: 'var(--radius-xs)',
      color: 'var(--white)',
      fontSize: 11,
      transition: 'background var(--duration-fast) var(--ease-out), border-color var(--duration-fast) var(--ease-out)'
    }
  }, checked ? /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-check"
  }) : null), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontSize: 'var(--text-sm)',
      fontWeight: 'var(--weight-semibold)',
      color: 'var(--text-strong)'
    }
  }, label), description ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontSize: 'var(--text-2xs)',
      color: 'var(--text-muted)',
      marginTop: 2
    }
  }, description) : null));
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState
} = React;
/** Champ de saisie ALPE — libellé au-dessus, arrondi doux, anneau de focus bleu. */
function Input({
  label,
  hint,
  error,
  icon,
  type = 'text',
  multiline = false,
  rows = 4,
  required = false,
  disabled = false,
  id,
  style,
  ...rest
}) {
  const [focus, setFocus] = useState(false);
  const fieldId = id || 'alpe-input-' + (label || type).replace(/\s+/g, '-').toLowerCase();
  const fieldStyle = {
    width: '100%',
    minHeight: multiline ? undefined : 'var(--control-height-md)',
    padding: multiline ? '12px 14px' : icon ? '0 14px 0 40px' : '0 14px',
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-sm)',
    color: 'var(--text-strong)',
    background: disabled ? 'var(--grey-50)' : 'var(--white)',
    border: '1px solid ' + (error ? 'var(--danger-fg)' : focus ? 'var(--brand-primary)' : 'var(--border-default)'),
    borderRadius: multiline ? 'var(--radius-md)' : 'var(--radius-md)',
    boxShadow: focus ? 'var(--shadow-focus)' : 'none',
    outline: 'none',
    transition: 'border-color var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out)',
    resize: multiline ? 'vertical' : undefined,
    lineHeight: multiline ? 'var(--leading-normal)' : undefined
  };
  const Tag = multiline ? 'textarea' : 'input';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-2)',
      ...style
    }
  }, label ? /*#__PURE__*/React.createElement("label", {
    htmlFor: fieldId,
    style: {
      fontSize: 'var(--text-xs)',
      fontWeight: 'var(--weight-bold)',
      color: 'var(--text-strong)',
      fontFamily: 'var(--font-body)'
    }
  }, label, required ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--brand-secondary)'
    }
  }, " *") : null) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, icon && !multiline ? /*#__PURE__*/React.createElement("i", {
    className: icon,
    "aria-hidden": "true",
    style: {
      position: 'absolute',
      left: 14,
      top: '50%',
      transform: 'translateY(-50%)',
      color: 'var(--text-subtle)',
      fontSize: 14
    }
  }) : null, /*#__PURE__*/React.createElement(Tag, _extends({
    id: fieldId,
    type: multiline ? undefined : type,
    rows: multiline ? rows : undefined,
    disabled: disabled,
    required: required,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: fieldStyle
  }, rest))), error ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-2xs)',
      color: 'var(--danger-fg)',
      fontWeight: 'var(--weight-semibold)'
    }
  }, error) : hint ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-2xs)',
      color: 'var(--text-muted)'
    }
  }, hint) : null);
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Radio.jsx
try { (() => {
/** Groupe de boutons radio — un seul choix, pastille bleue pleine. */
function Radio({
  name,
  options = [],
  value,
  onChange,
  legend,
  inline = false,
  disabled = false,
  style
}) {
  return /*#__PURE__*/React.createElement("fieldset", {
    style: {
      border: 0,
      margin: 0,
      padding: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-3)',
      ...style
    }
  }, legend ? /*#__PURE__*/React.createElement("legend", {
    style: {
      padding: 0,
      fontSize: 'var(--text-xs)',
      fontWeight: 'var(--weight-bold)',
      color: 'var(--text-strong)'
    }
  }, legend) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: inline ? 'row' : 'column',
      gap: inline ? 'var(--space-6)' : 'var(--space-3)'
    }
  }, options.map(o => {
    const v = typeof o === 'string' ? o : o.value;
    const l = typeof o === 'string' ? o : o.label;
    const on = value === v;
    return /*#__PURE__*/React.createElement("label", {
      key: v,
      style: {
        display: 'flex',
        gap: 'var(--space-3)',
        alignItems: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1
      }
    }, /*#__PURE__*/React.createElement("input", {
      type: "radio",
      name: name,
      value: v,
      checked: on,
      disabled: disabled,
      onChange: () => onChange && onChange(v),
      style: {
        position: 'absolute',
        opacity: 0,
        width: 0,
        height: 0
      }
    }), /*#__PURE__*/React.createElement("span", {
      "aria-hidden": "true",
      style: {
        width: 22,
        height: 22,
        flex: '0 0 auto',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px solid ' + (on ? 'var(--brand-primary)' : 'var(--border-strong)'),
        borderRadius: '50%',
        background: 'var(--white)',
        transition: 'border-color var(--duration-fast) var(--ease-out)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 11,
        height: 11,
        borderRadius: '50%',
        background: on ? 'var(--brand-primary)' : 'transparent',
        transition: 'background var(--duration-fast) var(--ease-out)'
      }
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 'var(--text-sm)',
        fontWeight: 'var(--weight-semibold)',
        color: 'var(--text-strong)'
      }
    }, l));
  })));
}
Object.assign(__ds_scope, { Radio });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Radio.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState
} = React;
/** Liste déroulante — même gabarit que Input, chevron Font Awesome. */
function Select({
  label,
  hint,
  error,
  options = [],
  placeholder,
  disabled = false,
  id,
  style,
  ...rest
}) {
  const [focus, setFocus] = useState(false);
  const fieldId = id || 'alpe-select-' + (label || 'field').replace(/\s+/g, '-').toLowerCase();
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-2)',
      ...style
    }
  }, label ? /*#__PURE__*/React.createElement("label", {
    htmlFor: fieldId,
    style: {
      fontSize: 'var(--text-xs)',
      fontWeight: 'var(--weight-bold)',
      color: 'var(--text-strong)'
    }
  }, label) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("select", _extends({
    id: fieldId,
    disabled: disabled,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      width: '100%',
      height: 'var(--control-height-md)',
      padding: '0 40px 0 14px',
      appearance: 'none',
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-sm)',
      color: 'var(--text-strong)',
      background: disabled ? 'var(--grey-50)' : 'var(--white)',
      border: '1px solid ' + (error ? 'var(--danger-fg)' : focus ? 'var(--brand-primary)' : 'var(--border-default)'),
      borderRadius: 'var(--radius-md)',
      boxShadow: focus ? 'var(--shadow-focus)' : 'none',
      outline: 'none',
      cursor: disabled ? 'not-allowed' : 'pointer'
    }
  }, rest), placeholder ? /*#__PURE__*/React.createElement("option", {
    value: ""
  }, placeholder) : null, options.map(o => {
    const v = typeof o === 'string' ? o : o.value;
    const l = typeof o === 'string' ? o : o.label;
    return /*#__PURE__*/React.createElement("option", {
      key: v,
      value: v
    }, l);
  })), /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-chevron-down",
    "aria-hidden": "true",
    style: {
      position: 'absolute',
      right: 16,
      top: '50%',
      transform: 'translateY(-50%)',
      color: 'var(--blue-500)',
      fontSize: 12,
      pointerEvents: 'none'
    }
  })), error ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-2xs)',
      color: 'var(--danger-fg)',
      fontWeight: 'var(--weight-semibold)'
    }
  }, error) : hint ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-2xs)',
      color: 'var(--text-muted)'
    }
  }, hint) : null);
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
/** Interrupteur — pour un réglage à effet immédiat, pas pour un formulaire à valider. */
function Switch({
  label,
  checked = false,
  onChange,
  disabled = false,
  id,
  style
}) {
  const fieldId = id || 'alpe-switch-' + String(label).replace(/\s+/g, '-').toLowerCase();
  return /*#__PURE__*/React.createElement("label", {
    htmlFor: fieldId,
    style: {
      display: 'inline-flex',
      gap: 'var(--space-3)',
      alignItems: 'center',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.45 : 1,
      ...style
    }
  }, /*#__PURE__*/React.createElement("input", {
    id: fieldId,
    type: "checkbox",
    role: "switch",
    checked: checked,
    disabled: disabled,
    onChange: e => onChange && onChange(e.target.checked),
    style: {
      position: 'absolute',
      opacity: 0,
      width: 0,
      height: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      width: 44,
      height: 26,
      flex: '0 0 auto',
      padding: 3,
      borderRadius: 'var(--radius-pill)',
      background: checked ? 'var(--brand-primary)' : 'var(--grey-300)',
      transition: 'background var(--duration-base) var(--ease-out)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      width: 20,
      height: 20,
      borderRadius: '50%',
      background: 'var(--white)',
      boxShadow: 'var(--shadow-xs)',
      transform: checked ? 'translateX(18px)' : 'none',
      transition: 'transform var(--duration-base) var(--ease-out)'
    }
  })), label ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-sm)',
      fontWeight: 'var(--weight-semibold)',
      color: 'var(--text-strong)'
    }
  }, label) : null);
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Breadcrumb.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Fil d'Ariane — reprend la hiérarchie du menu du site. */
function Breadcrumb({
  items = [],
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("nav", _extends({
    "aria-label": "Fil d'Ariane",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-2)',
      flexWrap: 'wrap',
      fontSize: 'var(--text-2xs)',
      ...style
    }
  }, rest), items.map((it, i) => {
    const last = i === items.length - 1;
    const label = typeof it === 'string' ? it : it.label;
    const href = typeof it === 'string' ? undefined : it.href;
    return /*#__PURE__*/React.createElement(React.Fragment, {
      key: label
    }, href && !last ? /*#__PURE__*/React.createElement("a", {
      href: href,
      style: {
        color: 'var(--text-muted)',
        textDecoration: 'none',
        fontWeight: 600
      }
    }, label) : /*#__PURE__*/React.createElement("span", {
      style: {
        color: last ? 'var(--text-strong)' : 'var(--text-muted)',
        fontWeight: last ? 700 : 600
      },
      "aria-current": last ? 'page' : undefined
    }, label), !last ? /*#__PURE__*/React.createElement("i", {
      className: "fa-solid fa-chevron-right",
      "aria-hidden": "true",
      style: {
        fontSize: 8,
        color: 'var(--text-subtle)'
      }
    }) : null);
  }));
}
Object.assign(__ds_scope, { Breadcrumb });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Breadcrumb.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState
} = React;
/** Onglets ALPE — pilules pleines pour l'onglet actif. */
function Tabs({
  items = [],
  value,
  onChange,
  style,
  ...rest
}) {
  const [internal, setInternal] = useState(items.length ? typeof items[0] === 'string' ? items[0] : items[0].value : null);
  const current = value !== undefined ? value : internal;
  const pick = v => {
    setInternal(v);
    if (onChange) onChange(v);
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "tablist",
    style: {
      display: 'flex',
      gap: 'var(--space-2)',
      flexWrap: 'wrap',
      ...style
    }
  }, rest), items.map(it => {
    const v = typeof it === 'string' ? it : it.value;
    const l = typeof it === 'string' ? it : it.label;
    const on = current === v;
    return /*#__PURE__*/React.createElement("button", {
      key: v,
      role: "tab",
      "aria-selected": on,
      onClick: () => pick(v),
      style: {
        height: 'var(--control-height-sm)',
        padding: '0 18px',
        border: 0,
        cursor: 'pointer',
        borderRadius: 'var(--radius-pill)',
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-xs)',
        fontWeight: 'var(--weight-bold)',
        background: on ? 'var(--brand-primary)' : 'var(--grey-50)',
        color: on ? 'var(--text-on-brand)' : 'var(--blue-700)',
        transition: 'background var(--duration-fast) var(--ease-out), color var(--duration-fast) var(--ease-out)'
      }
    }, l);
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// doc-page.js
try { (() => {
// @ds-adherence-ignore -- omelette starter scaffold (raw elements/hex/px by design)
// Copied omelette starter. Re-running copy_starter_component with this kind overwrites this file with the latest version (page content is unaffected).
/* BEGIN USAGE */
/**
 * <doc-page> — paged-document shell for printable HTML.
 *
 * FIRST, decide how the document paginates — up front, before building:
 *
 * - FLOWING document (the default): write the whole document as one
 *   normal HTML flow inside <doc-page>; the browser's print engine
 *   splits it onto pages at export. Use for long-form documents with a
 *   single text flow: reports, memos, letters, essays.
 * - EXPLICIT pagination: a fixed set of pre-paginated pages, one
 *   <section class="page"> child per page. Use when the user asks for a
 *   specific page count, or the design implies one: a one-page resume, a
 *   two-sided flier, a poster, a certificate, a brochure — any richly
 *   laid-out document without a single text flow.
 * - If in doubt, ask the user as part of the build.
 *
 * PAGE SIZING — paper differs by country (letter vs A4), so the printed
 * sheet is not one fixed truth:
 * - FLOWING documents pin NO paper size: the print engine paginates
 *   onto the user's real paper, and the content reflows to it.
 * - EXPLICITLY PAGINATED documents print each page at a FIXED page box
 *   with overflow hidden — letter by default, size="a4" for a clearly
 *   metric user, the user's chosen paper when they export. Design each
 *   page to FILL that box, fitting letter and A4 alike without overlap.
 * - width/height pin an explicit fixed size, ONLY when the user gives
 *   one.
 * Never write your own @page rule or hard-code paper dimensions in the
 * content.
 *
 * Sizing modes (attributes):
 *   (none)                      — portrait: flowing docs use the user's
 *           paper; explicitly paginated pages use the named size box
 *           (letter unless size="a4")
 *   orientation="landscape"     — the same, landscape
 *   width / height              — explicit fixed size, ONLY when the user
 *           gives one (e.g. width="22in" height="30in" for a 22×30
 *           poster): the page IS the design's size, printed at true
 *           dimensions (or scaled onto the user's paper at print time).
 *           Any absolute CSS length: px/in/mm/cm/pt/pc.
 * The component announces the chosen mode to the host app at runtime (a
 * meta tag it injects), so the print path can inject the user's true
 * paper size.
 *
 * On screen the document renders on a desk background: a flowing
 * document as one tall scrolling sheet (Google Docs' pageless view);
 * explicitly paginated documents as one card per page.
 *
 * EXPLICIT pagination usage:
 *   <style>doc-page:not(:defined){visibility:hidden}</style>
 *   <doc-page>
 *     <section class="page" id="p1">…one page's design…</section>
 *     <section class="page" id="p2">…</section>
 *   </doc-page>
 *   <script src="doc-page.js"></script>
 * How the page box works, concretely: each .page prints as ONE full-bleed
 * sheet at a FIXED physical size — letter by default (set size="a4" for
 * a clearly metric user), the user's chosen paper when they export —
 * with overflow hidden. Nothing scrolls and nothing reflows onto a next
 * sheet: content that misses the box is CLIPPED. Design each page to
 * FILL that page box, and to fit it — letter and A4 alike — without
 * overlap. Each page is a size container; don't size anything in
 * viewport units (they track the window, not the page), and never set
 * width or height on the .page section itself (the component sizes the
 * page box; an authored height like 100% is meaningless at print and is
 * overridden). The component owns the page box, the screen card chrome,
 * and the page breaks (never add your own break-before/after). Don't mix
 * .page sections with flowing content or header/footer slots in the same
 * document.
 *
 * FLOWING usage:
 *   <style>doc-page:not(:defined){visibility:hidden}</style>
 *   <doc-page margin="0.75in">
 *     <h1>Title</h1>
 *     <p>…body…</p>
 *   </doc-page>
 *   <script src="doc-page.js"></script>
 * There is no manual page-splitting — the browser's print engine
 * paginates at export. Standard break-hygiene rules (`break-inside:
 * avoid` on figures, code blocks, images and table rows; `orphans/
 * widows: 3`) are applied so paragraphs and groups split cleanly. On
 * screen and at print, headings default to `text-wrap: balance` and
 * body text to `text-wrap: pretty`; the defaults have zero specificity,
 * so any text-wrap you declare wins.
 *
 * Other attributes:
 *   size    — letter | a4 | legal (default letter). Flowing documents:
 *           preview proportion only — it does NOT pin their printed
 *           paper (the print dialog's paper governs); leave it alone
 *           there. Explicitly paginated documents: it sets the page box
 *           the cards and the pinned @page share (the export dialog's
 *           choice overrides both at print) — set size="a4" for a
 *           clearly metric user. Scaled-fit: names the sheet the fit is
 *           computed against, same a4-for-metric-users advice.
 *   content-width / content-height — the design's own fixed dimensions
 *           (CSS lengths), for scaling a fixed-size design ONTO the
 *           named sheet: content lays out at exactly this size, and the
 *           component scales it to fit that sheet's printable area
 *           (centered horizontally, top-aligned; the export dialog
 *           re-fits to the user's actual paper choice where available).
 *           Both must be set; they do not change the page box. For pages
 *           WITHOUT running header/footer slots.
 *   margin  — printable inset on every page of a FLOWING document
 *           (default 0.75in); margin="0" makes pages full-bleed.
 *           Explicitly paginated pages are always full-bleed.
 *
 * Running header/footer (flowing documents only): give an element
 * `slot="header"` or `slot="footer"` and it repeats on every printed
 * page via `position: fixed`. To keep body text from sliding under it,
 * the component prints inside a single-cell table whose <thead>/<tfoot>
 * are spacers sized to the header/footer height — browsers repeat
 * thead/tfoot on every page, so each sheet's content starts below the
 * header and ends above the footer. On screen the header/footer render
 * once at the top/bottom of the sheet.
 *
 * At print the component injects `@page { margin: 0 }` (which leaves
 * Chrome no margin box to draw its date/URL/page-count header in) and
 * moves the visual margin onto the sheet's own padding. It also marks
 * the document as owning its print CSS (a
 * `meta[name="omelette-owns-print"]` it injects at runtime), so the
 * PDF export never injects page-geometry CSS of its own on top.
 *
 * Print best practices for the content you author:
 * - Multi-column text: use CSS columns (`column-count` +
 *   `column-gap`), never side-by-side flex/grid columns — only real
 *   CSS columns flow and break across pages. `column-span: all` lets
 *   a heading span the columns; `hyphens: auto` (needs `lang` on
 *   the html element) keeps narrow columns readable.
 * - Page breaks in flowing documents: `break-before: page` on an
 *   element that must start a new page (a chapter, an appendix). Add
 *   your own kept-together blocks (callouts, stat tiles, cards) to a
 *   `break-inside: avoid` rule, and keep each one shorter than a page.
 * - Extend `orphans: 3; widows: 3` to any custom text blocks you add
 *   (p and li are covered by default).
 * - Give long tables a <thead> — browsers repeat it on every printed
 *   page.
 * - No `position: fixed`/`sticky` and no viewport units in content:
 *   fixed elements stamp every printed page (running headers/footers go
 *   in the component's slots) and `100vh` mis-sizes at print.
 *
 * Author content as static HTML so the user can click-to-edit any text
 * directly. Do not set width/padding/background on the document body —
 * the component owns the sheet box.
 */
/* END USAGE */

(() => {
  const PAPER = {
    letter: ['8.5in', '11in'],
    a4: ['210mm', '297mm'],
    legal: ['8.5in', '14in']
  };
  const CSS_LENGTH = /^\d+(\.\d+)?(px|in|mm|cm|pt|pc)$/;
  // Unitless "0" is a valid CSS length and the natural way to write
  // margin="0"; normalise it to 0px so max()/calc() (which reject a bare
  // number) keep working.
  const safeLen = (v, fb) => {
    v = (v || '').trim();
    return v === '0' ? '0px' : CSS_LENGTH.test(v) ? v : fb;
  };
  // WebKit (Safari and every iOS browser shell) never repeats a table's
  // thead/tfoot on printed pages (WebKit bug 17205), so the spacer-borne
  // vertical margins of a FLOWING document reach only the first page
  // there. Engine check, not browser check: vendor is 'Apple Computer,
  // Inc.' exactly for WebKit and 'Google Inc.' for Blink.
  const WK_PRINT = /apple/i.test(navigator.vendor || '');
  // CSS length → px number (CSS absolute units are exact: 1in = 96px).
  // Returns NaN for anything safeLen would reject — callers gate on it.
  const PX_PER = {
    px: 1,
    in: 96,
    mm: 96 / 25.4,
    cm: 96 / 2.54,
    pt: 96 / 72,
    pc: 16
  };
  const toPx = v => {
    const m = /^(\d+(?:\.\d+)?)(px|in|mm|cm|pt|pc)$/.exec((v || '').trim());
    return m ? parseFloat(m[1]) * PX_PER[m[2]] : NaN;
  };
  const stylesheet = `
    :host {
      position: relative;
      display: block;
      /* When the viewport is narrower than the page, grow to wrap the
       * sheet (plus this padding) instead of staying viewport-width, so
       * the desk background and right margin reach the sheet's far edge
       * in the horizontal scroll. */
      min-width: max-content;
      min-height: 100vh;
      background: #f5f5f4;
      padding: 48px 24px;
      box-sizing: border-box;
      font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
      --doc-page-w: 8.5in;
      --doc-page-h: 11in;
      --doc-page-margin: 0.75in;
      --doc-hdr-h: 0px;
      --doc-ftr-h: 0px;
      --doc-hdr-pad: 0px;
      --doc-ftr-pad: 0px;
    }
    .sheet {
      width: var(--doc-page-w);
      margin: 0 auto;
      background: #fff;
      box-shadow: 0 2px 10px rgba(20, 20, 19, 0.12);
      border-radius: 7px;
      box-sizing: border-box;
      padding: var(--doc-page-margin);
    }
    .frame { width: 100%; border-collapse: collapse; }
    /* Scaled-fit mode (content-width/content-height): the inner .fit box
     * lays the content out at its authored fixed size and scales it onto
     * the printable area; .fit-box reserves the scaled footprint in flow
     * (transforms don't affect layout) and centers it. Without the mode,
     * both divs are unstyled block pass-throughs. */
    /* Explicit pagination: direct .page children are the pages. The sheet
     * becomes a transparent stack and each page carries the card look on
     * screen; at print each page is exactly one full-bleed sheet. The
     * ::slotted defaults are deliberately weak (document CSS wins), so
     * authored page styling can override any of this. */
    .sheet.paginated {
      background: transparent;
      box-shadow: none;
      border-radius: 0;
      padding: 0;
    }
    .paginated ::slotted(.page) {
      position: relative;
      display: block;
      width: 100%;
      aspect-ratio: var(--doc-page-ar);
      container-type: size;
      overflow: hidden;
      box-sizing: border-box;
      background: #fff;
      border-radius: 7px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25);
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
      break-inside: avoid;
    }
    .paginated ::slotted(.page:not(:first-child)) { margin-top: 1rem; }
    @media print {
      .sheet.paginated { padding: 0; }
      /* The flowing-document vertical inset lives on the repeating
       * thead/tfoot spacers, not the sheet padding — they must go too,
       * or each full-sheet .page is pushed ~margin down and spills onto
       * a second sheet. Paginated pages are full-bleed by definition
       * (content owns its insets). */
      .sheet.paginated .hdr-space,
      .sheet.paginated .ftr-space { height: 0; }
      .paginated ::slotted(.page) {
        border-radius: 0 !important;
        box-shadow: none !important;
        margin: 0 !important;
        /* Physical page-box sizing, no viewport units: Safari resolves
         * 100vh against the window, not the page box, so a vh-sized card
         * paginates wrong there. --doc-page-w/h are the named size by
         * default and are overridden to the user's chosen paper by the
         * export path, so every card is exactly one sheet either way.
         * Width + height (same source values as @page size) rather than
         * width + aspect-ratio: the ratio is a 6-decimal rounding of the
         * same division, and a few millionths of overflow would spill a
         * blank sheet after every page. The screen-only aspect-ratio
         * (preview proportions) must not leak into print. cqh typography
         * tracks the same box.
         *
         * Every declaration is !important: per CSS Scoping, unimportant
         * shadow ::slotted rules LOSE to the document context, so a page
         * section's authored inline style would silently beat this print
         * geometry. A model-authored height:100% did exactly that — the
         * percentage resolves as auto in the all-auto print ancestry, the
         * base rule's size containment turns auto into ZERO, and
         * overflow:hidden then paints nothing: a blank PDF with perfect
         * page boxes. At print the component's geometry is the design's
         * whole contract, so it must win over any authored sizing. */
        aspect-ratio: auto !important;
        width: var(--doc-page-w) !important;
        height: var(--doc-page-h) !important;
        overflow: hidden !important;
      }
      .paginated ::slotted(.page:not(:first-child)) {
        break-before: page !important;
        margin-top: 0 !important;
      }
    }
    .fit-mode .fit-box {
      width: calc(var(--doc-fit-w) * var(--doc-fit-scale));
      height: calc(var(--doc-fit-h) * var(--doc-fit-scale));
      margin: 0 auto;
      break-inside: avoid;
    }
    .fit-mode .fit {
      width: var(--doc-fit-w);
      height: var(--doc-fit-h);
      transform: scale(var(--doc-fit-scale));
      transform-origin: top left;
    }
    .frame td, .frame th { padding: 0; text-align: left; font-weight: inherit; }
    .hdr-space { height: var(--doc-hdr-h); }
    .ftr-space { height: var(--doc-ftr-h); }
    ::slotted([slot="header"]),
    ::slotted([slot="footer"]) { display: block; box-sizing: border-box; }
    @media print {
      :host { background: none; padding: 0; min-width: 0; min-height: 0; }
      .sheet {
        width: auto; margin: 0; box-shadow: none; border-radius: 0;
        padding: 0 var(--doc-page-margin);
      }
      /* The thead/tfoot spacers repeat on every page, so they carry the
       * vertical page margin (which the sheet's own padding cannot, since
       * that padding is consumed once on the first/last page). The running
       * header/footer are fixed inside that band. */
      /* The 0.35in is breathing room between a running header/footer and
       * the body; without one the spacer is exactly the page margin, so a
       * margin="0" full-bleed document gets truly full-bleed pages. */
      .hdr-space { height: max(var(--doc-page-margin), calc(var(--doc-hdr-h) + var(--doc-hdr-pad))); }
      .ftr-space { height: max(var(--doc-page-margin), calc(var(--doc-ftr-h) + var(--doc-ftr-pad))); }
      /* WebKit flowing documents: @page carries the vertical margin (see
       * _syncPrintPageRule), so the spacers keep only whatever a running
       * header/footer needs BEYOND it — page 1 would otherwise double its
       * top inset. Paginated sheets already zero their spacers above. */
      .sheet.wk-print:not(.paginated) .hdr-space { height: max(0px, calc(max(var(--doc-page-margin), calc(var(--doc-hdr-h) + var(--doc-hdr-pad))) - var(--doc-page-margin))); }
      .sheet.wk-print:not(.paginated) .ftr-space { height: max(0px, calc(max(var(--doc-page-margin), calc(var(--doc-ftr-h) + var(--doc-ftr-pad))) - var(--doc-page-margin))); }
      ::slotted([slot="header"]) {
        position: fixed; top: 0; left: 0; right: 0; margin: 0;
        padding: calc(var(--doc-page-margin) * 0.45) var(--doc-page-margin) 0;
      }
      ::slotted([slot="footer"]) {
        position: fixed; bottom: 0; left: 0; right: 0; margin: 0;
        padding: 0 var(--doc-page-margin) calc(var(--doc-page-margin) * 0.45);
      }
    }
  `;
  class DocPage extends HTMLElement {
    static get observedAttributes() {
      return ['size', 'width', 'height', 'margin', 'orientation', 'content-width', 'content-height'];
    }
    constructor() {
      super();
      this._root = this.attachShadow({
        mode: 'open'
      });
      this._mo = typeof MutationObserver === 'function' ? new MutationObserver(() => this._scheduleMeasure()) : null;
    }

    /** The named paper's [w, h], swapped when orientation="landscape".
     *  Only the named size swaps — explicit width/height are exact values
     *  the author already oriented. */
    _paperSize() {
      const named = PAPER[(this.getAttribute('size') || '').toLowerCase()] || PAPER.letter;
      const landscape = (this.getAttribute('orientation') || '').trim().toLowerCase() === 'landscape';
      return landscape ? [named[1], named[0]] : named;
    }
    get pageWidth() {
      return safeLen(this.getAttribute('width'), this._paperSize()[0]);
    }
    get pageHeight() {
      return safeLen(this.getAttribute('height'), this._paperSize()[1]);
    }
    get pageMargin() {
      return safeLen(this.getAttribute('margin'), '0.75in');
    }

    /** Scaled-fit mode's content box [w, h] as CSS lengths, or null when
     *  the mode is off (either attribute missing/invalid/zero — a partial
     *  declaration falls back to normal flow rather than guessing). */
    _contentFit() {
      const w = safeLen(this.getAttribute('content-width'), null);
      const h = safeLen(this.getAttribute('content-height'), null);
      if (!w || !h) return null;
      const wPx = toPx(w),
        hPx = toPx(h);
      return wPx > 0 && hPx > 0 ? [w, h, wPx, hPx] : null;
    }
    connectedCallback() {
      if (!this._sheet) this._render();
      this._syncSize();
      this._syncPrintPageRule();
      this._ensureTextWrapDefaults();
      this._ensureOwnsPrintMeta();
      this._syncFixedSizeMeta();
      this._syncPrintSizingMeta();
      if (this._mo) this._mo.observe(this, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true
      });
      this._onResize = () => this._scheduleMeasure();
      window.addEventListener('resize', this._onResize);
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => this._scheduleMeasure());
      }
      this._scheduleMeasure();
    }
    disconnectedCallback() {
      window.removeEventListener('resize', this._onResize);
      if (this._mo) this._mo.disconnect();
      if (this._raf) {
        cancelAnimationFrame(this._raf);
        this._raf = null;
      }
      // Drop the head rules when the last doc-page leaves, so a deleted
      // document's @page geometry and text-wrap defaults can't apply to
      // whatever replaces it.
      const survivor = document.querySelector('doc-page');
      if (!survivor) {
        ['doc-page-print', 'doc-page-text-wrap', 'doc-page-owns-print', 'doc-page-fixed-size', 'doc-page-print-sizing'].forEach(id => {
          const tag = document.getElementById(id);
          if (tag) tag.remove();
        });
        // A live deck-stage deferred its own print-sizing meta to ours —
        // hand the page-global meta over so the deck isn't left unmarked.
        const deck = document.querySelector('deck-stage');
        if (deck && typeof deck._ensurePrintSizingMeta === 'function') {
          deck._ensurePrintSizingMeta();
        }
      } else {
        // A departed owner hands each page-global meta to whatever
        // doc-page remains (or it's removed).
        if (typeof survivor._syncFixedSizeMeta === 'function') {
          survivor._syncFixedSizeMeta();
        }
        if (typeof survivor._syncPrintSizingMeta === 'function') {
          survivor._syncPrintSizingMeta();
        }
      }
    }
    attributeChangedCallback() {
      if (!this._sheet) return;
      this._syncSize();
      this._syncPrintPageRule();
      this._syncFixedSizeMeta();
      this._syncPrintSizingMeta();
      this._scheduleMeasure();
    }
    _render() {
      this._root.innerHTML = `
        <style>${stylesheet}</style>
        <style id="vars"></style>
        <div class="sheet" data-screen-label="Document">
          <table class="frame" role="presentation">
            <thead><tr><th><div class="hdr-space"><slot name="header"></slot></div></th></tr></thead>
            <tbody><tr><td class="body"><div class="fit-box"><div class="fit"><slot></slot></div></div></td></tr></tbody>
            <tfoot><tr><td><div class="ftr-space"><slot name="footer"></slot></div></td></tr></tfoot>
          </table>
        </div>`;
      this._sheet = this._root.querySelector('.sheet');
      this._vars = this._root.getElementById('vars');
    }

    /** Runtime sizing lives in a shadow <style> :host rule, never on the
     *  light-DOM host element, so serialize-persist can't write it back. */
    _syncSize(hdrH, ftrH) {
      // Scaled-fit mode: content at its authored size, scaled onto the
      // printable area (page minus margins on both axes). The factor is a
      // plain number var so calc(length * number) stays valid; 4 decimals
      // keeps the shadow style stable across re-measures. Upscaling is
      // allowed — print transforms are vector, so text and CSS stay crisp
      // (raster images soften, which the catalog bullet warns about).
      const fit = this._contentFit();
      let fitVars = '';
      if (fit) {
        const marginPx = toPx(this.pageMargin) || 0;
        const availW = toPx(this.pageWidth) - 2 * marginPx;
        const availH = toPx(this.pageHeight) - 2 * marginPx;
        const scale = Math.min(availW / fit[2], availH / fit[3]);
        if (scale > 0 && Number.isFinite(scale)) {
          fitVars = '--doc-fit-w:' + fit[0] + ';' + '--doc-fit-h:' + fit[1] + ';' + '--doc-fit-scale:' + scale.toFixed(4) + ';';
        }
      }
      this._sheet.classList.toggle('fit-mode', !!fitVars);
      // Numeric w/h ratio for the paginated page cards' aspect-ratio —
      // aspect-ratio takes a number, not a length ratio, so compute it
      // here (CSS length division isn't portable). 6 decimals keeps the
      // shadow style stable across re-syncs.
      const arW = toPx(this.pageWidth);
      const arH = toPx(this.pageHeight);
      const ar = arW > 0 && arH > 0 ? (arW / arH).toFixed(6) : '0.772727';
      this._vars.textContent = ':host{' + fitVars + '--doc-page-ar:' + ar + ';' + '--doc-page-w:' + this.pageWidth + ';' + '--doc-page-h:' + this.pageHeight + ';' + '--doc-page-margin:' + this.pageMargin + ';' + '--doc-hdr-h:' + (hdrH || 0) + 'px;' + '--doc-ftr-h:' + (ftrH || 0) + 'px;' + '--doc-hdr-pad:' + (hdrH ? '0.35in' : '0px') + ';' + '--doc-ftr-pad:' + (ftrH ? '0.35in' : '0px') + '}';
    }

    /** @page is a no-op inside shadow DOM, so the rule lives in <head>.
     *  Re-appended on every sync so it stays last in source order — the
     *  @page cascade is source-order per descriptor, so this rule wins
     *  over any other @page rule in the document.
     *
     *  The @page SIZE is pinned where the page box IS part of the design:
     *  explicit-fixed-size mode (width + height authored), scaled-fit
     *  mode (the named sheet the fit targets), and explicit pagination
     *  (the named size the cards share — so card and sheet agree on
     *  every print path, and the export path's chosen paper overrides
     *  BOTH with one later rule). For FLOWING documents no paper size is
     *  emitted at all — the true size comes from the user's preference,
     *  injected by the export path or chosen in the print dialog — so a
     *  flowing document never fights the paper it lands on.
     *  margin: 0 is emitted in every mode: it leaves Chrome no margin box
     *  to draw its date/URL/page-count header in, and the visual margin
     *  lives on the sheet's own padding. */
    _syncPrintPageRule() {
      const id = 'doc-page-print';
      let tag = document.getElementById(id);
      if (!tag) {
        tag = document.createElement('style');
        tag.id = id;
      }
      document.head.appendChild(tag);
      // Three print-geometry regimes:
      // - true-size: the page IS the design — pin its exact size.
      // - scaled-fit (content-width/height): the fit factor is computed
      //   against the NAMED paper's printable area, so that paper must
      //   stay pinned or the scaled content overflows a smaller sheet
      //   (the export path re-fits and re-pins at print time on top).
      // - default modes: no paper size — but landscape still needs the
      //   paper-agnostic 'size: landscape' keyword, because the size
      //   descriptor is what carries orientation; without it a landscape
      //   document prints portrait whenever nothing injects a size.
      const landscape = (this.getAttribute('orientation') || '').trim().toLowerCase() === 'landscape';
      // Explicit pagination pins the page box to the SAME values that
      // size the cards (the named size by default, the export path's
      // chosen paper when its later rule overrides both) — card and
      // sheet agree on every print path, and a mismatched real paper
      // shrinks-to-fit in the dialog instead of clipping a Letter card
      // on A4. Declared before the paginated read below so both derive
      // from one check.
      const paginatedNow = this.querySelector(':scope > .page') !== null;
      const sizeDescriptor = this._trueSizePx() ? 'size: ' + this.pageWidth + ' ' + this.pageHeight + '; ' : this._contentFit() ? 'size: ' + this.pageWidth + ' ' + this.pageHeight + '; ' : paginatedNow ? 'size: ' + this.pageWidth + ' ' + this.pageHeight + '; ' : landscape ? 'size: landscape; ' : '';
      // WebKit never repeats the thead/tfoot spacers that carry a flowing
      // document's vertical page margins (see WK_PRINT above), so pages
      // after the first print edge-to-edge there. Carry the VERTICAL
      // margins on @page for WebKit instead, and the shadow print CSS
      // trims the first-page spacers by the same amount (.sheet.wk-print
      // rules). Horizontal inset stays on the sheet's own padding in
      // every engine. Blink keeps margin: 0 (a nonzero margin there
      // re-opens the box Chrome draws its header furniture in). One cost,
      // learned in testing: Safari's own date/URL headers are a USER
      // dialog setting ("Print headers and footers") that renders in the
      // margin area when room exists — margin: 0 only suppressed it by
      // leaving no room, and no CSS controls it. The export dialog's
      // Safari guide teaches turning the setting off for flowing
      // documents. Explicitly paginated and fixed-size documents keep
      // margin: 0 everywhere: their pages ARE the sheet.
      const wkFlowing = WK_PRINT && !paginatedNow && !this._trueSizePx() && !this._contentFit();
      const marginDescriptor = wkFlowing ? 'margin: ' + this.pageMargin + ' 0; ' : 'margin: 0; ';
      // Shadow-internal marker (never serialized), kept in lockstep with
      // the @page decision above: the print CSS trims the first-page
      // spacers ONLY while @page actually carries the margins — a
      // true-size or scaled-fit sheet keeps margin: 0 and must keep its
      // spacers too. Re-synced here so attribute changes and pagination
      // flips move both together.
      if (this._sheet) this._sheet.classList.toggle('wk-print', wkFlowing);
      tag.textContent = '@page { ' + sizeDescriptor + marginDescriptor + '} ' + '@media print { html, body { margin: 0 !important; padding: 0 !important; background: none !important; height: auto !important; overflow: visible !important; } ' + 'h1,h2,h3,h4,h5,h6 { break-after: avoid; } ' + 'figure,pre,blockquote,img,svg,tr { break-inside: avoid; } ' + 'p,li { orphans: 3; widows: 3; } ' + '* { -webkit-print-color-adjust: exact; print-color-adjust: exact; ' + 'backdrop-filter: none !important; -webkit-backdrop-filter: none !important; } ' + '*, *::before, *::after { animation-delay: -99s !important; animation-duration: .001s !important; ' + 'animation-iteration-count: 1 !important; animation-fill-mode: both !important; ' + 'animation-play-state: running !important; transition-duration: 0s !important; } }';
    }

    /** Typographic defaults for document text: balance headings, avoid
     *  widowed/orphaned words in body copy (browsers without text-wrap
     *  support drop the declarations). Zero-specificity via :where() so
     *  any text-wrap authored on those elements wins; document-level so the
     *  rules reach the slotted (light DOM) content — shadow styles can't.
     *  data-omelette-injected marks the tag for the host editor to strip
     *  at serialize, so it is never written back as authored source. */
    _ensureTextWrapDefaults() {
      if (document.getElementById('doc-page-text-wrap')) return;
      const tag = document.createElement('style');
      tag.id = 'doc-page-text-wrap';
      tag.setAttribute('data-omelette-injected', '');
      tag.textContent = ':where(h1,h2,h3,h4,h5,h6){text-wrap:balance}' + ':where(p,li,blockquote,figcaption){text-wrap:pretty}';
      document.head.appendChild(tag);
    }

    /** Declares that this document owns its print CSS. The instant-PDF
     *  export checks for the meta by NAME PRESENCE alone (content is
     *  ignored) and skips its automatic print-CSS injections, so the
     *  component's @page geometry is never overridden by a heuristic.
     *  data-omelette-injected keeps it out of serialized source. */
    _ensureOwnsPrintMeta() {
      if (document.getElementById('doc-page-owns-print')) return;
      const tag = document.createElement('meta');
      tag.id = 'doc-page-owns-print';
      tag.name = 'omelette-owns-print';
      tag.content = 'true';
      tag.setAttribute('data-omelette-injected', '');
      document.head.appendChild(tag);
    }

    /** This page's valid true-size page box (explicit width AND height)
     *  as [w, h] px ints, or null when the mode is off. */
    _trueSizePx() {
      if (!safeLen(this.getAttribute('width'), null) || !safeLen(this.getAttribute('height'), null)) return null;
      const w = Math.round(toPx(this.pageWidth));
      const h = Math.round(toPx(this.pageHeight));
      return w > 0 && h > 0 ? [w, h] : null;
    }

    /** True-size pages (explicit width AND height) also declare the page
     *  box as the preview size: the in-app preview reads
     *  meta[name="omelette-fixed-size"] (content "W,H" in px ints) and
     *  scales the sheet into view — without it an 18in poster previews at
     *  true size with scrollbars. Never overrides an author-set meta
     *  (only the component's own id is managed). The meta is page-global
     *  while doc-page instances are not, so every sync recomputes the
     *  page-wide owner — the first connected true-size doc-page — and a
     *  non-true-size sibling's sync can never delete the owner's meta.
     *  Removed when no true-size page remains (the owner's disconnect
     *  re-syncs via any survivor) or when an author-set meta exists. */
    _syncFixedSizeMeta() {
      const id = 'doc-page-fixed-size';
      const own = document.getElementById(id);
      const authored = document.querySelector('meta[name="omelette-fixed-size"]:not([data-omelette-injected])');
      // The page-wide owner, not this instance: an upgraded true-size page
      // anywhere in the document keeps the meta alive and sized.
      let box = null;
      for (const el of document.querySelectorAll('doc-page')) {
        box = typeof el._trueSizePx === 'function' ? el._trueSizePx() : null;
        if (box) break;
      }
      if (!box || authored) {
        if (own) own.remove();
        return;
      }
      const tag = own || document.createElement('meta');
      tag.id = id;
      tag.name = 'omelette-fixed-size';
      tag.content = box[0] + ',' + box[1];
      tag.setAttribute('data-omelette-injected', '');
      if (!own) document.head.appendChild(tag);
    }

    /** This page's print-sizing mode: 'fixed' when an explicit width AND
     *  height are authored (the page is the design's own size), else the
     *  default paper in the authored orientation. */
    _printSizingMode() {
      if (this._trueSizePx()) return 'fixed';
      const landscape = (this.getAttribute('orientation') || '').trim().toLowerCase() === 'landscape';
      return landscape ? 'default-landscape' : 'default-portrait';
    }

    /** Announces the print-sizing mode to the host app:
     *  meta[name="omelette-print-sizing"] with content 'default-portrait',
     *  'default-landscape', or 'fixed' (fixed pages also carry the
     *  omelette-fixed-size meta with the page box in px). The export path
     *  probes it to decide what true paper size to inject at print time —
     *  in the default modes the component emits no paper size of its own.
     *  Same page-global ownership rules as the fixed-size meta above:
     *  first connected doc-page owns it, an authored meta is never
     *  overridden, removed when no doc-page remains. */
    _syncPrintSizingMeta() {
      const id = 'doc-page-print-sizing';
      const own = document.getElementById(id);
      const authored = document.querySelector('meta[name="omelette-print-sizing"]:not([data-omelette-injected])');
      // A fixed page wins outright (mirroring the fixed-size loop above,
      // so the two metas can never contradict each other in a mixed
      // multi-page document); otherwise the first page's mode holds.
      let mode = null;
      for (const el of document.querySelectorAll('doc-page')) {
        if (typeof el._printSizingMode !== 'function') continue;
        const m = el._printSizingMode();
        if (m === 'fixed') {
          mode = m;
          break;
        }
        if (mode === null) mode = m;
      }
      if (!mode || authored) {
        if (own) own.remove();
        return;
      }
      // A deck-stage that connected first injected its own meta and
      // defers to any existing one — take it over, or the document ends
      // up with two conflicting injected metas (a doc-page page is the
      // document; the deck re-ensures its meta if every doc-page leaves).
      const deckMeta = document.getElementById('deck-stage-print-sizing');
      if (deckMeta) deckMeta.remove();
      const tag = own || document.createElement('meta');
      tag.id = id;
      tag.name = 'omelette-print-sizing';
      tag.content = mode;
      tag.setAttribute('data-omelette-injected', '');
      if (!own) document.head.appendChild(tag);
    }
    _scheduleMeasure() {
      if (this._raf) return;
      this._raf = requestAnimationFrame(() => {
        this._raf = null;
        this._measure();
      });
    }

    /** Slot heights feed the print spacers (--doc-hdr-h / --doc-ftr-h), so
     *  they re-measure on content mutation, resize, and font load. The
     *  same pass detects explicit pagination (direct .page children) and
     *  toggles the sheet between the flowing-document card and the
     *  page-per-card stack — content edits can add or remove pages at any
     *  time, so this tracks the same mutations the measurement does. */
    _measure() {
      const hdr = this.querySelector(':scope > [slot="header"]');
      const ftr = this.querySelector(':scope > [slot="footer"]');
      const wasPaginated = this._sheet.classList.contains('paginated');
      this._sheet.classList.toggle('paginated', this.querySelector(':scope > .page') !== null);
      // The WebKit @page margin is flowing-only, so a pagination flip
      // must re-emit the rule (content edits can add or remove .page
      // sections at any time).
      if (this._sheet.classList.contains('paginated') !== wasPaginated) {
        this._syncPrintPageRule();
      }
      this._syncSize(hdr ? hdr.offsetHeight : 0, ftr ? ftr.offsetHeight : 0);
    }
  }
  if (!customElements.get('doc-page')) {
    customElements.define('doc-page', DocPage);
  }
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "doc-page.js", error: String((e && e.message) || e) }); }

// ui_kits/website/AdhesionScreen.jsx
try { (() => {
(function () {
  const {
    SectionTitle,
    Card,
    Input,
    Select,
    Checkbox,
    Radio,
    Button,
    Callout,
    Dialog,
    Toast,
    StatTile
  } = window.ALPEDesignSystem_2d31df;
  function AdhesionScreen() {
    const {
      Container,
      PageHero
    } = window;
    const [ecole, setEcole] = React.useState('');
    const [rgpd, setRgpd] = React.useState(false);
    const [benevole, setBenevole] = React.useState(false);
    const [paiement, setPaiement] = React.useState('Chèque');
    const [open, setOpen] = React.useState(false);
    const [sent, setSent] = React.useState(false);
    return /*#__PURE__*/React.createElement("main", null, /*#__PURE__*/React.createElement(PageHero, {
      title: "Adh\xE9sion",
      breadcrumb: [{
        label: 'Accueil',
        href: '#'
      }, 'Adhésion']
    }), /*#__PURE__*/React.createElement(Container, {
      style: {
        padding: 'var(--section-y) var(--gutter)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: '1fr 0.7fr',
        gap: 'var(--space-12)',
        alignItems: 'start'
      }
    }, /*#__PURE__*/React.createElement(Card, {
      padding: "var(--space-8)"
    }, /*#__PURE__*/React.createElement(SectionTitle, {
      level: 2,
      title: "Rejoignez ALPE pour l'ann\xE9e 2026-2027",
      lead: "Une adh\xE9sion par famille, 10 \u20AC. Elle vous donne voix au chapitre dans chacun des \xE9tablissements o\xF9 nous si\xE9geons."
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 'var(--space-5)',
        marginTop: 'var(--space-8)'
      }
    }, /*#__PURE__*/React.createElement(Input, {
      label: "Nom de famille",
      placeholder: "Dupont",
      required: true
    }), /*#__PURE__*/React.createElement(Input, {
      label: "Pr\xE9nom du ou des parents",
      placeholder: "Camille & Julien",
      required: true
    }), /*#__PURE__*/React.createElement(Input, {
      label: "Adresse e-mail",
      type: "email",
      icon: "fa-solid fa-envelope",
      required: true,
      hint: "Nous ne diffusons jamais votre adresse."
    }), /*#__PURE__*/React.createElement(Input, {
      label: "T\xE9l\xE9phone",
      icon: "fa-solid fa-phone",
      placeholder: "06 00 00 00 00"
    }), /*#__PURE__*/React.createElement(Select, {
      label: "\xC9tablissement principal",
      placeholder: "Choisissez\u2026",
      value: ecole,
      onChange: e => setEcole(e.target.value),
      options: ['Le Blé en Herbe', 'La Rivière (maternelle)', 'Marcel Pagnol (maternelle)', 'Pauline Kergomard', 'Trois Pommes', 'Alphonse Daudet', 'Jacques Prévert', 'La Rivière (élémentaire)', 'Marcel Pagnol (élémentaire)', 'Jules Verne', 'Galilée', 'Dissart-Françoise']
    }), /*#__PURE__*/React.createElement(Input, {
      label: "Nombre d'enfants scolaris\xE9s",
      type: "number",
      defaultValue: "2"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        gridColumn: '1 / -1'
      }
    }, /*#__PURE__*/React.createElement(Radio, {
      name: "paiement",
      legend: "R\xE8glement de la cotisation",
      inline: true,
      options: ['Chèque', 'Espèces', 'Virement'],
      value: paiement,
      onChange: setPaiement
    })), /*#__PURE__*/React.createElement(Input, {
      label: "Un mot pour l'\xE9quipe (facultatif)",
      multiline: true,
      rows: 3,
      style: {
        gridColumn: '1 / -1'
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        gridColumn: '1 / -1',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)'
      }
    }, /*#__PURE__*/React.createElement(Checkbox, {
      label: "Je souhaite \xEAtre b\xE9n\xE9vole \xE0 la bourse aux v\xEAtements",
      description: "Environ 4 h sur un week-end, deux fois par an",
      checked: benevole,
      onChange: setBenevole
    }), /*#__PURE__*/React.createElement(Checkbox, {
      label: "J'accepte que ALPE conserve ces informations pour la dur\xE9e de l'adh\xE9sion",
      checked: rgpd,
      onChange: setRgpd
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 'var(--space-3)',
        marginTop: 'var(--space-8)',
        alignItems: 'center'
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      size: "lg",
      disabled: !rgpd,
      onClick: () => setOpen(true)
    }, "Adh\xE9rez"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 'var(--text-2xs)',
        color: 'var(--text-muted)'
      }
    }, rgpd ? '10 € par famille · année scolaire complète' : 'Cochez le consentement pour continuer'))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-5)'
      }
    }, /*#__PURE__*/React.createElement(Card, {
      accent: "blue"
    }, /*#__PURE__*/React.createElement("h4", {
      style: {
        margin: 0
      }
    }, "Ce que finance votre cotisation"), /*#__PURE__*/React.createElement("ul", {
      style: {
        margin: 'var(--space-3) 0 0',
        paddingLeft: 20,
        fontSize: 'var(--text-sm)',
        lineHeight: 'var(--leading-relaxed)'
      }
    }, /*#__PURE__*/React.createElement("li", null, "La repr\xE9sentation des parents dans les douze \xE9tablissements"), /*#__PURE__*/React.createElement("li", null, "Le forum des m\xE9tiers et des formations"), /*#__PURE__*/React.createElement("li", null, "Les actions \xE9co-citoyennes et la commission cantine"))), /*#__PURE__*/React.createElement(Callout, {
      tone: "info",
      title: "Nous restons ind\xE9pendants"
    }, "Aucune subvention municipale hors pr\xEAt de salles et photocopies. Nos ressources : les cotisations et les bourses aux v\xEAtements."), /*#__PURE__*/React.createElement(Card, {
      muted: true
    }, /*#__PURE__*/React.createElement(StatTile, {
      value: "10 \u20AC",
      label: "par famille et par an",
      tone: "orange"
    }))))), /*#__PURE__*/React.createElement(Dialog, {
      open: open,
      title: "Confirmer votre adh\xE9sion",
      onClose: () => setOpen(false),
      footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
        variant: "ghost",
        onClick: () => setOpen(false)
      }, "Annuler"), /*#__PURE__*/React.createElement(Button, {
        variant: "secondary",
        onClick: () => {
          setOpen(false);
          setSent(true);
        }
      }, "Confirmer"))
    }, "La cotisation est de ", /*#__PURE__*/React.createElement("strong", null, "10 \u20AC par famille"), " pour l'ann\xE9e scolaire compl\xE8te, \xE0 r\xE9gler par ", paiement.toLowerCase(), " \xE0 l'ordre de ALPE. Nous vous recontactons pour finaliser votre inscription."), sent ? /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'fixed',
        right: 24,
        bottom: 24,
        zIndex: 200
      }
    }, /*#__PURE__*/React.createElement(Toast, {
      tone: "success",
      title: "Adh\xE9sion enregistr\xE9e",
      message: "Merci ! Nous vous \xE9crivons sous quelques jours. \xC0 tr\xE8s vite !",
      onClose: () => setSent(false)
    })) : null);
  }
  Object.assign(window, {
    AdhesionScreen
  });
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/AdhesionScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/AssociationScreen.jsx
try { (() => {
(function () {
  const {
    SectionTitle,
    Card,
    StatTile,
    Callout,
    Badge,
    Button
  } = window.ALPEDesignSystem_2d31df;
  const ALPE_VALUES = [{
    k: 'LOCALE',
    d: "Nous revendiquons notre ancrage et notre implantation plaisançoise.",
    i: 'fa-solid fa-location-dot',
    c: 'var(--brand-primary)'
  }, {
    k: 'INDÉPENDANTE',
    d: "Aucun lien avec un regroupement national, donc aucune directive imposée. Pas de subvention municipale hors prêt de salles.",
    i: 'fa-solid fa-compass',
    c: 'var(--brand-secondary)'
  }, {
    k: 'APOLITIQUE',
    d: "Aucun parti politique : nos statuts interdisent tout engagement politique aux membres du bureau.",
    i: 'fa-solid fa-scale-balanced',
    c: 'var(--brand-primary)'
  }];
  function AssociationScreen() {
    const {
      Container,
      PageHero
    } = window;
    return /*#__PURE__*/React.createElement("main", null, /*#__PURE__*/React.createElement(PageHero, {
      title: "L'association",
      breadcrumb: [{
        label: 'Accueil',
        href: '#'
      }, "L'association"]
    }), /*#__PURE__*/React.createElement(Container, {
      narrow: true,
      style: {
        padding: 'var(--section-y) var(--gutter) 0'
      }
    }, /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 'var(--text-lg)',
        lineHeight: 'var(--leading-normal)',
        color: 'var(--text-strong)'
      }
    }, "Bienvenue sur le site de l'association locale des parents d'\xE9l\xE8ves (A.L.P.E.) de Plaisance du Touch."), /*#__PURE__*/React.createElement("h2", {
      style: {
        marginTop: 'var(--space-10)',
        fontSize: 'var(--text-2xl)'
      }
    }, "L'association en quelques mots"), /*#__PURE__*/React.createElement("p", {
      style: {
        marginTop: 'var(--space-4)',
        fontSize: 'var(--text-md)'
      }
    }, "ALPE a \xE9t\xE9 cr\xE9\xE9e en ", /*#__PURE__*/React.createElement("strong", null, "1987"), " par une dizaine de familles plaisan\xE7oises qui d\xE9siraient participer \xE0 la vie scolaire et extra-scolaire de leurs enfants, et qui ne se reconnaissaient pas toujours dans les orientations des f\xE9d\xE9rations nationales. Nos statuts n'ont que tr\xE8s peu chang\xE9 depuis."), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 'var(--text-md)'
      }
    }, /*#__PURE__*/React.createElement("strong", null, "\xAB Le bien-\xEAtre de l'\xE9l\xE8ve \xBB"), ", voil\xE0 la conviction qui anime aujourd'hui les ", /*#__PURE__*/React.createElement("strong", null, "170 familles adh\xE9rentes"), ". Toutes les d\xE9cisions et grandes orientations de ALPE ont \xE9t\xE9, sont encore et seront toujours prises dans le respect de ce principe.")), /*#__PURE__*/React.createElement(Container, {
      style: {
        padding: 'var(--section-y-tight) var(--gutter)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 'var(--space-5)'
      }
    }, ALPE_VALUES.map(v => /*#__PURE__*/React.createElement(Card, {
      key: v.k
    }, /*#__PURE__*/React.createElement("i", {
      className: v.i,
      "aria-hidden": "true",
      style: {
        fontSize: 22,
        color: v.c
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 'var(--space-4)',
        fontFamily: 'var(--font-heading)',
        fontWeight: 700,
        fontSize: 'var(--text-lg)',
        letterSpacing: 'var(--tracking-caps)',
        color: v.c
      }
    }, v.k), /*#__PURE__*/React.createElement("p", {
      style: {
        margin: 'var(--space-3) 0 0',
        fontSize: 'var(--text-sm)'
      }
    }, v.d))))), /*#__PURE__*/React.createElement(Container, {
      narrow: true,
      style: {
        paddingBottom: 'var(--section-y)'
      }
    }, /*#__PURE__*/React.createElement(Callout, {
      tone: "info",
      title: "Cotisation annuelle"
    }, "Le montant annuel de la cotisation est de ", /*#__PURE__*/React.createElement("strong", null, "10 \u20AC par famille"), " (ch\xE8que \xE0 l'ordre de ALPE)."), /*#__PURE__*/React.createElement("h2", {
      style: {
        marginTop: 'var(--space-12)',
        fontSize: 'var(--text-2xl)'
      }
    }, "L'\xE9quipe"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 'var(--space-6)',
        marginTop: 'var(--space-6)'
      }
    }, /*#__PURE__*/React.createElement(StatTile, {
      value: "21",
      label: "membres au conseil d'administration"
    }), /*#__PURE__*/React.createElement(StatTile, {
      tone: "orange",
      value: "60",
      label: "b\xE9n\xE9voles sur les bourses"
    }), /*#__PURE__*/React.createElement(StatTile, {
      value: "12",
      label: "t\xEAtes de liste",
      sublabel: "une par \xE9tablissement"
    }), /*#__PURE__*/React.createElement(StatTile, {
      tone: "orange",
      value: "1987",
      label: "ann\xE9e de d\xE9p\xF4t des statuts"
    })), /*#__PURE__*/React.createElement(Card, {
      muted: true,
      style: {
        marginTop: 'var(--space-8)',
        display: 'flex',
        gap: 'var(--space-5)',
        alignItems: 'center'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 72,
        height: 72,
        borderRadius: '50%',
        background: 'var(--surface-brand-soft)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--blue-300)',
        fontSize: 10,
        fontWeight: 700,
        textAlign: 'center',
        flex: '0 0 auto'
      }
    }, "PHOTO"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-heading)',
        fontWeight: 700,
        fontSize: 'var(--text-lg)',
        color: 'var(--text-heading)'
      }
    }, "Charlotte Watier"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 'var(--text-sm)',
        color: 'var(--text-muted)'
      }
    }, "Pr\xE9sidente du conseil d'administration"), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 'var(--space-3)'
      }
    }, /*#__PURE__*/React.createElement(Badge, {
      tone: "neutral"
    }, "Portrait \xE0 fournir"))))));
  }
  Object.assign(window, {
    AssociationScreen
  });
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/AssociationScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/BourseScreen.jsx
try { (() => {
(function () {
  const {
    SectionTitle,
    Card,
    Callout,
    Button,
    EventCard,
    Badge,
    StatTile,
    Tabs
  } = window.ALPEDesignSystem_2d31df;
  function BourseScreen() {
    const {
      Container,
      PageHero
    } = window;
    const [tab, setTab] = React.useState('Déposer');
    return /*#__PURE__*/React.createElement("main", null, /*#__PURE__*/React.createElement(PageHero, {
      title: "Bourse aux v\xEAtements",
      breadcrumb: [{
        label: 'Accueil',
        href: '#'
      }, {
        label: 'Nos actions',
        href: '#'
      }, 'Bourse aux vêtements']
    }), /*#__PURE__*/React.createElement(Container, {
      style: {
        padding: 'var(--section-y) var(--gutter) 0'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: '1.35fr 0.65fr',
        gap: 'var(--space-12)',
        alignItems: 'start'
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionTitle, {
      eyebrow: "Depuis 1987",
      title: "La bourse aux v\xEAtements et aux jouets",
      lead: "Une de nos manifestations pr\xE9f\xE9r\xE9e !!!"
    }), /*#__PURE__*/React.createElement("p", {
      style: {
        marginTop: 'var(--space-6)',
        fontSize: 'var(--text-md)'
      }
    }, "Cr\xE9\xE9e aux d\xE9buts de l'association en 1987 pour ", /*#__PURE__*/React.createElement("strong", null, "faire vivre celle-ci"), ", elle perdure depuis, gr\xE2ce \xE0 de fid\xE8les d\xE9posants et aux nombreux b\xE9n\xE9voles qui s'y investissent."), /*#__PURE__*/React.createElement("ul", {
      style: {
        paddingLeft: 22,
        fontSize: 'var(--text-md)',
        lineHeight: 'var(--leading-relaxed)'
      }
    }, /*#__PURE__*/React.createElement("li", null, "Environ ", /*#__PURE__*/React.createElement("strong", null, "10 000 articles sont propos\xE9s \xE0 la vente"), " (v\xEAtements adultes et enfants, jouets, livres, mat\xE9riels et articles de sport\u2026)"), /*#__PURE__*/React.createElement("li", null, "Plus de 50 % d'articles vendus, ", /*#__PURE__*/React.createElement("strong", null, "permettant \xE0 ALPE de fonctionner"), " avec les 20 % pr\xE9lev\xE9s sur la totalit\xE9 de ces ventes.")), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 'var(--text-md)'
      }
    }, "La bourse permet aux enseignants de Plaisance de renouveler \xE0 bas prix les jouets et les livres de leur \xE9cole. Une ", /*#__PURE__*/React.createElement("strong", null, "partie de la recette est revers\xE9e aux coop\xE9ratives scolaires"), " qui mettent en place des projets de classes vertes."), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 'var(--space-8)'
      }
    }, /*#__PURE__*/React.createElement(Tabs, {
      items: ['Déposer', 'Acheter', 'Devenir bénévole'],
      value: tab,
      onChange: setTab
    }), /*#__PURE__*/React.createElement(Card, {
      style: {
        marginTop: 'var(--space-5)'
      }
    }, tab === 'Déposer' ? /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h4", {
      style: {
        margin: 0
      }
    }, "D\xE9poser vos articles"), /*#__PURE__*/React.createElement("p", {
      style: {
        margin: 'var(--space-3) 0 0',
        fontSize: 'var(--text-sm)'
      }
    }, "Le d\xE9p\xF4t se fait sur cr\xE9neau, la semaine pr\xE9c\xE9dant la vente. Chaque d\xE9posant remplit une liste num\xE9rot\xE9e ; ALPE retient 20 % du montant des ventes.")) : tab === 'Acheter' ? /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h4", {
      style: {
        margin: 0
      }
    }, "Venir acheter"), /*#__PURE__*/React.createElement("p", {
      style: {
        margin: 'var(--space-3) 0 0',
        fontSize: 'var(--text-sm)'
      }
    }, "Entr\xE9e libre \xE0 l'espace Monesti\xE9, samedi de 9h \xE0 18h et dimanche de 9h \xE0 13h. Paiement en esp\xE8ces ou par ch\xE8que.")) : /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h4", {
      style: {
        margin: 0
      }
    }, "Donner un coup de main"), /*#__PURE__*/React.createElement("p", {
      style: {
        margin: 'var(--space-3) 0 0',
        fontSize: 'var(--text-sm)'
      }
    }, "Une soixantaine de b\xE9n\xE9voles font tourner la bourse : tri, mise en rayon, caisse, restitution. Comptez environ 4 h sur le week-end."))))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-5)'
      }
    }, /*#__PURE__*/React.createElement(Card, {
      accent: "orange"
    }, /*#__PURE__*/React.createElement(Badge, {
      tone: "orange"
    }, "Bourse Printemps 2026"), /*#__PURE__*/React.createElement("h3", {
      style: {
        margin: 'var(--space-4) 0 0',
        fontSize: 'var(--text-xl)'
      }
    }, "Espace Monesti\xE9, Plaisance du Touch"), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 'var(--space-4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-2)',
        fontSize: 'var(--text-sm)'
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("i", {
      className: "fa-solid fa-calendar-day",
      "aria-hidden": "true",
      style: {
        color: 'var(--brand-secondary)',
        marginRight: 8
      }
    }), /*#__PURE__*/React.createElement("strong", null, "Samedi 18 avril de 9h \xE0 18h")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("i", {
      className: "fa-solid fa-calendar-day",
      "aria-hidden": "true",
      style: {
        color: 'var(--brand-secondary)',
        marginRight: 8
      }
    }), /*#__PURE__*/React.createElement("strong", null, "Dimanche 19 avril de 9h \xE0 13h"))), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 'var(--space-5)'
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      fullWidth: true,
      disabled: true
    }, "Cr\xE9neaux de d\xE9p\xF4t complets"))), /*#__PURE__*/React.createElement(Callout, {
      tone: "warning"
    }, "Tous nos cr\xE9neaux d\xE9posants sont maintenant complets, nous vous remercions pour votre participation ! \xC0 tr\xE8s vite ! ", /*#__PURE__*/React.createElement("em", null, "L'\xC9quipe Bourse ALPE")), /*#__PURE__*/React.createElement(Card, {
      muted: true
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gap: 'var(--space-5)'
      }
    }, /*#__PURE__*/React.createElement(StatTile, {
      value: "10 000",
      label: "articles en vente"
    }), /*#__PURE__*/React.createElement(StatTile, {
      tone: "orange",
      value: "20 %",
      label: "pr\xE9lev\xE9s sur les ventes",
      sublabel: "notre principale ressource"
    })))))), /*#__PURE__*/React.createElement(Container, {
      style: {
        padding: 'var(--section-y) var(--gutter) 0'
      }
    }, /*#__PURE__*/React.createElement(SectionTitle, {
      eyebrow: "Actualit\xE9s",
      title: "Les \xE9ditions pr\xE9c\xE9dentes"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 'var(--space-5)',
        marginTop: 'var(--space-8)'
      }
    }, /*#__PURE__*/React.createElement(EventCard, {
      title: "Bourse Automne 2025",
      dateLabel: "8 & 9 novembre 2025",
      place: "Espace Monesti\xE9",
      excerpt: "Samedi 8 novembre de 9h \xE0 18h, dimanche 9 novembre de 9h \xE0 13h.",
      href: "#"
    }), /*#__PURE__*/React.createElement(EventCard, {
      title: "Bourse Printemps / \xC9t\xE9 2025",
      dateLabel: "12 & 13 avril 2025",
      place: "Espace Monesti\xE9",
      excerpt: "Les cr\xE9neaux pour d\xE9poser lors de la bourse sont complets !",
      href: "#"
    }), /*#__PURE__*/React.createElement(EventCard, {
      title: "Bourse Automne 2024",
      dateLabel: "9 & 10 novembre 2024",
      place: "Espace Monesti\xE9",
      excerpt: "Merci aux soixante b\xE9n\xE9voles mobilis\xE9s sur ce week-end.",
      href: "#"
    }))));
  }
  Object.assign(window, {
    BourseScreen
  });
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/BourseScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/HomeScreen.jsx
try { (() => {
(function () {
  const {
    Button,
    SectionTitle,
    EventCard,
    StatTile,
    Card,
    SchoolChip,
    Tabs,
    Swoosh,
    Badge
  } = window.ALPEDesignSystem_2d31df;
  const ALPE_SCHOOLS = [{
    name: 'Le Blé en Herbe',
    level: 'maternelle'
  }, {
    name: 'La Rivière',
    level: 'maternelle'
  }, {
    name: 'Marcel Pagnol',
    level: 'maternelle'
  }, {
    name: 'Pauline Kergomard',
    level: 'maternelle'
  }, {
    name: 'Trois Pommes',
    level: 'maternelle'
  }, {
    name: 'Alphonse Daudet',
    level: 'elementaire'
  }, {
    name: 'Jacques Prévert',
    level: 'elementaire'
  }, {
    name: 'La Rivière',
    level: 'elementaire'
  }, {
    name: 'Marcel Pagnol',
    level: 'elementaire'
  }, {
    name: 'Jules Verne',
    level: 'college'
  }, {
    name: 'Galilée',
    level: 'college',
    city: 'La Salvetat'
  }, {
    name: 'Dissart-Françoise',
    level: 'lycee',
    city: 'Tournefeuille'
  }];
  function Hero({
    go
  }) {
    const {
      Container
    } = window;
    return /*#__PURE__*/React.createElement("section", {
      style: {
        position: 'relative',
        background: 'var(--surface-page)',
        overflow: 'hidden'
      }
    }, /*#__PURE__*/React.createElement(Container, {
      style: {
        padding: 'var(--space-20) var(--gutter) var(--space-16)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: '1.1fr 0.9fr',
        gap: 'var(--space-16)',
        alignItems: 'center'
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 'var(--space-2)',
        marginBottom: 'var(--space-5)'
      }
    }, /*#__PURE__*/React.createElement(Badge, {
      tone: "orange"
    }, "Locale"), /*#__PURE__*/React.createElement(Badge, {
      tone: "blue"
    }, "Ind\xE9pendante"), /*#__PURE__*/React.createElement(Badge, {
      tone: "yellow"
    }, "Apolitique")), /*#__PURE__*/React.createElement("h1", {
      style: {
        margin: 0,
        fontFamily: 'var(--font-display)',
        fontWeight: 'var(--weight-extrabold)',
        fontSize: 'var(--text-5xl)',
        lineHeight: 'var(--leading-tight)',
        color: 'var(--text-heading)',
        textWrap: 'pretty',
        position: 'relative'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'relative',
        zIndex: 1
      }
    }, "Le bien-\xEAtre de l'\xE9l\xE8ve,"), /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'relative',
        zIndex: 1,
        color: 'var(--brand-secondary)'
      }
    }, "depuis 1987"), /*#__PURE__*/React.createElement("span", {
      "aria-hidden": "true",
      style: {
        position: 'absolute',
        left: 0,
        width: '58%',
        bottom: 6,
        height: 12,
        background: 'var(--brand-accent)',
        borderRadius: 'var(--radius-pill)',
        zIndex: 0
      }
    })), /*#__PURE__*/React.createElement("p", {
      style: {
        marginTop: 'var(--space-5)',
        fontSize: 'var(--text-lg)',
        lineHeight: 'var(--leading-normal)',
        maxWidth: 540
      }
    }, "Nous sommes une association de parents d'\xE9l\xE8ves de Plaisance du Touch, pr\xE9sente dans les douze \xE9tablissements du territoire, de la petite section \xE0 la terminale."), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 'var(--space-3)',
        marginTop: 'var(--space-8)'
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      size: "lg",
      onClick: () => go('adhesion')
    }, "Adh\xE9rez"), /*#__PURE__*/React.createElement(Button, {
      variant: "outline",
      size: "lg",
      onClick: () => go('association')
    }, "Qui sommes-nous ?"))), /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'relative',
        background: 'var(--surface-brand-soft)',
        borderRadius: 'var(--radius-2xl)',
        aspectRatio: '4 / 3',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 'var(--space-8)'
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("img", {
      src: "../../assets/logo-v2-mark.svg",
      alt: "",
      style: {
        width: 190,
        opacity: 0.9
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 'var(--space-4)',
        fontSize: 'var(--text-2xs)',
        fontWeight: 700,
        letterSpacing: 'var(--tracking-wide)',
        textTransform: 'uppercase',
        color: 'var(--blue-400)'
      }
    }, "Emplacement photo \u2014 bourse ou forum"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 'var(--text-2xs)',
        color: 'var(--text-subtle)',
        marginTop: 6
      }
    }, "Aucune phototh\xE8que fournie"))))));
  }
  function StatBand() {
    const {
      Container
    } = window;
    return /*#__PURE__*/React.createElement(Container, null, /*#__PURE__*/React.createElement("div", {
      style: {
        background: 'var(--surface-inverse)',
        borderRadius: 'var(--radius-2xl)',
        padding: 'var(--space-10) var(--space-12)',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 'var(--space-8)',
        alignItems: 'start'
      }
    }, /*#__PURE__*/React.createElement(StatTile, {
      tone: "inverse",
      value: "170",
      label: "familles adh\xE9rentes"
    }), /*#__PURE__*/React.createElement(StatTile, {
      tone: "inverse",
      value: "12",
      label: "\xE9tablissements couverts",
      sublabel: "de la PS \xE0 la terminale"
    }), /*#__PURE__*/React.createElement(StatTile, {
      tone: "inverse",
      value: "60",
      label: "b\xE9n\xE9voles mobilis\xE9s",
      sublabel: "sur les deux bourses"
    }), /*#__PURE__*/React.createElement(StatTile, {
      tone: "inverse",
      value: "10 \u20AC",
      label: "de cotisation",
      sublabel: "par famille et par an"
    })));
  }
  function Actions({
    go
  }) {
    const {
      Container
    } = window;
    const actions = [{
      t: 'Bourse aux vêtements',
      d: "Deux fois par an à l'espace Monestié, environ 10 000 articles déposés par les familles.",
      i: 'fa-solid fa-shirt',
      a: 'orange',
      go: 'bourse'
    }, {
      t: 'Forum des métiers',
      d: '35ᵉ édition les 18 & 19 février 2026 : plus de 90 exposants pour environ 1 100 collégiens.',
      i: 'fa-solid fa-compass',
      a: 'blue'
    }, {
      t: 'Représentation des parents',
      d: 'Des têtes de liste dans chaque établissement, présentes en conseil d\'école et d\'administration.',
      i: 'fa-solid fa-people-group',
      a: 'blue'
    }, {
      t: 'Commission cantine',
      d: 'Nous suivons les menus et la qualité du service de restauration scolaire.',
      i: 'fa-solid fa-utensils',
      a: 'orange'
    }, {
      t: 'Actions éco-citoyennes',
      d: 'Sensibilisation au tri, aux mobilités douces et au gaspillage alimentaire.',
      i: 'fa-solid fa-leaf',
      a: 'blue'
    }];
    return /*#__PURE__*/React.createElement("section", {
      style: {
        padding: 'var(--section-y) 0'
      }
    }, /*#__PURE__*/React.createElement(Container, null, /*#__PURE__*/React.createElement(SectionTitle, {
      eyebrow: "Nos actions",
      title: "Ce que nous faisons, concr\xE8tement",
      lead: "Repr\xE9senter les parents, faire vivre l'association par ses \xE9v\xE9nements, et peser sur le quotidien scolaire."
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 'var(--space-5)',
        marginTop: 'var(--space-10)'
      }
    }, actions.map(a => /*#__PURE__*/React.createElement(Card, {
      key: a.t,
      accent: a.a,
      interactive: true,
      onClick: () => a.go && go(a.go)
    }, /*#__PURE__*/React.createElement("i", {
      className: a.i,
      "aria-hidden": "true",
      style: {
        fontSize: 22,
        color: a.a === 'orange' ? 'var(--brand-secondary)' : 'var(--brand-primary)'
      }
    }), /*#__PURE__*/React.createElement("h3", {
      style: {
        margin: 'var(--space-4) 0 0',
        fontSize: 'var(--text-xl)'
      }
    }, a.t), /*#__PURE__*/React.createElement("p", {
      style: {
        margin: 'var(--space-2) 0 0',
        fontSize: 'var(--text-sm)'
      }
    }, a.d))))));
  }
  function Agenda({
    go
  }) {
    const {
      Container
    } = window;
    return /*#__PURE__*/React.createElement("section", {
      style: {
        background: 'var(--surface-muted)',
        padding: 'var(--section-y) 0'
      }
    }, /*#__PURE__*/React.createElement(Container, null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 'var(--space-8)'
      }
    }, /*#__PURE__*/React.createElement(SectionTitle, {
      eyebrow: "Prochains rendez-vous",
      title: "L'agenda de l'association"
    }), /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      iconRight: "fa-solid fa-arrow-right"
    }, "Tous les \xE9v\xE9nements")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 'var(--space-5)',
        marginTop: 'var(--space-8)'
      }
    }, /*#__PURE__*/React.createElement(EventCard, {
      title: "Bourse Printemps 2026",
      dateLabel: "18 & 19 avril",
      timeLabel: "Sam. 9h\u201318h \xB7 Dim. 9h\u201313h",
      place: "Espace Monesti\xE9",
      badge: "Cr\xE9neaux complets",
      badgeTone: "warning",
      excerpt: "V\xEAtements adultes et enfants, jouets, livres, mat\xE9riel et articles de sport.",
      href: "#",
      cta: "La bourse"
    }), /*#__PURE__*/React.createElement(EventCard, {
      title: "35\u1D49 Forum des m\xE9tiers et des formations",
      dateLabel: "18 & 19 f\xE9vrier 2026",
      timeLabel: "Nocturne le 18 d\xE8s 18h",
      place: "Plaisance du Touch",
      excerpt: "Plus de 90 exposants pour environ 1 100 coll\xE9giens issus de huit \xE9tablissements.",
      href: "#",
      cta: "Le programme"
    }), /*#__PURE__*/React.createElement(EventCard, {
      title: "Assembl\xE9e g\xE9n\xE9rale",
      dateLabel: "24 septembre 2026",
      timeLabel: "20h30",
      place: "Salle des associations",
      excerpt: "Bilan de l'ann\xE9e, vote du budget et renouvellement du conseil d'administration.",
      href: "#",
      cta: "En savoir plus"
    }))));
  }
  function Schools() {
    const {
      Container
    } = window;
    const [level, setLevel] = React.useState('Tous');
    const map = {
      Maternelles: 'maternelle',
      Élémentaires: 'elementaire',
      Collèges: 'college',
      Lycée: 'lycee'
    };
    const shown = level === 'Tous' ? ALPE_SCHOOLS : ALPE_SCHOOLS.filter(s => s.level === map[level]);
    return /*#__PURE__*/React.createElement("section", {
      style: {
        padding: 'var(--section-y) 0'
      }
    }, /*#__PURE__*/React.createElement(Container, null, /*#__PURE__*/React.createElement(SectionTitle, {
      eyebrow: "Les \xE9tablissements",
      title: "Pr\xE9sents partout, de la maternelle au lyc\xE9e",
      lead: "Douze \xE9tablissements couverts, ce qui est rare pour une association de parents non f\xE9d\xE9r\xE9e."
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 'var(--space-8)'
      }
    }, /*#__PURE__*/React.createElement(Tabs, {
      items: ['Tous', 'Maternelles', 'Élémentaires', 'Collèges', 'Lycée'],
      value: level,
      onChange: setLevel
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 'var(--space-3)',
        marginTop: 'var(--space-6)'
      }
    }, shown.map((s, i) => /*#__PURE__*/React.createElement(SchoolChip, {
      key: s.name + i,
      name: s.name,
      level: s.level,
      city: s.city,
      href: "#"
    })))));
  }
  function JoinBand({
    go
  }) {
    const {
      Container
    } = window;
    return /*#__PURE__*/React.createElement(Container, null, /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'relative',
        background: 'var(--surface-brand)',
        borderRadius: 'var(--radius-2xl)',
        padding: 'var(--space-16) var(--space-12)',
        overflow: 'hidden',
        textAlign: 'center'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: -10,
        opacity: 0.5
      }
    }, /*#__PURE__*/React.createElement(Swoosh, {
      height: 120,
      thickness: 12
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'relative'
      }
    }, /*#__PURE__*/React.createElement(SectionTitle, {
      inverse: true,
      align: "center",
      title: "10 \u20AC par famille, et vous comptez dans les d\xE9cisions",
      lead: "La cotisation et les bourses sont nos seules ressources : aucune subvention, aucune f\xE9d\xE9ration, aucune consigne venue d'ailleurs.",
      style: {
        margin: '0 auto'
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 'var(--space-3)',
        justifyContent: 'center',
        marginTop: 'var(--space-8)'
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "inverse",
      size: "lg",
      onClick: () => go('adhesion')
    }, "Adh\xE9rez"), /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      size: "lg",
      style: {
        color: '#fff',
        border: '2px solid rgba(255,255,255,.5)'
      }
    }, "Devenir b\xE9n\xE9vole")))));
  }
  function HomeScreen({
    go
  }) {
    return /*#__PURE__*/React.createElement("main", null, /*#__PURE__*/React.createElement(Hero, {
      go: go
    }), /*#__PURE__*/React.createElement(StatBand, null), /*#__PURE__*/React.createElement(Actions, {
      go: go
    }), /*#__PURE__*/React.createElement(Agenda, {
      go: go
    }), /*#__PURE__*/React.createElement(Schools, null), /*#__PURE__*/React.createElement(JoinBand, {
      go: go
    }));
  }
  Object.assign(window, {
    HomeScreen,
    ALPE_SCHOOLS
  });
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/HomeScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/SiteChrome.jsx
try { (() => {
(function () {
  const {
    Button,
    IconButton,
    Badge
  } = window.ALPEDesignSystem_2d31df;
  const ALPE_NAV = [{
    label: "L'association",
    items: ['Présentation', 'Actualités', 'Événements', "L'équipe ALPE", 'Informations pratiques', 'Contact']
  }, {
    label: 'Les établissements',
    items: ['Écoles maternelles', 'Écoles élémentaires', 'Collèges', 'Lycée']
  }, {
    label: 'Nos actions',
    items: ['Représentation des parents', 'Actions éco-citoyennes', 'Bourse aux vêtements', 'Forum des métiers et des formations', 'Commission cantine']
  }, {
    label: 'Adhésion',
    items: null
  }];
  function TopBar() {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        background: 'var(--blue-800)',
        color: 'rgba(255,255,255,.9)',
        fontSize: 'var(--text-2xs)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        maxWidth: 'var(--container-max)',
        margin: '0 auto',
        padding: '0 var(--gutter)',
        height: 38,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 'var(--space-3)'
      }
    }, ['fa-brands fa-facebook-f', 'fa-brands fa-instagram', 'fa-brands fa-linkedin-in'].map(i => /*#__PURE__*/React.createElement("a", {
      key: i,
      href: "#",
      style: {
        color: 'inherit',
        borderBottom: 0
      }
    }, /*#__PURE__*/React.createElement("i", {
      className: i,
      "aria-hidden": "true"
    })))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 'var(--space-5)',
        alignItems: 'center'
      }
    }, ['Actualités', 'Événements', 'Contact'].map(l => /*#__PURE__*/React.createElement("a", {
      key: l,
      href: "#",
      style: {
        color: 'inherit',
        borderBottom: 0,
        fontWeight: 600
      }
    }, l)), /*#__PURE__*/React.createElement("span", {
      style: {
        width: 1,
        height: 16,
        background: 'rgba(255,255,255,.25)'
      }
    }), /*#__PURE__*/React.createElement("a", {
      href: "#",
      style: {
        color: 'var(--yellow-500)',
        borderBottom: 0,
        fontWeight: 700
      }
    }, /*#__PURE__*/React.createElement("i", {
      className: "fa-solid fa-user",
      "aria-hidden": "true",
      style: {
        marginRight: 6
      }
    }), "Se connecter"))));
  }
  function SiteHeader({
    route,
    go
  }) {
    const [open, setOpen] = React.useState(null);
    return /*#__PURE__*/React.createElement("header", {
      style: {
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: 'var(--surface-page)',
        boxShadow: 'var(--shadow-sm)'
      }
    }, /*#__PURE__*/React.createElement(TopBar, null), /*#__PURE__*/React.createElement("div", {
      style: {
        maxWidth: 'var(--container-max)',
        margin: '0 auto',
        padding: '0 var(--gutter)',
        height: 92,
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-8)'
      }
    }, /*#__PURE__*/React.createElement("a", {
      href: "#",
      onClick: e => {
        e.preventDefault();
        go('home');
      },
      style: {
        borderBottom: 0,
        flex: '0 0 auto'
      }
    }, /*#__PURE__*/React.createElement("img", {
      src: "../../assets/logo-alpe-v2-horizontal.png",
      alt: "ALPE \u2014 Association Locale de Parents d'\xC9l\xE8ves, Plaisance du Touch",
      style: {
        height: 62,
        display: 'block'
      }
    })), /*#__PURE__*/React.createElement("nav", {
      style: {
        display: 'flex',
        gap: 'var(--space-1)',
        marginLeft: 'auto'
      },
      onMouseLeave: () => setOpen(null)
    }, ALPE_NAV.map(n => {
      const active = route === 'association' && n.label === "L'association" || route === 'bourse' && n.label === 'Nos actions' || route === 'adhesion' && n.label === 'Adhésion';
      return /*#__PURE__*/React.createElement("div", {
        key: n.label,
        style: {
          position: 'relative'
        },
        onMouseEnter: () => setOpen(n.items ? n.label : null)
      }, /*#__PURE__*/React.createElement("a", {
        href: "#",
        onClick: e => {
          e.preventDefault();
          if (n.label === 'Adhésion') go('adhesion');else if (n.label === "L'association") go('association');
        },
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '10px 16px',
          borderBottom: 0,
          borderRadius: 'var(--radius-pill)',
          fontFamily: 'var(--font-heading)',
          fontWeight: 700,
          fontSize: 'var(--text-sm)',
          color: active ? 'var(--brand-primary)' : 'var(--grey-700)',
          background: active ? 'var(--surface-brand-soft)' : 'transparent'
        }
      }, n.label, n.items ? /*#__PURE__*/React.createElement("i", {
        className: "fa-solid fa-chevron-down",
        "aria-hidden": "true",
        style: {
          fontSize: 9,
          opacity: 0.6
        }
      }) : null), open === n.label && n.items ? /*#__PURE__*/React.createElement("div", {
        style: {
          position: 'absolute',
          top: '100%',
          left: 0,
          minWidth: 260,
          background: 'var(--white)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border-subtle)',
          padding: 'var(--space-2)',
          display: 'flex',
          flexDirection: 'column'
        }
      }, n.items.map(it => /*#__PURE__*/React.createElement("a", {
        key: it,
        href: "#",
        onClick: e => {
          e.preventDefault();
          if (it === 'Bourse aux vêtements') go('bourse');
          if (it === 'Présentation') go('association');
          setOpen(null);
        },
        style: {
          padding: '9px 12px',
          borderRadius: 'var(--radius-sm)',
          borderBottom: 0,
          fontSize: 'var(--text-sm)',
          fontWeight: 600,
          color: 'var(--grey-700)'
        }
      }, it))) : null);
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        paddingLeft: 'var(--space-2)'
      }
    }, /*#__PURE__*/React.createElement(IconButton, {
      icon: "fa-solid fa-magnifying-glass",
      label: "Rechercher",
      size: "sm"
    })))));
  }
  function SiteFooter() {
    const col = {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-2)'
    };
    const title = {
      fontFamily: 'var(--font-heading)',
      fontWeight: 700,
      fontSize: 'var(--text-xs)',
      letterSpacing: 'var(--tracking-caps)',
      textTransform: 'uppercase',
      color: 'var(--yellow-500)',
      marginBottom: 'var(--space-2)'
    };
    const link = {
      color: 'rgba(255,255,255,.82)',
      borderBottom: 0,
      fontSize: 'var(--text-sm)'
    };
    return /*#__PURE__*/React.createElement("footer", {
      style: {
        background: 'var(--blue-800)',
        color: 'rgba(255,255,255,.82)',
        marginTop: 'var(--space-24)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        maxWidth: 'var(--container-max)',
        margin: '0 auto',
        padding: 'var(--space-16) var(--gutter) var(--space-8)',
        display: 'grid',
        gridTemplateColumns: '1.4fr 1fr 1fr 1.2fr',
        gap: 'var(--space-10)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: col
    }, /*#__PURE__*/React.createElement("img", {
      src: "../../assets/logo-alpe-v2-horizontal.png",
      alt: "ALPE",
      style: {
        height: 76,
        alignSelf: 'flex-start',
        background: 'var(--white)',
        borderRadius: 'var(--radius-md)',
        padding: 10
      }
    }), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 'var(--text-2xs)',
        lineHeight: 'var(--leading-normal)',
        margin: 'var(--space-3) 0 0',
        maxWidth: 260
      }
    }, "Association locale, ind\xE9pendante et apolitique de parents d'\xE9l\xE8ves de Plaisance du Touch. Association loi 1901 depuis 1987.")), /*#__PURE__*/React.createElement("div", {
      style: col
    }, /*#__PURE__*/React.createElement("div", {
      style: title
    }, "Acc\xE8s rapide"), ['A propos', 'Contact', 'Admin'].map(l => /*#__PURE__*/React.createElement("a", {
      key: l,
      href: "#",
      style: link
    }, l))), /*#__PURE__*/React.createElement("div", {
      style: col
    }, /*#__PURE__*/React.createElement("div", {
      style: title
    }, "L\xE9gal"), ['Politique de confidentialité', 'Mentions légales'].map(l => /*#__PURE__*/React.createElement("a", {
      key: l,
      href: "#",
      style: link
    }, l))), /*#__PURE__*/React.createElement("div", {
      style: col
    }, /*#__PURE__*/React.createElement("div", {
      style: title
    }, "Restons en contact"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
        alignItems: 'flex-start'
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      size: "sm"
    }, "Adh\xE9rez"), /*#__PURE__*/React.createElement(Button, {
      variant: "inverse",
      size: "sm"
    }, "Contactez-nous")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 'var(--space-2)',
        marginTop: 'var(--space-4)'
      }
    }, /*#__PURE__*/React.createElement(IconButton, {
      icon: "fa-brands fa-facebook-f",
      label: "Facebook",
      style: {
        color: '#fff'
      }
    }), /*#__PURE__*/React.createElement(IconButton, {
      icon: "fa-brands fa-instagram",
      label: "Instagram",
      style: {
        color: '#fff'
      }
    }), /*#__PURE__*/React.createElement(IconButton, {
      icon: "fa-brands fa-linkedin-in",
      label: "LinkedIn",
      style: {
        color: '#fff'
      }
    })))), /*#__PURE__*/React.createElement("div", {
      style: {
        borderTop: '1px solid rgba(255,255,255,.14)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        maxWidth: 'var(--container-max)',
        margin: '0 auto',
        padding: 'var(--space-5) var(--gutter)',
        fontSize: 'var(--text-2xs)'
      }
    }, "\xA9 2022. Site web par Julien DEL RIO.")));
  }
  function PageHero({
    title,
    breadcrumb
  }) {
    const {
      Breadcrumb
    } = window.ALPEDesignSystem_2d31df;
    return /*#__PURE__*/React.createElement("div", {
      style: {
        background: 'var(--surface-muted)',
        borderBottom: '1px solid var(--border-subtle)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        maxWidth: 'var(--container-max)',
        margin: '0 auto',
        padding: 'var(--space-12) var(--gutter)'
      }
    }, /*#__PURE__*/React.createElement("h1", {
      style: {
        margin: 0,
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-4xl)',
        color: 'var(--text-heading)'
      }
    }, title), breadcrumb ? /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 'var(--space-3)'
      }
    }, /*#__PURE__*/React.createElement(Breadcrumb, {
      items: breadcrumb
    })) : null));
  }
  const Container = ({
    children,
    narrow = false,
    style
  }) => /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: narrow ? 'var(--container-narrow)' : 'var(--container-max)',
      margin: '0 auto',
      padding: '0 var(--gutter)',
      ...style
    }
  }, children);
  Object.assign(window, {
    SiteHeader,
    SiteFooter,
    PageHero,
    Container,
    ALPE_NAV
  });
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/SiteChrome.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.EventCard = __ds_scope.EventCard;

__ds_ns.SchoolChip = __ds_scope.SchoolChip;

__ds_ns.SectionTitle = __ds_scope.SectionTitle;

__ds_ns.StatTile = __ds_scope.StatTile;

__ds_ns.Swoosh = __ds_scope.Swoosh;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.Callout = __ds_scope.Callout;

__ds_ns.Dialog = __ds_scope.Dialog;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.Tooltip = __ds_scope.Tooltip;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Radio = __ds_scope.Radio;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Breadcrumb = __ds_scope.Breadcrumb;

__ds_ns.Tabs = __ds_scope.Tabs;

})();
