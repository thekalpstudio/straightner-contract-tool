// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./TestCase6_CircularA.sol";

contract CircularB {
    CircularA public a;
    
    function setA(address _a) external {
        a = CircularA(_a);
    }
    
    function callA() external view returns (string memory) {
        return a.callB();
    }
}