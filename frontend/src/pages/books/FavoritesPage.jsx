import React from 'react';
import { HiOutlineHeart } from 'react-icons/hi2';
import { Link } from 'react-router-dom';

const FavoritesPage = () => {
  return (
    <section className="max-w-3xl mx-auto py-10 px-4">
      <div className="bg-white border border-border rounded-xl p-8 text-center shadow-sm">
        <div className="flex justify-center mb-4 text-secondary">
          <HiOutlineHeart className="size-10" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">Favorites</h2>
        <p className="text-muted mb-6">
          This is your favorites page. You can use it as a wishlist section.
        </p>
        <Link
          to="/"
          className="inline-flex items-center px-4 py-2 rounded-md bg-secondary text-white hover:bg-primary transition-colors"
        >
          Continue Browsing
        </Link>
      </div>
    </section>
  );
};

export default FavoritesPage;

