// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract TestTokenERC721 is ERC721Enumerable, Ownable {

    constructor() ERC721("NFT", "Test") {
    }

    function mint(address to) external onlyOwner {
        _mint(to, totalSupply());
    }
}
