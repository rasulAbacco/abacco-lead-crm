import { useState } from "react";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const AddEmployeeForm = () => {
  const [formData, setFormData] = useState({
    employeeId: "",
    fullName: "",
    email: "",
    password: "",
    target: "",
    joiningDate: "", // ✅ new
  });
  const [status, setStatus] = useState(null);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch(`${API_BASE_URL}/api/employees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      let result = {};
      try {
        result = await res.json();
      } catch (err) {
        console.error("Invalid JSON response:", err);
        result = { error: "Server returned invalid response" };
      }

      if (res.ok) {
        setStatus("success");
        setFormData({
          employeeId: "",
          fullName: "",
          email: "",
          password: "",
          target: "",
          joiningDate: "",
        });
      } else {
        setStatus(result.error || "Failed to create employee");
      }
    } catch (err) {
      console.error("Network or server error:", err);
      setStatus("Network error. Please try again.");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 mb-8 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Add New Employee</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Employee ID</label>
          <input
            type="text"
            name="employeeId"
            value={formData.employeeId}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Full Name</label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            required
          />
        </div>

        {/* ✅ New Leads Target input */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Leads Target</label>
          <input
            type="number"
            name="target"
            value={formData.target}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            placeholder="Enter target leads"
            required
          />
        </div>

        {/* ✅ New Joining Date input */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Joining Date</label>
          <input
            type="date"
            name="joiningDate"
            value={formData.joiningDate}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            required
          />
        </div>

        <button
          type="submit"
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
        >
          Add Employee
        </button>

        {status === "loading" && <p className="text-sm text-gray-600 mt-2">Creating...</p>}
        {status === "success" && <p className="text-sm text-green-600 mt-2">Employee added successfully!</p>}
        {status && status !== "loading" && status !== "success" && (
          <p className="text-sm text-red-600 mt-2">{status}</p>
        )}
      </form>
    </div>
  );
};

export default AddEmployeeForm;
