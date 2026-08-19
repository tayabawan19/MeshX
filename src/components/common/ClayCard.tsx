import React from 'react';
import { BoldCard } from './BoldCard';

export const ClayCard: React.FC<any> = ({ children, style, onPress, ...props }) => {
  return (
    <BoldCard style={style} onPress={onPress} {...props}>
      {children}
    </BoldCard>
  );
};
