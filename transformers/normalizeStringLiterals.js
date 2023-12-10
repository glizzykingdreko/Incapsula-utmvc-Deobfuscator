const t = require('@babel/types');
const traverse = require('@babel/traverse').default;

/**
 * Normalize String Literals in an AST
 * 
 * This function traverses an abstract syntax tree (AST) and normalizes string literals.
 * It replaces string literals that have different raw and actual values with their actual values.
 * This is particularly useful for converting escaped hexadecimal literals into their string representations.
 * 
 * @param {Object} ast - The abstract syntax tree to process.
 */
function normalizeStringLiterals(ast) {
    traverse(ast, {
        // Process each string literal in the AST
        StringLiteral(path) {
            // Check if the node has an 'extra' property with differing 'rawValue' and 'raw'
            if (path.node.extra && path.node.extra.rawValue !== path.node.extra.raw) {
                // Replace the string literal with its actual (rawValue) representation
                path.replaceWith(t.stringLiteral(path.node.extra.rawValue));
            }
        }
    });
}

module.exports = normalizeStringLiterals;
