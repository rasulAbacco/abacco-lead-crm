import React from "react";
import AllLeadsSummary from "../components/AllLeadsSummary";
import AllLeadsTable from "../components/AllLeadsTable";

const AllLeadsPage = () => {
  return (
    <div className="p-6 space-y-6">
      <AllLeadsSummary />
      <AllLeadsTable />
    </div>
  );
};

export default AllLeadsPage;
