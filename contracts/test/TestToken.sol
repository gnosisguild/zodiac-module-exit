// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract TestToken is ERC20Burnable {
    constructor() ERC20("Test", "T") {}
}
