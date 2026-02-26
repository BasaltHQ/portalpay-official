import { Project, SyntaxKind, StringLiteral, TemplateExpression } from "ts-morph";
import { parseCosmosSql } from "../lib/db/sql-parser";

const project = new Project({
    tsConfigFilePath: "tsconfig.json",
});

const sourceFiles = project.getSourceFiles("src/**/*.ts").concat(project.getSourceFiles("src/**/*.tsx"));

let totalQueries = 0;
let failedQueries = 0;
let fallbackQueries = 0;

console.log(`Analyzing ${sourceFiles.length} files...`);

for (const sf of sourceFiles) {
    // Find all calls to .query(
    const calls = sf.getDescendantsOfKind(SyntaxKind.CallExpression);
    for (const call of calls) {
        const expression = call.getExpression();
        if (expression.getKind() === SyntaxKind.PropertyAccessExpression) {
            const propAccess = expression.asKind(SyntaxKind.PropertyAccessExpression);
            if (propAccess?.getName() === "query") {
                const args = call.getArguments();
                if (args.length === 0) continue;

                const firstArg = args[0];
                let sqlString: string | null = null;
                let isDynamic = false;

                // Case 1: .query("SELECT ...") or .query(`SELECT ...`)
                if (firstArg.getKind() === SyntaxKind.StringLiteral || firstArg.getKind() === SyntaxKind.NoSubstitutionTemplateLiteral) {
                    sqlString = firstArg.getText().slice(1, -1);
                }
                else if (firstArg.getKind() === SyntaxKind.TemplateExpression) {
                    sqlString = firstArg.getText(); // Keep full text for logging
                    isDynamic = true;
                }
                // Case 2: .query({ query: "..." })
                else if (firstArg.getKind() === SyntaxKind.ObjectLiteralExpression) {
                    const obj = firstArg.asKind(SyntaxKind.ObjectLiteralExpression);
                    const queryProp = obj?.getProperty("query");
                    if (queryProp && queryProp.getKind() === SyntaxKind.PropertyAssignment) {
                        const init = queryProp.asKind(SyntaxKind.PropertyAssignment)?.getInitializer();
                        if (init) {
                            if (init.getKind() === SyntaxKind.StringLiteral || init.getKind() === SyntaxKind.NoSubstitutionTemplateLiteral) {
                                sqlString = init.getText().slice(1, -1);
                            } else if (init.getKind() === SyntaxKind.TemplateExpression) {
                                sqlString = init.getText();
                                isDynamic = true;
                            } else {
                                // E.g. variable reference
                                sqlString = `[Dynamic/Variable] ${init.getText()}`;
                                isDynamic = true;
                            }
                        }
                    }
                }

                // If we found a query that looks like SQL
                if (sqlString && typeof sqlString === "string" && sqlString.toUpperCase().includes("SELECT ")) {
                    totalQueries++;
                    if (isDynamic && sqlString.includes("${")) {
                        // Hard to parse statically if it has template vars inside the string
                        console.log(`\n[DYNAMIC TEMPLATE] file: ${sf.getFilePath()}`);
                        console.log(`Query: ${sqlString}`);
                        continue;
                    }

                    // Try to parse it
                    try {
                        const originalWarn = console.warn;
                        let warned = false;
                        console.warn = (...args) => {
                            warned = true;
                        };

                        // We dummy-mock parameters
                        const fakeParams = [{ name: "@mock", value: "mock" }];
                        parseCosmosSql(sqlString, fakeParams);

                        console.warn = originalWarn;

                        if (warned) {
                            fallbackQueries++;
                            console.log(`\n[FALLBACK TRIGGERED] file: ${sf.getFilePath()}`);
                            console.log(`Query: ${sqlString}`);
                        }
                    } catch (err: any) {
                        failedQueries++;
                        console.log(`\n[ERROR TRIGGERED] file: ${sf.getFilePath()}`);
                        console.log(`Query: ${sqlString}`);
                        console.log(`Error: ${err.message}`);
                    }
                }
            }
        }
    }
}

console.log("\n--- SUMMARY ---");
console.log(`Total SQL queries found: ${totalQueries}`);
console.log(`Queries triggering fallbacks: ${fallbackQueries}`);
console.log(`Queries throwing errors: ${failedQueries}`);
