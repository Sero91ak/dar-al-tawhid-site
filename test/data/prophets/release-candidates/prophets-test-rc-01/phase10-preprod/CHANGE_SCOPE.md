# prophets-test-rc-01 — Phase 10 Pre-Production Scope

## Freeze
- releaseCandidate: prophets-test-rc-01
- contentFrozen: true
- content commit: ab1fe3e80c2ddc444028abe8f3c2aeb7415dbcbd
- Further content edits require prophets-test-rc-02+

## ADDED
- scripts/prophets-phase10-preprod.js
- test/data/prophets/release-candidates/prophets-test-rc-01/freeze.json
- test/data/prophets/release-candidates/prophets-test-rc-01/phase10-preprod/**
- test/data/prophets/release-candidates/prophets-test-rc-01/rollback/**
- test/data/prophets/phase10-pre-production-report.json

## MODIFIED
- test/index.html / test/version.json (shell note v612 — prep only)
- content/admin/change-scope-lock.json (phase10 unlock)
- .github/workflows/prophets-test-validate.yml (phase10 preflight step)

## DELETED
- NONE

## PRODUCTION FILES CHANGED
NONE

## Explicitly NOT done
- NO copy to data/prophets/
- NO production = enabled
- NO live deploy / public menu
- NO service-worker.js production change
