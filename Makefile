.PHONY: help docker-build docker-run

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

docker-build: ## build the docker image
	@docker-compose build

docker-run: ## run ezvis with a test dashboard
	@NODE_ENV=production EZVIS_DATA_DIR=./test/dataset/test2/ EZVIS_DATA_CONF=./test/dataset/test2.json docker-compose -f ./docker-compose.yml up --force-recreate
