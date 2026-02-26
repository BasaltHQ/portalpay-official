/**
 * Audit script: finds every Cosmos DB SQL query in the codebase and tests it
 * against the sql-parser transpiler to identify fallbacks and errors.
 *
 * Usage:  node scripts/audit-sql-queries.js
 *
 * Output: a JSON report to scripts/sql-audit-report.json
 */

const fs = require("fs");
const path = require("path");

// ═══════════════════════════════════════════════════════════════════════════
// 1. Inline copy of sql-parser.ts (transpiled to plain JS, no TS types)
// ═══════════════════════════════════════════════════════════════════════════

function parseCosmosSql(sql, parameters) {
    const params = buildParamMap(parameters);
    const norm = sql.replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim();

    // SELECT VALUE COUNT(1)
    const countMatch = /SELECT\s+VALUE\s+COUNT\s*\(\s*1\s*\)/i.exec(norm);
    if (countMatch) {
        const whereClause = extractWhere(norm);
        const filter = whereClause ? parseWhere(whereClause, params) : {};
        return {
            filter, sort: {}, projection: null, skip: 0, limit: 0,
            isAggregate: true,
            pipeline: [{ $match: filter }, { $group: { _id: null, value: { $sum: 1 } } }],
        };
    }

    // SELECT VALUE SUM(c.field)
    const sumMatch = /SELECT\s+VALUE\s+SUM\s*\(\s*c\.(\w+)\s*\)/i.exec(norm);
    if (sumMatch) {
        const field = sumMatch[1];
        const whereClause = extractWhere(norm);
        const filter = whereClause ? parseWhere(whereClause, params) : {};
        return {
            filter, sort: {}, projection: null, skip: 0, limit: 0,
            isAggregate: true,
            pipeline: [{ $match: filter }, { $group: { _id: null, value: { $sum: `$${field}` } } }],
        };
    }

    // SELECT VALUE { ... }
    const objAggMatch = /SELECT\s+VALUE\s*\{([^}]+)\}/i.exec(norm);
    if (objAggMatch) {
        const groupFields = parseGroupObject(objAggMatch[1]);
        const whereClause = extractWhere(norm);
        const filter = whereClause ? parseWhere(whereClause, params) : {};
        return {
            filter, sort: {}, projection: null, skip: 0, limit: 0,
            isAggregate: true,
            pipeline: [{ $match: filter }, { $group: { _id: null, ...groupFields } }, { $project: { _id: 0 } }],
        };
    }

    // SELECT DISTINCT VALUE c.field
    const distinctMatch = /SELECT\s+DISTINCT\s+VALUE\s+(?:c\.|m\.)(\w+)/i.exec(norm);
    if (distinctMatch) {
        const field = distinctMatch[1];
        const whereClause = extractWhere(norm);
        const filter = whereClause ? parseWhere(whereClause, params) : {};
        return {
            filter, sort: {}, projection: null, skip: 0, limit: 0,
            isAggregate: true,
            pipeline: [{ $match: filter }, { $group: { _id: `$${field}` } }, { $project: { _id: 0, value: "$_id" } }],
        };
    }

    // SELECT c.field, AGG(c.col) as alias ... GROUP BY c.field
    const groupByMatch = /GROUP\s+BY\s+(?:c\.|m\.)(\w+)/i.exec(norm);
    if (groupByMatch) {
        const groupByField = groupByMatch[1];
        const whereClause = extractWhere(norm);
        const filter = whereClause ? parseWhere(whereClause, params) : {};
        const groupFields = parseSelectGroupByColumns(norm, groupByField);
        return {
            filter, sort: {}, projection: null, skip: 0, limit: 0,
            isAggregate: true,
            pipeline: [
                { $match: filter },
                { $group: { _id: `$${groupByField}`, ...groupFields } },
            ],
        };
    }

    // Regular SELECT
    let limit = 0;
    const topMatch = /SELECT\s+TOP\s+(?:@(\w+)|(\d+))/i.exec(norm);
    if (topMatch) limit = topMatch[1] ? resolveParam(topMatch[1], params) : Number(topMatch[2]);

    const projection = parseProjection(norm);
    const whereClause = extractWhere(norm);
    const filter = whereClause ? parseWhere(whereClause, params) : {};
    const sort = parseOrderBy(norm);

    let skip = 0;
    const offsetMatch = /OFFSET\s+(?:@(\w+)|(\d+))\s+LIMIT\s+(?:@(\w+)|(\d+))/i.exec(norm);
    if (offsetMatch) {
        skip = offsetMatch[1] ? resolveParam(offsetMatch[1], params) : Number(offsetMatch[2]);
        const lim = offsetMatch[3] ? resolveParam(offsetMatch[3], params) : Number(offsetMatch[4]);
        if (lim) limit = lim;
    }

    return { filter, sort, projection, skip, limit, isAggregate: false, pipeline: [] };
}

