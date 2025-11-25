import { exec } from 'child_process';
import { promisify } from 'util';
import pool from './db.js';

const execAsync = promisify(exec);

const PROJECT_ID = 'easydb-477708';
const REGION = 'asia-south1';
const SERVICE_URL = 'https://database-querying-backend-272310002087.asia-south1.run.app';

async function createSchedulerJobs() {
  try {
    console.log('Checking for scheduled queries without Cloud Scheduler jobs...');
    
    // Get pending scheduled queries
    const result = await pool.query(`
      SELECT * FROM scheduled_queries 
      WHERE status = 'pending' 
      AND scheduled_at > NOW()
      ORDER BY scheduled_at
    `);
    
    if (result.rows.length === 0) {
      console.log('No pending scheduled queries found.');
      return;
    }
    
    console.log(`Found ${result.rows.length} scheduled queries to process.`);
    
    for (const query of result.rows) {
      try {
        const jobName = query.scheduler_job_name;
        const scheduledTime = new Date(query.scheduled_at);
        
        // Convert to cron expression (one-time job)
        const minutes = scheduledTime.getUTCMinutes();
        const hours = scheduledTime.getUTCHours();
        const dayOfMonth = scheduledTime.getUTCDate();
        const month = scheduledTime.getUTCMonth() + 1;
        const year = scheduledTime.getUTCFullYear();
        
        // Check if job already exists
        let jobExists = false;
        try {
          await execAsync(`gcloud scheduler jobs describe ${jobName} --location=${REGION} --project=${PROJECT_ID}`);
          jobExists = true;
          console.log(`Job ${jobName} already exists, skipping...`);
          continue;
        } catch (err) {
          // Job doesn't exist, we'll create it
        }
        
        // Create Cloud Scheduler job
        const targetUri = `${SERVICE_URL}/api/execute-scheduled/${jobName}`;
        
        // Create a cron expression for the specific time (runs once)
        const cronExpression = `${minutes} ${hours} ${dayOfMonth} ${month} *`;
        
        const command = `gcloud scheduler jobs create http ${jobName} \
          --location=${REGION} \
          --schedule="${cronExpression}" \
          --time-zone="UTC" \
          --uri="${targetUri}" \
          --http-method=POST \
          --project=${PROJECT_ID} \
          --attempt-deadline=300s`;
        
        console.log(`Creating Cloud Scheduler job: ${jobName}`);
        console.log(`Scheduled for: ${scheduledTime.toISOString()}`);
        console.log(`Cron expression: ${cronExpression}`);
        
        await execAsync(command);
        
        console.log(`✓ Cloud Scheduler job created: ${jobName}`);
        
      } catch (error) {
        console.error(`Error creating job for ${query.scheduler_job_name}:`, error.message);
      }
    }
    
    console.log('Finished processing scheduled queries.');
    
  } catch (error) {
    console.error('Error in createSchedulerJobs:', error);
  } finally {
    process.exit(0);
  }
}

createSchedulerJobs();
