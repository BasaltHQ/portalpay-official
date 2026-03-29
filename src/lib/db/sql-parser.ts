/**
 * Cosmos DB SQL → MongoDB query transpiler.
 *
 * Handles the *subset* of Cosmos DB SQL that this codebase actually uses:
 *   SELECT *, SELECT c.a, c.b, SELECT TOP N, SELECT VALUE COUNT/SUM/{obj}
 *   WHERE c.field = @param, AND, OR, IN (...), IS_DEFINED, LOWER(), !=,
 *         StringEquals(a,b,true), ARRAY_CONTAINS(@arr, c.field), LENGTH()
 *   ORDER BY c.field ASC|DESC
 *   OFFSET N LIMIT M
 *
 * NOT a general-purpose SQL parser — only covers patterns found via grep.
 */

import type { Filter, Sort, Document } from "mongodb";

// ── Public API ──────────────────────────────────────────────────────────

export interface ParsedQuery {
    /** MongoDB filter document */
    filter: Filter<Document>;
    /** MongoDB sort document (may be empty) */
    sort: Sort;
    /** MongoDB projection (null = all fields) */
    projection: Document | null;
    /** Number of docs to skip */
    skip: number;
    /** Max docs to return (0 = unlimited) */
    limit: number;
    /** If true, result should be unwrapped via aggregation */
    isAggregate: boolean;
    /** The aggregation pipeline (only set when isAggregate===true) */
    pipeline: Document[];
}

/**
 * Translate a Cosmos DB SQL query + parameters into MongoDB primitives.
 */
