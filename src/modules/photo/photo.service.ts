import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { promises as fs } from 'fs';
import * as sharp from 'sharp';
import { exiftool } from 'exiftool-vendored';
import * as path from 'path';
import { PhotoEntity } from './entities/photo.entity';

@Injectable()
export class PhotoService {
  private readonly uploadBasePath = './uploads';
  constructor(
    @InjectRepository(PhotoEntity)
    private readonly photoRepo: Repository<PhotoEntity>,
  ) {}

  async savePhoto(filename: string): Promise<string> {
    const filePath = path.join(process.cwd(), this.uploadBasePath, filename);
    const originalFile = await this.getLocalFile(filePath);

    const previewBuffer = await sharp(originalFile as Buffer)
      .resize(200, 200)
      .toBuffer();

    const previewPath = path.join(
      process.cwd(),
      `${this.uploadBasePath}/previews`,
      filename,
    );

    await fs.mkdir(path.dirname(previewPath), { recursive: true });
    await fs.writeFile(previewPath, previewBuffer);
    const exifData = await this.extractExif(filePath);
    await this.photoRepo.save({
      originalUrl: filePath,
      previewUrl: previewPath,
      exifData: exifData,
    });

    return `${this.uploadBasePath}/${filename}`;
  }

  async getLocalFile(filePath: string): Promise<Buffer> {
    try {
      const fileBuffer = await fs.readFile(filePath);
      return fileBuffer;
    } catch (error) {
      console.error(`Error reading file: ${filePath}`, error);
      throw new Error(`File not found: ${filePath}`);
    }
  }

  async extractExif(filePath: string): Promise<Record<string, any> | null> {
    try {
      const metadata = await exiftool.read(filePath);
      const exifData = {
        Make: metadata.Make, // Производитель камеры
        Model: metadata.Model, // Модель камеры
        DateTimeOriginal: metadata.DateTimeOriginal, // Исходное время съемки
        GPSLatitude: metadata.GPSLatitude, // Широта GPS
        GPSLongitude: metadata.GPSLongitude, // Долгота GPS
      };
      return Object.values(exifData).every((value) => value === undefined)
        ? null
        : exifData;
    } catch (error) {
      console.error('Error extracting EXIF data:', error);
      return null;
    }
  }
}
