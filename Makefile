dependencies:
	@npm install -d

deps: dependencies

test:
	@node_modules/expresso/bin/expresso -I lib --growl test/*.test.js

check: test

test-cov:
	@node_modules/expresso/bin/expresso -I lib --cov test/*.test.js

.PHONY: test test-cov dependencies
