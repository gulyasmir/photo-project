import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { createWriteStream, promises as fs } from 'fs';
import * as sharp from 'sharp';
import { exiftool } from 'exiftool-vendored';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { PhotoEntity } from './entities/photo.entity';
import { PhotoQueueService } from './photo-queue.service';
@Injectable()
export class PhotoService {
  private readonly uploadBasePath = './uploads';
  constructor(
    
    private readonly photoQueueService: PhotoQueueService, 
    @InjectRepository(PhotoEntity)
    private readonly photoRepo: Repository<PhotoEntity>,
  ) {}

  generateUniqueFilename(originalname: string): string {
    const ext = path.extname(originalname).slice(1);
    const uniqueId = uuidv4();
    return `${uniqueId}.${ext}`;
  }

  async saveFile(fileName: string, folder,  buffer: Buffer): Promise<void> {
    const filePath = path.join(process.cwd(), folder, fileName);
    await new Promise((resolve, reject) => {
      const stream = createWriteStream(filePath);
      stream.write(buffer);
      stream.end();
      stream.on('finish', () => resolve(filePath));
      stream.on('error', (err) => reject(err));
    });
  }

  async savePhoto(file: Express.Multer.File): Promise<string> {
    try {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
        return 'Только изображения форматов JPG, JPEG, PNG или GIF';
      }
      const filename = this.generateUniqueFilename(file.originalname);
      await this.saveFile(filename, 'uploads', file.buffer);

      await this.photoQueueService.addTask(filename, 'generate-preview');
      await this.photoQueueService.addTask(filename, 'extract-exif');

      return `${this.uploadBasePath}/${filename}`;
    } catch (error) {
      console.error(`Failed to process photo ID: ${error.message}`, error);
    }
  }

  async generatePreview(filename: string): Promise<void> {
    const filePath = path.join(process.cwd(), this.uploadBasePath, filename);
    const fileBuffer = await fs.readFile(filePath);
    const previewBuffer = await sharp(fileBuffer).resize(200, 200).toBuffer();
    const previewPath = path.join(
      process.cwd(),
      this.uploadBasePath,
      'previews',
      filename,
    );
    await fs.mkdir(path.dirname(previewPath), { recursive: true });
    await this.saveFile(filename, 'uploads/previews', previewBuffer);
  }

  async extractExifAndSave(filename: string): Promise<void> {
    const metadata = await exiftool.read(filename);
    const exifData = {
      Make: metadata.Make, // Производитель камеры
      Model: metadata.Model, // Модель камеры
      DateTimeOriginal: metadata.DateTimeOriginal, // Исходное время съемки
      GPSLatitude: metadata.GPSLatitude, // Широта GPS
      GPSLongitude: metadata.GPSLongitude, // Долгота GPS
    };
    const exifDataForPostgres = Object.values(exifData).every(
      (value) => value === undefined,
    )
      ? null
      : exifData;

    const photoRecord = new PhotoEntity();
    photoRecord.originalUrl = `/${this.uploadBasePath}/${filename}`;
    photoRecord.previewUrl = `/${this.uploadBasePath}/previews/${filename}`;
    photoRecord.exifData = exifDataForPostgres;

    await this.photoRepo.save(photoRecord);
  }
}
