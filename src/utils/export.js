function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function csvCell(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

export function exportLeaderboardJSON(entries) {
  downloadFile(
    'event-quiz-leaderboard.json',
    JSON.stringify(entries, null, 2),
    'application/json',
  );
}

export function exportLeaderboardCSV(entries) {
  const headers = ['Rank', 'Participant ID', 'Name', 'Score', 'Percentage', 'Date & Time'];
  const rows = entries.map((entry, index) => [
    index + 1,
    entry.participantId,
    entry.name,
    `${entry.score}/${entry.total}`,
    `${entry.percentage}%`,
    new Date(entry.completedAt).toLocaleString(),
  ]);
  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');

  downloadFile('event-quiz-leaderboard.csv', csv, 'text/csv');
}
