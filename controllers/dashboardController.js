const Record = require('../models/Record');

// @desc    Get financial summary
// @route   GET /api/dashboard/summary
// @access  Private
const getSummary = async (req, res) => {
    try {
        // Date filters
        let dateFilter = {};
        if (req.query.startDate || req.query.endDate) {
            dateFilter.date = {};
            if (req.query.startDate) {
                dateFilter.date.$gte = new Date(req.query.startDate);
            }
            if (req.query.endDate) {
                dateFilter.date.$lte = new Date(req.query.endDate);
            }
        }

        // Aggregate totals
        const summary = await Record.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: '$type',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 },
                    average: { $avg: '$amount' },
                    min: { $min: '$amount' },
                    max: { $max: '$amount' }
                }
            }
        ]);

        // Format results
        let totalIncome = 0;
        let totalExpense = 0;
        let incomeStats = {};
        let expenseStats = {};

        summary.forEach(item => {
            if (item._id === 'income') {
                totalIncome = item.total;
                incomeStats = {
                    count: item.count,
                    average: Math.round(item.average * 100) / 100,
                    min: item.min,
                    max: item.max
                };
            } else if (item._id === 'expense') {
                totalExpense = item.total;
                expenseStats = {
                    count: item.count,
                    average: Math.round(item.average * 100) / 100,
                    min: item.min,
                    max: item.max
                };
            }
        });

        const netBalance = totalIncome - totalExpense;
        const savingsRate = totalIncome > 0 
            ? Math.round((netBalance / totalIncome) * 100 * 100) / 100 
            : 0;

        res.status(200).json({
            success: true,
            data: {
                totalIncome,
                totalExpense,
                netBalance,
                savingsRate: `${savingsRate}%`,
                incomeStats,
                expenseStats,
                totalTransactions: (incomeStats.count || 0) + (expenseStats.count || 0)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server error while fetching summary',
            details: error.message
        });
    }
};

// @desc    Get category-wise breakdown
// @route   GET /api/dashboard/categories
// @access  Private
const getCategoryBreakdown = async (req, res) => {
    try {
        // Date filters
        let dateFilter = {};
        if (req.query.startDate || req.query.endDate) {
            dateFilter.date = {};
            if (req.query.startDate) {
                dateFilter.date.$gte = new Date(req.query.startDate);
            }
            if (req.query.endDate) {
                dateFilter.date.$lte = new Date(req.query.endDate);
            }
        }

        // Filter by type if specified
        if (req.query.type) {
            dateFilter.type = req.query.type;
        }

        const categoryBreakdown = await Record.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: { type: '$type', category: '$category' },
                    total: { $sum: '$amount' },
                    count: { $sum: 1 },
                    average: { $avg: '$amount' }
                }
            },
            {
                $sort: { '_id.type': 1, total: -1 }
            }
        ]);

        // Calculate totals for percentage
        const totals = await Record.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: '$type',
                    total: { $sum: '$amount' }
                }
            }
        ]);

        const totalMap = {};
        totals.forEach(t => {
            totalMap[t._id] = t.total;
        });

        // Format with percentages
        const formatted = categoryBreakdown.map(item => ({
            type: item._id.type,
            category: item._id.category,
            total: Math.round(item.total * 100) / 100,
            count: item.count,
            average: Math.round(item.average * 100) / 100,
            percentage: totalMap[item._id.type] 
                ? Math.round((item.total / totalMap[item._id.type]) * 100 * 100) / 100 
                : 0
        }));

        // Group by type
        const incomeCategories = formatted.filter(f => f.type === 'income');
        const expenseCategories = formatted.filter(f => f.type === 'expense');

        res.status(200).json({
            success: true,
            data: {
                income: {
                    total: totalMap['income'] || 0,
                    categories: incomeCategories
                },
                expense: {
                    total: totalMap['expense'] || 0,
                    categories: expenseCategories
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server error while fetching category breakdown',
            details: error.message
        });
    }
};

