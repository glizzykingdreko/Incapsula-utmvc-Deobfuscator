const vm = require('vm');
const generate = require('@babel/generator').default;
const traverse = require('@babel/traverse').default;
const t = require('@babel/types');

const { atob, rc4DecryptFromArray, shuffleArray } = require('./deobfuscateHelpers');

/**
 * Finds and extracts arrays of string literals from the AST.
 * This function looks for variable declarations that are solely initialized with an array of string literals.
 * It extracts these arrays and removes the corresponding nodes from the AST.
 * 
 * @param {Object} ast - The abstract syntax tree to process.
 * @returns {Array} An array of objects, each containing the name of the array variable and its string elements.
 */
function findDecryptionArrays(ast) {
    const stringArrays = [];
    const caseCtx = { ...ast.sandbox };

    traverse(ast, {
        Program(path) {
            path.get(`body`).forEach((path) => {
                if (!(
                    path.type === `VariableDeclaration` &&
                    path.get(`declarations`).length === 1 &&
                    path.get(`declarations.0.init`).type === `ArrayExpression` &&
                    !path.get(`declarations.0.init.elements`).some((p) => p.node.type !== `StringLiteral`)
                )) {
                    return;
                }
                const arrayName = path.get(`declarations.0.id.name`).node;
                const stringArray = path.get(`declarations.0.init.elements`).map((p) => p.node.value);
                stringArrays.push({ arrayName, stringArray });
                vm.runInNewContext(generate(path.node).code, caseCtx);
                path.remove();

            });

        }
    });
    // Store the found string arrays in the AST for potential future use
    ast.stringArrays = stringArrays;
    return stringArrays;
}

/**
 * Finds shuffle operations in the AST and records their values.
 * @param {Object} ast - The abstract syntax tree.
 * @param {Array} arrayNames - List of array names to match in shuffle operations.
 * @returns {Array} List of shuffle values.
 */
function findShufflers(ast, arrayNames) {
    const shuffleBys = [];

    traverse(ast, {
        Program(path) {

            path.get(`body`).forEach((path) => {

                if (!(
                    path.type === `ExpressionStatement` && path.get(`expression`).type === `CallExpression` &&
                    path.get(`expression.arguments`).length === 2 && path.get(`expression.arguments.1`).type === `NumericLiteral` &&
                    path.get(`expression.arguments.0`).type === `Identifier` && arrayNames.includes(path.get(`expression.arguments.0.name`).node)
                )) {
                    return;
                }

                const shuffleBy = path.get(`expression.arguments.1.value`).node;
                shuffleBys.push(shuffleBy);

                path.remove();

            });

        }
    });
    ast.shuffleBys = shuffleBys;
    return shuffleBys;
}

/**
 * Finds and collects encoders from the AST.
 * @param {Object} ast - The abstract syntax tree.
 * @returns {Array} List of encoder names.
 */
function findEncoders(ast) {
    const encoders = [];
    traverse(ast, {
        AssignmentExpression(path) {

            const code = generate(path.node).code;

            if (!code.endsWith(`["initialized"] = !![]`)) {
                return;
            }

            const encoder = path.parentPath.parentPath.parentPath.parentPath.parentPath.parentPath.node.id.name;
            encoders.push(encoder);

            path.parentPath.parentPath.parentPath.parentPath.parentPath.parentPath.remove();
        }
    });
    ast.encoders = encoders;
    return encoders;
}

/**
 * Creates a sandbox context for running encoded strings.
 * @param {Object} params - Object containing stringArrays, shuffleBys, and encoders.
 * @returns {Object} The sandbox context.
 */
function createSandbox({ stringArrays, shuffleBys, encoders }) {
    const context = { atob, rc4DecryptFromArray, shuffleArray, btoa };
    encoders.forEach((encoder, index) => {
        const { stringArray, arrayName } = stringArrays[index];
        const shuffleBy = shuffleBys[index];
        const rc4FunctionCode = `
            var ${arrayName} = [${stringArray.map(s => `"${s}"`).join(', ')}];
            var ${encoder} = function(index, key) { return rc4DecryptFromArray(${arrayName}, index, key); };
            shuffleArray(${arrayName}, ${shuffleBy});
        `;
        vm.runInNewContext(rc4FunctionCode, context);
    });
    return context;
}

/**
 * Clears concealed strings within the AST by evaluating and replacing them.
 * @param {Object} ast - The abstract syntax tree.
 */
function debfuscateRC4Encryption(ast) {
    let matches = 0;
    const stringArrays = findDecryptionArrays(ast);
    const shuffleBys = findShufflers(ast, stringArrays.map(s => s.arrayName));
    const encoders = findEncoders(ast);
    const sandbox = createSandbox({ stringArrays, shuffleBys, encoders });
    ast.sandbox = sandbox;
    ast.stringArrays = stringArrays;
    ast.shuffleBys = shuffleBys;
    ast.encoders = encoders;

    traverse(ast, {
        VariableDeclarator: {
            exit(path) {
                try {
                    vm.runInNewContext(
                        generate(path.node).code, ast.sandbox
                    )
                } catch (e) {}
            }
        },
        CallExpression: {
            exit(path) {
                const callee = path.get(`callee`);

                if (!(callee.type === `Identifier` && encoders.includes(callee.node.name))) {
                    return;
                }
                try {
                    const evaluatedNode = t.stringLiteral(
                        vm.runInNewContext(
                            generate(path.node).code, ast.sandbox
                        )
                    );
                    path.replaceWith(evaluatedNode);
                    matches++;
                } catch (e) {
                    const topParent = path.getStatementParent().parentPath;
                    const isInsideSwitch = t.isSwitchCase(topParent.node);
                    if (isInsideSwitch) {
                        const caseCtx = { ...ast.sandbox };
                        const caseNodes = topParent.node.consequent.slice(0, topParent.node.consequent.length - 2).map((n) => generate(n).code);
                        vm.runInNewContext(caseNodes.join(`\n`), caseCtx);
                        try {
                            const evaluatedNode = t.stringLiteral(vm.runInNewContext(generate(path.node).code, caseCtx));
                            path.replaceWith(evaluatedNode);
                            matches++;
                        } catch (e) {
                            console.log(e);
                        }
                    } else {
                        console.log(e)
                    }
                }
            }
        }
    });
    return matches;
}

module.exports = debfuscateRC4Encryption;