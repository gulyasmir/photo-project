import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PhotoModule } from './modules/photo/photo.module';


@Module({
  imports: [PhotoModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
