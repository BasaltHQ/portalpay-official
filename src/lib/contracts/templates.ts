// Minimal registry of contract templates (ABI + bytecode) and constructor param builders.
// In a real implementation, import compiled artifacts (e.g., via @thirdweb-dev/contracts or your own hardhat build).

export type ContractTemplate = {
    name: string;
    abi: any[];
    bytecode: `0x${string}`;
    buildConstructorParams: (input: Record<string, any>) => Record<string, any>;
    // Optional solidity source to compile via your preferred toolchain
    source?: string;
    solidityFileName?: string;
    compilerVersion?: string;
    notes?: string;
};

// Placeholders — replace with real compiled ABIs/bytecode.
// These are stubs to show structure; do not deploy as-is.
// For production: prefer importing real artifacts from your build or thirdweb prebuilt deployments.
// These bytecodes are placeholders; wire your pipeline to replace them at build time.
const DUMMY_BYTECODE = "0x" as `0x${string}`;

export const templates: Record<string, ContractTemplate> = {
    standard: {
        name: "StandardERC20Permit",
        abi: [],
        bytecode: DUMMY_BYTECODE,
        buildConstructorParams: (input) => ({
            name: input.name,
            symbol: input.symbol,
            initialSupply: input.totalSupply || "0",
        }),
        solidityFileName: "StandardERC20Permit.sol",
        compilerVersion: "0.8.24",
        notes: "Non-upgradable, no owner; initial supply minted on deploy; includes EIP-2612 permit.",
        source: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract StandardERC20Permit is ERC20, ERC20Permit {
    constructor(string memory name_, string memory symbol_, uint256 initialSupply_, address initialRecipient_) ERC20(name_, symbol_) ERC20Permit(name_) {
        _mint(initialRecipient_, initialSupply_);
    }
}
`,
    },
    governance: {
        name: "GovernanceTokenVotes",
        abi: [],
        bytecode: DUMMY_BYTECODE,
        buildConstructorParams: (input) => ({
            name: input.name,
            symbol: input.symbol,
            initialSupply: input.totalSupply || "0",
        }),
        solidityFileName: "GovernanceTokenVotes.sol",
        compilerVersion: "0.8.24",
        notes: "ERC20Votes with checkpoints; no owner; supply fixed at deploy.",
        source: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {ERC20Votes} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

contract GovernanceTokenVotes is ERC20, ERC20Permit, ERC20Votes {
    constructor(string memory name_, string memory symbol_, uint256 initialSupply_, address initialRecipient_) ERC20(name_, symbol_) ERC20Permit(name_) {
        _mint(initialRecipient_, initialSupply_);
    }

    // Overrides required by Solidity for ERC20Votes
    function _afterTokenTransfer(address from, address to, uint256 amount) internal override(ERC20, ERC20Votes) {
        super._afterTokenTransfer(from, to, amount);
    }

    function _mint(address to, uint256 amount) internal override(ERC20, ERC20Votes) {
        super._mint(to, amount);
    }

    function _burn(address account, uint256 amount) internal override(ERC20, ERC20Votes) {
        super._burn(account, amount);
    }
}
`,
    },
    memes: {
        name: "MemeBurnToken",
        abi: [],
        bytecode: DUMMY_BYTECODE,
        buildConstructorParams: (input) => ({
            name: input.name,
            symbol: input.symbol,
            initialSupply: input.totalSupply || "0",
            burnBps: input.burnBps || 50, // 0.5%
        }),
        solidityFileName: "MemeBurnToken.sol",
        compilerVersion: "0.8.24",
        notes: "Fixed burn on transfers to dead address; immutable rate; no owner.",
        source: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MemeBurnToken is ERC20 {
    address public constant DEAD = 0x000000000000000000000000000000000000dEaD;
    uint256 public immutable burnBps; // basis points, e.g., 50 = 0.5%

    constructor(string memory name_, string memory symbol_, uint256 initialSupply_, uint256 burnBps_, address initialRecipient_) ERC20(name_, symbol_) {
        require(burnBps_ <= 1000, "BPS too high");
        burnBps = burnBps_;
        _mint(initialRecipient_, initialSupply_);
    }

    function _update(address from, address to, uint256 value) internal override {
        if (from != address(0) && to != address(0) && burnBps > 0 && value > 0) {
            uint256 burnAmount = (value * burnBps) / 10000;
            if (burnAmount > 0) {
                super._update(from, DEAD, burnAmount);
                value -= burnAmount;
            }
        }
        super._update(from, to, value);
    }
}
`,
    },
    quadratic: {
        name: "QuadraticFundToken",
        abi: [],
        bytecode: DUMMY_BYTECODE,
        buildConstructorParams: (input) => ({
            name: input.name,
            symbol: input.symbol,
            initialSupply: input.totalSupply || "0",
            matchingPool: input.matchingPool || "0x0000000000000000000000000000000000000000",
        }),
        solidityFileName: "QuadraticFundToken.sol",
        compilerVersion: "0.8.24",
        notes: "Plain ERC20 with an immutable matching pool reference for off-chain quadratic funding.",
        source: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract QuadraticFundToken is ERC20 {
    address public immutable matchingPool;
    constructor(string memory name_, string memory symbol_, uint256 initialSupply_, address initialRecipient_, address matchingPool_) ERC20(name_, symbol_) {
        matchingPool = matchingPool_;
        _mint(initialRecipient_, initialSupply_);
    }
}
`,
    },
    "real-estate": {
        name: "RealEstateAssetToken",
        abi: [],
        bytecode: DUMMY_BYTECODE,
        buildConstructorParams: (input) => ({
            name: input.name,
            symbol: input.symbol,
            initialSupply: input.totalSupply || "0",
            documentURI: input.documentURI || "",
        }),
        solidityFileName: "RealEstateAssetToken.sol",
        compilerVersion: "0.8.24",
        notes: "Simple ERC20 with immutable document URI; no centralized controls.",
        source: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract RealEstateAssetToken is ERC20 {
    string public documentURI;
    constructor(string memory name_, string memory symbol_, uint256 initialSupply_, address initialRecipient_, string memory documentURI_) ERC20(name_, symbol_) {
        documentURI = documentURI_;
        _mint(initialRecipient_, initialSupply_);
    }
}
`,
    },
    desci: {
        name: "DeSciMilestoneToken",
        abi: [],
        bytecode: DUMMY_BYTECODE,
        buildConstructorParams: (input) => ({
            name: input.name,
            symbol: input.symbol,
            initialSupply: input.totalSupply || "0",
            milestone: input.researchMilestone || "",
        }),
        solidityFileName: "DeSciMilestoneToken.sol",
        compilerVersion: "0.8.24",
        notes: "Plain ERC20 with milestone metadata; keep logic off-chain or via hooks.",
        source: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract DeSciMilestoneToken is ERC20 {
    string public milestone;
    constructor(string memory name_, string memory symbol_, uint256 initialSupply_, address initialRecipient_, string memory milestone_) ERC20(name_, symbol_) {
        milestone = milestone_;
        _mint(initialRecipient_, initialSupply_);
    }
}
`,
    },
    luxury: {
        name: "LuxuryCollectibleToken",
        abi: [],
        bytecode: DUMMY_BYTECODE,
        buildConstructorParams: (input) => ({ name: input.name, symbol: input.symbol, initialSupply: input.totalSupply || "0" }),
        solidityFileName: "LuxuryCollectibleToken.sol",
        compilerVersion: "0.8.24",
        notes: "Plain ERC20 with potential rarity handled off-chain.",
        source: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
contract LuxuryCollectibleToken is ERC20 { constructor(string memory n,string memory s,uint256 sup,address r) ERC20(n,s){ _mint(r,sup);} }
`,
    },
    education: {
        name: "EducationRewardToken",
        abi: [],
        bytecode: DUMMY_BYTECODE,
        buildConstructorParams: (input) => ({ name: input.name, symbol: input.symbol, initialSupply: input.totalSupply || "0" }),
        solidityFileName: "EducationRewardToken.sol",
        compilerVersion: "0.8.24",
        notes: "Plain ERC20; reward logic belongs in application layer.",
        source: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24; import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol"; contract EducationRewardToken is ERC20 { constructor(string memory n,string memory s,uint256 sup,address r) ERC20(n,s){ _mint(r,sup);} }
`,
    },
    lifestyle: {
        name: "LifestyleCommunityToken",
        abi: [],
        bytecode: DUMMY_BYTECODE,
        buildConstructorParams: (input) => ({ name: input.name, symbol: input.symbol, initialSupply: input.totalSupply || "0" }),
        solidityFileName: "LifestyleCommunityToken.sol",
        compilerVersion: "0.8.24",
        notes: "Plain ERC20; community features in app & hooks.",
        source: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24; import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol"; contract LifestyleCommunityToken is ERC20 { constructor(string memory n,string memory s,uint256 sup,address r) ERC20(n,s){ _mint(r,sup);} }
`,
    },
};
