import React from "react";

interface ModalButtonContainerProps {
  children: any;
}

const ModalButtonContainer = ({ children }: ModalButtonContainerProps) => {
  return <div id="modal-button-container">{children}</div>;
};

export default ModalButtonContainer;