function buildParamMap(parameters) {
    const m = {};
    for (const p of parameters || []) {
        const key = p.name.startsWith("@") ? p.name : `@${p.name}`;
        m[key] = p.value;
    }
    return m;
}

function resolveParam(name, params) {
    const key = name.startsWith("@") ? name : `@${name}`;
    return params[key];
}

function extractWhere(sql) {
    const cleaned = sql
        .replace(/\s+ORDER\s+BY\s+.*/i, "")
        .replace(/\s+GROUP\s+BY\s+.*/i, "")
        .replace(/\s+OFFSET\s+.*/i, "");
    const m = /\bWHERE\s+(.*)/i.exec(cleaned);
    return m ? m[1].trim() : null;
}

function parseWhere(where, params) {
    const tokens = splitTopLevel(where);
    if (tokens.length === 0) return {};
    if (tokens.length === 1) return parsePredicate(tokens[0].expr, params);
    const hasOr = tokens.some((t) => t.connector === "OR");
    if (hasOr) return { $or: tokens.map((t) => parsePredicate(t.expr, params)) };
    const parts = tokens.map((t) => parsePredicate(t.expr, params));
    return mergeAndFilters(parts);
}

function splitTopLevel(clause) {
    const tokens = [];
    let depth = 0;
    let current = "";
    let connector = "START";
    let inBetween = false;
    const words = clause.split(/\s+/);
    for (let i = 0; i < words.length; i++) {
        const w = words[i];
        for (const ch of w) {
            if (ch === "(") depth++;
            if (ch === ")") depth--;
        }
        if (/BETWEEN$/i.test(w)) {
            inBetween = true;
            current += (current ? " " : "") + w;
            continue;
        }
        if (depth === 0 && (w.toUpperCase() === "AND" || w.toUpperCase() === "OR")) {
            if (inBetween && w.toUpperCase() === "AND") {
                inBetween = false;
                current += " " + w;
                continue;
            }
            if (current.trim()) tokens.push({ connector, expr: current.trim() });
            connector = w.toUpperCase();
            current = "";
        } else {
            current += (current ? " " : "") + w;
        }
    }
    if (current.trim()) tokens.push({ connector, expr: current.trim() });
    return tokens;
}

let _fallbackTriggered = false;

