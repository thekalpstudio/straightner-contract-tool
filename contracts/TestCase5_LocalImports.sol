// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./lib/Math.sol";
import "./interfaces/ICustomToken.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract MixedImports {
    using Address for address;
    using Math for uint256;

    ICustomToken public customToken;
    IERC20 public standardToken;

    constructor(address _customToken, address _standardToken) {
        customToken = ICustomToken(_customToken);
        standardToken = IERC20(_standardToken);
    }

    function calculateReward(uint256 amount, uint256 rate) external pure returns (uint256) {
        return amount.mul(rate).div(100);
    }

    function isContract(address account) external view returns (bool) {
        return account.isContract();
    }
}