# Shree Astro – Web

Frontend for the Shree Astro website, built from the Figma design with Vite + React 19 (plain JavaScript, plain CSS). The user-facing features talk to the existing Express backend in `../backend` (same API the `user_app` uses); modules the backend does not have yet (puja booking, store/cart/orders, blog, offers/loyalty/referral, careers) are still static.

## Run

```bash
npm install
cp .env.example .env         # VITE_API_URL=http://localhost:5000/api/v1 (the backend)
npm run dev                  # http://localhost:5173
npm run build                # production build in dist/
npm run preview              # serve the production build
npm run lint                 # oxlint
```

Start the backend separately (`cd ../backend && npm run dev`). It needs MongoDB + Redis (see `../backend/.env.example`); its `CORS_ORIGINS` must include the site origin when it is not `*`.

## Backend integration

- `src/api/client.js` — `fetch` wrapper: base URL from `VITE_API_URL`, `Authorization: Bearer` from the stored session, 15s timeout, `ApiError { status, code, fields, retryAfterSeconds, details }`, one silent `POST /auth/refresh` on `token_expired` then retry; any other 401 clears the session.
- `src/api/session.js` — `localStorage['shreeastro-session'] = { accessToken, refreshToken, user }` with change listeners.
- `src/api/socket.js` — Socket.IO client (`auth: { token }`, websocket only) + `subscribeToConsultation` / `subscribeToChatRequest` / `subscribeToNotifications`, mirroring `user_app/src/services/socket.ts`.
- `src/api/index.js` — every endpoint wrapper (auth, users, astrologers, chats, wallet, kundli, horoscope, notifications, support) plus formatting helpers. Pages import from here only.
- `src/context/AuthContext.jsx` — `useAuth()` → `{ session, authUser, user (GET /users/me), loadingUser, isLoggedIn, refreshUser, updateProfile, logout }`; connects the socket while signed in.

| Feature | Backend |
| --- | --- |
| Login / sign-up (`/login`) | `POST /auth/login/otp/request` → `verify`; unknown numbers go to birth details → `POST /auth/register` (multipart). Google/Apple buttons wait for provider SDKs. |
| Astrologer directory, profile, homepage cards | `GET /astrologers` (filters, sort, paging — public via `optionalAuthenticate`), `GET /astrologers/:id`, `/reviews`, favourites |
| Intake → chat/call (`/intake/:id`, `/chat/:chatId`, `/call/:chatId`) | `POST /chats/precheck` (rate, balance and the package quotes), `POST /chats` (+ `billing` for a package), socket `chat:accepted|rejected|missed`, `chat:join`, `message:send/new`, `chat:tick`, `chat:low_balance`, `chat:package_warning|package_ended|package_extended|per_minute_started`, `session:ended`; `POST /chats/:id/end`, `/rate`, `/continue`; top-up resumes a paused session. Calls bill per minute but the web has no audio transport. Live chat shows animated typing dots while the astrologer types (`chat:typing`) and sends its own typing pings; the first message after "Consultation started" is the astrologer's automatic greeting posted by the backend on accept. |
| Consultation packages (intake picker, live countdown, "package time is over" modal) | Same flow as user_app: `src/data/consultPackages.js` + `ConsultationTypePicker` + `ContinueConsultationModal`. Per-minute is the default; a 3/5/10/20-min package is priced server-side (admin discounts applied) and charged once on accept. When it runs out the session pauses and the seeker picks per-minute or another package (`POST /chats/:id/continue`); `price_changed` re-prices, `insufficient_balance` opens the recharge modal. |
| Account dashboard | `GET /users/me`, `/users/me/home`, `PATCH /users/me`, `/notification-prefs`, `GET/POST /wallet…`, `GET /notifications` (+ `notification:new`), `GET /chats` (history) |
| Free Kundli + report | `GET /places/search`, `POST /birth-profiles`, `GET /kundli/me`, `/kundli/:id` (+ `dasha`, `doshas`, `strength`, `remedies`, and `analysis/:domain` for the career / finance / health / marriage tabs — deterministic rule-engine readings computed from the cached chart, no extra provider calls) — needs a valid AstrologyAPI key |
| Horoscope (`/horoscope`) | `GET /horoscope/daily?sign=` (daily only): the backend calls AstrologyAPI once per sign per day and stores the reading in `HoroscopeCache`; every later request for that sign that day is served from the DB. If the provider fails, the last reading is served with `stale: true` and the page says which date it is from. Lucky number / colour / energy are not provider data, so the site no longer shows them. `GET /horoscope/compatibility?sign=` — real sign-pair compatibility (percentage + report), fetched once per pair ever and cached in `ZodiacCompatibilityCache`. |
| Panchang (`/panchang`) | `GET /panchang?date=YYYY-MM-DD` (public; yesterday … today+30). The backend calls AstrologyAPI (`advanced_panchang` + `chaughadiya_muhurta`, New Delhi) only on the first request for a date and stores the result in `PanchangCache` with a 1-day TTL; every later request is served from that cache. Muhurats, sacred days (Ekadashi/Purnima/Amavasya) and festivals are computed locally from today's date by `src/utils/hinduCalendar.js` (Meeus sun/moon longitudes → tithi, amanta months with Lahiri ayanamsa; udaya/pradosh/nishita rules per festival) — no API calls. The homepage festival strip uses the same module. |
| AI Astrology | `GET /chats/ai`, `POST /chats/ai/messages` |
| Support / Contact | `POST/GET /support/tickets` (logged-in users), `GET /settings` |

