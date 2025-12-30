import {NavLink} from 'react-router';

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <h2 className="footer-title">your time is now</h2>

        <div className="footer-bottom">
          <NavLink to="/community" className="footer-community-btn">
            community
          </NavLink>

          <p className="footer-description">
            Unlock your potential with Dare to Dream. Get exclusive drops, behind-the-scenes content, and invitations to community events.
          </p>

          <div className="footer-socials">
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 1.8c2.67 0 2.987.01 4.042.058 2.71.124 3.976 1.41 4.1 4.1.048 1.054.057 1.37.057 4.042 0 2.672-.01 2.988-.057 4.042-.124 2.687-1.387 3.975-4.1 4.1-1.055.048-1.37.058-4.042.058-2.67 0-2.987-.01-4.042-.058-2.717-.125-3.976-1.416-4.1-4.1-.048-1.054-.058-1.37-.058-4.042 0-2.672.01-2.988.058-4.042.124-2.69 1.387-3.976 4.1-4.1 1.055-.048 1.37-.058 4.042-.058zM10 0C7.284 0 6.944.012 5.878.06 2.246.227.228 2.242.06 5.877.012 6.944 0 7.284 0 10s.012 3.057.06 4.123c.167 3.632 2.182 5.65 5.817 5.817 1.067.048 1.407.06 4.123.06s3.057-.012 4.123-.06c3.63-.167 5.653-2.18 5.817-5.817.048-1.066.06-1.407.06-4.123s-.012-3.056-.06-4.122C19.773 2.249 17.76.228 14.124.06 13.057.012 12.716 0 10 0zm0 4.865a5.135 5.135 0 100 10.27 5.135 5.135 0 000-10.27zm0 8.468a3.333 3.333 0 110-6.666 3.333 3.333 0 010 6.666zm5.338-9.87a1.2 1.2 0 100 2.4 1.2 1.2 0 000-2.4z" fill="currentColor"/>
              </svg>
            </a>
            <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
              <svg width="21" height="15" viewBox="0 0 21 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.594 2.203A5.833 5.833 0 0114.76 0h-2.5v10.208a2.292 2.292 0 11-1.927-2.26V5.417a4.792 4.792 0 104.427 4.791V5.19a8.28 8.28 0 004.834 1.56V4.25a5.83 5.83 0 01-1-.047c.334-.628.534-1.328.584-2" fill="currentColor"/>
              </svg>
            </a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
              <svg width="18" height="20" viewBox="0 0 18 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.624 5.124a2.26 2.26 0 00-1.59-1.6C14.63 3.125 9 3.125 9 3.125s-5.63 0-7.035.4a2.26 2.26 0 00-1.59 1.6A23.68 23.68 0 000 10a23.68 23.68 0 00.376 4.876 2.26 2.26 0 001.59 1.6c1.404.399 7.034.399 7.034.399s5.63 0 7.035-.4a2.26 2.26 0 001.59-1.6A23.68 23.68 0 0018 10a23.68 23.68 0 00-.376-4.876zM7.188 12.969V7.03L11.906 10l-4.72 2.969z" fill="currentColor"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
