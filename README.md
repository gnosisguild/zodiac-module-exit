# Exit Module

[![Build Status](https://github.com/gnosis/zodiac-module-exit/actions/workflows/ci.yml/badge.svg)](https://github.com/gnosis/zodiac-module-exit/actions/workflows/ci.yml)
[![Coverage Status](https://coveralls.io/repos/github/gnosis/zodiac-module-exit/badge.svg?branch=master&cache_bust=1)](https://coveralls.io/github/gnosis/zodiac-module-exit?branch=master)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](https://github.com/gnosis/CODE_OF_CONDUCT)


The Exit Module belongs to the [Zodiac](https://github.com/gnosis/zodiac) collection of tools, which can be accessed through the Zodiac App available on [Gnosis Safe](https://gnosis-safe.io/), as well as in this repository. 

If you have any questions about Zodiac, join the [Gnosis Guild Discord](https://discord.gg/wwmBWTgyEq). Follow [@GnosisGuild](https://twitter.com/gnosisguild) on Twitter for updates.

### About the Exit Module

This module allows participants to redeem a designated token for a proportional share of an avatar's digital assets, similar to Moloch DAO's rageQuit() function.

This means any holders of a designated ERC20 token can at any time redeem their designated ERC20 tokens in exchange for a proportional share of the Gnosis Safe’s ERC20-compatible token assets. The designated token is defined when the Exit Module is deployed, but the designated token can be modified by the owner at any time.

This module is intended to be used with the [Gnosis Safe](https://github.com/gnosis/safe-contracts).

### Features

- Provides a mechanism by which users can always voluntarily choose to leave an organization, taking a relative share of the assets.
- The module has an owner and an avatar. The avatar is the entity that will trigger the Exit transaction, and the owner can modify the attributes of the module, including the avatar and the owner itself.
- The `designated token` can only be modified by the owner (e.g. a Gnosis Safe).

### Flow

- Make sure the Gnosis Safe has any ERC20 compatible token assets available to redeem.
- Execute the `exit` function with an address that owns designated tokens, passing the available ERC20 tokens held by the Gnosis Safe as a parameter.

### Warnings

The exit module should not be used in conjunction with any token vending machine-like contract in which designated tokens are sold in exchange for valuable tokens that are forwarded immediately to the safe. This could potentially enable a re-entry scenario where an attacker could exploit users with pending deposits to the vending machine.

### Solidity Compiler

The contracts have been developed with [Solidity 0.8.4](https://github.com/ethereum/solidity/releases/tag/v0.8.4) in mind. This version of Solidity made all arithmetic checked by default, therefore eliminating the need for explicit overflow or underflow (or other arithmetic) checks.

### Setup Guide

Follow our [Exit Module Setup Guide](./packages/contracts/docs/setup_guide.md). 


### License

Created under the [LGPL-3.0+ license](LICENSE).

### Audits

An audit has been performed by the [G0 group](https://github.com/g0-group).

All issues and notes of the audit have been addressed in commit [2341cf0375b8f78b0dc3bd4d0d7ee864e1a6f804](https://github.com/gnosis/zodiac-module-exit/commit/2341cf0375b8f78b0dc3bd4d0d7ee864e1a6f804).

The audit results are available as a pdf in [this repo](packages/contracts/audits/ZodiacExitModuleJan2022.pdf).

### Security and Liability

All contracts are WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
