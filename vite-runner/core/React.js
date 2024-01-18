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

let wipRoot = null;
let currentRoot = null;
let nextWorkOfUnit = null;
function workLoop(deadline) {
  let shouldYield = false;
  while(!shouldYield && nextWorkOfUnit) {
    nextWorkOfUnit = performUnitOfWork(nextWorkOfUnit);
    shouldYield = deadline.timeRemaining() < 1;
  }

  if (!nextWorkOfUnit && wipRoot) {
    commitRoot();
  }
  // 当前任务执行完通知浏览器在空闲时间执行下一个任务
  requestIdleCallback(workLoop);
}

function commitRoot() {
  deletions.forEach(commitDeletion);
  commitWork(wipRoot.child);
  currentRoot = wipRoot;
  wipRoot = null;
  deletions = [];
}

function commitDeletion(fiber) {
  if (fiber.dom) {
    let fiberParent = fiber.parent;
    // 特殊处理fc
    while(!fiberParent.dom) {
      fiberParent = fiberParent.parent;
    }
    fiberParent.dom.removeChild(fiber.dom);
  } else {
    commitDeletion(fiber.child);
  }
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
let deletions = []
function reconcileChildren(fiber, children) {
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
      if (child) {
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

      if (oldFiber) {
        oldFiber.effectTag = 'delete';
        deletions.push(oldFiber);
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
    if (newFiber) {
      prevChild = newFiber;
    }
  });
  while(oldFiber) {
    deletions.push(oldFiber);
    oldFiber = oldFiber.sibling;
  }
  console.log(oldFiber);
}

function updateFunctionComponent(fiber) {
  const children = [fiber.type(fiber.props)];
  reconcileChildren(fiber, children);
}

function updateHostComponent(fiber) {
  if (!fiber.dom) {
    const dom = (fiber.dom = createDom(fiber.type));
    updateProps(dom, fiber.props);
  }

  const children = fiber.props.children;
  reconcileChildren(fiber, children);
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
  wipRoot = {
    dom: container,
    props: {
      children: [el]
    }
  }
  nextWorkOfUnit = wipRoot;
}

// 更新
function update() {
  wipRoot = {
    dom: currentRoot.dom,
    props: currentRoot.props,
    altermate: currentRoot  // 保存上一次的fiber
  }
  
  nextWorkOfUnit = wipRoot;
}

const React = {
  createElement,
  render,
  update
}

export default React;
