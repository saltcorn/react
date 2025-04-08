import React, { useState } from "react";
import PersonDetailsModal from "./person_modal";

import { useFetchRows } from "@saltcorn/react-lib/hooks";

export default function PersonsList({}) {
  const { rows, error } = useFetchRows("Persons", {});
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleRowClick = (person) => {
    setSelectedPerson(person);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPerson(null);
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Persons List</h2>
      <div className="table-responsive">
        <table className="table table-striped table-bordered table-hover">
          <thead className="table-dark">
            <tr>
              <th>#</th>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Birth Date</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>
            {rows && rows.length > 0 ? (
              rows.map((person, index) => (
                <tr
                  key={person.id}
                  onClick={() => handleRowClick(person)}
                  style={{ cursor: "pointer" }}
                >
                  <td>{index + 1}</td>
                  <td>{person.first_name}</td>
                  <td>{person.last_name}</td>
                  <td>{person.birth_date}</td>
                  <td>{person.email}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center">
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <PersonDetailsModal
        person={selectedPerson}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </div>
  );
}
