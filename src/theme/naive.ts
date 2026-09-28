import type { GlobalThemeOverrides } from 'naive-ui'

import { brandColors } from './tokens'

export const naiveThemeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: brandColors.primary,
    primaryColorHover: brandColors.primaryHover,
    primaryColorPressed: brandColors.primaryPressed,
    primaryColorSuppl: brandColors.primaryHover,
    borderRadius: '8px',
  },
}
