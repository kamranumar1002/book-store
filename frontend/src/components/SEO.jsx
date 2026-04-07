import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ title, description, metaDescription, keywords }) => {
  const safeTitle = title || 'Book Store App';
  const safeDescription =
    metaDescription || description || 'Discover, manage, and explore books in our online store.';
  const safeKeywords = keywords || 'books, bookstore, online books';

  return (
    <Helmet>
      <title>{safeTitle}</title>
      <meta name="description" content={safeDescription} data-rh="true" />
      <meta property="og:description" content={safeDescription} />
      <meta name="keywords" content={safeKeywords} />
    </Helmet>
  );
};

export default SEO;

