// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

// Minimal flattened version for OpenZeppelin v5 compatibility
// This version focuses on core functionality while avoiding multiple inheritance conflicts

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title ComplexNFT - Simplified OpenZeppelin v5 Compatible Version
 * @dev A pragmatic solution that maintains core functionality while avoiding complex inheritance conflicts
 * 
 * Features included:
 * - ERC721 NFT functionality
 * - Access control (admin, minter, pauser roles)
 * - Pausable functionality
 * - Token URI management
 * - Token enumeration through events
 * 
 * Features simplified:
 * - Removed ERC721Enumerable (use events for enumeration)
 * - Custom pausable implementation instead of ERC721Pausable
 * - Manual token URI storage instead of ERC721URIStorage
 */
contract ComplexNFT is ERC721, AccessControl, Pausable {
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    uint256 private _tokenIdCounter;
    mapping(uint256 => string) private _tokenURIs;
    
    // Events for token enumeration (replacement for ERC721Enumerable)
    event TokenMinted(address indexed to, uint256 indexed tokenId, string uri);
    event TokenBurned(uint256 indexed tokenId);

    constructor() ERC721("ComplexNFT", "CNFT") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    /**
     * @dev Pause all token transfers
     */
    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause all token transfers
     */
    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev Mint a new token with URI
     */
    function safeMint(address to, string memory uri) public onlyRole(MINTER_ROLE) {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        
        emit TokenMinted(to, tokenId, uri);
    }

    /**
     * @dev Burn a token
     */
    function burn(uint256 tokenId) public {
        require(_isAuthorized(_ownerOf(tokenId), msg.sender, tokenId), "Not authorized to burn");
        _burn(tokenId);
        delete _tokenURIs[tokenId];
        emit TokenBurned(tokenId);
    }

    /**
     * @dev Set token URI (internal)
     */
    function _setTokenURI(uint256 tokenId, string memory uri) internal {
        _requireOwned(tokenId);
        _tokenURIs[tokenId] = uri;
    }

    /**
     * @dev Get token URI
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        
        string memory uri = _tokenURIs[tokenId];
        string memory base = _baseURI();
        
        // If there is no base URI, return the token URI
        if (bytes(base).length == 0) {
            return uri;
        }
        
        // If both are set, concatenate the baseURI and tokenURI
        if (bytes(uri).length > 0) {
            return string(abi.encodePacked(base, uri));
        }
        
        return super.tokenURI(tokenId);
    }

    /**
     * @dev Override _update to include pausable functionality
     * This is the OpenZeppelin v5 way to handle transfer restrictions
     */
    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        // Check if contract is paused for all transfers except minting
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            require(!paused(), "Token transfers are paused");
        }
        
        return super._update(to, tokenId, auth);
    }

    /**
     * @dev Get total number of tokens minted (useful for enumeration)
     */
    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter;
    }

    /**
     * @dev Check if a token exists
     */
    function exists(uint256 tokenId) public view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    /**
     * @dev Support interface detection
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}