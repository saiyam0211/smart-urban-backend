// backend/routes/analytics.js
const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/auth");
const Problem = require("../models/Problem");
const User = require("../models/User");
const Volunteer = require("../models/Volunteer");

router.get("/dashboard", authMiddleware, async (req, res) => {
  try {
    // Get date range
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 30); // Last 30 days

    // Get all problems within date range
    const problems = await Problem.find({
      createdAt: { $gte: startDate, $lte: endDate },
    })
      .populate("reportedBy")
      .populate("assignedTo");

    // Calculate key metrics
    const totalReports = problems.length;
    const resolvedProblems = problems.filter((p) => p.status === "solved");
    const resolutionRate = (
      (resolvedProblems.length / totalReports) *
      100
    ).toFixed(1);

    // Calculate growth rates
    const previousPeriodStart = new Date(startDate);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - 30);
    const previousProblems = await Problem.find({
      createdAt: { $gte: previousPeriodStart, $lte: startDate },
    });
    const reportGrowth = (
      ((totalReports - previousProblems.length) / previousProblems.length) *
      100
    ).toFixed(1);

    // Active volunteers
    const activeVolunteers = await Volunteer.countDocuments({
      lastActive: { $gte: startDate },
    });

    // Calculate category distribution
    const categoryDistribution = await Problem.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    // Calculate average resolution time
    const avgResolutionTime =
      resolvedProblems.reduce((acc, problem) => {
        const resolutionTime = problem.solvedAt - problem.createdAt;
        return acc + resolutionTime;
      }, 0) /
      (resolvedProblems.length * 3600000); // Convert to hours

    // Get most active areas
    const activeAreas = await Problem.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: {
            lat: {
              $round: [{ $arrayElemAt: ["$location.coordinates", 1] }, 2],
            },
            lng: {
              $round: [{ $arrayElemAt: ["$location.coordinates", 0] }, 2],
            },
          },
          reportCount: { $sum: 1 },
        },
      },
      { $sort: { reportCount: -1 } },
      { $limit: 5 },
    ]);

    // Calculate predictions
    const expectedReports = Math.round(totalReports * (1 + reportGrowth / 100));
    const estimatedResolution = Math.round(resolutionRate * 1.1); // Assuming 10% improvement
    const volunteerEngagement = Math.round(activeVolunteers * 0.8); // Conservative estimate

    res.json({
      totalReports,
      resolutionRate,
      reportGrowth,
      activeVolunteers,
      avgResolutionTime: Math.round(avgResolutionTime),
      categoryDistribution: Object.fromEntries(
        categoryDistribution.map((cat) => [cat._id, cat.count])
      ),
      predictions: {
        expectedReports,
        estimatedResolution,
        volunteerEngagement,
      },
      impactMetrics: {
        activeAreas: activeAreas.map((area) => ({
          name: `${area._id.lat}, ${area._id.lng}`,
          reportCount: area.reportCount,
        })),
        resolutionSuccess: Math.round(resolutionRate),
        totalResolved: resolvedProblems.length,
      },
    });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({ error: "Failed to fetch analytics data" });
  }
});

module.exports = router;
