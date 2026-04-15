
import { useState } from "react";

const NotificationList = () => {
    const dataWeek = [
  {
    day: "Monday",
    notifications: [
      { type: "Médicaments", name: "Doliprane", taken: true },
      { type: "Médicaments", name: "Aspirine", taken: false },
      { type: "Tension", name: "Mesure matin", taken: true }
    ]
  },
  {
    day: "Tuesday",
    notifications: [
      { type: "Médicaments", name: "Insuline", taken: false },
      { type: "Tension", name: "Mesure soir", taken: false }
    ]
  }]
  const [selectedDay, setSelectedDay] = useState(dataWeek[0].day);

  const currentDay = dataWeek.find(d => d.day === selectedDay);

  return (
    <div className="container mt-4">
      <h5>Notifications du jour</h5>

      {/* Choix du jour */}
      <select
        className="form-select mb-3"
        value={selectedDay}
        onChange={(e) => setSelectedDay(e.target.value)}
      >
        {dataWeek.map((d, index) => (
          <option key={index} value={d.day}>
            {d.day}
          </option>
        ))}
      </select>

      {/* Liste des notifications */}
      <ul className="list-group">
        {currentDay.notifications.map((notif, index) => (
          <li
            key={index}
            className={`list-group-item d-flex justify-content-between align-items-center ${
              notif.taken ? "list-group-item-success" : "list-group-item-danger"
            }`}
          >
            {notif.type} - {notif.name}
            <span>{notif.taken ? "Pris ✅" : "Non pris ❌"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NotificationList;