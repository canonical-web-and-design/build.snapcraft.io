/* eslint no-console: "off" */
require('babel-register'); // to allow requiring ES modules

const fs = require('fs');
const path = require('path');
const badge = require('gh-badges');

const UserFacingState = require('../src/common/helpers/snap-builds').UserFacingState;
const colourVariables = require('../src/common/style/variables');

// Map between status colours and CSS variables.
// This mapping is originally in CSS for BuildStatus component:
// src/common/components/build-status/buildStatus.css
const colours = {
  'blue': colourVariables.information,
  'green': colourVariables.success,
  'yellow': colourVariables.warning,
  'red': colourVariables.error,
  'grey': colourVariables['dark-grey']
};

const BADGES_PATH = path.join(__dirname, '../src/common/images/badges');

badge.loadFont(path.join(__dirname, 'Verdana.ttf'), function(err) {
  if (err) {
    console.log('Cannot find `scripts/Verdana.ttf` font file. For proper width measurements font file is required.');
    console.log('Please copy Verdana.ttf from your system fonts to project `scripts` folder.');
    return;
  }

  for (const key in UserFacingState) {
    const status = UserFacingState[key];

    badge({
      text: ['snap', status.statusMessage.toLowerCase()],
      colorB: colours[status.colour],
      template: 'flat'
    },
    function(svg, err) {
      if (err) {
        console.log(`Failed generating badge for status ${key}:`, err.message);
        return;
      }

      const fileName = path.join(BADGES_PATH, `${key.toLowerCase()}.svg`);
      fs.writeFile(fileName, svg, (err) => {
        if (err) {
          console.log(`Failed writing badge for status ${key}:`, err.message);
          return;
        }
        console.log(`Badge for status ${key} generated:`, fileName);
      });
    });
  }

});
