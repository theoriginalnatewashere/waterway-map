# Security and reliability — current H2O Map project only

- [x] Apply versioned security migration; verify hosted definitions and linter (real owner/admin execution remains blocked below).
- [x] Fix language saving and test failed saves and racing changes.
- [x] Resolve lint issues without changing the UI.
- [x] Verify validation parity; run tests and lint; inspect automated type/build evidence.
- [x] Report results and remaining authenticated/production verification blockers.

## Previous verification

- [x] Audit hosted constraints, grants, RLS, storage and security warnings.
- [x] Fix safe frontend validation and auth redirect issues; add regression tests.
- [x] Verify public browser flows and anonymous access restrictions.
- [ ] Verify authenticated workflows (blocked: external unmanaged authentication has no test session).
- [x] Check public Google settings and document manual configuration; private redirect allowlist is unavailable.
- [x] Review automated type-check/build evidence and run existing tests.
- [ ] Fresh production build (blocked: available harness runs automatic checks; no new production build was supplied).
- [x] Deliver PASS / FAIL / NOT TESTED report; do not alter the original project, providers, policies or admin privileges.
## Approved bilingual landing

- [x] Add static Thai/English landing and truthful public app visuals.
- [x] Move map route and update map destinations/PWA start only.
- [x] Verify routing, languages, mobile layout, tests and automated checks; fresh production build remains blocked by environment rules above.
