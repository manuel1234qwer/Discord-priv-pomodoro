const cut = (text, max = 1900) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

module.exports = { cut };
