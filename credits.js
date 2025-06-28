const config = require('./public/js/config.js');
const scores = config.default.scores;

scores.forEach((score) => {
  if (!score.active) return;
  let title = score.title;
  if (score.alt !== '') title = `${score.alt} (${score.title})`;
  console.log(`- [${title}](${score.url}) by ${score.creator}, ${score.date}`);
});
