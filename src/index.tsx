import ReactDOM from "react-dom/client";
import { Suspense, useEffect, useRef } from "react";
import { motion } from "framer-motion-3d";
import { useScroll } from "framer-motion";
import { Canvas, useThree, useLoader } from "@react-three/fiber";

import "./index.css";
import { GLTFLoader } from "../node_modules/three/examples/jsm/loaders/GLTFLoader";

const FOV = 10;
const ROOM_WIDTH = 10;
const ROOM_DEPTH = 5;
const ROOM_HEIGHT = 8;
const WALL_THICKNESS = 0.25;
const WALL_COLOUR = "red";
const ROOM_Z_POSITION = -1;

const Model = (props) => {
  const gltf = useLoader(GLTFLoader, "public/models/scene.gltf");
  return (
    <primitive
      object={gltf.scene}
      rotation={[0, 3, 0]}
      position={[0, 0, 0]}
      scale={[0.5, 0.5, 0.5]}
      {...props}
    />
  );
};

const Scene = () => {
  const camera = useThree((state) => state.camera);
  const { scrollYProgress } = useScroll();

  scrollYProgress.onChange((value) => {
    camera.position.set(0, -value * FOV, 5);
  });

  return (
    <>
      <ambientLight intensity={0.1} />
      <directionalLight color="white" position={[0, 0, 5]} />
      {/*FLOOR*/}
      <motion.mesh position={[0, -2, ROOM_Z_POSITION]}>
        <boxGeometry args={[ROOM_WIDTH, WALL_THICKNESS, ROOM_DEPTH]} />
        <meshStandardMaterial />
      </motion.mesh>
      {/*WALLS*/}
      <motion.mesh position={[-ROOM_WIDTH / 2, 0, ROOM_Z_POSITION]}>
        <boxGeometry args={[WALL_THICKNESS, ROOM_HEIGHT, ROOM_DEPTH]} />
        <meshStandardMaterial color={WALL_COLOUR} />
      </motion.mesh>
      <motion.mesh position={[ROOM_WIDTH / 2, 0, ROOM_Z_POSITION]}>
        <boxGeometry args={[WALL_THICKNESS, ROOM_HEIGHT, ROOM_DEPTH]} />
        <meshStandardMaterial color={WALL_COLOUR} />
      </motion.mesh>
      <motion.mesh position={[0, 0, -ROOM_DEPTH]}>
        <boxGeometry args={[ROOM_WIDTH, ROOM_HEIGHT, WALL_THICKNESS]} />
        <meshStandardMaterial color={WALL_COLOUR} />
      </motion.mesh>
      <Model />
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
      <div id="html-container"></div>
    </>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
