import React from "./React.js";

const ReactDOM = {
  createRoot(container) {
    return {
      render(h) {
        React.render(h, container);
      },
    }
  }
};

export default ReactDOM;
