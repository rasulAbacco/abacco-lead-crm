import React, { useState } from "react";
import {
  User,
  Tag,
  Calendar,
  Building,
  Users,
  FileText,
  CheckCircle,
  Send as SendIcon,
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const LeadForm = () => {
  const employeeId = localStorage.getItem("employeeId");

  const [formData, setFormData] = useState({
    agentName: "",
    clientEmail: "",
    leadEmail: "",
    ccEmail: "",
    subjectLine: "",
    emailPitch: "",
    emailResponce: "",
    website: "",
    phone: "",
    country: "",
    leadType: "Association Lead",
    date: "",
    link: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = React.useState({ message: "", type: "" });

  // Toast helper
  const showToast = (message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "" }), 3000);
  };

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.clientEmail.trim())
      newErrors.clientEmail = "Client email is required";
    else if (!validateEmail(formData.clientEmail))
      newErrors.clientEmail = "Invalid email";

    if (!formData.leadEmail.trim())
      newErrors.leadEmail = "Lead email is required";
    else if (!validateEmail(formData.leadEmail))
      newErrors.leadEmail = "Invalid email";

    if (!formData.subjectLine.trim())
      newErrors.subjectLine = "Subject line is required";

    if (!formData.emailPitch.trim())
      newErrors.emailPitch = "Email pitch is required";

    // ✅ NEW required fields
    if (!formData.website.trim()) newErrors.website = "Website is required";

    if (!formData.link.trim())
      newErrors.link = "Association/Expo link is required";

    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleClear = () => {
    setFormData({
      agentName: "",
      clientEmail: "",
      leadEmail: "",
      ccEmail: "",
      subjectLine: "",
      emailPitch: "",
      emailResponce: "",
      website: "",
      phone: "",
      country: "",
      leadType: "Association Lead",
      date: "",
      link: "",
    });
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!employeeId) {
      showToast("Employee ID missing. Please log in again.", "error");
      return;
    }
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads: [{ ...formData, employeeId }] }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        handleClear();
        showToast("Lead submitted successfully!", "success");
      } else if (data.duplicate) {
        showToast(data.message, "error");
      } else {
        showToast(data.message || "Submission failed", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Server error. Try again later.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getWebsiteLabel = () => {
    if (formData.leadType === "Association Lead") return "Association Link";
    if (formData.leadType === "Attendees Lead") return "Expo Link";
    return "Link";
  };

  // ✅ Restrict future date
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6">
      {/* Toast Notification */}
      {toast.message && (
        <div
          className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-xl shadow-lg text-white font-medium transform transition-all duration-300 ${
            toast.type === "error" 
              ? "bg-red-500 animate-pulse" 
              : "bg-green-500"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Success Notification */}
      {showSuccess && (
        <div className="fixed top-6 right-6 bg-green-500 text-white px-6 py-4 rounded-xl shadow-lg z-50 flex items-center gap-3 animate-fade-in">
          <CheckCircle className="w-6 h-6" />
          <span className="font-medium">Lead submitted successfully!</span>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-10 border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-5">
              <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                <Building className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Drop Your Lead Here
                </h1>
                <p className="text-gray-600 mt-1">Employee Lead Submission Portal</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="text-sm text-gray-500 font-medium">Employee ID</div>
              <div className="font-mono text-lg font-semibold bg-white px-4 py-2 rounded-lg mt-1 shadow-sm">
                {employeeId}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg">
              <Users className="w-5 h-5 text-blue-500" />
              <span className="font-medium">New Lead Submission</span>
            </div>
            <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-lg">
              <Calendar className="w-5 h-5 text-indigo-500" />
              <span className="font-medium">
                Date:{" "}
                {new Date().toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-lg">
              <FileText className="w-5 h-5 text-purple-500" />
              <span className="font-medium">Form ID: LF-{Date.now().toString().slice(-6)}</span>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* Client Name */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Client Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="agentName"
                  value={formData.agentName}
                  onChange={handleChange}
                  className={`w-full pl-12 pr-4 py-3.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                    errors.agentName ? "border-red-500 bg-red-50" : "border-gray-300"
                  }`}
                  placeholder="Enter agent full name"
                />
              </div>
              {errors.agentName && (
                <p className="text-red-500 text-sm font-medium mt-1">{errors.agentName}</p>
              )}
            </div>

            {/* Lead Type */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Lead Type
              </label>
              <div className="relative">
                <Tag className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  name="leadType"
                  value={formData.leadType}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none bg-white"
                >
                  <option value="Association Lead">Association Lead</option>
                  <option value="Attendees Lead">Attendees Lead</option>
                  <option value="Industry Lead">Industry Lead</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
            </div>

            {/* Client Email */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Client Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="clientEmail"
                value={formData.clientEmail}
                onChange={handleChange}
                className={`w-full px-4 py-3.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                  errors.clientEmail ? "border-red-500 bg-red-50" : "border-gray-300"
                }`}
                placeholder="client@company.com"
              />
              {errors.clientEmail && (
                <p className="text-red-500 text-sm font-medium mt-1">{errors.clientEmail}</p>
              )}
            </div>

            {/* Lead Email */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Lead Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="leadEmail"
                value={formData.leadEmail}
                onChange={handleChange}
                className={`w-full px-4 py-3.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                  errors.leadEmail ? "border-red-500 bg-red-50" : "border-gray-300"
                }`}
                placeholder="lead@company.com"
              />
              {errors.leadEmail && (
                <p className="text-red-500 text-sm font-medium mt-1">{errors.leadEmail}</p>
              )}
            </div>

            {/* CC Email */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                CC Email
              </label>
              <input
                type="text"
                name="ccEmail"
                value={formData.ccEmail}
                onChange={handleChange}
                className={`w-full px-4 py-3.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                  errors.ccEmail ? "border-red-500 bg-red-50" : "border-gray-300"
                }`}
                placeholder="manager@company.com"
              />
              {errors.ccEmail && (
                <p className="text-red-500 text-sm font-medium mt-1">{errors.ccEmail}</p>
              )}
            </div>

            {/* Website - required */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Client Website <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className={`w-full px-4 py-3.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                  errors.website ? "border-red-500 bg-red-50" : "border-gray-300"
                }`}
                placeholder="https://website.com"
              />
              {errors.website && (
                <p className="text-red-500 text-sm font-medium mt-1">{errors.website}</p>
              )}
            </div>

            {/* Association / Expo Link - required */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                {getWebsiteLabel()} <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                name="link"
                value={formData.link}
                onChange={handleChange}
                className={`w-full px-4 py-3.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                  errors.link ? "border-red-500 bg-red-50" : "border-gray-300"
                }`}
                placeholder="https://link.com"
              />
              {errors.link && (
                <p className="text-red-500 text-sm font-medium mt-1">{errors.link}</p>
              )}
            </div>

            {/* Phone - required */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full px-4 py-3.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                  errors.phone ? "border-red-500 bg-red-50" : "border-gray-300"
                }`}
                placeholder="+1 (555) 123-4567"
              />
              {errors.phone && (
                <p className="text-red-500 text-sm font-medium mt-1">{errors.phone}</p>
              )}
            </div>

            {/* Country */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Country
              </label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="United States"
              />
            </div>

            {/* Date (no future date) */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Contact Date
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                max={today} // ✅ prevent future dates
                className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>

            {/* Subject */}
            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700">
                Subject Line <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="subjectLine"
                value={formData.subjectLine}
                onChange={handleChange}
                className={`w-full px-4 py-3.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                  errors.subjectLine ? "border-red-500 bg-red-50" : "border-gray-300"
                }`}
                placeholder="Partnership Opportunity"
              />
              {errors.subjectLine && (
                <p className="text-red-500 text-sm font-medium mt-1">{errors.subjectLine}</p>
              )}
            </div>

            {/* Email Pitch */}
            <div className="md:col-span-2 space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Email Pitch <span className="text-red-500">*</span>
              </label>
              <textarea
                name="emailPitch"
                value={formData.emailPitch}
                onChange={handleChange}
                className={`w-full px-4 py-3.5 border rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                  errors.emailPitch ? "border-red-500 bg-red-50" : "border-gray-300"
                }`}
                rows="5"
                placeholder="Enter your professional email pitch here..."
              />
              {errors.emailPitch && (
                <p className="text-red-500 text-sm font-medium mt-1">{errors.emailPitch}</p>
              )}
            </div>

            {/* Buttons */}
            <div className="md:col-span-2 flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 font-semibold rounded-xl transition-all ${
                  isSubmitting
                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white opacity-80 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"
                      role="status"
                    ></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <SendIcon className="w-5 h-5" />
                    <span>Submit Lead</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleClear}
                className="px-6 py-4 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all border border-gray-300 hover:border-gray-400"
              >
                Clear Form
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LeadForm;