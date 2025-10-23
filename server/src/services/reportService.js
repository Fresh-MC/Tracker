import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleAssistantQuery } from './aiService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate a comprehensive project report PDF
 */
const generateProjectReport = async (userId, projectId = null) => {
  try {
    // Get AI insights first
    const aiData = await handleAssistantQuery('Generate a comprehensive weekly project summary', userId);
    
    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });
    
    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `project-report-${timestamp}-${userId}.pdf`;
    const filepath = path.join(__dirname, '../../reports', filename);
    
    // Ensure reports directory exists
    const reportsDir = path.join(__dirname, '../../reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    // Pipe PDF to file
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);
    
    // --- HEADER ---
    doc.fontSize(24)
       .fillColor('#1e40af')
       .text('SH19 Project Report', { align: 'center' })
       .moveDown(0.5);
    
    doc.fontSize(12)
       .fillColor('#6b7280')
       .text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' })
       .moveDown(2);
    
    // --- PROJECT HEALTH SECTION ---
    doc.fontSize(18)
       .fillColor('#000000')
       .text('📊 Project Health Overview')
       .moveDown(0.5);
    
    // Health score with color coding
    const healthScore = aiData.projectData.healthScore;
    const healthColor = healthScore >= 80 ? '#10b981' : healthScore >= 60 ? '#f59e0b' : '#ef4444';
    
    doc.fontSize(14)
       .fillColor('#374151')
       .text(`Overall Health Score: `, { continued: true })
       .fillColor(healthColor)
       .fontSize(18)
       .text(`${healthScore}/100`, { continued: false })
       .moveDown(0.5);
    
    doc.fontSize(12)
       .fillColor('#374151')
       .text(`Total Modules: ${aiData.projectData.totalModules}`)
       .text(`Completed: ${aiData.projectData.completedModules}`)
       .text(`Delayed: ${aiData.projectData.delayedModules}`)
       .moveDown(1.5);
    
    // --- AI INSIGHTS SECTION ---
    doc.fontSize(18)
       .fillColor('#000000')
       .text('🧠 AI-Generated Insights')
       .moveDown(0.5);
    
    doc.fontSize(11)
       .fillColor('#374151')
       .text(aiData.insights, {
         align: 'justify',
         lineGap: 4
       })
       .moveDown(1.5);
    
    // --- BLOCKERS SECTION ---
    if (aiData.blockers && aiData.blockers.length > 0) {
      doc.fontSize(18)
         .fillColor('#000000')
         .text('🚨 Critical Blockers')
         .moveDown(0.5);
      
      aiData.blockers.forEach((blocker, index) => {
        doc.fontSize(12)
           .fillColor('#ef4444')
           .text(`${index + 1}. ${blocker.title}`, { continued: false })
           .fontSize(10)
           .fillColor('#6b7280')
           .text(`   ${blocker.reason}`)
           .text(`   Priority: ${blocker.priority.toUpperCase()}`)
           .moveDown(0.3);
      });
      
      doc.moveDown(1);
    }
    
    // --- RECOMMENDATIONS SECTION ---
    if (aiData.recommendations && aiData.recommendations.length > 0) {
      doc.fontSize(18)
         .fillColor('#000000')
         .text('💡 Recommendations')
         .moveDown(0.5);
      
      aiData.recommendations.forEach((rec, index) => {
        doc.fontSize(11)
           .fillColor('#374151')
           .text(`${index + 1}. ${rec}`)
           .moveDown(0.3);
      });
      
      doc.moveDown(1);
    }
    
    // --- TEAM PERFORMANCE SECTION ---
    if (aiData.teamPerformance && aiData.teamPerformance.length > 0) {
      doc.addPage();
      
      doc.fontSize(18)
         .fillColor('#000000')
         .text('👥 Team Performance Summary')
         .moveDown(1);
      
      // Table header
      const tableTop = doc.y;
      const colWidths = { name: 150, assigned: 80, completed: 80, rate: 80 };
      const startX = 50;
      
      doc.fontSize(11)
         .fillColor('#1e40af')
         .text('Team Member', startX, tableTop, { width: colWidths.name, continued: false })
         .text('Assigned', startX + colWidths.name, tableTop, { width: colWidths.assigned })
         .text('Completed', startX + colWidths.name + colWidths.assigned, tableTop, { width: colWidths.completed })
         .text('Rate', startX + colWidths.name + colWidths.assigned + colWidths.completed, tableTop, { width: colWidths.rate });
      
      doc.moveTo(startX, doc.y + 5)
         .lineTo(startX + colWidths.name + colWidths.assigned + colWidths.completed + colWidths.rate, doc.y + 5)
         .stroke();
      
      doc.moveDown(0.5);
      
      // Table rows
      aiData.teamPerformance.forEach((member) => {
        const rowY = doc.y;
        
        doc.fontSize(10)
           .fillColor('#374151')
           .text(member.name, startX, rowY, { width: colWidths.name })
           .text(member.totalAssigned.toString(), startX + colWidths.name, rowY, { width: colWidths.assigned })
           .text(member.completed.toString(), startX + colWidths.name + colWidths.assigned, rowY, { width: colWidths.completed })
           .text(`${member.completionRate}%`, startX + colWidths.name + colWidths.assigned + colWidths.completed, rowY, { width: colWidths.rate });
        
        doc.moveDown(0.5);
      });
    }
    
    // --- FOOTER ---
    doc.fontSize(8)
       .fillColor('#9ca3af')
       .text(
         'This report was generated by SH19 Digital Project Management Tracker AI Assistant',
         50,
         doc.page.height - 30,
         { align: 'center' }
       );
    
    // Finalize PDF
    doc.end();
    
    // Wait for file to be written
    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });
    
    console.log(`✅ PDF Report generated: ${filename}`);
    
    return {
      success: true,
      filename,
      filepath,
      timestamp: new Date().toISOString(),
      healthScore: aiData.projectData.healthScore
    };
    
  } catch (error) {
    console.error('❌ Report Generation Error:', error);
    throw error;
  }
};

/**
 * Generate a quick summary report (lighter version)
 */
const generateQuickSummary = async (userId) => {
  try {
    const aiData = await handleAssistantQuery('Quick project summary', userId);
    
    return {
      success: true,
      summary: {
        healthScore: aiData.projectData.healthScore,
        totalModules: aiData.projectData.totalModules,
        completedModules: aiData.projectData.completedModules,
        delayedModules: aiData.projectData.delayedModules,
        insights: aiData.insights,
        topBlockers: aiData.blockers.slice(0, 3),
        recommendations: aiData.recommendations
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Quick Summary Error:', error);
    throw error;
  }
};

/**
 * Clean up old reports (delete reports older than 7 days)
 */
const cleanupOldReports = () => {
  try {
    const reportsDir = path.join(__dirname, '../../reports');
    if (!fs.existsSync(reportsDir)) return;
    
    const files = fs.readdirSync(reportsDir);
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    
    files.forEach(file => {
      const filepath = path.join(reportsDir, file);
      const stats = fs.statSync(filepath);
      const age = now - stats.mtime.getTime();
      
      if (age > maxAge) {
        fs.unlinkSync(filepath);
        console.log(`🗑️  Deleted old report: ${file}`);
      }
    });
  } catch (error) {
    console.error('❌ Cleanup Error:', error);
  }
};

export {
  generateProjectReport,
  generateQuickSummary,
  cleanupOldReports
};
