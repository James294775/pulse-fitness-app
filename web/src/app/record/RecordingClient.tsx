"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ActivityMap } from "@/components/ActivityMap";
import { createLiveActivityAction } from "@/lib/actions/activity-actions";
import { buildTrack, computeTrackStats } from "@/lib/geo";
import { formatDuration, formatPace, formatSpeed, isPaceSport } from "@/lib/units";
import { sportLabels, sportTypes } from "@/lib/validation";
import type { RawPoint } from "@/lib/track";
import type { SportType } from "@/generated/prisma/client";

type Status = "idle" | "recording" | "paused" | "finishing";

export function RecordingClient({ defaultSport }: { defaultSport: SportType }) {
  const router = useRouter();
  const [sportType, setSportType] = useState<SportType>(defaultSport);
  const [status, setStatus] = useState<Status>("idle");
  const [points, setPoints] = useState<RawPoint[]>([]);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeMsRef = useRef(0);
  const activeStartRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  function startWatch() {
    if (!("geolocation" in navigator)) {
      setGeoError("This browser doesn't support GPS.");
      return;
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setPoints((prev) => [
          ...prev,
          {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            // Altitude is frequently unavailable from the Geolocation API
            // (no barometric sensor / desktop browsers) — falls back to 0,
            // which understates elevation gain for those recordings.
            ele: pos.coords.altitude ?? 0,
            t: pos.timestamp,
          },
        ]);
      },
      (err) => setGeoError(err.message),
      { enableHighAccuracy: true, maximumAge: 1000 }
    );
  }

  function startTicking() {
    activeStartRef.current = Date.now();
    tickRef.current = setInterval(() => {
      const active = activeStartRef.current ? Date.now() - activeStartRef.current : 0;
      setElapsedMs(activeMsRef.current + active);
    }, 1000);
  }

  function stopTicking() {
    if (tickRef.current) clearInterval(tickRef.current);
    if (activeStartRef.current) {
      activeMsRef.current += Date.now() - activeStartRef.current;
      activeStartRef.current = null;
    }
  }

  function handleStart() {
    setGeoError(null);
    setStatus("recording");
    startWatch();
    startTicking();
  }

  function handleTogglePause() {
    if (status === "recording") {
      stopTicking();
      setStatus("paused");
    } else if (status === "paused") {
      startTicking();
      setStatus("recording");
    }
  }

  async function handleFinish() {
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    stopTicking();
    setStatus("finishing");
    setSaveError(null);

    const result = await createLiveActivityAction({
      sportType,
      title: `${sportLabels[sportType]} activity`,
      privacy: "everyone",
      points,
    });

    if ("error" in result) {
      setSaveError(result.error);
      setStatus("paused");
      return;
    }
    router.push(`/activities/${result.id}`);
  }

  const track = buildTrack(points);
  const stats = computeTrackStats(track);
  const pace = isPaceSport(sportType);

  return (
    <div className="relative flex flex-1 flex-col pb-[84px]">
      <ActivityMap
        points={track.map((p) => ({ lat: p.lat, lng: p.lng }))}
        live
        className="absolute inset-0"
      />

      <div className="relative flex items-center gap-1 p-5">
        <div className="flex items-center gap-1.5 rounded border border-accent bg-accent-wash px-1.5 py-0.5">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          <span className="text-[10px] tracking-[0.12em] text-[var(--color-accent-bright)]">GPS</span>
        </div>
        {geoError && <span className="ml-2 text-[11px] text-red-400">{geoError}</span>}
      </div>

      {status === "idle" && (
        <div className="relative mx-5 flex overflow-hidden rounded border border-border">
          {sportTypes.map((s) => (
            <button
              key={s}
              onClick={() => setSportType(s)}
              className={`flex-1 py-2.5 text-[11px] font-semibold tracking-[0.1em] ${
                s === sportType ? "bg-accent text-accent-ink" : "bg-surface text-secondary"
              }`}
            >
              {sportLabels[s].toUpperCase()}
            </button>
          ))}
        </div>
      )}

      <div className="relative mt-auto bg-bg/95 backdrop-blur">
        <div className="border-t border-border-strong px-5 pb-4 pt-5">
          <div className="text-[10px] tracking-[0.18em] text-secondary">ELAPSED</div>
          <div className="tabular text-[56px] font-bold leading-[0.86] tracking-tight">
            {formatDuration(elapsedMs / 1000)}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-px border-t border-border bg-border">
          <div className="bg-surface p-3.5">
            <div className="text-[10px] tracking-[0.14em] text-secondary">DISTANCE</div>
            <div className="tabular mt-1.5 text-[22px] font-semibold">
              {(stats.distanceM / 1000).toFixed(2)}
              <span className="ml-1 text-xs font-medium text-secondary">km</span>
            </div>
          </div>
          <div className="bg-surface p-3.5">
            <div className="text-[10px] tracking-[0.14em] text-secondary">{pace ? "PACE" : "SPEED"}</div>
            <div className="tabular mt-1.5 text-[22px] font-semibold text-[var(--color-accent-bright)]">
              {pace ? formatPace(stats.distanceM, stats.movingTimeSec, "metric") : formatSpeed(stats.distanceM, stats.movingTimeSec, "metric")}
            </div>
          </div>
          <div className="bg-surface p-3.5">
            <div className="text-[10px] tracking-[0.14em] text-secondary">ELEV GAIN</div>
            <div className="tabular mt-1.5 text-[22px] font-semibold">
              {Math.round(stats.elevationGainM)}
              <span className="ml-1 text-xs font-medium text-secondary">m</span>
            </div>
          </div>
        </div>
        {saveError && <p className="px-5 pt-3 text-xs text-red-400">{saveError}</p>}
        <div className="flex gap-2.5 px-5 py-4">
          {status === "idle" ? (
            <button
              onClick={handleStart}
              className="flex-1 rounded bg-accent py-5 text-[17px] font-bold tracking-[0.1em] text-accent-ink"
            >
              START
            </button>
          ) : (
            <>
              <button
                onClick={handleTogglePause}
                disabled={status === "finishing"}
                className="flex-1 rounded bg-accent py-5 text-[17px] font-bold tracking-[0.1em] text-accent-ink disabled:opacity-60"
              >
                {status === "recording" ? "PAUSE" : status === "finishing" ? "SAVING…" : "RESUME"}
              </button>
              <button
                onClick={handleFinish}
                disabled={status === "finishing"}
                className="w-20 rounded border border-border-strong text-[11px] font-semibold tracking-[0.1em] text-tertiary disabled:opacity-60"
              >
                FINISH
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
