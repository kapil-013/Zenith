import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { NeumorphicCard } from "./ui/card";
import { NeumorphicButton } from "./ui/button";
import { Info, X, ChevronRight, CheckCircle2, Database } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { seedDemoData } from "../lib/seed";
import { useToast } from "../context/ToastContext";

const DEMO_STEPS = [
  {
    path: "/",
    message:
      "Step 1: Welcome! Let's start by reporting a civic issue. Click 'Report an Issue'.",
    nextPath: "/report",
    actionText: "Go to Report",
  },
  {
    path: "/report",
    message:
      "Steps 2 & 3: Upload an image, click 'Analyze with AI', review the AI's assessment, and then Submit your report.",
    nextPath: "/issues",
    actionText: "Go to Issues Map",
  },
  {
    path: "/issues",
    message:
      "Step 4: The issue is now live. Click on any issue card to view its details and verify it.",
    nextPath: null,
    actionText: "",
  },
  {
    path: "/issues/",
    message:
      "Steps 4 & 7: As a citizen, Verify the issue to boost its priority, or Confirm Resolution if it's fixed. Let's see the admin view next.",
    nextPath: "/admin",
    actionText: "Go to Admin Dashboard",
  },
  {
    path: "/admin",
    message:
      "Steps 5 & 6: Admins manage issues here. Change an issue's status to 'Resolved'.",
    nextPath: "/impact",
    actionText: "Go to Impact Dashboard",
  },
  {
    path: "/impact",
    message:
      "Step 8: View the overall civic impact, trends, and AI-generated insights. Demo complete!",
    nextPath: "/",
    actionText: "Restart Demo",
  },
];

export function DemoGuide() {
  const [isOpen, setIsOpen] = useState(true);
  const [minimized, setMinimized] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => {
    const handleStartDemo = () => {
      setIsOpen(true);
      setMinimized(false);
    };
    window.addEventListener("start-demo", handleStartDemo);
    return () => {
      window.removeEventListener("start-demo", handleStartDemo);
    };
  }, []);

  if (!isOpen) return null;

  // Find current step
  const currentStepIndex = DEMO_STEPS.findIndex((step) =>
    step.path === "/issues/"
      ? location.pathname.startsWith("/issues/") &&
        location.pathname !== "/issues"
      : location.pathname === step.path,
  );

  const step = currentStepIndex !== -1 ? DEMO_STEPS[currentStepIndex] : null;

  if (!step) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9, y: 50 }}
        className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-[100] w-72 sm:w-80"
      >
        <NeumorphicCard className="p-0 overflow-hidden shadow-[12px_12px_24px_rgba(0,0,0,0.1),-12px_-12px_24px_rgba(255,255,255,0.8)] border border-blue-100/50 bg-white/80 backdrop-blur-xl">
          <div className="flex items-center justify-between p-3 border-b border-blue-100/50 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-2 text-blue-600 font-bold text-sm">
              <Info className="h-4 w-4" />
              <span>Hackathon Demo Guide</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setMinimized(!minimized)}
                className="text-slate-400 hover:text-blue-500 transition-colors"
              >
                {minimized ? (
                  <ChevronRight className="h-4 w-4 rotate-90" />
                ) : (
                  <ChevronRight className="h-4 w-4 -rotate-90" />
                )}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-red-500 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <AnimatePresence>
            {!minimized && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 space-y-4">
                  <div className="flex gap-3">
                    <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {currentStepIndex + 1}
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed font-medium">
                      {step.message}
                    </p>
                  </div>

                  {step.nextPath && (
                    <NeumorphicButton
                      size="sm"
                      variant="primary"
                      className="w-full text-xs font-bold mt-2 hover:-translate-y-0.5 transition-transform"
                      onClick={() => navigate(step.nextPath as string)}
                    >
                      {step.actionText}{" "}
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </NeumorphicButton>
                  )}

                  {import.meta.env.DEV && (
                    <NeumorphicButton
                      size="sm"
                      variant="ghost"
                      className="w-full text-xs font-bold mt-2 hover:-translate-y-0.5 transition-transform text-slate-500 hover:text-slate-700 bg-slate-100/50"
                      onClick={async () => {
                        try {
                          await seedDemoData();
                          addToast("Seed data added!", "success");
                        } catch (e) {
                          addToast("Failed to add seed data", "error");
                        }
                      }}
                    >
                      <Database className="h-3 w-3 mr-1 inline" /> Seed Demo
                      Data
                    </NeumorphicButton>
                  )}

                  <div className="flex gap-1 justify-center pt-2">
                    {DEMO_STEPS.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 rounded-full transition-all ${i === currentStepIndex ? "w-4 bg-blue-500" : i < currentStepIndex ? "w-2 bg-green-400" : "w-2 bg-slate-200"}`}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </NeumorphicCard>
      </motion.div>
    </AnimatePresence>
  );
}
