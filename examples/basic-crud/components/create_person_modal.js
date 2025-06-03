import React, { useState } from "react";

export default function CreatePersonModal({ isOpen, onClose, onCreate }) {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    birth_date: "",
    email: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((data) => ({ ...data, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onCreate(formData);
    setFormData({
      first_name: "",
      last_name: "",
      birth_date: "",
      email: "",
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal d-block" tabIndex="-1">
      <div className="modal-dialog">
        <form onSubmit={handleSubmit} className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Add New Person</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body">
            {["first_name", "last_name", "birth_date", "email"].map((field) => (
              <div className="mb-3" key={field}>
                <label className="form-label text-capitalize">
                  {field.replace("_", " ")}
                </label>
                <input
                  type={field === "birth_date" ? "date" : "text"}
                  className="form-control"
                  name={field}
                  value={formData[field]}
                  onChange={handleChange}
                  required
                />
              </div>
            ))}
          </div>
          <div className="modal-footer">
            <button type="submit" className="btn btn-primary">
              Create
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
