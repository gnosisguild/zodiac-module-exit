# Safe Exit

[![SafeExit](https://github.com/gnosis/SafeExit/actions/workflows/ci.yml/badge.svg)](https://github.com/gnosis/SafeExit/actions/workflows/ci.yml)
[![Coverage Status](https://coveralls.io/repos/github/gnosis/SafeExit/badge.svg?branch=master)](https://coveralls.io/github/gnosis/SafeExit?branch=master)

This module allows any holders of a designated ERC20, at any time, to redeem their designated ERC20 tokens in exchange for a proportional share of the Safe’s ERC20 compatible assets. The designed token is defined at the deployment of the module and can be modified by the owner at any time.

This module is intended to be used with the [Gnosis Safe](https://github.com/gnosis/safe-contracts).

### Features

- Provides a mechanism by which users can always voluntarily choose to leave an organization, taking a relative share of the assets.
- The module has an owner and an executor, the executor is the entity that will trigger the exit transaction and the owner can modify the attributes of the module, including the executor and ther owner itself.
- The `designated token` can only be modified by the owner (E.g. Safe)

### Flow

- Make sure the Safe has any ERC20 available to redeem
- Execute the `exit` function with a signer that owns designated tokens, passing the available ERC20 tokens in the safe as parameter

### Solidity Compiler

The contracts have been developed with [Solidity 0.8.4](https://github.com/ethereum/solidity/releases/tag/v0.8.4) in mind. This version of Solidity made all arithmetic checked by default, therefore eliminating the need for explicit overflow or underflow (or other arithmetic) checks.

### Setup Guide

Follow our [Setup Guide](./docs/setup_guide.md) to setup a Safe Exit module
