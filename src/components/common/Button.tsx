import { forwardRef } from 'react';
import { Button as AntButton } from 'antd';
import type { ButtonProps as AntButtonProps } from 'antd';

interface ButtonProps extends Omit<AntButtonProps, 'type' | 'size' | 'variant'> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

const sizeMap = {
  sm: 'small',
  md: 'middle',
  lg: 'large',
} as const;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, disabled, children, type, ...props }, ref) => (
    <AntButton
      ref={ref}
      htmlType={type === 'submit' || type === 'reset' || type === 'button' ? type : undefined}
      type={variant === 'primary' || variant === 'danger' ? 'primary' : variant === 'ghost' ? 'text' : 'default'}
      danger={variant === 'danger'}
      size={sizeMap[size]}
      loading={loading}
      disabled={disabled || loading}
      {...props}
    >
      {children}
    </AntButton>
  )
);

Button.displayName = 'Button';
