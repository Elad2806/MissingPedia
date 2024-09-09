import React, { useState } from 'react';
import Modal from 'react-modal';

Modal.setAppElement('#root');

export const EditProfileModal = ({ isOpen, onClose, onUpdateProfile }) => {
  const [username, setUsername] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdateProfile(username);
  };

  return (
    <Modal isOpen={isOpen} onRequestClose={onClose} contentLabel="Edit Profile">
      <h2>Edit Profile</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Wikipedia Username:
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </label>
        <button type="submit">Save</button>
        <button type="button" onClick={onClose}>Cancel</button>
      </form>
    </Modal>
  );
};
