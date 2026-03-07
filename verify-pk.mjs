import { privateKeyToAccount } from "viem/accounts";
const account = privateKeyToAccount("0xe6bce3e06fbf34ed4aac7f108e5311af127fcb55c104d865a8e834af814c275c");
console.log(account.address);