export function parseCosmosSql(
    sql: string,
    parameters?: { name: string; value: any }[]
): ParsedQuery {
    const params = buildParamMap(parameters);

    // Normalise whitespace – keep original casing for string literals
    const norm = sql.replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim();

    // ── Detect aggregation queries ────────────────────────────────────
    // SELECT VALUE COUNT(1) ...
    const countMatch = /SELECT\s+VALUE\s+COUNT\s*\(\s*1\s*\)/i.exec(norm);
    if (countMatch) {
        const whereClause = extractWhere(norm);
        const filter = whereClause ? parseWhere(whereClause, params) : {};
        return {
            filter,
            sort: {},
            projection: null,
            skip: 0,
            limit: 0,
            isAggregate: true,
            pipeline: [
                { $match: filter },
                { $group: { _id: null, value: { $sum: 1 } } },
            ],
        };
    }

    // SELECT VALUE SUM(c.field) ...
    const sumMatch = /SELECT\s+VALUE\s+SUM\s*\(\s*c\.(\w+)\s*\)/i.exec(norm);
    if (sumMatch) {
        const field = sumMatch[1];
        const whereClause = extractWhere(norm);
        const filter = whereClause ? parseWhere(whereClause, params) : {};
        return {
            filter,
            sort: {},
            projection: null,
            skip: 0,
            limit: 0,
            isAggregate: true,
            pipeline: [
                { $match: filter },
                { $group: { _id: null, value: { $sum: `$${field}` } } },
            ],
        };
    }

    // SELECT VALUE { totalSales: SUM(c.totalUsd), totalTips: SUM(c.tipAmount), ... }
    const objAggMatch = /SELECT\s+VALUE\s*\{([^}]+)\}/i.exec(norm);
    if (objAggMatch) {
        const groupFields = parseGroupObject(objAggMatch[1]);
        const whereClause = extractWhere(norm);
        const filter = whereClause ? parseWhere(whereClause, params) : {};
        return {
            filter,
            sort: {},
            projection: null,
            skip: 0,
            limit: 0,
            isAggregate: true,
            pipeline: [
                { $match: filter },
                { $group: { _id: null, ...groupFields } },
                { $project: { _id: 0 } },
            ],
        };
    }

    // SELECT DISTINCT VALUE c.field FROM c WHERE ...
    const distinctMatch = /SELECT\s+DISTINCT\s+VALUE\s+(?:c\.|m\.)(\w+)/i.exec(norm);
    if (distinctMatch) {
        const field = distinctMatch[1];
        const whereClause = extractWhere(norm);
        const filter = whereClause ? parseWhere(whereClause, params) : {};
        return {
            filter,
            sort: {},
            projection: null,
            skip: 0,
            limit: 0,
            isAggregate: true,
            pipeline: [
                { $match: filter },
                { $group: { _id: `$${field}` } },
                { $project: { _id: 0, value: "$_id" } },
            ],
        };
    }

    // SELECT c.field, AGG(c.col) as alias ... GROUP BY c.field
    const groupByMatch = /GROUP\s+BY\s+(?:c\.|m\.)(\w+)/i.exec(norm);
    if (groupByMatch) {
        const groupByField = groupByMatch[1];
        const whereClause = extractWhere(norm);
        const filter = whereClause ? parseWhere(whereClause, params) : {};
        // Parse aggregation columns from the SELECT clause
        const groupFields = parseSelectGroupByColumns(norm, groupByField);
        return {
            filter,
            sort: {},
            projection: null,
            skip: 0,
            limit: 0,
            isAggregate: true,
            pipeline: [
                { $match: filter },
                { $group: { _id: `$${groupByField}`, ...groupFields } },
                { $project: { _id: 0, [groupByField]: "$_id", ...Object.fromEntries(Object.keys(groupFields).map(k => [k, 1])) } },
            ],
        };
    }

    // ── Regular SELECT ────────────────────────────────────────────────
    let limit = 0;

    // SELECT TOP N ... (N can be a number or @param)
    const topMatch = /SELECT\s+TOP\s+(?:@(\w+)|(\d+))/i.exec(norm);
    if (topMatch) {
        limit = topMatch[1] ? resolveParam(topMatch[1], params) : Number(topMatch[2]);
    }

    // Projection
    const projection = parseProjection(norm);

    // WHERE
    const whereClause = extractWhere(norm);
    const filter = whereClause ? parseWhere(whereClause, params) : {};

    // ORDER BY
    const sort = parseOrderBy(norm);

    // OFFSET ... LIMIT ...
    let skip = 0;
    const offsetMatch = /OFFSET\s+(?:@(\w+)|(\d+))\s+LIMIT\s+(?:@(\w+)|(\d+))/i.exec(norm);
    if (offsetMatch) {
        skip = offsetMatch[1] ? resolveParam(offsetMatch[1], params) : Number(offsetMatch[2]);
        const lim = offsetMatch[3] ? resolveParam(offsetMatch[3], params) : Number(offsetMatch[4]);
        if (lim) limit = lim;
    }

    return { filter, sort, projection, skip, limit, isAggregate: false, pipeline: [] };
}

// ── Internals ───────────────────────────────────────────────────────────

function buildParamMap(parameters?: { name: string; value: any }[]): Record<string, any> {
    const m: Record<string, any> = {};
    for (const p of parameters || []) {
        const key = p.name.startsWith("@") ? p.name : `@${p.name}`;
        m[key] = p.value;
    }
    return m;
}

function resolveParam(name: string, params: Record<string, any>): any {
    const key = name.startsWith("@") ? name : `@${name}`;
    return params[key];
}

/** Extract the WHERE clause body from full SQL */
function extractWhere(sql: string): string | null {
    // Remove everything after ORDER BY / OFFSET / LIMIT for safety
    const cleaned = sql
        .replace(/\s+ORDER\s+BY\s+.*/i, "")
        .replace(/\s+GROUP\s+BY\s+.*/i, "")
        .replace(/\s+OFFSET\s+.*/i, "");
    const m = /\bWHERE\s+(.*)/i.exec(cleaned);
    return m ? m[1].trim() : null;
}

/**
 * Parse a WHERE clause into a MongoDB filter.
 * Handles AND, OR, parenthesised groups, and individual predicates.
 */
