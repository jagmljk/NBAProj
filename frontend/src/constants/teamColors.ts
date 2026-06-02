export interface TeamColors {
  primary: string;
  secondary: string;
  accent: string;
}

export const teamColors: Record<string, TeamColors> = {
  'Los Angeles Lakers': {
    primary: '#552583',
    secondary: '#FDB927',
    accent: '#000000'
  },
  'Boston Celtics': {
    primary: '#007A33',
    secondary: '#BA9653',
    accent: '#FFFFFF'
  },
  'Golden State Warriors': {
    primary: '#1D428A',
    secondary: '#FFC72C',
    accent: '#FFFFFF'
  },
  'Chicago Bulls': {
    primary: '#CE1141',
    secondary: '#000000',
    accent: '#FFFFFF'
  },
  'Miami Heat': {
    primary: '#98002E',
    secondary: '#F9A01B',
    accent: '#000000'
  },
  'Brooklyn Nets': {
    primary: '#000000',
    secondary: '#FFFFFF',
    accent: '#777D84'
  },
  'New York Knicks': {
    primary: '#006BB6',
    secondary: '#F58426',
    accent: '#FFFFFF'
  },
  'Philadelphia 76ers': {
    primary: '#006BB6',
    secondary: '#ED174C',
    accent: '#FFFFFF'
  },
  'Toronto Raptors': {
    primary: '#CE1141',
    secondary: '#000000',
    accent: '#A1A1A4'
  },
  'Milwaukee Bucks': {
    primary: '#00471B',
    secondary: '#EEE1C6',
    accent: '#0077C0'
  },
  'Cleveland Cavaliers': {
    primary: '#860038',
    secondary: '#FDBB30',
    accent: '#041E42'
  },
  'Indiana Pacers': {
    primary: '#002D62',
    secondary: '#FDBB30',
    accent: '#BEC0C2'
  },
  'Detroit Pistons': {
    primary: '#C8102E',
    secondary: '#1D42BA',
    accent: '#BEC0C2'
  },
  'Atlanta Hawks': {
    primary: '#E03A3E',
    secondary: '#C1D32F',
    accent: '#26282A'
  },
  'Charlotte Hornets': {
    primary: '#1D1160',
    secondary: '#00788C',
    accent: '#A1A1A4'
  },
  'Washington Wizards': {
    primary: '#002B5C',
    secondary: '#E31837',
    accent: '#C4CED4'
  },
  'Orlando Magic': {
    primary: '#0077C0',
    secondary: '#C4CED4',
    accent: '#000000'
  },
  'Dallas Mavericks': {
    primary: '#00538C',
    secondary: '#002F5F',
    accent: '#B8C4CA'
  },
  'Houston Rockets': {
    primary: '#CE1141',
    secondary: '#000000',
    accent: '#C4CED4'
  },
  'Memphis Grizzlies': {
    primary: '#5D76A9',
    secondary: '#12173F',
    accent: '#F5B112'
  },
  'New Orleans Pelicans': {
    primary: '#0C2340',
    secondary: '#C8102E',
    accent: '#85714D'
  },
  'San Antonio Spurs': {
    primary: '#C4CED4',
    secondary: '#000000',
    accent: '#FFFFFF'
  },
  'Denver Nuggets': {
    primary: '#0E2240',
    secondary: '#FEC524',
    accent: '#8B2131'
  },
  'Minnesota Timberwolves': {
    primary: '#0C2340',
    secondary: '#236192',
    accent: '#9EA2A2'
  },
  'Oklahoma City Thunder': {
    primary: '#007AC1',
    secondary: '#EF3B24',
    accent: '#002D62'
  },
  'Portland Trail Blazers': {
    primary: '#E03A3E',
    secondary: '#000000',
    accent: '#FFFFFF'
  },
  'Utah Jazz': {
    primary: '#002B5C',
    secondary: '#F9A01B',
    accent: '#00471B'
  },
  'Phoenix Suns': {
    primary: '#1D1160',
    secondary: '#E56020',
    accent: '#000000'
  },
  'LA Clippers': {
    primary: '#C8102E',
    secondary: '#1D428A',
    accent: '#BEC0C2'
  },
  'Sacramento Kings': {
    primary: '#5A2D81',
    secondary: '#63727A',
    accent: '#000000'
  }
};

export const getTeamColors = (teamName: string): TeamColors => {
  // Try exact match first
  if (teamColors[teamName]) {
    return teamColors[teamName];
  }

  // Try partial match (in case of slight name differences)
  const partialMatch = Object.keys(teamColors).find(key =>
    key.toLowerCase().includes(teamName.toLowerCase()) ||
    teamName.toLowerCase().includes(key.toLowerCase())
  );

  if (partialMatch) {
    return teamColors[partialMatch];
  }

  // Default colors if no match
  return {
    primary: '#F97316',
    secondary: '#3B82F6',
    accent: '#FFFFFF'
  };
};
