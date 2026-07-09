import {
  Controller, Post, Get, Query, BadRequestException, StreamableFile,
  UploadedFile, UseInterceptors, ParseFilePipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { CloudinaryService } from './cloudinary.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Upload')
@ApiBearerAuth()
@Controller('upload')
export class UploadController {
  constructor(private readonly cloudinary: CloudinaryService) {}

  private async handleUpload(
    file: Express.Multer.File,
    folder: Parameters<CloudinaryService['upload']>[1],
  ) {
    const url = await this.cloudinary.upload(file, folder);
    return { url };
  }

  @Public()
  @Get('pdf')
  @ApiOperation({ summary: 'Proxy a Cloudinary raw PDF for inline browser rendering' })
  async servePdf(@Query('url') url: string): Promise<StreamableFile> {
    if (!url || !url.startsWith('https://res.cloudinary.com/')) {
      throw new BadRequestException('Invalid URL');
    }
    let response: Awaited<ReturnType<typeof fetch>>;
    try {
      response = await fetch(url);
    } catch {
      throw new BadRequestException('Failed to fetch PDF');
    }
    if (!response.ok) throw new BadRequestException('Failed to fetch PDF');

    const buffer = await response.arrayBuffer();
    return new StreamableFile(Buffer.from(buffer), {
      type: 'application/pdf',
      disposition: 'inline',
    });
  }

  @Post('rc')
  @ApiOperation({ summary: 'Upload RC document (image or PDF)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  uploadRc(@UploadedFile(new ParseFilePipe()) file: Express.Multer.File) {
    return this.handleUpload(file, 'rc');
  }

  @Post('insurance')
  @ApiOperation({ summary: 'Upload insurance copy (image or PDF)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  uploadInsurance(@UploadedFile(new ParseFilePipe()) file: Express.Multer.File) {
    return this.handleUpload(file, 'insurance');
  }

  @Post('aadhaar')
  @ApiOperation({ summary: 'Upload Aadhaar card (image or PDF)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  uploadAadhaar(@UploadedFile(new ParseFilePipe()) file: Express.Multer.File) {
    return this.handleUpload(file, 'aadhaar');
  }

  @Post('pan')
  @ApiOperation({ summary: 'Upload PAN card (image or PDF)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  uploadPan(@UploadedFile(new ParseFilePipe()) file: Express.Multer.File) {
    return this.handleUpload(file, 'pan');
  }

  @Post('photo')
  @ApiOperation({ summary: 'Upload vehicle photo (image only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  uploadPhoto(@UploadedFile(new ParseFilePipe()) file: Express.Multer.File) {
    return this.handleUpload(file, 'photo');
  }

  @Post('od')
  @ApiOperation({ summary: 'Upload OD (Own Damage) policy document (image or PDF)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  uploadOd(@UploadedFile(new ParseFilePipe()) file: Express.Multer.File) {
    return this.handleUpload(file, 'od');
  }

  @Post('tp')
  @ApiOperation({ summary: 'Upload TP (Third Party) policy document (image or PDF)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  uploadTp(@UploadedFile(new ParseFilePipe()) file: Express.Multer.File) {
    return this.handleUpload(file, 'tp');
  }

  @Post('health-policy')
  @ApiOperation({ summary: 'Upload health insurance policy document (image or PDF)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  uploadHealthPolicy(@UploadedFile(new ParseFilePipe()) file: Express.Multer.File) {
    return this.handleUpload(file, 'health_policy');
  }

  @Post('health-id')
  @ApiOperation({ summary: 'Upload health insurance ID proof (image or PDF)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  uploadHealthId(@UploadedFile(new ParseFilePipe()) file: Express.Multer.File) {
    return this.handleUpload(file, 'health_id');
  }

  @Post('health-medical')
  @ApiOperation({ summary: 'Upload health insurance medical document (image or PDF)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  uploadHealthMedical(@UploadedFile(new ParseFilePipe()) file: Express.Multer.File) {
    return this.handleUpload(file, 'health_medical');
  }

  @Post('fire-policy')
  @ApiOperation({ summary: 'Upload fire insurance policy document (image or PDF)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  uploadFirePolicy(@UploadedFile(new ParseFilePipe()) file: Express.Multer.File) {
    return this.handleUpload(file, 'fire_policy');
  }

  @Post('labour-policy')
  @ApiOperation({ summary: 'Upload labour insurance policy document (image or PDF)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  uploadLabourPolicy(@UploadedFile(new ParseFilePipe()) file: Express.Multer.File) {
    return this.handleUpload(file, 'labour_policy');
  }
}
