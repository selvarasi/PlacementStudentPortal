import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/AdminPlacementTracking.css";

const AdminPlacementTracking = () => {
  const [trackingData, setTrackingData] = useState([]);

  useEffect(() => {
    fetchTrackingData();
  }, []);

  const fetchTrackingData = async () => {
    try {
      const res = await axios.get("http://localhost:8080/api/studentSelections");
      const grouped = groupByCompany(res.data);
      setTrackingData(grouped);
    } catch (err) {
      console.error("Error fetching tracking data:", err);
    }
  };

  const groupByCompany = (records) => {
    const map = {};
    records.forEach((rec) => {
      const key = `${rec.companyName}__${rec.jobRole}`;
      if (!map[key]) {
        map[key] = {
          companyName: rec.companyName,
          jobRole: rec.jobRole,
          students: []
        };
      }
      let student = map[key].students.find(s => s.studentEmail === rec.studentEmail);
      if (!student) {
        student = {
          studentName: rec.studentName,
          studentEmail: rec.studentEmail,
          rounds: []
        };
        map[key].students.push(student);
      }
      student.rounds.push({
        roundNumber: rec.roundNumber,
        venue: rec.nextRoundVenue,
        time: rec.nextRoundTime
      });
    });

    // Sort rounds for each student
    Object.values(map).forEach(group => {
      group.students.forEach(student => {
        student.rounds.sort((a, b) => a.roundNumber - b.roundNumber);
      });
    });

    return Object.values(map);
  };

  const downloadCSV = (companyName, jobRole, students) => {
    const csvHeader = [
      "Student Name",
      "Student Email",
      "Round Number",
      "Venue",
      "Time"
    ];

    const csvRows = [];
    students.forEach(student => {
      student.rounds.forEach(round => {
        csvRows.push([
          student.studentName,
          student.studentEmail,
          round.roundNumber,
          round.venue,
          new Date(round.time).toLocaleString()
        ]);
      });
    });

    const csvContent = [csvHeader, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${companyName}_${jobRole}_Tracking.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-placement-tracking">
      <h1>📊 Placement Process Summary</h1>
      {trackingData.length === 0 ? (
        <p>No tracking data available.</p>
      ) : (
        <table className="summary-table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Job Role</th>
              <th>Students Selected</th>
              <th>Max Rounds Completed</th>
              <th>CSV Export</th>
            </tr>
          </thead>
          <tbody>
            {trackingData.map((group, idx) => {
              const totalStudents = group.students.length;
              const maxRounds = Math.max(
                ...group.students.map((s) =>
                  s.rounds.length > 0 ? Math.max(...s.rounds.map(r => r.roundNumber)) : 0
                )
              );

              return (
                <tr key={idx}>
                  <td>{group.companyName}</td>
                  <td>{group.jobRole}</td>
                  <td>{totalStudents}</td>
                  <td>{maxRounds}</td>
                  <td>
                    <button
                      className="csv-btn"
                      onClick={() =>
                        downloadCSV(group.companyName, group.jobRole, group.students)
                      }
                    >
                      📥 Download
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminPlacementTracking;
