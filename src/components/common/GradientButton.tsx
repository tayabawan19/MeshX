import React from 'react';
import { BoldButton } from './BoldButton';

export const GradientButton: React.FC<any> = ({
  title,
  onPress,
  disabled,
  loading,
  style,
  textStyle,
  icon,
  size = 'md',
  ...props
}) => {
  return (
    <BoldButton
      title={title}
      onPress={onPress}
      disabled={disabled}
      loading={loading}
      style={style}
      textStyle={textStyle}
      icon={icon}
      size={size}
      variant="primary"
      {...props}
    />
  );
};
