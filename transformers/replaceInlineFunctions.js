const generate = require('@babel/generator').default;
const traverse = require('@babel/traverse').default;
const fs = require('fs');
const parse = require('@babel/parser').parse;

/**
 * Checks if the given path represents an inline function.
 * @param {Object} path - The path to check.
 * @param {Array} tableKeys - An array of table keys.
 * @returns {boolean} True if it is an inline function, false otherwise.
 */
function isInlineFunction(path, tableKeys) {
    return (
        path.type === 'CallExpression' &&
        path.get('callee').type === 'MemberExpression' &&
        path.get('callee.object').type === 'Identifier' &&
        tableKeys.includes(path.get('callee.object.name').node)
    );
}

/**
 * Extracts inlining tables from the given AST.
 * @param {Object} ast - The AST to process.
 * @returns {Object} The inlining tables.
 */
function extractInliningTables(ast) {
    const tables = {};

    traverse(ast, {
        VariableDeclarator(path) {
            const id = path.get('id');
            const init = path.get('init');
            if (!(init.type === 'ObjectExpression' && !init.get('properties').some(prop => !(prop.node.key.type === 'StringLiteral' && prop.node.key.value.length === 3)))) {
                return;
            }

            tables[id.node.name] = {};
            init.get('properties').forEach(propPath => {
                const name = propPath.node.key.value;
                tables[id.node.name][name] = generate(propPath.node.value).code;
            });

            path.parentPath.remove();
        }
    });

    return tables;
}

/**
 * Replaces an inline function with its corresponding table entry.
 * @param {Object} inlineFunc - The inline function node.
 * @param {Object} tables - The inlining tables.
 * @returns {Object} The replaced node.
 */
function replaceInlineFunction(inlineFunc, tables) {
    // Extract properties from the inline function call
    const getProps = (node) => {
        return {
            tableIndex: node.callee.object.name,
            tableProp: node.callee.property.value,
            args: node.arguments
        };
    };

    // Check if the AST contains a subkey that needs to be replaced
    const hasSubKey = (ast, tableKeys) => {
        let found = false;
        let subKey = undefined;
        traverse(ast, {
            CallExpression(path) {
                if (isInlineFunction(path, tableKeys)) {
                    found = true;
                    subKey = path;
                }
            }
        });

        return { found, subKey };
    };

    // Extract properties from the inline function
    const props = getProps(inlineFunc);

    // Parse the replacement AST from the table
    const replacementAst = parse(tables[props.tableIndex][props.tableProp]);
    const tableKeys = Object.keys(tables);

    // Check for and replace any subkeys within the replacement AST
    const { found: foundSubKey, subKey } = hasSubKey(replacementAst, tableKeys);
    if (foundSubKey) {
        const newSubKey = replaceInlineFunction(subKey.node, tables);
        subKey.replaceWith(newSubKey);
    }

    // Map function parameters to the arguments passed in the inline function call
    const paramsMatch = {};
    replacementAst.program.body[0].params.forEach((param, paramIndex) => {
        paramsMatch[param.name] = props.args[paramIndex];
    });

    // Replace identifiers in the replacement AST with the corresponding arguments
    traverse(replacementAst, {
        FunctionDeclaration(path) {
            path.get('body').traverse({
                Identifier(idPath) {
                    const name = idPath.node.name;
                    if (name in paramsMatch) {
                        idPath.replaceWith(paramsMatch[name]);
                    }
                }
            });
        }
    });

    // Return the body of the replacement function
    return replacementAst.program.body[0].body.body[0].argument;
}


/**
 * Replaces all inlining functions in the given AST.
 * @param {Object} ast - The AST to process.
 */
function replaceInliningFunctions(ast) {
    let matches = 0;
    const tables = extractInliningTables(ast);
    const tableKeys = Object.keys(tables);

    traverse(ast, {
        CallExpression(path) {
            if (!isInlineFunction(path, tableKeys)) {
                return;
            }

            const newNode = replaceInlineFunction(path.node, tables);
            path.replaceWith(newNode);
            matches++;
        }
    });
    return matches;
}

module.exports = replaceInliningFunctions;
