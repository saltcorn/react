import React, { useState, useEffect } from "react";
import UpdatePersonModal from "./update_person_modal";
import CreatePersonModal from "./create_person_modal";

import { useFetchRows } from "@saltcorn/react-lib/hooks";
import { fetchOneRow, insertRow, deleteRow } from "@saltcorn/react-lib/api";

export default function PersonsList({}) {
  const [reloadFlag, setReloadFlag] = useState(false);
  const { rows, error } = useFetchRows("Persons", {}, [reloadFlag]);
  const [selectedPersonId, setSelectedPersonId] = useState(null);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    const fetchPerson = async () => {
      if (selectedPersonId !== null) {
        try {
          const person = await fetchOneRow("Persons", { id: selectedPersonId });
          setSelectedPerson(person);
        } catch (err) {
          console.error("Error fetching person:", err);
          setSelectedPerson(null);
        }
      }
    };
    fetchPerson();
  }, [selectedPersonId]);

  const handleRowClick = (person) => {
    setSelectedPersonId(person.id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPersonId(null);
    setSelectedPerson(null);
  };

  const handleCreate = async (newPerson) => {
    try {
      const result = await insertRow("Persons", newPerson);
      if (result === false) {
        console.error("Failed to insert row");
        return;
      }
      setReloadFlag((prev) => !prev); // Trigger re-fetch
    } catch (err) {
      console.error("Error inserting person:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this person?")) return;
    try {
      await deleteRow("Persons", id);
      setReloadFlag((prev) => !prev); // Trigger re-fetch
    } catch (err) {
      console.error("Error deleting person:", err);
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Persons List</h2>
        <button
          className="btn btn-success"
          onClick={() => setIsCreateModalOpen(true)}
        >
          + Add Person
        </button>
      </div>

      <div className="table-responsive">
        <table className="table table-striped table-bordered table-hover">
          <thead className="table-dark">
            <tr>
              <th>#</th>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Birth Date</th>
              <th>Email</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows && rows.length > 0 ? (
              rows.map((person, index) => (
                <tr key={person.id} style={{ cursor: "pointer" }}>
                  <td onClick={() => handleRowClick(person)}>{index + 1}</td>
                  <td onClick={() => handleRowClick(person)}>
                    {person.first_name}
                  </td>
                  <td onClick={() => handleRowClick(person)}>
                    {person.last_name}
                  </td>
                  <td onClick={() => handleRowClick(person)}>
                    {person.birth_date}
                  </td>
                  <td onClick={() => handleRowClick(person)}>{person.email}</td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(person.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center">
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <UpdatePersonModal
        person={selectedPerson}
        isOpen={isModalOpen}
        onClose={closeModal}
        onUpdated={() => setReloadFlag((prev) => !prev)}
      />
      <CreatePersonModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}