function parseWhere(where: string, params: Record<string, any>): Filter<Document> {
    // Top-level split on AND / OR (respecting parentheses)
    const tokens = splitTopLevel(where);

    if (tokens.length === 0) return {};

    // If there's only one token, parse it directly
    if (tokens.length === 1) {
        return parsePredicate(tokens[0].expr, params);
    }

    // Group by connector
    // All ANDs or all ORs at top level – the codebase doesn't mix them outside parens
    const hasOr = tokens.some((t) => t.connector === "OR");
    if (hasOr) {
        // Treat entire clause as $or
        return { $or: tokens.map((t) => parsePredicate(t.expr, params)) };
    }

    // All AND (default)
    const parts = tokens.map((t) => parsePredicate(t.expr, params));
    return mergeAndFilters(parts);
}

interface Token {
    connector: "AND" | "OR" | "START";
    expr: string;
}

/**
 * Split a WHERE clause into top-level expressions, respecting parentheses.
 */
function splitTopLevel(clause: string): Token[] {
    const tokens: Token[] = [];
    let depth = 0;
    let current = "";
    let connector: "AND" | "OR" | "START" = "START";
    let inBetween = false; // Track BETWEEN ... AND ... context

    const words = clause.split(/\s+/);
    for (let i = 0; i < words.length; i++) {
        const w = words[i];
        // Count parens
        for (const ch of w) {
            if (ch === "(") depth++;
            if (ch === ")") depth--;
        }

        // Detect BETWEEN keyword to skip its AND
        if (/BETWEEN$/i.test(w)) {
            inBetween = true;
            current += (current ? " " : "") + w;
            continue;
        }

        if (depth === 0 && (w.toUpperCase() === "AND" || w.toUpperCase() === "OR")) {
            // If we're inside a BETWEEN, this AND is part of the expression, not a boolean connector
            if (inBetween && w.toUpperCase() === "AND") {
                inBetween = false;
                current += " " + w;
                continue;
            }
            if (current.trim()) {
                tokens.push({ connector, expr: current.trim() });
            }
            connector = w.toUpperCase() as "AND" | "OR";
            current = "";
        } else {
            current += (current ? " " : "") + w;
        }
    }
    if (current.trim()) {
        tokens.push({ connector, expr: current.trim() });
    }
    return tokens;
}

/**
 * Parse a single predicate (may be parenthesised sub-expression).
 */
