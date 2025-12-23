import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/**
 * POST /api/admin/verify-contract
 * Verifies a deployed contract on Base/Etherscan using the V2 API.
 * Body: { address: string, chainId: number }
 */
export async function POST(req: NextRequest) {
    try {
        const { address, chainId } = await req.json();

        if (!address || !chainId) {
            return NextResponse.json({ ok: false, error: "Missing address or chainId" }, { status: 400 });
        }

        // V2 API uses chainid as a query parameter, not in body
        const apiUrl = `https://api.etherscan.io/v2/api?chainid=${chainId}`;
        const apiKey = process.env.ETHERSCAN_API_KEY || "";

        if (!apiKey) {
            return NextResponse.json({ ok: false, error: "ETHERSCAN_API_KEY not configured" }, { status: 500 });
        }

        // Read source code
        const solPath = path.resolve(process.cwd(), "contracts-osiris", "OsirisUSBN.sol");
        if (!fs.existsSync(solPath)) {
            return NextResponse.json({ ok: false, error: "Source file not found" }, { status: 500 });
        }
        const sourceCode = fs.readFileSync(solPath, "utf-8");

        // Prepare verification payload (Etherscan V2 compatible)
        // chainid goes in URL, not body
        const params = new URLSearchParams({
            module: "contract",
            action: "verifysourcecode",
            apikey: apiKey,
            contractaddress: address,
            sourceCode: sourceCode,
            codeformat: "solidity-single-file",
            contractname: "OsirisUSBN",
            compilerversion: "v0.8.31+commit.fd3a2265",
            optimizationUsed: "0",
            runs: "200",
            evmversion: "paris",
            licenseType: "3", // MIT
        });

        console.log("[verify-contract] Submitting V2 verification request...");

        const submitRes = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: params.toString(),
        });

        const submitJson = await submitRes.json();
        console.log("[verify-contract] Submit response:", submitJson);

        if (submitJson.status === "1" && submitJson.result) {
            // Got a GUID, need to poll for completion
            const guid = submitJson.result;

            // Poll for verification status (max 60 seconds)
            let verified = false;
            let attempts = 0;
            while (!verified && attempts < 12) {
                await new Promise(r => setTimeout(r, 5000)); // Wait 5s

                const checkUrl = `${apiUrl}&module=contract&action=checkverifystatus&guid=${guid}&apikey=${apiKey}`;

                const checkRes = await fetch(checkUrl);
                const checkJson = await checkRes.json();
                console.log(`[verify-contract] Check attempt ${attempts + 1}:`, checkJson);

                if (checkJson.status === "1" && checkJson.result === "Pass - Verified") {
                    verified = true;
                } else if (checkJson.result?.includes("Fail")) {
                    return NextResponse.json({ ok: false, error: checkJson.result }, { status: 400 });
                }

                attempts++;
            }

            if (verified) {
                return NextResponse.json({ ok: true, message: "Contract verified successfully" });
            } else {
                return NextResponse.json({ ok: false, error: "Verification timed out" }, { status: 408 });
            }
        } else if (submitJson.result?.includes("Already Verified")) {
            return NextResponse.json({ ok: true, message: "Contract already verified" });
        } else {
            return NextResponse.json({ ok: false, error: submitJson.result || "Verification failed" }, { status: 400 });
        }

    } catch (e: any) {
        console.error("[verify-contract] Error:", e);
        return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
    }
}
