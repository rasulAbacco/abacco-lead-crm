//src/components/reports/CreateTeam.jsx

import React, { useEffect, useState } from "react";

import { Plus, Trash2, X, UserPlus, Crown, Pencil, Target } from "lucide-react";

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

  // ======================================================
  // ASSIGNED EMPLOYEES
  // ======================================================

  const assignedEmployeeIds = teams.flatMap((team) => [
    team.leader?.employeeId,

    ...(team.members?.map((member) => member.employee?.employeeId) || []),
  ]);

  // ======================================================
  // AVAILABLE EMPLOYEES
  // ======================================================

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

  // ======================================================
  // ADD MEMBER
  // ======================================================

  const handleAddMember = () => {
    setMembers([
      ...members,
      {
        employeeId: "",
      },
    ]);
  };

  // ======================================================
  // MEMBER CHANGE
  // ======================================================

  const handleMemberChange = (index, value) => {
    const updatedMembers = [...members];

    updatedMembers[index].employeeId = value;

    setMembers(updatedMembers);
  };

  // ======================================================
  // DELETE MEMBER
  // ======================================================

  const handleDeleteMember = (index) => {
    const updatedMembers = [...members];

    updatedMembers.splice(index, 1);

    setMembers(updatedMembers);
  };

  // ======================================================
  // EDIT TEAM
  // ======================================================

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

      const payload = {
        ...formData,
        members,
      };

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

      if (!res.ok) {
        throw new Error(data.message || "Failed");
      }

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
    const confirmDelete = window.confirm("Delete this team?");

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
    <div className="px-8 py-6 bg-white min-h-screen">
      {/* ====================================================== */}
      {/* HEADER */}
      {/* ====================================================== */}

      <div className="flex items-center justify-between border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Teams</h1>

          <p className="text-sm text-gray-500 mt-1">Manage teams and targets</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-black text-white px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 hover:opacity-90"
        >
          <Plus size={16} />
          Create Team
        </button>
      </div>

      {/* ====================================================== */}
      {/* TEAM LIST */}
      {/* ====================================================== */}

      <div className="mt-8 divide-y divide-gray-200">
        {teams.map((team) => (
          <div
            key={team.id}
            className="py-6 flex items-start justify-between gap-6"
          >
            {/* LEFT */}

            <div className="flex-1">
              {/* TEAM */}

              <div className="flex items-center gap-4 flex-wrap">
                <h2 className="text-2xl font-semibold text-gray-900">
                  {team.name}
                </h2>

                <div className="flex items-center gap-1 text-sm text-amber-600">
                  <Crown size={15} />

                  <span>{team.leader?.fullName}</span>
                </div>

                <div className="flex items-center gap-1 text-sm text-indigo-600">
                  <Target size={15} />

                  <span>₹{Number(team.targetValue || 0).toLocaleString()}</span>
                </div>
              </div>

              {/* MEMBERS */}

              <div className="mt-4 flex flex-wrap gap-2">
                {team.members?.map((member) => (
                  <div
                    key={member.id}
                    className="border border-gray-300 rounded-full px-3 py-1 text-sm text-gray-700"
                  >
                    {member.employee?.fullName}
                  </div>
                ))}
              </div>
            </div>

            {/* ACTIONS */}

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleEditTeam(team)}
                className="text-gray-500 hover:text-black"
              >
                <Pencil size={18} />
              </button>

              <button
                onClick={() => handleDeleteTeam(team.id)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ====================================================== */}
      {/* MODAL */}
      {/* ====================================================== */}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden">
            {/* HEADER */}

            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  {editingTeamId ? "Update Team" : "Create Team"}
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Manage team information
                </p>
              </div>

              <button
                onClick={resetForm}
                className="text-gray-500 hover:text-black"
              >
                <X size={22} />
              </button>
            </div>

            {/* FORM */}

            <form onSubmit={handleSubmit}>
              <div className="px-6 py-6 space-y-5">
                {/* TEAM NAME */}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Team Name
                  </label>

                  <input
                    type="text"
                    value={formData.teamName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,

                        teamName: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-black"
                    placeholder="Enter team name"
                    required
                  />
                </div>

                {/* TARGET */}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Team Target
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
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-black"
                    placeholder="Enter target amount"
                  />
                </div>

                {/* LEADER */}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Team Leader
                  </label>

                  <select
                    value={formData.teamLeader}
                    onChange={(e) =>
                      setFormData({
                        ...formData,

                        teamLeader: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-black"
                    required
                  >
                    <option value="">Select Team Leader</option>

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

                {/* MEMBERS */}

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-700">
                      Team Members
                    </label>

                    <button
                      type="button"
                      onClick={handleAddMember}
                      className="text-sm font-medium flex items-center gap-1"
                    >
                      <UserPlus size={15} />
                      Add Member
                    </button>
                  </div>

                  <div className="space-y-3">
                    {members.map((member, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <select
                          value={member.employeeId}
                          onChange={(e) =>
                            handleMemberChange(index, e.target.value)
                          }
                          className="flex-1 border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-black"
                        >
                          <option value="">Select Employee</option>

                          {getAvailableEmployees(index).map((emp) => (
                            <option key={emp.employeeId} value={emp.employeeId}>
                              {emp.fullName}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => handleDeleteMember(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* FOOTER */}

              <div className="flex items-center justify-end gap-3 px-6 py-5 border-t border-gray-200">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-5 py-2.5 text-sm text-gray-600"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-black text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:opacity-90"
                >
                  {loading
                    ? editingTeamId
                      ? "Updating..."
                      : "Creating..."
                    : editingTeamId
                      ? "Update Team"
                      : "Create Team"}
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
