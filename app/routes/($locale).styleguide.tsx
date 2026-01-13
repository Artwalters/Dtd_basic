import type {Route} from './+types/styleguide';
import DTDLogo from '~/assets/DTD.svg';
import LogoFullText from '~/assets/logo-full-text-horizontal-white.svg';

export const meta: Route.MetaFunction = () => {
  return [{title: 'Style Guide | Dare to Dream'}];
};

export default function StyleGuide() {
  return (
    <div className="styleguide">
      <h1>Style Guide</h1>
      <p>Overzicht van alle design elementen, variabelen en componenten.</p>

      {/* Colors */}
      <section className="styleguide-section">
        <h2>Kleuren</h2>
        <div className="styleguide-colors">
          <div className="styleguide-color">
            <div className="styleguide-color-swatch" style={{background: 'var(--color-black)'}}></div>
            <span>--color-black</span>
            <code>#070707</code>
          </div>
          <div className="styleguide-color">
            <div className="styleguide-color-swatch" style={{background: 'var(--color-light-black)'}}></div>
            <span>--color-light-black</span>
            <code>#0C0C0C</code>
          </div>
          <div className="styleguide-color">
            <div className="styleguide-color-swatch" style={{background: 'var(--color-white)', border: '1px solid #ccc'}}></div>
            <span>--color-white</span>
            <code>#FFFFFF</code>
          </div>
        </div>
      </section>

      {/* Typography */}
      <section className="styleguide-section">
        <h2>Typografie</h2>
        <p><strong>Font:</strong> Neue Haas Grotesk</p>

        <h3>Font Sizes</h3>
        <div className="styleguide-fonts">
          <div className="styleguide-font-item">
            <span className="text-4xl">Aa</span>
            <code>--font-4xl (3em / 48px)</code>
          </div>
          <div className="styleguide-font-item">
            <span className="text-3xl">Aa</span>
            <code>--font-3xl (2.25em / 36px)</code>
          </div>
          <div className="styleguide-font-item">
            <span className="text-2xl">Aa</span>
            <code>--font-2xl (1.875em / 30px)</code>
          </div>
          <div className="styleguide-font-item">
            <span className="text-xl">Aa</span>
            <code>--font-xl (1.5em / 24px)</code>
          </div>
          <div className="styleguide-font-item">
            <span className="text-lg">Aa</span>
            <code>--font-lg (1.25em / 20px)</code>
          </div>
          <div className="styleguide-font-item">
            <span className="text-md">Aa</span>
            <code>--font-md (1.125em / 18px)</code>
          </div>
          <div className="styleguide-font-item">
            <span className="text-base">Aa</span>
            <code>--font-base (1em / 16px)</code>
          </div>
          <div className="styleguide-font-item">
            <span className="text-sm">Aa</span>
            <code>--font-sm (0.875em / 14px)</code>
          </div>
          <div className="styleguide-font-item">
            <span className="text-xs">Aa</span>
            <code>--font-xs (0.75em / 12px)</code>
          </div>
        </div>

        <h3>Font Weights</h3>
        <div className="styleguide-weights">
          <span className="font-normal">Normal (400)</span>
          <span className="font-medium">Medium (500)</span>
          <span className="font-semibold">Semibold (600)</span>
          <span className="font-bold">Bold (700)</span>
        </div>
      </section>

      {/* Headings */}
      <section className="styleguide-section">
        <h2>Headings</h2>
        <div className="styleguide-headings">
          <h1>Heading 1</h1>
          <h2>Heading 2</h2>
          <h3>Heading 3</h3>
          <h4>Heading 4</h4>
          <h5>Heading 5</h5>
          <h6>Heading 6</h6>
        </div>
      </section>

      {/* Logos */}
      <section className="styleguide-section">
        <h2>Logo's</h2>
        <div className="styleguide-logos">
          <div className="styleguide-logo-item">
            <div className="styleguide-logo-preview">
              <img src={DTDLogo} alt="DTD Logo" style={{height: '4em', color: 'var(--color-dark)'}} />
            </div>
            <code>DTD.svg</code>
          </div>
          <div className="styleguide-logo-item">
            <div className="styleguide-logo-preview" style={{background: 'var(--color-dark)', padding: '1em'}}>
              <img src={LogoFullText} alt="Logo Full Text" style={{height: '3em', color: 'var(--color-light)'}} />
            </div>
            <code>logo-full-text-horizontal-white.svg</code>
          </div>
        </div>
      </section>

      {/* Buttons */}
      <section className="styleguide-section">
        <h2>Buttons</h2>
        <div className="styleguide-buttons" style={{background: '#1a1a1a', padding: '2em', borderRadius: '8px'}}>
          <button className="btn btn-glass">Glass Button</button>
          <button className="btn btn-glass" disabled>Disabled Button</button>
        </div>
      </section>

      {/* Links */}
      <section className="styleguide-section">
        <h2>Links</h2>
        <div className="styleguide-links">
          <a href="#" onClick={(e) => e.preventDefault()}>Default Link</a>
          <span className="link">Clickable Text (non-anchor)</span>
        </div>
      </section>

      {/* Form Elements */}
      <section className="styleguide-section">
        <h2>Form Elements</h2>
        <div className="styleguide-forms">
          <div className="styleguide-form-item">
            <label>Text Input</label>
            <input type="text" placeholder="Placeholder text" />
          </div>
          <div className="styleguide-form-item">
            <label>Email Input</label>
            <input type="email" placeholder="email@example.com" />
          </div>
        </div>
      </section>

      {/* Spacing */}
      <section className="styleguide-section">
        <h2>Spacing Variables</h2>
        <div className="styleguide-spacing">
          <code>--header-height: 4em</code>
          <code>--aside-width: 25em</code>
          <code>--grid-item-width: 22.1875em</code>
        </div>
      </section>

      {/* Breakpoints */}
      <section className="styleguide-section">
        <h2>Breakpoints</h2>
        <div className="styleguide-breakpoints">
          <div className="styleguide-breakpoint">
            <strong>Desktop</strong>
            <code>992px - 1920px</code>
          </div>
          <div className="styleguide-breakpoint">
            <strong>Tablet</strong>
            <code>768px - 991px</code>
          </div>
          <div className="styleguide-breakpoint">
            <strong>Mobile Landscape</strong>
            <code>480px - 767px</code>
          </div>
          <div className="styleguide-breakpoint">
            <strong>Mobile Portrait</strong>
            <code>320px - 479px</code>
          </div>
        </div>
      </section>
    </div>
  );
}
