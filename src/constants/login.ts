/** /login/qr/check 返回的 code */
export const QrCheckCode = {
  Expired: 800,
  Waiting: 801,
  Confirming: 802,
  Authorized: 803,
  /** 触发网易云风控，需要行为验证 */
  RiskControl: 8821,
} as const

/** 网易云「需要登录」 */
export const NEED_LOGIN_CODE = 301
