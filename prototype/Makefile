#
# Project
#
use-local-holo-hash:
	npm uninstall @spartan-hc/holo-hash
	npm install --save ../../holo-hash-js/
use-npm-holo-hash:
	npm uninstall @spartan-hc/holo-hash
	npm install --save @spartan-hc/holo-hash

use-local-holochain-prototyping:
	npm uninstall @whi/holochain-prototyping
	npm install --save ../../node-holochain-prototyping/
use-npm-holochain-prototyping:
	npm uninstall @whi/holochain-prototyping
	npm install --save @whi/holochain-prototyping


test:
	node authority_based_agent_anchors_discovery.js
test-debug:
	LOG_LEVEL=trace node authority_based_agent_anchors_discovery.js
