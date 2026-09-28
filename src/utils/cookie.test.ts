import { describe, expect, it } from 'vitest'

import { compactCookie } from './cookie'

describe('utils/cookie', () => {
  it('只保留接口需要的字段，去掉属性', () => {
    const raw =
      'MUSIC_R_T=1; Max-Age=2147483647; Path=/api/clientlog; HTTPOnly;MUSIC_U=abc==; Max-Age=15552000; Expires=Sat, 1 Jan 2027 00:00:00 GMT; Path=/; HTTPOnly;__csrf=xyz; Path=/;NMTID=00O; Path=/'
    expect(compactCookie(raw)).toBe('MUSIC_U=abc==; __csrf=xyz; NMTID=00O')
  })

  it('空值与无效片段被忽略', () => {
    expect(compactCookie('MUSIC_U=; foo; =bar')).toBe('')
    expect(compactCookie('')).toBe('')
  })
})
