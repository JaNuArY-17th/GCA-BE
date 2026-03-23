import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import readXlsxFile from 'read-excel-file/node';
import { CreateVoterDto } from './dtos/create-voter.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { UsersService } from './users.service';

@Controller('users')
// @UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':mssv')
  getByMssv(@Param('mssv') mssv: string) {
    return this.usersService.findByMssv(mssv);
  }

  @Post()
  createVoter(@Body() dto: CreateVoterDto) {
    return this.usersService.createVoter(dto);
  }

  @Post('batch')
  @UseInterceptors(FileInterceptor('file'))
  async createBatch(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    const sheetRows = await readXlsxFile(file.buffer);

    if (sheetRows.length === 0) {
      return this.usersService.createBatch([]);
    }

    const [headerRow, ...dataRows] = sheetRows;
    const headers = headerRow.map((value) =>
      value === null || value === undefined ? '' : String(value).trim(),
    );

    const rows = dataRows.map<Record<string, unknown>>((values) => {
      const record: Record<string, unknown> = {};

      values.forEach((value, index) => {
        const key = headers[index] || String(index);
        record[key] = value;
      });

      return record;
    });

    const normalize = (value: unknown) => {
      if (value === null || value === undefined) return '';
      if (typeof value === 'string') return value.trim();
      return String(value).trim();
    };

    const voters = rows
      .map((row) => {
        const keys = Object.keys(row);

        // Excel expected order: STT, MSSV, Họ và Tên, Email FPT
        const mssv = normalize(
          row['MSSV'] ?? row['mssv'] ?? row['Mã SV'] ?? row['mã sv'] ?? row['id'] ??
            (keys[1] ? row[keys[1]] : ''),
        );

        const fullname = normalize(
          row['Họ và Tên'] ?? row['Họ tên'] ?? row['họ và tên'] ?? row['họ tên'] ?? row['FullName'] ??
            row['fullname'] ?? row['name'] ?? row['Name'] ??
            (keys[2] ? row[keys[2]] : ''),
        );

        const email = normalize(
          row['Email FPT'] ?? row['email fpt'] ?? row['Email'] ?? row['email'] ??
            row['Mail'] ?? row['mail'] ??
            (keys[3] ? row[keys[3]] : ''),
        );

        return { fullname, mssv, email };
      })
      .filter((v) => v.fullname && v.mssv && v.email);

    return this.usersService.createBatch(voters);
  }
}
