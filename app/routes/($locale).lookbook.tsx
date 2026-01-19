import type {Route} from './+types/lookbook';
import {Footer} from '~/components/Footer';
import {FooterParallax} from '~/components/FooterReveal';

export const meta: Route.MetaFunction = () => {
  return [{title: 'Dare to Dream | Lookbook'}];
};

export default function LookbookPage() {
  return (
    <>
      <section className="lookbook-page">
        <div className="page-content" style={{paddingTop: '10em', minHeight: '60vh', textAlign: 'center'}}>
          <h1>Lookbook</h1>
          <p>Coming soon</p>
        </div>
      </section>
      <Footer />
      <FooterParallax />
    </>
  );
}
