import MiniReact from "./React.js";

const MiniReactDOM = {
  createRoot(container) {
    return {
      render(h) {
        MiniReact.render(h, container);
      },
    }
  }
};

export default MiniReactDOM;
