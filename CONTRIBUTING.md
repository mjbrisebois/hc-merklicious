[back to README.md](README.md)


# Contributing

## Overview
This project provides the tools for implementing Merkle Trees in a Holochain app.


### Entity Relationship Diagram
![](https://drive.google.com/a/webheroes.ca/thumbnail?sz=w1000&id=1AeBqiC4_7v-oh8vn7tMgsm1oI9m_Dmdb)


## Development

### Environment

- Enter `nix develop` for other development environment dependencies.


### Building

WASM targets

- `make ./zomes/merklicious.wasm` - Integrity Zome
- `make ./zomes/merklicious_csr.wasm` - Default CSR


### Testing

To run all tests with logging
```
make test-debug
```

- `make test-unit` - **Rust tests only**
- `make test-integration-debug` - **Integration tests only**

> **NOTE:** remove `-debug` to run tests without logging
