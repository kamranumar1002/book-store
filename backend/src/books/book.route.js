const express = require('express');
const Book = require('./book.model');
const { postABook, getAllBooks, getSingleBook, getSingleBookBySlug, UpdateBook, deleteABook, seedDummyBooks, backfillBookSlugs } = require('./book.controller');
const verifyAdminToken = require('../middleware/verifyAdminToken');
const router =  express.Router();

// frontend => backend server => controller => book schema  => database => send to server => back to the frontend
//post = when submit something fronted to db
// get =  when get something back from db
// put/patch = when edit or update something
// delete = when delete something

// post a book
router.post("/create-book", verifyAdminToken, postABook)

// seed dummy books (admin only)
router.post("/seed-dummy-books", verifyAdminToken, seedDummyBooks);

// backfill slugs for old books (admin only)
router.post("/backfill-slugs", verifyAdminToken, backfillBookSlugs);

// get all books
router.get("/", getAllBooks);

// single book endpoint by slug
router.get("/slug/:slug", getSingleBookBySlug);

// single book endpoint
router.get("/:id", getSingleBook);

// update a book endpoint
router.put("/edit/:id", verifyAdminToken, UpdateBook);

router.delete("/:id", verifyAdminToken, deleteABook)


module.exports = router;
