import {useEffect, useRef, useState} from 'react';
import type {Route} from './+types/policies._index';
import {Footer} from '~/components/Footer';
import {FooterParallax} from '~/components/FooterReveal';
import {getLenis} from '~/hooks/useLenis';

export const meta: Route.MetaFunction = () => {
  return [{title: 'Dare to Dream | Policies'}];
};

const policyNavItems = [
  {id: 'privacy', label: 'Privacy Policy'},
  {id: 'terms', label: 'Terms of Service'},
  {id: 'shipping', label: 'Shipping Policy'},
  {id: 'returns', label: 'Returns & Exchanges'},
  {id: 'contact', label: 'Contact'},
];

export default function PoliciesPage() {
  const [activeSection, setActiveSection] = useState('privacy');
  const [isQuickNavOpen, setIsQuickNavOpen] = useState(false);
  const [showQuickNav, setShowQuickNav] = useState(true);
  const sectionRef = useRef<HTMLElement>(null);

  // Track if we're in the policies section
  useEffect(() => {
    const checkVisibility = () => {
      const section = sectionRef.current;
      if (!section) return;

      const rect = section.getBoundingClientRect();
      // Hide when section bottom is near the Quick Nav (bottom of viewport minus nav height ~80px)
      const navHeight = 80;
      const isVisible = rect.bottom > window.innerHeight - navHeight + 50;
      setShowQuickNav(isVisible);
    };

    // Check on mount
    checkVisibility();

    // Listen to Lenis scroll
    const lenis = getLenis();
    if (lenis) {
      lenis.on('scroll', checkVisibility);
    }

    // Fallback to native scroll
    window.addEventListener('scroll', checkVisibility, { passive: true });

    return () => {
      if (lenis) {
        lenis.off('scroll', checkVisibility);
      }
      window.removeEventListener('scroll', checkVisibility);
    };
  }, []);

  useEffect(() => {
    const sections = policyNavItems.map(item => document.getElementById(item.id));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-20% 0px -60% 0px',
        threshold: 0,
      }
    );

    sections.forEach((section) => {
      if (section) observer.observe(section);
    });

    return () => {
      sections.forEach((section) => {
        if (section) observer.unobserve(section);
      });
    };
  }, []);

  // Lock scroll when quick nav is open
  useEffect(() => {
    if (!isQuickNavOpen) return;

    const lenis = getLenis();
    lenis?.stop();
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    return () => {
      lenis?.start();
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isQuickNavOpen]);

  const handleNavClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      // Close quick nav popup first
      setIsQuickNavOpen(false);

      // Small delay to let popup close before scrolling
      setTimeout(() => {
        const lenis = getLenis();
        if (lenis) {
          lenis.scrollTo(element, {offset: -100});
        } else {
          element.scrollIntoView({behavior: 'smooth', block: 'start'});
        }
      }, 100);
    }
  };

  const activeLabel = policyNavItems.find(item => item.id === activeSection)?.label || 'Quick Nav';

  return (
    <>
      <section className="policies-page" ref={sectionRef}>
        <div className="policies-container">
          {/* Left Navigation */}
          <nav className="policies-nav">
            <div className="policies-nav-inner">
              <div className="policy-divider" />
              <ul className="policies-nav-list">
                {policyNavItems.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => handleNavClick(item.id)}
                      className={`policies-nav-link ${activeSection === item.id ? 'active' : ''}`}
                    >
                      <span className="policies-nav-arrow">&darr;</span>
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
              <div className="policy-divider divider-bottom" />
            </div>
          </nav>

          {/* Right Content */}
          <div className="policies-content">
            {/* Privacy Policy */}
            <article id="privacy" className="policy-section">
              <div className="policy-divider" />
              <h2 className="policy-title">Privacy Policy</h2>

              <div className="policy-block">
                <h3>Information We Collect</h3>
                <p>When you visit our website or make a purchase, we collect certain information about you, including:</p>
                <ul>
                  <li><strong>Personal Information:</strong> Name, email address, shipping and billing address, phone number, and payment information when you make a purchase.</li>
                  <li><strong>Account Information:</strong> If you create an account, we store your login credentials and order history.</li>
                  <li><strong>Device Information:</strong> IP address, browser type, operating system, and device identifiers through cookies and similar technologies.</li>
                  <li><strong>Usage Data:</strong> Pages visited, products viewed, time spent on our site, and referring websites.</li>
                </ul>
              </div>

              <div className="policy-block">
                <h3>How We Use Your Information</h3>
                <p>We use the information we collect to:</p>
                <ul>
                  <li>Process and fulfill your orders, including shipping and payment processing.</li>
                  <li>Communicate with you about your orders, including order confirmations, shipping updates, and customer service inquiries.</li>
                  <li>Send promotional emails about new products, special offers, and updates (you can opt out at any time).</li>
                  <li>Improve our website, products, and services based on your feedback and browsing behavior.</li>
                  <li>Prevent fraud and enhance the security of our website.</li>
                  <li>Comply with legal obligations and enforce our terms of service.</li>
                </ul>
              </div>

              <div className="policy-block">
                <h3>Information Sharing</h3>
                <p>We do not sell, trade, or rent your personal information to third parties. We may share your information with:</p>
                <ul>
                  <li><strong>Service Providers:</strong> Third-party companies that help us operate our business, such as payment processors, shipping carriers, and email marketing platforms.</li>
                  <li><strong>Legal Requirements:</strong> When required by law, court order, or governmental authority.</li>
                  <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets.</li>
                </ul>
              </div>

              <div className="policy-block">
                <h3>Cookies and Tracking Technologies</h3>
                <p>We use cookies and similar tracking technologies to enhance your browsing experience, analyze site traffic, and personalize content. You can control cookie preferences through your browser settings. Essential cookies are required for the website to function properly.</p>
              </div>

              <div className="policy-block">
                <h3>Data Security</h3>
                <p>We implement industry-standard security measures to protect your personal information, including SSL encryption for data transmission and secure storage of payment information. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.</p>
              </div>

              <div className="policy-block">
                <h3>Your Rights</h3>
                <p>Depending on your location, you may have certain rights regarding your personal data:</p>
                <ul>
                  <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
                  <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data.</li>
                  <li><strong>Deletion:</strong> Request deletion of your personal data, subject to legal requirements.</li>
                  <li><strong>Opt-out:</strong> Unsubscribe from marketing communications at any time.</li>
                  <li><strong>Data Portability:</strong> Request your data in a structured, machine-readable format.</li>
                </ul>
                <p>To exercise any of these rights, please contact us at the email address provided below.</p>
              </div>

              <div className="policy-block">
                <h3>Children's Privacy</h3>
                <p>Our website is not intended for children under the age of 16. We do not knowingly collect personal information from children. If you believe we have inadvertently collected information from a child, please contact us immediately.</p>
              </div>

              <div className="policy-block">
                <h3>Changes to This Policy</h3>
                <p>We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will notify you of any material changes by posting the updated policy on our website with a new effective date.</p>
              </div>
              <div className="policy-divider divider-bottom" />
            </article>

            {/* Terms of Service */}
            <article id="terms" className="policy-section">
              <div className="policy-divider" />
              <h2 className="policy-title">Terms of Service</h2>

              <div className="policy-block">
                <h3>Acceptance of Terms</h3>
                <p>By accessing and using the Dare to Dream website, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.</p>
              </div>

              <div className="policy-block">
                <h3>Use of Website</h3>
                <p>You may use our website for lawful purposes only. You agree not to:</p>
                <ul>
                  <li>Use the website in any way that violates applicable laws or regulations.</li>
                  <li>Attempt to gain unauthorized access to any part of the website or its systems.</li>
                  <li>Use automated systems or software to extract data from the website (scraping).</li>
                  <li>Transmit any viruses, malware, or other harmful code.</li>
                  <li>Impersonate any person or entity or misrepresent your affiliation.</li>
                  <li>Interfere with the proper functioning of the website.</li>
                </ul>
              </div>

              <div className="policy-block">
                <h3>Intellectual Property</h3>
                <p>All content on this website, including but not limited to text, graphics, logos, images, product designs, and software, is the property of Dare to Dream and is protected by copyright, trademark, and other intellectual property laws. You may not reproduce, distribute, modify, or create derivative works without our express written permission.</p>
              </div>

              <div className="policy-block">
                <h3>Product Information</h3>
                <p>We strive to provide accurate product descriptions, images, and pricing. However, we do not warrant that product descriptions, images, or other content is accurate, complete, reliable, current, or error-free. Colors may appear differently depending on your device's display settings.</p>
              </div>

              <div className="policy-block">
                <h3>Pricing and Availability</h3>
                <p>All prices are displayed in the currency indicated and are subject to change without notice. We reserve the right to modify or discontinue any product at any time. In the event of a pricing error, we reserve the right to cancel any orders placed at the incorrect price.</p>
              </div>

              <div className="policy-block">
                <h3>Order Acceptance</h3>
                <p>Your receipt of an order confirmation does not constitute our acceptance of your order. We reserve the right to accept or decline your order for any reason, including but not limited to product availability, errors in product or pricing information, or suspected fraud.</p>
              </div>

              <div className="policy-block">
                <h3>Limitation of Liability</h3>
                <p>To the fullest extent permitted by law, Dare to Dream shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the website or purchase of products. Our total liability shall not exceed the amount you paid for the product giving rise to the claim.</p>
              </div>

              <div className="policy-block">
                <h3>Indemnification</h3>
                <p>You agree to indemnify and hold harmless Dare to Dream, its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from your violation of these Terms of Service or your use of the website.</p>
              </div>

              <div className="policy-block">
                <h3>Governing Law</h3>
                <p>These Terms of Service shall be governed by and construed in accordance with the laws of the Netherlands, without regard to its conflict of law provisions. Any disputes arising under these terms shall be subject to the exclusive jurisdiction of the courts in the Netherlands.</p>
              </div>

              <div className="policy-block">
                <h3>Modifications</h3>
                <p>We reserve the right to modify these Terms of Service at any time. Changes will be effective immediately upon posting to the website. Your continued use of the website following any changes constitutes acceptance of the modified terms.</p>
              </div>
              <div className="policy-divider divider-bottom" />
            </article>

            {/* Shipping Policy */}
            <article id="shipping" className="policy-section">
              <div className="policy-divider" />
              <h2 className="policy-title">Shipping Policy</h2>

              <div className="policy-block">
                <h3>Processing Time</h3>
                <p>Orders are typically processed within 1-3 business days after payment confirmation. During peak seasons or promotional periods, processing times may be extended. You will receive an email confirmation once your order has been shipped.</p>
              </div>

              <div className="policy-block">
                <h3>Domestic Shipping (Netherlands)</h3>
                <ul>
                  <li><strong>Standard Shipping:</strong> 2-4 business days - Free on orders over €75</li>
                  <li><strong>Express Shipping:</strong> 1-2 business days - €9.95</li>
                </ul>
              </div>

              <div className="policy-block">
                <h3>European Union Shipping</h3>
                <ul>
                  <li><strong>Standard Shipping:</strong> 5-10 business days - €12.95 (Free on orders over €150)</li>
                  <li><strong>Express Shipping:</strong> 3-5 business days - €24.95</li>
                </ul>
                <p>Please note that customs duties and taxes may apply for orders shipped outside the Netherlands. These charges are the responsibility of the recipient.</p>
              </div>

              <div className="policy-block">
                <h3>International Shipping</h3>
                <ul>
                  <li><strong>Standard Shipping:</strong> 10-20 business days - €19.95</li>
                  <li><strong>Express Shipping:</strong> 5-10 business days - €39.95</li>
                </ul>
                <p>International orders may be subject to import duties, taxes, and customs fees, which are levied by the destination country. These charges are not included in our shipping fees and are the responsibility of the customer.</p>
              </div>

              <div className="policy-block">
                <h3>Order Tracking</h3>
                <p>Once your order has been shipped, you will receive an email with tracking information. You can track your package using the provided tracking number on our website or the carrier's website. Please allow 24-48 hours for tracking information to become available.</p>
              </div>

              <div className="policy-block">
                <h3>Delivery Issues</h3>
                <p>If your package is lost, damaged, or significantly delayed, please contact our customer service team within 30 days of the expected delivery date. We will work with the carrier to resolve the issue and, if necessary, arrange for a replacement or refund.</p>
              </div>

              <div className="policy-block">
                <h3>Address Accuracy</h3>
                <p>Please ensure that your shipping address is correct and complete. We are not responsible for packages delivered to incorrect addresses provided by the customer. If a package is returned to us due to an incorrect address, you will be responsible for additional shipping costs to reship the order.</p>
              </div>
              <div className="policy-divider divider-bottom" />
            </article>

            {/* Returns & Exchanges */}
            <article id="returns" className="policy-section">
              <div className="policy-divider" />
              <h2 className="policy-title">Returns & Exchanges</h2>

              <div className="policy-block">
                <h3>Right of Withdrawal</h3>
                <p>In accordance with European consumer protection laws, you have 14 days after receipt of your order to exercise your right of withdrawal, without having to provide reasons or pay penalties, with the exception of return shipping costs.</p>
              </div>

              <div className="policy-block">
                <h3>Return Conditions</h3>
                <p>To be eligible for a return, your item must be:</p>
                <ul>
                  <li>Unused and in the condition you received it.</li>
                  <li>Unwashed, undamaged, and odorless.</li>
                  <li>Returned in its original packaging with all tags attached.</li>
                  <li>Accompanied by the original receipt or proof of purchase.</li>
                </ul>
                <p>Items that do not meet these conditions may be refused or subject to a restocking fee.</p>
              </div>

              <div className="policy-block">
                <h3>Non-Returnable Items</h3>
                <p>The following items cannot be returned or exchanged:</p>
                <ul>
                  <li>Items marked as final sale or clearance.</li>
                  <li>Personalized or custom-made products.</li>
                  <li>Intimate apparel and swimwear (for hygiene reasons).</li>
                  <li>Items that have been worn, washed, or altered.</li>
                  <li>Gift cards.</li>
                </ul>
              </div>

              <div className="policy-block">
                <h3>Return Process</h3>
                <p>To initiate a return or exchange:</p>
                <ol>
                  <li>Contact us at support@daretodream.nl within 14 days of receiving your order.</li>
                  <li>Provide your order number and reason for the return.</li>
                  <li>We will provide you with a return authorization number and shipping instructions.</li>
                  <li>Pack the item securely in its original packaging.</li>
                  <li>Ship the item to the address provided within 14 days of receiving authorization.</li>
                </ol>
                <p>We recommend using a tracked shipping service and retaining your proof of postage.</p>
              </div>

              <div className="policy-block">
                <h3>Return Shipping Costs</h3>
                <p>Return shipping costs are the responsibility of the customer, except in the following cases:</p>
                <ul>
                  <li>You received a defective or damaged item.</li>
                  <li>You received an incorrect item.</li>
                  <li>The item was significantly different from its description.</li>
                </ul>
                <p>In these cases, we will provide a prepaid return label or reimburse your return shipping costs.</p>
              </div>

              <div className="policy-block">
                <h3>Refunds</h3>
                <p>Once we receive and inspect your returned item, we will notify you of the status of your refund. If approved, your refund will be processed within 7 business days to the original payment method. Please note that it may take additional time for the refund to appear on your statement, depending on your bank or payment provider.</p>
              </div>

              <div className="policy-block">
                <h3>Exchanges</h3>
                <p>We offer free exchanges for items of equal value within the Netherlands. For exchanges, please contact us with your order number and the item you would like in exchange. Exchanges are subject to stock availability. If the desired item is not available, we will issue a refund for the returned item.</p>
              </div>

              <div className="policy-block">
                <h3>Damaged or Defective Items</h3>
                <p>If you receive a damaged or defective item, please contact us within 48 hours of delivery with photos of the damage. We will arrange for a replacement or full refund, including any shipping costs incurred.</p>
              </div>
              <div className="policy-divider divider-bottom" />
            </article>

            {/* Contact */}
            <article id="contact" className="policy-section">
              <div className="policy-divider" />
              <h2 className="policy-title">Contact Us</h2>

              <div className="policy-block">
                <h3>Customer Service</h3>
                <p>Our customer service team is available to assist you with any questions, concerns, or feedback. We strive to respond to all inquiries within 24-48 hours during business days.</p>
              </div>

              <div className="policy-block">
                <h3>Email</h3>
                <p>For general inquiries: <a href="mailto:info@daretodream.nl">info@daretodream.nl</a></p>
                <p>For order support: <a href="mailto:support@daretodream.nl">support@daretodream.nl</a></p>
                <p>For press inquiries: <a href="mailto:press@daretodream.nl">press@daretodream.nl</a></p>
              </div>

              <div className="policy-block">
                <h3>Business Hours</h3>
                <p>Monday - Friday: 9:00 AM - 6:00 PM (CET)</p>
                <p>Saturday - Sunday: Closed</p>
                <p>We are closed on Dutch national holidays.</p>
              </div>

              <div className="policy-block">
                <h3>Social Media</h3>
                <p>Follow us on social media for the latest updates, new releases, and exclusive offers:</p>
                <ul>
                  <li>Instagram: @daretodream</li>
                  <li>TikTok: @daretodream</li>
                </ul>
              </div>

              <div className="policy-block">
                <h3>Business Address</h3>
                <p>Dare to Dream</p>
                <p>Amsterdam, Netherlands</p>
              </div>

              <div className="policy-block">
                <h3>Feedback</h3>
                <p>We value your feedback and are constantly working to improve our products and services. If you have suggestions or comments, please don't hesitate to reach out. Your input helps us serve you better.</p>
              </div>
              <div className="policy-divider divider-bottom" />
            </article>
          </div>

          {/* Mobile Quick Nav - Sticky Button */}
          <div className={`policies-quick-nav-trigger ${showQuickNav ? 'visible' : ''}`}>
            <button
              className="policies-quick-nav-btn"
              onClick={() => setIsQuickNavOpen(true)}
            >
              <span>{activeLabel}</span>
              <span className="policies-quick-nav-icon">OPEN</span>
            </button>
            {/* Progress Bar */}
            <div className="policies-quick-nav-progress">
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    width: `${100 / policyNavItems.length}%`,
                    transform: `translateX(${policyNavItems.findIndex(item => item.id === activeSection) * 100}%)`
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Quick Nav - Backdrop */}
        <div
          className={`policies-quick-nav-backdrop ${isQuickNavOpen ? 'open' : ''}`}
          onClick={() => setIsQuickNavOpen(false)}
        />

        {/* Mobile Quick Nav - Popup */}
        <div className={`policies-quick-nav-popup ${isQuickNavOpen ? 'open' : ''}`}>
          <div className="policies-quick-nav-popup__header">
            <h2 className="policies-quick-nav-popup__title">Quick Nav</h2>
            <button
              className="policies-quick-nav-popup__close"
              onClick={() => setIsQuickNavOpen(false)}
            >
              CLOSE
            </button>
          </div>
          <div className="mobile-quick-add__divider-bracket" />
          <ul className="policies-quick-nav-popup__list">
            {policyNavItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => handleNavClick(item.id)}
                  className={`policies-quick-nav-popup__link ${activeSection === item.id ? 'active' : ''}`}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
          <div className="mobile-quick-add__divider-bracket divider-bottom" />
        </div>
      </section>

      <Footer />
      <FooterParallax />
    </>
  );
}
