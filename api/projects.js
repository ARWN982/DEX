const projectsManifest = require('./projects-manifest.json');

module.exports = (req, res) => {
  res.json(projectsManifest);
};
