
.PHONY:			FORCE
SHELL			= bash
TARGET			= release
TARGET_DIR		= target/wasm32-unknown-unknown/release
SOURCE_FILES		= Makefile zomes/Cargo.* zomes/*/Cargo.toml zomes/*/src/*.rs zomes/*/src/*/* \
				merklicious_sdk/Cargo.toml merklicious_sdk/src/*.rs

# Zomes (WASM)
MERKLICIOUS_WASM	= zomes/merklicious.wasm
MERKLICIOUS_CSR_WASM	= zomes/merklicious_csr.wasm


#
# Project
#
tests/package-lock.json:	tests/package.json
	touch $@
tests/node_modules:		tests/package-lock.json
	cd tests; \
	npm install
	touch $@
clean:
	rm -rf \
	    tests/node_modules \
	    .cargo \
	    target

rebuild:			clean build
build:				$(MERKLICIOUS_WASM) $(MERKLICIOUS_CSR_WASM)

zomes/%.wasm:			zomes/$(TARGET_DIR)/%.wasm
	@echo -e "\x1b[38;2mCopying WASM ($<) to 'zomes' directory: $@\x1b[0m"; \
	cp $< $@
zomes/$(TARGET_DIR)/%.wasm:	$(SOURCE_FILES)
	rm -f zomes/$*.wasm
	@echo -e "\x1b[37mBuilding zome '$*' -> $@\x1b[0m"; \
	cd zomes; \
	RUST_BACKTRACE=1 CARGO_TARGET_DIR=target cargo build --release \
	    --target wasm32-unknown-unknown \
	    --package $*
	@touch $@ # Cargo must have a cache somewhere because it doesn't update the file time

use-local-backdrop:
	cd tests; npm uninstall @whi/holochain-backdrop
	cd tests; npm install --save-dev ../../node-holochain-backdrop/
use-npm-backdrop:
	cd tests; npm uninstall @whi/holochain-backdrop
	cd tests; npm install --save-dev @whi/holochain-backdrop



#
# Packages
#
preview-crate:			test-debug
	cd merklicious_sdk; cargo publish --dry-run --allow-dirty
publish-crate:			test-debug .cargo/credentials
	cd merklicious_sdk; cargo publish
.cargo/credentials:
	cp ~/$@ $@



#
# Testing
#
reset:
	rm -f zomes/*.wasm
	rm -f tests/*.dna
	rm -f tests/zomes/*.wasm
tests/%.dna:			build FORCE
	cd tests; make $*.dna
test-setup:			tests/node_modules

test:				test-unit test-integration
test-debug:			test-unit test-integration-debug

test-unit:
	cd merklicious_sdk;	RUST_BACKTRACE=1 cargo test -- --nocapture
	make test-unit-merklicious
test-unit-%:
	cd zomes;		RUST_BACKTRACE=1 cargo test $* -- --nocapture

test-integration:		test-setup	\
				test-minimal
test-integration-debug:		test-setup		\
				test-minimal-debug

MINIMAL_DNA			= tests/minimal_dna.dna
TEST_DNAS			= $(MINIMAL_DNA)

test-minimal:			test-setup build $(MINIMAL_DNA)
	cd tests; RUST_LOG=none LOG_LEVEL=fatal npx mocha integration/test_minimal_dna.js
test-minimal-debug:		test-setup build $(MINIMAL_DNA)
	cd tests; RUST_LOG=info LOG_LEVEL=trace npx mocha integration/test_minimal_dna.js



#
# Repository
#
clean-remove-chaff:
	@find . -name '*~' -exec rm {} \;
clean-files:		clean-remove-chaff
	git clean -nd
clean-files-force:	clean-remove-chaff
	git clean -fd
clean-files-all:	clean-remove-chaff
	git clean -ndx
clean-files-all-force:	clean-remove-chaff
	git clean -fdx

PRE_HDK_VERSION = "0.3.0-beta-dev.2"
NEW_HDK_VERSION = ""

PRE_HDI_VERSION = "0.4.0-beta-dev.1"
NEW_HDI_VERSION = ""

GG_REPLACE_LOCATIONS = ':(exclude)*.lock' zomes/*/ *_types/ hc_utils

update-hdk-version:
	git grep -l $(PRE_HDK_VERSION) -- $(GG_REPLACE_LOCATIONS) | xargs sed -i 's/$(PRE_HDK_VERSION)/$(NEW_HDK_VERSION)/g'
update-hdi-version:
	git grep -l $(PRE_HDI_VERSION) -- $(GG_REPLACE_LOCATIONS) | xargs sed -i 's/$(PRE_HDI_VERSION)/$(NEW_HDI_VERSION)/g'

HDIEV	= "0.1"
HDKEV	= "0.1"

use-local-whi_hdk:
	git grep -l 'whi_hdk_extensions = $(HDKEV)' -- tests/zomes/*/Cargo.toml \
		| xargs sed -i 's/whi_hdk_extensions = $(HDKEV)/whi_hdk_extensions = { path = "..\/..\/..\/..\/whi_hdk_extensions" }/g'
	git grep -l 'whi_hdk_extensions = $(HDKEV)' -- merklicious_sdk/Cargo.toml \
		| xargs sed -i 's/whi_hdk_extensions = $(HDKEV)/whi_hdk_extensions = { path = "..\/..\/whi_hdk_extensions" }/g'
use-rust-whi_hdk:
	git grep -l 'whi_hdk_extensions = {' -- tests/zomes/*/Cargo.toml \
		| xargs sed -i 's/whi_hdk_extensions = { path = "..\/..\/..\/..\/whi_hdk_extensions" }/whi_hdk_extensions = $(HDKEV)/g'
	git grep -l 'whi_hdk_extensions = {' -- merklicious_sdk/Cargo.toml \
		| xargs sed -i 's/whi_hdk_extensions = { path = "..\/..\/whi_hdk_extensions" }/whi_hdk_extensions = $(HDKEV)/g'


#
# Documentation
#
SDK_DOCS		= target/doc/merklicious_sdk/index.html
MAIN_DOCS		= target/doc/merklicious/index.html

$(SDK_DOCS):		merklicious_sdk/src/**
	cd merklicious_sdk; cargo test --doc
	cd zomes; cargo doc
	@echo -e "\x1b[37mOpen docs in file://$(shell pwd)/$(SDK_DOCS)\x1b[0m";
$(MAIN_DOCS):		zomes/*/src/**
	cd zomes; cargo test --doc
	cd zomes; cargo doc
	@echo -e "\x1b[37mOpen docs in file://$(shell pwd)/$(MAIN_DOCS)\x1b[0m";
docs:			$(SDK_DOCS) $(MAIN_DOCS)
docs-watch:
	@inotifywait -r -m -e modify		\
		--includei '.*\.rs'		\
			zomes/			\
			merklicious_sdk	\
	| while read -r dir event file; do	\
		echo -e "\x1b[37m$$event $$dir$$file\x1b[0m";\
		make docs;			\
	done