function parsePredicate(expr: string, params: Record<string, any>): Filter<Document> {
    let e = expr.trim();

    // Strip outer parens
    if (e.startsWith("(") && e.endsWith(")")) {
        // Verify balanced
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

    // IS_DEFINED(c.field)
    const isDef = /^IS_DEFINED\s*\(\s*c\.([.\w]+)\s*\)/i.exec(e);
    if (isDef) {
        return { [cosmosFieldToMongo(isDef[1])]: { $exists: true } };
    }

    // NOT IS_DEFINED(c.field)
    const notIsDef = /^NOT\s+IS_DEFINED\s*\(\s*c\.([.\w]+)\s*\)/i.exec(e);
    if (notIsDef) {
        return { [cosmosFieldToMongo(notIsDef[1])]: { $exists: false } };
    }

    // STARTSWITH(c.field, @param)
    const startsWith = /^STARTSWITH\s*\(\s*c\.([.\w]+)\s*,\s*(.+?)\s*\)/i.exec(e);
    if (startsWith) {
        const field = cosmosFieldToMongo(startsWith[1]);
        const val = resolveRhs(startsWith[2].trim(), params);
        return { [field]: { $regex: `^${escapeRegex(String(val))}` } };
    }

    // NOT STARTSWITH(c.field, @param)
    const notStartsWith = /^NOT\s+STARTSWITH\s*\(\s*c\.([.\w]+)\s*,\s*(.+?)\s*\)/i.exec(e);
    if (notStartsWith) {
        const field = cosmosFieldToMongo(notStartsWith[1]);
        const val = resolveRhs(notStartsWith[2].trim(), params);
        return { [field]: { $not: { $regex: `^${escapeRegex(String(val))}` } } };
    }

    // ENDSWITH(c.field, @param)
    const endsWith = /^ENDSWITH\s*\(\s*c\.([.\w]+)\s*,\s*(.+?)\s*\)/i.exec(e);
    if (endsWith) {
        const field = cosmosFieldToMongo(endsWith[1]);
        const val = resolveRhs(endsWith[2].trim(), params);
        return { [field]: { $regex: `${escapeRegex(String(val))}$` } };
    }

    // ABS(c.field - @param) <= @param2
    const absExpr = /^ABS\s*\(\s*c\.([.\w]+)\s*-\s*(.+?)\s*\)\s*(<=|<|>=|>|=)\s*(.+)$/i.exec(e);
    if (absExpr) {
        const field = cosmosFieldToMongo(absExpr[1]);
        const subtractVal = resolveRhs(absExpr[2].trim(), params);
        const op = absExpr[3];
        const threshold = resolveRhs(absExpr[4].trim(), params);
        const mongoOp = op === "<=" ? "$lte" : op === "<" ? "$lt" : op === ">=" ? "$gte" : op === ">" ? "$gt" : "$eq";
        return { $expr: { [mongoOp]: [{ $abs: { $subtract: [`$${field}`, subtractVal] } }, threshold] } };
    }

    // ARRAY_CONTAINS(@param, c.field) OR ARRAY_CONTAINS(["a","b"], c.field) OR ARRAY_CONTAINS(c.field, @param)
    const arrContains = /ARRAY_CONTAINS\s*\(\s*(.*?)\s*,\s*(.*?)\s*\)/i.exec(e);
    if (arrContains) {
        let first = arrContains[1].trim();
        let second = arrContains[2].trim();
        let arr: any = [];
        let field = "";

        // Resolve which one is the array and which one is the field
        if (first.startsWith("c.")) {
            field = cosmosFieldToMongo(first.slice(2));
            arr = resolveRhs(second, params);
        } else if (second.startsWith("c.")) {
            field = cosmosFieldToMongo(second.slice(2));
            arr = resolveRhs(first, params);
        }

        if (field) {
            // Handle literal array strings like ["a", "b"]
            if (typeof arr === "string" && arr.startsWith("[") && arr.endsWith("]")) {
                try {
                    // Primitive JSON parse for simple string/number arrays
                    arr = JSON.parse(arr.replace(/'/g, '"'));
                } catch {
                    arr = [arr];
                }
            }
            return { [field]: { $in: Array.isArray(arr) ? arr : [arr] } };
        }
    }

    // StringEquals(c.field, @param, true)  → case-insensitive
    const strEq = /^StringEquals\s*\(\s*c\.([.\w]+)\s*,\s*@(\w+)\s*,\s*true\s*\)/i.exec(e);
    if (strEq) {
        const val = resolveParam(strEq[2], params);
        return { [cosmosFieldToMongo(strEq[1])]: { $regex: `^${escapeRegex(String(val))}$`, $options: "i" } };
    }

    // LOWER(c.field) = @param or LOWER(c.field) = 'literal'
    const lowerEq = /^LOWER\s*\(\s*c\.([.\w]+)\s*\)\s*=\s*(.+)$/i.exec(e);
    if (lowerEq) {
        const val = resolveRhs(lowerEq[2].trim(), params);
        return { [cosmosFieldToMongo(lowerEq[1])]: { $regex: `^${escapeRegex(String(val))}$`, $options: "i" } };
    }

    // CONTAINS(LOWER(c.field), @param)
    const containsLower = /^CONTAINS\s*\(\s*LOWER\s*\(\s*c\.([.\w]+)\s*\)\s*,\s*(.+?)\s*\)/i.exec(e);
    if (containsLower) {
        const field = cosmosFieldToMongo(containsLower[1]);
        const val = resolveRhs(containsLower[2].trim(), params);
        return { [field]: { $regex: escapeRegex(String(val)), $options: "i" } };
    }

    // CONTAINS(c.field, @param)
    const containsExpr = /^CONTAINS\s*\(\s*c\.([.\w]+)\s*,\s*(.+?)\s*\)/i.exec(e);
    if (containsExpr) {
        const field = cosmosFieldToMongo(containsExpr[1]);
        const val = resolveRhs(containsExpr[2].trim(), params);
        return { [field]: { $regex: escapeRegex(String(val)) } };
    }

    // EXISTS(SELECT VALUE kw FROM kw IN c.field WHERE CONTAINS(LOWER(kw), @param))
    const existsContains = /^EXISTS\s*\(\s*SELECT\s+VALUE\s+\w+\s+FROM\s+\w+\s+IN\s+c\.([.\w]+)\s+WHERE\s+CONTAINS\s*\(\s*LOWER\s*\(\s*\w+\s*\)\s*,\s*(.+?)\s*\)\s*\)/i.exec(e);
    if (existsContains) {
        const field = cosmosFieldToMongo(existsContains[1]);
        const val = resolveRhs(existsContains[2].trim(), params);
        // MongoDB natively applies regex element-wise to string arrays!
        return { [field]: { $regex: escapeRegex(String(val)), $options: "i" } };
    }

    // EXISTS(SELECT VALUE kw FROM kw IN c.field WHERE LOWER(kw) = @param)
    const existsLowerEq = /^EXISTS\s*\(\s*SELECT\s+VALUE\s+\w+\s+FROM\s+\w+\s+IN\s+c\.([.\w]+)\s+WHERE\s+LOWER\s*\(\s*\w+\s*\)\s*=\s*(.+?)\s*\)/i.exec(e);
    if (existsLowerEq) {
        const field = cosmosFieldToMongo(existsLowerEq[1]);
        const val = resolveRhs(existsLowerEq[2].trim(), params);
        return { [field]: { $regex: `^${escapeRegex(String(val))}$`, $options: "i" } };
    }

    // LOWER(c.field) IN ('a', 'b', ...)
    const lowerIn = /^LOWER\s*\(\s*c\.([.\w]+)\s*\)\s+IN\s*\(([^)]+)\)/i.exec(e);
    if (lowerIn) {
        const field = cosmosFieldToMongo(lowerIn[1]);
        const vals = lowerIn[2].split(",").map((v) => v.trim().replace(/^'|'$/g, ""));
        // Case-insensitive $in using regex
        return { [field]: { $in: vals.map((v) => new RegExp(`^${escapeRegex(v)}$`, "i")) } };
    }

    // c.field NOT IN ('a', 'b', ...)
    const notInMatch = /^c\.([.\w]+)\s+NOT\s+IN\s*\(([^)]+)\)/i.exec(e);
    if (notInMatch) {
        const field = cosmosFieldToMongo(notInMatch[1]);
        const vals = notInMatch[2].split(",").map((v) => {
            const trimmed = v.trim();
            if (trimmed.startsWith("'") && trimmed.endsWith("'")) return trimmed.slice(1, -1);
            if (trimmed.startsWith('"') && trimmed.endsWith('"')) return trimmed.slice(1, -1);
            if (trimmed.startsWith("@")) return resolveParam(trimmed, params);
            return isNaN(Number(trimmed)) || trimmed === "" ? trimmed : Number(trimmed);
        });
        return { [field]: { $nin: vals } };
    }

    // c.field IN ('a', 'b', ...)
    const inMatch = /^c\.([.\w]+)\s+IN\s*\(([^)]+)\)/i.exec(e);
    if (inMatch) {
        const field = cosmosFieldToMongo(inMatch[1]);
        const vals = inMatch[2].split(",").map((v) => {
            const trimmed = v.trim();
            if (trimmed.startsWith("'") && trimmed.endsWith("'")) return trimmed.slice(1, -1);
            if (trimmed.startsWith('"') && trimmed.endsWith('"')) return trimmed.slice(1, -1);
            if (trimmed.startsWith("@")) return resolveParam(trimmed, params);
            return isNaN(Number(trimmed)) || trimmed === "" ? trimmed : Number(trimmed);
        });
        return { [field]: { $in: vals } };
    }

    // c.field != @param  or  c.field != 'literal'  or  c.field != null
    const neq = /^c\.([.\w]+)\s*!=\s*(.+)$/i.exec(e);
    if (neq) {
        const field = cosmosFieldToMongo(neq[1]);
        const rhs = resolveRhs(neq[2].trim(), params);
        return { [field]: { $ne: rhs } };
    }

    // c.field = @param  or  c.field = 'literal'  or  c.field = true
    const eq = /^c\.([.\w]+)\s*=\s*(.+)$/i.exec(e);
    if (eq) {
        const field = cosmosFieldToMongo(eq[1]);
        const rhs = resolveRhs(eq[2].trim(), params);
        return { [field]: rhs };
    }

    // c.field >= @param
    const gte = /^c\.([.\w]+)\s*>=\s*(.+)$/i.exec(e);
    if (gte) {
        const field = cosmosFieldToMongo(gte[1]);
        return { [field]: { $gte: resolveRhs(gte[2].trim(), params) } };
    }

    // c.field <= @param
    const lte = /^c\.([.\w]+)\s*<=\s*(.+)$/i.exec(e);
    if (lte) {
        const field = cosmosFieldToMongo(lte[1]);
        return { [field]: { $lte: resolveRhs(lte[2].trim(), params) } };
    }

    // c.field > @param
    const gt = /^c\.([.\w]+)\s*>\s*(.+)$/i.exec(e);
    if (gt) {
        const field = cosmosFieldToMongo(gt[1]);
        return { [field]: { $gt: resolveRhs(gt[2].trim(), params) } };
    }

    // c.field < @param
    const lt = /^c\.([.\w]+)\s*<\s*(.+)$/i.exec(e);
    if (lt) {
        const field = cosmosFieldToMongo(lt[1]);
        return { [field]: { $lt: resolveRhs(lt[2].trim(), params) } };
    }

    // c.field BETWEEN @a AND @b
    const between = /^c\.([.\w]+)\s+BETWEEN\s+(.+?)\s+AND\s+(.+)$/i.exec(e);
    if (between) {
        const field = cosmosFieldToMongo(between[1]);
        const low = resolveRhs(between[2].trim(), params);
        const high = resolveRhs(between[3].trim(), params);
        return { [field]: { $gte: low, $lte: high } };
    }

    // LENGTH(c.field) > 0
    const lenGt = /^LENGTH\s*\(\s*c\.([.\w]+)\s*\)\s*>\s*(\d+)/i.exec(e);
    if (lenGt) {
        const field = cosmosFieldToMongo(lenGt[1]);
        const minLen = Number(lenGt[2]);
        if (minLen === 0) {
            // LENGTH > 0 means field exists and is non-empty
            return { [field]: { $exists: true, $ne: "" } };
        }
        return { $expr: { $gt: [{ $strLenCP: `$${field}` }, minLen] } };
    }

    // Fallback: return empty filter and log warning
    console.warn(`[sql-parser] Unrecognised predicate: ${expr}`);
    return {};
}

