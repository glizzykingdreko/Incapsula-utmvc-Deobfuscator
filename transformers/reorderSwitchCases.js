const generate = require('@babel/generator').default;
const t = require('@babel/types');
const traverse = require('@babel/traverse').default;

/**
 * Reorder Switch Cases in an AST
 * 
 * This function traverses an abstract syntax tree (AST) and reorders the switch cases
 * in a while statement based on a predefined order. It targets while statements with a specific condition,
 * removes the preceding node that defines the order, and then rearranges the switch cases accordingly.
 * 
 * @param {Object} ast - The abstract syntax tree to process.
 */
function reorderSwitchCases(ast) {
  let matches = 0;

  traverse(ast, {
    WhileStatement(path){
      const test = path.get("test");
      const testCode = generate(test.node).code;
      if(testCode !== "!![]"){
        return;
      }
      const order = path.getPrevSibling().get("declarations.0.init.callee.object.value").node.split("|");
      const switchCases = path.get("body.body.0.cases").map((_p) => {const nodes = _p.node.consequent; nodes.pop(); return nodes;});
      const newNodes = [];
      order.forEach((currentIndex) => newNodes.push(...switchCases[currentIndex]));
      path.getPrevSibling().remove();
      path.replaceWithMultiple(newNodes);
      matches++;
    }
  });
  return matches;
}

module.exports = reorderSwitchCases;
