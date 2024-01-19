const t = require('@babel/types');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const fs = require("fs");
const vm = require('vm');


function virtualizeEncryption(ast) {
    let virtualized = false;
    traverse(ast, {
        FunctionDeclaration(path) {
            if (
                path.node.params.length === 1 &&
                path.node.body.body[
                    path.node.body.body.length - 1
                ].type == "ExpressionStatement" &&
                path.node.body.body[
                    path.node.body.body.length - 1
                ].expression.type === 'CallExpression' &&
                path.node.body.body[
                    path.node.body.body.length - 1
                ].expression.arguments[0].value === '___utmvc'
            ) {
                console.log(`----| Virtualizing encryption function ${path.node.id.name}`);

                // replace function name with 'utmvcEncryption'
                path.node.id.name = 'utmvcEncryption';

                // Find the first VariableDeclarator with a CallExpression as its init
                const varDecl = path.node.body.body.find(
                    node =>
                        t.isVariableDeclaration(node) &&
                        t.isCallExpression(node.declarations[0].init)
                );
                varDecl.declarations[0].init = t.identifier('cookie');
                path.node.params.push(t.identifier('cookie'));
                
                // loop trought each node in body.body and remove the CallExpression that are now MemberExpressions
                path.node.body.body.forEach(node => {
                    if (
                        t.isExpressionStatement(node) && 
                        t.isCallExpression(node.expression) &&
                        !t.isMemberExpression(node.expression.callee) &&
                        node.expression.arguments.length === 0
                    ) {
                        node.expression = t.identifier('/*' + node.expression.callee.name + '*/');
                    }
                }); 

                // Find the first AssignmentExpression with a CallExpression as its right
                const assignExpr = path.node.body.body.find(
                    node =>
                        t.isForStatement(node)
                );
                // Replace the function on right with 'charCodeAtArray'
                assignExpr.body.body[0].expression.right.callee = t.identifier('charCodeAtArray');

                // Find the first AssignmentExpression with a CallExpression as its right
                const toBeRem = path.node.body.body.find(
                    node =>
                        t.isExpressionStatement(node) &&
                        t.isAssignmentExpression(node.expression) &&
                        t.isCallExpression(node.expression.right)
                );
                toBeRem.expression.right.arguments[0].left.left.left.left.callee.name = "";

                // We now need to find an expression like this
                // var _0x354ec1 = new _XXXX["Array"](_0x3fff08["length"]);
                // and replace it with
                // var _0x354ec1 = new Array(_0x3fff08["length"]);
                const newExpr = path.node.body.body.find(
                    node =>
                        t.isVariableDeclaration(node) &&
                        node.declarations.length === 1 &&
                        t.isNewExpression(node.declarations[0].init) &&
                        t.isMemberExpression(node.declarations[0].init.callee)
                );

                if (newExpr) {
                    let declaration = newExpr.declarations[0];
                    if (t.isNewExpression(declaration.init) && t.isMemberExpression(declaration.init.callee)) {
                        // Create an Identifier node for 'Array'
                        let newArrayIdentifier = t.identifier("Array");
                
                        // Replace the callee of the NewExpression with this identifier
                        declaration.init.callee = newArrayIdentifier;
                    }
                } else {
                    console.log("----| Failed to find new Array expression");
                }
                let returnArgument = path.node.body.body[
                    path.node.body.body.length - 1
                ].expression.arguments[1].name;
                // generate the code of only the function
                const caseCtx = { ...ast.sandbox };
                let code = `
                function charCodeAtArray(_0x4461ea) {
                    var _0x1f40e2 = 0x0;
                    for (var _0x596a80 = 0x0; _0x596a80 < _0x4461ea["length"]; _0x596a80++) {
                        _0x1f40e2 += _0x4461ea["charCodeAt"](_0x596a80);
                    }
                    return _0x1f40e2;
                }
                ${generate(path.node).code}
                `.replace(generate(path.node.body.body[path.node.body.body.length - 1]).code, "return " + returnArgument)
                // remove the function declaration
                vm.runInNewContext(code, caseCtx);
                virtualized = caseCtx;
                path.stop();
            }
        }
    });
    return virtualized;
}

module.exports = virtualizeEncryption;
