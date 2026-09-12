import { useEffect, useState } from 'react'

/**
 * A real viewport check (not a CSS breakpoint) for screens whose mobile and
 * desktop Figma layouts differ enough that they can't just be two CSS-toggled
 * variants of the same markup — e.g. a Radix dialog mounted "hidden" still
 * stays `open` and makes the rest of the page inert, and two variants sharing
 * the same labels (a coupon input, a "Total" row) collide under
 * accessibility-tree queries even when only one is visually shown. Mounting
 * only one tree at a time avoids both problems.
 */
export function useIsDesktopViewport(query = '(min-width: 1024px)') {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window === 'undefined' ? true : window.matchMedia(query).matches,
  )
  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setIsDesktop(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])
  return isDesktop
}