function parsePredicate(expr, params) {
    let e = expr.trim();
    if (e.startsWith("(") && e.endsWith(")")) {
        let depth = 0;
        let balanced = true;
        for (let i = 0; i < e.length; i++) {
            if (e[i] === "(") depth++;
            if (e[i] === ")") depth--;
            if (depth === 0 && i < e.length - 1) { balanced = false; break; }
        }
        if (balanced) {
            e = e.slice(1, -1).trim();
            return parseWhere(e, params);
        }
    }

    const isDef = /^IS_DEFINED\s*\(\s*(?:c|m)\.([\.\w]+)\s*\)/i.exec(e);
    if (isDef) return { [isDef[1]]: { $exists: true } };

    const notIsDef = /^NOT\s+IS_DEFINED\s*\(\s*(?:c|m)\.([\.\w]+)\s*\)/i.exec(e);
    if (notIsDef) return { [notIsDef[1]]: { $exists: false } };

    // STARTSWITH(c.field, @param)
    const startsWith = /^STARTSWITH\s*\(\s*(?:c|m)\.([\.\w]+)\s*,\s*(.+?)\s*\)/i.exec(e);
    if (startsWith) {
        const field = startsWith[1];
        const val = resolveRhs(startsWith[2].trim(), params);
        return { [field]: { $regex: `^${escapeRegex(String(val))}` } };
    }

    // NOT STARTSWITH(c.field, @param)
    const notStartsWith = /^NOT\s+STARTSWITH\s*\(\s*(?:c|m)\.([\.\w]+)\s*,\s*(.+?)\s*\)/i.exec(e);
    if (notStartsWith) {
        const field = notStartsWith[1];
        const val = resolveRhs(notStartsWith[2].trim(), params);
        return { [field]: { $not: { $regex: `^${escapeRegex(String(val))}` } } };
    }

    // ENDSWITH(c.field, @param)
    const endsWith = /^ENDSWITH\s*\(\s*(?:c|m)\.([\.\w]+)\s*,\s*(.+?)\s*\)/i.exec(e);
    if (endsWith) {
        const field = endsWith[1];
        const val = resolveRhs(endsWith[2].trim(), params);
        return { [field]: { $regex: `${escapeRegex(String(val))}$` } };
    }

    // ABS(c.field - @param) <= @param2
    const absExpr = /^ABS\s*\(\s*(?:c|m)\.([\.\w]+)\s*-\s*(.+?)\s*\)\s*(<=|<|>=|>|=)\s*(.+)$/i.exec(e);
    if (absExpr) {
        const field = absExpr[1];
        const subtractVal = resolveRhs(absExpr[2].trim(), params);
        const op = absExpr[3];
        const threshold = resolveRhs(absExpr[4].trim(), params);
        const mongoOp = op === "<=" ? "$lte" : op === "<" ? "$lt" : op === ">=" ? "$gte" : op === ">" ? "$gt" : "$eq";
        return { $expr: { [mongoOp]: [{ $abs: { $subtract: [`$${field}`, subtractVal] } }, threshold] } };
    }

    const arrContains = /ARRAY_CONTAINS\s*\(\s*(.*?)\s*,\s*(.*?)\s*\)/i.exec(e);
    if (arrContains) {
        let first = arrContains[1].trim();
        let second = arrContains[2].trim();
        let arr = [];
        let field = "";
        if (/^(?:c|m)\./.test(first)) {
            field = first.replace(/^(?:c|m)\./, '');
            arr = resolveRhs(second, params);
        } else if (/^(?:c|m)\./.test(second)) {
            field = second.replace(/^(?:c|m)\./, '');
            arr = resolveRhs(first, params);
        }
        if (field) {
            if (typeof arr === "string" && arr.startsWith("[") && arr.endsWith("]")) {
                try { arr = JSON.parse(arr.replace(/'/g, '"')); } catch { arr = [arr]; }
            }
            return { [field]: { $in: Array.isArray(arr) ? arr : [arr] } };
        }
    }

    const strEq = /^StringEquals\s*\(\s*c\.([\.\w]+)\s*,\s*@(\w+)\s*,\s*true\s*\)/i.exec(e);
    if (strEq) {
        const val = resolveParam(strEq[2], params);
        return { [strEq[1]]: { $regex: `^${escapeRegex(String(val))}$`, $options: "i" } };
    }

    const lowerEq = /^LOWER\s*\(\s*(?:c|m)\.([\.\w]+)\s*\)\s*=\s*(.+)$/i.exec(e);
    if (lowerEq) {
        const val = resolveRhs(lowerEq[2].trim(), params);
        return { [lowerEq[1]]: { $regex: `^${escapeRegex(String(val))}$`, $options: "i" } };
    }

    const lowerIn = /^LOWER\s*\(\s*(?:c|m)\.([\.\w]+)\s*\)\s+IN\s*\(([^)]+)\)/i.exec(e);
    if (lowerIn) {
        const field = lowerIn[1];
        const vals = lowerIn[2].split(",").map((v) => v.trim().replace(/^'|'$/g, ""));
        return { [field]: { $in: vals.map((v) => new RegExp(`^${escapeRegex(v)}$`, "i")) } };
    }

    // c.field NOT IN ('a', 'b', ...)
    const notInMatch = /^(?:c|m)\.([\.\w]+)\s+NOT\s+IN\s*\(([^)]+)\)/i.exec(e);
    if (notInMatch) {
        const field = notInMatch[1];
        const vals = notInMatch[2].split(",").map((v) => {
            const trimmed = v.trim();
            if (trimmed.startsWith("'") && trimmed.endsWith("'")) return trimmed.slice(1, -1);
            if (trimmed.startsWith('"') && trimmed.endsWith('"')) return trimmed.slice(1, -1);
            if (trimmed.startsWith("@")) return resolveParam(trimmed, params);
            return isNaN(Number(trimmed)) || trimmed === "" ? trimmed : Number(trimmed);
        });
        return { [field]: { $nin: vals } };
    }

    const inMatch = /^(?:c|m)\.([\.\w]+)\s+IN\s*\(([^)]+)\)/i.exec(e);
    if (inMatch) {
        const field = inMatch[1];
        const vals = inMatch[2].split(",").map((v) => {
            const trimmed = v.trim();
            if (trimmed.startsWith("'") && trimmed.endsWith("'")) return trimmed.slice(1, -1);
            if (trimmed.startsWith('"') && trimmed.endsWith('"')) return trimmed.slice(1, -1);
            if (trimmed.startsWith("@")) return resolveParam(trimmed, params);
            return isNaN(Number(trimmed)) || trimmed === "" ? trimmed : Number(trimmed);
        });
        return { [field]: { $in: vals } };
    }

    const neq = /^(?:c|m)\.([\.\w]+)\s*!=\s*(.+)$/i.exec(e);
    if (neq) {
        const field = neq[1];
        const rhs = resolveRhs(neq[2].trim(), params);
        return { [field]: { $ne: rhs } };
    }

    const eq = /^(?:c|m)\.([\.\w]+)\s*=\s*(.+)$/i.exec(e);
    if (eq) {
        const field = eq[1];
        const rhs = resolveRhs(eq[2].trim(), params);
        return { [field]: rhs };
    }

    const gte = /^(?:c|m)\.([\.\w]+)\s*>=\s*(.+)$/i.exec(e);
    if (gte) return { [gte[1]]: { $gte: resolveRhs(gte[2].trim(), params) } };

    const lte = /^(?:c|m)\.([\.\w]+)\s*<=\s*(.+)$/i.exec(e);
    if (lte) return { [lte[1]]: { $lte: resolveRhs(lte[2].trim(), params) } };

    const gt = /^(?:c|m)\.([\.\w]+)\s*>\s*(.+)$/i.exec(e);
    if (gt) return { [gt[1]]: { $gt: resolveRhs(gt[2].trim(), params) } };

    const lt = /^(?:c|m)\.([\.\w]+)\s*<\s*(.+)$/i.exec(e);
    if (lt) return { [lt[1]]: { $lt: resolveRhs(lt[2].trim(), params) } };

    // c.field BETWEEN @a AND @b
    const between = /^(?:c|m)\.([\.\w]+)\s+BETWEEN\s+(.+?)\s+AND\s+(.+)$/i.exec(e);
    if (between) {
        const field = between[1];
        const low = resolveRhs(between[2].trim(), params);
        const high = resolveRhs(between[3].trim(), params);
        return { [field]: { $gte: low, $lte: high } };
    }

    const lenGt = /^LENGTH\s*\(\s*(?:c|m)\.([\.\w]+)\s*\)\s*>\s*(\d+)/i.exec(e);
    if (lenGt) {
        const field = lenGt[1];
        const minLen = Number(lenGt[2]);
        if (minLen === 0) return { [field]: { $exists: true, $ne: "" } };
        return { $expr: { $gt: [{ $strLenCP: `$${field}` }, minLen] } };
    }

    // *** FALLBACK — this is what we're looking for ***
    _fallbackTriggered = true;
    return {};
}

