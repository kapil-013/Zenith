import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Issue } from "../types";
import { NeumorphicCard } from "../components/ui/card";
import { NeumorphicBadge } from "../components/ui/badge";
import { NeumorphicButton } from "../components/ui/button";
import {
  MapPin,
  Users,
  Clock,
  Search,
  List,
  Map as MapIcon,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
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
    if (filterStatus !== "All" && issue.status !== filterStatus) return false;
    if (filterCategory !== "All" && issue.category !== filterCategory) return false;
    if (filterSeverity !== "All" && issue.severity !== filterSeverity) return false;
    if (
      search &&
      !issue.title.toLowerCase().includes(search.toLowerCase()) &&
      !issue.category.toLowerCase().includes(search.toLowerCase())
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
          <h1 className="text-3xl font-bold text-slate-800">Community Map</h1>
          <p className="text-slate-600 mt-1">
            Explore and verify civic issues in your area.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex bg-[#e9eef5] p-1 rounded-xl shadow-[inset_2px_2px_4px_#b8bec5,inset_-2px_-2px_4px_#ffffff]">
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                viewMode === "list"
                  ? "bg-white shadow-sm text-blue-600"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              <List className="h-4 w-4" /> List
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                viewMode === "map"
                  ? "bg-white shadow-sm text-blue-600"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              <MapIcon className="h-4 w-4" /> Map
            </button>
          </div>
          <div className="relative w-full md:w-48">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <NeumorphicInput
              placeholder="Search..."
              className="pl-9 h-11"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <select
              className="flex h-11 w-full md:w-auto rounded-xl bg-[#e9eef5] px-4 py-2 text-sm text-slate-800 shadow-[inset_4px_4px_8px_#b8bec5,inset_-4px_-4px_8px_#ffffff] focus:outline-none shrink-0"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Verified">Verified</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Confirmed">Confirmed</option>
            </select>
            <select
              className="flex h-11 w-full md:w-auto rounded-xl bg-[#e9eef5] px-4 py-2 text-sm text-slate-800 shadow-[inset_4px_4px_8px_#b8bec5,inset_-4px_-4px_8px_#ffffff] focus:outline-none shrink-0"
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
              className="flex h-11 w-full md:w-auto rounded-xl bg-[#e9eef5] px-4 py-2 text-sm text-slate-800 shadow-[inset_4px_4px_8px_#b8bec5,inset_-4px_-4px_8px_#ffffff] focus:outline-none shrink-0 max-w-[150px]"
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
            <NeumorphicCard key={i} className="h-80 animate-pulse opacity-50" />
          ))}
        </div>
      ) : filteredIssues.length === 0 ? (
        <div className="col-span-full flex flex-col items-center justify-center min-h-[300px] text-center bg-[#e9eef5] rounded-3xl p-8 shadow-[inset_4px_4px_8px_#b8bec5,inset_-4px_-4px_8px_#ffffff]">
          <MapPin className="h-12 w-12 text-slate-400 mb-4" />
          <h3 className="text-xl font-bold text-slate-700 mb-2">
            No civic issues found
          </h3>
          <p className="text-slate-500 max-w-sm mb-6">
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
                      <h4 className="font-bold text-slate-800">
                        {issue.title}
                      </h4>
                      <p className="text-sm text-slate-500 mt-1">
                        {issue.address}
                      </p>
                      <div className="mt-2 flex gap-2">
                        <span className="text-xs px-2 py-1 bg-slate-100 rounded-md text-slate-600">
                          {issue.status}
                        </span>
                        <span className="text-xs px-2 py-1 bg-slate-100 rounded-md text-slate-600">
                          {issue.category}
                        </span>
                      </div>
                      <Link
                        to={`/issues/${issue.id}`}
                        className="block mt-3 text-center w-full py-1.5 bg-blue-50 text-blue-600 rounded-md text-sm font-medium hover:bg-blue-100"
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

function IssueCard({ issue }: { issue: Issue }) {
  return (
    <NeumorphicCard className="flex flex-col h-full overflow-hidden transform hover:scale-[1.02] transition-transform relative p-0 border-0">
      {issue.priorityScore >= 81 && (
        <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-lg z-10">
          Urgent
        </div>
      )}
      <div className="relative h-48 w-full bg-slate-200 shrink-0">
        {issue.imageUrl ? (
          <img
            src={issue.imageUrl}
            alt={issue.title}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-slate-400 bg-[#e9eef5]">
            No Image Available
          </div>
        )}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <NeumorphicBadge
            variant={
              issue.status === "Resolved" || issue.status === "Confirmed"
                ? "success"
                : issue.status === "In Progress"
                  ? "info"
                  : issue.status === "Verified"
                    ? "warning"
                    : "default"
            }
          >
            {issue.status}
          </NeumorphicBadge>
        </div>
        <div className="absolute top-3 left-3 flex gap-2">
          <NeumorphicBadge
            variant={
              issue.severity === "Critical" || issue.severity === "High"
                ? "danger"
                : issue.severity === "Medium"
                  ? "warning"
                  : "info"
            }
          >
            {issue.category}
          </NeumorphicBadge>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-bold text-lg text-slate-800 line-clamp-1 mb-1">
          {issue.title}
        </h3>
        <div className="flex items-start gap-2 text-sm text-slate-500 mb-4">
          <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
          <span className="line-clamp-1">
            {issue.address || "Location unavailable"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4 mt-auto">
          <div className="flex items-center gap-2 text-sm text-slate-600 bg-[#e9eef5] py-1.5 px-3 rounded-lg shadow-[inset_1px_1px_3px_#b8bec5,inset_-1px_-1px_3px_#ffffff]">
            <Users className="h-4 w-4 text-blue-500" />
            <span className="font-semibold">
              {issue.verificationCount} verified
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600 bg-[#e9eef5] py-1.5 px-3 rounded-lg shadow-[inset_1px_1px_3px_#b8bec5,inset_-1px_-1px_3px_#ffffff]">
            <Clock className="h-4 w-4 text-amber-500" />
            <span>{formatDistanceToNow(issue.createdAt)} ago</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-200/50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Priority
            </span>
            <span
              className={cn(
                "text-lg font-black",
                issue.priorityScore >= 81
                  ? "text-red-500"
                  : issue.priorityScore >= 61
                    ? "text-orange-500"
                    : issue.priorityScore >= 31
                      ? "text-amber-500"
                      : "text-green-500",
              )}
            >
              {issue.priorityScore}
            </span>
          </div>
          <Link to={`/issues/${issue.id}`}>
            <NeumorphicButton size="sm" variant="ghost">
              Details
            </NeumorphicButton>
          </Link>
        </div>
      </div>
    </NeumorphicCard>
  );
}
