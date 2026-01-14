import type {Route} from './+types/community';
import {CommunitySection} from '~/components/CommunitySection';
import {Footer} from '~/components/Footer';
import {FooterParallax} from '~/components/FooterReveal';

export const meta: Route.MetaFunction = () => {
  return [{title: 'Dare to Dream | Community'}];
};

export default function CommunityPage() {
  return (
    <>
      <section className="community-page">
        <CommunitySection />
      </section>
      <Footer />
      <FooterParallax />
    </>
  );
}
