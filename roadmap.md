# Post-migration verification — new H2O Map project only

- [ ] Audit hosted constraints, grants, RLS, storage and security warnings.
- [ ] Fix safe frontend validation and auth redirect issues; add regression tests.
- [ ] Verify public browser flows and anonymous access restrictions.
- [ ] Verify authenticated workflows (blocked: external unmanaged authentication has no test session).
- [ ] Check Google settings and document manual configuration.
- [ ] Review automated type-check/build evidence and run existing tests.
- [ ] Deliver PASS / FAIL / NOT TESTED report; do not alter the original project, providers, policies or admin privileges.