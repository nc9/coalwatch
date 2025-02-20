.DEFAULT_GOAL := all
projectname = coalwatch
bump=patch

.PHONY: format
format:
	npm run format

.PHONY: format-check
format-check:
	npm run format:check

.PHONY: release
release:
	@if [ -n "$$(git status --porcelain)" ]; then \
		echo "There are uncommitted changes, please commit or stash them before running make release"; \
		exit 1; \
	fi

	# Run format check first
	npm run format:check || (echo "Prettier check failed. Running formatter..." && npm run format && git add . && git commit -m "Format code for release")

	# Build the project
	npm run build

	# Bump version
	current_branch=$(shell git rev-parse --abbrev-ref HEAD)

	# if the current branch is develop then the bump level is prepatch
	if [ "$$current_branch" = "develop" ]; then \
		bump=prepatch; \
	fi

	npm version $(bump)

	# Push only the latest version tag
	git push origin $$current_branch
	git push origin v$$(node -p "require('./package.json').version")