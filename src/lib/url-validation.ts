export function stripTrailingSlash(s: string): string {
  let i = s.length
  while (i > 0 && s[i - 1] === '/') i--
  return s.slice(0, i)
}
