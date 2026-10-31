# Post-migration verification — new H2O Map project only

- [x] Audit hosted constraints, grants, RLS, storage and security warnings.
- [x] Fix safe frontend validation and auth redirect issues; add regression tests.
- [x] Verify public browser flows and anonymous access restrictions.
- [ ] Verify authenticated workflows (blocked: external unmanaged authentication has no test session).
- [x] Check public Google settings and document manual configuration; private redirect allowlist is unavailable.
- [x] Review automated type-check/build evidence and run existing tests.
- [ ] Fresh production build (blocked: available harness runs automatic checks; no new production build was supplied).
- [x] Deliver PASS / FAIL / NOT TESTED report; do not alter the original project, providers, policies or admin privileges.