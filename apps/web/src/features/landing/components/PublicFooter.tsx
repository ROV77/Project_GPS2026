const FOOTER_LINKS = [
  { label: 'Ayuda', href: '#' },
  { label: 'Contacto', href: '#' },
  { label: 'Términos', href: '#' },
] as const;

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-400/40 bg-slate-200/50 px-5 py-8 text-center backdrop-blur-sm">
      <p className="text-sm text-slate-500">
        © {new Date().getFullYear()} CaseritApp — Comercio local, cerca de ti.
      </p>
      <nav className="mt-3 flex items-center justify-center gap-4 text-xs text-slate-400">
        {FOOTER_LINKS.map(({ label, href }) => (
          <a key={label} href={href} className="transition hover:text-slate-600">
            {label}
          </a>
        ))}
      </nav>
    </footer>
  );
}
