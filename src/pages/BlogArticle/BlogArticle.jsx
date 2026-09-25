import { Link, useParams } from 'react-router-dom'
import { fetchArticle, shortDate } from '../../api/index.js'
import { initialOf, mediaUrl, useAsync } from '../Account/accountUtils.js'
import { Bone, PageEmpty, PageError } from '../../components/ui/PageState.jsx'
import './BlogArticle.css'

const readTime = (minutes) => `${Math.max(1, Number(minutes) || 1)} min read`

/**
 * Plain-text body → blocks. Paragraphs are separated by blank lines;
 * a line starting with `#`s becomes a heading.
 */
function blocksOf(body) {
  return String(body || '')
    .replace(/\r\n?/g, '\n')
    .replace(/<\s*(h[1-6])[^>]*>/gi, '\n\n## ')
    .replace(/<\s*\/\s*(p|h[1-6]|div|li)\s*>/gi, '\n\n')
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const heading = /^#{1,6}\s+(.+)$/.exec(chunk)
      if (heading) return { type: 'h2', text: heading[1].trim() }
      return { type: 'p', text: chunk }
    })
}

function ArticleSkeleton() {
  return (
    <section className="blog-article" aria-busy="true">
      <div className="blog-article__inner">
        <Link to="/blog" className="blog-article__back">
          ← Back to Blog
        </Link>
        <Bone style={{ width: 120, height: 24, marginTop: 24, borderRadius: 999 }} />
        <Bone style={{ width: '90%', height: 36, marginTop: 20 }} />
        <Bone style={{ width: '60%', height: 36, marginTop: 10 }} />
        <Bone style={{ width: 220, height: 16, marginTop: 24 }} />
        <div className="blog-article__hero">
          <Bone style={{ height: '100%', borderRadius: 0 }} />
        </div>
        <div className="blog-article__body">
          <Bone style={{ width: '100%', height: 14 }} />
          <Bone style={{ width: '95%', height: 14, marginTop: 10 }} />
          <Bone style={{ width: '85%', height: 14, marginTop: 10 }} />
        </div>
      </div>
    </section>
  )
}

export default function BlogArticle() {
  const { slug } = useParams()
  const { data: post, loading, error, reload } = useAsync(() => fetchArticle(slug), [slug])

  if (loading && !post) return <ArticleSkeleton />

  if (!post) {
    const missing = /not found/i.test(error || '')
    return (
      <section className="blog-article">
        <div className="blog-article__inner">
          <Link to="/blog" className="blog-article__back">
            ← Back to Blog
          </Link>
          <div className="blog-article__state">
            {missing ? (
              <PageEmpty
                title="Article not found"
                text="This article may have been unpublished or the link is wrong."
                action={
                  <Link to="/blog" className="ui-state__btn">
                    Browse the Blog
                  </Link>
                }
              />
            ) : (
              <PageError message={error} onRetry={reload} />
            )}
          </div>
        </div>
      </section>
    )
  }

  const blocks = blocksOf(post.body)
  const cover = mediaUrl(post.coverImageUrl)

  return (
    <section className="blog-article">
      <div className="blog-article__inner">
        <Link to="/blog" className="blog-article__back">
          ← Back to Blog
        </Link>

        {post.category && (
          <div className="blog-article__tag-row">
            <span className="blog-article__tag">{post.category}</span>
          </div>
        )}

        <h1 className="blog-article__title">{post.title}</h1>

        <div className="blog-article__author">
          <span className="blog-article__avatar blog-article__avatar--fallback" aria-hidden="true">
            {initialOf(post.author, 'S')}
          </span>
          <div>
            <p className="blog-article__name">{post.author || 'Shree Astro'}</p>
            <p className="blog-article__meta">
              {shortDate(post.publishedAt)} · {readTime(post.readMinutes)}
            </p>
          </div>
        </div>

        {cover && (
          <div className="blog-article__hero">
            <img src={cover} alt={post.title} className="blog-article__hero-img" />
          </div>
        )}

        <div className="blog-article__body">
          {blocks.map((block, index) =>
            block.type === 'h2' ? (
              <h2 key={index} className="blog-article__heading">
                {block.text}
              </h2>
            ) : (
              <p key={index} className="blog-article__paragraph">
                {block.text}
              </p>
            ),
          )}
        </div>

        {Array.isArray(post.tags) && post.tags.length > 0 && (
          <ul className="blog-article__tags">
            {post.tags.map((tag) => (
              <li key={tag} className="blog-article__tag-chip">
                #{tag}
              </li>
            ))}
          </ul>
        )}

        <div className="blog-article__cta">
          <p className="blog-article__cta-text">Want a personal reading based on your birth chart?</p>
          <Link to="/astrologers" className="blog-article__cta-btn">
            Talk to an Astrologer
          </Link>
        </div>
      </div>
    </section>
  )
}
