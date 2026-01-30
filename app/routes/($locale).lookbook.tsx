import type {Route} from './+types/lookbook';
import {getSeoMeta} from '@shopify/hydrogen';
import {Footer} from '~/components/Footer';
import {FooterParallax} from '~/components/FooterReveal';

export const meta: Route.MetaFunction = () => {
  return getSeoMeta({
    title: 'Lookbook',
    titleTemplate: 'Dare to Dream | %s',
    description: 'Explore the Dare to Dream lookbook. See our latest styles and collections.',
    url: '/lookbook',
  });
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
