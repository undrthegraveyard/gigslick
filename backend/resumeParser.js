import natural from 'natural';

const tokenizer = new natural.WordTokenizer();

export function analyzeResumeStructure(text) {
  const lines = text.split('\n');
  const structure = {
    contactInfo: [],
    summary: '',
    experience: [],
    education: [],
    skills: []
  };

  let currentSection = 'contactInfo';

  lines.forEach(line => {
    line = line.trim();
    if (!line) return;

    const tokens = tokenizer.tokenize(line.toLowerCase());

    if (tokens.includes('summary') || tokens.includes('objective')) {
      currentSection = 'summary';
    } else if (tokens.includes('experience') || tokens.includes('work')) {
      currentSection = 'experience';
    } else if (tokens.includes('education') || tokens.includes('qualifications')) {
      currentSection = 'education';
    } else if (tokens.includes('skills') || tokens.includes('abilities')) {
      currentSection = 'skills';
    } else {
      if (currentSection === 'contactInfo' && structure.contactInfo.length < 4) {
        structure.contactInfo.push(line);
      } else if (currentSection === 'summary') {
        structure.summary += line + ' ';
      } else if (currentSection === 'experience' || currentSection === 'education') {
        structure[currentSection].push(line);
      } else if (currentSection === 'skills') {
        structure.skills = structure.skills.concat(line.split(',').map(skill => skill.trim()));
      }
    }
  });

  return structure;
}
