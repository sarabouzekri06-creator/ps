import { useState } from "react";

const data = [
  { day: "Monday", medicaments: ["Doliprane", "Aspirine", "Vitamine C"] },
  { day: "Tuesday", medicaments: ["Insuline", "Paracetamol"] },
  { day: "Wednesday", medicaments: ["Doliprane", "Vitamine C", "Aspirine"] },
  { day: "Thursday", medicaments: ["Insuline"] },
  { day: "Friday", medicaments: ["Doliprane", "Vitamine C"] }
];

const Medicament = () => {
  const [selectedDay, setSelectedDay] = useState(data[0].day); // default: Monday

  const currentData = data.find(d => d.day === selectedDay);

  return (
    <div className="container mt-4">

    

      {/* Select pour choisir le jour */}
      <select
        className=" mb-3"
        value={selectedDay}
        onChange={(e) => setSelectedDay(e.target.value)}
      >
        {data.map((item, index) => (
          <option key={index} value={item.day}>
            {item.day}
          </option>
        ))}
      </select>

      {/* Liste des médicaments */}
      <ul className="list-group">
        {currentData.medicaments.map((med, index) => (
          <li key={index} className="list-group-item">
            {med}
          </li>
        ))}
      </ul>

    </div>
  );
};

export default Medicament;