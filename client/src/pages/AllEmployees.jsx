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
            const res = await axios.get(`${API_BASE_URL}/api/all-employees`);
            console.log('Fetched employees:', res.data);
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

    const toggleActive = async (id) => {
        try {
            console.log('Toggling active state for employee id:', id);
            const res = await axios.put(`${API_BASE_URL}/api/all-employees/${id}/toggle-active`);
            console.log('Toggle response:', res.data);
            fetchEmployees();
        } catch (error) {
            console.error('Error toggling active state:', error);
            alert('Failed to toggle active state. Check console for details.');
        }
    };

    return (
        <Layout>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 p-3 sm:p-6 lg:p-5">
                {/* Header Section */}
                <div className="mb-6 sm:mb-10">
                    <div className="flex items-center gap-3 sm:gap-4 mb-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                            <svg className="w-5 h-5 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900">Employee Directory</h2>
                            <p className="text-sm sm:text-base text-gray-600 mt-1">Manage your team members</p>
                        </div>
                    </div>
                    <div className="h-1.5 w-24 sm:w-32 bg-gradient-to-r from-purple-600 via-blue-600 to-pink-500 rounded-full shadow-md"></div>
                </div>

                {employees.length === 0 ? (
                    <div className="flex flex-col items-center jus
                    
                    tify-center py-12 sm:py-20 bg-white rounded-2xl shadow-lg">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                            <svg className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <p className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">No employees found</p>
                        <p className="text-sm sm:text-base text-gray-500">Add your first team member to get started</p>
                    </div>
                ) : (
                    <>
                        {/* Mobile Cards View */}
                        <div className="lg:hidden space-y-4">
                            {employees.map((emp) => (
                                <div
                                    key={emp.id}
                                    className="bg-white rounded-2xl shadow-lg p-4 sm:p-5 border border-gray-100 hover:shadow-xl transition-all duration-300"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0">
                                                {(emp.fullName || emp.name || 'U').charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-gray-900 text-base sm:text-lg truncate">{emp.fullName || emp.name}</p>
                                                <p className="text-xs sm:text-sm text-gray-500 truncate">{emp.email}</p>
                                            </div>
                                        </div>
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow-md flex-shrink-0 ml-2">
                                            {emp.employeeId || emp.id}
                                        </span>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                            <span className="text-xs sm:text-sm font-semibold text-gray-600">Password</span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded-lg text-gray-700">
                                                    {visiblePasswords[emp.id] ? emp.password : '••••••••'}
                                                </span>
                                                <button
                                                    onClick={() => togglePasswordVisibility(emp.id)}
                                                    className="w-7 h-7 flex items-center justify-center bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-all text-sm flex-shrink-0"
                                                >
                                                    {visiblePasswords[emp.id] ? '🙈' : '👁️'}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                            <span className="text-xs sm:text-sm font-semibold text-gray-600">Role</span>
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${emp.role === 'ADMIN'
                                                ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                                                : 'bg-gray-200 text-gray-700'
                                                }`}>
                                                {emp.role || 'EMPLOYEE'}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                            <span className="text-xs sm:text-sm font-semibold text-gray-600">Target</span>
                                            <span className="font-bold text-purple-700 text-base">{emp.target}</span>
                                        </div>

                                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                            <span className="text-xs sm:text-sm font-semibold text-gray-600">Joined</span>
                                            <span className="text-xs sm:text-sm text-gray-700">
                                                {emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between pt-2">
                                            <span className="text-xs sm:text-sm font-semibold text-gray-600">Status</span>
                                            <button
                                                onClick={() => toggleActive(emp.id)}
                                                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${emp.isActive
                                                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                                                    : 'bg-gradient-to-r from-red-500 to-rose-500 text-white'
                                                    }`}
                                            >
                                                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                                                {emp.isActive ? 'Active' : 'Inactive'}
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => openEditModal(emp)}
                                        className="w-full mt-4 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Edit Employee
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden lg:block bg-white rounded-2xl shadow-xl border border-gray-100">
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead>
                                        <tr className="bg-gradient-to-r from-purple-600 via-purple-700 to-blue-600 text-white">
                                            <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap">ID</th>
                                            <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap">Employee</th>
                                            <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap">Email</th>
                                            <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap">Password</th>
                                            <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap">Role</th>
                                            <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap">Target</th>
                                            <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap">Joined</th>
                                            <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap">Status</th>
                                            <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {employees.map((emp) => (
                                            <tr
                                                key={emp.id}
                                                className="hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 transition-all duration-300"
                                            >
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <span className="inline-flex items-center justify-center px-3 py-1.5 bg-gradient-to-br from-purple-500 to-blue-500 text-white text-sm font-bold rounded-lg shadow-md">
                                                        {emp.employeeId || emp.id}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold shadow-md flex-shrink-0">
                                                            {(emp.fullName || emp.name || 'U').charAt(0).toUpperCase()}
                                                        </div>
                                                        <p className="font-semibold text-gray-900">{emp.fullName || emp.name}</p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <span className="text-gray-600 text-sm">{emp.email}</span>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded-lg text-gray-700">
                                                            {visiblePasswords[emp.id] ? emp.password : '••••••••'}
                                                        </span>
                                                        <button
                                                            onClick={() => togglePasswordVisibility(emp.id)}
                                                            className="w-7 h-7 flex items-center justify-center bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-all flex-shrink-0"
                                                        >
                                                            {visiblePasswords[emp.id] ? '🙈' : '👁️'}
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${emp.role === 'ADMIN'
                                                        ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                                                        : 'bg-gray-200 text-gray-700'
                                                        }`}>
                                                        {emp.role || 'EMPLOYEE'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <span className="font-bold text-purple-700 text-lg">{emp.target}</span>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <span className="text-gray-600 text-sm">
                                                        {emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <button
                                                        onClick={() => toggleActive(emp.id)}
                                                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${emp.isActive
                                                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                                                            : 'bg-gradient-to-r from-red-500 to-rose-500 text-white'
                                                            }`}
                                                    >
                                                        <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                                                        {emp.isActive ? 'Active' : 'Inactive'}
                                                    </button>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <button
                                                        onClick={() => openEditModal(emp)}
                                                        className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg transition-all"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                        Edit
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="sticky bottom-0 h-5 bg-white shadow-inner"></div>
                        </div>
                    </>
                )}

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-50 p-4 overflow-y-auto">
                        <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl relative my-8">
                            {/* Modal Header */}
                            <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-blue-600 px-4 sm:px-6 py-4 sm:py-5 rounded-t-3xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm flex-shrink-0">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-xl sm:text-2xl font-bold text-white truncate">Edit Employee</h3>
                                        <p className="text-purple-100 text-xs sm:text-sm">Update employee information</p>
                                    </div>
                                    <button
                                        onClick={closeModal}
                                        className="w-8 h-8 flex items-center justify-center bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg transition-all flex-shrink-0"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Modal Body - Scrollable */}
                            <div className="max-h-[calc(100vh-12rem)] overflow-y-auto">
                                <div className="p-4 sm:p-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            name="fullName"
                                            value={formData.fullName}
                                            onChange={handleChange}
                                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 sm:py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm sm:text-base"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 sm:py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm sm:text-base"
                                            required
                                        />
                                    </div>

                                    <div className="relative">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Password
                                        </label>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 sm:py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm sm:text-base"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((prev) => !prev)}
                                            className="absolute right-3 top-[2.35rem] w-8 h-8 flex items-center justify-center bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-all"
                                        >
                                            {showPassword ? '🙈' : '👁️'}
                                        </button>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Role
                                        </label>
                                        <select
                                            name="role"
                                            value={formData.role}
                                            onChange={handleChange}
                                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 sm:py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm sm:text-base"
                                        >
                                            <option value="EMPLOYEE">EMPLOYEE</option>
                                            <option value="ADMIN">ADMIN</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Target
                                        </label>
                                        <input
                                            type="number"
                                            name="target"
                                            value={formData.target}
                                            onChange={handleChange}
                                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 sm:py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm sm:text-base"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Joining Date
                                        </label>
                                        <input
                                            type="date"
                                            name="joiningDate"
                                            value={formData.joiningDate}
                                            onChange={handleChange}
                                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 sm:py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm sm:text-base"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer - Sticky */}
                            <div className="sticky bottom-0 bg-white border-t-2 border-gray-100 px-4 sm:px-6 py-4 rounded-b-3xl flex flex-col-reverse sm:flex-row justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="w-full sm:w-auto px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-bold transition-all text-sm sm:text-base"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 font-bold shadow-lg transition-all text-sm sm:text-base"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    )
}

export default AllEmployees