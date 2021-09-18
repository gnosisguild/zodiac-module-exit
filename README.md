# Exit Module

[![Build Status](https://github.com/gnosis/zodiac-module-exit/actions/workflows/ci.yml/badge.svg)](https://github.com/gnosis/zodiac-module-exit/actions/workflows/ci.yml)
[![Coverage Status](https://coveralls.io/repos/github/gnosis/zodiac-module-exit/badge.svg?branch=master)](https://coveralls.io/github/gnosis/zodiac-module-exit?branch=master)

This module allows any holders of a designated ERC20, at any time, to redeem their designated ERC20 tokens in exchange for a proportional share of the Safe’s ERC20 compatible assets. The designed token is defined at the deployment of the module and can be modified by the owner at any time.

This module is intended to be used with the [Gnosis Safe](https://github.com/gnosis/safe-contracts).

### Features

- Provides a mechanism by which users can always voluntarily choose to leave an organization, taking a relative share of the assets.
- The module has an owner and an avatar, the avatar is the entity that will trigger the exit transaction and the owner can modify the attributes of the module, including the avatar and the owner itself.
- The `designated token` can only be modified by the owner (E.g. Safe)

### Flow

- Make sure the Safe has any ERC20 available to redeem
- Execute the `exit` function with a signer that owns designated tokens, passing the available ERC20 tokens in the safe as parameter

### Solidity Compiler

The contracts have been developed with [Solidity 0.8.4](https://github.com/ethereum/solidity/releases/tag/v0.8.4) in mind. This version of Solidity made all arithmetic checked by default, therefore eliminating the need for explicit overflow or underflow (or other arithmetic) checks.

### Setup Guide

Follow our [Setup Guide](./docs/setup_guide.md) to setup a Safe Exit module

### Security and Liability

All contracts are WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.

### License

Created under the [LGPL-3.0+ license](LICENSE).

### Audits

An audit has been performed by the [G0 group](https://github.com/g0-group).

All issues and notes of the audit have been addressed in commit [4e7029acf8c71727f484ca0b1873de021964d3c7](https://github.com/gnosis/zodiac-module-exit/commit/4e7029acf8c71727f484ca0b1873de021964d3c7).

The audit results are available as a pdf in [this repo](audits/ZodiacExitModuleSep2021.pdf) or on the [g0-group repo](https://github.com/g0-group/Audits/blob/e11752abb010f74e32a6fc61142032a10deed578/ZodiacExitModuleSep2021.pdf).

### Security and Liability

All contracts are WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
