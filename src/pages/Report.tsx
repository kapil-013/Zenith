import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { NeumorphicCard, NeumorphicCardInset } from "../components/ui/card";
import { NeumorphicButton } from "../components/ui/button";
import { NeumorphicInput } from "../components/ui/input";
import { NeumorphicTextarea } from "../components/ui/textarea";
import { ImageUploadDropzone } from "../components/ui/image-upload";
import { NeumorphicBadge } from "../components/ui/badge";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { db, storage } from "../lib/firebase";
import { dispatcher } from "../lib/events/dispatcher";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  increment,
} from "firebase/firestore";
import {
  MapPin,
  BrainCircuit,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  Copy,
  Navigation,
  Search,
  Sparkles,
  CameraOff,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { calculatePriorityScore } from "../lib/utils";

// Haversine formula to calculate distance between two lat/lng coordinates in meters
function getDistanceFromLatLonInM(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const R = 6371e3; // Radius of the earth in m
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function Report() {
  const { user, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [locationType, setLocationType] = useState("road");
  const [image, setImage] = useState<{
    base64: string;
    mimeType: string;
  } | null>(null);

  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locationStatus, setLocationStatus] = useState<
    "none" | "detected" | "manual" | "fallback"
  >("none");
  const [isLocating, setIsLocating] = useState(false);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [manualMode, setManualMode] = useState(false);
  const [spamConfirmed, setSpamConfirmed] = useState(false);

  const [duplicateCandidate, setDuplicateCandidate] = useState<any>(null);
  const [aiDuplicates, setAiDuplicates] = useState<any[]>([]);

  const handleGetLocation = () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      addToast("Geolocation is not supported by your browser.", "error");
      setLat(28.6139); // Fallback: New Delhi
      setLng(77.209);
      setLocationStatus("fallback");
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude);
        setLng(position.coords.longitude);
        setLocationStatus("detected");
        setIsLocating(false);
        addToast("Location detected successfully.", "success");
      },
      () => {
        addToast("Unable to retrieve your location. Using fallback.", "error");
        setLat(28.6139); // Fallback: New Delhi
        setLng(77.209);
        setLocationStatus("fallback");
        setIsLocating(false);
      },
    );
  };

  const findDuplicate = async (
    category: string,
    userAddress: string,
    userDesc: string,
    userLat: number | null,
    userLng: number | null,
  ) => {
    try {
      const q = query(
        collection(db, "issues"),
        where("category", "==", category),
      );
      const snapshot = await getDocs(q);
      const existingIssues = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }) as any)
        .filter((i) => ["Open", "Verified", "In Progress"].includes(i.status));

      for (const issue of existingIssues) {
        if (
          userLat !== null &&
          userLng !== null &&
          issue.location &&
          issue.location.lat !== 0 &&
          issue.location.lng !== 0
        ) {
          const dist = getDistanceFromLatLonInM(
            userLat,
            userLng,
            issue.location.lat,
            issue.location.lng,
          );
          if (dist <= 150) {
            return issue;
          }
        } else {
          // Fallback to text similarity
          const getWords = (text: string) =>
            text
              .toLowerCase()
              .split(/\W+/)
              .filter((w) => w.length > 4);
          const addrWords = getWords(userAddress);
          const descWords = getWords(userDesc);

          const issueAddrWords = getWords(issue.address || "");
          const issueDescWords = getWords(issue.description || "");

          const addrMatch =
            addrWords.length > 0 &&
            addrWords.some((w) => issueAddrWords.includes(w));
          const descMatch =
            descWords.length > 0 &&
            descWords.filter((w) => issueDescWords.includes(w)).length >= 2;

          if (addrMatch || descMatch) {
            return issue;
          }
        }
      }
      return null;
    } catch (e) {
      console.error("Duplicate check failed", e);
      return null;
    }
  };

  const handleAnalyze = async () => {
    if (!description && !image) {
      addToast("Please provide an image or description first.", "error");
      return;
    }

    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/analyze-issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          address,
          locationType,
          imageBase64: image?.base64,
          mimeType: image?.mimeType,
        }),
      });

      if (!res.ok) throw new Error("Analysis failed");
      const data = await res.json();
      setAnalysisResult(data);
      addToast("AI analysis complete.", "success");
    } catch (error) {
      console.error(error);
      addToast(
        "Failed to analyze the issue. Switched to manual mode.",
        "error",
      );
      setManualMode(true);
      // Setup empty default result for manual mode
      setAnalysisResult({
        title: "Manual Civic Report",
        category: "Other",
        severity: "Medium",
        confidence: 0,
        suggestedDepartment: "General Civic Helpdesk",
        citizenSummary:
          description.substring(0, 100) +
          (description.length > 100 ? "..." : ""),
        authoritySummary: "Manually reported issue pending review.",
        riskReason: "Pending human review.",
        spamRisk: "Low",
        verificationQuestion: "Can you confirm this issue exists?",
        recommendedAction: "Investigate reported location.",
        priorityHints: ["Manually reported by citizen"],
        isFallback: true,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (ignoreDuplicate = false) => {
    if (!user) {
      addToast("Please sign in to submit.", "error");
      return;
    }
    if (!analysisResult) {
      addToast("Please analyze the issue first.", "error");
      return;
    }

    if (analysisResult.spamRisk === "High" && !spamConfirmed) {
      addToast(
        "High spam risk detected. Please confirm this is a valid report.",
        "error",
      );
      return;
    }

    if (!ignoreDuplicate) {
      setIsSubmitting(true);
      try {
        const checkLat = lat !== null ? lat : 28.6139;
        const checkLng = lng !== null ? lng : 77.209;

        const res = await fetch("/api/detect-duplicates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: analysisResult.category,
            lat: checkLat,
            lng: checkLng,
            description,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.duplicates && data.duplicates.length > 0) {
            setAiDuplicates(data.duplicates);
            setIsSubmitting(false);
            return;
          }
        }
      } catch (err) {
        console.error("Proactive duplicate check failed:", err);
      }

      const dup = await findDuplicate(
        analysisResult.category,
        address,
        description,
        lat,
        lng,
      );
      setIsSubmitting(false);
      if (dup) {
        setDuplicateCandidate(dup);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const initialIssueData = {
        severity: analysisResult.severity,
        locationType: locationType,
        spamRisk: analysisResult.spamRisk,
        verificationCount: 0,
        duplicateCount: 0, // Since we ignored duplicate
        status: "Reported",
        currentStatus: "Reported",
      };

      const { score, reasons } = calculatePriorityScore(initialIssueData);

      let finalLat = lat;
      let finalLng = lng;
      let finalLocationStatus =
        locationStatus !== "none" ? locationStatus : "detected";

      if (finalLat === null || finalLng === null) {
        // Always use Delhi NCR fallback if location not detected, even if address is empty,
        // because we never want to save lat: 0, lng: 0
        finalLat = 28.6139; // Fallback New Delhi
        finalLng = 77.209;
        finalLocationStatus = address.trim() !== "" ? "manual" : "fallback";
      }

      let uploadedImageUrl = "";
      if (image?.base64) {
        try {
          const { ref, uploadString, getDownloadURL } =
            await import("firebase/storage");
          const storageRef = ref(
            storage,
            `issues/${user.id}/${Date.now()}.jpg`,
          );
          // Note: image.base64 might contain data URL prefix, we need to handle that or upload the whole string
          // If it's a data_url:
          const isDataUrl = image.base64.startsWith("data:");
          const dataToUpload = isDataUrl
            ? image.base64
            : `data:${image.mimeType};base64,${image.base64}`;
          await uploadString(storageRef, dataToUpload, "data_url");
          uploadedImageUrl = await getDownloadURL(storageRef);
        } catch (storageErr) {
          console.error(
            "Storage upload failed, falling back to base64",
            storageErr,
          );
          // Check if base64 string is under a safe size for Firestore document (~800KB)
          if (image.base64.length < 800000) {
            addToast(
              "Image Storage fallback active. Using compressed preview for demo.",
              "info",
            );
            uploadedImageUrl = image.base64; // fallback
          } else {
            addToast(
              "Image too large and Storage failed. Please try a smaller image.",
              "error",
            );
            setIsSubmitting(false);
            return;
          }
        }
      }

      const newIssue = {
        title: manualMode
          ? description.split("\n")[0].substring(0, 40) || "Civic Issue"
          : analysisResult.title,
        description,
        imageUrl: uploadedImageUrl,
        category: analysisResult.category,
        severity: analysisResult.severity,
        confidence: manualMode ? 1 : analysisResult.confidence,
        location: { lat: finalLat, lng: finalLng },
        locationStatus: finalLocationStatus,
        address,
        locationType,
        suggestedDepartment: analysisResult.suggestedDepartment,
        citizenSummary: manualMode
          ? description
          : analysisResult.citizenSummary,
        authoritySummary: analysisResult.authoritySummary,
        riskReason: analysisResult.riskReason,
        spamRisk: analysisResult.spamRisk,
        verificationQuestion: analysisResult.verificationQuestion,
        recommendedAction: analysisResult.recommendedAction,
        status: "Reported",
        currentStatus: "Reported",
        priorityScore: score,
        priorityReasons: reasons,
        verificationCount: 0,
        disputeCount: 0,
        duplicateCount: 0,
        confirmedResolvedCount: 0,
        duplicateOf: null,
        createdBy: user.id,
        assignedTo: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const docRef = await addDoc(collection(db, "issues"), newIssue);

      // Add initial status update
      await addDoc(collection(db, "status_updates"), {
        issueId: docRef.id,
        status: "Reported",
        note: "Issue reported by citizen.",
        actorRole: user.role,
        updatedBy: user.id,
        createdAt: Date.now(),
      });

      await dispatcher.dispatch({
        type: "IssueReported",
        actorId: user.id,
        actorRole: user.role,
        affectedIssueId: docRef.id,
        priority:
          newIssue.priorityScore >= 81
            ? "Urgent"
            : newIssue.priorityScore >= 61
              ? "High"
              : newIssue.priorityScore >= 31
                ? "Medium"
                : "Low",
      });

      addToast("Issue reported successfully!", "success");
      navigate(`/issues/${docRef.id}`);
    } catch (error) {
      console.error(error);
      addToast("Failed to submit issue.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyDuplicate = async () => {
    if (!duplicateCandidate || !user) return;
    setIsSubmitting(true);
    try {
      const issueRef = doc(db, "issues", duplicateCandidate.id);
      const verificationsRef = collection(db, "verifications");

      await addDoc(verificationsRef, {
        issueId: duplicateCandidate.id,
        userId: user.id,
        type: "verify",
        createdAt: Date.now(),
      });

      const { score, reasons } = calculatePriorityScore({
        ...duplicateCandidate,
        verificationCount: (duplicateCandidate.verificationCount || 0) + 1,
      });

      await updateDoc(issueRef, {
        verificationCount: increment(1),
        priorityScore: score,
        priorityReasons: reasons,
      });

      await addDoc(collection(db, "status_updates"), {
        issueId: duplicateCandidate.id,
        status: duplicateCandidate.status,
        note: "Issue verified as duplicate report.",
        updatedBy: user.id,
        createdAt: Date.now(),
      });

      addToast("Verified existing issue.", "success");
      navigate(`/issues/${duplicateCandidate.id}`);
    } catch (e) {
      console.error(e);
      addToast("Failed to verify existing issue.", "error");
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <NeumorphicCard className="p-8 text-center max-w-md">
          <ShieldAlert className="h-12 w-12 text-[var(--color-civic-primary)] mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4 text-[var(--color-civic-text-primary)]">
            Sign In to Report
          </h2>
          <p className="text-[var(--color-civic-text-secondary)] font-medium mb-6">
            You need to be signed in to report a civic issue and earn
            contribution points.
          </p>
          <NeumorphicButton
            onClick={signInWithGoogle}
            variant="primary"
            className="w-full"
          >
            Sign In with Google
          </NeumorphicButton>
        </NeumorphicCard>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-3 bg-[var(--color-civic-surface-inset)] rounded-xl shadow-[var(--shadow-neumorphic-inset)] border border-transparent">
          <ShieldAlert className="h-6 w-6 text-[var(--color-civic-primary)]" />
        </div>
        <h1 className="text-3xl font-extrabold text-[var(--color-civic-text-primary)] tracking-tight">
          Report an Issue
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Input */}
        <div className="space-y-6">
          <NeumorphicCard className="p-6 space-y-6 border-t-4 border-t-[var(--color-civic-primary)]">
            <div>
              <label className="block text-sm font-bold text-[var(--color-civic-text-primary)] mb-2 uppercase tracking-widest">
                Photo Evidence
              </label>
              <ImageUploadDropzone
                onImageSelected={(b, m) => setImage({ base64: b, mimeType: m })}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[var(--color-civic-text-primary)] mb-2 uppercase tracking-widest">
                Description
              </label>
              <NeumorphicTextarea
                placeholder="What is the exact problem?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-[var(--color-civic-text-primary)] mb-2 uppercase tracking-widest">
                  Location
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-3.5 h-5 w-5 text-[var(--color-civic-text-muted)]" />
                    <NeumorphicInput
                      placeholder="E.g. Main St, near school"
                      className="pl-10"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>
                  <NeumorphicButton
                    variant="secondary"
                    className="shrink-0 px-4"
                    onClick={handleGetLocation}
                    disabled={isLocating}
                  >
                    {isLocating ? (
                      <BrainCircuit className="h-5 w-5 animate-spin text-[var(--color-civic-primary)]" />
                    ) : (
                      <Navigation className="h-5 w-5 text-[var(--color-civic-primary)]" />
                    )}
                    <span className="ml-2 hidden sm:inline">Detect</span>
                  </NeumorphicButton>
                </div>

                {(locationStatus !== "none" || address.trim() !== "") && (
                  <div
                    className={`mt-2 text-xs px-3 py-2 rounded-lg flex items-center gap-2 font-bold ${
                      locationStatus === "detected"
                        ? "bg-[var(--color-civic-status-confirmed)]/10 text-[var(--color-civic-status-confirmed)] border border-[var(--color-civic-status-confirmed)]/20"
                        : locationStatus === "fallback"
                          ? "bg-[var(--color-civic-priority-medium)]/10 text-[var(--color-civic-priority-medium)] border border-[var(--color-civic-priority-medium)]/20"
                          : "bg-[var(--color-civic-primary)]/10 text-[var(--color-civic-primary)] border border-[var(--color-civic-primary)]/20"
                    }`}
                  >
                    <Navigation className="h-3 w-3" />
                    {locationStatus === "detected"
                      ? "Precise location detected"
                      : locationStatus === "fallback"
                        ? "Using demo fallback location"
                        : "Manual address entered (will use demo fallback coordinates)"}
                    {lat && lng && locationStatus !== "none"
                      ? ` (${lat.toFixed(4)}, ${lng.toFixed(4)})`
                      : ""}
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-[var(--color-civic-text-primary)] mb-2 uppercase tracking-widest">
                  Location Type
                </label>
                <select
                  className="flex h-12 w-full rounded-xl bg-[var(--color-civic-surface-inset)] px-4 py-2 text-sm font-semibold text-[var(--color-civic-text-primary)] shadow-[var(--shadow-neumorphic-inset)] focus:outline-none focus:ring-2 focus:ring-[var(--color-civic-primary)]/50 transition-all border border-transparent appearance-none"
                  value={locationType}
                  onChange={(e) => setLocationType(e.target.value)}
                >
                  <option value="road">Road / Street</option>
                  <option value="school">Near School</option>
                  <option value="hospital">Near Hospital</option>
                  <option value="market">Market / Commercial</option>
                  <option value="residential">Residential Area</option>
                  <option value="park">Public Park</option>
                  <option value="bus stop">Transit Stop</option>
                  <option value="high-footfall area">High Footfall Area</option>
                </select>
              </div>
            </div>

            <NeumorphicButton
              className="w-full gap-2"
              variant="admin"
              onClick={handleAnalyze}
              disabled={isAnalyzing || (!description && !image)}
            >
              {isAnalyzing ? (
                <div className="animate-pulse flex items-center gap-2">
                  <BrainCircuit className="h-5 w-5 animate-spin" />
                  Analyzing with CivicVision AI...
                </div>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Analyze with AI
                </>
              )}
            </NeumorphicButton>
          </NeumorphicCard>
        </div>

        {/* Right Column: AI Analysis & Submit */}
        <div className="space-y-6">
          {aiDuplicates.length > 0 ? (
            <NeumorphicCard className="p-6 space-y-6 border-t-4 border-t-[var(--color-civic-priority-medium)] animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 pb-4 border-b border-[var(--color-civic-border)]/60">
                <div className="p-2.5 bg-[var(--color-civic-priority-medium)]/10 text-[var(--color-civic-priority-medium)] rounded-full border border-[var(--color-civic-priority-medium)]/20 shadow-sm">
                  <Copy className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-[var(--color-civic-text-primary)]">
                    Potential Duplicate{aiDuplicates.length > 1 ? "s" : ""}{" "}
                    Found
                  </h2>
                  <p className="text-sm text-[var(--color-civic-text-secondary)] font-medium">
                    Our AI detected {aiDuplicates.length} similar unresolved
                    issue{aiDuplicates.length > 1 ? "s" : ""} nearby.
                  </p>
                </div>
              </div>

              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                {aiDuplicates.map((dup) => (
                  <NeumorphicCardInset
                    key={dup.id}
                    className="p-4 rounded-xl border-transparent flex gap-4"
                  >
                    {dup.imageUrl ? (
                      <img
                        src={dup.imageUrl}
                        alt={dup.title}
                        className="w-20 h-20 rounded-lg object-cover bg-[var(--color-civic-surface-inset)] shadow-sm shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-[var(--color-civic-surface-inset)] flex items-center justify-center text-[var(--color-civic-text-muted)] shrink-0 shadow-sm">
                        <CameraOff className="h-6 w-6" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3
                          className="font-extrabold text-sm text-[var(--color-civic-text-primary)] truncate"
                          title={dup.title}
                        >
                          {dup.title}
                        </h3>
                        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-[var(--color-civic-surface)] text-[var(--color-civic-text-secondary)] shadow-sm border border-transparent shrink-0">
                          {dup.status}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--color-civic-text-muted)] line-clamp-2">
                        {dup.reasoning || dup.description}
                      </p>
                      <div className="pt-2 flex items-center justify-between">
                        <a
                          href={`/issues/${dup.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold text-[var(--color-civic-primary)] hover:underline flex items-center gap-1"
                        >
                          View this issue <ExternalLink className="h-3 w-3" />
                        </a>
                        <span className="text-xs font-bold text-amber-600">
                          Match: {Math.round(dup.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                  </NeumorphicCardInset>
                ))}
              </div>

              <p className="text-sm text-[var(--color-civic-text-secondary)] font-medium">
                To prevent duplicate reports, you can verify an existing issue
                instead of creating a new report. This merges community efforts
                and prioritizes resolving it faster!
              </p>

              <div className="flex flex-col gap-3 pt-2">
                <div className="flex gap-3">
                  <NeumorphicButton
                    className="flex-1 font-bold text-sm"
                    variant="primary"
                    onClick={() => {
                      navigate(`/issues/${aiDuplicates[0].id}`);
                    }}
                  >
                    This is the same — verify it instead
                  </NeumorphicButton>
                  <NeumorphicButton
                    className="flex-1 font-bold text-sm"
                    variant="secondary"
                    onClick={() => {
                      setAiDuplicates([]);
                      handleSubmit(true);
                    }}
                  >
                    This is a different issue — submit anyway
                  </NeumorphicButton>
                </div>
              </div>
            </NeumorphicCard>
          ) : !analysisResult ? (
            <NeumorphicCardInset
              className={`p-12 flex flex-col items-center justify-center text-center h-full min-h-[400px] border-dashed border-2 ${isAnalyzing ? "border-[var(--color-civic-admin)]" : "border-[var(--color-civic-border)] opacity-70"} transition-all`}
            >
              {isAnalyzing ? (
                <>
                  <div className="relative">
                    <BrainCircuit className="h-16 w-16 text-[var(--color-civic-admin)] mb-4 animate-pulse relative z-10" />
                    <div className="absolute inset-0 bg-[var(--color-civic-admin-soft)] blur-xl opacity-80 rounded-full animate-ping"></div>
                  </div>
                  <h3 className="text-xl font-bold text-[var(--color-civic-text-primary)] mb-2">
                    CivicVision AI is analyzing image evidence...
                  </h3>
                  <p className="text-sm text-[var(--color-civic-text-secondary)] font-medium max-w-sm animate-pulse">
                    Scanning image evidence, estimating severity, and
                    determining the responsible department.
                  </p>
                </>
              ) : (
                <>
                  <BrainCircuit className="h-16 w-16 text-[var(--color-civic-text-muted)] mb-4 opacity-50" />
                  <h3 className="text-xl font-bold text-[var(--color-civic-text-secondary)] mb-2">
                    Waiting for AI Analysis
                  </h3>
                  <p className="text-sm text-[var(--color-civic-text-muted)] font-medium max-w-sm">
                    Provide a photo and description, then click "Analyze with
                    AI" to generate a structured civic report.
                  </p>
                </>
              )}
            </NeumorphicCardInset>
          ) : (
            <NeumorphicCard className="p-6 space-y-6 animate-in fade-in zoom-in-95 border-t-4 border-t-[var(--color-civic-admin)]">
              <div className="flex items-center justify-between border-b border-[var(--color-civic-border)]/60 pb-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-[var(--color-civic-admin)] font-extrabold tracking-tight">
                    <CheckCircle2 className="h-5 w-5" />
                    AI Analysis Complete
                  </div>
                  {analysisResult.isFallback ? (
                    <span className="text-xs text-[var(--color-civic-priority-medium)] font-bold uppercase tracking-widest">
                      AI fallback mode active
                    </span>
                  ) : (
                    <span className="text-xs text-[var(--color-civic-text-muted)] font-bold uppercase tracking-widest">
                      Analyzed by CivicVision AI
                    </span>
                  )}
                </div>
                <div className="text-sm text-[var(--color-civic-text-secondary)] font-bold flex items-center gap-2 uppercase tracking-widest">
                  <span>Confidence:</span>
                  <div className="w-24 h-2 bg-[var(--color-civic-surface-inset)] rounded-full overflow-hidden shadow-[var(--shadow-neumorphic-inset)]">
                    <div
                      className={`h-full ${analysisResult.confidence >= 0.8 ? "bg-[var(--color-civic-status-confirmed)]" : analysisResult.confidence >= 0.6 ? "bg-[var(--color-civic-priority-medium)]" : "bg-[var(--color-civic-danger)]"}`}
                      style={{
                        width: `${Math.round(analysisResult.confidence * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="font-black text-[var(--color-civic-text-primary)]">
                    {(analysisResult.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-[var(--color-civic-text-primary)] leading-tight mb-3">
                    {analysisResult.title}
                  </h2>

                  {analysisResult.confidence < 0.55 && !manualMode && (
                    <div className="mb-4 bg-[var(--color-civic-priority-medium)]/10 border border-[var(--color-civic-priority-medium)]/30 text-[var(--color-civic-priority-medium)] px-3 py-2 rounded-lg text-sm font-bold flex items-start gap-2 shadow-sm">
                      <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" />
                      <p>
                        AI confidence is low. Please review and adjust the
                        category or severity before submitting.
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <select
                      className="text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full bg-[var(--color-civic-primary-soft)] text-[var(--color-civic-primary)] border border-transparent focus:outline-none appearance-none cursor-pointer shadow-sm"
                      value={analysisResult.category}
                      onChange={(e) =>
                        setAnalysisResult({
                          ...analysisResult,
                          category: e.target.value,
                        })
                      }
                    >
                      <option value="Pothole">Pothole</option>
                      <option value="Garbage Overflow">Garbage Overflow</option>
                      <option value="Water Leakage">Water Leakage</option>
                      <option value="Broken Streetlight">
                        Broken Streetlight
                      </option>
                      <option value="Sewage Issue">Sewage Issue</option>
                      <option value="Road Blockage">Road Blockage</option>
                      <option value="Damaged Infrastructure">
                        Damaged Infrastructure
                      </option>
                      <option value="Unsafe Public Area">
                        Unsafe Public Area
                      </option>
                      <option value="Other">Other</option>
                    </select>

                    <select
                      className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full border border-transparent focus:outline-none appearance-none cursor-pointer shadow-sm ${
                        analysisResult.severity === "Critical" ||
                        analysisResult.severity === "High"
                          ? "bg-[var(--color-civic-danger)]/10 text-[var(--color-civic-danger)]"
                          : analysisResult.severity === "Medium"
                            ? "bg-[var(--color-civic-priority-medium)]/10 text-[var(--color-civic-priority-medium)]"
                            : "bg-[var(--color-civic-surface-inset)] text-[var(--color-civic-text-secondary)] shadow-[var(--shadow-neumorphic-inset)]"
                      }`}
                      value={analysisResult.severity}
                      onChange={(e) =>
                        setAnalysisResult({
                          ...analysisResult,
                          severity: e.target.value,
                        })
                      }
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>

                    <NeumorphicBadge variant="department">
                      {analysisResult.suggestedDepartment}
                    </NeumorphicBadge>
                  </div>
                </div>

                <NeumorphicCardInset className="p-4 rounded-xl border-transparent">
                  <p className="text-sm font-medium text-[var(--color-civic-text-secondary)] italic">
                    "{analysisResult.citizenSummary}"
                  </p>
                </NeumorphicCardInset>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="font-bold text-[var(--color-civic-text-muted)] uppercase tracking-widest">
                      Risk Reason:
                    </span>
                    <span className="text-[var(--color-civic-text-primary)] font-medium text-right max-w-[60%]">
                      {analysisResult.riskReason}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-bold text-[var(--color-civic-text-muted)] uppercase tracking-widest">
                      Recommended Action:
                    </span>
                    <span className="text-[var(--color-civic-text-primary)] font-medium text-right max-w-[60%]">
                      {analysisResult.recommendedAction}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-bold text-[var(--color-civic-text-muted)] uppercase tracking-widest">
                      Spam Risk:
                    </span>
                    <span
                      className={`text-right font-bold ${analysisResult.spamRisk === "High" ? "text-[var(--color-civic-danger)]" : "text-[var(--color-civic-text-primary)]"}`}
                    >
                      {analysisResult.spamRisk}
                    </span>
                  </div>
                </div>

                {analysisResult.spamRisk === "High" && (
                  <div className="bg-[var(--color-civic-danger)]/10 p-3 rounded-lg border border-[var(--color-civic-danger)]/30">
                    <label className="flex items-start gap-2 text-sm text-[var(--color-civic-danger)] font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={spamConfirmed}
                        onChange={(e) => setSpamConfirmed(e.target.checked)}
                      />
                      <span>
                        This report was flagged as High spam risk. I confirm
                        this is a real and valid civic issue.
                      </span>
                    </label>
                  </div>
                )}

                <div className="pt-4 border-t border-[var(--color-civic-border)]/60">
                  <p className="text-xs text-[var(--color-civic-text-muted)] font-bold mb-1 uppercase tracking-widest">
                    Verification Question
                  </p>
                  <p className="text-sm text-[var(--color-civic-text-primary)] font-bold">
                    {analysisResult.verificationQuestion}
                  </p>
                </div>

                <div className="bg-gradient-to-r from-[var(--color-civic-primary-soft)] to-transparent p-4 rounded-xl border border-[var(--color-civic-primary)]/20 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-black uppercase tracking-widest text-[var(--color-civic-primary)]">
                      Priority Preview
                    </p>
                    <p className="text-sm font-medium text-[var(--color-civic-text-secondary)]">
                      Estimated initial impact score
                    </p>
                  </div>
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--color-civic-surface)] shadow-[var(--shadow-neumorphic)] font-black text-[var(--color-civic-primary)] text-lg">
                    {
                      calculatePriorityScore({
                        severity: analysisResult.severity,
                        locationType: locationType,
                        spamRisk: analysisResult.spamRisk,
                        verificationCount: 0,
                        duplicateCount: 0,
                        status: "Reported",
                        currentStatus: "Reported",
                      }).score
                    }
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-sm text-[var(--color-civic-text-muted)] font-medium italic mb-3">
                    Please review the details above before submitting.
                  </p>
                  <NeumorphicButton
                    className="w-full gap-2"
                    variant="primary"
                    onClick={() => handleSubmit()}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      "Submitting..."
                    ) : (
                      <>
                        Submit Civic Report <ArrowRight className="h-5 w-5" />
                      </>
                    )}
                  </NeumorphicButton>
                </div>
              </div>
            </NeumorphicCard>
          )}
        </div>
      </div>

      <AnimatePresence>
        {duplicateCandidate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg"
            >
              <NeumorphicCard className="p-6 sm:p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-civic-priority-medium)] rounded-full blur-3xl -mr-16 -mt-16 opacity-30 pointer-events-none"></div>

                <div className="flex items-center gap-3 mb-6 relative z-10">
                  <div className="p-2.5 bg-[var(--color-civic-priority-medium)]/10 text-[var(--color-civic-priority-medium)] rounded-full border border-[var(--color-civic-priority-medium)]/20 shadow-sm">
                    <Copy className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-[var(--color-civic-text-primary)]">
                      Possible duplicate found
                    </h2>
                    <p className="text-sm text-[var(--color-civic-text-secondary)] font-medium">
                      A similar issue already exists nearby.
                    </p>
                  </div>
                </div>

                <NeumorphicCardInset className="rounded-xl p-5 mb-6 relative z-10 border-transparent">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-[var(--color-civic-text-primary)] leading-tight">
                      {duplicateCandidate.title}
                    </h3>
                    <NeumorphicBadge variant="info" className="shrink-0 ml-2">
                      {duplicateCandidate.category}
                    </NeumorphicBadge>
                  </div>

                  <div className="space-y-2 text-sm text-[var(--color-civic-text-secondary)] font-medium">
                    <div className="flex justify-between">
                      <span className="font-bold text-[var(--color-civic-text-muted)] uppercase tracking-widest text-xs mt-0.5">
                        Status:
                      </span>
                      <span className="font-bold text-[var(--color-civic-text-primary)]">
                        {duplicateCandidate.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold text-[var(--color-civic-text-muted)] uppercase tracking-widest text-xs mt-0.5">
                        Location:
                      </span>
                      <span
                        className="text-[var(--color-civic-text-primary)] text-right max-w-[65%] truncate"
                        title={duplicateCandidate.address}
                      >
                        {duplicateCandidate.address}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-[var(--color-civic-border)]/60 mt-2">
                      <div className="flex items-center gap-1.5 text-[var(--color-civic-primary)]">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="font-bold">
                          {duplicateCandidate.verificationCount} verifications
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-[var(--color-civic-text-muted)] uppercase text-xs tracking-widest">
                          Priority
                        </span>
                        <span
                          className={`font-black ${duplicateCandidate.priorityScore >= 81 ? "text-[var(--color-civic-danger)]" : "text-[var(--color-civic-priority-medium)]"}`}
                        >
                          {duplicateCandidate.priorityScore}
                        </span>
                      </div>
                    </div>
                  </div>
                </NeumorphicCardInset>

                <p className="text-sm text-[var(--color-civic-text-secondary)] font-medium mb-6 relative z-10">
                  You can verify the existing issue instead of creating a
                  duplicate report. This helps prioritize the problem faster!
                </p>

                <div className="flex flex-col sm:flex-row gap-3 relative z-10">
                  <NeumorphicButton
                    className="flex-1 font-bold"
                    variant="primary"
                    onClick={handleVerifyDuplicate}
                    disabled={isSubmitting}
                  >
                    Verify existing issue
                  </NeumorphicButton>
                  <NeumorphicButton
                    className="flex-1 font-bold"
                    variant="secondary"
                    onClick={() => {
                      setDuplicateCandidate(null);
                      handleSubmit(true);
                    }}
                    disabled={isSubmitting}
                  >
                    Submit as new issue
                  </NeumorphicButton>
                </div>
              </NeumorphicCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