/** Convert c.field.subfield notation to MongoDB dot notation */
function cosmosFieldToMongo(field: string): string {
    // Cosmos uses c.attributes.industry, MongoDB uses attributes.industry
    return field;
}

/** Resolve a right-hand-side value */
function resolveRhs(rhs: string, params: Record<string, any>): any {
    if (rhs.startsWith("@")) return resolveParam(rhs, params);
    if (rhs.startsWith("'") && rhs.endsWith("'")) return rhs.slice(1, -1);
    if (rhs === "true") return true;
    if (rhs === "false") return false;
    if (rhs === "null") return null;
    if (!isNaN(Number(rhs))) return Number(rhs);
    return rhs;
}

/** Parse ORDER BY clause into MongoDB sort */
function parseOrderBy(sql: string): Sort {
    const m = /ORDER\s+BY\s+(.*?)(?:\s+OFFSET|\s*$)/i.exec(sql);
    if (!m) return {};
    const sort: Record<string, 1 | -1> = {};
    const parts = m[1].split(",");
    for (const part of parts) {
        const pm = /c\.([.\w]+)\s*(ASC|DESC)?/i.exec(part.trim());
        if (pm) {
            sort[pm[1]] = pm[2]?.toUpperCase() === "DESC" ? -1 : 1;
        }
    }
    return sort;
}

