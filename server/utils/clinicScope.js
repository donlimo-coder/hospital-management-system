// Adds a clinic filter to a query object, unless req.clinicId is null
// (which means a super-admin viewing across all clinics).
function withClinicScope(filter = {}, req) {
  if (req.clinicId === null || req.clinicId === undefined) {
    return filter;
  }
  return { ...filter, clinic: req.clinicId };
}

module.exports = { withClinicScope };