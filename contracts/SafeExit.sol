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
    event SafeExitModuleSetup(address indexed initiator, address indexed safe);

    Executor public executor;
    uint256 public circulatingSupply;
    address public designatedToken;

    mapping(address => bool) public deniedTokens;
    modifier executorOnly() {
        require(msg.sender == address(executor), "Not authorized");
        _;
    }

    /// @dev Iterates on deniedTokens list to check if one of the requested tokens is added
    /// @param tokens Tokens requested to be claimed
    modifier onlyValidTokens(address[] calldata tokens) {
        for (uint8 i; i < tokens.length; i++) {
            require(
                !deniedTokens[tokens[i]],
                "onlyValidTokens: Invalid token has been sent"
            );
        }
        _;
    }

    constructor(
        Executor _executor,
        address _designatedToken,
        uint256 _circulatingSupply
    ) {
        setUp(_executor, _designatedToken, _circulatingSupply);
    }

    function setUp(
        Executor _executor,
        address _designatedToken,
        uint256 _circulatingSupply
    ) public {
        require(
            address(executor) == address(0),
            "Module is already initialized"
        );
        require(
            _designatedToken != address(0),
            "setUp: Designated token address can not be zero"
        );
        executor = _executor;
        designatedToken = _designatedToken;
        circulatingSupply = _circulatingSupply;

        emit SafeExitModuleSetup(msg.sender, address(_executor));
    }

    function exit(uint256 _amountToBurn, address[] calldata tokens)
        public
        onlyValidTokens(tokens)
    {
        // executor.execTransactionFromModule(to, value, data, operation);
    }

    function addToDenylist(address[] calldata tokens) external executorOnly {
        for (uint8 i; i < tokens.length; i++) {
            require(
                !deniedTokens[tokens[i]],
                "addToDenyList: Token already added to the list"
            );
            deniedTokens[tokens[i]] = true;
        }
    }

    function removeFromDenylist(address[] calldata tokens)
        external
        executorOnly
    {
        for (uint8 i; i < tokens.length; i++) {
            require(
                deniedTokens[tokens[i]],
                "removeFromDenylist: Token not added to the list"
            );
            deniedTokens[tokens[i]] = false;
        }
    }

    function setDesignatedToken(address _token) external executorOnly {
        require(
            _token != address(0),
            "setDesignatedToken: Token address can not be zero"
        );
        designatedToken = _token;
    }

    function setCirculatingSupply(uint256 _circulatingSupply)
        external
        executorOnly
    {
        circulatingSupply = _circulatingSupply;
    }

    function getCirculatingSupply() external view returns (uint256) {
        return circulatingSupply;
    }
}
