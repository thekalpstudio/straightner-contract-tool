// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CircularB {
    CircularA public a;
    
    function setA(address _a) external {
        a = CircularA(_a);
    }
    
    function callA() external view returns (string memory) {
        return a.callB();
    }
}

contract CircularA {
    CircularB public b;
    
    function setB(address _b) external {
        b = CircularB(_b);
    }
    
    function callB() external view returns (string memory) {
        return "Called from A";
    }
}