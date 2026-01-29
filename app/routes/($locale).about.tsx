import type {Route} from './+types/about';
import {Footer} from '~/components/Footer';
import {FooterParallax} from '~/components/FooterReveal';

export const meta: Route.MetaFunction = () => {
  return [{title: 'Dare to Dream | About'}];
};

export default function AboutPage() {
  return (
    <>
      {/* Origin Story */}
      <section className="about-section">
        <div className="section-divider" />
        <div className="about-section-header">
          <h2 className="about-section-title">The Beginning</h2>
          <span className="about-section-subtitle">Where it started</span>
        </div>
        <div className="about-content-grid">
          <div className="about-image-block">
            <img src="/Img/DSC04304.webp" alt="" className="about-image" />
          </div>
          <div className="about-text-block">
            <p>December 2024, I shared the idea with my best friend. We met each other in the gym. This place brought us together.</p>
            <p>Not just because of the physical change, but because of the mentality you develop when you show up consistently. Day in, day out. Even when no one is watching.</p>
            <p>Over time, we met more guys with the same mindset in the gym. For us, this is the place where people with a serious, disciplined and consistent approach come together.</p>
          </div>
        </div>
      </section>

      {/* The Process */}
      <section className="about-section">
        <div className="section-divider" />
        <div className="about-section-header">
          <h2 className="about-section-title">Beyond Training</h2>
          <span className="about-section-subtitle">The process</span>
        </div>
        <div className="about-content-grid about-content-grid--reverse">
          <div className="about-text-block">
            <p>Here, people work toward big physical goals. Reaching their best shape, or even stepping on a bodybuilding stage. That process takes time, discipline and sacrifice. You have to make choices and let certain things go to move forward.</p>
            <p>Anyone who stays in this environment long enough realizes it goes beyond training alone. It changes how you look at other areas of your life. You take more responsibility for your actions and your results.</p>
            <p>You start thinking differently. You set higher standards and bigger goals.</p>
          </div>
          <div className="about-image-block">
            <img src="/Img/DSC04793.webp" alt="" className="about-image" />
          </div>
        </div>
      </section>

      {/* Full-width Quote */}
      <section className="about-quote-section">
        <div className="section-divider-with-title">
          <div className="section-divider-line section-divider-line-left" />
          <div className="about-quote-wrapper">
            <blockquote className="about-quote">
              Not because it's easy, but because you see what's possible when you put in the work consistently, every single day.
            </blockquote>
          </div>
          <div className="section-divider-line section-divider-line-right" />
        </div>
      </section>

      {/* The Mission */}
      <section className="about-section">
        <div className="section-divider" />
        <div className="about-section-header">
          <h2 className="about-section-title">Why We Started</h2>
          <span className="about-section-subtitle">The mission</span>
        </div>
        <div className="about-content-grid">
          <div className="about-image-block">
            <img src="/Img/DSC06984.webp" alt="" className="about-image" />
          </div>
          <div className="about-text-block">
            <p>This path is hard to walk alone. You need people around you who hold the same standard and understand what the process demands.</p>
            <p>It's not for everyone. Not everyone wants or can live this way. But if you're willing to choose discipline over comfort, then this is where you belong.</p>
            <p>That's exactly why we started Dare to Dream. To bring these people together, to hold each other accountable, and to push one another toward what's meant for them.</p>
          </div>
        </div>
      </section>

      {/* Closing Statement */}
      <section className="about-closing">
        <div className="section-divider" />
        <div className="about-closing-content">
          <p className="about-closing-text">Nothing is impossible. But it takes commitment.</p>
          <p className="about-closing-cta">Your time is now.</p>
        </div>
      </section>

      <Footer />
      <FooterParallax />
    </>
  );
}
