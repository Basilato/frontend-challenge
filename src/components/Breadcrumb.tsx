import { Link } from '@tanstack/react-router'
import { Fragment } from 'react'

type Crumb = { label: string; to?: '/' | '/mercado' }

/** Figma's breadcrumb is one plain bold text run — no distinct link styling, no
 *  separators as real characters between differently-styled segments. Matched here
 *  as literal "Início / Mercado / X" text, with real navigation on the linkable crumbs. */
export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Trilha de navegação" className="text-[15px] font-bold text-fg">
      {items.map((item, i) => (
        <Fragment key={item.label}>
          {i > 0 && <span aria-hidden="true"> / </span>}
          {item.to ? (
            <Link to={item.to} className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {item.label}
            </Link>
          ) : (
            <span aria-current={i === items.length - 1 ? 'page' : undefined}>{item.label}</span>
          )}
        </Fragment>
      ))}
    </nav>
  )
}
