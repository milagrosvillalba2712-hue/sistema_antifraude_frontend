import logoReal from '../../assets/regula_icon.png';

interface RegulaIconProps {
  className?: string;
  size?: number;
}

export const RegulaIcon = ({ className = '', size }: RegulaIconProps) => (
  <div
    className={className}
    style={{ width: size || '100%', height: size || '100%', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
  >
    <img
      src={logoReal}
      alt="Regula Logo"
      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      draggable={false}
    />
  </div>
);
