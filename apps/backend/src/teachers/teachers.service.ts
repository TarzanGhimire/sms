import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeacherDto, UpdateTeacherDto } from './dto/teacher.dto';

@Injectable()
export class TeachersService {
  constructor(private prisma: PrismaService) {}

  async findAll(search?: string) {
    return this.prisma.teacher.findMany({
      where: search
        ? {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { user: { email: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { email: true, isActive: true } },
        _count: { select: { sections: true, classSubjects: true } },
      },
    });
  }

  async findOne(id: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
      include: {
        user: { select: { email: true, isActive: true, lastLogin: true } },
        sections: { include: { class: true } },
        classSubjects: { include: { class: true, subject: true } },
      },
    });
    if (!teacher) throw new NotFoundException('Teacher not found');
    return teacher;
  }

  async create(dto: CreateTeacherDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already in use');

    const hashed = await bcrypt.hash(dto.password, 12);

    return this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashed,
        role: Role.TEACHER,
        teacher: {
          create: {
            firstName: dto.firstName,
            lastName: dto.lastName,
            phone: dto.phone,
            address: dto.address,
            qualification: dto.qualification,
            photoUrl: dto.photoUrl,
            joinDate: dto.joinDate ? new Date(dto.joinDate) : new Date(),
          },
        },
      },
      include: { teacher: true },
    });
  }

  async update(id: string, dto: UpdateTeacherDto) {
    const teacher = await this.findOne(id);
    const { isActive, ...teacherData } = dto;

    if (isActive !== undefined) {
      await this.prisma.user.update({
        where: { id: teacher.userId },
        data: { isActive },
      });
    }

    return this.prisma.teacher.update({
      where: { id },
      data: teacherData,
      include: { user: { select: { email: true, isActive: true } } },
    });
  }

  async remove(id: string) {
    const teacher = await this.findOne(id);
    return this.prisma.user.update({
      where: { id: teacher.userId },
      data: { isActive: false },
    });
  }
}
