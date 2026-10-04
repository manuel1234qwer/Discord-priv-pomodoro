const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'data');
const file = path.join(dir, 'db.json');

let db = { users: {} };

if (fs.existsSync(file)) {
  try {
    db = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!db.users) db.users = {};
  } catch {
    db = { users: {} };
  }
}

const save = () => {
  fs.mkdirSync(dir, { recursive: true });
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, file);
};

const getUser = id => {
  if (!db.users[id]) {
    db.users[id] = {
      contadores: { notas: 1, tarjetas: 1, tareas: 1 },
      notas: [],
      tarjetas: [],
      tareas: []
    };
  }
  return db.users[id];
};

const nextId = (user, tipo) => user.contadores[tipo]++;

module.exports = { getUser, nextId, save };
