import React, { useState } from 'react';
import { Modal, Button, Form, OverlayTrigger, Tooltip } from 'react-bootstrap';
import './SearchOptionsModal.css';

export const SearchOptionsModal = ({ 
  isOpen, 
  onClose, 
  taskSelection, 
  setTaskSelection, 
  targetLanguage,
  setTargetLanguage,
  expandLanguage,
  setExpandLanguage 
}) => {
  const handleTaskChange = (event) => {
    setTaskSelection(event.target.value);
    console.log('Task Selection:', event.target.value);
  };

  const renderTooltip = (text) => (
    <Tooltip>{text}</Tooltip>
  );

  return (
    <div>
      <Modal show={isOpen} onHide={onClose} backdrop={false}>
        <Modal.Header closeButton>
          <Modal.Title>Search Options</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="taskSelection">
              <Form.Label>Task Selection</Form.Label>
              <div>
                <Form.Check
                  type="radio"
                  label={
                    <>
                      Expand Articles{' '}
                      <OverlayTrigger
                        placement="right"
                        overlay={renderTooltip("Returns a list of existing articles in the specified language that need to be expanded")}
                      >
                        <span className="text-info">?</span>
                      </OverlayTrigger>
                    </>
                  }
                  value="expand"
                  checked={taskSelection === 'expand'}
                  onChange={handleTaskChange}
                />
                <Form.Check
                  type="radio"
                  label={
                    <>
                      Create New Articles{' '}
                      <OverlayTrigger
                        placement="right"
                        overlay={renderTooltip("Returns a list of missing articles in the target language that exist in the reference language")}
                      >
                        <span className="text-info">?</span>
                      </OverlayTrigger>
                    </>
                  }
                  value="create"
                  checked={taskSelection === 'create'}
                  onChange={handleTaskChange}
                />
              </div>
            </Form.Group>

            {taskSelection === 'expand' && (
              <Form.Group controlId="expandLanguage">
                <Form.Label>Select Language</Form.Label>
                <Form.Control 
                  as="select" 
                  value={expandLanguage} 
                  onChange={(e) => setExpandLanguage(e.target.value)}
                >
                  <option>English</option>
                  {/* <option>Hebrew</option> */}
                </Form.Control>
              </Form.Group>
            )}

            {taskSelection === 'create' && (
              <>
                <Form.Group controlId="targetLanguage">
                  <Form.Label>Target Language</Form.Label>
                  <Form.Control 
                    as="select" 
                    value={targetLanguage} 
                    onChange={(e) => setTargetLanguage(e.target.value)}
                  >
                    <option>Hebrew</option>
                  </Form.Control>
                </Form.Group>
                <Form.Group controlId="referenceLanguage">
                  <Form.Label>Reference Language</Form.Label>
                  <Form.Control as="select" defaultValue="English">
                    <option>English</option>
                  </Form.Control>
                </Form.Group>
              </>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={onClose}>Apply</Button>
          <Button variant="secondary" onClick={onClose}>Restore Defaults</Button>
          <Button variant="danger" onClick={onClose}>Cancel</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default SearchOptionsModal;