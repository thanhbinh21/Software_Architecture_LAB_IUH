const PRE_DEFINED_TRIPS = [
  { id: "TR-001", from: "Hà Nội", to: "Sài Gòn", expectedDeparture: "08:00 AM", expectedArrival: "16:00 PM next day", train: "SE1", initialSeats: 50 },
  { id: "TR-002", from: "Sài Gòn", to: "Đà Nẵng", expectedDeparture: "14:00 PM", expectedArrival: "22:00 PM", train: "SE3", initialSeats: 80 },
  { id: "TR-003", from: "Hà Nội", to: "Hải Phòng", expectedDeparture: "06:30 AM", expectedArrival: "09:00 AM", train: "HP1", initialSeats: 120 }
];

function searchTripsQuery(queryStr = "") {
  if (!queryStr) {
    return { data: PRE_DEFINED_TRIPS };
  }
  
  const qx = queryStr.toLowerCase();
  const res = PRE_DEFINED_TRIPS.filter(t => 
    t.from.toLowerCase().includes(qx) || 
    t.to.toLowerCase().includes(qx) ||
    t.id.toLowerCase().includes(qx)
  );

  return { data: res };
}

module.exports = { searchTripsQuery, PRE_DEFINED_TRIPS };
