import React, { useMemo, useState } from 'react'
import { FiShoppingCart } from 'react-icons/fi'
import { getImgUrl } from '../../utils/getImgUrl'

import { Link } from'react-router-dom'

import { useDispatch } from'react-redux'
import { addToCart } from '../../redux/features/cart/cartSlice'

const BookCard = ({book}) => {
    const dispatch =  useDispatch();

    const description = book?.description ?? '';
    const oldPrice = book?.oldPrice ?? 0;
    const newPrice = book?.newPrice ?? 0;
    const coverImage = book?.coverImage ?? 'book-1.png';
    // Always use a guaranteed local asset for fallback (dev server may not serve `dist/`).
    const fallbackImage = getImgUrl('book-1.png');
    const resolvedCover = useMemo(() => {
        try {
            return `${getImgUrl(coverImage)}`;
        } catch {
            return fallbackImage;
        }
    }, [coverImage]);
    const [imageSrc, setImageSrc] = useState(resolvedCover);

    const handleAddToCart = (product) => {
        dispatch(addToCart(product))
    }
    return (
        <div className="rounded-lg transition-shadow duration-300 h-full">
            <div
                className="flex flex-col sm:flex-row sm:items-stretch sm:min-h-[18rem] gap-4"
            >
                <div className="sm:w-44 sm:flex-shrink-0 border rounded-md overflow-hidden">
                    <Link to={`/books/${book.slug || book._id}`}>
                        <img
                            src={imageSrc}
                            alt=""
                            onError={() => setImageSrc(fallbackImage)}
                            className="w-full h-72 object-cover p-2 rounded-md cursor-pointer hover:scale-105 transition-all duration-200"
                        />
                    </Link>
                </div>

                <div className="flex flex-col justify-between flex-1 min-w-0 py-1">
                  <div>
                    <Link to={`/books/${book.slug || book._id}`}>
                        <h3 className="text-xl font-semibold hover:text-blue-600 mb-2 line-clamp-2 min-h-[3.5rem]">
                       {book?.title}
                        </h3>
                    </Link>
                    <p className="text-gray-600 mb-4 min-h-[3.5rem]">
                      {description.length > 90 ? `${description.slice(0, 90)}...` : description}
                    </p>
                    <p className="font-medium mb-4">
                        Rs. {newPrice} <span className="line-through font-normal ml-2">Rs. {oldPrice}</span>
                    </p>
                  </div>
                    <button 
                    onClick={() => handleAddToCart(book)}
                    className="btn-primary px-6 space-x-1 flex items-center gap-1 self-start">
                        <FiShoppingCart className="" />
                        <span>Add to Cart</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

export default BookCard