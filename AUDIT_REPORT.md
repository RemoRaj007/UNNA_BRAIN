# Enterprise Technical Audit — UNNA_BRAIN

Date: 2026-02-27
Scope: Full repository static review for production readiness.

## 1) System Overview

### Architecture pattern
- **Current pattern:** Single-process Streamlit application (effectively a **monolith**) with UI, business logic, file ingestion, report generation, and limited automation scripts all co-located. No service boundaries or internal layering.  
- **Secondary scripts:** `open_links.py`, `open_links2.py`, and `open_links3.py` are sidecar automation scripts with overlapping functionality and no shared module extraction.

### Main components and interactions
- `app.py` hosts:
  - Streamlit page routing (`Home`, `Weekly Report`, `Contact`).
  - Inline CSS injection and HTML rendering.
  - File upload ingestion (`csv`, `xls`, `xlsx`) into pandas.
  - Per-platform normalization, ranking logic, and report exports (`xlsx`, `docx`).
- `open_links*.py` scripts:
  - Selenium-based screenshot automation with local Excel input.
  - Use local Chrome profile assumptions in some variants.
- `chatbot.html`:
  - Embeds Dialogflow Messenger client-side widget.
- `.devcontainer/devcontainer.json`:
  - Developer environment bootstrap and Streamlit startup command.

### Tech stack
- Python 3.11 devcontainer image.
- Streamlit, pandas, openpyxl/xlrd, python-docx.
- Selenium + webdriver-manager.
- Dialogflow Messenger bootstrap script in static HTML.

### Architecture anti-patterns detected
- **God file:** `app.py` mixes presentation, data parsing, transformation, business logic, export logic, and IO side effects.
- **No domain/service abstractions:** platform mapping and report logic not isolated into reusable/testable modules.
- **UI and policy coupling:** date filtering and ranking decisions embedded directly in UI callbacks.
- **Script sprawl:** duplicated Selenium scripts (`open_links.py`, `open_links2.py`) with environment-specific hardcoded paths.

## 2) Code Quality & Maintainability

- **Naming conventions:** Mostly understandable, but inconsistent (`cols_map`, `platform_dfs`, `open_links2.py` naming by sequence instead of intent).
- **Folder structure:** Flat root with mixed runtime files (`temp.xlsx`, `final_social_report.xlsx`) and source code; no `src/`, `tests/`, or package boundaries.
- **Modularity:** Low in `app.py`; helper functions are local to one branch and not reusable/importable.
- **Dead code / questionable imports:** `webbrowser` imported but unused in screenshot scripts.
- **Duplication:** `open_links.py` and `open_links2.py` are near duplicates; only Chrome profile config differs.
- **Complexity hotspots:** `Weekly Report` branch in `app.py` has nested logic and multiple side effects (upload, transform, render, export).
- **SOLID adherence:** Violates SRP/OCP in core app flow.
- **Readability/docs:** No README-driven architecture docs; no inline rationale for data assumptions (e.g., expected sheet names, fixed top-3 ranking).

## 3) Git & Collaboration Standards

- **Branching strategy:** Single visible branch (`work`), no evidence of branch model.
- **Commit quality:** Messages are simple but mostly imperative and narrowly scoped; acceptable but not enterprise-grade traceability (no issue IDs, no scopes).
- **PR quality:** No templates/workflow metadata found.
- **Tagging/versioning:** No tags and no semantic versioning markers.
- **Changelog:** Missing (`CHANGELOG.md` absent).

## 4) Dependencies & Supply Chain Risk

- **Pinning:** Most dependencies pinned in `requirements.txt`, but `python-docx` is unpinned.
- **Potential bloat:** Includes Selenium stack and webdriver-manager even though core app path does not require browser automation for all users.
- **Unused or weakly justified deps:** `python-dotenv` present but not used in code.
- **Lockfile:** No lock artifact (`poetry.lock`, `Pipfile.lock`, `requirements.lock`) to guarantee reproducibility/security scanning parity.
- **Integrity:** No hash-pinned installs (`--require-hashes`) and no SBOM.

## 5) Security Audit (OWASP-oriented)

- **AuthN/AuthZ:** None. Application has no authentication or role segregation.
- **Password/token handling:** Not applicable in code; however, no secure secret flow exists for future integrations.
- **Input validation:** File type extension checks are shallow; schema validation is absent.
- **Injection/XSS:** Heavy use of `unsafe_allow_html=True` in Streamlit and direct HTML injection surface.
- **CSRF/XSRF/CORS:** Devcontainer runs Streamlit with **both protections disabled** (`--server.enableCORS false --server.enableXsrfProtection false`).
- **Secrets exposure risks:** Hardcoded personal email and externally hosted resources; `open_links2.py`/`open_links3.py` include hardcoded local user profile paths.
- **Rate limiting / abuse controls:** None.
- **Security headers:** Not explicitly managed.
- **RBAC:** Not implemented.

## 6) Performance & Scalability

- **Data processing model:** In-memory pandas operations; acceptable for small files, not hardened for large enterprise datasets.
- **Async/concurrency:** Blocking operations in UI path; Word/Excel generation can stall app thread.
- **Caching:** No caching (`st.cache_data`) for repeated transforms.
- **Horizontal scaling readiness:** Weak; state maintained via Streamlit session and local filesystem writes (`final_social_report.xlsx`, `temp.xlsx`).
- **Statelessness:** Not stateless due to local file outputs and session-dependent behavior.

## 7) Testing Strategy

