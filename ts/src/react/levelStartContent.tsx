import React from "react";

interface LevelStartContentProps {
  extras: any;
}

const LevelStartContent = ({ extras }: LevelStartContentProps) => {
  return (
    <div id="level-start-content">
      <p style={{color: "gray"}}>{extras.quote}</p>
      <h3>Select playing difficulty to start</h3>
    </div>
  );
};

export default LevelStartContent;
