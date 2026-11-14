.DEFAULT_GOAL := help
.PHONY: help lint test coverage mutation build

help:
	@printf "Targets:\n"
	@printf "  make lint      Syntax-check JS files (node -c)\n"
	@printf "  make test      Run unit and integration tests (node --test)\n"
	@printf "  make coverage  Run tests with >=95%% line & branch threshold\n"
	@printf "  make mutation  Mutation testing status\n"
	@printf "  make build     Package extension zip into dist/omnibar.zip\n"

lint:
	node -c background.js && node -c default-page.js && node -c strip-reconciler.js && node -c frame-manager.js && node -c sidebar.js

test:
	node --test

coverage:
	node --test --experimental-test-coverage --test-coverage-lines=95 --test-coverage-branches=95

mutation:
	@echo "No mutation runner installed; verify pure core modules (default-page.js, strip-reconciler.js, frame-manager.js) manually or install Stryker."

build:
	@mkdir -p dist
	@rm -f dist/omnibar.zip
	zip -r dist/omnibar.zip manifest.json background.js sidebar.html sidebar.css sidebar.js default-page.js strip-reconciler.js frame-manager.js rules.json icons/
