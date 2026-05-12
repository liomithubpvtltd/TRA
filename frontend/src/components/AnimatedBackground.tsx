import { motion } from 'framer-motion';

export default function AnimatedBackground() {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 0,
      overflow: 'hidden', pointerEvents: 'none',
    }}>
      {/* Deep gradient base */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 20% 50%, rgba(30,58,138,0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(212,175,55,0.06) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, rgba(5,10,20,1) 0%, transparent 100%)',
      }} />

      {/* Floating orbs */}
      {[
        { x: '10%',  y: '20%', size: 320, color: 'rgba(30,58,138,0.12)',  dur: 18 },
        { x: '75%',  y: '15%', size: 240, color: 'rgba(212,175,55,0.07)', dur: 22 },
        { x: '55%',  y: '70%', size: 280, color: 'rgba(30,58,138,0.09)',  dur: 26 },
        { x: '85%',  y: '60%', size: 180, color: 'rgba(212,175,55,0.05)', dur: 15 },
      ].map((orb, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            left: orb.x, top: orb.y,
            width: orb.size, height: orb.size,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${orb.color}, transparent 70%)`,
            transform: 'translate(-50%, -50%)',
          }}
          animate={{
            scale: [1, 1.15, 1],
            x: [0, 30, -20, 0],
            y: [0, -20, 15, 0],
          }}
          transition={{ duration: orb.dur, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {/* Subtle grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
      }} />
    </div>
  );
}
