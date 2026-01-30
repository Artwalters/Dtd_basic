import type {Route} from './+types/pages.members';
import {Link} from 'react-router';
import {getSeoMeta} from '@shopify/hydrogen';
import {Footer} from '~/components/Footer';
import {FooterParallax} from '~/components/FooterReveal';

export const meta: Route.MetaFunction = () => {
  return getSeoMeta({
    title: 'Meet the Team',
    titleTemplate: 'Dare to Dream | %s',
    description: 'Meet the people behind Dare to Dream. Our athletes and team members who live the mindset every day.',
    url: '/pages/members',
  });
};

export default function MeetTheTeamPage() {
  return (
    <>
      <section className="about-editorial">
        <div className="section-divider-with-title about-editorial-header">
          <div className="section-divider-line section-divider-line-left" />
          <div className="about-editorial-title-wrapper">
            <span className="about-editorial-subtitle">The people behind it</span>
            <h1 className="section-divider-title">Meet the Team</h1>
          </div>
          <div className="section-divider-line section-divider-line-right" />
        </div>

        {/* 01 — Sem: divider + text left, image right */}
        <div className="about-editorial-row">
          <div className="about-editorial-row__left">
            <div className="section-divider" />
            <div className="about-editorial-row__text">
              <span className="about-chapter-number">01 — Sem</span>
              <span className="about-chapter-role">Owner</span>
              <p>
                The one who started it all. Sem lives and breathes discipline.
                What began as a personal journey in the gym turned into a
                vision — to build something that connects people who share the
                same relentless mindset.
              </p>
              <p>
                He leads by example. No shortcuts, no excuses. Just showing up,
                every single day, and holding himself to a higher standard.
              </p>
            </div>
          </div>
          <div className="about-editorial-row__image">
            <img src="/Img/DSC04304.webp" alt="Sem" />
          </div>
        </div>

        {/* 02 — Renzo: image left, divider + text right */}
        <div className="about-editorial-row about-editorial-row--reverse">
          <div className="about-editorial-row__image">
            <img src="/Img/DSC04793.webp" alt="Renzo" />
          </div>
          <div className="about-editorial-row__left">
            <div className="section-divider" />
            <div className="about-editorial-row__text">
              <span className="about-chapter-number">02 — Renzo</span>
              <span className="about-chapter-role">Owner</span>
              <p>
                Sem's right hand from day one. Renzo brings the same intensity
                to everything he does — in the gym and beyond. Together they
                built the foundation of Dare to Dream.
              </p>
              <p>
                His drive pushes everyone around him to be better. He doesn't
                just talk about the vision — he lives it.
              </p>
            </div>
          </div>
        </div>

        {/* 03 — Stan: divider + text left, image right */}
        <div className="about-editorial-row">
          <div className="about-editorial-row__left">
            <div className="section-divider" />
            <div className="about-editorial-row__text">
              <span className="about-chapter-number">03 — Stan</span>
              <span className="about-chapter-role">Creative & Camera Guy</span>
              <p>
                The eye behind the lens. Stan captures the energy, the grind,
                and the culture of Dare to Dream. Every shot tells a story —
                raw, real, and unfiltered.
              </p>
              <p>
                He turns moments into visuals that speak louder than words.
                The brand's look and feel? That's Stan.
              </p>
            </div>
          </div>
          <div className="about-editorial-row__image">
            <img src="/Img/DSC06984.webp" alt="Stan" />
          </div>
        </div>

        {/* 04 — Arthur: image left, divider + text right */}
        <div className="about-editorial-row about-editorial-row--reverse">
          <div className="about-editorial-row__image">
            <img src="/Img/DSC04793.webp" alt="Arthur" />
          </div>
          <div className="about-editorial-row__left">
            <div className="section-divider" />
            <div className="about-editorial-row__text">
              <span className="about-chapter-number">04 — Arthur</span>
              <span className="about-chapter-role">Creative & Developer</span>
              <p>
                The one who brings it all to life digitally. Arthur designs and
                builds the online experience — from the website to the brand's
                visual identity.
              </p>
              <p>
                He combines creativity with code, making sure everything you
                see and interact with reflects the standard Dare to Dream
                stands for.
              </p>
            </div>
          </div>
        </div>

        {/* Quote */}
        <blockquote className="about-editorial-blockquote">
          "You can't build something meaningful on your own. You need people around you who believe in the same thing — and push you to keep going."
        </blockquote>

        <div className="section-divider" />

        {/* Bottom Nav */}
        <div className="about-chapter-nav">
          <Link to="/pages/about" className="btn btn-glass about-chapter-nav-btn">Previous Chapter</Link>
          <Link to="/collections/all" className="btn btn-solid about-chapter-nav-btn">Shop Now</Link>
        </div>
      </section>

      <Footer />
      <FooterParallax />
    </>
  );
}
