import { useMemo, useRef, useState } from 'react'
import { fetchJobs, shortDate, titleCase } from '../../api/index.js'
import { useAsync } from '../Account/accountUtils.js'
import { Bone, PageError } from '../../components/ui/PageState.jsx'
import teamPhoto from '../../assets/pages/careers/team.jpg'
import iconHiring from '../../assets/pages/careers/icon-hiring.svg'
import iconOpen from '../../assets/pages/careers/icon-open.svg'
import iconArrow from '../../assets/pages/careers/icon-arrow.svg'
import iconInternship from '../../assets/pages/careers/icon-internship.svg'
import iconClock from '../../assets/pages/careers/icon-clock.svg'
import iconMoney from '../../assets/pages/careers/icon-money.svg'
import benefitHealth from '../../assets/pages/careers/benefit-health.svg'
import benefitRemote from '../../assets/pages/careers/benefit-remote.svg'
import benefitLearning from '../../assets/pages/careers/benefit-learning.svg'
import benefitEsop from '../../assets/pages/careers/benefit-esop.svg'
import benefitRetreats from '../../assets/pages/careers/benefit-retreats.svg'
import benefitConsultations from '../../assets/pages/careers/benefit-consultations.svg'
import { JoinAstrologerModal, ApplyModal, ApplicationSentModal } from './CareersModals'
import './Careers.css'

const BENEFITS = [
  { icon: benefitHealth, title: 'Health Insurance', text: '₹5L cover for you + family' },
  { icon: benefitRemote, title: 'Remote Friendly', text: 'Flexible work from anywhere' },
  { icon: benefitLearning, title: 'Learning Budget', text: '₹50,000/yr for courses' },
  { icon: benefitEsop, title: 'ESOP', text: 'Equity for all full-time hires' },
  { icon: benefitRetreats, title: 'Team Retreats', text: 'Quarterly offsite events' },
  { icon: benefitConsultations, title: 'Free Consultations', text: 'Unlimited Shree Astro access' },
]

const INTERNSHIP = 'internship'

const ASTROLOGER_ROLE = { kind: 'astrologer', title: 'Astrologer Application', department: 'Astrology' }
const INTERNSHIP_ROLE = { kind: INTERNSHIP, title: 'Internship Program', department: 'Internship' }

const TYPE_LABEL = { 'full-time': 'Full-time', 'part-time': 'Part-time', contract: 'Contract', internship: 'Internship' }
const jobType = (type) => TYPE_LABEL[type] || titleCase(type)
const deptLabel = (job, departments) =>
  departments.find((d) => d.key === job.department)?.label || titleCase(job.department)

/** A job posting → the role the apply modal shows. */
const roleOf = (job, departments) => ({
  kind: job.department === INTERNSHIP ? INTERNSHIP : 'job',
  jobId: job.id,
  title: job.title,
  department: deptLabel(job, departments),
})

function JobSkeleton() {
  return (
    <li className="careers-page__job" aria-hidden="true">
      <div className="careers-page__job-main">
        <Bone style={{ width: '45%', height: 18 }} />
        <Bone style={{ width: '60%', height: 12, marginTop: 12 }} />
        <Bone style={{ width: '70%', height: 12, marginTop: 10 }} />
      </div>
      <div className="careers-page__job-side">
        <Bone style={{ width: 110, height: 38, borderRadius: 999 }} />
      </div>
    </li>
  )
}

