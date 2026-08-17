'use client';

import { LivePosition, EnhancedRaceEvent, WeatherCondition } from '@/types';
import TrackRenderer from './TrackRenderer';
import RaceHeader from './RaceHeader';
import EnhancedLeaderboard from './EnhancedLeaderboard';
import WinProbabilityWidget from './WinProbabilityWidget';
import LiveEventFeed from './LiveEventFeed';

interface LiveRaceViewProps {
  trackId: string;
  currentLap: number;
  totalLaps: number;
  status: string;
  weather: WeatherCondition;
  positions: LivePosition[];
  fastestLap: { driverId: string; time: string } | null;
  previousPositions: Record<string, number>;
  events: EnhancedRaceEvent[];
  isConnected: boolean;
  onStart: () => void;
  onStop: () => void;
  onBack: () => void;
}

export default function LiveRaceView({
  trackId,
  currentLap,
  totalLaps,
  status,
  weather,
  positions,
  fastestLap,
  previousPositions,
  events,
  isConnected,
  onStart,
  onStop,
  onBack,
}: LiveRaceViewProps) {
  return (
    <div className="space-y-4">
      {/* Race Header */}
      <RaceHeader
        trackId={trackId}
        currentLap={currentLap}
        totalLaps={totalLaps}
        status={status}
        weather={weather}
        fastestLap={fastestLap}
        isConnected={isConnected}
        onStart={onStart}
        onStop={onStop}
        onBack={onBack}
      />

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 race-feed-dashboard">
        {/* Left Column: Track Map + Win Probability */}
        <div className="lg:col-span-5 space-y-4">
          {/* Track Map */}
          <div className="aspect-square lg:aspect-[4/3]">
            <TrackRenderer
              trackId={trackId}
              positions={positions}
              weather={weather}
              status={status}
              className="w-full h-full"
            />
          </div>

          {/* Win Probability */}
          <WinProbabilityWidget
            positions={positions}
            currentLap={currentLap}
            totalLaps={totalLaps}
          />
        </div>

        {/* Center Column: Enhanced Leaderboard */}
        <div className="lg:col-span-4 min-h-[400px] lg:min-h-0" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          <EnhancedLeaderboard
            positions={positions}
            fastestLap={fastestLap}
            previousPositions={previousPositions}
          />
        </div>

        {/* Right Column: Event Feed */}
        <div className="lg:col-span-3 min-h-[300px] lg:min-h-0" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          <LiveEventFeed events={events} />
        </div>
      </div>
    </div>
  );
}