/** Parse projection from SELECT clause */
function parseProjection(sql: string): Document | null {
    // SELECT * → no projection
    if (/^SELECT\s+(\*|TOP\s+(?:\d+|@\w+)\s+\*)/i.test(sql.trim())) return null;
    // SELECT TOP N * → no projection
    if (/^SELECT\s+TOP\s+(?:\d+|@\w+)\s+\*/i.test(sql.trim())) return null;
    // SELECT TOP N c.a, c.b → projection
    const selMatch = /^SELECT\s+(?:TOP\s+(?:\d+|@\w+)\s+)?(.+?)\s+FROM\s/i.exec(sql.trim());
    if (!selMatch) return null;
    const cols = selMatch[1];
    if (cols.trim() === "*") return null;
    // SELECT c → means full container alias, treat as no projection
    if (cols.trim() === "c") return null;
    // Parse "c.a, c.b, c.c" or "c.a c.b"
    const fields = cols.split(",").map((f) => f.trim());
    const proj: Document = {};
    for (const f of fields) {
        const fm = /^c\.([.\w]+)$/i.exec(f.trim());
        if (fm) {
            proj[fm[1]] = 1;
        }
    }
    // No valid fields parsed → return null
    return Object.keys(proj).length > 0 ? proj : null;
}

/** Parse SELECT VALUE { field: AGG(c.col), ... } syntax */
function parseGroupObject(inner: string): Document {
    const group: Document = {};
    const parts = inner.split(",");
    for (const part of parts) {
        const m = /(\w+)\s*:\s*(SUM|COUNT|AVG|MIN|MAX)\s*\(\s*(?:c\.)?(\w+|1)\s*\)/i.exec(part.trim());
        if (m) {
            const alias = m[1];
            const op = m[2].toLowerCase();
            const field = m[3] === "1" ? 1 : `$${m[3]}`;
            if (op === "count") {
                group[alias] = { $sum: 1 };
            } else {
                group[alias] = { [`$${op}`]: field };
            }
        }
    }
    return group;
}

