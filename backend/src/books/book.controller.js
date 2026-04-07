const mongoose = require("mongoose");
const Book = require("./book.model");
const MIN_PRICE = 400;
const MAX_PRICE = 900;
const slugify = (value = "") =>
    value
        .toString()
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

const isValidPriceRange = (oldPrice, newPrice) => {
    const oldNum = Number(oldPrice);
    const newNum = Number(newPrice);
    return (
        Number.isFinite(oldNum) &&
        Number.isFinite(newNum) &&
        oldNum >= MIN_PRICE &&
        oldNum <= MAX_PRICE &&
        newNum >= MIN_PRICE &&
        newNum <= MAX_PRICE
    );
};

const generateUniqueSlug = async (title, excludeId = null) => {
    const baseSlug = slugify(title) || "book";
    let candidate = baseSlug;
    let counter = 1;

    while (true) {
        const existing = await Book.findOne({ slug: candidate });
        if (!existing || (excludeId && existing._id.toString() === excludeId.toString())) {
            return candidate;
        }
        candidate = `${baseSlug}-${counter}`;
        counter += 1;
    }
};

const ensureBookSlug = async (bookDoc) => {
    if (!bookDoc) return bookDoc;
    if (bookDoc.slug && typeof bookDoc.slug === "string" && bookDoc.slug.trim()) {
        return bookDoc;
    }
    const uniqueSlug = await generateUniqueSlug(bookDoc.title || "book", bookDoc._id);
    bookDoc.slug = uniqueSlug;
    await bookDoc.save();
    return bookDoc;
};

const createBookFromBody = async (body) => {
    const slug = await generateUniqueSlug(body?.title || "");
    const newBook = await Book({ ...body, slug });
    await newBook.save();
    return newBook;
};

const postABook = async (req, res) => {
    try {
        if (!isValidPriceRange(req.body?.oldPrice, req.body?.newPrice)) {
            return res.status(400).send({ message: `Book prices must be between Rs. ${MIN_PRICE} and Rs. ${MAX_PRICE}` });
        }
        const newBook = await createBookFromBody(req.body);
        return res.status(200).send({ message: "Book posted successfully", book: newBook });
    } catch (error) {
        console.error("Error creating book", error);
        return res.status(500).send({ message: "Failed to create book" });
    }
}

// get all books
const getAllBooks =  async (req, res) => {
    try {
        const books = await Book.find().sort({ createdAt: -1});
        for (const book of books) {
            await ensureBookSlug(book);
        }
        return res.status(200).send(books)
        
    } catch (error) {
        console.error("Error fetching books", error);
        return res.status(500).send({message: "Failed to fetch books"})
    }
}

const getSingleBook = async (req, res) => {
    try {
        const {id} = req.params;
        const book =  await Book.findById(id);
        if(!book){
            return res.status(404).send({message: "Book not Found!"})
        }
        await ensureBookSlug(book);
        return res.status(200).send(book)
        
    } catch (error) {
        console.error("Error fetching book", error);
        return res.status(500).send({message: "Failed to fetch book"})
    }

}

const getSingleBookBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const bySlugOrId = [{ slug }];
        if (mongoose.Types.ObjectId.isValid(slug)) {
            bySlugOrId.push({ _id: slug });
        }
        const book = await Book.findOne({ $or: bySlugOrId });
        if (!book) {
            return res.status(404).send({ message: "Book not Found!" });
        }
        await ensureBookSlug(book);
        return res.status(200).send(book);
    } catch (error) {
        console.error("Error fetching book by slug", error);
        return res.status(500).send({ message: "Failed to fetch book" });
    }
}

// update book data
const UpdateBook = async (req, res) => {
    try {
        const {id} = req.params;
        if (!isValidPriceRange(req.body?.oldPrice, req.body?.newPrice)) {
            return res.status(400).send({ message: `Book prices must be between Rs. ${MIN_PRICE} and Rs. ${MAX_PRICE}` });
        }
        const updatePayload = { ...req.body };
        if (typeof req.body?.title === "string" && req.body.title.trim()) {
            updatePayload.slug = await generateUniqueSlug(req.body.title, id);
        }
        const updatedBook =  await Book.findByIdAndUpdate(id, updatePayload, {new: true});
        if(!updatedBook) {
            return res.status(404).send({message: "Book is not Found!"})
        }
        return res.status(200).send({
            message: "Book updated successfully",
            book: updatedBook
        })
    } catch (error) {
        console.error("Error updating a book", error);
        return res.status(500).send({message: "Failed to update a book"})
    }
}

const deleteABook = async (req, res) => {
    try {
        const {id} = req.params;
        const deletedBook =  await Book.findByIdAndDelete(id);
        if(!deletedBook) {
            return res.status(404).send({message: "Book is not Found!"})
        }
        return res.status(200).send({
            message: "Book deleted successfully",
            book: deletedBook
        })
    } catch (error) {
        console.error("Error deleting a book", error);
        return res.status(500).send({message: "Failed to delete a book"})
    }
};

