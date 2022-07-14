import ReactDOM from "react-dom/client";
import { Canvas, useThree } from "@react-three/fiber";
import { motion } from "framer-motion-3d";
import { useViewportScroll } from "framer-motion";
// import vector3 from 'three'

import "./index.css";
import { useEffect, useState } from "react";

const Scene = () => {
  return (
    <>
      <ambientLight intensity={0.1} />
      <directionalLight color="red" position={[0, 0, 5]} />
      <motion.mesh whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
        <boxGeometry args={[5, 5, 1]} />
        <meshStandardMaterial />
      </motion.mesh>
    </>
  );
};

const App = () => {
  const { scrollYProgress } = useViewportScroll();
  const [yPosition, setYPosition] = useState(0);
  scrollYProgress.onChange((value) => {
    setYPosition(value * 100);
  });
  useEffect(() => {
    console.log(yPosition);
  }, [yPosition]);
  return (
    <>
      <div id="canvas-container">
        <Canvas camera={{ fov: 80, position: [0, yPosition, 10] }}>
          <Scene />
        </Canvas>
      </div>
      <div id="html-container">
        <h1>First Title</h1>
        <h1>Second Title</h1>
      </div>
    </>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
