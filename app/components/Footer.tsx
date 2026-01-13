import {Link} from 'react-router';

export function Footer() {
  return (
    <footer className="footer-links">
      <div className="footer-links-grid">
        {/* Help */}
        <nav className="footer-links-col">
          <h3 className="footer-links-title">Help</h3>
          <ul className="footer-links-list">
            <li>
              <Link to="/pages/faq">FAQ</Link>
            </li>
            <li>
              <Link to="/pages/contact">Contact us</Link>
            </li>
            <li>
              <Link to="/pages/shipping">Shipping & Delivery</Link>
            </li>
            <li>
              <Link to="/pages/returns">Make a return</Link>
            </li>
          </ul>
        </nav>

        {/* About us */}
        <nav className="footer-links-col">
          <h3 className="footer-links-title">About us</h3>
          <ul className="footer-links-list">
            <li>
              <Link to="/pages/about">About us</Link>
            </li>
            <li>
              <Link to="/pages/careers">Careers</Link>
            </li>
            <li>
              <Link to="/pages/members">Members</Link>
            </li>
            <li>
              <Link to="/pages/boutique">Our Boutique</Link>
            </li>
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
              <a href="https://www.youtube.com/@daretodream" target="_blank" rel="noopener noreferrer">
                YouTube
              </a>
            </li>
            <li>
              <a href="https://www.tiktok.com/@daretodream" target="_blank" rel="noopener noreferrer">
                TikTok
              </a>
            </li>
            <li>
              <a href="https://open.spotify.com/user/daretodream" target="_blank" rel="noopener noreferrer">
                Spotify
              </a>
            </li>
          </ul>
        </nav>

        {/* Get Updates */}
        <div className="footer-links-col footer-newsletter">
          <h3 className="footer-links-title">Get Updates</h3>
          <form className="footer-newsletter-form">
            <input
              type="email"
              placeholder="Email address"
              className="footer-newsletter-input"
            />
            <button type="submit" className="btn-glass btn-glass--icon footer-newsletter-btn" aria-label="Subscribe">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 10L20 15L15 20" stroke="currentColor" strokeMiterlimit="10"></path>
                <path d="M4 4V12L7 15H20" stroke="currentColor" strokeMiterlimit="10"></path>
              </svg>
            </button>
          </form>
          <label className="footer-newsletter-checkbox">
            <input type="checkbox" />
            <span className="footer-newsletter-checkmark"></span>
            <span className="footer-newsletter-label">Signup and get a look behind the scenes</span>
          </label>
        </div>
      </div>
      <div className="section-divider"></div>
    </footer>
  );
}
