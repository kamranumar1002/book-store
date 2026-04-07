const mongoose = require("mongoose");
const express = require("express");
const Order = require("../orders/order.model");
const Book = require("../books/book.model");
const User = require("../users/user.model");
const verifyAdminToken = require("../middleware/verifyAdminToken");
const router = express.Router();

const ORDER_STATUSES = ["pending", "processing", "shipped", "delivered"];

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const toPositiveInt = (value, fallback, max = 100) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
    return Math.min(max, Math.floor(parsed));
};

const buildOrderTimeline = (status = "pending") => {
    const resolvedStatus = (status || "pending").toLowerCase();
    const currentIndex = Math.max(0, ORDER_STATUSES.indexOf(resolvedStatus));
    return ORDER_STATUSES.map((step, index) => ({
        step,
        done: index <= currentIndex,
        current: index === currentIndex,
    }));
};

const buildOrderSearchQuery = (searchTerm = "") => {
    const normalizedSearch = (searchTerm || "").toString().trim();
    if (!normalizedSearch) return [];

    const safeRegex = new RegExp(escapeRegex(normalizedSearch), "i");
    const conditions = [{ name: safeRegex }, { email: safeRegex }];

    if (mongoose.Types.ObjectId.isValid(normalizedSearch)) {
        conditions.push({ _id: normalizedSearch });
    }

    const numericPhone = Number(normalizedSearch);
    if (Number.isFinite(numericPhone)) {
        conditions.push({ phone: numericPhone });
    }

    return conditions;
};

router.get("/", verifyAdminToken, async (_req, res) => {
    try {
        const [
            totalOrders,
            totalBooks,
            totalUsers,
            pendingOrders,
            lowStockBooks,
            totalSalesAggregate,
            trendingBooksAggregate,
            monthlySales,
            recentOrders,
        ] = await Promise.all([
            Order.countDocuments(),
            Book.countDocuments(),
            User.countDocuments(),
            Order.countDocuments({ status: "pending" }),
            Book.countDocuments({ stock: { $lte: 5 } }),
            Order.aggregate([
                {
                    $group: {
                        _id: null,
                        totalSales: { $sum: "$totalPrice" },
                    },
                },
            ]),
            Book.aggregate([{ $match: { trending: true } }, { $count: "trendingBooksCount" }]),
            Order.aggregate([
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                        totalSales: { $sum: "$totalPrice" },
                        totalOrders: { $sum: 1 },
                    },
                },
                { $sort: { _id: 1 } },
            ]),
            Order.find({}, { name: 1, email: 1, totalPrice: 1, status: 1, createdAt: 1 })
                .sort({ createdAt: -1 })
                .limit(6),
        ]);

        return res.status(200).json({
            totalOrders,
            totalSales: totalSalesAggregate[0]?.totalSales || 0,
            trendingBooks: trendingBooksAggregate[0]?.trendingBooksCount || 0,
            totalBooks,
            totalUsers,
            pendingOrders,
            lowStockBooks,
            monthlySales,
            recentOrders,
        });
    } catch (error) {
        console.error("Error fetching admin stats:", error);
        return res.status(500).json({ message: "Failed to fetch admin stats" });
    }
});

router.get("/orders", verifyAdminToken, async (req, res) => {
    try {
        const page = toPositiveInt(req.query.page, 1, 10000);
        const limit = toPositiveInt(req.query.limit, 20, 100);
        const status = (req.query.status || "").toString().trim().toLowerCase();
        const search = (req.query.search || "").toString().trim();

        const query = {};
        if (ORDER_STATUSES.includes(status)) {
            query.status = status;
        }

        const searchConditions = buildOrderSearchQuery(search);
        if (searchConditions.length > 0) {
            query.$or = searchConditions;
        }

        const skip = (page - 1) * limit;

        const [orders, total] = await Promise.all([
            Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
            Order.countDocuments(query),
        ]);

        return res.status(200).json({
            orders,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.max(1, Math.ceil(total / limit)),
            },
        });
    } catch (error) {
        console.error("Error fetching admin orders:", error);
        return res.status(500).json({ message: "Failed to fetch orders." });
    }
});

