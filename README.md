<div align="center">

# Varaq · ورق

**Free, open-source, peer-to-peer lending for physical books — for friends, campuses and local communities.**

[English](#english) · [فارسی](#فارسی)

</div>

---

## English

Varaq is a personal bookshelf tracker and a lending network in one. Catalogue your books in seconds, lend them to friends (inside or outside the app), and follow the journey of every physical copy.

### Features

- **Personal library** – scan the ISBN barcode with your camera (auto-metadata from Open Library / Google Books) or add a book by hand.
- **External loan tracker** – lent a book to someone who isn't on Varaq? Log their name and due date; Varaq reminds you and builds a WhatsApp reminder link.
- **Karma tokens** – 1 loan = 1 token. Listing 2+ available books gives a one-time bonus token; lending earns +1; borrowing locks 1 until the book is back.
- **Global discovery** – every available book is visible and borrowable right away, no circle required. Circles / hubs (campus, café, friend group) are an *optional filter* (`نزدیک من`, per-circle pills) next to genre and condition filters. Locations are never exact: only a city and an optional geohash truncated to ~5 km.
- **Discover home** – hero with live platform stats, activity ticker, «تازه‌های ورق» carousel, popular & high-trust lenders, a *Surprise me* shuffle, and a wishlist (heart) toggle.
- **2-step PIN handshake** – the receiver of the book types a 4-digit PIN shown on the other person's phone and logs the physical condition (`MINT`, `GOOD`, `FAIR`, `WORN`) at hand-over and at return.
- **Book Passport** – each physical copy keeps a timeline; every borrower can leave a one-sentence memory after returning it.
- **Bias-free public profiles, accountable private identity** – onboarding collects first/last name and a phone; the Iranian national code (checksum-validated) and Jalali birth date are required later, before the first borrow. Last name, national code, phone and birth date are stored privately and returned **only to the owner**; everyone else sees just the **first name** (plus `@username`), one of 16 built-in SVG avatars, trust score and karma tokens. No photo uploads. Login is by phone OTP (the phone is also kept as an HMAC for lookup).
- **Typo-tolerant Persian search** – PostgreSQL `pg_trgm` + full-text search over normalized text (Arabic/Persian ye & kaf, digits, ZWNJ).
- **Persian-first PWA** – RTL, Vazirmatn font, light/dark paper-and-ink theme, installable, mobile bottom navigation.

### Quick start

```bash
cp .env.example .env   # optional: docker compose works without it
docker compose up --build
```

| Service | URL |
| --- | --- |
| Web app | http://localhost:3000 |
| API | http://localhost:4000 |
| Swagger / OpenAPI | http://localhost:4000/docs |

Migrations and seed data (20 Persian / translated books, 3 circles, 5 users with KYC fields) are applied automatically. In development the OTP is fixed: **`123456`**.

Demo logins (enter the phone, then `123456`):

| User | Phone |
| --- | --- |
| @sara_reads | `09121110001` |
| @amir_hosseini | `09121110002` |
| @negar_n | `09121110003` |
| @reza_b | `09121110004` |
| @mina_m | `09121110005` |

Demo circle invite codes: `UTEHRAN1`, `METROCAFE`, `FRIENDS24`.

> Port already in use? Set `POSTGRES_PORT`, `REDIS_PORT`, `API_HOST_PORT` or `WEB_HOST_PORT` in `.env`.
> The seed ISBNs are synthetic (valid checksum, not the real ISBNs of those books).

### Local development (without Docker for the apps)

Requires Node 20+ and pnpm.

```bash
cp .env.example .env
pnpm install
pnpm db:deploy && pnpm db:seed     # migrations + seed (needs postgres up)
pnpm dev                            # starts postgres+redis in Docker, then API :4000 and web :3000 with hot reload
pnpm test                           # unit tests
pnpm typecheck
```

### Architecture

A pnpm monorepo containing a **modular monolith** API and a Next.js PWA.

```
apps/api            Fastify + Prisma + PostgreSQL + Redis
  src/modules/
    auth            OTP login, JWT
    users           profile, avatar, karma tokens, trust score
    catalog         BookEdition (ISBN metadata) + BookCopy inventory, search, feed
    circulation     loan state machine, PIN handshake, external loans
    passport        Book Passport timeline
    circles         hubs and fuzzy-location filtering
apps/web            Next.js App Router, Tailwind, Radix, PWA
packages/shared     Zod schemas, constants, Persian normalization
```

Each module has `repository` (data access) → `service` (rules, the module's *public interface*) → `routes` (HTTP + Zod/OpenAPI). Modules talk to each other only through service interfaces; `src/app.ts` is the composition root. A module takes other modules' services as dependencies, so dependencies always flow one way: `users, circles → catalog → circulation → passport`.

**Loan state machine** (`circulation/loan-state-machine.ts`, pure and unit-tested):

```
REQUESTED ─APPROVE→ APPROVED ─HANDOVER→ ACTIVE ─RETURN→ RETURNED
    └──────CANCEL──────┴→ CANCELLED       └─MARK_OVERDUE→ OVERDUE ─RETURN→ RETURNED
```

The lender shows the **handover PIN**, the borrower enters it. The borrower shows the **return PIN**, the lender enters it. Five wrong attempts lock the loan. An overdue sweep runs at boot and hourly. The partial unique index `loans_one_open_per_copy` guarantees a copy has at most one reserved/active loan.

### Design notes

- `karma_tokens` is the **spendable** balance and starts at 1 (a welcome token). Approving a loan deducts one token from the borrower (locked); returning it restores that token and pays the lender +1. The "list 2+ books" reward is a one-time +1 tracked by `listing_bonus_granted`.
- Error responses are `{ "error": { "code", "message" } }` with stable English codes; the web app maps codes to Persian messages (`apps/web/lib/labels.ts`).
- Reminder links are built on the client so the API stays free of user-facing Persian text.
- Date pickers use the browser's native `<input type="date">`; dates are displayed in the Jalali calendar.

### Roadmap / known gaps

Real SMS OTP delivery (implement `OtpSender`), push notifications for requests and due dates, API integration tests, a Jalali date picker, e2e tests for the web app.

### License

[MIT](LICENSE)

---

<div dir="rtl">

## فارسی

**ورق** یک پلتفرم رایگان و متن‌باز برای امانت دادن کتاب‌های کاغذی بین دوستان، دانشگاه‌ها و محله‌هاست؛ هم قفسه شخصی کتاب‌هایت است، هم دفتر امانت‌ها.

### امکانات

- **کتابخانه شخصی** – با اسکن بارکد شابک (دریافت خودکار مشخصات از Open Library / Google Books) یا ثبت دستی، کتاب‌هایت را در چند ثانیه ثبت کن.
- **ثبت امانت دستی به دوست** – کتابت را به کسی بیرون از ورق دادی؟ نام و تاریخ برگشت را ثبت کن؛ ورق یادت می‌ماند و لینک یادآوری واتساپ می‌سازد.
- **اعتبار امانت (کارما)** – هر امانت یک اعتبار. با ۲ کتاب آماده امانت یک اعتبار هدیه می‌گیری، با امانت دادن ۱+ می‌شود و با امانت گرفتن یک اعتبار تا برگشت کتاب قفل می‌شود.
- **کشف سراسری** – همه کتاب‌های آماده امانت بدون نیاز به عضویت در حلقه دیده و امانت گرفته می‌شوند؛ حلقه‌ها (دانشگاه، کافه، جمع دوستان) فقط فیلتر اختیاری‌اند. آدرس دقیق هیچ‌وقت ثبت نمی‌شود؛ فقط شهر و یک ژئوهش حداکثر ۵ کیلومتری.
- **دست‌دادن دومرحله‌ای با کد ۴ رقمی** – گیرنده کتاب، کدی را که روی گوشی طرف مقابل است وارد می‌کند و وضعیت فیزیکی کتاب (نو، خوب، متوسط، کهنه) را در تحویل و بازگشت ثبت می‌کند.
- **پاسپورت کتاب** – هر نسخه فیزیکی یک خط زمانی دارد و هر امانت‌گیرنده بعد از برگشت می‌تواند یک جمله خاطره بنویسد.
- **پروفایل عمومی بدون سوگیری، هویت خصوصی** – نام، کد ملی، موبایل و تاریخ تولد فقط برای خود کاربر قابل مشاهده است؛ دیگران فقط @نام‌کاربری، آواتار، امتیاز اعتماد و اعتبار امانت را می‌بینند.
- **جستجوی فارسی با تحمل غلط املایی** – `pg_trgm` و جستجوی تمام‌متن پستگرس روی متن نرمال‌شده (ی/ک عربی، ارقام، نیم‌فاصله).
- **PWA فارسی‌محور** – راست‌به‌چپ، فونت وزیرمتن، تم روشن و تاریک کاغذ و جوهر، قابل نصب روی گوشی.

### اجرای سریع

```bash
docker compose up --build
```

| سرویس | آدرس |
| --- | --- |
| برنامه وب | http://localhost:3000 |
| API | http://localhost:4000 |
| مستندات Swagger | http://localhost:4000/docs |

مایگریشن‌ها و داده‌های نمونه (۱۵ کتاب فارسی و ترجمه، ۳ حلقه، ۵ کاربر) خودکار اعمال می‌شوند. در حالت توسعه، کد ورود همیشه **`123456`** است.

کاربران نمونه با شماره‌های `09121110001` تا `09121110005` وارد می‌شوند. کدهای دعوت حلقه‌ها: `UTEHRAN1`، `METROCAFE` و `FRIENDS24`.

> اگر پورتی اشغال بود، در فایل `.env` مقدار `POSTGRES_PORT`، `REDIS_PORT`، `API_HOST_PORT` یا `WEB_HOST_PORT` را عوض کن. شابک‌های داده نمونه ساختگی‌اند و شابک واقعی آن کتاب‌ها نیستند.

### توسعه محلی

```bash
cp .env.example .env
docker compose up -d postgres redis
pnpm install
pnpm db:deploy && pnpm db:seed
pnpm dev
pnpm test
```

### معماری

مونوریپوی pnpm با یک **مونولیت ماژولار** (Fastify + Prisma) برای API و یک برنامه Next.js. ماژول‌های `auth`، `users`، `catalog`، `circulation`، `passport` و `circles` هر کدام لایه‌های repository، service و routes دارند و فقط از طریق رابط عمومی سرویس‌ها با هم حرف می‌زنند. ماشین حالت امانت (`REQUESTED → APPROVED → ACTIVE → RETURNED / OVERDUE / CANCELLED`) یک تابع خالص و تست‌شده است.

برای مشارکت، [CONTRIBUTING.md](CONTRIBUTING.md) را ببین. مجوز: [MIT](LICENSE).

</div>
# varaq