// Seed 10–12 dummy books for initial demo/testing
const seedDummyBooks = async (req, res) => {
    try {
        const seedBooks = [
            {
                title: "Business Foundations 101",
                description: "A practical introduction to core business concepts, strategy, and decision-making frameworks.",
                category: "business",
                coverImage: "book-1.png",
                oldPrice: 25,
                newPrice: 18,
                trending: true
            },
            {
                title: "Technology Trends: 2026 Edition",
                description: "Explore the most impactful technology trends shaping product development, AI adoption, and modern systems.",
                category: "technology",
                coverImage: "book-2.png",
                oldPrice: 45,
                newPrice: 33,
                trending: true
            },
            {
                title: "Fictional Realms: The Atlas of Stories",
                description: "A curated journey through genres and themes, designed to inspire readers and writers alike.",
                category: "fiction",
                coverImage: "book-3.png",
                oldPrice: 20,
                newPrice: 14,
                trending: false
            },
            {
                title: "Horror Nights: Tales for the Brave",
                description: "Short horror narratives with eerie pacing and unforgettable twists.",
                category: "horror",
                coverImage: "book-4.png",
                oldPrice: 22,
                newPrice: 16,
                trending: true
            },
            {
                title: "Adventure Compass: Journeys Beyond",
                description: "Learn how to plan adventures, build resilience, and embrace the unknown with confidence.",
                category: "adventure",
                coverImage: "book-5.png",
                oldPrice: 30,
                newPrice: 22,
                trending: false
            },
            {
                title: "Business Analytics Playbook",
                description: "Turn data into decisions with clear examples of dashboards, metrics, and experimentation.",
                category: "business",
                coverImage: "book-6.png",
                oldPrice: 40,
                newPrice: 28,
                trending: false
            },
            {
                title: "Modern Software Architecture",
                description: "Understand scalable architecture patterns for web apps, services, and distributed systems.",
                category: "technology",
                coverImage: "book-7.png",
                oldPrice: 55,
                newPrice: 39,
                trending: true
            },
            {
                title: "Fiction for Focus: Character & Conflict",
                description: "A writing guide to craft compelling characters and keep tension alive throughout the story.",
                category: "fiction",
                coverImage: "book-8.png",
                oldPrice: 18,
                newPrice: 12,
                trending: false
            },
            {
                title: "Horror Craft: Atmosphere Techniques",
                description: "Learn how to build dread through language, structure, and pacing - without relying on cliches.",
                category: "horror",
                coverImage: "book-9.png",
                oldPrice: 24,
                newPrice: 17,
                trending: true
            },
            {
                title: "Adventure Skills & Safety",
                description: "Essential outdoor skills, risk planning, and preparation checklists for memorable trips.",
                category: "adventure",
                coverImage: "book-10.png",
                oldPrice: 36,
                newPrice: 25,
                trending: false
            },
            {
                title: "Startup Strategy Sprint",
                description: "A step-by-step guide to validating ideas, finding product-market fit, and scaling sustainably.",
                category: "business",
                coverImage: "book-11.png",
                oldPrice: 48,
                newPrice: 34,
                trending: true
            },
            {
                title: "Tech Careers: Building Your Path",
                description: "A practical roadmap for improving skills, building portfolios, and advancing in tech.",
                category: "technology",
                coverImage: "book-12.png",
                oldPrice: 38,
                newPrice: 26,
                trending: false
            }
        ];

        const createdBooks = [];

        for (const bookBody of seedBooks) {
            const existing = await Book.findOne({ title: bookBody.title });
            if (existing) continue;
            const created = await createBookFromBody(bookBody);
            createdBooks.push(created);
        }

        return res.status(201).json({
            message: "Dummy books seeded successfully",
            seeded: createdBooks.length,
            books: createdBooks
        });
    } catch (error) {
        console.error("Failed to seed dummy books", error);
        return res.status(500).json({ message: "Failed to seed dummy books" });
    }
};

const backfillBookSlugs = async (req, res) => {
    try {
        const books = await Book.find().sort({ createdAt: -1 });
        let updated = 0;

        for (const book of books) {
            if (book.slug && typeof book.slug === "string" && book.slug.trim()) continue;
            await ensureBookSlug(book);
            updated += 1;
        }

        return res.status(200).json({
            message: "Book slug backfill completed",
            total: books.length,
            updated
        });
    } catch (error) {
        console.error("Failed to backfill book slugs", error);
        return res.status(500).json({ message: "Failed to backfill book slugs" });
    }
};

module.exports = {
    postABook,
    getAllBooks,
    getSingleBook,
    getSingleBookBySlug,
    UpdateBook,
    deleteABook,
    seedDummyBooks,
    backfillBookSlugs
}