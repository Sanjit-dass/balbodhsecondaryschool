function getPagination(query) {
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const limit = Math.min(Math.max(1, parseInt(query.limit || '20', 10)), 200);
  return { page, limit, skip: (page - 1) * limit };
}

module.exports = { getPagination };
