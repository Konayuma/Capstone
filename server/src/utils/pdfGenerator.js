import PDFDocument from 'pdfkit';

export const pdfGenerator = {
  // 1. Build Requirements Report PDF
  buildRequirementsReport(res, project, requirements) {
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    // Header
    doc.fontSize(24).fillColor('#2d3748').text('Requirements Specification Report', { align: 'center' });
    doc.fontSize(12).fillColor('#718096').text(`Project: ${project.title}`, { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(2);

    // Divider
    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#e2e8f0').stroke();
    doc.moveDown(1.5);

    // Table of contents or intro
    doc.fontSize(14).fillColor('#1a202c').text('Project Description:', { underline: true });
    doc.fontSize(10).fillColor('#4a5568').text(project.description);
    doc.moveDown(2);

    // Requirements list
    doc.fontSize(16).fillColor('#2b6cb0').text('Requirements List', { underline: true });
    doc.moveDown(1);

    requirements.forEach((req, idx) => {
      doc.fontSize(12).fillColor('#2d3748').text(`${idx + 1}. [${req.type.toUpperCase()}] ${req.title}`);
      doc.fontSize(10).fillColor('#4a5568').text(`Priority: ${req.priority} | Status: ${req.status}`);
      doc.fontSize(10).fillColor('#718096').text(`Description: ${req.description}`);
      
      if (req.acceptanceCriteria && req.acceptanceCriteria.length > 0) {
        doc.moveDown(0.5);
        doc.fontSize(9).fillColor('#2d3748').text('Acceptance Criteria:', { indent: 15 });
        req.acceptanceCriteria.forEach(c => {
          doc.text(`- ${c.criteriaText}`, { indent: 30 });
        });
      }

      if (req.testCases && req.testCases.length > 0) {
        doc.moveDown(0.5);
        doc.fontSize(9).fillColor('#2d3748').text('Test Cases:', { indent: 15 });
        req.testCases.forEach(tc => {
          doc.text(`- Test: ${tc.testTitle} | Expected: ${tc.expectedResult}`, { indent: 30 });
        });
      }

      doc.moveDown(1.5);
    });

    doc.end();
  },

  // 2. Build Contribution Report PDF
  buildContributionReport(res, project, contributionData) {
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    // Header
    doc.fontSize(24).fillColor('#2d3748').text('Individual Contribution Audit Report', { align: 'center' });
    doc.fontSize(12).fillColor('#718096').text(`Project: ${project.title}`, { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(2);

    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#e2e8f0').stroke();
    doc.moveDown(1.5);

    // Contribution score breakdown
    doc.fontSize(16).fillColor('#2b6cb0').text('Member Contribution Summary', { underline: true });
    doc.moveDown(1);

    contributionData.members.forEach(member => {
      doc.fontSize(13).fillColor('#1a202c').text(`${member.name} (${member.role || 'Member'})`);
      doc.fontSize(11).fillColor('#4a5568').text(`Overall Score: ${member.finalScore}%`);
      doc.fontSize(10).fillColor('#718096').text(`- Completed Tasks: ${member.metrics.completedTasks}`);
      doc.fontSize(10).fillColor('#718096').text(`- Evidence Uploads: ${member.metrics.evidenceUploads}`);
      doc.fontSize(10).fillColor('#718096').text(`- Progress Logs: ${member.metrics.progressLogsSubmitted}`);
      doc.fontSize(10).fillColor('#718096').text(`- Average Peer Rating: ${member.metrics.averagePeerReviewRating}/5.0`);
      doc.moveDown(1.5);
    });

    // Imbalance anomalies / risk areas
    if (contributionData.warnings && contributionData.warnings.length > 0) {
      doc.moveDown(1);
      doc.fontSize(15).fillColor('#e53e3e').text('Anomalies / Imbalance Flags Detected:', { underline: true });
      doc.moveDown(0.5);

      contributionData.warnings.forEach(w => {
        doc.fontSize(10).fillColor('#e53e3e').text(`* WARNING [${w.type.toUpperCase()}] for ${w.userName}:`);
        doc.fontSize(9.5).fillColor('#4a5568').text(w.message, { indent: 15 });
        doc.moveDown(0.5);
      });
    }

    doc.end();
  },

  // 3. Build Viva Preparation Report PDF
  buildVivaReport(res, project, questions, score) {
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    // Header
    doc.fontSize(24).fillColor('#2d3748').text('Viva Preparation Audit Report', { align: 'center' });
    doc.fontSize(12).fillColor('#718096').text(`Project: ${project.title}`, { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(2);

    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#e2e8f0').stroke();
    doc.moveDown(1.5);

    // Viva readiness score overview
    doc.fontSize(16).fillColor('#2b6cb0').text('Viva Readiness Overview', { underline: true });
    doc.moveDown(1);
    
    if (score) {
      doc.fontSize(12).fillColor('#1a202c').text(`Overall Viva Readiness Score: ${score.overallScore}%`);
      doc.fontSize(10).fillColor('#4a5568').text(`- Requirements Quality Score: ${score.requirementsScore}%`);
      doc.fontSize(10).fillColor('#4a5568').text(`- Testing Evidence Score: ${score.testingScore}%`);
      doc.fontSize(10).fillColor('#4a5568').text(`- Documentation Completeness Score: ${score.documentationScore}%`);
      doc.fontSize(10).fillColor('#4a5568').text(`- Viva Practice Score: ${score.vivaScore}%`);
      doc.fontSize(10).fillColor('#4a5568').text(`- Contribution Balance Score: ${score.contributionScore}%`);
      doc.moveDown(1.5);
    }

    // Viva Questions
    doc.fontSize(16).fillColor('#2b6cb0').text('Viva Practice Questions & Answer Guides', { underline: true });
    doc.moveDown(1);

    questions.forEach((q, idx) => {
      const difficulty = q.difficulty === 'brutal' ? 'challenge' : q.difficulty;
      doc.fontSize(11).fillColor('#2d3748').text(`Q${idx + 1}. [Category: ${q.category.toUpperCase()}] [Difficulty: ${difficulty.toUpperCase()}]`);
      doc.fontSize(10).fillColor('#1a202c').text(`Question: "${q.questionText}"`, { indent: 10 });
      doc.moveDown(0.5);
      doc.fontSize(9.5).fillColor('#4a5568').text(`Answer guide outline:`, { indent: 10, underline: true });
      doc.fontSize(9).fillColor('#718096').text(q.suggestedAnswer || 'Outline not provided.', { indent: 20 });
      doc.moveDown(1.5);
    });

    doc.end();
  },

  // 4. Build Full Audit Report
  buildFullProjectReport(res, project, requirements, contributionData, questions, score) {
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    // Title Page
    doc.fontSize(28).fillColor('#2b6cb0').text('Capstone Studio', { align: 'center', stroke: true });
    doc.fontSize(20).fillColor('#2d3748').text('Full Project Quality & Viva Readiness Report', { align: 'center' });
    doc.moveDown(2);
    
    doc.fontSize(14).fillColor('#4a5568').text(`Project Title: ${project.title}`, { align: 'center' });
    doc.fontSize(12).fillColor('#718096').text(`Category: ${project.category || 'N/A'} | Academic Year: ${project.academicYear || 'N/A'}`, { align: 'center' });
    doc.moveDown(4);

    if (score) {
      doc.fontSize(16).fillColor('#1a202c').text(`Viva Readiness Score: ${score.overallScore}%`, { align: 'center', underline: true });
      doc.moveDown(0.5);
      let level = 'High Risk';
      if (score.overallScore >= 80) level = 'Strong Viva Readiness';
      else if (score.overallScore >= 60) level = 'Moderate Readiness';
      else if (score.overallScore >= 40) level = 'Weak Readiness';
      doc.fontSize(12).fillColor('#e53e3e').text(`Status: ${level}`, { align: 'center' });
    }

    doc.addPage();

    // Section 1: Requirements trace
    doc.fontSize(16).fillColor('#2b6cb0').text('1. Requirements & Traceability Overview', { underline: true });
    doc.moveDown(1);
    requirements.forEach((r, idx) => {
      doc.fontSize(11).fillColor('#1a202c').text(`${idx + 1}. [${r.type.toUpperCase()}] ${r.title} (${r.status})`);
      doc.fontSize(9.5).fillColor('#4a5568').text(r.description, { indent: 10 });
      doc.moveDown(0.5);
    });

    doc.addPage();

    // Section 2: Contributions trace
    doc.fontSize(16).fillColor('#2b6cb0').text('2. Member Contributions & Team Balance', { underline: true });
    doc.moveDown(1);
    contributionData.members.forEach(member => {
      doc.fontSize(12).fillColor('#1a202c').text(`${member.name} (${member.role || 'Member'}) - Rating ${member.finalScore}%`);
      doc.fontSize(9.5).fillColor('#4a5568').text(`Completed Tasks: ${member.metrics.completedTasks} | Logs: ${member.metrics.progressLogsSubmitted} | Peer Rating: ${member.metrics.averagePeerReviewRating}/5.0`, { indent: 10 });
      doc.moveDown(0.8);
    });

    doc.end();
  },
};
