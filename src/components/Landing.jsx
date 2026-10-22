import LandingNav from './landing/LandingNav.jsx';
import Hero from './landing/Hero.jsx';
import Gallery from './landing/Gallery.jsx';
import Demo from './landing/Demo.jsx';
import Contact from './landing/Contact.jsx';

export default function Landing({ onTryLive }) {
  return (
    <div className="relative min-h-screen bg-[#0a0a0a] text-white antialiased">
      {/* grid overlay with radial mask */}
      <div className="landing-grid pointer-events-none fixed inset-0" />
      <LandingNav onTryLive={onTryLive} />
      <div className="relative">
        <Hero onTryLive={onTryLive} />
        <Gallery />
        <Demo />
        <Contact />
      </div>
    </div>
  );
}
