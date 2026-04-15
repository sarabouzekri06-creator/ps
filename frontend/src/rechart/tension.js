import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";


const Tension = () => {

  const data = [
    { date: "Lun", systolic: 120, diastolic: 80 },
    { date: "Mar", systolic: 125, diastolic: 82 },
    { date: "Mer", systolic: 108, diastolic: 68 },
    { date: "Jeu", systolic: 100, diastolic: 85 },
    { date: "Ven", systolic: 122, diastolic: 80 }
  ];

  return (
    <div style={{ width: "90%", height: 200 }}>
      <h4>Tension artérielle</h4>

      <ResponsiveContainer>
        <LineChart data={data}>

          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="date" />

          <YAxis />

          <Tooltip />

          <Line
            type="monotone"
            dataKey="systolic"
            stroke="#ff4d4f"
            name="Systolique"
          />

          <Line
            type="monotone"
            dataKey="diastolic"
            stroke="#1890ff"
            name="Diastolique"
          />

        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Tension;