import React from "./core/React.js";
let showBar = true;
function Counter() {
  function handleClick() {
    showBar = !showBar;
    React.update();
  }
  const Vant = (<div>
    <div>child1</div>
    <div>child2</div>
    <div>child3</div>
  </div>)
  const bar = <div>bar</div>;
  function Foo() {
    return <p>foo</p>;
  }
  return <div>count
      <div>{ showBar ? Vant : bar }</div>
      <button onClick={handleClick}>click</button>
    </div>
  ;
}

function App() {
  return (
    <div>
      Hello Panghu
      <Counter num={10}></Counter>
    </div>
  );
}

export default App;