function resolveRhs(rhs, params) {
    if (rhs.startsWith("@")) return resolveParam(rhs, params);
    if (rhs.startsWith("'") && rhs.endsWith("'")) return rhs.slice(1, -1);
    if (rhs === "true") return true;
    if (rhs === "false") return false;
    if (rhs === "null") return null;
    if (!isNaN(Number(rhs))) return Number(rhs);
    return rhs;
}

function parseOrderBy(sql) {
    const m = /ORDER\s+BY\s+(.*?)(?:\s+OFFSET|\s*$)/i.exec(sql);
    if (!m) return {};
    const sort = {};
    const parts = m[1].split(",");
    for (const part of parts) {
        const pm = /c\.([\.\w]+)\s*(ASC|DESC)?/i.exec(part.trim());
        if (pm) sort[pm[1]] = pm[2]?.toUpperCase() === "DESC" ? -1 : 1;
    }
    return sort;
}

function parseProjection(sql) {
    if (/^SELECT\s+(\*|TOP\s+\d+\s+\*)/i.test(sql.trim())) return null;
    if (/^SELECT\s+TOP\s+\d+\s+\*/i.test(sql.trim())) return null;
    const selMatch = /^SELECT\s+(?:TOP\s+\d+\s+)?(.+?)\s+FROM\s/i.exec(sql.trim());
    if (!selMatch) return null;
    const cols = selMatch[1];
    if (cols.trim() === "*") return null;
    if (cols.trim() === "c") return null;
    const fields = cols.split(",").map((f) => f.trim());
    const proj = {};
    for (const f of fields) {
        const fm = /^c\.([\.\w]+)$/i.exec(f.trim());
        if (fm) proj[fm[1]] = 1;
    }
    return Object.keys(proj).length > 0 ? proj : null;
}

