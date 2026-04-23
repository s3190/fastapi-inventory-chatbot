import React from 'react';
import './TaglineSection.css';

const TaglineSection = () => {
  return (
    <div className="tagline-card">
      <div className="tagline-content">
        <h3>Smarter Inventory Starts Here</h3>
        <p>Efficiently manage your inventory with a system designed to grow alongside your business.</p>
        <div className="company-badge">
          <span className="powered-by">FastAPI Demo by</span>
          <span className="company-name">Susmitha T</span>
        </div>
      </div>
    </div>
  );
};

export default TaglineSection;
