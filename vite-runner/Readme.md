1、实现事件绑定

判断事件类型 -> 为Dom元素绑定事件 -> 为Dom元素绑定事件回调函数


2、实现Props更新

  如何找到老的节点
    update的时候保存之前的fiber
  
  如何更新props
    2-4-1、oldProps中有，newProps中没有，删除
    2-4-2、oldProps中没有，newProps中有，添加
    2-4-3、oldProps中有，newProps中有，更新
