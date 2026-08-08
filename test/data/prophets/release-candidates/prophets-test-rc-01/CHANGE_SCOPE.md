# prophets-test-rc-01 — Change Scope

ADDED:
- scripts/validate-prophets-all.js
- scripts/prepare-prophets-rc.js
- scripts/build-prophets-search-index.js
- scripts/build-prophets-content-manifest.js
- scripts/prophets-phase09-smoke.js
- .github/workflows/prophets-test-validate.yml
- test/data/prophets/content-manifest.json
- test/data/prophets/phase09-*.json
- test/data/prophets/release-candidates/

MODIFIED:
- scripts/prophets-phase08-qa.js (stop writing live data/prophets report)
- test/data/prophets/** (reviewPass stamps, RC metadata, search index — no new religious claims)
- test/assets/prophets/prophets.js (load errors, offline message, search normalize)
- test/index.html / test/version.json (shell v611)
- content/admin/change-scope-lock.json (phase09 unlock)

DELETED:
- NONE

PRODUCTION FILES CHANGED:
NONE
