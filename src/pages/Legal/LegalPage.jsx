import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import './LegalPage.css'

function scrollOffset() {
  const header = document.querySelector('.header')
  return (header ? header.offsetHeight : 0) + 24
}

function Block({ block }) {
  if (typeof block === 'string') return <p className="legal-page__para">{block}</p>
  if (block.bullets) {
    return (
      <ul className="legal-page__list">
        {block.bullets.map((item) => (
          <li key={item} className="legal-page__item">
            {item}
          </li>
        ))}
      </ul>
    )
  }
  if (block.numbered) {
    return (
      <ol className="legal-page__list legal-page__list--numbered">
        {block.numbered.map((item) => (
          <li key={item} className="legal-page__item">
            {item}
          </li>
        ))}
      </ol>
    )
  }
  if (block.lines) {
    return (
      <p className="legal-page__para">
        {block.lines.map((line, i) => (
          <span key={line} className="legal-page__line">
            {i > 0 && <br />}
            {line}
          </span>
        ))}
      </p>
    )
  }
  return null
}

function LegalDoc({ doc }) {
  const [activeId, setActiveId] = useState(doc.sections[0]?.id)
  const navRef = useRef(null)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [doc])

  useEffect(() => {
    const nodes = doc.sections.map((s) => document.getElementById(s.id)).filter(Boolean)
    if (nodes.length === 0 || typeof IntersectionObserver === 'undefined') return undefined

    const offset = scrollOffset()
    const visible = new Map()
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) visible.set(entry.target.id, entry.boundingClientRect.top)
          else visible.delete(entry.target.id)
        })
        if (visible.size === 0) return
        const topMost = [...visible.entries()].sort((a, b) => a[1] - b[1])[0]
        setActiveId(topMost[0])
      },
      { rootMargin: `-${offset}px 0px -55% 0px`, threshold: 0 },
    )
    nodes.forEach((n) => observer.observe(n))
    return () => observer.disconnect()
  }, [doc])

  useEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const active = nav.querySelector('.legal-page__nav-item--active')
    if (!active || window.innerWidth > 1024) return
    const left = active.offsetLeft - (nav.clientWidth - active.offsetWidth) / 2
    nav.scrollTo({ left, behavior: 'smooth' })
  }, [activeId])

  const jump = (id) => (event) => {
    event.preventDefault()
    const target = document.getElementById(id)
    if (!target) return
    const top = target.getBoundingClientRect().top + window.scrollY - scrollOffset()
    window.scrollTo({ top, behavior: 'smooth' })
    setActiveId(id)
    if (window.history?.replaceState) window.history.replaceState(null, '', `#${id}`)
  }

  const helpTone = doc.help?.tone ? ` legal-page__help--${doc.help.tone}` : ''

  return (
    <section className="legal-page">
      <div className="legal-page__inner">
        <aside className="legal-page__sidebar">
          <div className="legal-page__contents">
            <p className="legal-page__contents-label">CONTENTS</p>
            <nav className="legal-page__nav" aria-label={`${doc.title} sections`} ref={navRef}>
              {doc.sections.map((s) => {
                const isActive = s.id === activeId
                return (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    onClick={jump(s.id)}
                    aria-current={isActive ? 'location' : undefined}
                    className={`legal-page__nav-item${isActive ? ' legal-page__nav-item--active' : ''}`}
                  >
                    {s.heading}
                  </a>
                )
              })}
            </nav>
          </div>

          {doc.help && (
            <div className={`legal-page__help${helpTone}`}>
              <p className="legal-page__help-title">{doc.help.title}</p>
              <p className="legal-page__help-text">{doc.help.text}</p>
              <Link to={doc.help.to} className="legal-page__help-btn">
                {doc.help.buttonLabel}
              </Link>
            </div>
          )}
        </aside>

        <article className="legal-page__content">
          <header className="legal-page__header">
            <span className="legal-page__tag">{doc.tag}</span>
            <h1 className="legal-page__title">{doc.title}</h1>
            <p className="legal-page__effective">{doc.effective}</p>
            {doc.intro && <p className="legal-page__intro">{doc.intro}</p>}
          </header>

          {doc.sections.map((s) => (
            <section key={s.id} id={s.id} className="legal-page__section">
              <h2 className="legal-page__heading">{s.heading}</h2>
              <div className="legal-page__body">
                {s.content.map((block, i) => (
                  <Block key={typeof block === 'string' ? block : `${s.id}-${i}`} block={block} />
                ))}
              </div>
            </section>
          ))}
        </article>
      </div>
    </section>
  )
}

export default function LegalPage({ doc }) {
  return <LegalDoc key={doc.slug} doc={doc} />
}
