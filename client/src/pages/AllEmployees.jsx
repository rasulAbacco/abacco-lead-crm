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
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 p-6 lg:p-10">
                {/* Header Section */}
                <div className="mb-10">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-4xl font-extrabold text-gray-900">Employee Directory</h2>
                            <p className="text-gray-600 mt-1">Manage your team members</p>
                        </div>
                    </div>
                    <div className="h-1.5 w-32 bg-gradient-to-r from-purple-600 via-blue-600 to-pink-500 rounded-full shadow-md"></div>
                </div>

                {employees.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-lg">
                        <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mb-6">
                            <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <p className="text-xl font-semibold text-gray-700 mb-2">No employees found</p>
                        <p className="text-gray-500">Add your first team member to get started</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="bg-gradient-to-r from-purple-600 via-purple-700 to-blue-600 text-white">
                                        <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-wider">ID</th>
                                        <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-wider">Employee</th>
                                        <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-wider">Email</th>
                                        <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-wider">Password</th>
                                        <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-wider">Role</th>
                                        <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-wider">Target</th>
                                        <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-wider">Joined</th>
                                        <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {employees.map((emp, index) => (
                                        <tr
                                            key={emp.id}
                                            className="hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 transition-all duration-300 group"
                                        >
                                            <td className="px-3 py-2">
                                                <span className="inline-flex items-center justify-center w-15 h-8 bg-gradient-to-br from-purple-500 to-blue-500 text-white text-sm font-bold rounded-lg shadow-md group-hover:shadow-lg transition-shadow">
                                                    {emp.employeeId || emp.id}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center min-w-[9rem]">
                                                    {/* <div className="w-11 h-11 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                                                        {(emp.fullName || emp.name || 'U').charAt(0).toUpperCase()}
                                                    </div> */}
                                                    <div>
                                                        <p className="font-semibold text-gray-900 text-base">{emp.fullName || emp.name}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-gray-600 text-sm font-medium">{emp.email}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-xs bg-gray-100 px-3 py-1.5 rounded-lg text-gray-700">
                                                        {visiblePasswords[emp.id] ? emp.password : '••••••••'}
                                                    </span>
                                                    <button
                                                        onClick={() => togglePasswordVisibility(emp.id)}
                                                        className="w-8 h-8 flex items-center justify-center bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-all duration-200 transform hover:scale-110"
                                                        title={visiblePasswords[emp.id] ? 'Hide' : 'Show'}
                                                    >
                                                        {visiblePasswords[emp.id] ? '🙈' : '👁️'}
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm ${emp.role === 'ADMIN'
                                                        ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                                                        : 'bg-gray-200 text-gray-700'
                                                    }`}>
                                                    {emp.role || 'EMPLOYEE'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2">
                                                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <span className="font-bold text-purple-700 text-lg">{emp.target}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2 text-gray-600 text-sm min-w-[8rem]">
                                                    <svg className="w-7 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    {emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <button
                                                    onClick={() => toggleActive(emp.id)}
                                                    className={`relative inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg ${emp.isActive
                                                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
                                                            : 'bg-gradient-to-r from-red-500 to-rose-500 text-white hover:from-red-600 hover:to-rose-600'
                                                        }`}
                                                >
                                                    <span className={`w-2 h-2 rounded-full ${emp.isActive ? 'bg-white' : 'bg-white'} animate-pulse`}></span>
                                                    {emp.isActive ? 'Active' : 'Inactive'}
                                                </button>
                                            </td>
                                            <td className="px-6 py-5">
                                                <button
                                                    onClick={() => openEditModal(emp)}
                                                    className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
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
                    </div>
                )}

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-md flex justify-center items-center z-50 p-4 animate-fadeIn">
                        <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl relative transform transition-all animate-scaleIn overflow-hidden">
                            {/* Modal Header */}
                            <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-blue-600 px-8 py-6 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-10 animate-shimmer"></div>
                                <div className="relative flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-white">Edit Employee</h3>
                                        <p className="text-purple-100 text-sm">Update employee information</p>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <form onSubmit={handleSave} className="p-4 space-y-3">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 hover:border-gray-300"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 hover:border-gray-300"
                                        required
                                    />
                                </div>

                                <div className="relative">
                                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                        Password
                                    </label>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 hover:border-gray-300"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((prev) => !prev)}
                                        className="absolute right-3 top-11 w-8 h-8 flex items-center justify-center bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-all duration-200 transform hover:scale-110"
                                    >
                                        {showPassword ? '🙈' : '👁️'}
                                    </button>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                        Role
                                    </label>
                                    <select
                                        name="role"
                                        value={formData.role}
                                        onChange={handleChange}
                                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 hover:border-gray-300"
                                    >
                                        <option value="EMPLOYEE">EMPLOYEE</option>
                                        <option value="ADMIN">ADMIN</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Target
                                    </label>
                                    <input
                                        type="number"
                                        name="target"
                                        value={formData.target}
                                        onChange={handleChange}
                                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 hover:border-gray-300"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        Joining Date
                                    </label>
                                    <input
                                        type="date"
                                        name="joiningDate"
                                        value={formData.joiningDate}
                                        onChange={handleChange}
                                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 hover:border-gray-300"
                                        required
                                    />
                                </div>

                                {/* Modal Footer */}
                                <div className="flex justify-end gap-3 pt-6 border-t-2 border-gray-100 mt-8">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-bold transition-all duration-200 transform hover:scale-105"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 font-bold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>

                            {/* Close Button */}
                            <button
                                onClick={closeModal}
                                className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg text-xl font-light transition-all duration-200 backdrop-blur-sm"
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
                    }
                    to {
                        opacity: 1;
                    }
                }
                @keyframes scaleIn {
                    from {
                        opacity: 0;
                        transform: scale(0.9);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                @keyframes shimmer {
                    0% {
                        transform: translateX(-100%);
                    }
                    100% {
                        transform: translateX(100%);
                    }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
                .animate-scaleIn {
                    animation: scaleIn 0.3s ease-out;
                }
                .animate-shimmer {
                    animation: shimmer 3s infinite;
                }
            `}</style>
        </Layout>
    )
}

export default AllEmployees