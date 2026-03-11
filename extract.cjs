const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const fs = require('fs');
const path = require('path');

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const videoPath = path.join(__dirname, '..', 'neon_card_lp_test.mp4');
const outputDir = path.join(__dirname, 'public', 'frames');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('Starting frame extraction for GSAP...');

ffmpeg(videoPath)
  .outputOptions([
    '-vf', 'fps=30',
    '-vsync', '0',
    '-qscale:v', '2' // High quality jpeg
  ])
  .on('start', function (commandLine) {
    console.log('Spawned Ffmpeg with command: ' + commandLine);
  })
  .on('progress', function (progress) {
    console.log('Processing: ' + progress.percent + '% done');
  })
  .on('end', () => {
    console.log('\nFrame extraction completed successfully.');
  })
  .on('error', (err) => {
    console.error('Error extracting frames:', err);
  })
  .save(path.join(outputDir, 'frame_%04d.jpg'));
