import React from "./core/React.js";
// const App = <div>Hello Panghu</div>;

function Counter({ num }) {
  console.log("Counter");
  function handleClick() {
    console.log("click");
  }
  return <div>count: {num}
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

// const App = (
//   <div>
//     Hello Panghu
//     <Counter></Counter>
//   </div>
// )

export default App;
