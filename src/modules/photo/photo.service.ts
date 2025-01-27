import { Injectable } from '@nestjs/common';

@Injectable()
export class PhotoService {
  private readonly uploadBasePath = '/uploads'; // Путь, где хранятся файлы

  // Метод для сохранения данных о фото
  async savePhoto(filename: string): Promise<string> {
    // Здесь можно сохранить информацию в базу данных (например, имя файла, URL и т. д.)
    // В данном случае возвращаем URL для файла
    return `${this.uploadBasePath}/${filename}`;
  }
}
