import React, { useMemo, useState } from 'react'
import { useDeleteBookMutation, useFetchAllBooksQuery } from '../../../redux/features/books/booksApi';
import { Link } from 'react-router-dom';
import Loading from '../../../components/Loading';

const ManageBooks = () => {
        const {data: books = [], isLoading, isError} = useFetchAllBooksQuery()
        const [searchTerm, setSearchTerm] = useState('');
        const [deleteBook] = useDeleteBookMutation()

        const filteredBooks = useMemo(() => {
            const normalizedSearch = searchTerm.trim().toLowerCase();
            if (!normalizedSearch) return books;

            return books.filter((book) =>
                `${book?.title || book?.name || ''} ${book?.category || ''} ${book?.slug || ''}`
                    .toLowerCase()
                    .includes(normalizedSearch)
            );
        }, [books, searchTerm]);

        const lowStockCount = useMemo(
            () => books.filter((book) => Number(book?.stock ?? 0) <= 5).length,
            [books]
        );
        const trendingCount = useMemo(
            () => books.filter((book) => !!book?.trending).length,
            [books]
        );

        const handleDeleteBook = async (id) => {
                const shouldDelete = window.confirm('Are you sure you want to delete this book?');
                if (!shouldDelete) return;

                try {
                        await deleteBook(id).unwrap();
                        alert('Book deleted successfully!');
                } catch (error) {
                        console.error('Failed to delete book:', error?.message || error);
                        alert('Failed to delete book. Please try again.');
                }
        };

        if (isLoading) return <Loading />;
        if (isError) return <div className="text-red-600">Failed to load inventory data.</div>;

    return (
        <div className="space-y-6">
            <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h2 className="text-2xl font-semibold text-slate-900">Inventory Management</h2>
                    <p className="text-sm text-slate-500">Control products, stock signals, and storefront content.</p>
                </div>
                <Link
                    to="/dashboard/add-new-book"
                    className="admin-btn-primary inline-flex items-center justify-center px-4 py-2 rounded-md"
                >
                    Add New Product
                </Link>
            </section>

            <section className="grid sm:grid-cols-3 gap-4">
                <article className="card-surface p-4 bg-white">
                    <p className="text-sm text-slate-500">Total Products</p>
                    <p className="text-2xl font-semibold text-slate-900 mt-1">{books.length.toLocaleString()}</p>
                </article>
                <article className="card-surface p-4 bg-white">
                    <p className="text-sm text-slate-500">Trending Products</p>
                    <p className="text-2xl font-semibold text-slate-900 mt-1">{trendingCount.toLocaleString()}</p>
                </article>
                <article className="card-surface p-4 bg-white">
                    <p className="text-sm text-slate-500">Low Stock Alerts</p>
                    <p className="text-2xl font-semibold text-slate-900 mt-1">{lowStockCount.toLocaleString()}</p>
                </article>
            </section>

            <section className="card-surface p-4 bg-white">
                <label className="text-sm text-slate-600">Search inventory</label>
                <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    type="text"
                    placeholder="Search by title, category, or slug"
                    className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2"
                />
            </section>

            <section className="card-surface overflow-hidden bg-white">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-slate-500 border-b border-slate-200">
                                <th className="px-4 py-3 font-medium">Product</th>
                                <th className="px-4 py-3 font-medium">Category</th>
                                <th className="px-4 py-3 font-medium">Stock</th>
                                <th className="px-4 py-3 font-medium">Price</th>
                                <th className="px-4 py-3 font-medium">Trending</th>
                                <th className="px-4 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBooks.length === 0 ? (
                                <tr>
                                    <td className="px-4 py-6 text-slate-500" colSpan={6}>
                                        No products found for this filter.
                                    </td>
                                </tr>
                            ) : (
                                filteredBooks.map((book) => {
                                    const stock = Number(book?.stock ?? 0);
                                    return (
                                        <tr key={book._id} className="border-b border-slate-100 last:border-b-0">
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-slate-800">{book?.title || book?.name || 'Untitled Book'}</p>
                                                <p className="text-xs text-slate-500">{book?.slug || 'no-slug'}</p>
                                            </td>
                                            <td className="px-4 py-3 capitalize text-slate-700">{book?.category || 'uncategorized'}</td>
                                            <td className="px-4 py-3">
                                                <span className={`text-xs px-2 py-1 rounded-full ${stock <= 5 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                    {stock} in stock
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-700">Rs. {Number(book?.newPrice ?? book?.price ?? 0).toLocaleString()}</td>
                                            <td className="px-4 py-3">
                                                <span className={`text-xs px-2 py-1 rounded-full ${book?.trending ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                                                    {book?.trending ? 'Yes' : 'No'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right space-x-2">
                                                <Link
                                                    to={`/dashboard/edit-book/${book._id}`}
                                                    className="admin-btn-secondary inline-flex items-center px-3 py-1 rounded-md"
                                                >
                                                    Edit
                                                </Link>
                                                <button
                                                    onClick={() => handleDeleteBook(book._id)}
                                                    className="admin-btn-danger inline-flex items-center px-3 py-1 rounded-md"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    )
}

export default ManageBooks