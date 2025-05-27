import React, { useCallback } from 'react';
import { loadSlim } from "tsparticles-slim";
import Particles from "react-particles";
import './ParticlesBackground.scss';

const ParticlesBackground = () => {
  const particlesInit = useCallback(async engine => {
    await loadSlim(engine);
  }, []);

  return (
    <Particles
      id="tsparticles"
      className="particles-container"
      init={particlesInit}
      options={{
        fpsLimit: 120,
        particles: {
          color: {
            value: "#3a36e0",
          },
          links: {
            color: "#3a36e0",
            distance: 150,
            enable: true,
            opacity: 0.4,
            width: 1,
          },
          move: {
            direction: "none",
            enable: true,
            outModes: {
              default: "bounce",
            },
            random: false,
            speed: 2,
            straight: false,
          },
          number: {
            density: {
              enable: true,
              area: 800,
            },
            value: 50,
          },
          opacity: {
            value: 0.3,
          },
          shape: {
            type: "circle",
          },
          size: {
            value: { min: 1, max: 5 },
          },
        },
        detectRetina: true,
      }}
    />
  );
};

export default ParticlesBackground; 