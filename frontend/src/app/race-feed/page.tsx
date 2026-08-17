import type { Metadata } from 'next';
import RaceFeedPage from '@/components/live/RaceFeedPage';
import '@/components/live/trackStyles.css';

export const metadata: Metadata = {
  title: 'Live Race Feed | F1 Live — Real-Time Race Dashboard',
  description:
    'Follow Formula 1 races in real-time with live timing, track visualization, pit strategies, win probabilities, and team radio highlights. Pre-race qualifying summaries and post-race podium showcase.',
  keywords:
    'F1 live race, formula 1 timing, race feed, pit strategy, win probability, qualifying results',
};

export default function RaceFeedRoute() {
  return <RaceFeedPage />;
}
