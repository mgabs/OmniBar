.PHONY: lint test coverage mutation

lint:
	node -c background.js && node -c default-page.js && node -c strip-reconciler.js && node -c frame-manager.js && node -c sidebar.js

test:
	node --test

coverage:
	node --test --experimental-test-coverage --test-coverage-lines=95 --test-coverage-branches=95

mutation:
	@echo "No mutation runner installed; verify pure core modules (default-page.js, strip-reconciler.js, frame-manager.js) manually or install Stryker."
