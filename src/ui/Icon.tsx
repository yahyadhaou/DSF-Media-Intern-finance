import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export function Icon({ name, size = 22, color }: { name: IconName; size?: number; color: ColorValue }) {
  // React Navigation hands over a generic ColorValue; Ionicons accepts the same values at runtime.
  return <Ionicons name={name} size={size} color={color as ComponentProps<typeof Ionicons>['color']} />;
}