function parseGroupObject(inner) {
    const group = {};
    const parts = inner.split(",");
    for (const part of parts) {
        const m = /(\w+)\s*:\s*(SUM|COUNT|AVG|MIN|MAX)\s*\(\s*(?:c\.)?(\w+|1)\s*\)/i.exec(part.trim());
        if (m) {
            const alias = m[1];
            const op = m[2].toLowerCase();
            const field = m[3] === "1" ? 1 : `$${m[3]}`;
            if (op === "count") group[alias] = { $sum: 1 };
            else group[alias] = { [`$${op}`]: field };
        }
    }
    return group;
}

function parseSelectGroupByColumns(sql, groupByField) {
    const group = {};
    const selMatch = /^SELECT\s+(?:TOP\s+\d+\s+)?(.+?)\s+FROM\s/i.exec(sql.trim());
    if (!selMatch) return group;
    const cols = selMatch[1];
    const parts = cols.split(",");
    for (const part of parts) {
        const aggMatch = /(SUM|COUNT|AVG|MIN|MAX)\s*\(\s*(?:c\.)?(\w+|1)\s*\)\s+(?:as|AS)\s+(\w+)/i.exec(part.trim());
        if (aggMatch) {
            const op = aggMatch[1].toLowerCase();
            const field = aggMatch[2] === "1" ? 1 : `$${aggMatch[2]}`;
            const alias = aggMatch[3];
            if (op === "count") group[alias] = { $sum: 1 };
            else group[alias] = { [`$${op}`]: field };
        }
    }
    return group;
}

function mergeAndFilters(parts) {
    const result = {};
    const conflicts = [];
    for (const p of parts) {
        for (const [key, val] of Object.entries(p)) {
            if (key === "$or" || key === "$and" || key === "$expr") { conflicts.push(p); break; }
            if (key in result) { conflicts.push(p); break; }
            result[key] = val;
        }
    }
    if (conflicts.length === 0) return result;
    return { $and: parts };
}

