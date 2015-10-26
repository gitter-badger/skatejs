'use strict';

const isIeUntil10 = /MSIE/.test(navigator.userAgent);
const isIe11 = /Trident/.test(navigator.userAgent);
let fixed = false;

// ! This walkTree method differs from the implementation in ../../utils/walk-tree
// It invokes the callback only for the children, not the passed node and the second parameter to the callback is the parent node
function walkTree (node, cb) {
  const childNodes = node.childNodes;

  if (!childNodes) {
    return;
  }

  const childNodesLen = childNodes.length;

  for (let a = 0; a < childNodesLen; a++) {
    const childNode = childNodes[a];
    cb(childNode, node);
    walkTree(childNode, cb);
  }
}

function fixInnerHTML() {
  const elementPrototype = window.HTMLElement.prototype;
  const originalInnerHTML = Object.getOwnPropertyDescriptor(elementPrototype, 'innerHTML');

  // This redefines the innerHTML property so that we can ensure that events
  // are properly triggered.
  Object.defineProperty(elementPrototype, 'innerHTML', {
    get: function () {
      return originalInnerHTML.get.call(this);
    },
    set: function (html) {
      walkTree(this, function (node, parentNode) {
        let mutationEvent = document.createEvent('MutationEvent');
        mutationEvent.initMutationEvent('DOMNodeRemoved', true, false, parentNode, null, null, null, null);
        node.dispatchEvent(mutationEvent);
      });
      originalInnerHTML.set.call(this, html);
    }
  });
}

if (!fixed && (isIeUntil10 || isIe11)) {
  // IE 9-11
  fixed = true; // make sure we add the enhancement only once

  if (isIe11) {
    // IE11's native MutationObserver needs some help as well :()
    window.MutationObserver = window.JsMutationObserver || window.MutationObserver;
  }

  fixInnerHTML();
}