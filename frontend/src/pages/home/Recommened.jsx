import React, { useState } from 'react'
// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

// import required modules
import { Pagination, Navigation } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import BookCard from '../books/BookCard';
import { useFetchAllBooksQuery } from '../../redux/features/books/booksApi';


const Recommened = ({ books: booksProp }) => {
  const [swiperRef, setSwiperRef] = useState(null);
  const { data: booksFromApi = [] } = useFetchAllBooksQuery(undefined, { skip: !!booksProp });
  const books = booksProp ?? booksFromApi;

  return (
    <div className='py-16'>
         <div className='mb-6 flex items-center justify-between'>
            <h2 className='text-3xl font-semibold'>Recommended for you </h2>
            <div className='flex items-center gap-2'>
                <button
                    type="button"
                    onClick={() => swiperRef?.slidePrev()}
                    className="rounded-full border border-gray-300 p-2 hover:bg-gray-100"
                    aria-label="Scroll recommended books left"
                >
                    <FiChevronLeft size={20} />
                </button>
                <button
                    type="button"
                    onClick={() => swiperRef?.slideNext()}
                    className="rounded-full border border-gray-300 p-2 hover:bg-gray-100"
                    aria-label="Scroll recommended books right"
                >
                    <FiChevronRight size={20} />
                </button>
            </div>
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
                   books.length > 0 && books.map((book, index) => (
                        <SwiperSlide key={index}>
                            <BookCard  book={book} />
                        </SwiperSlide>
                    ))
                }



            </Swiper>
    </div>
  )
}

export default Recommened