| Store (`/store`, `/store/:slug`), cart, `/checkout` | `GET /products`, `GET /products/:slug` (cover `imageUrl` + `images` gallery, up to 8, shown as the product-page slider), `GET /products/:slug/reviews` (paged, `rating` filter, `summary` with the 5→1 distribution — the "Customer Reviews" section), `POST /products/:slug/reviews` (only from a delivered order: the "Rate product" modal in My Orders → order detail), `POST /orders` (paid from the wallet; totals computed server-side), `GET /orders…` (order detail items carry `review` / `canReview`), `POST /orders/:id/cancel`. Products, their image galleries and review moderation live in the admin panel (Commerce → Products, Growth → Reviews). |
| Puja (`/puja`, `/puja/:slug`, booking modal) | `GET /pujas`, `GET /pujas/:slug`, `GET /pujas/:slug/slots?date=`, `POST /puja-bookings` (wallet), `GET /puja-bookings…`, cancel / rate. Pujas are created in the admin panel (Commerce → Pujas); bookings are processed there too. |
| Blog (`/blog`, `/blog/:slug`) | `GET /articles`, `GET /articles/:slug` — published articles from the admin panel's Content Library (plain-text body, blank-line paragraphs, `## ` headings; cover image upload). |

| Offers (`/offers`), coupon boxes (checkout, puja booking, wallet top-up) | `GET /offers`, `POST /coupons/validate`; `couponCode` on `POST /orders`, `POST /puja-bookings`, `POST /wallet/topup`. Coupons and festival offers are created in the admin panel (Growth → Offers & Coupons). |
| Rewards (`/account/rewards`), loyalty tiles, referral | `GET /loyalty`, `/loyalty/history`, `/referral`; sign-up reads `?ref=CODE` into an editable "Referral code" field (a friend's code can also be typed) and sends `referralCode`; the invite link shown on Rewards/Offers is built from the site's own origin (`/login?ref=CODE`). Points/tier/cashback/referral amounts are admin Settings. |
| Reviews (`/reviews`), homepage testimonials | `GET /reviews` (consultation + puja ratings, moderated in admin Growth → Reviews), `GET /testimonials` (admin-curated videos/stories) |
| Careers (`/careers`) | `GET /careers/jobs`, `POST /careers/applications` (multipart résumé) — jobs/applications managed in admin Growth → Careers |

Still static (no backend yet): kundli matching, weekly/monthly/yearly horoscope, the support live-chat widget.

Seed data for pujas/store/blog/testimonials/jobs: `cd ../backend && npm run seed:commerce && npm run seed:growth` (idempotent; coupons are never seeded).

Seed data for the store/pujas/blog: `cd ../backend && npm run seed:commerce` (idempotent; images land in `backend/uploads/seed/`).

## Routes

| Route | Page |
| --- | --- |
| `/` | Homepage (hero, free services, stats, top astrologers, CTA, explore, festivals, pujas, store, testimonials, trust) |
| `/astrologers` | Astrologer directory with search, filters and sorting (`?mode=call` / `?mode=chat` pre-selects Online Now) |
| `/astrologers/:id` | Astrologer profile with Overview / Expertise / Reviews / Availability tabs |
| `/intake/:id` | Chat/Call intake form (`?mode=call` switches copy); submits to `/call/:id` or `/chat/:id` |
| `/call/:id` | Voice consultation flow: pre-call → connecting → live call → end / low balance / recharge / review |
| `/chat/:id` | Chat consultation flow: pre-chat → connecting → live chat → end / review |
| `/kundli` | Free Kundli generator form; submits to the report (birth details kept in `sessionStorage`) |
| `/kundli/report?tab=…` | Kundli report with ten tabs (chart, matching, mangal-dosha, sade-sati, mahadasha, career, finance, health, marriage, lucky); tabs live in `src/pages/KundliReport/tabs/index.js`. Career, finance, health and marriage are rule-engine readings from `GET /kundli/:id/analysis/:domain` rendered by `AnalysisPanel` (tiles, summary, "What your chart shows" factors with their chart basis, dasha periods, "Based on" line, confidence, disclaimer) |
| `/horoscope` | Zodiac sign picker with Daily/Weekly/Monthly/Yearly predictions (`?sign=&period=`) and Chinese zodiac |
| `/panchang` | Daily Panchang from the API (‹ › date nav): tithi/nakshatra/yoga/karana/var tiles, sunrise/sunset/rahu kaal, Day/Night Choghadiya (live "Now" row for today); upcoming muhurats, sacred days and festivals computed from the lunar calendar |
| `/ai-astrology` | "Jyoti" AI astrologer chat (keyword-matched placeholder replies, suggestion chips, session timer) |
| `/puja`, `/puja/:slug` | Online puja listing and detail; "Book Online Puja" opens the 3-step `BookingModal` (date → time → details) |
| `/store`, `/store/:slug` | Store listing (search/category/sort) and product detail (gallery, offers, countdown, reviews, related) |
| `/checkout` | Order summary + contact/shipping form + payment card; "Pay Now" clears the cart and shows an order number |
| `/blog`, `/blog/:slug` | Blog listing (search/category) and article page |
| `/login` | Standalone auth page: phone → OTP → birth details (Google/Apple buttons sign in directly); demo user is stored in `localStorage` |
| `/account/*` | Signed-in dashboard (redirects to `/login` otherwise): Overview, Wallet, Notifications, My Booked Pujas (+ `/pujas/:id`), My Appointments (+ `/appointments/:id`), My Orders, My Profile; sidebar Dark Mode toggle scoped to the dashboard |
| `/about`, `/careers` | Company story page; careers page with job filters and Join-as-Astrologer / Apply / Application-Sent modals |
| `/reviews`, `/offers` | Reviews (rating filters, video lightbox) and Offers & Rewards (wallet, referral, coupons, loyalty tiers) |
| `/premium`, `/support`, `/contact` | Premium features grid, Support Center (FAQ, ticket form, live-chat widget), Contact form |
| `/privacy`, `/terms`, `/refund` | Legal pages sharing `LegalPage` with a scroll-spy contents sidebar; copy in `src/data/legal.js` |
| anything else | "Coming soon" placeholder |

Auth state lives in `src/context/AuthContext.jsx` (`useAuth()` → `user`, `isLoggedIn`, `login`, `updateProfile`, `logout`). Account demo data is in `src/data/account.js`.

Theme (light/dark) is global: `src/context/ThemeContext.jsx` (`useTheme()` → `{ theme, setTheme, toggle }`) persists `localStorage['shreeastro-theme']`, sets `data-theme` on `<html>` (an inline script in `index.html` applies it before paint), and both the header toggle (`.header__theme`) and the dashboard's Dark Mode switch drive it. Colours come from the semantic tokens in `src/index.css` (`--bg`, `--surface*`, `--ink*`, `--muted*`, `--border*`, `--on-brand`, soft tints) which have light and dark values; brand colours never change.

Cart state lives in `src/context/CartContext.jsx` (`useCart()`), persisted to `localStorage`; the slide-in `CartDrawer` is mounted once in `Layout`. Shared static data: `src/data/products.js`, `pujas.js`, `posts.js`.

## Structure

```
src/
  index.css                 global reset, colour tokens, .container, button helpers
  App.jsx                   routes
  components/
    layout/                 Header, Footer, Layout (Header + <Outlet/> + Footer)
    home/                   one folder per homepage section (Hero, FreeServices, StatsBand, …)
    astrologers/            DirectoryCard used by the /astrologers page
    consult/                shared consultation UI (PreConsultCard, ConnectingScreen, modals, CompletedScreen, ReviewModal)
  context/                  CartContext (shared cart + drawer open state), AuthContext (demo sign-in)
  data/                     static data modules (products, pujas, posts) — swap for API calls later
  pages/                    one folder per route (Home, Astrologers, AstrologerProfile, Intake, Call, Chat, Kundli, KundliReport,
                            Horoscope, Panchang, AiAstrology, Puja, PujaDetail, Store, ProductDetail, Checkout, Blog, BlogArticle, ComingSoon)
  assets/                   images/SVGs exported from Figma, grouped by section/page
```

Conventions: every component has a co-located `.css` with BEM-style class names prefixed by the component name; images are imported as ES modules; colours come from the tokens in `src/index.css`; Poppins is loaded from Google Fonts in `index.html`.

Responsive: breakpoints are 1024px (header collapses to a hamburger drawer, sidebars stack, `--header-h` becomes 72px), 768px and ~600px (`--gutter` becomes 16px). Full-height screens use `calc(100vh - var(--header-h))`.

## Hooking up the backend later

Each page keeps its data in a `const … = [...]` at the top of the file (e.g. `ASTROLOGERS` in `src/pages/Astrologers/Astrologers.jsx`, `PROFILE` in the profile page, `PUJAS`, `PRODUCTS`, …). Replace those constants with API calls; the JSX below them already consumes the same shape.
