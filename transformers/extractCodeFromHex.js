const traverse = require('@babel/traverse').default;
const parser = require('@babel/parser');

/**
 * Extracts the code from the first script tag of the html
 * @param {string} firstScript - The first script tag of the html
 * @returns {Object} The AST of the extracted code
*/
function extractCodeFromHex(firstScript) {
    const initialAst = parser.parse(firstScript, {});

    let stringCode;
    traverse(initialAst, {
        VariableDeclaration(path) {
            let val = path.node.declarations[0].init.value;
            if (val !== "") {
                stringCode = val;
                path.stop();
            }
        }
    });
    let newCode = "";
    for (let i = 0; i < stringCode.length; i += 2) {
        newCode += String.fromCharCode(parseInt(stringCode.substring(i, i + 2), 16));
    }
    return parser.parse(newCode, {});
}

module.exports = extractCodeFromHex;