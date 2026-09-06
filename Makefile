SHELL := /bin/bash
GIT_SHA := $(shell git rev-parse --short HEAD)
COMPOSE := docker compose
NODE_IMAGE := node:22-alpine
HEALTH_URL := http://localhost:8080/api/health
HEALTH_TIMEOUT_SECONDS := 90

.PHONY: build lint test verify

# Builds both service images. No local Node install required.
build:
	GIT_SHA=$(GIT_SHA) $(COMPOSE) build

# Runs lint for app/ and api/ inside ephemeral node:22-alpine containers.
lint:
	docker run --rm -v "$(CURDIR)/app:/work" -w /work $(NODE_IMAGE) sh -c "npm ci && npm run lint"
	docker run --rm -v "$(CURDIR)/api:/work" -w /work $(NODE_IMAGE) sh -c "npm ci && npm run lint"

# Runs unit tests for app/ and api/ inside ephemeral node:22-alpine containers.
test:
	docker run --rm -v "$(CURDIR)/app:/work" -w /work $(NODE_IMAGE) sh -c "npm ci && npm run test"
	docker run --rm -v "$(CURDIR)/api:/work" -w /work $(NODE_IMAGE) sh -c "npm ci && npm run test"

# Brings the whole stack up, waits for health, proves neither container runs
# as root, runs the smoke tests this story owns, and tears the stack down.
# Exits non-zero if any step fails.
verify:
	@set -e; \
	trap '$(COMPOSE) down' EXIT; \
	echo "==> starting stack (GIT_SHA=$(GIT_SHA))"; \
	GIT_SHA=$(GIT_SHA) $(COMPOSE) up -d --build; \
	echo "==> waiting for $(HEALTH_URL) (timeout $(HEALTH_TIMEOUT_SECONDS)s)"; \
	elapsed=0; \
	until curl -fsS "$(HEALTH_URL)" >/dev/null 2>&1; do \
		elapsed=$$((elapsed + 1)); \
		if [ "$$elapsed" -ge "$(HEALTH_TIMEOUT_SECONDS)" ]; then \
			echo "==> health check timed out after $(HEALTH_TIMEOUT_SECONDS)s"; \
			$(COMPOSE) logs --tail=200; \
			exit 1; \
		fi; \
		sleep 1; \
	done; \
	echo "==> health check passed"; \
	app_uid=$$($(COMPOSE) exec -T app id -u); \
	api_uid=$$($(COMPOSE) exec -T api id -u); \
	echo "==> app container uid=$$app_uid, api container uid=$$api_uid"; \
	if [ "$$app_uid" = "0" ] || [ "$$api_uid" = "0" ]; then \
		echo "==> a container is running as root"; \
		exit 1; \
	fi; \
	echo "==> running smoke tests"; \
	( cd tests && PLAYWRIGHT_BASE_URL=http://localhost:8080 npx playwright test --grep "health endpoint responds|homepage renders" )
# NOTE (US-0001 G1 decision, Option B): this grep deliberately runs only the two
# @smoke tests US-0001 owns (homepage renders, health endpoint responds), not the
# full @smoke tag docs/TESTING.md otherwise mandates at every checkpoint. The
# sign-in-gate and TLS-certificate @smoke tests in tests/smoke.spec.ts belong to
# US-0006 and are not executed anywhere yet. FOLLOW-UP: US-0006 must widen this
# grep (here and in .github/workflows/ci.yml) back to the unfiltered "@smoke" tag
# once it implements the sign-in gate and TLS check. Do not let this drop.
