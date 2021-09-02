// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";

contract CirculatingSupply is Ownable {
    uint256 public circulatingSupply;

    constructor(uint256 _circulatingSupply) {
        circulatingSupply = _circulatingSupply;
    }

    function set(uint256 _circulatingSupply) public onlyOwner {
        circulatingSupply = _circulatingSupply;
    }

    function get() public view returns (uint256) {
        return circulatingSupply;
    }
}
