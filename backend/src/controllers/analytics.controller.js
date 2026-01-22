import DemandEvent from "../models/DemandEvent.js";

/*
  Simple geocode helper using Nominatim. Returns { lat, lon } or null.
  NOTE: Nominatim has usage policy – consider caching or using a paid geocoding provider for production.
*/
const geocode = async (query) => {
  try {
    const q = encodeURIComponent(query);
    const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`;
    const res = await fetch(url, { headers: { "User-Agent": "RideSaathi/1.0 (+your-email@example.com)" } });
    const body = await res.json();
    if (!body || body.length === 0) return null;
    return { lat: parseFloat(body[0].lat), lon: parseFloat(body[0].lon) };
  } catch (err) {
    return null;
  }
};

/* ===============================
   AGGREGATE DEMAND -> HEAT POINTS
   GET /api/analytics/demand?start=ISO&end=ISO&precision=2
   precision = number of decimal multiplier (e.g. 2 => ~1km buckets)
================================ */
export const getDemandHeat = async (req, res) => {
  try {
    const { start, end, precision = 2 } = req.query;
    const startDate = start ? new Date(start) : new Date(Date.now() - 1000 * 60 * 60 * 24 * 7); // default 7 days
    const endDate = end ? new Date(end) : new Date();

    const prec = Math.max(1, parseInt(precision, 10));
    const factor = Math.pow(10, prec);

    const pipeline = [
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          "location.lat": { $ne: null },
          "location.lng": { $ne: null },
        },
      },
      {
        $project: {
          latBucket: { $round: [{ $multiply: ["$location.lat", factor] }, 0] },
          lngBucket: { $round: [{ $multiply: ["$location.lng", factor] }, 0] },
        },
      },
      {
        $group: {
          _id: { latBucket: "$latBucket", lngBucket: "$lngBucket" },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          lat: { $divide: ["$_id.latBucket", factor] },
          lng: { $divide: ["$_id.lngBucket", factor] },
          weight: "$count",
        },
      },
      { $sort: { weight: -1 } },
      { $limit: 1000 }, // safety
    ];

    const results = await DemandEvent.aggregate(pipeline);

    return res.status(200).json({ success: true, points: results });
  } catch (error) {
    console.error("getDemandHeat error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* Helper: log an event (used from ride/search controllers).
   Attempts to geocode `text` if coords not provided.
*/
export const logDemandEvent = async ({ type, ride = null, user = null, source = null, destination = null, lat = null, lng = null }) => {
  try {
    let location = { lat: lat ?? null, lng: lng ?? null };

    if ((lat == null || lng == null) && source) {
      const geo = await geocode(source);
      if (geo) location = { lat: geo.lat, lng: geo.lon };
    }

    await DemandEvent.create({
      type,
      ride,
      user,
      source,
      destination,
      location,
    });
  } catch (err) {
    // non-fatal logging error
    console.error("logDemandEvent err:", err?.message || err);
  }
};
