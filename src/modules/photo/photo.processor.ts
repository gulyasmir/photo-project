import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, QueueEvents } from 'bullmq';
import { PhotoService } from './photo.service';

@Processor('photo-processing')
export class PhotoProcessor extends WorkerHost {
  private queueEvents: QueueEvents;

  constructor(private readonly photoService: PhotoService) {
    super();
    this.queueEvents = new QueueEvents('photo-processing');
    this.queueEvents.on('error', this.handleError.bind(this));
    this.queueEvents.on('stalled', this.handleStalled.bind(this));
    this.queueEvents.on('failed', this.handleFailed.bind(this));
  }

  private handleError(error: Error) {
    console.error('Redis connection error:', error.message);
  }

  private handleStalled(jobId: string) {
    console.warn(`Stalled job detected: ${jobId}`);
  }

  private handleFailed(args: { jobId: string; failedReason: string }) {
    console.error(`Job ${args.jobId} failed: ${args.failedReason}`);
  }

  async process(job: Job<any>): Promise<void> {
    const { filename, task } = job.data;

    if (task === 'generate-preview') {
      await this.photoService.generatePreview(filename);
    } else if (task === 'extract-exif') {
      await this.photoService.extractExifAndSave(filename);
    }
  }
}
