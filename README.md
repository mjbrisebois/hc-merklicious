[![](https://img.shields.io/crates/v/hc_merklicious_sdk?style=flat-square)](https://crates.io/crates/hc_merklicious_sdk)

# Merklicious
A set of Zomes (WASMs used in Holochain DNAs) for implementing Merkle Trees.


[![](https://img.shields.io/github/issues-raw/mjbrisebois/hc-merklicious?style=flat-square)](https://github.com/mjbrisebois/hc-merklicious/issues)
[![](https://img.shields.io/github/issues-closed-raw/mjbrisebois/hc-merklicious?style=flat-square)](https://github.com/mjbrisebois/hc-merklicious/issues?q=is%3Aissue+is%3Aclosed)
[![](https://img.shields.io/github/issues-pr-raw/mjbrisebois/hc-merklicious?style=flat-square)](https://github.com/mjbrisebois/hc-merklicious/pulls)

## Overview
This project provides the tools for implementing the Merkle tree proof/verify cycle.


### Usage
Implementing Merklicious in a DNA will require that

- The DNA include the `merklicious.wasm` integrity zome and the `merklicious_csr.wasm` coordinator

#### Add WASMs to your DNA config

```diff
  manifest_version: "1"
  name: your_dna
  integrity:
    origin_time: 2023-01-01T00:00:00.000000Z
    network-seed: ~
    properties: ~
    zomes:
      - name: your_zome
        bundled: your_zome.wasm
+     - name: merklicious
+       bundled: merklicious.wasm
  coordinator:
    zomes:
      - name: your_main_csr
        bundled: your_main_csr.wasm
        dependencies:
          - name: your_zome
+     - name: merklicious_csr
+       bundled: merklicious_csr.wasm
+       dependencies:
+         - name: merklicious
```

Real examples in tests
- [./tests/minimal_dna/dna.yaml](./tests/minimal_dna/dna.yaml)

#### Add `hc_merklicious_sdk` to `Cargo.toml`

```diff
  [dependencies]
+ hc_merklicious_sdk = "0.1"
```


### Use Cases

See [docs/Use_Cases.md](docs/Use_Cases.md)

### API Reference

See [docs/API.md](docs/API.md)

### Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)
