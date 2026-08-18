function normalizeNewsDate(value) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  return trimmed;
}

function toggleSavedNewsIds(currentIds, newsId) {
  const safeCurrent = Array.isArray(currentIds) ? currentIds.map((id) => String(id)) : [];
  const targetId = String(newsId);
  const filtered = safeCurrent.filter((id) => id !== targetId);

  if (filtered.length === safeCurrent.length) {
    filtered.push(targetId);
  }

  return filtered;
}

module.exports = {
  normalizeNewsDate,
  toggleSavedNewsIds,
};
