# H2O Map

**A community-powered map of reverse osmosis (RO) drinking-water dispensers.**

H2O Map helps people find nearby RO water dispensers and share practical, up-to-date information about the machines they use. Community members can add dispenser locations, report measured water characteristics, upload photos, and flag whether a machine is operating.

**Website:** [h2o-map.nate-4f6.workers.dev](https://h2o-map.nate-4f6.workers.dev/)

## Why H2O Map?

RO dispensers are common places to refill drinking water, but information about their location, condition, and recent measurements can be difficult to find. H2O Map brings those observations together in a location-based, community-maintained directory.

The goal is to make it easier to **find a dispenser, review recent reports, and contribute an observation** for the next person.

## Features

- **Explore a map:** Find community-listed RO dispensers and view individual dispenser details.
- **Add locations:** Submit a dispenser with its GPS coordinates, identifying information, operating status, and photos.
- **Report measurements:** Share total dissolved solids (TDS, in ppm), pH, test date, machine status, and optional observations.
- **Review report history:** See community-submitted readings and when they were recorded.
- **Attach photos:** Add up to six photos per dispenser or report, subject to upload validation.
- **Use English or Thai:** A bilingual interface, including landing pages at `/` (Thai) and `/en` (English).
- **Install as a web app:** A progressive web app (PWA) designed for use on mobile devices.

Community reporting requires an account. Dispenser and report data are stored in Supabase.

## How community reports should be interpreted

H2O Map displays **user-submitted observations**, not certified laboratory results. Reported measurements may be inaccurate, incomplete, or outdated.

**TDS and pH readings are for screening and comparison only. They do not establish whether water is safe to drink.** These measurements cannot identify bacteria, viruses, heavy metals, pesticides, or many other contaminants. A low TDS reading is not proof of safe drinking water.

Dispenser names are intended to help people identify machines; a name does not necessarily indicate an association with a nearby business or property owner.

## Technology

| Layer | Technology |
| --- | --- |
| Application | React, TypeScript, TanStack Start / Router |
| Build tools | Vite |
| Interface | Tailwind CSS |
| Mapping | Leaflet |
| Backend | Supabase (Postgres, authentication, storage) |
| Hosting | Cloudflare Workers |
| Mobile installation | Progressive Web App (PWA) |
| Tests | Vitest |

The frontend is developed in Lovable and synchronized to a Git repository. Cloudflare hosts the deployed application; Supabase remains the backend for accounts, data, and user-uploaded images.

## Run locally

**Prerequisites:** A recent compatible version of Node.js and npm, plus access to a configured Supabase project.

```bash
git clone <repository-url>
cd <repository-directory>
npm install
```

Create a local `.env.local` file with the public Supabase configuration used by the app:

```dotenv
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-publishable-key>
```

Use a **publishable** key, not a Supabase secret or `service_role` key. `VITE_` variables are included in client-side builds and must never contain private credentials.

Start the development server:

```bash
npm run dev
```

Useful commands:

```bash
npm run build     # Create a production build
npm run preview   # Preview a local build
npm run test      # Run automated tests
npm run lint      # Run lint checks
```

The app depends on its Supabase schema, storage bucket, and access policies. SQL migration files are included in `supabase/migrations/`; review them and follow your project's migration process when setting up a new database.

## Deployment

H2O Map is deployed to **Cloudflare Workers** from its connected Git repository. The production build must receive the required Supabase environment configuration. Depending on the rendering/runtime setup, server-side Supabase variables may also be needed; consult `src/integrations/supabase/client.ts` and the deployment configuration.

Static project images are stored in `public/images/` and should be served at `/images/<filename>`. User-uploaded dispenser and report photos are handled separately through Supabase Storage, rather than being included in the Git repository.

For changes to reach the live site, verify that the latest commit was pushed to the production branch and that Cloudflare successfully built **and deployed** that commit.

## Project structure

```text
public/
  images/              Static site images
  icons/               PWA and website icons
src/
  app/h2o/             Dispenser, map, reporting and profile UI
  app/h2o/landing/     Thai and English landing pages
  i18n/                Interface translations
  integrations/supabase/ Supabase client and types
  lib/h2o/             Data access, images and validation
  routes/              Application routes
  test/                Automated tests
supabase/
  migrations/          Database schema migrations
```

## Project status

H2O Map is an evolving community project. Availability, quality, and freshness of individual dispenser reports depend on user participation. Features, deployments, and integrations should be tested before relying on them in production.

## License

No license is specified in this repository README. Unless a license file is added, do not assume the code or assets are available for unrestricted reuse.
