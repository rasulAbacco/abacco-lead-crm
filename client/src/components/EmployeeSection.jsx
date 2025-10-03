import React from "react";
import EmployeeCard from "./EmployeeCard";
import EmployeeTable from "./EmployeeTable";

export default function EmployeeSection({ selectedEmployee, setSelectedEmployee, filteredEmployees, filter, setFilter }) {
  return (
    <>
      {selectedEmployee && (
        <EmployeeCard employee={selectedEmployee} onClose={() => setSelectedEmployee(null)} />
      )}
      <EmployeeTable
        employees={filteredEmployees}
        filter={filter}
        setFilter={setFilter}
        setSelectedEmployee={setSelectedEmployee}
      />
    </>
  );
}
