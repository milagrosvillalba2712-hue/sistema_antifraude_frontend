import logoReal from '../../assets/regula_icon.png';

interface RegulaIconProps {
  className?: string;
  size?: number;
}

export const RegulaIcon = ({ className = '', size }: RegulaIconProps) => (
  <div
    className={`shrink-0 overflow-hidden flex items-center justify-center ${className}`}
    style={size ? { width: size, height: size } : undefined}
  >
    <img
      src={logoReal}
      alt="Regula Logo"
      className="w-full h-full object-contain"
      draggable={false}
    />
  </div>
);
