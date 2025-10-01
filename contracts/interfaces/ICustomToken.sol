// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ICustomToken {
    function mint(address to, uint256 amount) external;
    function burn(address from, uint256 amount) external;
    function pause() external;
    function unpause() external;
    function blacklist(address account) external;
    function unblacklist(address account) external;
    function isBlacklisted(address account) external view returns (bool);
}