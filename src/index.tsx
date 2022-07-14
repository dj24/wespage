import ReactDOM from "react-dom/client";
import { Suspense } from "react";
import { motion } from "framer-motion-3d";
import { useScroll } from "framer-motion";
import { Canvas, useThree, useLoader } from "@react-three/fiber";
import { useFBX } from "@react-three/drei";
import { FBXLoader } from "../node_modules/three/examples/jsm/loaders/FBXLoader";

import "./index.css";

const Model = (props) => {
  // const fbx = useFBX("/models/LeatherChair.fbx");
  const fbx = useLoader(FBXLoader, "models/LeatherChair.fbx");
  return <primitive object={fbx} />;
};

const Scene = () => {
  const camera = useThree((state) => state.camera);
  const { scrollYProgress } = useScroll();

  scrollYProgress.onChange((value) => {
    camera.position.set(0, -value * 20, 5);
  });

  return (
    <>
      <ambientLight intensity={0.1} />
      <directionalLight color="red" position={[0, 0, 5]} />
      <motion.mesh
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        position={[0, 0, 0]}
      >
        <boxGeometry args={[5, 5, 1]} />
        <meshStandardMaterial />
      </motion.mesh>
      <motion.mesh
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        position={[0, -20, 0]}
      >
        <boxGeometry args={[5, 5, 1]} />
        <meshStandardMaterial />
      </motion.mesh>
      {/*<Model />*/}
    </>
  );
};

const App = () => {
  return (
    <>
      <div id="canvas-container">
        <Canvas>
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
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
