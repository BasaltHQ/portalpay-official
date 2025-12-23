// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title OsirisUSBN
 * @dev Registry for PortalPay Universal Standard Book Numbers (USBN).
 *      Securely links deterministic USBNs to their author's wallet.
 *
 *      THE GREAT ISBN SCAM IS OVER.
 *      
 *      For decades, the publishing industry has been held hostage by the tyranny of the ISBN.
 *      A simple number, necessary for distribution, yet gatekept by centralized agencies 
 *      extracting fees from independent authors for... what? A database entry?
 *      
 *      They charge you for the right to be listed. They charge you for the right to exist.
 *      
 *      BUT NO MORE.
 *      
 *      The OsirisUSBN (Universal Standard Book Number) framework liberates the written word.
 *      - Deterministic generation based on YOUR wallet address.
 *      - Zero cost to generate.
 *      - Immutable provenance on the blockchain.
 *      - Gatekeepers? Dissolved.
 *      
 *      "Information wants to be free. The database wants to be expensive." 
 *      - Not anymore.
 *
 *      __...--~~~~~-._   _.-~~~~~--...__
 *    //               `V'               \\ 
 *   //                 |                 \\ 
 *  //__...--~~~~~~-._  |  _.-~~~~~~--...__\\ 
 * //__.....----~~~~._\ | /_.~~~~----.....__\\
 *=====================\|/=====================
 *                    `---`
 */
contract OsirisUSBN {
    
    struct BookRecord {
        string usbn;            // The Unique Identifier (USBN-WALLET-TIME)
        string title;           // Book Title
        string author;          // Author Name
        string metadataUrl;     // IPFS or Arweave URL to full JSON metadata
        address registrant;     // Wallet address of the registrant
        uint256 registeredAt;   // Timestamp of registration
    }

    // Mapping from USBN string to Book Record
    mapping(string => BookRecord) private registry;
    
    // Mapping to check if a USBN exists
    mapping(string => bool) public authenticatedUSBNs;

    address public owner;

    event BookRegistered(string indexed usbn, address indexed registrant, string metadataUrl);
    event Deployed(address indexed addr);

    constructor() {
        owner = msg.sender;
        emit Deployed(address(this));
    }

    function toAsciiString(address x) internal pure returns (string memory) {
        bytes memory s = new bytes(40);
        for (uint i = 0; i < 20; i++) {
            bytes1 b = bytes1(uint8(uint(uint160(x)) / (2**(8*(19 - i)))));
            bytes1 hi = bytes1(uint8(b) / 16);
            bytes1 lo = bytes1(uint8(b) - 16 * uint8(hi));
            s[2*i] = char(hi);
            s[2*i+1] = char(lo);            
        }
        return string(s);
    }

    function char(bytes1 b) internal pure returns (bytes1 c) {
        if (uint8(b) < 10) return bytes1(uint8(b) + 0x30);
        else return bytes1(uint8(b) + 0x57);
    }

    // Convert string to uppercase for comparison
    function toUpper(string memory str) internal pure returns (string memory) {
        bytes memory bStr = bytes(str);
        bytes memory bUpper = new bytes(bStr.length);
        for (uint i = 0; i < bStr.length; i++) {
            // Lowercase a-z is 0x61-0x7a. Subtract 0x20 to get A-Z (0x41-0x5a)
            if ((uint8(bStr[i]) >= 97) && (uint8(bStr[i]) <= 122)) {
                bUpper[i] = bytes1(uint8(bStr[i]) - 32);
            } else {
                bUpper[i] = bStr[i];
            }
        }
        return string(bUpper);
    }

    /**
     * @dev Check if haystack contains needle
     */
    function contains(string memory haystack, string memory needle) internal pure returns (bool) {
        bytes memory h = bytes(haystack);
        bytes memory n = bytes(needle);
        if (h.length < n.length) return false;
        bool found = false;
        for (uint i = 0; i <= h.length - n.length; i++) {
            bool matchFound = true;
            for (uint j = 0; j < n.length; j++) {
                if (h[i + j] != n[j]) {
                    matchFound = false;
                    break;
                }
            }
            if (matchFound) {
                found = true;
                break;
            }
        }
        return found;
    }

    /**
     * @dev Registers a new USBN.
     * @param _usbn The generated USBN string. (Format: USBN-WALLET_PART-TIMESTAMP)
     * @param _title The title of the book.
     * @param _author The author's name.
     * @param _metadataUrl URL to the full book metadata.
     */
    function registerBook(
        string memory _usbn,
        string memory _title,
        string memory _author,
        string memory _metadataUrl
    ) external {
        require(!authenticatedUSBNs[_usbn], "OsirisUSBN: USBN already registered");
        require(bytes(_usbn).length > 10, "OsirisUSBN: Invalid USBN format");

        // VALIDATION: Ensure the USBN contains the first 6 chars of the sender's address
        // 1. Get sender address as hex string (lowercase by default from toAsciiString)
        string memory senderHex = toAsciiString(msg.sender);
        
        // 2. We only care about the first 6 chars of the address (e.g. 0x[ABCDEF]...)
        // toAsciiString returns full 40 chars.
        // Slice the first 6 chars.
        bytes memory sBytes = bytes(senderHex);
        bytes memory prefixBytes = new bytes(6);
        for(uint i=0; i<6; i++) {
            prefixBytes[i] = sBytes[i];
        }
        string memory prefixLower = string(prefixBytes);
        
        // 3. Frontend uses UpperCase. So we need to check if _usbn contains Upper(prefix) OR Lower(prefix)
        string memory usbnUpper = toUpper(_usbn);
        string memory prefixUpper = toUpper(prefixLower);

        require(contains(usbnUpper, prefixUpper), "OsirisUSBN: Wallet address mismatch in USBN");
        
        registry[_usbn] = BookRecord({
            usbn: _usbn,
            title: _title,
            author: _author,
            metadataUrl: _metadataUrl,
            registrant: msg.sender,
            registeredAt: block.timestamp
        });

        authenticatedUSBNs[_usbn] = true;

        emit BookRegistered(_usbn, msg.sender, _metadataUrl);
    }

    /**
     * @dev Retrieves book details by USBN.
     */
    function getBookDetails(string memory _usbn) external view returns (BookRecord memory) {
        require(authenticatedUSBNs[_usbn], "OsirisUSBN: Book not found");
        return registry[_usbn];
    }
}
