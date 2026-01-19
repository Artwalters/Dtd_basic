import type {Route} from './+types/about';
import {Footer} from '~/components/Footer';
import {FooterParallax} from '~/components/FooterReveal';

export const meta: Route.MetaFunction = () => {
  return [{title: 'Dare to Dream | About'}];
};

export default function AboutPage() {
  return (
    <>
      <section className="about-page">
        <div className="page-content" style={{paddingTop: '10em', minHeight: '60vh', textAlign: 'center'}}>
          <h1>About</h1>
          <p>Coming soon</p>
        </div>
      </section>
      <Footer />
      <FooterParallax />
    </>
  );
}
