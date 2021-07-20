// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.0;

contract Enum {
    enum Operation {
        Call,
        DelegateCall
    }
}

interface Executor {
    /// @dev Allows a Module to execute a transaction.
    /// @param to Destination address of module transaction.
    /// @param value Ether value of module transaction.
    /// @param data Data payload of module transaction.
    /// @param operation Operation type of module transaction.
    function execTransactionFromModule(
        address to,
        uint256 value,
        bytes calldata data,
        Enum.Operation operation
    ) external returns (bool success);
}

contract SafeExit {
    Executor public executor;

    mapping(address => bool) public deniedTokens;
    modifier executorOnly() {
        require(msg.sender == address(executor), "Not authorized");
        _;
    }

    modifier onlyValidTokens(address[] calldata _tokens) {
        for (uint16 i; i < _tokens.length; i++) {
            require(
                deniedTokens[_tokens[i]],
                "onlyValidTokens: Invalid token has been sent"
            );
        }
        _;
    }

    constructor() {
        setUp();
    }

    function setUp() public {}

    function exit(uint256 _amountToBurn, address[] calldata _tokens)
        public
        onlyValidTokens(_tokens)
    {}

    function addToDenylist(address[] calldata _tokens) external executorOnly {}

    function removeFromDenylist(address[] calldata _tokens)
        external
        executorOnly
    {}

    function setDesignatedToken(address _token) external executorOnly {}

    function setCirculatingSupply(address _address) external executorOnly {}

    function getCirculatingSupply() external {}
}
