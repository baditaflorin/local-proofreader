.PHONY: help install-hooks dev build test test-integration smoke lint fmt pages-preview release clean

help:
	@printf '%s\n' \
		'install-hooks     wire local git hooks' \
		'dev               run the frontend dev server' \
		'build             build GitHub Pages site into docs/' \
		'test              run unit tests' \
		'test-integration  run integration tests' \
		'smoke             run a Pages smoke test' \
		'lint              run linters and type checks' \
		'fmt               format source files' \
		'pages-preview     serve docs/ locally like GitHub Pages' \
		'release           tag v0.1.0 after checks pass' \
		'clean             remove generated build/test output'

install-hooks:
	git config core.hooksPath .githooks

dev:
	npm run dev

build:
	npm run build

test:
	npm run test

test-integration:
	npm run test:integration

smoke:
	npm run smoke

lint:
	npm run lint
	npm run typecheck
	npm run format:check

fmt:
	npm run format

pages-preview:
	npm run pages-preview

release: lint test build smoke
	git tag -a v0.1.0 -m "v0.1.0"

clean:
	rm -rf docs coverage playwright-report test-results
