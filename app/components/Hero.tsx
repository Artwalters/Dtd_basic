import {Link} from 'react-router';

interface HeroProps {
  backgroundImage: string;
  subtitle?: string;
  title?: string;
  buttonText?: string;
  buttonLink?: string;
}

export function Hero({
  backgroundImage,
  subtitle = 'our first collection',
  title = 'BE PART OF THE START',
  buttonText = 'SHOP NOW',
  buttonLink = '/collections/all',
}: HeroProps) {
  return (
    <section className="hero">
      <div className="hero-background">
        <img src={backgroundImage} alt="" className="hero-image" />
        <div className="hero-gradient" />
      </div>
      <div className="hero-bottom">
        <div className="hero-content">
          <div className="hero-text">
            <span className="hero-subtitle">{subtitle}</span>
            <h1 className="hero-title">{title}</h1>
          </div>
          <Link to={buttonLink} className="btn btn-glass">
            {buttonText}
          </Link>
        </div>
        <div className="hero-indicator">
          <div className="hero-indicator-bar" />
        </div>
      </div>
    </section>
  );
}