function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. Walk the source tree and extract SQL queries
// ═══════════════════════════════════════════════════════════════════════════

function walkDir(dir, exts, results = []) {
    if (!fs.existsSync(dir)) return results;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === "node_modules" || entry.name === ".next" || entry.name === ".git") continue;
            walkDir(full, exts, results);
        } else if (exts.some(ext => entry.name.endsWith(ext))) {
            results.push(full);
        }
    }
    return results;
}

function extractQueries(filePath) {
    const content = fs.readFileSync(filePath, "utf8");
    const found = [];

    // Pattern 1: query: "SELECT ..." or query: `SELECT ...`
    const re1 = /query:\s*(?:"(SELECT[^"]*?)"|`(SELECT[^`]*?)`|'(SELECT[^']*?)')/gi;
    let m;
    while ((m = re1.exec(content)) !== null) {
        const sql = (m[1] || m[2] || m[3]).replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim();
        const line = content.substring(0, m.index).split("\n").length;
        found.push({ sql, line, source: "query_prop" });
    }

    // Pattern 2: .query("SELECT ..." or .query(`SELECT ...`
    const re2 = /\.query\(\s*(?:"(SELECT[^"]*?)"|`(SELECT[^`]*?)`|'(SELECT[^']*?)')\s*[,)]/gi;
    while ((m = re2.exec(content)) !== null) {
        const sql = (m[1] || m[2] || m[3]).replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim();
        const line = content.substring(0, m.index).split("\n").length;
        // Dedupe against pattern 1
        if (!found.some(f => f.sql === sql && Math.abs(f.line - line) < 5)) {
            found.push({ sql, line, source: "query_call" });
        }
    }

    // Pattern 3: const query = "SELECT ..."
    const re3 = /(?:const|let|var)\s+\w+\s*=\s*(?:"(SELECT[^"]*?)"|`(SELECT[^`]*?)`|'(SELECT[^']*?)')/gi;
    while ((m = re3.exec(content)) !== null) {
        const sql = (m[1] || m[2] || m[3]).replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim();
        const line = content.substring(0, m.index).split("\n").length;
        if (!found.some(f => f.sql === sql && Math.abs(f.line - line) < 5)) {
            found.push({ sql, line, source: "const_query" });
        }
    }

    return found;
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. Test each query and produce the report
// ═══════════════════════════════════════════════════════════════════════════

const srcDir = path.join(__dirname, "..", "src");
const files = walkDir(srcDir, [".ts", ".tsx"]);

console.log(`Scanning ${files.length} files for SQL queries...\n`);

const report = {
    totalFiles: files.length,
    totalQueries: 0,
    ok: [],
    fallback: [],
    error: [],
    dynamic: [],
};