// @desc    Get monthly trends
// @route   GET /api/dashboard/trends
// @access  Private/Analyst
const getMonthlyTrends = async (req, res) => {
    try {
        // Get year filter or default to current year
        const year = parseInt(req.query.year) || new Date().getFullYear();

        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59);

        const monthlyTrends = await Record.aggregate([
            {
                $match: {
                    date: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$date' },
                        month: { $month: '$date' },
                        type: '$type'
                    },
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1 }
            }
        ]);

        // Format into monthly data
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        const monthlyData = months.map((monthName, index) => {
            const monthNum = index + 1;
            const incomeData = monthlyTrends.find(
                t => t._id.month === monthNum && t._id.type === 'income'
            );
            const expenseData = monthlyTrends.find(
                t => t._id.month === monthNum && t._id.type === 'expense'
            );

            const income = incomeData ? incomeData.total : 0;
            const expense = expenseData ? expenseData.total : 0;

            return {
                month: monthName,
                monthNumber: monthNum,
                income,
                expense,
                netBalance: income - expense,
                incomeTransactions: incomeData ? incomeData.count : 0,
                expenseTransactions: expenseData ? expenseData.count : 0
            };
        });

        // Calculate yearly totals
        const yearlyTotals = {
            totalIncome: monthlyData.reduce((sum, m) => sum + m.income, 0),
            totalExpense: monthlyData.reduce((sum, m) => sum + m.expense, 0),
            get netBalance() { return this.totalIncome - this.totalExpense; },
            averageMonthlyIncome: 0,
            averageMonthlyExpense: 0
        };
        
        yearlyTotals.averageMonthlyIncome = Math.round(yearlyTotals.totalIncome / 12 * 100) / 100;
        yearlyTotals.averageMonthlyExpense = Math.round(yearlyTotals.totalExpense / 12 * 100) / 100;

        res.status(200).json({
            success: true,
            data: {
                year,
                monthlyData,
                yearlyTotals
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server error while fetching trends',
            details: error.message
        });
    }
};

// @desc    Get top expenses
// @route   GET /api/dashboard/top-expenses
// @access  Private
const getTopExpenses = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        // Date filters
        let dateFilter = { type: 'expense' };
        if (req.query.startDate || req.query.endDate) {
            dateFilter.date = {};
            if (req.query.startDate) {
                dateFilter.date.$gte = new Date(req.query.startDate);
            }
            if (req.query.endDate) {
                dateFilter.date.$lte = new Date(req.query.endDate);
            }
        }

        const topExpenses = await Record.find(dateFilter)
            .sort({ amount: -1 })
            .limit(limit)
            .select('amount category date notes');

        res.status(200).json({
            success: true,
            count: topExpenses.length,
            data: topExpenses
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server error while fetching top expenses',
            details: error.message
        });
    }
};

// @desc    Get comparison data (current vs previous period)
// @route   GET /api/dashboard/comparison
// @access  Private/Analyst
const getComparison = async (req, res) => {
    try {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Current month
        const currentMonthStart = new Date(currentYear, currentMonth, 1);
        const currentMonthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

        // Previous month
        const prevMonthStart = new Date(currentYear, currentMonth - 1, 1);
        const prevMonthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59);

        // Get current month data
        const currentData = await Record.aggregate([
            {
                $match: {
                    date: { $gte: currentMonthStart, $lte: currentMonthEnd }
                }
            },
            {
                $group: {
                    _id: '$type',
                    total: { $sum: '$amount' }
                }
            }
        ]);

        // Get previous month data
        const previousData = await Record.aggregate([
            {
                $match: {
                    date: { $gte: prevMonthStart, $lte: prevMonthEnd }
                }
            },
            {
                $group: {
                    _id: '$type',
                    total: { $sum: '$amount' }
                }
            }
        ]);

        // Format data
        const formatData = (data) => {
            const result = { income: 0, expense: 0 };
            data.forEach(item => {
                result[item._id] = item.total;
            });
            result.netBalance = result.income - result.expense;
            return result;
        };

        const current = formatData(currentData);
        const previous = formatData(previousData);

        // Calculate changes
        const calculateChange = (current, previous) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return Math.round(((current - previous) / previous) * 100 * 100) / 100;
        };

        res.status(200).json({
            success: true,
            data: {
                currentMonth: {
                    period: `${currentMonthStart.toLocaleDateString()} - ${currentMonthEnd.toLocaleDateString()}`,
                    ...current
                },
                previousMonth: {
                    period: `${prevMonthStart.toLocaleDateString()} - ${prevMonthEnd.toLocaleDateString()}`,
                    ...previous
                },
                changes: {
                    incomeChange: `${calculateChange(current.income, previous.income)}%`,
                    expenseChange: `${calculateChange(current.expense, previous.expense)}%`,
                    netBalanceChange: `${calculateChange(current.netBalance, previous.netBalance)}%`
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server error while fetching comparison',
            details: error.message
        });
    }
};

module.exports = {
    getSummary,
    getCategoryBreakdown,
    getMonthlyTrends,
    getTopExpenses,
    getComparison
};