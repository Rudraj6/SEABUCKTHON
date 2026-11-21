# SEABUCKTHORN BHARAT

Mobile-first storefront MVP for SEABUCKTHORN BHARAT, powered by Biosash. The app uses a React 19/Vite client and an Express 5/Mongoose API, with exactly six configured product families. All six product families are included in the local demo catalogue with pack variants, a product gallery, and add-to-bag controls.

## Run locally

Requirements: Node.js 20+. MongoDB Atlas or local MongoDB is optional for the local demo.

1. Install app dependencies: `npm --prefix client install` and `npm --prefix server install`.
2. Optional: copy `.env.example` to `server/.env` and set `MONGO_URI`, `JWT_SECRET`, and admin bootstrap credentials. Never commit `.env`.
3. Optional for persistent MongoDB: run `npm --prefix server run seed`.
4. Start everything with the single command `npm run dev`; open the one URL printed by the server (normally `http://localhost:3001`). Express and Vite share one HTTP listener; there is no second public Vite site. If port 3001 is busy, the local server scans through 3021 and prints the first available address. It detects this app if already running and prints its current URL. Set `PORT` in `server/.env` to prefer another local port. Production binds the platform-provided `PORT` exactly.
5. For a static production bundle run `npm run build`. `npm run dev:client` uses the same one-port development server.

Without `MONGO_URI`, the server starts with in-memory local demo storage. Orders, enquiries, coupons, product inventory, and settings work until the server stops; nothing in demo storage is persisted. Admin dashboard is protected at `/admin`; sign in through the single `/login` form. Local demo credentials are `admin@seabuckthorn.local` / `local-admin-123`. Demo coupon `BERRY100` gives ₹100 off. These credentials and settings must be replaced before any shared use. COD in demo mode only records a pending order and triggers no payment, courier, or dispatch.

The server seeds product data automatically on the first public product request when MongoDB is connected. MongoDB-backed admin bootstrap and shipping settings are initialized by the seed script.

## Customer accounts and admin CRM

Customers register at `/account`; the single `/login` form routes provisioned admin accounts to the admin dashboard and customer accounts to their account. Customers can register with name, email, phone and password, then view orders placed while signed in. Guest orders continue to use the phone-verified order tracker. In local demo mode customer records and orders exist only in memory and disappear when the server stops. With MongoDB connected, customer accounts and customer-linked orders are stored in Atlas. Admin access remains separate at `/admin` and includes order management, catalogue visibility, settings and enquiries.

Email verification, password reset, customer profile editing and guest-order claiming are not implemented. Add those account recovery and verification flows before customer accounts are used publicly. Customer passwords are hashed with bcrypt; customer sessions expire after eight hours.

The footer includes a WhatsApp contact for orders, product questions, and order support. It uses the number from the supplied campaign image and can be changed through `client/.env` using `VITE_WHATSAPP_NUMBER` (digits only, with country code optional). The WhatsApp number is public on the website.

## Database and admin

Set `MONGO_URI` to a MongoDB Atlas connection string. Restrict Atlas network access to deployment egress where practical and create a database user with access only to this database. Use a long, unique `JWT_SECRET` and a strong admin password. `npm run seed` creates the initial admin only when `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set; it never overwrites an existing admin. The admin dashboard is available at `/admin` and provides overview, product visibility/stock, orders/tracking, coupons, settings, and enquiries. Admin APIs are under `/api/admin`; sign-in uses the shared `/login` form; admin users are provisioned out of band and the account role routes them to `/admin`. Customer registration never creates admin accounts. Local demo credentials are documented above.

## Deploy

Recommended initial deployment: Render API service plus static Vite frontend on Render or Vercel. The current one-port setup is for local development; for production use a static frontend and API service with explicit API origin/proxy configuration.

- API service root: `server`; build command `npm install`; start command `npm start` (Render can use the server package directory).
- Static frontend root: `client`; build command `npm install && npm run build`; publish directory `dist`.
- Configure `MONGO_URI`, `JWT_SECRET`, `CLIENT_ORIGIN`, and `PUBLIC_URL` in the API environment. `CLIENT_ORIGIN` must exactly match the deployed site origin.
- Configure a same-origin reverse proxy or add a Vite build-time API base URL for a split-origin deployment.
- Add SPA rewrite to `/index.html` for browser routes. Do not expose any server secrets as `VITE_*` variables.
- Set the Atlas IP access list and DB user before starting the API. Point the domain only after spelling, legal business details, policies, support channels and product label facts have been approved.

## Cashfree

Cashfree is disabled until credentials exist. Set `CASHFREE_ENV=sandbox`, `CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY`, `CASHFREE_API_VERSION`, and `CASHFREE_WEBHOOK_SECRET` on the server only. Configure the Cashfree webhook URL as `https://<api-host>/api/payments/cashfree/webhook`. The browser cannot mark an order paid; signed webhooks update payment state. Before production, verify the Cashfree API version and webhook signature procedure against the merchant account's current official documentation, complete sandbox success/failure/drop flows, and request live merchant approval. The frontend payment redirect continuation is a remaining integration step.