/**
 * Parse SELECT columns with AGG(c.col) as alias ... GROUP BY c.field syntax.
 * e.g. SELECT c.staffId, MAX(c.startTime) as lastActive, SUM(c.totalTips) as unpaidTips
 */
function parseSelectGroupByColumns(sql: string, groupByField: string): Document {
    const group: Document = {};
    // Extract the SELECT columns portion (between SELECT and FROM)
    const selMatch = /^SELECT\s+(?:TOP\s+\d+\s+)?(.+?)\s+FROM\s/i.exec(sql.trim());
    if (!selMatch) return group;
    const cols = selMatch[1];
    // Split by comma and look for AGG(c.field) as alias patterns
    const parts = cols.split(",");
    for (const part of parts) {
        const aggMatch = /(SUM|COUNT|AVG|MIN|MAX)\s*\(\s*(?:c\.)?(\w+|1)\s*\)\s+(?:as|AS)\s+(\w+)/i.exec(part.trim());
        if (aggMatch) {
            const op = aggMatch[1].toLowerCase();
            const field = aggMatch[2] === "1" ? 1 : `$${aggMatch[2]}`;
            const alias = aggMatch[3];
            if (op === "count") {
                group[alias] = { $sum: 1 };
            } else {
                group[alias] = { [`$${op}`]: field };
            }
        }
    }
    return group;
}

/** Merge an array of AND filters into a single filter */
function mergeAndFilters(parts: Filter<Document>[]): Filter<Document> {
    const result: Record<string, any> = {};
    const conflicts: Filter<Document>[] = [];

    for (const p of parts) {
        for (const [key, val] of Object.entries(p as Record<string, any>)) {
            if (key === "$or" || key === "$and" || key === "$expr") {
                conflicts.push(p);
                break;
            }
            if (key in result) {
                // Same field appears twice – use $and
                conflicts.push(p);
                break;
            }
            result[key] = val;
        }
    }

    if (conflicts.length === 0) return result;

    // Fall back to $and
    return { $and: parts };
}

function escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
