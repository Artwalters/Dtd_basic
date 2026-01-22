import {Link} from 'react-router';
import {useEffect} from 'react';

export function Footer() {
  // Initialize accordion functionality for mobile
  useEffect(() => {
    function initAccordionCSS() {
      const accordionElements = document.querySelectorAll('.footer-accordion[data-accordion-css-init]');

      accordionElements.forEach((accordion) => {
        const closeSiblings = accordion.getAttribute('data-accordion-close-siblings') === 'true';

        // Remove existing event listener to avoid duplicates
        const newAccordion = accordion.cloneNode(true);
        accordion.parentNode?.replaceChild(newAccordion, accordion);

        newAccordion.addEventListener('click', (event) => {
          const toggle = (event.target as Element).closest('[data-accordion-toggle]');
          if (!toggle) return;

          const singleAccordion = toggle.closest('[data-accordion-status]');
          if (!singleAccordion) return;

          const isActive = singleAccordion.getAttribute('data-accordion-status') === 'active';
          singleAccordion.setAttribute('data-accordion-status', isActive ? 'not-active' : 'active');

          if (closeSiblings && !isActive) {
            newAccordion.querySelectorAll('[data-accordion-status="active"]').forEach((sibling) => {
              if (sibling !== singleAccordion) {
                sibling.setAttribute('data-accordion-status', 'not-active');
              }
            });
          }
        });
      });
    }

    const timeoutId = setTimeout(() => {
      initAccordionCSS();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, []);

  const footerSections = [
    {
      title: 'Help',
      links: [
        {to: '/policies#contact', label: 'Contact'},
        {to: '/policies#faq', label: 'FAQ'},
        {to: '/policies#shipping', label: 'Shipping'},
      ],
    },
    {
      title: 'About Us',
      links: [
        {to: '/pages/about', label: 'Our Story'},
        {to: '/pages/members', label: 'Community'},
        {to: '/pages/lookbook', label: 'Lookbook'},
      ],
    },
    {
      title: 'Socials',
      links: [
        {href: 'https://www.instagram.com/daretodream/', label: 'Instagram'},
        {href: 'https://www.facebook.com/daretodream', label: 'Facebook'},
        {href: 'https://www.tiktok.com/@daretodream', label: 'TikTok'},
      ],
    },
  ];

  return (
    <footer className="footer-links">
      {/* Divider with brackets at top */}
      <div className="section-divider footer-divider-top"></div>

      {/* Desktop Layout */}
      <div className="footer-links-grid footer-desktop">
        {/* Newsletter - wider column */}
        <div className="footer-links-col footer-newsletter">
          <h3 className="footer-links-title">Newsletter</h3>
          <p className="footer-newsletter-subtitle">Get a look behind the brand</p>
          <form className="footer-newsletter-form">
            <input
              type="email"
              placeholder="Email address"
              className="footer-newsletter-input"
            />
            <button type="submit" className="btn-glass btn-glass--icon footer-newsletter-btn" aria-label="Subscribe">
              <svg className="footer-newsletter-arrow" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 10L20 15L15 20" stroke="currentColor" strokeMiterlimit="10"></path>
                <path d="M4 4V12L7 15H20" stroke="currentColor" strokeMiterlimit="10"></path>
              </svg>
            </button>
          </form>
          <p className="footer-newsletter-disclaimer">
            you can unsubscribe at any time. <Link to="/policies/privacy-policy">privacy policy</Link>
          </p>
        </div>

        {/* Help */}
        <nav className="footer-links-col">
          <h3 className="footer-links-title">Help</h3>
          <ul className="footer-links-list">
            <li><Link to="/policies#contact">Contact</Link></li>
            <li><Link to="/policies#faq">FAQ</Link></li>
            <li><Link to="/policies#shipping">Shipping</Link></li>
          </ul>
        </nav>

        {/* About us */}
        <nav className="footer-links-col">
          <h3 className="footer-links-title">About Us</h3>
          <ul className="footer-links-list">
            <li><Link to="/pages/about">Our Story</Link></li>
            <li><Link to="/pages/members">Community</Link></li>
            <li><Link to="/pages/lookbook">Lookbook</Link></li>
          </ul>
        </nav>

        {/* Socials */}
        <nav className="footer-links-col">
          <h3 className="footer-links-title">Socials</h3>
          <ul className="footer-links-list">
            <li>
              <a href="https://www.instagram.com/daretodream/" target="_blank" rel="noopener noreferrer">
                Instagram
              </a>
            </li>
            <li>
              <a href="https://www.facebook.com/daretodream" target="_blank" rel="noopener noreferrer">
                Facebook
              </a>
            </li>
            <li>
              <a href="https://www.tiktok.com/@daretodream" target="_blank" rel="noopener noreferrer">
                TikTok
              </a>
            </li>
          </ul>
        </nav>
      </div>

      {/* Mobile Layout */}
      <div className="footer-mobile">
        {/* Newsletter */}
        <div className="footer-newsletter-mobile">
          <h3 className="footer-newsletter-mobile-title">Newsletter</h3>
          <form className="footer-newsletter-form">
            <input
              type="email"
              placeholder="Email address"
              className="footer-newsletter-input"
            />
            <button type="submit" className="btn-glass btn-glass--icon footer-newsletter-btn" aria-label="Subscribe">
              <svg className="footer-newsletter-arrow" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 10L20 15L15 20" stroke="currentColor" strokeMiterlimit="10"></path>
                <path d="M4 4V12L7 15H20" stroke="currentColor" strokeMiterlimit="10"></path>
              </svg>
            </button>
          </form>
          <p className="footer-newsletter-disclaimer">
            Sign up to our newsletter to stay updated on new releases. <Link to="/policies/privacy-policy">privacy policy</Link>
          </p>
        </div>

        {/* Accordion Sections */}
        <div data-accordion-close-siblings="true" data-accordion-css-init="" className="accordion-css footer-accordion">
          <ul className="accordion-css__list">
            {footerSections.map((section) => (
              <li key={section.title} data-accordion-status="not-active" className="accordion-css__item">
                <div data-accordion-toggle="" className="accordion-css__item-top">
                  <h3 className="accordion-css__item-h3">{section.title}</h3>
                  <div className="accordion-css__item-icon">
                    <svg className="accordion-css__item-icon-svg" xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 24 24" fill="none">
                      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
                <div className="accordion-css__item-bottom">
                  <div className="accordion-css__item-bottom-wrap">
                    <div className="accordion-css__item-bottom-content">
                      <ul className="footer-links-list">
                        {section.links.map((link) => (
                          <li key={link.label}>
                            {'to' in link ? (
                              <Link to={link.to}>{link.label}</Link>
                            ) : (
                              <a href={link.href} target="_blank" rel="noopener noreferrer">
                                {link.label}
                              </a>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="section-divider footer-divider-bottom"></div>
    </footer>
  );
}
