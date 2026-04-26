export function formatCountdown(targetDate: Date): { days: number; hours: number; minutes: number; seconds: number } {
  const now = new Date().getTime();
  const distance = targetDate.getTime() - now;
  
  if (distance < 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

  return {
    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
    hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((distance % (1000 * 60)) / 1000),
  };
}

export function getTeamColor(teamName: string): string {
  const colors: Record<string, string> = {
    'Red Bull Racing': '#3671C6',
    'McLaren': '#FF8000',
    'Ferrari': '#E8002D',
    'Mercedes': '#27F4D2',
    'Aston Martin': '#229971',
    'Alpine': '#FF87BC',
    'Haas F1 Team': '#B6BABD',
    'Racing Bulls': '#6692FF',
    'Kick Sauber': '#52E252',
    'Williams': '#64C4FF',
  };
  return colors[teamName] || '#666666';
}

export function getTireColor(tire: string): string {
  const colors: Record<string, string> = {
    soft: '#FF3333',
    medium: '#FFC300',
    hard: '#FFFFFF',
    intermediate: '#43B02A',
    wet: '#0072C6',
  };
  return colors[tire] || '#FFFFFF';
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
