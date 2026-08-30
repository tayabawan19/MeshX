import { TextStyle } from 'react-native';

export const typography = {
  display: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700' as TextStyle['fontWeight'],
    letterSpacing: -0.4,
  },
  heading1: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700' as TextStyle['fontWeight'],
    letterSpacing: -0.3,
  },
  heading2: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700' as TextStyle['fontWeight'],
    letterSpacing: -0.2,
  },
  subheading: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600' as TextStyle['fontWeight'],
    letterSpacing: -0.1,
  },
  body: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400' as TextStyle['fontWeight'],
  },
  bodyBold: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600' as TextStyle['fontWeight'],
  },
  caption: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '500' as TextStyle['fontWeight'],
  },
  timestamp: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500' as TextStyle['fontWeight'],
  },
  badge: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '700' as TextStyle['fontWeight'],
  },
};
