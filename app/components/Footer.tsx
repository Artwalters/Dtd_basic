import {Link} from 'react-router';

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        {/* Client Services */}
        <nav className="footer-column">
          <h3 className="footer-column-title">Client Services</h3>
          <ul className="footer-column-list">
            <li>
              <Link to="/pages/support">Support Hub</Link>
            </li>
            <li>
              <Link to="/pages/track-order">Track order</Link>
            </li>
            <li>
              <Link to="/pages/returns">Make a return</Link>
            </li>
            <li>
              <Link to="/pages/stores">Stores</Link>
            </li>
          </ul>
        </nav>

        {/* Company */}
        <nav className="footer-column">
          <h3 className="footer-column-title">Company</h3>
          <ul className="footer-column-list">
            <li>
              <Link to="/pages/about">About</Link>
            </li>
            <li>
              <Link to="/pages/careers">Careers</Link>
            </li>
            <li>
              <Link to="/pages/reviews">Reviews</Link>
            </li>
            <li>
              <Link to="/pages/shipping">Shipping</Link>
            </li>
            <li>
              <Link to="/pages/returns-policy">Returns</Link>
            </li>
          </ul>
        </nav>

        {/* Social */}
        <nav className="footer-column">
          <h3 className="footer-column-title">Social</h3>
          <ul className="footer-column-list">
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
            <li>
              <a href="https://www.youtube.com/@daretodream" target="_blank" rel="noopener noreferrer">
                YouTube
              </a>
            </li>
            <li>
              <a href="https://x.com/daretodream" target="_blank" rel="noopener noreferrer">
                X
              </a>
            </li>
          </ul>
        </nav>

        {/* Country */}
        <div className="footer-column">
          <h3 className="footer-column-title">Country</h3>
          <ul className="footer-column-list">
            <li>
              <span className="footer-country">Netherlands</span>
            </li>
            <li>
              <span className="footer-locale">NL / EUR € | English</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="footer-border" />
    </footer>
  );
}
