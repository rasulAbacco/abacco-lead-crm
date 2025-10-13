import React, { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import axios from 'axios'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const AllEmployees = () => {
    const [employees, setEmployees] = useState([])
    const [selectedEmployee, setSelectedEmployee] = useState(null)
    const [showModal, setShowModal] = useState(false)
    const [visiblePasswords, setVisiblePasswords] = useState({});
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        role: '',
        target: '',
        joiningDate: '',
    })

    useEffect(() => {
        fetchEmployees()
    }, [])

    const togglePasswordVisibility = (id) => {
        setVisiblePasswords((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const fetchEmployees = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/all-employees`)
            setEmployees(res.data)
        } catch (error) {
            console.error('Error fetching employees:', error)
        }
    }

    const openEditModal = (employee) => {
        setSelectedEmployee(employee)
        setFormData({
            fullName: employee.name || employee.fullName || '',
            email: employee.email || '',
            password: employee.password || '',
            role: employee.role || '',
            target: employee.target || '',
            joiningDate: employee.joiningDate ? employee.joiningDate.split('T')[0] : '',
        })
        setShowModal(true)
    }

    const closeModal = () => {
        setShowModal(false)
        setSelectedEmployee(null)
        setShowPassword(false)
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleSave = async (e) => {
        e.preventDefault()
        try {
            await axios.put(`${API_BASE_URL}/api/all-employees/${selectedEmployee.id}`, {
                fullName: formData.fullName,
                email: formData.email,
                password: formData.password,
                role: formData.role || 'EMPLOYEE',
                target: parseInt(formData.target),
                joiningDate: formData.joiningDate,
            })
            closeModal()
            fetchEmployees()
        } catch (error) {
            console.error('Error updating employee:', error)
        }
    }

    return (
        <Layout>
            <div className="min-h-screen bg-white p-6 lg:p-8">
                {/* Header Section */}
                <div className="mb-8">
                    <h2 className="text-4xl font-bold text-gray-900 mb-2">All Employees</h2>
                    <div className="h-1 w-24 bg-gradient-to-r from-purple-600 to-pink-500 rounded-full"></div>
                </div>

                {employees.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                        <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <p className="text-lg">No employees found.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl shadow-lg border border-gray-100">
                        <table className="min-w-full bg-white">
                            <thead>
                                    <tr className="bg-gradient-to-r from-purple-600 to-[#0046FF] text-white text-left text-sm font-semibold">
                                    <th className="px-6 py-4">Employee ID</th>
                                    <th className="px-6 py-4">Full Name</th>
                                    <th className="px-6 py-4">Email</th>
                                    <th className="px-6 py-4">Password</th>
                                    <th className="px-6 py-4">Role</th>
                                    <th className="px-6 py-4">Target</th>
                                    <th className="px-6 py-4">Joining Date</th>
                                    <th className="px-6 py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {employees.map((emp, index) => (
                                    <tr
                                        key={emp.id}
                                        className="border-b border-gray-100 text-sm text-gray-700 hover:bg-purple-50 transition-all duration-200 ease-in-out"
                                    >
                                        <td className="px-6 py-4 font-medium text-gray-900">{emp.employeeId || emp.id}</td>
                                        <td className="px-6 py-4 font-medium">{emp.fullName || emp.name}</td>
                                        <td className="px-6 py-4 text-gray-600">{emp.email}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-xs">
                                                    {visiblePasswords[emp.id] ? emp.password : '••••••••'}
                                                </span>
                                                <button
                                                    onClick={() => togglePasswordVisibility(emp.id)}
                                                    className="text-purple-600 hover:text-purple-800 transition-colors duration-200 focus:outline-none transform hover:scale-110"
                                                    title={visiblePasswords[emp.id] ? 'Hide Password' : 'Show Password'}
                                                >
                                                    {visiblePasswords[emp.id] ? '🙈' : '👁️'}
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${emp.role === 'ADMIN'
                                                    ? 'bg-purple-100 text-purple-700'
                                                    : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                {emp.role || 'EMPLOYEE'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-purple-600">{emp.target}</td>
                                        <td className="px-6 py-4">
                                            {emp.joiningDate
                                                ? new Date(emp.joiningDate).toLocaleDateString()
                                                : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => openEditModal(emp)}
                                                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-5 py-2 rounded-lg text-sm font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                                            >
                                                Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl relative transform transition-all animate-fadeIn">
                            {/* Modal Header */}
                            <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-t-2xl px-6 py-4">
                                <h3 className="text-xl font-bold text-white">Edit Employee</h3>
                            </div>

                            {/* Modal Body */}
                            <form onSubmit={handleSave} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                                        required
                                    />
                                </div>

                                <div className="relative">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 pr-12 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((prev) => !prev)}
                                        className="absolute right-3 top-9 text-gray-600 hover:text-purple-600 transition-colors duration-200 transform hover:scale-110"
                                        title={showPassword ? 'Hide Password' : 'Show Password'}
                                    >
                                        {showPassword ? '🙈' : '👁️'}
                                    </button>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Role</label>
                                    <select
                                        name="role"
                                        value={formData.role}
                                        onChange={handleChange}
                                        className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                                    >
                                        <option value="EMPLOYEE">EMPLOYEE</option>
                                        <option value="ADMIN">ADMIN</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Target</label>
                                    <input
                                        type="number"
                                        name="target"
                                        value={formData.target}
                                        onChange={handleChange}
                                        className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Joining Date</label>
                                    <input
                                        type="date"
                                        name="joiningDate"
                                        value={formData.joiningDate}
                                        onChange={handleChange}
                                        className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                                        required
                                    />
                                </div>

                                {/* Modal Footer */}
                                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-all duration-200 transform hover:scale-105"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 font-medium shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>

                            {/* Close Button */}
                            <button
                                onClick={closeModal}
                                className="absolute top-4 right-4 text-white hover:text-gray-200 text-2xl font-light transition-colors duration-200"
                            >
                                &times;
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.2s ease-out;
                }
            `}</style>
        </Layout>
    )
}

export default AllEmployees