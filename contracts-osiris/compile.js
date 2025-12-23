const fs = require('fs');
const path = require('path');
const solc = require('solc');

const contractPath = path.resolve(__dirname, 'OsirisUSBN.sol');
const source = fs.readFileSync(contractPath, 'utf8');

const input = {
    language: 'Solidity',
    sources: {
        'OsirisUSBN.sol': {
            content: source,
        },
    },
    settings: {
        evmVersion: 'paris',
        outputSelection: {
            '*': {
                '*': ['abi', 'evm.bytecode'],
            },
        },
    },
};

console.log('Compiling OsirisUSBN.sol...');
const output = JSON.parse(solc.compile(JSON.stringify(input)));

if (output.errors) {
    let hasError = false;
    output.errors.forEach((err) => {
        if (err.severity === 'error') hasError = true;
        console.error(err.formattedMessage);
    });
    if (hasError) process.exit(1);
}

const contract = output.contracts['OsirisUSBN.sol']['OsirisUSBN'];
const artifact = {
    abi: contract.abi,
    bytecode: contract.evm.bytecode.object,
};

// Save to src/lib/contracts/OsirisUSBN.json
const outputPath = path.resolve(__dirname, '../src/lib/contracts/OsirisUSBN.json');
const dir = path.dirname(outputPath);
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

fs.writeFileSync(outputPath, JSON.stringify(artifact, null, 2));
console.log(`Contract compiled and artifact saved to ${outputPath}`);
