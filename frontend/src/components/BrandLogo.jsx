const variantes = {
  color: '/brand/kora-logo.svg',
  blanco: '/brand/kora-logo-blanco.svg',
  negro: '/brand/kora-logo-negro.svg',
};

export default function BrandLogo({
  variante = 'color',
  className = '',
  alt = 'Kora',
  ...props
}) {
  const src = variantes[variante] || variantes.color;

  return <img src={src} alt={alt} className={className} {...props} />;
}
