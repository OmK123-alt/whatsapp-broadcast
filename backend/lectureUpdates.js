const { v4: uuidv4 } = require("uuid");

const lectureUpdates = new Map();

function addLectureUpdate(payload) {
  const update = {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    ...payload
  };
  lectureUpdates.set(update.id, update);
  return update;
}

function getAllLectureUpdates() {
  return Array.from(lectureUpdates.values()).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
}

function deleteLectureUpdate(id) {
  lectureUpdates.delete(id);
}

module.exports = {
  addLectureUpdate,
  getAllLectureUpdates,
  deleteLectureUpdate
};
