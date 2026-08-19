import { TextStyle, Platform } from 'react-native';

export const typography = {
  display: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '900' as TextStyle['fontWeight'],
    letterSpacing: -0.8,
  },
  heading1: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800' as TextStyle['fontWeight'],
    letterSpacing: -0.5,
  },
  heading2: {
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '800' as TextStyle['fontWeight'],
    letterSpacing: -0.3,
  },
  subheading: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700' as TextStyle['fontWeight'],
    letterSpacing: -0.2,
  },
  body: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '500' as TextStyle['fontWeight'],
  },
  bodyBold: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '700' as TextStyle['fontWeight'],
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600' as TextStyle['fontWeight'],
  },
  timestamp: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700' as TextStyle['fontWeight'],
  },
  badge: {
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '900' as TextStyle['fontWeight'],
    letterSpacing: -0.2,
  },
};
