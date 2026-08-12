import { MoreOutlined } from '@ant-design/icons';
import { Button, Dropdown } from 'antd';
import type { MenuProps } from 'antd';

export interface ActionDropdownItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

interface ActionDropdownProps {
  items: ActionDropdownItem[];
}

export default function ActionDropdown({ items }: ActionDropdownProps) {
  const menuItems: MenuProps['items'] = items.map((item) => ({
    key: item.key,
    label: item.label,
    icon: item.icon,
    danger: item.danger,
    disabled: item.disabled,
    onClick: item.onClick,
  }));

  return (
    <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
      <Button icon={<MoreOutlined />} aria-label="Acciones" />
    </Dropdown>
  );
}
