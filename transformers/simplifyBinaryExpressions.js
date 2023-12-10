const t = require('@babel/types');
const traverse = require('@babel/traverse').default;

/**
 * Converts a JavaScript value to its corresponding AST node.
 * @param {*} value - The value to convert.
 * @returns {Object} The AST node representing the value.
 */
function valueToAstNode(value) {
    if (Array.isArray(value)) {
        return t.arrayExpression(value.map(elem => valueToAstNode(elem)));
    } else if (Number.isInteger(value)) {
        return t.numericLiteral(value);
    } else if (typeof value === 'string') {
        return t.stringLiteral(value);
    } else if (typeof value === 'boolean') {
        return t.booleanLiteral(value);
    } else {
        // Fallback for undefined or other types
        return t.identifier('undefined');
    }
}

/**
 * Simplifies binary expressions in the AST by evaluating them and replacing
 * them with their computed values.
 * @param {Object} ast - The AST to process.
 */
function simplifyBinaryExpressions(ast) {
    traverse(ast, {
        BinaryExpression(path) {
            // Evaluate the binary expression
            const { confident, value } = path.evaluate();
            // If evaluation is confident, replace the expression with its computed value
            if (confident) {
                path.replaceWith(valueToAstNode(value));
            }
        }
    });
}

module.exports = simplifyBinaryExpressions;
