import React from "react";

const MissingKeySquaresContent = () => {
  return (
    <>
      <h2>Invalid Map</h2>
      <p>A valid map must contain a <span className="blue">Player Home square</span>, a <span className="red">Boss Home</span> square, and an <span className="yellow">Office</span> square.</p>
      <p>Please add these three elements to continue.</p>
    </>
  );
};

export default MissingKeySquaresContent;
