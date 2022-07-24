import ReactDOM from "react-dom/client";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion-3d";
import { useScroll, useTransform, useVelocity, useSpring } from "framer-motion";
import { Canvas, useThree, useLoader, useFrame } from "@react-three/fiber";
import {
  Debug,
  Physics,
  RapierRigidBody,
  RigidBody,
  useImpulseJoint,
  useRapier,
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
import * as RAPIER from "@dimforge/rapier3d-compat";
import { Color, TextureLoader } from "three";
import { getGPUTier } from "detect-gpu";

const ROOM_WIDTH = 10;
const ROOM_DEPTH = 5;
const ROOM_HEIGHT = 8;
const WALL_THICKNESS = 0.25;
const WALL_COLOUR = "red";
const ROOM_Z_POSITION = -1;

const LightBulb = (props) => {
  const gltf = useLoader(GLTFLoader, "models/bulb/scene.gltf");
  return (
    <motion.primitive
      castShadow
      object={gltf.scene}
      rotation={[0, 3, 0]}
      position={[0, 0, 0]}
      scale={[0.1, 0.1, 0.1]}
      {...props}
    />
  );
};

const Scene = () => {
  const { scrollYProgress } = useScroll();

  const yPosition = useTransform(scrollYProgress, (latest) => latest * 5);

  const ref = useCallback((node) => {
    if (!node) {
      return;
    }
    console.log({ node });
  }, []);

  return (
    <Physics>
      <Debug />
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
        {/*<LightBulb />*/}
      </motion.group>
      <Rope />
    </Physics>
  );
};

const ROPE_JOINTS = 5;
const ROPE_SECTION_SIZE = [0.1, 0.5, 0.1];

const Rope = () => {
  const { world } = useRapier();
  let ropeRigidbodies: RapierRigidBody[] = [];
  const handleRef = (index: number) => (node) => {
    ropeRigidbodies[index] = node;
    if (ropeRigidbodies.length === ROPE_JOINTS) {
      for (let i = 0; i < ROPE_JOINTS - 1; i++) {
        let params = RAPIER.JointData.spherical(
          { x: -0.1, y: 0, z: 0.0 },
          { x: 0.0, y: 0.25, z: 0.0 }
        );
        world.createImpulseJoint(
          params,
          ropeRigidbodies[i],
          ropeRigidbodies[i + 1]
        );
      }
    }
  };
  console.log(new Color(255, 0, 0).getHexString());
  return (
    <>
      {[...Array(ROPE_JOINTS).keys()].map((i) => (
        <RigidBody
          ref={handleRef(i)}
          key={i}
          colliders="cuboid"
          type={i === 0 ? "kinematicPosition" : "dynamic"}
        >
          <motion.mesh castShadow receiveShadow position={[0, 1 - i * 0.5, 0]}>
            <motion.boxGeometry
              whileHover={{ scale: 2 }}
              args={ROPE_SECTION_SIZE}
            />
            <meshStandardMaterial
              color={new Color(255, 0, 0)
                // .lerpHSL(new Color(0, 0, 255), i / ROPE_JOINTS)
                .getHexString()}
            />
          </motion.mesh>
        </RigidBody>
      ))}
    </>
  );
};

const Line = ({ from, to }: { from: RapierRigidBody; to: RapierRigidBody }) => {
  const ref = useRef<THREE.Line>();

  useFrame(() => {
    if (ref.current) {
      ref.current.geometry.setFromPoints(
        [from, to].map((point) => new THREE.Vector3(...point))
      );
    }
  });
  return (
    <line ref={ref}>
      <bufferGeometry />
      <lineBasicMaterial color="black" />
    </line>
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
        {/*<meshPhongMaterial*/}
        {/*  map={colorMap}*/}
        {/*  displacementMap={displacementMap}*/}
        {/*  normalMap={normalMap}*/}
        {/*  specularMap={glossMap}*/}
        {/*  // roughnessMap={roughnessMap}*/}
        {/*/>*/}
        <meshStandardMaterial color="green" />
      </mesh>
    </RigidBody>
  );
};

const useScrollTranslate = () => {
  const ref = useRef<RapierRigidBody>();
  const { scrollYProgress } = useScroll();

  const smoothedY = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 20,
    restDelta: 0.0001,
  });

  smoothedY.onChange((value) => {
    if (!ref.current) return;
    ref.current.setTranslation(new THREE.Vector3(0, value * 8, 0), true);
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
  const [dpr, setDpr] = useState(0.5);
  useEffect(() => {
    getGPUTier().then(({ tier }) => {
      if (tier > 2) {
        setDpr(window.devicePixelRatio);
      } else if (tier > 1) {
        setDpr(0.75);
      }
    });
  }, []);
  return (
    <>
      <div id="canvas-container">
        <Canvas shadows dpr={dpr}>
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