router.get("/orders/:orderId", verifyAdminToken, async (req, res) => {
    try {
        const { orderId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ message: "Invalid order id." });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found." });
        }

        return res.status(200).json({
            order,
            timeline: buildOrderTimeline(order.status),
        });
    } catch (error) {
        console.error("Error fetching admin order details:", error);
        return res.status(500).json({ message: "Failed to fetch order details." });
    }
});

router.patch("/orders/:orderId/status", verifyAdminToken, async (req, res) => {
    try {
        const { orderId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ message: "Invalid order id." });
        }

        const nextStatus = (req.body?.status || "").toString().trim().toLowerCase();
        if (!ORDER_STATUSES.includes(nextStatus)) {
            return res.status(400).json({
                message: `Invalid status. Allowed values: ${ORDER_STATUSES.join(", ")}.`,
            });
        }

        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            { status: nextStatus },
            { new: true, runValidators: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({ message: "Order not found." });
        }

        return res.status(200).json({
            message: "Order status updated successfully.",
            order: updatedOrder,
            timeline: buildOrderTimeline(updatedOrder.status),
        });
    } catch (error) {
        console.error("Error updating order status:", error);
        return res.status(500).json({ message: "Failed to update order status." });
    }
});

router.get("/users", verifyAdminToken, async (req, res) => {
    try {
        const role = (req.query.role || "").toString().trim().toLowerCase();
        const search = (req.query.search || "").toString().trim();

        const query = {};
        if (role === "admin" || role === "user") {
            query.role = role;
        }
        if (search) {
            query.username = { $regex: escapeRegex(search), $options: "i" };
        }

        const [users, orderAggregates] = await Promise.all([
            User.find(query).select("_id username role").sort({ username: 1 }),
            Order.aggregate([
                {
                    $group: {
                        _id: "$userId",
                        totalOrders: { $sum: 1 },
                        totalSpent: { $sum: "$totalPrice" },
                    },
                },
            ]),
        ]);

        const orderStatsByUser = new Map(
            orderAggregates.map((entry) => [String(entry._id), entry])
        );

        const usersWithStats = users.map((user) => {
            const userData = user.toObject();
            const stats = orderStatsByUser.get(String(userData._id));
            return {
                ...userData,
                totalOrders: stats?.totalOrders || 0,
                totalSpent: stats?.totalSpent || 0,
            };
        });

        return res.status(200).json(usersWithStats);
    } catch (error) {
        console.error("Error fetching admin users:", error);
        return res.status(500).json({ message: "Failed to fetch users." });
    }
});

router.patch("/users/:userId/role", verifyAdminToken, async (req, res) => {
    try {
        const { userId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid user id." });
        }

        if (String(req.user?.id) === String(userId)) {
            return res.status(400).json({ message: "You cannot change your own role." });
        }

        const nextRole = (req.body?.role || "").toString().trim().toLowerCase();
        if (nextRole !== "admin" && nextRole !== "user") {
            return res.status(400).json({ message: "Invalid role value." });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        user.role = nextRole;
        await user.save();

        return res.status(200).json({
            message: "User role updated successfully.",
            user: {
                _id: user._id,
                username: user.username,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Error updating user role:", error);
        return res.status(500).json({ message: "Failed to update user role." });
    }
});

router.delete("/users/:userId", verifyAdminToken, async (req, res) => {
    try {
        const { userId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid user id." });
        }

        if (String(req.user?.id) === String(userId)) {
            return res.status(400).json({ message: "You cannot delete your own account." });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        if (user.role === "admin") {
            return res
                .status(400)
                .json({ message: "Deleting admin accounts is disabled from dashboard." });
        }

        await User.findByIdAndDelete(userId);
        return res.status(200).json({ message: "User deleted successfully." });
    } catch (error) {
        console.error("Error deleting user:", error);
        return res.status(500).json({ message: "Failed to delete user." });
    }
});

module.exports = router;