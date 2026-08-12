import { Modal as AntModal } from 'antd';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '5xl' | '6xl' | 'default';
  className?: string;
  bodyClassName?: string;
}

const widthBySize: Record<NonNullable<ModalProps['size']>, number | string> = {
  sm: 420,
  md: 520,
  lg: 640,
  xl: 760,
  '2xl': 860,
  '5xl': 1080,
  '6xl': 1180,
  default: 1080,
};

export default function Modal({ isOpen, onClose, title, children, size = 'default', className, bodyClassName }: ModalProps) {
  return (
    <AntModal
      open={isOpen}
      onCancel={onClose}
      title={title || ' '}
      footer={null}
      width={widthBySize[size]}
      centered
      destroyOnHidden
      className={className}
      styles={{
        body: {
          maxHeight: 'calc(92vh - 108px)',
          overflowY: 'auto',
          padding: 0,
        },
      }}
    >
      <div className={bodyClassName} style={{ padding: 24 }}>{children}</div>
    </AntModal>
  );
}