## Founder inputs required before launch

- Confirm the public brand/domain spelling (`c-bappanbharat.shop` is only proposed).
- Supply authentic logo and product photography, label copies, ingredient/pack details, approved product descriptions, and matching videos. The current home hero uses the supplied desktop and mobile videos and seed-oil campaign image.
- Confirm the final sale prices and product label details for the catalogue before launch. Public Biosash listings and supplied product references were used for the current display data.
- Provide registered seller/business name, address, GST and applicable licence details, approved distributor wording, support phone/email/WhatsApp, returns/cancellation/privacy terms, shipping rates and delivery service rules.
- Confirm COD is enabled and whether the proposed ₹100 advance is to be collected online. The current settings default disables COD advance and the checkout explains that terms are not configured.
- Connect Cashfree credentials; approve legal/health content and any founder, award or certification materials.
- Connect a GitHub account/repository and Vercel or Render account to publish. This environment did not provide authenticated GitHub/Vercel/Render access.

## Scope and known gaps

Working locally: one command (`npm run dev`) and the URL printed at startup (normally `http://localhost:3001`); Vite assets and Express APIs under one origin; all six product families are purchasable in local demo mode; responsive customer routes; variant-aware local cart; checkout validations; demo order creation with server-side catalogue price/stock; coupon validation and a sample `BERRY100` coupon; human-readable local order IDs; customer registration/sign-in and account order history; phone-verified guest order tracking; separate admin login and dashboard (`/admin`) for overview, product publish/stock, orders and manual tracking, coupons, settings and contact enquiries; local brand/shipping settings; FAQ/help and policy draft routes; page title/meta, robots and sitemap.

## Supplied media

The provided SEABUCKTHORN BHARAT logo and product media are stored under `client/public/brand`, `client/public/products`, `client/public/videos`, and `client/public/editorial`. Official Biosash packshots were downloaded from the product image URLs used by the six supplied reference pages. The juice and oil videos are mapped only to those corresponding product pages. The campaign artwork with a model is retained under `editorial` and is not used as a packshot. Additional client-supplied promotional graphics remain in the product assets folder for later review; claim-heavy artwork should be approved before it is displayed as product evidence.

Local demo mode has no persistence: orders, stock changes, coupons/settings and enquiries reset when the server stops. The local admin default is `admin@seabuckthorn.local` / `local-admin-123`. Do not expose the demo service to a public network. Local COD creates a record only: it does not collect money or arrange shipping. The local demo catalogue makes all six products purchasable with demo inventory. Review live stock in the admin catalogue before accepting production orders.

Still requiring external configuration or a follow-up before launch: MongoDB Atlas credentials and persistence; Cashfree sandbox browser SDK, return status verification and webhook end-to-end validation; email verification and password reset for customer accounts; secure persistent admin session hardening and audit records; verify the supplied WhatsApp number is the intended ordering line and configure support email delivery; real approved product-label descriptions; correct legal seller/company details, legal policies, shipping fees, PIN/service rules and COD terms; founder approval of brand/domain spelling and distributor disclosure; full concurrent stock/coupon reservation and release rules; fully verified guest phone/OTP/tracking-token flow; GitHub/Vercel/Render account access and deployment; live payment approval. The code includes MongoDB and signed webhook endpoints but those integrations have not been exercised without credentials. Do not treat the local demo as production-ready.
