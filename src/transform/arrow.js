import _ from 'lodash';
import estraverse from 'estraverse';
import ArrowFunctionExpression from './../syntax/arrow-function-expression';

export default function (ast) {
  estraverse.replace(ast, {
    enter(node, parent) {
      if (isFunctionConvertableToArrow(node, parent)) {
        return new ArrowFunctionExpression({
          body: extractArrowBody(node.body),
          params: node.params,
          defaults: node.defaults,
          rest: node.rest,
        });
      }
    }
  });
}

function isFunctionConvertableToArrow(node, parent) {
  return node.type === 'FunctionExpression' &&
    parent.type !== 'Property' &&
    parent.type !== 'MethodDefinition' &&
    !node.id &&
    !node.generator &&
    !hasThis(node.body) &&
    !hasArguments(node.body);
}

function hasThis(ast) {
  return hasInFunctionBody(ast, {type: 'ThisExpression'});
}

function hasArguments(ast) {
  return hasInFunctionBody(ast, {type: 'Identifier', name: 'arguments'});
}

// Returns true when pattern matches any node in given function body,
// excluding any nested functions
function hasInFunctionBody(ast, pattern) {
  const predicate = _.matches(pattern);
  let found = false;

  estraverse.traverse(ast, {
    enter: function (node) {
      if (predicate(node)) {
        found = true;
        this.break();
      }
      if (node.type === 'FunctionExpression' || node.type === 'FunctionDeclaration') {
        this.skip();
      }
    }
  });

  return found;
}

function extractArrowBody(block) {
  if (block.body[0] && block.body[0].type === 'ReturnStatement') {
    return block.body[0].argument;
  } else {
    return block;
  }
}