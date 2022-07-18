import ReactDOM from "react-dom/client";
import { Suspense, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion-3d";
import { useScroll, useTransform, useVelocity, useSpring } from "framer-motion";
import { Canvas, useThree, useLoader, useFrame } from "@react-three/fiber";
import {
  Debug,
  Physics,
  RapierRigidBody,
  RigidBody,
} from "@react-three/rapier";

import "./index.css";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import {
  Cloud,
  Environment,
  OrbitControls,
  Sky,
  useTexture,
} from "@react-three/drei";
import * as THREE from "three";
import { TextureLoader } from "three";

const ROOM_WIDTH = 10;
const ROOM_DEPTH = 5;
const ROOM_HEIGHT = 8;
const WALL_THICKNESS = 0.25;
const WALL_COLOUR = "red";
const ROOM_Z_POSITION = -1;

const Model = (props) => {
  const ref = useRef<THREE.Scene>();
  useFrame((state) => {
    if (!ref.current) {
      return;
    }
    const t = state.clock.getElapsedTime();
    ref.current.rotation.y = t;
    ref.current.position.y = Math.sin(t) * 0.5;
  });
  const gltf = useLoader(GLTFLoader, "models/scene.gltf");

  useEffect(() => {
    // gltf.scene.children.forEach((mesh, i) => {
    //   mesh.castShadow = true;
    // });
    // gltf.scene.castShadow = true;
    // ref.current = gltf.scene;
    // console.log({ gltf });
  }, [gltf]);

  return (
    <RigidBody colliders="cuboid">
      <motion.primitive
        castShadow
        object={gltf.scene}
        rotation={[0, 3, 0]}
        position={[0, 0, 0]}
        scale={[1, 1, 1]}
        {...props}
      />
    </RigidBody>
  );
};

const Scene = () => {
  const { scrollYProgress } = useScroll();

  const yPosition = useTransform(scrollYProgress, (latest) => latest * 5);

  const yVelocity = useVelocity(yPosition);

  yVelocity.onChange((value) => console.log(value));

  const ref = useCallback((node) => {
    if (!node) {
      return;
    }
    console.log({ node });
  }, []);

  return (
    <Physics>
      {/*<Debug />*/}
      <hemisphereLight intensity={0.45} />
      <spotLight
        angle={0.4}
        penumbra={1}
        position={[20, 30, 2.5]}
        castShadow
        shadow-bias={-0.00001}
      />
      <Cloud scale={1.5} position={[20, 0, 0]} />
      <Cloud scale={1} position={[-20, 10, 0]} />
      <Environment preset="city" />
      <Sky />
      <motion.group ref={ref} position-y={yPosition} castShadow={true}>
        {/*FLOOR*/}
        <Floor
          position={[0, -ROOM_HEIGHT / 2, ROOM_Z_POSITION]}
          size={[ROOM_WIDTH, WALL_THICKNESS, ROOM_DEPTH]}
        />
        <Box
          position={[0, ROOM_HEIGHT / 2, ROOM_Z_POSITION]}
          size={[ROOM_WIDTH, WALL_THICKNESS, ROOM_DEPTH]}
        />
        {/*WALLS*/}
        <Box
          position={[-ROOM_WIDTH / 2, 0, ROOM_Z_POSITION]}
          size={[WALL_THICKNESS, ROOM_HEIGHT, ROOM_DEPTH]}
        />
        <Box
          position={[ROOM_WIDTH / 2, 0, ROOM_Z_POSITION]}
          size={[WALL_THICKNESS, ROOM_HEIGHT, ROOM_DEPTH]}
        />
        <Box
          position={[0, 0, -ROOM_DEPTH / 2 - WALL_THICKNESS + ROOM_Z_POSITION]}
          size={[ROOM_WIDTH, ROOM_HEIGHT, WALL_THICKNESS]}
        />
        <Box
          transparent={true}
          position={[0, 0, ROOM_DEPTH / 2 + WALL_THICKNESS + ROOM_Z_POSITION]}
          size={[ROOM_WIDTH, ROOM_HEIGHT, WALL_THICKNESS]}
        />
      </motion.group>
      {[...new Array(10)].map((i) => (
        <RigidBody key={i} colliders="cuboid">
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="red" />
          </mesh>
        </RigidBody>
      ))}
      <Model />
    </Physics>
  );
};

const Floor = ({ size, ...props }) => {
  const ref = useScrollTranslate();
  const [colorMap, displacementMap, glossMap, normalMap, roughnessMap] =
    useTexture([
      "textures/wood-floor-texture/WoodFloor_Color.jpg",
      "textures/wood-floor-texture/WoodFloor_Disp.jpg",
      "textures/wood-floor-texture/WoodFloor_Gloss.jpg",
      "textures/wood-floor-texture/WoodFloor_Normal.jpg",
      "textures/wood-floor-texture/WoodFloor_Roughness.jpg",
    ]);
  return (
    <RigidBody ref={ref} colliders="cuboid" type="kinematicVelocity">
      <mesh castShadow receiveShadow {...props}>
        <boxGeometry args={size} />
        <meshPhongMaterial
          map={colorMap}
          displacementMap={displacementMap}
          normalMap={normalMap}
          specularMap={glossMap}
          // roughnessMap={roughnessMap}
        />
      </mesh>
    </RigidBody>
  );
};

const useScrollTranslate = () => {
  const ref = useRef<RapierRigidBody>();
  const { scrollYProgress, scrollXProgress } = useScroll();

  const smoothedX = useSpring(scrollXProgress, {
    stiffness: 100,
    damping: 20,
    restDelta: 0.0001,
  });

  const smoothedY = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 20,
    restDelta: 0.0001,
  });

  smoothedY.onChange((value) => {
    if (!ref.current) return;
    ref.current.setTranslation(new THREE.Vector3(0, value * 8, 0), true);
  });

  smoothedX.onChange((value) => {
    if (!ref.current) return;
    ref.current.setTranslation(new THREE.Vector3(value * 8, 0, 0), true);
  });
  return ref;
};

const Box = ({ size, transparent = false, ...props }) => {
  const ref = useScrollTranslate();
  return (
    <RigidBody ref={ref} colliders="cuboid" type="kinematicVelocity">
      <mesh castShadow receiveShadow {...props}>
        <boxGeometry args={size} />
        <meshStandardMaterial
          color="white"
          opacity={0}
          transparent={transparent}
        />
      </mesh>
    </RigidBody>
  );
};

const App = () => {
  return (
    <>
      <div id="canvas-container">
        <Canvas shadows dpr={1}>
          <Suspense fallback={null}>
            <Scene />
            {/*<OrbitControls />*/}
          </Suspense>
        </Canvas>
      </div>
      <div id="html-container"></div>
    </>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
