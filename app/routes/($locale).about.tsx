import type {Route} from './+types/about';
import {Link} from 'react-router';
import {getSeoMeta} from '@shopify/hydrogen';
import {Footer} from '~/components/Footer';
import {FooterParallax} from '~/components/FooterReveal';

export const meta: Route.MetaFunction = () => {
  return getSeoMeta({
    title: 'About',
    titleTemplate: 'Dare to Dream | %s',
    description:
      'The story behind Dare to Dream. Born from discipline, built in the gym, made for those who dare to dream bigger.',
    url: '/about',
  });
};

export default function AboutPage() {
  return (
    <>
      <section className="about-editorial">
        <div className="section-divider-with-title about-editorial-header">
          <div className="section-divider-line section-divider-line-left" />
          <div className="about-editorial-title-wrapper">
            <span className="about-editorial-subtitle">A brief story</span>
            <h1 className="section-divider-title">About the Brand</h1>
          </div>
          <div className="section-divider-line section-divider-line-right" />
        </div>

        {/* Chapter 1 — The Beginning: divider + text left, image right */}
        <div className="about-editorial-row">
          <div className="about-editorial-row__left">
            <div className="section-divider" />
            <div className="about-editorial-row__text">
              <span className="about-chapter-number">01 — The Beginning</span>
              <p>
                December 2024. I shared the idea with my best friend. We met each
                other in the gym — a place that brought us together. Not just
                because of the physical change, but because of the mentality you
                develop when you show up consistently. Day in, day out. Even when
                no one is watching.
              </p>
              <p>
                Over time, we met more people with the same mindset. The gym
                became more than a place to train — it became a filter. A place
                where people with a serious, disciplined, and consistent approach
                naturally come together.
              </p>
            </div>
          </div>
          <div className="about-editorial-row__image">
            <img src="/Img/DSC04304.webp" alt="" />
          </div>
        </div>

        {/* Chapter 2 — Beyond Training: image left, divider + text right */}
        <div className="about-editorial-row about-editorial-row--reverse">
          <div className="about-editorial-row__image">
            <img src="/Img/DSC04793.webp" alt="" />
          </div>
          <div className="about-editorial-row__left">
            <div className="section-divider" />
            <div className="about-editorial-row__text">
              <span className="about-chapter-number">02 — Beyond Training</span>
              <p>
                Here, people work toward big physical goals. Reaching their best
                shape, or even stepping on a bodybuilding stage. That process
                takes time, discipline, and sacrifice. You have to make choices
                and let certain things go to move forward.
              </p>
              <p>
                Anyone who stays in this environment long enough realizes it goes
                beyond training alone. It changes how you look at other areas of
                your life. You start thinking differently. You set higher standards
                and bigger goals.
              </p>
            </div>
          </div>
        </div>

        {/* Chapter 3 — The Mission: divider + text left, image right */}
        <div className="about-editorial-row">
          <div className="about-editorial-row__left">
            <div className="section-divider" />
            <div className="about-editorial-row__text">
              <span className="about-chapter-number">03 — The Mission</span>
              <p>
                This path is hard to walk alone. You need people around you who
                hold the same standard and understand what the process demands.
                It's not for everyone. Not everyone wants or can live this way.
                But if you're willing to choose discipline over comfort, then
                this is where you belong.
              </p>
              <p>
                That's exactly why we started Dare to Dream. To bring these
                people together, to hold each other accountable, and to push one
                another toward what's meant for them.
              </p>
            </div>
          </div>
          <div className="about-editorial-row__image">
            <img src="/Img/DSC06984.webp" alt="" />
          </div>
        </div>

        {/* Quote */}
        <blockquote className="about-editorial-blockquote">
          "Nothing is impossible. But it takes commitment. Your time is now."
        </blockquote>

        <div className="section-divider" />

        {/* Bottom Nav */}
        <div className="about-chapter-nav">
          <Link to="/collections/all" className="btn btn-glass about-chapter-nav-btn">Shop Now</Link>
          <Link to="/pages/members" className="btn btn-solid about-chapter-nav-btn">Next Chapter</Link>
        </div>
      </section>

      <Footer />
      <FooterParallax />
    </>
  );
}
