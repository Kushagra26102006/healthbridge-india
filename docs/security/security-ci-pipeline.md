# HealthBridge India — Security CI Pipeline Specification (Day 9 Task 04)

**Workflow File:** `.github/workflows/security-ci.yml`

---

## 1. Automated Security Pipeline Stages

Triggered on every push to `main`, every pull request targeting `main`, and weekly scheduled runs (`0 3 * * 1` UTC):

1. **Reproducible Dependency Install:** `pnpm install --frozen-lockfile`
2. **Static Analysis & Type Safety:** `pnpm typecheck` + `pnpm lint`
3. **Production Dependency Audit:** Generates `security-audit-report.json` artifact and fails the build strictly on `HIGH` or `CRITICAL` production vulnerabilities (`pnpm audit --prod --audit-level=high`), avoiding noisy breakage on low informational findings.
4. **Redacted Secret Pattern Scan:** Scans `apps/` and `packages/` for AWS keys, private PEM keys, and hardcoded MongoDB Atlas credentials — fails the job without printing matched secret strings into CI logs.
5. **Automated Backend & Security Test Suite:** Runs `pnpm test` (`65` test files, `798` tests).
6. **Production Build Verification:** Runs `pnpm build` (`apps/api` + `apps/web`).
7. **Artifact Retention:** Uploads `security-audit-report.json` for vulnerability triage.

---

## 2. Recommended Next CI Enhancements (GitHub Cloud Settings)

- Enable GitHub Dependabot alerts & version updates for npm and GitHub Actions.
- Enable GitHub CodeQL (`javascript-typescript` query suite) and GitHub Secret Scanning / Push Protection at the repository level.
- Add container image scanning (Trivy/Grype) once Dockerfiles/containers are introduced.