// Fake parameters for testing — covers common param names
const fakeParams = [
    { name: "@wallet", value: "0x0000000000000000000000000000000000000000" },
    { name: "@w", value: "0x0000000000000000000000000000000000000000" },
    { name: "@slug", value: "test-slug" },
    { name: "@type", value: "site_config" },
    { name: "@id", value: "test-id" },
    { name: "@s", value: "test-sub" },
    { name: "@p", value: "test-plan" },
    { name: "@key", value: "test-key" },
    { name: "@hash", value: "abc123" },
    { name: "@status", value: "active" },
    { name: "@category", value: "test" },
    { name: "@now", value: Date.now() },
    { name: "@addr", value: "0x0000000000000000000000000000000000000000" },
    { name: "@t", value: "conversation" },
    { name: "@d", value: "2025-01-01" },
    { name: "@date", value: "2025-01-01" },
    { name: "@mock", value: "mock" },
    { name: "@start", value: "2025-01-01" },
    { name: "@end", value: "2025-12-31" },
    { name: "@brandKey", value: "basaltsurge" },
    { name: "@offset", value: 0 },
    { name: "@limit", value: 50 },
    { name: "@wallets", value: ["0x0000000000000000000000000000000000000000"] },
    { name: "@merchant", value: "0x0000000000000000000000000000000000000000" },
    { name: "@buyer", value: "0x0000000000000000000000000000000000000000" },
    { name: "@tx", value: "0x123" },
    { name: "@txHash", value: "0x123" },
    { name: "@prefix", value: "rcpt_" },
    { name: "@total", value: 100 },
    { name: "@tol", value: 1 },
    { name: "@zero", value: 0 },
    { name: "@walletLower", value: "0x0000000000000000000000000000000000000000" },
    { name: "@minUsd", value: 0 },
    { name: "@maxUsd", value: 99999 },
    { name: "@me", value: "0x0000000000000000000000000000000000000000" },
    { name: "@shortId", value: "abc" },
    { name: "@orderId", value: "order123" },
    { name: "@memberId", value: "member1" },
    { name: "@sid", value: "session1" },
    { name: "@brand", value: "basaltsurge" },
    { name: "@since", value: Date.now() - 86400000 },
    { name: "@top", value: 50 },
    { name: "@lim", value: 50 },
    { name: "@app", value: "portalpay" },
    { name: "@folioId", value: "folio1" },
    { name: "@author", value: "0x0000000000000000000000000000000000000000" },
    { name: "@b", value: "basaltsurge" },
    { name: "@domain", value: "example.com" },
    { name: "@walletAddress", value: "0x0000000000000000000000000000000000000000" },
    { name: "@usbn", value: "1234" },
    { name: "@cutoff", value: Date.now() - 120000 },
];

for (const file of files) {
    const relPath = path.relative(path.join(__dirname, ".."), file).replace(/\\/g, "/");
    const queries = extractQueries(file);

    for (const { sql, line, source } of queries) {
        report.totalQueries++;

        // Skip dynamic template expressions
        if (sql.includes("${")) {
            report.dynamic.push({ file: relPath, line, sql, source });
            continue;
        }

        _fallbackTriggered = false;

        try {
            const result = parseCosmosSql(sql, fakeParams);
            if (_fallbackTriggered) {
                report.fallback.push({ file: relPath, line, sql, source });
            } else {
                report.ok.push({ file: relPath, line, sql, source });
            }
        } catch (err) {
            report.error.push({ file: relPath, line, sql, source, error: err.message });
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. Output results
// ═══════════════════════════════════════════════════════════════════════════

console.log("══════════════════════════════════════════════════════════════");
console.log("  SQL QUERY AUDIT REPORT");
console.log("══════════════════════════════════════════════════════════════\n");

console.log(`Total queries found: ${report.totalQueries}`);
console.log(`  ✅ OK (transpile cleanly):  ${report.ok.length}`);
console.log(`  ⚠️  FALLBACK (silent fail): ${report.fallback.length}`);
console.log(`  ❌ ERROR (crash):           ${report.error.length}`);
console.log(`  🔀 DYNAMIC (template):      ${report.dynamic.length}`);
console.log();

if (report.fallback.length > 0) {
    console.log("── FALLBACK QUERIES (predicates silently ignored) ──────────\n");
    for (const q of report.fallback) {
        console.log(`  File: ${q.file}:${q.line}`);
        console.log(`  SQL:  ${q.sql}\n`);
    }
}

if (report.error.length > 0) {
    console.log("── ERROR QUERIES (parser crashes) ──────────────────────────\n");
    for (const q of report.error) {
        console.log(`  File: ${q.file}:${q.line}`);
        console.log(`  SQL:  ${q.sql}`);
        console.log(`  Err:  ${q.error}\n`);
    }
}

if (report.dynamic.length > 0) {
    console.log("── DYNAMIC QUERIES (contain ${...} — need manual review) ───\n");
    for (const q of report.dynamic) {
        console.log(`  File: ${q.file}:${q.line}`);
        console.log(`  SQL:  ${q.sql}\n`);
    }
}

// Write JSON report
const reportPath = path.join(__dirname, "sql-audit-report.json");
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`\nFull report saved to: ${reportPath}`);
