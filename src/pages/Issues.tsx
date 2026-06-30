import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Issue } from "../types";
import { NeumorphicCard } from "../components/ui/card";
import { NeumorphicButton } from "../components/ui/button";
import { IssueCard } from "../components/IssueCard";
import {
  MapPin,
  Search,
  List,
  Map as MapIcon,
} from "lucide-react";
import { NeumorphicInput } from "../components/ui/input";
import { cn } from "../lib/utils";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { motion } from "motion/react";

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export function Issues() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterSeverity, setFilterSeverity] = useState("All");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  useEffect(() => {
    const q = query(collection(db, "issues"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const issuesData: Issue[] = [];
      snapshot.forEach((doc) => {
        issuesData.push({ id: doc.id, ...doc.data() } as Issue);
      });
      setIssues(issuesData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredIssues = issues.filter((issue) => {
    const status = issue.currentStatus || issue.status;
    if (filterStatus !== "All" && status !== filterStatus) return false;
    if (filterCategory !== "All" && issue.category !== filterCategory) return false;
    if (filterSeverity !== "All" && issue.severity !== filterSeverity) return false;
    if (
      search &&
      !(issue.title?.toLowerCase() || "").includes(search.toLowerCase()) &&
      !(issue.category?.toLowerCase() || "").includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--color-civic-text-primary)] tracking-tight">Community Map</h1>
          <p className="text-[var(--color-civic-text-secondary)] font-medium mt-1">
            Explore and verify civic issues in your area.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex bg-[var(--color-civic-surface-inset)] p-1 rounded-xl shadow-[var(--shadow-neumorphic-inset)] border border-transparent">
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
                viewMode === "list"
                  ? "bg-[var(--color-civic-surface)] shadow-[var(--shadow-neumorphic-floating)] text-[var(--color-civic-primary)]"
                  : "text-[var(--color-civic-text-muted)] hover:text-[var(--color-civic-text-primary)]",
              )}
            >
              <List className="h-4 w-4" /> List
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
                viewMode === "map"
                  ? "bg-[var(--color-civic-surface)] shadow-[var(--shadow-neumorphic-floating)] text-[var(--color-civic-primary)]"
                  : "text-[var(--color-civic-text-muted)] hover:text-[var(--color-civic-text-primary)]",
              )}
            >
              <MapIcon className="h-4 w-4" /> Map
            </button>
          </div>
          <div className="relative w-full md:w-48">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-[var(--color-civic-text-muted)]" />
            <NeumorphicInput
              placeholder="Search..."
              className="pl-9 h-11 bg-[var(--color-civic-surface-inset)]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <select
              className="flex h-11 w-full md:w-auto rounded-xl bg-[var(--color-civic-surface-inset)] px-4 py-2 text-sm font-bold text-[var(--color-civic-text-primary)] shadow-[var(--shadow-neumorphic-inset)] focus:outline-none focus:ring-2 focus:ring-[var(--color-civic-primary)]/50 shrink-0 border border-transparent appearance-none"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Reported">Reported</option>
              <option value="Community Verified">Verified</option>
              <option value="Assigned to Department">Assigned</option>
              <option value="Work In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
            <select
              className="flex h-11 w-full md:w-auto rounded-xl bg-[var(--color-civic-surface-inset)] px-4 py-2 text-sm font-bold text-[var(--color-civic-text-primary)] shadow-[var(--shadow-neumorphic-inset)] focus:outline-none focus:ring-2 focus:ring-[var(--color-civic-primary)]/50 shrink-0 border border-transparent appearance-none"
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
            >
              <option value="All">All Severities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
            <select
              className="flex h-11 w-full md:w-auto rounded-xl bg-[var(--color-civic-surface-inset)] px-4 py-2 text-sm font-bold text-[var(--color-civic-text-primary)] shadow-[var(--shadow-neumorphic-inset)] focus:outline-none focus:ring-2 focus:ring-[var(--color-civic-primary)]/50 shrink-0 max-w-[150px] border border-transparent appearance-none"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="All">All Categories</option>
              <option value="Pothole">Pothole</option>
              <option value="Garbage Overflow">Garbage</option>
              <option value="Water Leakage">Water</option>
              <option value="Broken Streetlight">Streetlight</option>
              <option value="Sewage Issue">Sewage</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <NeumorphicCard key={i} className="h-80 animate-pulse opacity-50 border-transparent" />
          ))}
        </div>
      ) : filteredIssues.length === 0 ? (
        <div className="col-span-full flex flex-col items-center justify-center min-h-[300px] text-center bg-[var(--color-civic-surface-inset)] rounded-3xl p-8 shadow-[var(--shadow-neumorphic-inset)] border border-transparent">
          <MapPin className="h-12 w-12 text-[var(--color-civic-text-muted)] mb-4" />
          <h3 className="text-xl font-extrabold text-[var(--color-civic-text-primary)] mb-2">
            No civic issues found
          </h3>
          <p className="text-[var(--color-civic-text-secondary)] font-medium max-w-sm mb-6">
            Try adjusting your filters, or be the first to report an issue in
            this area.
          </p>
          <Link to="/report">
            <NeumorphicButton variant="primary">
              Report an Issue
            </NeumorphicButton>
          </Link>
        </div>
      ) : viewMode === "list" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIssues.map((issue, index) => (
            <motion.div
              key={issue.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <IssueCard issue={issue} />
            </motion.div>
          ))}
        </div>
      ) : (
        <NeumorphicCard className="h-[600px] overflow-hidden p-2">
          <MapContainer
            center={[28.6139, 77.209]}
            zoom={13}
            scrollWheelZoom={true}
            className="w-full h-full rounded-xl z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            {filteredIssues.map((issue) =>
              issue.location && issue.location.lat ? (
                <Marker
                  key={issue.id}
                  position={[issue.location.lat, issue.location.lng]}
                >
                  <Popup className="rounded-xl">
                    <div className="font-sans min-w-[200px]">
                      <h4 className="font-bold text-[var(--color-civic-text-primary)]">
                        {issue.title}
                      </h4>
                      <p className="text-sm text-[var(--color-civic-text-secondary)] font-medium mt-1">
                        {issue.address}
                      </p>
                      <div className="mt-2 flex gap-2">
                         <span className="text-xs px-2 py-1 bg-[var(--color-civic-surface-inset)] rounded-md text-[var(--color-civic-text-primary)] font-bold">
                          {issue.currentStatus || issue.status}
                        </span>
                        <span className="text-xs px-2 py-1 bg-[var(--color-civic-surface-inset)] rounded-md text-[var(--color-civic-text-primary)] font-bold">
                          {issue.category}
                        </span>
                      </div>
                      <Link
                        to={`/issues/${issue.id}`}
                        className="block mt-3 text-center w-full py-1.5 bg-[var(--color-civic-primary)]/10 text-[var(--color-civic-primary)] rounded-md text-sm font-bold hover:bg-[var(--color-civic-primary)]/20 transition-colors"
                      >
                        View Details
                      </Link>
                    </div>
                  </Popup>
                </Marker>
              ) : null,
            )}
          </MapContainer>
        </NeumorphicCard>
      )}
    </motion.div>
  );
}
