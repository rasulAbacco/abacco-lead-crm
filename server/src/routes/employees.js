import express from 'express'
import { PrismaClient } from '@prisma/client'

const router = express.Router()
const prisma = new PrismaClient()

// ✅ Get all employees (excluding password)
router.get('/', async (req, res) => {
    try {
        const employees = await prisma.employee.findMany({
            select: {
                id: true,
                employeeId: true,
                fullName: true,
                email: true,
                password: true, // Exclude password
                role: true,
                target: true,
                joiningDate: true, // <=== Make sure this is included
                isActive: true, // <=== New field
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        console.log('Fetched employees:', employees);
        res.json(employees)
    } catch (error) {
        console.error('Error fetching employees:', error)
        res.status(500).json({ error: 'Internal Server Error' })
    }
})

// ✅ Get a single employee by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params
    try {
        const employee = await prisma.employee.findUnique({
            where: { id: parseInt(id) },
            select: {
                id: true,
                employeeId: true,
                fullName: true,
                email: true,
                password: true,
                role: true,
                target: true,
                joiningDate: true,
            },
        })
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' })
        }
        res.json(employee)
    } catch (error) {
        console.error('Error fetching employee:', error)
        res.status(500).json({ error: 'Internal Server Error' })
    }
})

// ✅ Update employee by ID
router.put('/:id', async (req, res) => {
    const { id } = req.params
    const { fullName, email,password, role, target, joiningDate } = req.body

    try {
        const updated = await prisma.employee.update({
            where: { id: parseInt(id) },
            data: {
                fullName,
                email,
                password,
                role,
                target: parseInt(target),
                joiningDate: new Date(joiningDate),
            },
        })
        res.json(updated)
    } catch (error) {
        console.error('Error updating employee:', error)
        res.status(400).json({ error: error.message })
    }
})

// PUT /api/employees/:id/toggle-active
router.put('/:id/toggle-active', async (req, res) => {
    const { id } = req.params;
    try {
        // Get current state
        const employee = await prisma.employee.findUnique({
            where: { id: parseInt(id) },
        });

        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        const updated = await prisma.employee.update({
            where: { id: parseInt(id) },
            data: {
                isActive: !employee.isActive,
            },
        });

        res.json({ success: true, isActive: updated.isActive });
    } catch (error) {
        console.error('Error toggling active state:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


export default router
