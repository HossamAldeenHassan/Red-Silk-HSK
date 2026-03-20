const fs = require('fs');
const path = require('path');

const dataJsPath = path.join('e:\\HSK1_Master-main22', 'data', 'data.js');
let dataContent = fs.readFileSync(dataJsPath, 'utf-8');

// Quick and dirty eval to extract top level consts W, TOPICS, SENTS, STORIES, pinyinExamples
// Since it's a browser script with consts, we can replace 'const ' with 'global.' or just evaluate it.
const script = `
  const window = {};
  let W, TOPICS, SENTS, STORIES, pinyinExamples;
  ` + 
  dataContent.replace(/(const|let)\s+(W|TOPICS|SENTS|STORIES|pinyinExamples)\s*=/g, '$2 =') + 
  `
  module.exports = { W, TOPICS, SENTS, STORIES, pinyinExamples };
`;

fs.writeFileSync('e:\\HSK1_Master-main22\\tmp\\extract.js', script);

try {
  const extracted = require('e:\\HSK1_Master-main22\\tmp\\extract.js');
  fs.writeFileSync('e:\\HSK1_Master-main22\\data\\hsk1_vocab.json', JSON.stringify({ W: extracted.W }, null, 2));
  fs.writeFileSync('e:\\HSK1_Master-main22\\data\\hsk1_sentences.json', JSON.stringify({ SENTS: extracted.SENTS }, null, 2));
  fs.writeFileSync('e:\\HSK1_Master-main22\\data\\hsk1_lessons.json', JSON.stringify({ TOPICS: extracted.TOPICS, STORIES: extracted.STORIES, pinyinExamples: extracted.pinyinExamples }, null, 2));
  console.log("Success");
} catch (e) {
  console.error("Error evaluating data.js", e);
}
