import React from "react";

export default function PersonDetailsModal({ person, isOpen, onClose }) {
  if (!person) return null;

  return (
    <div
      className={`modal fade ${isOpen ? "show d-block" : ""}`}
      tabIndex="-1"
      role="dialog"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-dialog-centered" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Person Details</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body">
            <p>
              <strong>First Name:</strong> {person.first_name}
            </p>
            <p>
              <strong>Last Name:</strong> {person.last_name}
            </p>
            <p>
              <strong>Birth Date:</strong> {person.birth_date}
            </p>
            <p>
              <strong>Email:</strong> {person.email}
            </p>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
