import {useState} from 'react';
import {Link} from 'react-router';
import type {CollectionItemFragment} from 'storefrontapi.generated';
import {ProductCard} from './ProductCard';

interface NewDropProps {
  products: CollectionItemFragment[];
  title?: string;
  featuredImage?: string;
}

export function NewDrop({
  products,
  title = 'New Drop',
  featuredImage = '/hero-bg.jpg',
}: NewDropProps) {
  const [openProductId, setOpenProductId] = useState<string | null>(null);

  // Take first 6 products for the grid
  const gridProducts = products.slice(0, 6);

  const handleToggle = (productId: string) => {
    setOpenProductId(openProductId === productId ? null : productId);
  };

  return (
    <section className="new-drop">
      <div className="section-divider" />
      <div className="new-drop-section-header">
        <h2 className="new-drop-section-title">{title}</h2>
        <Link to="/collections/all" className="btn btn-glass new-drop-shop-all">
          Shop all
        </Link>
        <span className="new-drop-item-count">{gridProducts.length} Items</span>
      </div>

      <div className="new-drop-grid">
        <div className="new-drop-featured">
          <div className="new-drop-featured-wrapper">
            <img src={featuredImage} alt="" className="new-drop-featured-image" />
            <Link to="/collections/all" className="btn btn-glass new-drop-featured-btn">
              VIEW PRODUCTS
            </Link>
          </div>
        </div>

        <div className="new-drop-products-wrapper">
          <div className="new-drop-products">
            {gridProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isOpen={openProductId === product.id}
                onToggle={() => handleToggle(product.id)}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="new-drop-footer">
        <Link to="/collections/all" className="btn btn-solid">
          Shop now
        </Link>
      </div>
    </section>
  );
}
