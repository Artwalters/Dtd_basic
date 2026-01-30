import type {Route} from './+types/community';
import {getSeoMeta} from '@shopify/hydrogen';
import {CommunitySection} from '~/components/CommunitySection';
import {Footer} from '~/components/Footer';
import {FooterParallax} from '~/components/FooterReveal';

export const meta: Route.MetaFunction = () => {
  return getSeoMeta({
    title: 'Community',
    titleTemplate: 'Dare to Dream | %s',
    description:
      'Join the Dare to Dream community. Connect with like-minded people who share the same drive and ambition.',
    url: '/community',
  });
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