export default function Careers() {
  const [filter, setFilter] = useState('all')
  const [modal, setModal] = useState(null)
  const positionsRef = useRef(null)
  const { data, loading, error, reload } = useAsync(() => fetchJobs({ limit: 100 }))

  const busy = loading && !data
  const items = data?.items ?? []
  const departments = useMemo(
    () => (data?.departments ?? []).filter((d) => d.key !== INTERNSHIP && Number(d.count) > 0),
    [data],
  )
  const openings = items.filter((j) => j.department !== INTERNSHIP)
  const internships = items.filter((j) => j.department === INTERNSHIP)
  const jobs = filter === 'all' ? openings : openings.filter((j) => j.department === filter)
  const total = Number(data?.total) || items.length

  const closeModal = () => setModal(null)
  const openApply = (role) => setModal({ type: 'apply', role })

  const scrollToPositions = () => {
    positionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <main className="careers-page">
      <section className="careers-page__hero">
        <div className="careers-page__hero-inner">
          <div className="careers-page__hero-text">
            <span className="careers-page__pill">
              <img src={iconHiring} alt="" />
              We&apos;re Hiring
            </span>
            <h1 className="careers-page__title">
              Build the Future
              <br />
              of <span className="careers-page__title-accent">Vedic Wisdom</span>
            </h1>
            <p className="careers-page__lead">
              Join a team obsessed with democratising access to India&apos;s ancient knowledge
              systems. Work on products used by lakhs of users daily.
            </p>
            <div className="careers-page__hero-actions">
              <button type="button" className="careers-page__btn careers-page__btn--primary" onClick={scrollToPositions}>
                View Open Roles
              </button>
              <button
                type="button"
                className="careers-page__btn careers-page__btn--ghost"
                onClick={() => setModal({ type: 'join' })}
              >
                Join as Astrologer
              </button>
            </div>
          </div>
          <div className="careers-page__hero-media">
            <div className="careers-page__hero-photo">
              <img src={teamPhoto} alt="Team at Shree Astro" />
            </div>
            <div className="careers-page__hero-badge">
              <span className="careers-page__hero-badge-icon">
                <img src={iconOpen} alt="" />
              </span>
              <span className="careers-page__hero-badge-text">
                <strong>{busy ? '…' : `${total} Open`}</strong>
                <span>Positions available</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="careers-page__body">
        <section className="careers-page__why">
          <h2 className="careers-page__section-title careers-page__section-title--center">Why Join Us</h2>
          <ul className="careers-page__benefits">
            {BENEFITS.map((b) => (
              <li key={b.title} className="careers-page__benefit">
                <span className="careers-page__benefit-icon">
                  <img src={b.icon} alt="" />
                </span>
                <h3 className="careers-page__benefit-title">{b.title}</h3>
                <p className="careers-page__benefit-text">{b.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="careers-page__positions" ref={positionsRef} id="open-positions">
          <div className="careers-page__positions-head">
            <h2 className="careers-page__section-title">Open Positions</h2>
            {departments.length > 0 && (
              <div className="careers-page__filters" role="group" aria-label="Filter by department">
                {[{ key: 'all', label: 'All' }, ...departments].map((d) => (
                  <button
                    key={d.key}
                    type="button"
                    className={`careers-page__chip${filter === d.key ? ' careers-page__chip--active' : ''}`}
                    aria-pressed={filter === d.key}
                    onClick={() => setFilter(d.key)}
                  >
                    {d.label || titleCase(d.key)}
                  </button>
                ))}
              </div>
            )}
          </div>
          {error && !data ? (
            <PageError message={error} onRetry={reload} />
          ) : (
            <ul className="careers-page__jobs">
              {busy ? (
                <>
                  <JobSkeleton />
                  <JobSkeleton />
                  <JobSkeleton />
                </>
              ) : (
                jobs.map((job) => (
                  <li key={job.id} className="careers-page__job">
                    <div className="careers-page__job-main">
                      <div className="careers-page__job-head">
                        <h3 className="careers-page__job-title">{job.title}</h3>
                        <span className="careers-page__job-dept">{deptLabel(job, departments)}</span>
                      </div>
                      <ul className="careers-page__job-meta">
                        {[job.location, jobType(job.type), job.experience].filter(Boolean).map((m) => (
                          <li key={m}>{m}</li>
                        ))}
                      </ul>
                      {Array.isArray(job.tags) && job.tags.length > 0 && (
                        <ul className="careers-page__job-tags">
                          {job.tags.map((t) => (
                            <li key={t}>{t}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="careers-page__job-side">
                      <span className="careers-page__job-posted">
                        {job.postedAt ? `Posted ${shortDate(job.postedAt)}` : ''}
                      </span>
                      <button
                        type="button"
                        className="careers-page__job-apply"
                        onClick={() => openApply(roleOf(job, departments))}
                      >
                        Apply Now
                      </button>
                      <img className="careers-page__job-arrow" src={iconArrow} alt="" />
                    </div>
                  </li>
                ))
              )}
              {!busy && jobs.length === 0 && (
                <li className="careers-page__jobs-empty">
                  {openings.length === 0
                    ? 'No open positions right now — check back soon, or join us as an astrologer.'
                    : 'No open positions in this team right now.'}
                </li>
              )}
            </ul>
          )}
        </section>

        <section className="careers-page__internship">
          <div className="careers-page__internship-head">
            <div className="careers-page__internship-text">
              <span className="careers-page__pill careers-page__pill--solid">
                <img src={iconInternship} alt="" />
                Internship Program
              </span>
              <h2 className="careers-page__section-title">Learn. Build. Ship.</h2>
              <p className="careers-page__internship-lead">
                Our 3–6 month internship program is a launchpad for passionate students and
                early-career builders who want to work on real products at scale.
              </p>
            </div>
            <button
              type="button"
              className="careers-page__btn careers-page__btn--primary careers-page__btn--sm"
              onClick={() => openApply(INTERNSHIP_ROLE)}
            >
              Apply for Internship
            </button>
          </div>
          {busy ? (
            <ul className="careers-page__interns" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => (
                <li key={i} className="careers-page__intern">
                  <Bone style={{ width: '70%', height: 16 }} />
                  <Bone style={{ width: '40%', height: 12, marginTop: 12 }} />
                  <Bone style={{ width: '50%', height: 12, marginTop: 8 }} />
                </li>
              ))}
            </ul>
          ) : internships.length > 0 ? (
            <ul className="careers-page__interns">
              {internships.map((i) => (
                <li key={i.id} className="careers-page__intern">
                  <h3 className="careers-page__intern-title">{i.title}</h3>
                  {(i.duration || i.experience || i.location) && (
                    <span className="careers-page__intern-row">
                      <img src={iconClock} alt="" />
                      {i.duration || i.experience || i.location}
                    </span>
                  )}
                  {(i.stipend || i.salary) && (
                    <span className="careers-page__intern-row careers-page__intern-row--stipend">
                      <img src={iconMoney} alt="" />
                      {i.stipend || i.salary}
                    </span>
                  )}
                  {Array.isArray(i.tags) && i.tags.length > 0 && (
                    <span className="careers-page__intern-skills">{i.tags.join(', ')}</span>
                  )}
                  <button
                    type="button"
                    className="careers-page__intern-apply"
                    onClick={() => openApply(roleOf(i, departments))}
                  >
                    Apply →
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      </div>

      {modal?.type === 'join' && (
        <JoinAstrologerModal onClose={closeModal} onApply={() => openApply(ASTROLOGER_ROLE)} />
      )}
      {modal?.type === 'apply' && (
        <ApplyModal
          role={modal.role}
          onClose={closeModal}
          onSubmit={(application) => setModal({ type: 'sent', role: modal.role, application })}
        />
      )}
      {modal?.type === 'sent' && (
        <ApplicationSentModal role={modal.role} application={modal.application} onClose={closeModal} />
      )}
    </main>
  )
}