- **Unit tests:** None.
- **Integration tests:** None.
- **E2E tests:** None.
- **Error-path testing:** No automated coverage of malformed schemas, missing columns, empty datasets, or date edge cases.
- **Maintainability:** No test harness means regressions likely with each mapping change.

## 8) DevOps & CI/CD

- **CI:** No CI configuration present.
- **Lint/test gates:** No linting/type-check/format enforcement.
- **Deployment pipeline:** Not defined; devcontainer startup command is not production deployment strategy.
- **Environment segregation:** No explicit dev/staging/prod config separation.
- **Containerization quality:** Devcontainer disables CORS/XSRF and performs `apt upgrade -y` at build/update time (non-reproducible and slower).
- **IaC:** None.
- **Rollback strategy:** None documented.

## 9) Logging, Observability & Reliability

- **Structured logging:** Absent.
- **Log levels/correlation IDs:** Absent.
- **Error handling:** Mostly UI-level errors; no centralized exception policy.
- **Retry/timeout/circuit breakers:** Not implemented.
- **Health checks/metrics:** None.
- **Crash recovery:** No restart policy/process manager guidance.

## 10) Configuration & Environment Management

- **Env vars:** Minimal/no usage for runtime settings.
- **Config separation:** Hardcoded values in source (URLs, sheet names, labels, file names).
- **Secrets management:** No vault/secret manager patterns.
- **Hardcoded machine paths:** Present in Selenium scripts; non-portable and insecure.

## 11) UX & Accessibility

- **Accessibility:** Custom CSS and raw HTML likely bypass semantic/accessibility best practices; no ARIA review evidence.
- **Error messaging:** Basic and limited; does not provide remediation details.
- **Loading states:** Minimal; long operations may appear frozen.
- **Responsive behavior:** Custom styling may not adapt cleanly across viewports.

## 12) Data & Database Layer

- **Database:** None.
- **Implication:** Simplicity reduces DB risk but also limits scalability, auditability, and multi-user coordination.
- **Data integrity controls:** No schema contracts for input files; assumptions encoded implicitly.

## 13) Technical Debt Assessment

### High-risk refactor areas
1. `app.py` weekly report flow (largest coupling surface).
2. Platform mapping and engagement aggregation assumptions.
3. Selenium script duplication and local-path hardcoding.

### Fragile modules
- Streamlit UI logic tightly coupled to expected column names and external export formats.

### Legacy patterns
- Hardcoded static assets/URLs and unsafe HTML rendering.

### Refactoring priority order
1. Extract domain/service layers from `app.py`.
2. Introduce schema validation and typed contracts.
3. Replace duplicated scripts with one configurable automation module.
4. Introduce CI, tests, and security gates.

## 14) Production Readiness Score (1–10)

- **System Overview:** 4/10 — Functional prototype architecture, not enterprise-structured.
- **Code Quality & Maintainability:** 3/10 — Monolithic file, duplication, no docs/tests.
- **Git & Collaboration:** 3/10 — No branching standards, tags, changelog, templates.
- **Dependencies & Supply Chain:** 4/10 — Mostly pinned, but missing lockfile/hash controls and unused deps.
- **Security:** 2/10 — No auth/RBAC, unsafe HTML usage, CORS/XSRF disabled in dev run config.
- **Performance & Scalability:** 3/10 — In-memory/batching without scaling controls.
- **Testing:** 1/10 — No automated tests.
- **DevOps & CI/CD:** 2/10 — No CI/CD or release controls.
- **Observability & Reliability:** 1/10 — No logging/metrics/health checks.
- **Configuration Management:** 3/10 — Hardcoded settings and paths.
- **UX & Accessibility:** 4/10 — Usable basic UI, but accessibility and resilient UX gaps.
- **Data Layer:** 4/10 — No DB complexity but no schema governance.

**Overall enterprise readiness verdict:** **Not production ready**. Current state is a functional prototype suitable for controlled internal demos, not enterprise deployment.

## 15) Red Flag Summary — Top 10 Critical Risks

1. No authentication/authorization model.
2. No automated test coverage.
3. No CI/CD quality gates.
4. CORS and XSRF protections explicitly disabled in runtime command.
5. Unsafe HTML rendering in Streamlit.
6. Hardcoded user-specific local Chrome profile paths in code.
7. Monolithic app logic with high coupling and side effects.
8. No observability (structured logs/metrics/health checks).
9. No versioning/changelog/release discipline.
10. Input schema validation missing for uploaded files.

## 16) Improvement Roadmap

### Immediate fixes (1–2 weeks)
- Add authentication layer (SSO/OIDC or at minimum password-protected access behind reverse proxy).
- Enable CORS/XSRF protections; remove insecure defaults from devcontainer run command.
- Add input schema validation per platform with explicit error reporting.
- Create baseline CI (lint + unit tests + security scan + dependency audit).
- Remove hardcoded local profile paths and unsafe defaults from automation scripts.

### Mid-term improvements (1–2 months)
- Refactor into modules: `ui/`, `services/`, `adapters/`, `validators/`, `reporting/`.
- Add test pyramid: unit tests for transform functions, integration tests for file ingestion, E2E smoke tests.
- Introduce configuration management via environment variables and typed settings.
- Add structured logging and basic metrics/health endpoints.
- Establish release process: semantic versioning, changelog, PR templates, protected branches.

### Long-term architectural upgrades
- Split compute-heavy report generation into asynchronous worker service.
- Externalize persistence (object store + metadata DB) for multi-user and audit trails.
- Add RBAC and tenant-aware controls for enterprise governance.
- Introduce API layer and contract versioning for extensibility.
- Implement full observability stack (tracing, SLOs, alerting, dashboards).
