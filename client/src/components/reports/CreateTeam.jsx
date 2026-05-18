//src/components/reports/CreateTeam.jsx
import React, { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  X,
  UserPlus,
  Crown,
  Pencil,
  Target,
  Users,
} from "lucide-react";

const CreateTeam = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState(null);

  const [formData, setFormData] = useState({
    teamName: "",
    teamLeader: "",
    targetValue: "",
  });
  const [members, setMembers] = useState([]);

  // ======================================================
  // FETCH EMPLOYEES
  // ======================================================
  const fetchEmployees = async () => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/team-reports/active-employees`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      const data = await res.json();
      setEmployees(data.employees || []);
    } catch (err) {
      console.error(err);
    }
  };

  // ======================================================
  // FETCH TEAMS
  // ======================================================
  const fetchTeams = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/team-reports/teams`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await res.json();
      setTeams(data.teams || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchTeams();
  }, []);

  // ======================================================
  // RESET FORM
  // ======================================================
  const resetForm = () => {
    setFormData({
      teamName: "",
      teamLeader: "",
      targetValue: "",
    });
    setMembers([]);
    setEditingTeamId(null);
    setShowModal(false);
  };

  const assignedEmployeeIds = teams.flatMap((team) => [
    team.leader?.employeeId,
    ...(team.members?.map((member) => member.employee?.employeeId) || []),
  ]);

  const getAvailableEmployees = (currentIndex = null) => {
    const selectedMembers = members
      .filter((_, idx) => idx !== currentIndex)
      .map((m) => m.employeeId);

    return employees.filter((emp) => {
      const isEditingCurrent =
        editingTeamId &&
        (teams.find((t) => t.id === editingTeamId)?.members || []).some(
          (m) => m.employee?.employeeId === emp.employeeId,
        );

      return (
        emp.employeeId !== formData.teamLeader &&
        !selectedMembers.includes(emp.employeeId) &&
        (!assignedEmployeeIds.includes(emp.employeeId) || isEditingCurrent)
      );
    });
  };

  const handleAddMember = () => {
    setMembers([...members, { employeeId: "" }]);
  };

  const handleMemberChange = (index, value) => {
    const updatedMembers = [...members];
    updatedMembers[index].employeeId = value;
    setMembers(updatedMembers);
  };

  const handleDeleteMember = (index) => {
    const updatedMembers = [...members];
    updatedMembers.splice(index, 1);
    setMembers(updatedMembers);
  };

  const handleEditTeam = (team) => {
    setEditingTeamId(team.id);
    setFormData({
      teamName: team.name,
      teamLeader: team.leader?.employeeId || "",
      targetValue: team.targetValue || "",
    });
    setMembers(
      team.members.map((member) => ({
        employeeId: member.employee?.employeeId,
      })),
    );
    setShowModal(true);
  };

  // ======================================================
  // SUBMIT
  // ======================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = { ...formData, members };
      const isEditMode = editingTeamId !== null;

      const url = isEditMode
        ? `${API_BASE_URL}/api/team-reports/update-team/${editingTeamId}`
        : `${API_BASE_URL}/api/team-reports/create-team`;
      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");

      fetchTeams();
      resetForm();
    } catch (err) {
      console.error(err);
      alert(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // DELETE TEAM
  // ======================================================
  const handleDeleteTeam = async (teamId) => {
    const confirmDelete = window.confirm(
      "Delete this team configuration permanently?",
    );
    if (!confirmDelete) return;

    try {
      await fetch(`${API_BASE_URL}/api/team-reports/delete-team/${teamId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      fetchTeams();
    } catch (err) {
      console.error(err);
      alert("Failed to delete team");
    }
  };

  return (
    <div className="w-full text-[#1D1D1F]">
      {/* ====================================================== */}
      {/* COMPONENT SUBSECTION CONTROL HEADER                    */}
      {/* ====================================================== */}
      <div className="flex items-center justify-between pb-5 border-b border-[#E8E8ED]">
        <div>
          <span className="text-[10px] font-bold tracking-widest text-[#86868B] uppercase block">
            Organization Framework
          </span>
          <h2 className="text-sm font-semibold text-[#1D1D1F] mt-0.5">
            Registered Structural Teams ({teams.length})
          </h2>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-[#1D1D1F] text-white px-4 py-2 rounded-lg text-xs font-medium tracking-wide flex items-center gap-1.5 hover:bg-[#323234] active:scale-[0.98] transition-all"
        >
          <Plus size={14} />
          Provision New Team
        </button>
      </div>

      {/* ====================================================== */}
      {/* HIGH-DENSITY PROFILE MAP/DIRECTORY DIRECTORY LIST      */}
      {/* ====================================================== */}
      <div className="mt-6 divide-y divide-[#E8E8ED]">
        {teams.length > 0 ? (
          teams.map((team) => (
            <div
              key={team.id}
              className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 first:pt-0 last:pb-0 group"
            >
              {/* Left Segment: Core Framework Metadata */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <h3 className="text-sm font-semibold text-[#1D1D1F] tracking-tight">
                    {team.name}
                  </h3>

                  {/* Target Allocation Tag */}
                  <div className="flex items-center gap-1 text-[11px] font-medium text-[#6E6E73] bg-[#F5F5F7] px-2 py-0.5 rounded-md border border-[#E8E8ED]">
                    <Target size={12} className="text-[#86868B]" />
                    <span>
                      Quota: ₹{Number(team.targetValue || 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Structured Professional Roles Row */}
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  {/* Distinct Leader Profile Pin */}
                  {team.leader && (
                    <div className="flex items-center gap-1.5 bg-[#FFF7ED] border border-[#FFEDD5] text-[#C2410C] font-medium px-2.5 py-1 rounded-md shadow-[0_1px_1px_rgba(0,0,0,0.01)]">
                      <Crown size={12} className="text-[#EA580C]" />
                      <span>{team.leader.fullName}</span>
                      <span className="text-[9px] font-bold tracking-wider bg-[#EA580C] text-white px-1 py-0.2 rounded uppercase scale-90 origin-center">
                        TL
                      </span>
                    </div>
                  )}

                  {/* Operational Unit Staff Members */}
                  {team.members && team.members.length > 0 ? (
                    team.members.map((member) => (
                      <div
                        key={member.id}
                        className="bg-white border border-[#E8E8ED] text-[#6E6E73] px-2.5 py-1 rounded-md font-medium"
                      >
                        {member.employee?.fullName}
                      </div>
                    ))
                  ) : (
                    <span className="text-[11px] font-medium text-[#86868B] italic pl-1">
                      No desk members assigned
                    </span>
                  )}
                </div>
              </div>

              {/* Right Segment: Administrative Micro Operations */}
              <div className="flex items-center gap-2 justify-end md:opacity-40 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={() => handleEditTeam(team)}
                  className="p-1.5 text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] rounded-md transition-colors"
                  title="Modify properties"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDeleteTeam(team.id)}
                  className="p-1.5 text-[#86868B] hover:text-[#D02E2E] hover:bg-[#FDF2F2] rounded-md transition-colors"
                  title="Remove structure"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center text-xs font-medium text-[#86868B] tracking-wide">
            No professional framework nodes built. Click the option above to
            deploy configurations.
          </div>
        )}
      </div>

      {/* ====================================================== */}
      {/* HIGH-END MINIMALIST MANAGEMENT MODAL CANVAS            */}
      {/* ====================================================== */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-white w-full max-w-xl rounded-xl border border-[#E8E8ED] shadow-[0_12px_30px_rgba(0,0,0,0.08)] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E8ED] bg-[#FBFBFD]">
              <div>
                <h3 className="text-sm font-semibold text-[#1D1D1F]">
                  {editingTeamId
                    ? "Reconfigure Corporate Nodes"
                    : "Provision New Team Struct"}
                </h3>
                <p className="text-[11px] text-[#86868B] mt-0.5 font-medium">
                  Update database relationships and performance targets.
                </p>
              </div>
              <button
                onClick={resetForm}
                className="text-[#86868B] hover:text-[#1D1D1F] p-1 rounded-md hover:bg-[#F5F5F7] transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Config Entry Form */}
            <form onSubmit={handleSubmit}>
              <div className="p-5 space-y-4 text-xs">
                {/* FIELD: TEAM NAME */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider">
                    Structural Team Title
                  </label>
                  <input
                    type="text"
                    value={formData.teamName}
                    onChange={(e) =>
                      setFormData({ ...formData, teamName: e.target.value })
                    }
                    className="w-full bg-[#F5F5F7] border border-[#E8E8ED] rounded-lg px-3 py-2 text-xs font-medium text-[#1D1D1F] outline-none focus:border-[#1D1D1F]"
                    placeholder="e.g. Enterprise Sales Engine"
                    required
                  />
                </div>

                {/* TWO-COLUMN GRID FIELDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* FIELD: TARGET VALUES */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider">
                      Quota Pipeline Allocation (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.targetValue}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          targetValue: e.target.value,
                        })
                      }
                      className="w-full bg-[#F5F5F7] border border-[#E8E8ED] rounded-lg px-3 py-2 text-xs font-medium text-[#1D1D1F] outline-none focus:border-[#1D1D1F]"
                      placeholder="0"
                    />
                  </div>

                  {/* FIELD: LEADER SELECTION */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider">
                      Appoint Team Leader
                    </label>
                    <select
                      value={formData.teamLeader}
                      onChange={(e) =>
                        setFormData({ ...formData, teamLeader: e.target.value })
                      }
                      className="w-full bg-[#F5F5F7] border border-[#E8E8ED] rounded-lg px-3 py-2 text-xs font-medium text-[#1D1D1F] outline-none focus:border-[#1D1D1F] cursor-pointer"
                      required
                    >
                      <option value="">Choose Leader profile...</option>
                      {employees
                        .filter((emp) => {
                          const isEditingLeader =
                            editingTeamId &&
                            teams.some(
                              (t) =>
                                t.id === editingTeamId &&
                                t.leader?.employeeId === emp.employeeId,
                            );
                          return (
                            !assignedEmployeeIds.includes(emp.employeeId) ||
                            isEditingLeader
                          );
                        })
                        .map((emp) => (
                          <option key={emp.employeeId} value={emp.employeeId}>
                            {emp.fullName}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* GROUP SECTION: OPERATIONAL MEMBERS LIST */}
                <div className="pt-2 border-t border-[#E8E8ED]">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider">
                      Assigned Base Desk Staff
                    </label>
                    <button
                      type="button"
                      onClick={handleAddMember}
                      className="text-[#0071E3] hover:text-[#004385] text-[11px] font-semibold flex items-center gap-1 transition-colors"
                    >
                      <UserPlus size={13} />
                      Append Member
                    </button>
                  </div>

                  {/* Dynamically Appended Desk Slots */}
                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 scrollbar-none">
                    {members.map((member, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 animate-in slide-in-from-top-1 duration-100"
                      >
                        <select
                          value={member.employeeId}
                          onChange={(e) =>
                            handleMemberChange(index, e.target.value)
                          }
                          className="flex-1 bg-[#F5F5F7] border border-[#E8E8ED] rounded-lg px-3 py-1.5 text-xs font-medium text-[#1D1D1F] outline-none focus:border-[#1D1D1F] cursor-pointer"
                        >
                          <option value="">Link desk employee...</option>
                          {getAvailableEmployees(index).map((emp) => (
                            <option key={emp.employeeId} value={emp.employeeId}>
                              {emp.fullName}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => handleDeleteMember(index)}
                          className="text-[#86868B] hover:text-[#D02E2E] p-1.5 hover:bg-[#FDF2F2] rounded-md transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                    {members.length === 0 && (
                      <p className="text-[11px] text-[#86868B] italic py-1 pl-0.5">
                        No team nodes attached. Operational ledger items will
                        default straight to the appointed Leader.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Committal Control Footer */}
              <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[#E8E8ED] bg-[#FBFBFD]">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-xs font-medium text-[#6E6E73] hover:text-[#1D1D1F] transition-colors"
                >
                  Abort
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#1D1D1F] text-white px-4 py-2 rounded-lg text-xs font-medium tracking-wide hover:bg-[#323234] disabled:opacity-50 transition-all"
                >
                  {loading
                    ? "Writing Node..."
                    : editingTeamId
                      ? "Update Teamsetup"
                      : "Build New Team"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateTeam;
