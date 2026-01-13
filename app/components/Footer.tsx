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

        {/* Shop */}
        <nav className="footer-links-col">
          <h3 className="footer-links-title">Shop</h3>
          <ul className="footer-links-list">
            <li>
              <Link to="/pages/boutique-pickup">Boutique pick-up</Link>
            </li>
            <li>
              <Link to="/products/gift-card">Gift card</Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className="section-divider"></div>
    </footer>
  );
}
