import React, { useState } from 'react'
import BookCard from '../books/BookCard';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';

// import required modules
import { Pagination, Navigation } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { useFetchAllBooksQuery } from '../../redux/features/books/booksApi';

const categories = ["Choose a genre", "Business", "Technology", "Fiction", "Horror", "Adventure"]

const TopSellers = ({ books: booksProp }) => {
    
    const [selectedCategory, setSelectedCategory] = useState("Choose a genre");
    const [swiperRef, setSwiperRef] = useState(null);

   const { data: booksFromApi = [] } = useFetchAllBooksQuery(undefined, { skip: !!booksProp });
   const books = booksProp ?? booksFromApi;
  
    const filteredBooks =
        selectedCategory === "Choose a genre"
            ? books
            : books.filter(
                (book) => (book?.category ?? '').toLowerCase() === selectedCategory.toLowerCase()
              );

    return (
        <div className='py-10'>
            <div className='mb-6 flex items-center justify-between'>
                <h2 className='text-3xl font-semibold'>Top Sellers</h2>
                <div className='flex items-center gap-2'>
                    <button
                        type="button"
                        onClick={() => swiperRef?.slidePrev()}
                        className="rounded-full border border-gray-300 p-2 hover:bg-gray-100"
                        aria-label="Scroll top sellers left"
                    >
                        <FiChevronLeft size={20} />
                    </button>
                    <button
                        type="button"
                        onClick={() => swiperRef?.slideNext()}
                        className="rounded-full border border-gray-300 p-2 hover:bg-gray-100"
                        aria-label="Scroll top sellers right"
                    >
                        <FiChevronRight size={20} />
                    </button>
                </div>
            </div>
            {/* category filtering */}
            <div className='mb-8 flex items-center'>
                <select
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    name="category" id="category" className='border bg-[#EAEAEA] border-gray-300 rounded-md px-4 py-2 focus:outline-none'>
                    {
                        categories.map((category, index) => (
                            <option key={index} value={category}>{category}</option>
                        ))
                    }
                </select>
            </div>

            <Swiper
                onSwiper={setSwiperRef}
                slidesPerView={1}
                spaceBetween={30}
                navigation={false}
                breakpoints={{
                    640: {
                        slidesPerView: 1,
                        spaceBetween: 20,
                    },
                    768: {
                        slidesPerView: 2,
                        spaceBetween: 40,
                    },
                    1024: {
                        slidesPerView: 2,
                        spaceBetween: 50,
                    },
                    1180: {
                        slidesPerView: 3,
                        spaceBetween: 50,
                    }
                }}
                modules={[Pagination, Navigation]}
                className="mySwiper"
            >

                {
                   filteredBooks.length > 0 && filteredBooks.map((book, index) => (
                        <SwiperSlide key={index}>
                            <BookCard  book={book} />
                        </SwiperSlide>
                    ))
                }



            </Swiper>


        </div>
    )
}

export default TopSellers