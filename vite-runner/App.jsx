import React from "./core/React.js";
let count = 10
function Counter({ num }) {
  function handleClick() {
    count++;
    React.update();
  }
  return <div>count: {count}
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
