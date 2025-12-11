// server/src/routes/notificationRoutes.js
router.get("/my", authenticate, authorizeRole("EMPLOYEE"), async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;

        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" }
        });

        res.json(notifications);
    } catch (error) {
        return res.status(500).json({ message: "Failed to load notifications" });
    }
});
