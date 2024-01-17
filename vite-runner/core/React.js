function createTextNode(text) {
  return {
    type: 'TEXT_ELEMENT',
    props: {
      nodeValue: text,
      children: []
    }
  }
}

function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map(child => typeof child === 'object' ? child : createTextNode(child))
    }
  }
}

let root = null;
let currentRoot = null;
let nextWorkOfUnit = null;
function workLoop(deadline) {
  let shouldYield = false;
  while(!shouldYield && nextWorkOfUnit) {
    nextWorkOfUnit = performUnitOfWork(nextWorkOfUnit);
    shouldYield = deadline.timeRemaining() < 1;
  }

  if (!nextWorkOfUnit && root) {
    commitRoot();
  }
  // 当前任务执行完通知浏览器在空闲时间执行下一个任务
  requestIdleCallback(workLoop);
}

function commitRoot() {
  commitWork(root.child);
  currentRoot = root;
  root = null;
}

function commitWork(fiber) {
  if (!fiber) {
    return;
  }
  let fiberParent = fiber.parent;
  while(!fiberParent.dom) {
    fiberParent = fiberParent.parent;
  }
  if (fiber.effectTag === 'update') {
    updateProps(fiber.dom, fiber.props, fiber.altermate?.props);
  } else if (fiber.effectTag === 'placement') {
    if (fiber.dom) {
      fiberParent.dom.appendChild(fiber.dom);
    }
  }
  
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

requestIdleCallback(workLoop);

function createDom(type) {
  return type === 'TEXT_ELEMENT' ? document.createTextNode('') : document.createElement(type);
}

function updateProps(dom, nextProps, prevProps = {}) {
  const isProperty = k => k !== 'children';
  // oldProps中有，newProps中没有，删除
  Object.keys(prevProps).filter(isProperty).forEach(k => {
    if (!(k in nextProps)) {
      dom.removeAttribute(k);
    }
  });

  Object.keys(nextProps).filter(isProperty).forEach(k => {
    if (nextProps[k] !== prevProps[k]) {
      if (k.startsWith('on')) {
        const eventName = k.slice(2).toLowerCase();
        dom.removeEventListener(eventName, prevProps[k]);
        dom.addEventListener(eventName, nextProps[k]);
      } else {
        dom[k] = nextProps[k];
      }
    }
  })
}

function initChildren(fiber, children) {
  let oldFiber = fiber.altermate?.child;
  let prevChild = null;
  children.forEach((child, index) => {
    // 判断是否是同一个类型的节点
    const isSameType = oldFiber && oldFiber.type === child.type;
    // 如果为True，更新节点
    let newFiber;
    if (isSameType) {
      newFiber = {
        type: child.type,
        props: child.props,
        child: null,
        parent: fiber,
        dom: oldFiber.dom,  // 指向老的dom
        sibling: null,
        altermate: oldFiber,
        effectTag: 'update'
      }
    } else {
      newFiber = {
        type: child.type,
        props: child.props,
        child: null,
        parent: fiber,
        dom: null,
        sibling: null,
        altermate: null,
        effectTag: 'placement'
      }
    }

    // 重置链表指向
    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }
    
    if (index === 0) {
      fiber.child = newFiber;
    } else {
      prevChild.sibling = newFiber;
    }
    prevChild = newFiber;
  });
}

function updateFunctionComponent(fiber) {
  const children = [fiber.type(fiber.props)];
  initChildren(fiber, children);
}

function updateHostComponent(fiber) {
  if (!fiber.dom) {
    const dom = (fiber.dom = createDom(fiber.type));
    updateProps(dom, fiber.props);
  }

  const children = fiber.props.children;
  initChildren(fiber, children);
}


function performUnitOfWork(fiber) {
  const isFunctionComponent = typeof fiber.type === 'function';

  // 判断是否为函数组件
  if (isFunctionComponent) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
  }

  if (fiber.child) {
    return fiber.child;
  }

  if (fiber.sibling) {
    return fiber.sibling;
  }
  let nextFiber = fiber;
  while(nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }
}

function render(el, container) {
  nextWorkOfUnit = {
    dom: container,
    props: {
      children: [el]
    }
  }
  root = nextWorkOfUnit;
}

// 更新
function update() {
  nextWorkOfUnit = {
    dom: currentRoot.dom,
    props: currentRoot.props,
    altermate: currentRoot  // 保存上一次的fiber
  }
  
  root = nextWorkOfUnit;
}

const React = {
  createElement,
  render,
  update
}

export default React;
