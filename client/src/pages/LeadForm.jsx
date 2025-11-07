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

    if (!formData.emailResponce.trim())
      newErrors.emailResponce = "Email Response is required";

    // ✅ NEW required fields
    if (!formData.website.trim())
      newErrors.website = "Website is required";

    if (!formData.link.trim())
      newErrors.link = "Association/Expo link is required";

    if (!formData.phone.trim())
      newErrors.phone = "Phone number is required";

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
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      {toast.message && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2 rounded shadow-md text-white
      ${toast.type === "error" ? "bg-red-600" : "bg-green-600"}`}
        >
          {toast.message}
        </div>
      )}

      {showSuccess && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          <span>Lead submitted successfully!</span>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-600 rounded-lg">
                <Building className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Lead Management System
                </h1>
                <p className="text-gray-600">Employee Lead Submission Portal</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Employee ID</div>
              <div className="font-mono text-sm bg-gray-100 px-3 py-1 rounded">
                {employeeId}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-8 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>New Lead Submission</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>
                Date:{" "}
                {new Date().toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>Form ID: LF-{Date.now().toString().slice(-6)}</span>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Client Name */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Client Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="agentName"
                  value={formData.agentName}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg ${
                    errors.agentName ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter agent full name"
                />
              </div>
              {errors.agentName && (
                <p className="text-red-500 text-sm">{errors.agentName}</p>
              )}
            </div>

            {/* Lead Type */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Lead Type
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  name="leadType"
                  value={formData.leadType}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg"
                >
                  <option value="Association Lead">Association Lead</option>
                  <option value="Attendees Lead">Attendees Lead</option>
                  <option value="Industry Lead">Industry Lead</option>
                </select>
              </div>
            </div>

            {/* Client Email */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Client Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="clientEmail"
                value={formData.clientEmail}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg ${
                  errors.clientEmail ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="client@company.com"
              />
              {errors.clientEmail && (
                <p className="text-red-500 text-sm">{errors.clientEmail}</p>
              )}
            </div>

            {/* Lead Email */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Lead Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="leadEmail"
                value={formData.leadEmail}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg ${
                  errors.leadEmail ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="lead@company.com"
              />
              {errors.leadEmail && (
                <p className="text-red-500 text-sm">{errors.leadEmail}</p>
              )}
            </div>

            {/* CC Email */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                CC Email
              </label>
              <input
                type="text"
                name="ccEmail"
                value={formData.ccEmail}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg ${
                  errors.ccEmail ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="manager@company.com"
              />
              {errors.ccEmail && (
                <p className="text-red-500 text-sm">{errors.ccEmail}</p>
              )}
            </div>

            {/* Website - required */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Client Website <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg ${
                  errors.website ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="https://website.com"
              />
              {errors.website && (
                <p className="text-red-500 text-sm">{errors.website}</p>
              )}
            </div>

            {/* Association / Expo Link - required */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {getWebsiteLabel()} <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                name="link"
                value={formData.link}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg ${
                  errors.link ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="https://link.com"
              />
              {errors.link && (
                <p className="text-red-500 text-sm">{errors.link}</p>
              )}
            </div>

            {/* Phone - required */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg ${
                  errors.phone ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="+1 (555) 123-4567"
              />
              {errors.phone && (
                <p className="text-red-500 text-sm">{errors.phone}</p>
              )}
            </div>

            {/* Country */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Country
              </label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                placeholder="United States"
              />
            </div>

            {/* Date (no future date) */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Contact Date
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                max={today} // ✅ prevent future dates
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
              />
            </div>

            {/* Subject */}
            <div className="space-y-2 lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Subject Line <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="subjectLine"
                value={formData.subjectLine}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg ${
                  errors.subjectLine ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Partnership Opportunity"
              />
              {errors.subjectLine && (
                <p className="text-red-500 text-sm">{errors.subjectLine}</p>
              )}
            </div>

            {/* Email Pitch */}
            <div className="lg:col-span-2 space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Email Pitch <span className="text-red-500">*</span>
              </label>
              <textarea
                name="emailPitch"
                value={formData.emailPitch}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg resize-none ${
                  errors.emailPitch ? "border-red-500" : "border-gray-300"
                }`}
                rows="5"
                placeholder="Enter your professional email pitch here..."
              />
              {errors.emailPitch && (
                <p className="text-red-500 text-sm">{errors.emailPitch}</p>
              )}
            </div>

            {/* Email Response */}
            <div className="lg:col-span-2 space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Response <span className="text-red-500">*</span>
              </label>
              <textarea
                name="emailResponce"
                value={formData.emailResponce}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg resize-none ${
                  errors.emailResponce ? "border-red-500" : "border-gray-300"
                }`}
                rows="5"
                placeholder="Enter your professional email Response here..."
              />
              {errors.emailResponce && (
                <p className="text-red-500 text-sm">{errors.emailResponce}</p>
              )}
            </div>

            {/* Buttons */}
            <div className="lg:col-span-2 flex gap-4 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex-1 flex items-center justify-center gap-3 px-6 py-3 font-medium rounded-lg
    ${
      isSubmitting
        ? "bg-blue-600 opacity-70 cursor-not-allowed"
        : "bg-blue-600 hover:bg-blue-700 text-white"
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
                    <SendIcon className="w-5 h-5 text-white" />
                    <span>Submit Lead</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleClear}
                className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200"
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
