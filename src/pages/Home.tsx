import React from "react";
import { Link } from "react-router-dom";
import { NeumorphicCard } from "../components/ui/card";
import { NeumorphicButton } from "../components/ui/button";
import {
  ShieldAlert,
  Users,
  TrendingUp,
  Map as MapIcon,
  ArrowRight,
  Activity,
  AlertTriangle,
  PlusCircle,
} from "lucide-react";
import { NeumorphicBadge } from "../components/ui/badge";
import { motion } from "motion/react";

export function Home() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="flex flex-col items-center justify-center min-h-[85vh] py-12"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full max-w-6xl mb-24">
        {/* Left Side: Text and CTAs */}
        <div className="space-y-6 text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <NeumorphicBadge variant="info" className="mb-2">
              ✨ AI-powered civic action
            </NeumorphicBadge>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-800 tracking-tight leading-tight"
          >
            Turn local problems into{" "}
            <span className="text-blue-600">community action.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg md:text-xl text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed"
          >
            Report civic issues with image evidence, let AI prioritize them, and
            track transparent resolution with your community.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-500 mb-8"
          >
            <span className="text-blue-600">Report</span>
            <ArrowRight className="h-4 w-4" />
            <span className="text-purple-600">AI Review</span>
            <ArrowRight className="h-4 w-4" />
            <span className="text-amber-600">Community Verify</span>
            <ArrowRight className="h-4 w-4" />
            <span className="text-green-600">Resolve</span>
            <ArrowRight className="h-4 w-4" />
            <span className="text-emerald-600">Confirm Impact</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4"
          >
            <Link to="/report">
              <NeumorphicButton
                size="lg"
                variant="primary"
                className="gap-2 w-full sm:w-auto hover:-translate-y-1 transition-transform"
              >
                <PlusCircle className="h-5 w-5" />
                Report an Issue
              </NeumorphicButton>
            </Link>
            <NeumorphicButton
              size="lg"
              className="gap-2 w-full sm:w-auto hover:-translate-y-1 transition-transform bg-amber-500 text-white hover:bg-amber-600 shadow-[4px_4px_8px_#b8bec5,-4px_-4px_8px_#ffffff]"
              onClick={() => {
                // The user can click "Start 3-minute demo" which can just fire the demo guide if it's there
                window.dispatchEvent(new CustomEvent("start-demo"));
              }}
            >
              <Activity className="h-5 w-5" />
              Start 3-Minute Demo
            </NeumorphicButton>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex items-center gap-4 text-sm font-medium text-slate-500 pt-6 justify-center lg:justify-start"
          >
            <span className="flex items-center gap-1">
              <ShieldAlert className="h-4 w-4" /> AI-powered
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" /> Community verified
            </span>
            <span className="flex items-center gap-1">
              <Activity className="h-4 w-4" /> Transparent tracking
            </span>
          </motion.div>
        </div>

        {/* Right Side: Hero Mock Card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full max-w-md mx-auto lg:ml-auto"
        >
          <NeumorphicCard className="p-8 relative overflow-hidden transform hover:-translate-y-2 transition-all duration-500 hover:shadow-[12px_12px_24px_#b8bec5,-12px_-12px_24px_#ffffff]">
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-100 rounded-full blur-3xl -mr-20 -mt-20 opacity-60 pointer-events-none"></div>
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div>
                <h3 className="font-bold text-xl text-slate-800">
                  Dangerous Pothole
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Main Street, Sector 4
                </p>
              </div>
              <NeumorphicBadge variant="danger" className="text-sm px-3 py-1">
                High Risk
              </NeumorphicBadge>
            </div>

            <div className="space-y-5 relative z-10">
              <div className="flex items-center gap-4 text-sm text-slate-700 bg-white/40 p-3 rounded-xl">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <span className="font-medium">
                  Category: <span className="font-bold">Pothole</span>
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-700 bg-white/40 p-3 rounded-xl">
                <Users className="h-5 w-5 text-blue-500" />
                <span className="font-medium">
                  <span className="font-bold text-blue-600">18 citizens</span>{" "}
                  verified
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-700 bg-white/40 p-3 rounded-xl border border-green-200/50">
                <Activity className="h-5 w-5 text-green-500" />
                <span className="font-medium">
                  Status:{" "}
                  <span className="font-bold text-green-600">In Progress</span>
                </span>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-200/50 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-[#e9eef5] shadow-[inset_3px_3px_6px_#b8bec5,inset_-3px_-3px_6px_#ffffff] flex items-center justify-center border-2 border-red-100">
                  <span className="text-xl font-black text-red-500">87</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">
                    Priority Score
                  </span>
                  <span className="text-sm font-medium text-slate-700">
                    Urgent Action
                  </span>
                </div>
              </div>
            </div>
          </NeumorphicCard>
        </motion.div>
      </div>

      {/* Feature Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <FeatureCard
            icon={ShieldAlert}
            title="AI Issue Detection"
            description="Upload a photo and let our Gemini-powered AI analyze severity, category, and department."
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <FeatureCard
            icon={Users}
            title="Community Verification"
            description="Citizens verify local problems to ensure authentic reporting and prevent spam."
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <FeatureCard
            icon={Activity}
            title="Transparent Tracking"
            description="Track the exact status of your reports from Open to Confirmed Resolved."
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <FeatureCard
            icon={TrendingUp}
            title="Civic Impact Dashboard"
            description="See insights on local problem hotspots and department resolution times."
          />
        </motion.div>
      </div>
    </motion.div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: any;
  title: string;
  description: string;
}) {
  return (
    <NeumorphicCard className="p-6 flex flex-col items-start gap-4 h-full hover:-translate-y-1 transition-transform">
      <div className="p-3 bg-[#e9eef5] rounded-xl shadow-[inset_2px_2px_4px_#b8bec5,inset_-2px_-2px_4px_#ffffff]">
        <Icon className="h-6 w-6 text-blue-600" />
      </div>
      <h3 className="font-bold text-lg text-slate-800">{title}</h3>
      <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
    </NeumorphicCard>
  );
}
