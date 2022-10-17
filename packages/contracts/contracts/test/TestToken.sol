// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestToken is ERC20 {
    address public owner;

    uint8 tokenDecimals;

    constructor(uint8 _decimals) ERC20("Test", "T") {
        owner = msg.sender;
        tokenDecimals = _decimals;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only callable by owner");
        _;
    }

    function decimals() public view override returns (uint8) {
        return tokenDecimals;
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    // Does not revert on failure
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public virtual override returns (bool) {
        uint256 allowance = allowance(owner, _msgSender());
        if (allowance != type(uint256).max && allowance >= amount) {
            _transfer(from, to, amount);
            return true;
        } else {
            return false;
        }
    }
}
