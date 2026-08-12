import { TextStyle } from 'react-native';

export const typography = {
  display: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700' as TextStyle['fontWeight'],
    letterSpacing: -0.5,
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
    fontWeight: '600' as TextStyle['fontWeight'],
    letterSpacing: -0.2,
  },
  subheading: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600' as TextStyle['fontWeight'],
  },
  body: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '400' as TextStyle['fontWeight'],
  },
  bodyBold: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600' as TextStyle['fontWeight'],
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400' as TextStyle['fontWeight'],
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
